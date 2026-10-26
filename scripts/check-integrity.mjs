import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,posix} from 'node:path';
import {createRequire} from 'node:module';

const readJson=async path=>JSON.parse(await readFile(path,'utf8'));
const pkg=await readJson('package.json');
const lock=await readJson('package-lock.json');
const manifest=await readJson('openclaw.plugin.json');
assert.equal(pkg.name,manifest.id);
assert.equal(pkg.version,lock.version);
assert.equal(pkg.license,'MIT');
assert.deepEqual(lock.packages[''].dependencies,pkg.dependencies);
assert.deepEqual(lock.packages[''].devDependencies,pkg.devDependencies);
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
for(const file of files.filter(file=>/\.(?:mjs|cjs|js)$/.test(file))){
  execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
}
const temporary=await mkdtemp(join(tmpdir(),'office-package-'));
try{
  const [packed]=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',temporary],{encoding:'utf8',maxBuffer:4*1024*1024}));
  const paths=new Set(packed.files.map(file=>file.path));
  const required=['LICENSE','package.json','openclaw.plugin.json','OpenClawOfficeLive.ax','index.mjs','service.mjs','scripts/setup.mjs','scripts/pair.mjs','scripts/credentials.mjs','scripts/doctor.mjs','payload/bridge/server.mjs','payload/live.html','payload/live.js','payload/bot-styles.js','payload/kitchen.js','payload/cafe-motion.js','payload/connection-ui.js','payload/spike/layout.js','docs/INSTALL.md','skills/install-openclaw-office/SKILL.md',...pkg.openclaw.extensions].map(file=>posix.normalize(file));
  for(const file of required)assert.ok(paths.has(file),`Missing runtime file: ${file}`);
  for(const file of paths){
    assert.ok(!/(^|\/)(node_modules|identity|reports|\.local|\.git|media)(\/|$)|(^|\/)\.env(?:\.|$)|\.test\.mjs$/.test(file),`Private or development file in package: ${file}`);
    if(/\.(?:mjs|cjs|js)$/.test(file)){
      const source=await readFile(file,'utf8');
      for(const match of source.matchAll(/(?:from\s*|import\s*\()(['"])(\.{1,2}\/[^'"]+)\1/g)){
        const target=posix.normalize(posix.join(dirname(file),match[2]));
        assert.ok(paths.has(target),`Missing local import: ${file} -> ${target}`);
      }
    }
  }
  execFileSync('tar',['-xf',join(temporary,packed.filename),'-C',temporary]);
  const runtime=await import(join(temporary,'package/index.mjs'));
  let commands=[];
  runtime.default.register({registerCli(_register,options){commands=options.commands;},pluginConfig:{},logger:{}});
  assert.deepEqual(commands,['office']);
  const bridge=await import(join(temporary,'package/service.mjs'));
  assert.equal(typeof bridge.createBridgeService,'function');
  console.log(`Package verified: ${paths.size} files; CLI registers without private configuration.`);
}finally{await rm(temporary,{recursive:true,force:true});}
const require=createRequire(import.meta.url);
const {parse}=require('yaml');
const workflow=parse(await readFile('.github/workflows/ci.yml','utf8'));
assert.equal(workflow.permissions.contents,'read');
assert.ok(!Object.hasOwn(workflow.on,'pull_request_target'));
for(const job of Object.values(workflow.jobs)){
  for(const step of job.steps??[]){
    if(step.uses)assert.match(step.uses,/@[0-9a-f]{40}$/,'Actions must use immutable commit SHAs');
  }
}
console.log(`Syntax checked: ${files.filter(file=>/\.(?:mjs|cjs|js)$/.test(file)).length} source files.`);
