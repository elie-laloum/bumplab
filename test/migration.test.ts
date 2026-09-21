import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execute, command } from '../src/engine.ts';
import { fixture } from '../examples/demo.ts';

test('real npm migration pins target, adapts API and preserves tests', async () => {
  const f = await fixture();
  try {
    const before = await fs.readFile(path.join(f.repo, 'greeting.test.js'), 'utf8');
    const report = await execute(f);
    assert.equal(report.status, 'verified', report.error);
    const after = JSON.parse(await fs.readFile(path.join(f.out, 'worktree/package.json'), 'utf8'));
    assert.equal(after.dependencies['bumplab-fixture-name'], '2.0.0');
    assert.equal(await fs.readFile(path.join(f.out, 'worktree/greeting.test.js'), 'utf8'), before);
    assert.equal(
      JSON.parse(await fs.readFile(path.join(f.repo, 'package.json'), 'utf8')).dependencies[
        'bumplab-fixture-name'
      ],
      '1.0.0',
    );
    assert.equal(
      (await command(['git', 'apply', '--check', path.join(f.out, 'change.patch')], f.repo)).code,
      0,
    );
    assert.equal(report.attempts.length, 1);
  } finally {
    await f.close();
  }
});
test('refuses a dirty baseline and a fake upgrade', async () => {
  const f = await fixture();
  try {
    const r = await execute({
      ...f,
      config: { ...f.config, update: [process.execPath, '-e', 'process.exit(0)'] },
    });
    assert.equal(r.status, 'blocked');
    assert.match(r.error, /target version/);
  } finally {
    await f.close();
  }
});
test('an agent cannot roll back the requested dependency', async () => {
  const f = await fixture();
  try {
    const adapter = path.join(f.root, 'cheat.cjs');
    await fs.writeFile(
      adapter,
      'process.stdin.resume();process.stdin.on("end",()=>console.log(JSON.stringify({summary:"rollback",edits:[{path:"package.json",content:"{}"}]})));',
    );
    const r = await execute({ ...f, config: { ...f.config, agent: [process.execPath, adapter] } });
    assert.equal(r.status, 'blocked');
    assert.match(r.error, /outside source scope/);
  } finally {
    await f.close();
  }
});
test('requires reviewed migration notes and an exact target version', async () => {
  const f = await fixture();
  try {
    await assert.rejects(execute({ ...f, migrationNotes: '' }), /reviewed migration/);
    await assert.rejects(execute({ ...f, target: 'latest' }), /exact semantic version/);
  } finally {
    await f.close();
  }
});
