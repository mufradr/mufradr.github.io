const test=require('node:test'),assert=require('node:assert/strict');
const {loadBenchmarkCore,setup,digest,explainDifference}=require('./performance-benchmark.cjs');
const previous=require('./fixtures/integration-before-cache.cjs');
for(const scenario of ['early','developed'])test('cached cell arrays retain every checkpoint value and RNG draw: '+scenario,()=>{
 const a=loadBenchmarkCore(),b=loadBenchmarkCore();for(const [name,fn] of Object.entries(previous))b.inspect(`${name}=(${fn});`);
 setup(a,scenario);setup(b,scenario);for(let n=0;n<60;n++){a.step();b.step()}
 const da=digest(a),db=digest(b);assert.equal(da,db,da===db?undefined:explainDifference(a.save('Compare'),b.save('Compare')));
});
