// Independent full-history replay plus actual late-game encode/decode/load/continuation.
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),assert=require('node:assert/strict');
const {loadEngine,sourceIdentity,defaultRoot,hash}=require('../baseline/engine.cjs');
const file=process.argv[2],out=process.argv[3]||'/tmp/v020-late-save.json';if(!file)throw Error('Usage: node tools/release/late-save.cjs RECORDED_RUN.json.gz OUT.json');
const recorded=JSON.parse(z.gunzipSync(fs.readFileSync(file))),a=loadEngine();a.initialize(recorded.definition.kind,recorded.definition.seed);
for(let n=a.state.year;n<recorded.definition.endYear;n++){a.step();if(a.state.year%1000===0)console.log('Replay year '+a.state.year)}assert.deepEqual(a.issues(),[]);
function capture(app){const p=app.save('Development baseline');p.savedAt='2026-01-01T00:00:00.000Z';return p}
const p=capture(a),raw=a.encodeGraph(p),actual=hash(raw),expected=recorded.trials[0].finalSave.rawSHA256;
assert.equal(actual,expected,'Independent full-history replay must match the recorded checkpoint');
const b=loadEngine();b.inspect('applyWorldSave')(b.inspect('decodeSaveGraph')(raw));assert.deepEqual(b.issues(),[]);assert.equal(hash(b.encodeGraph(capture(b))),actual,'Loaded checkpoint must retain every encoded value and reference');
for(let n=0;n<20;n++){a.step();b.step()}
function digest(app){return hash(JSON.stringify(capture(app),(_,v)=>ArrayBuffer.isView(v)?{type:v.constructor.name,bytes:hash(Buffer.from(v.buffer,v.byteOffset,v.byteLength))}:v instanceof Map?{map:[...v]}:v instanceof Set?{set:[...v]}:v))}
assert.equal(digest(a),digest(b),'Late-world continuation values/RNG differ');assert.deepEqual(a.issues(),[]);assert.deepEqual(b.issues(),[]);
fs.writeFileSync(out,JSON.stringify({source:sourceIdentity(defaultRoot),recordedRun:recorded.definition.id,replayedYears:recorded.trials[0].simulation.years,independentReplayCheckpointSHA256:actual,recordedCheckpointSHA256:expected,rawBytes:raw.length,loadedEncodingExact:true,continuedYears:20,continuationValuesAndRngExact:true,issues:b.issues()},null,2)+'\n');console.log('PASS full-history replay, late save/load and twenty-year continuation');
