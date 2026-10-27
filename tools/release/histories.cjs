// Concurrent outcome collection only. Never use these wall/kernel times as CPU benchmarks.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {defaultRoot,sourceIdentity,hash}=require('../baseline/engine.cjs'),protocol=require('../baseline/protocol.json'),{summarize}=require('../baseline/run.cjs');
async function main(){
 const root=path.resolve(process.argv[2]||defaultRoot),out=path.resolve(process.argv[3]||'/tmp/v020-histories'),runs=['earth-development-01','earth-development-02','earth-development-03','generated-development-01'];fs.mkdirSync(out,{recursive:true});
 if(fs.existsSync(path.join(out,'manifest.json')))throw Error('Use a fresh output directory');
 const source=sourceIdentity(root),runnerSHA256=hash(['protocol.json','engine.cjs','metrics.cjs','run.cjs'].map(f=>fs.readFileSync(path.join(__dirname,'../baseline',f))).join('\n'));
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),identity:{protocol,source,runnerSHA256,requestedEndYear:null},environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logicalCPUs:os.cpus().length,totalMemoryBytes:os.totalmem()},orchestration:{concurrency:3,runnerSHA256:hash(fs.readFileSync(__filename)),timingPolicy:'Historical outcomes only; concurrent kernel/wall timings excluded from performance comparisons. Use paired isolated CPU measurements.'}},null,2)+'\n');
 let next=0;
 async function worker(){while(next<runs.length){const id=runs[next++],fd=fs.openSync(path.join(out,id+'.log'),'w');console.log('START '+id);
  try{await new Promise((resolve,reject)=>{const c=spawn(process.execPath,[path.join(__dirname,'../baseline/run.cjs'),'--child',id,'--engine-root',root,'--out',out],{stdio:['ignore',fd,fd]});c.on('error',reject);c.on('exit',n=>n===0?resolve():reject(Error(id+' failed: '+n)))})}finally{fs.closeSync(fd)}
  assert.deepEqual(sourceIdentity(root),source,'Source changed during histories');summarize(out);console.log('PASS '+id);
 }}
 await Promise.all([worker(),worker(),worker()]);console.log('PASS four full ordinary histories; 43,200 simulated years.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
