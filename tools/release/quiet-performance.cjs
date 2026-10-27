// A second paired CPU fixture suppresses political turnover, keeping state counts comparable.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),z=require('node:zlib'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const {loadEngine,prepare,sourceIdentity,defaultRoot,hash}=require('../baseline/engine.cjs'),{distribution,reachableBuffers}=require('../baseline/metrics.cjs');
function child(root){
 const a=loadEngine(root);prepare(a,'developed','cpu-benchmark');a.inspect('P.warRate=P.crisis=P.formRate=P.migration=P.seafaring=P.invent=P.faith=P.mixing=P.wander=P.disease=P.volcano=P.assim=0;P.floor=.2');
 for(let n=0;n<20;n++)a.step();const startStates=a.state.alive.length,times=[],slices=[];
 for(let n=0;n<120;n++){let total=0,done;const g=a.slices();do{const t=performance.now();done=g.next().done;const ms=performance.now()-t;total+=ms;slices.push(ms)}while(!done);times.push(total)}
 assert.deepEqual(a.issues(),[]);const beforeSave=process.memoryUsage(),save=a.save('Quiet developed');save.savedAt='2026-01-01T00:00:00.000Z';
 const valueDigest=hash(JSON.stringify(save,(_,v)=>ArrayBuffer.isView(v)?{type:v.constructor.name,hash:hash(Buffer.from(v.buffer,v.byteOffset,v.byteLength))}:v instanceof Map?{map:[...v]}:v instanceof Set?{set:[...v]}:v)),raw=a.encodeGraph(save),gzip=z.gzipSync(raw,{level:6});
 return {source:sourceIdentity(root),startStates,states:a.state.alive.length,years:120,warmupYears:20,kernelMs:times.reduce((a,b)=>a+b,0),yearMs:distribution(times),sliceMs:distribution(slices),beforeSave,afterSave:process.memoryUsage(),peakRSSBytes:process.resourceUsage().maxRSS*1024,worldBuffers:reachableBuffers(a.world,a.state),rawSaveBytes:raw.length,gzipSaveBytes:gzip.length,valueDigest,checkpointSHA256:hash(raw),issues:a.issues()};
}
if(process.argv[2]==='--child')console.log(JSON.stringify(child(process.argv[3])));
else{
 const before=path.resolve(process.argv[2]||'/tmp/world-engine-economy-v016'),out=process.argv[3]||'/tmp/v020-quiet-performance.json',trials={before:[],after:[]};
 for(let n=0;n<3;n++)for(const name of n%2?['after','before']:['before','after']){const r=spawnSync(process.execPath,[__filename,'--child',name==='before'?before:defaultRoot],{encoding:'utf8',maxBuffer:2*1024*1024});if(r.status!==0)throw Error(r.stderr||r.error?.message);trials[name].push(JSON.parse(r.stdout));console.log('PASS quiet '+name+' '+(n+1)+'/3')}
 for(const name of ['before','after'])assert.ok(trials[name].every(t=>t.valueDigest===trials[name][0].valueDigest),'Isolated values diverged: '+name);
 const med={before:distribution(trials.before.map(t=>t.kernelMs)),after:distribution(trials.after.map(t=>t.kernelMs))};fs.writeFileSync(out,JSON.stringify({protocol:'quiet-developed-paired-v1',note:'Same prepared developed input; turnover/contact/epidemic drivers disabled in both engines; floor=.2 to retain sparse prepared states. Ownership is not overwritten. Historical outcomes are measured elsewhere.',environment:{node:process.version,cpu:os.cpus()[0]?.model},trials,kernelMs:med,kernelTimeRatio:med.after.median/med.before.median,exactCheckpointRepetition:Object.fromEntries(['before','after'].map(k=>[k,trials[k].every(t=>t.checkpointSHA256===trials[k][0].checkpointSHA256)]))},null,2)+'\n');console.log(JSON.stringify({kernelTimeRatio:med.after.median/med.before.median,states:{before:trials.before.map(t=>t.states),after:trials.after.map(t=>t.states)}}));
}
