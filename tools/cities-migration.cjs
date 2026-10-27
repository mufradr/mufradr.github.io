// Decode an actual prior-engine checkpoint, rather than relabelling a new save.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadEngine,prepare,sourceIdentity,defaultRoot}=require('./baseline/engine.cjs');
const oldRoot=path.resolve(process.argv[2]||'/tmp/world-engine-warfare-checkpoint'),out=process.argv[3];
const before=loadEngine(oldRoot);prepare(before,'developed','urban-legacy');for(let n=0;n<40;n++)before.step();
assert.deepEqual(before.issues(),[]);const raw=before.encodeGraph(before.save('Prior city engine')),after=loadEngine(defaultRoot);
after.inspect('applyWorldSave')(after.inspect('decodeSaveGraph')(raw));assert.deepEqual(after.issues(),[]);
assert.ok(before.state.cities.length>0);for(let n=0;n<before.state.cities.length;n++){
 const old=before.state.cities[n],c=after.state.cities[n];assert.equal(c.name,old.name);assert.equal(c.born,old.born);assert.equal(c.legacyProvincePeak,old.peak);assert.equal(c.peak,c.population);assert.ok(c.legacyEstimate);assert.equal(c.knowledge,null);assert.ok(c.population<=after.state.pop[c.cell]);
}
assert.ok(after.state.faithMix.every(v=>v===0)&&after.state.faithMix3.every(v=>v===0));
const loadedYear=after.state.year,estimatedCities=after.state.cities.length;for(let n=0;n<40;n++)after.step();assert.deepEqual(after.issues(),[]);
const result={beforeVersion:before.version,afterVersion:after.version,loadedYear,estimatedCities,noInventedArchivesOrMinorities:true,continuedYear:after.state.year,states:after.state.alive.length,cities:after.state.cities.length,issues:after.issues(),beforeSource:sourceIdentity(oldRoot),afterSource:sourceIdentity(defaultRoot)};
if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({beforeVersion:result.beforeVersion,afterVersion:result.afterVersion,loadedYear,estimatedCities,continuedYear:result.continuedYear,states:result.states,issues:result.issues}));
