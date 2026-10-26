const test=require('node:test'),assert=require('node:assert/strict');
const {loadBenchmarkCore,setup,digest}=require('./performance-benchmark.cjs');
const previous=require('./fixtures/simulation-before-optimization.cjs');
for(const scenario of ['early','developed'])test(`CPU optimizations preserve every saved value and RNG draw in ${scenario} worlds`,()=>{
 const a=loadBenchmarkCore(),b=loadBenchmarkCore();
 b.inspect(`techStep=(${previous.techStep});exitPass=(${previous.exitPass});`);
 setup(a,scenario);setup(b,scenario);
 for(let year=0;year<40;year++){a.step();b.step()}
 assert.equal(digest(a),digest(b));
 if(scenario==='developed'){assert.ok(a.state.alive.length>200);assert.ok(a.state.wars.length>0)}
});
test('exit opportunities refresh after population, ownership and world changes',()=>{
 const a=loadBenchmarkCore(),b=loadBenchmarkCore();b.inspect(`exitPass=(${previous.exitPass});`);
 for(const app of [a,b]){setup(app,'early');app.inspect('exitPass()')}
 for(const app of [a,b])app.inspect(`(()=>{for(const i of WD.landIdx){S.pop[i]*=(i%11)+1;S.pol[i]=i%3===0?1:0}exitPass(0.25,0.75)})()`);
 assert.deepEqual(a.inspect('S.exit'),b.inspect('S.exit'));assert.deepEqual(a.inspect('S.circE'),b.inspect('S.circE'));
 for(const app of [a,b]){app.inspect(`WD=genWorld({seed:'different-terrain',landFrac:P.landFrac});newHistory('another-history');exitPass()`)}
 assert.deepEqual(a.inspect('S.exit'),b.inspect('S.exit'));assert.deepEqual(a.inspect('S.circE'),b.inspect('S.circE'));
});
