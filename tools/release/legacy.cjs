// Genuine old-engine output, migration, continuation, and exact current-format resume.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadEngine,prepare,sourceIdentity,defaultRoot,hash}=require('../baseline/engine.cjs');
const roots=process.argv.slice(3);if(!roots.length)roots.push('/tmp/world-engine-v013','/tmp/world-engine-economy-v016','/tmp/world-engine-economic-checkpoint','/tmp/world-engine-government-checkpoint','/tmp/world-engine-warfare-checkpoint','/tmp/world-engine-cities-checkpoint');
const results=[];
for(const root of roots){
 const before=loadEngine(path.resolve(root));prepare(before,'developed','release-legacy');for(let n=0;n<20;n++)before.step();assert.deepEqual(before.issues(),[]);
 const bytes=before.encodeGraph(before.save('Prior engine')),after=loadEngine();after.inspect('applyWorldSave')(after.inspect('decodeSaveGraph')(bytes));assert.deepEqual(after.issues(),[]);
 const loadedYear=after.state.year;for(let n=0;n<30;n++)after.step();assert.deepEqual(after.issues(),[]);
 const saved=after.encodeGraph(after.save('Resume')),restored=loadEngine();restored.inspect('applyWorldSave')(restored.inspect('decodeSaveGraph')(saved));for(let n=0;n<10;n++){after.step();restored.step()}
 function payload(a){const p=a.save('Compare');p.savedAt='2026-01-01T00:00:00.000Z';return p}
 function digest(a){return hash(JSON.stringify(payload(a),(_,v)=>ArrayBuffer.isView(v)?{type:v.constructor.name,bytes:hash(Buffer.from(v.buffer,v.byteOffset,v.byteLength))}:v instanceof Map?{map:[...v]}:v instanceof Set?{set:[...v]}:v))}
 const exactSerializedContinuation=hash(after.encodeGraph(payload(after)))===hash(restored.encodeGraph(payload(restored)));
 assert.equal(digest(after),digest(restored),'Exact checkpoint values/RNG: '+before.version);assert.deepEqual(restored.issues(),[]);
 results.push({from:before.version,to:after.version,loadedYear,continuedYear:after.state.year,exactValuesAndRng:true,exactSerializedContinuation,oldSource:sourceIdentity(path.resolve(root)),newSource:sourceIdentity(defaultRoot),issues:restored.issues()});console.log('PASS '+before.version+' → '+after.version+'; 40 continued years, exact values/RNG' );
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({results},null,2)+'\n');
