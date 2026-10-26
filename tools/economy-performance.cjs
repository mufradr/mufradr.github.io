// CPU-only prepared workloads. Separate processes avoid sharing JIT/GC history
// between repetitions; the original v0.16 baseline protocol/archive is unchanged.
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const {loadEngine,prepare,sourceIdentity,hash,defaultRoot}=require('./baseline/engine.cjs');
const {distribution,reachableBuffers}=require('./baseline/metrics.cjs');
function child(root,scenario){
 const app=loadEngine(root);prepare(app,scenario,'cpu-benchmark');for(let n=0;n<20;n++)app.step();const times=[],chunks=[];
 for(let n=0;n<120;n++){const gen=app.slices();let done,total=0;do{const at=performance.now();done=gen.next().done;const ms=performance.now()-at;chunks.push(ms);total+=ms}while(!done);times.push(total)}
 const issues=app.issues();assert.deepEqual(issues,[]);const data=app.save('Economic performance');data.savedAt='2026-01-01T00:00:00.000Z';
 // This follows the existing continuation-test value digest: immutable alias
 // topology is normalized. Exact serialized-checkpoint hashes are also retained.
 const valueDigest=hash(JSON.stringify(data,(_,v)=>ArrayBuffer.isView(v)?{type:v.constructor.name,hash:hash(Buffer.from(v.buffer,v.byteOffset,v.byteLength))}:v instanceof Map?{map:[...v]}:v instanceof Set?{set:[...v]}:v));
 const buffers=reachableBuffers(app.world,app.state),raw=app.encodeGraph(data),compressed=z.gzipSync(raw,{level:6});
 return {source:sourceIdentity(root),version:app.version,scenario,years:120,warmup:20,kernelMs:times.reduce((n,v)=>n+v,0),yearMs:distribution(times),sliceMs:distribution(chunks),valueDigest,checkpointSHA256:hash(raw),rawSaveBytes:raw.length,gzipSaveBytes:compressed.length,worldBufferBytes:buffers.bytes,states:app.state.alive.length,year:app.state.year,issues};
}
function main(){
 const [mode,...args]=process.argv.slice(2);if(mode==='--child'){console.log(JSON.stringify(child(args[0],args[1])));return}
 if(!mode)throw Error('Usage: node tools/economy-performance.cjs OLD_CHECKOUT [NEW_CHECKOUT] [OUT_FILE]');
 const before=path.resolve(mode||'/tmp/world-engine-economy-v016'),after=path.resolve(args[0]||defaultRoot),out=path.resolve(args[1]||'/tmp/world-engine-economy-performance-isolated.json'),models={};
 for(const name of ['before','after'])models[name]={};
 for(const scenario of ['early','developed']){
  const samples={before:[],after:[]};
  for(let n=0;n<3;n++){
   // Alternate ordering and keep each pair adjacent to reduce timing drift.
   const order=n%2?['after','before']:['before','after'];
   for(const name of order){const root=name==='before'?before:after;
    const r=spawnSync(process.execPath,[__filename,'--child',root,scenario],{encoding:'utf8',maxBuffer:1024*1024});if(r.status!==0)throw Error(r.stderr||r.error?.message||'Benchmark process failed');samples[name].push(JSON.parse(r.stdout));console.log(name+' '+scenario+' '+(n+1)+'/3');
   }
  }
  for(const name of ['before','after']){const trials=samples[name];assert.ok(trials.every(t=>t.valueDigest===trials[0].valueDigest),'Value continuation differed across isolated trials');models[name][scenario]={trials,kernelMs:distribution(trials.map(t=>t.kernelMs)),exactCheckpointRepetition:trials.every(t=>t.checkpointSHA256===trials[0].checkpointSHA256)}}
 }

 const result={protocol:'economic-foundation-paired-process-v2',environment:{node:process.version,cpu:os.cpus()[0]?.model},models,comparison:Object.fromEntries(['early','developed'].map(s=>[s,{kernelRatio:models.after[s].kernelMs.median/models.before[s].kernelMs.median,worldBufferDelta:models.after[s].trials[0].worldBufferBytes-models.before[s].trials[0].worldBufferBytes,saveRatio:models.after[s].trials[0].gzipSaveBytes/models.before[s].trials[0].gzipSaveBytes,beforeStates:models.before[s].trials[0].states,afterStates:models.after[s].trials[0].states}]))};
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.comparison,null,2));
}
if(require.main===module)try{main()}catch(e){console.error(e);process.exitCode=1}
