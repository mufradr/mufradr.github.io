const test=require('node:test'),assert=require('node:assert/strict');
const {loadBenchmarkCore,setup,digest,explainDifference}=require('./performance-benchmark.cjs');
const previous=require('./fixtures/simulation-before-optimization.cjs');
for(const scenario of ['early','developed'])test(`CPU optimizations preserve every saved value and RNG draw in ${scenario} worlds`,()=>{
 const a=loadBenchmarkCore(),b=loadBenchmarkCore();
 // Apply the shared new road-condition term to both diffusion implementations.
 let tech=String(previous.techStep).replaceAll('s.roads[i]','roadWorks(i)')
  .replace('const dark=po?po.cult<0.1:true;','const preservation=cityPreservation(i),dark=po?po.cult<0.1:true;')
  .replace('const rvb=(1+0.5*w.rv[i])*(1+0.3*s.paper[i]+0.2*roadWorks(i));','const rvb=(1+0.5*w.rv[i])*(1+0.3*s.paper[i]+0.2*roadWorks(i))*(1+0.25*cityPreservation(i));')
  .replaceAll('t*=pi?0.994:0.985','t*=1-(pi?0.006:0.015)*(1-0.9*preservation)')
  .replace('t*=1-loss*(f===0?0.3:1);','t*=1-loss*(f===0?0.3:1)*(1-0.9*preservation);');
 const faithStart=tech.indexOf('    const ri=s.rel[i];');tech=tech.slice(0,faithStart)+'    religiousContact(i,ls0,ls1);'+tech.slice(tech.lastIndexOf('\n  }'));
 b.inspect(`techStep=(${tech});exitPass=(${previous.exitPass});`);
 setup(a,scenario);setup(b,scenario);
 for(let year=0;year<40;year++){a.step();b.step()}
 const da=digest(a),db=digest(b);assert.equal(da,db,da===db?undefined:explainDifference(a.save('Compare'),b.save('Compare')));
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
