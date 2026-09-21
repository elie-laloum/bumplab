import { promises as fs } from 'node:fs';
import path from 'node:path';
import { WorkflowError } from '../domain/errors.ts';
import type { Manifest } from '../domain/types.ts';
export async function checkUpgrade(
  worktree: string,
  initialManifest: Manifest,
  packageName: string,
  target: string,
  expectedManifest: string | null = null,
  expectedLock: string | null = null,
) {
  const text = await fs.readFile(path.join(worktree, 'package.json'), 'utf8');
  const manifest = JSON.parse(text);
  const wanted = structuredClone(initialManifest);
  const section = (['dependencies', 'devDependencies'] as const).filter((k) =>
    Object.hasOwn(initialManifest[k] ?? {}, packageName),
  );
  if (section.length !== 1)
    throw new WorkflowError('Choose exactly one direct dependency or devDependency');
  wanted[section[0]]![packageName] = target;
  // Compare structure rather than key ordering or formatting.
  const canonical = (value: unknown) =>
    JSON.stringify(value, function (_key, v) {
      return v && typeof v === 'object' && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
        : v;
    });
  if (canonical(manifest) !== canonical(wanted))
    throw new WorkflowError(
      'Upgrade changed unrelated package metadata or did not pin the target version',
    );
  const lockText = await fs.readFile(path.join(worktree, 'package-lock.json'), 'utf8');
  const lock = JSON.parse(lockText);
  if (
    lock.packages?.['node_modules/' + packageName]?.version !== target ||
    lock.packages?.['']?.[section[0]]?.[packageName] !== target
  )
    throw new WorkflowError('Lockfile does not resolve the exact requested version');
  const installed = JSON.parse(
    await fs.readFile(path.join(worktree, 'node_modules', packageName, 'package.json'), 'utf8'),
  );
  if (installed.version !== target)
    throw new WorkflowError('Installed package is not the target version');
  if (
    (expectedManifest && text !== expectedManifest) ||
    (expectedLock && lockText !== expectedLock)
  )
    throw new WorkflowError('Package metadata changed during adaptation');
  return { manifest: text, lock: lockText };
}
