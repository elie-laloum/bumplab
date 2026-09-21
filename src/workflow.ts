import { promises as fs } from 'node:fs';
import path from 'node:path';
import { WorkflowError, errorMessage } from './domain/errors.ts';
import { validateConfig } from './domain/config.ts';
import { isWithin } from './domain/paths.ts';
import type { ExecuteOptions, WorkflowReport, Manifest } from './domain/types.ts';
import { git } from './infrastructure/git.ts';
import { command, resultOK } from './infrastructure/process.ts';
import { contextFiles } from './workspace/context.ts';
import { patchState } from './workspace/patch.ts';
import { applyEdits, parseResponse } from './workspace/edits.ts';
import { checkUpgrade } from './migration/metadata.ts';
export async function execute({
  repo,
  out,
  config: rawConfig,
  kind = 'bumplab',
  packageName = '',
  target = '',
  migrationNotes = '',
}: ExecuteOptions): Promise<WorkflowReport> {
  const config = validateConfig(rawConfig, kind);
  if (kind !== 'bumplab') throw new WorkflowError('Unsupported workflow kind');
  let initialManifest: Manifest | undefined;
  repo = await fs.realpath(repo);
  out = path.resolve(out);
  if (isWithin(repo, out) || isWithin(out, repo))
    throw new WorkflowError('Output must be a new directory outside the repository');
  if ((await git(repo, 'status', '--porcelain')).trim())
    throw new WorkflowError('Repository must be clean; commit or stash changes first');
  if (
    (await git(repo, 'rev-parse', '--show-toplevel')).trim().replaceAll('\\', '/') !==
    repo.replaceAll('\\', '/')
  )
    throw new WorkflowError('Use the Git repository root');
  if (
    kind === 'bumplab' &&
    (!/^(@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/.test(packageName ?? '') ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(target ?? '') ||
      !migrationNotes.trim())
  )
    throw new WorkflowError(
      'Supply a package name, exact semantic version and reviewed migration notes',
    );
  await fs.mkdir(out, { recursive: false });
  const worktree = path.join(out, 'worktree');
  const report: WorkflowReport = {
    schemaVersion: 1,
    workflow: kind,
    startedAt: new Date().toISOString(),
    base: (await git(repo, 'rev-parse', 'HEAD')).trim(),
    status: 'running',
    checks: [],
    attempts: [],
  };
  const save = async () =>
    fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  let allowed;
  try {
    await git(repo, 'worktree', 'add', '--detach', worktree, report.base);
    const runner = async (argv: string[], label: string, stdin?: string) => {
      const r = await command(argv, worktree, { timeout: config.timeoutMs ?? 60000, input: stdin });
      report.checks.push({ label, ...r });
      await save();
      return r;
    };
    const files = await contextFiles(worktree, config.scope);
    allowed = new Set(files.map((f) => f.path));
    for (const setup of config.setup ?? [])
      if (!resultOK(await runner(setup, 'setup'))) throw new WorkflowError('Setup failed');
    await patchState(worktree, new Set());
    let failing = await runner(config.check, 'baseline');
    let metadata;

    if (!resultOK(failing)) throw new WorkflowError('Baseline must pass before upgrading');
    const manifest = JSON.parse(await fs.readFile(path.join(worktree, 'package.json'), 'utf8'));
    if (!Array.isArray(config.update) || !config.update.length)
      throw new WorkflowError('Provide an explicit npm update argv command');
    const upgrade = config.update!.map((a) =>
      a.replaceAll('{package}', packageName).replaceAll('{version}', target),
    );
    if (!resultOK(await runner(upgrade, 'dependency update')))
      throw new WorkflowError('Dependency installation failed');
    metadata = await checkUpgrade(worktree, manifest, packageName, target);
    report.migration = { packageName, target, notes: migrationNotes };
    allowed.add('package.json');
    allowed.add('package-lock.json');
    initialManifest = manifest;
    failing = await runner(config.check, 'after upgrade');
    for (let attempt = 1; attempt <= (config.attempts ?? 3); attempt++) {
      if (!(kind === 'bumplab' && attempt === 1 && resultOK(failing))) {
        const request = {
          protocolVersion: 1,
          workflow: kind,
          attempt,
          instruction:
            'Return JSON only: {summary, edits:[{path,content}]}. Fix the failure by changing only supplied source files. Do not change tests, dependencies, checks or configuration.',
          files: await contextFiles(worktree, config.scope),
          failure: {
            stdout: failing.stdout.slice(-16000),
            stderr: failing.stderr.slice(-16000),
            code: failing.code,
          },
          migration: report.migration ?? null,
          previousAttempts: report.attempts.map((a) => ({ summary: a.summary, passed: a.passed })),
        };
        const answer = await command(config.agent, out, {
          timeout: config.timeoutMs ?? 60000,
          input: JSON.stringify(request),
        });
        if (!resultOK(answer))
          throw new WorkflowError('Agent adapter failed: ' + answer.stderr.slice(-1000));
        let response;
        try {
          response = JSON.parse(answer.stdout);
        } catch {
          throw new WorkflowError('Agent output must be valid JSON');
        }
        response = parseResponse(response);
        await applyEdits(worktree, response, new Set(files.map((f) => f.path)));
        report.attempts.push({
          attempt,
          summary: response.summary,
          usage: response.usage ?? null,
          passed: false,
        });
      }
      if (metadata)
        await checkUpgrade(
          worktree,
          initialManifest!,
          packageName,
          target,
          metadata.manifest,
          metadata.lock,
        );
      const before = await patchState(worktree, allowed);
      const results = [];
      for (const check of [config.check, ...(config.verify ?? [])])
        results.push(await runner(check, 'verification ' + attempt));
      const after = await patchState(worktree, allowed);
      if (before.fingerprint !== after.fingerprint)
        throw new WorkflowError('Verification modified tracked files; evidence is stale');
      if (metadata)
        await checkUpgrade(
          worktree,
          initialManifest!,
          packageName,
          target,
          metadata.manifest,
          metadata.lock,
        );
      if (results.every(resultOK)) {
        if (!after.patch) throw new WorkflowError('No patch was produced');
        report.status = 'verified';
        report.patchSha256 = after.fingerprint;
        report.changedFiles = after.changes;
        if (report.attempts.length) report.attempts.at(-1)!.passed = true;
        await fs.writeFile(path.join(out, 'change.patch'), after.patch);
        break;
      }
      failing = results.find((r) => !resultOK(r))!;
      await save();
    }
    if (report.status !== 'verified') report.status = 'attempts_exhausted';
  } catch (error) {
    if (report.status === 'running') report.status = 'blocked';
    report.error = errorMessage(error);
  }
  report.finishedAt = new Date().toISOString();
  await save();
  await fs.writeFile(
    path.join(out, 'report.md'),
    `# ${kind}\n\nStatus: **${report.status}**\n\nBase: ${report.base}\n\n${report.error ?? ''}\n\nAttempts: ${report.attempts.length}\n\nPatch SHA-256: ${report.patchSha256 ?? 'not verified'}\n\nInspect report.json for commands and outputs. Worktree retained at ${worktree}.\n`,
  );
  return report;
}
