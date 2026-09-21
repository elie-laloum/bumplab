import { promises as fs } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execute, command } from '../src/engine.js';

export async function npmCLI() {
  const candidates=[process.env.NPM_CLI,process.env.npm_execpath,path.resolve(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.resolve(path.dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')].filter(Boolean);
  for(const c of candidates)if(c.endsWith('npm-cli.js')){try{await fs.access(c);return c}catch{}}
  throw new Error('Run through npm run demo / npm test, or set NPM_CLI to npm-cli.js');
}

export async function fixture() {
  const root=await fs.mkdtemp(path.join(tmpdir(),'bumplab-demo-'));
  const cli=await npmCLI();
  const packages={};
  for(const version of ['1.0.0','2.0.0']){
    const folder=path.join(root,'fixture-'+version,'package');await fs.mkdir(folder,{recursive:true});
    await fs.writeFile(path.join(folder,'package.json'),JSON.stringify({name:'bumplab-fixture-name',version,type:'module',exports:'./index.js'}));
    await fs.writeFile(path.join(folder,'index.js'),version==='1.0.0'?'export const name = value => value.toUpperCase();':'export const displayName = value => value.toUpperCase();');
    const archive=path.join(root,version+'.tgz');
    const result=await command(['tar','-czf',archive,'-C',path.dirname(folder),'package'],root);if(result.code)throw new Error(result.stderr);
    packages[version]=await fs.readFile(archive);
  }
  let url;
  const server=createServer((req,res)=>{
    const file=Object.keys(packages).find(v=>req.url==='/'+v+'.tgz');
    if(file){res.setHeader('content-type','application/octet-stream');res.end(packages[file]);return}
    if(decodeURIComponent(req.url.split('?')[0])==='/bumplab-fixture-name'){
      const versions=Object.fromEntries(Object.entries(packages).map(([v,data])=>[v,{name:'bumplab-fixture-name',version:v,dist:{tarball:url+'/'+v+'.tgz',shasum:createHash('sha1').update(data).digest('hex')}}]));
      res.setHeader('content-type','application/json');res.end(JSON.stringify({name:'bumplab-fixture-name','dist-tags':{latest:'2.0.0'},versions}));return;
    }
    res.writeHead(404);res.end('{}');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+server.address().port;
  const close=()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)});
  try{
    const repo=path.join(root,'app');await fs.mkdir(path.join(repo,'src'),{recursive:true});
    await fs.writeFile(path.join(repo,'package.json'),JSON.stringify({name:'bumplab-demo-app',version:'1.0.0',private:true,type:'module',dependencies:{'bumplab-fixture-name':'1.0.0'}}));
    await fs.writeFile(path.join(repo,'.gitignore'),'node_modules/\n');
    await fs.writeFile(path.join(repo,'.gitattributes'),'* text=auto eol=lf\n');
    await fs.writeFile(path.join(repo,'src/greeting.js'),"import { name } from 'bumplab-fixture-name';\nexport const greeting = value => 'Hello '+name(value);\n");
    await fs.writeFile(path.join(repo,'greeting.test.js'),"import {test} from 'node:test';import assert from 'node:assert/strict';import {greeting} from './src/greeting.js';test('greeting',()=>assert.equal(greeting('Elie'),'Hello ELIE'));\n");
    const common=['--ignore-scripts','--no-audit','--no-fund','--registry',url,'--cache',path.join(root,'npm-cache')];
    const install=await command([process.execPath,cli,'install',...common],repo,{timeout:60000});if(install.code)throw new Error(install.stderr);
    for(const args of [['init'],['add','.'],['-c','user.name=Demo','-c','user.email=demo@example.invalid','commit','-m','fixture']]){const r=await command(['git',...args],repo);if(r.code)throw new Error(r.stderr)}
    return {root,repo,out:path.join(root,'result'),close,kind:'bumplab',packageName:'bumplab-fixture-name',target:'2.0.0',migrationNotes:'Fixture migration 1.0.0 -> 2.0.0: name(value) is renamed to displayName(value). Return value is unchanged. Source: the fixture package sources included in examples/demo.js.',config:{scope:['src/'],check:[process.execPath,'--test','greeting.test.js'],setup:[[process.execPath,cli,'ci',...common]],update:[process.execPath,cli,'install','--save-exact',...common,'{package}@{version}'],agent:[process.execPath,fileURLToPath(new URL('./fixture-agent.js',import.meta.url))],attempts:2,timeoutMs:60000}};
  }catch(e){await close();throw e}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const f=await fixture();try{const report=await execute(f);console.log(JSON.stringify({status:report.status,error:report.error,report:path.join(f.out,'report.json'),adapter:'deterministic fixture',registry:'local fixture registry'},null,2));process.exitCode=report.status==='verified'?0:1;}finally{await f.close()}
}
