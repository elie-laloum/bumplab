#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execute } from '../src/engine.js';
const help = 'bumplab run --repo PATH --config FILE --out NEW_DIRECTORY --package NAME --version EXACT --notes FILE';
try {
  const args=process.argv.slice(2);
  if(args.includes('--help')||!args.length){console.log(help);process.exit(0)}
  if(args.shift()!=='run')throw new Error(help);
  const opts={};while(args.length){const k=args.shift();if(!['--repo','--config','--out','--package','--version','--notes'].includes(k)||!args[0]||args[0].startsWith('--')||opts[k])throw new Error(help);opts[k]=args.shift()}
  if(['--repo','--config','--out','--package','--version','--notes'].some(k=>!opts[k]))throw new Error(help);
  const result=await execute({repo:opts['--repo'],out:opts['--out'],kind:'bumplab',config:JSON.parse(await readFile(opts['--config'],'utf8')),packageName:opts['--package'],target:opts['--version'],migrationNotes:await readFile(opts['--notes'],'utf8')});
  console.log(JSON.stringify({status:result.status,error:result.error,patchSha256:result.patchSha256}));
  process.exitCode=result.status==='verified'?0:1;
}catch(e){console.error(e.message);process.exitCode=2}
