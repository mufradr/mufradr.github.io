// Busy prepared Earth worlds exercise interacting systems; not historical dating.
const assert=require('node:assert/strict');
const {loadBenchmarkCore,setup}=require('./performance-benchmark.cjs');
for(const seed of ['network-a','network-b','network-c']){
 const a=loadBenchmarkCore();setup(a,'developed');
 a.inspect(`(()=>{S.r=mulberry32(hashStr('${seed}'));const from=15790;S.ocean[from]=S.nav[from]=S.sail[from]=1;S.pop[from]=200000;
  const route=traceVoyage(from,250*Math.PI/180,voyageRange(from));S.pop[route.to]=100000;S.seaRoutes.set('stress-ocean',{...route,born:S.year-20,last:S.year});})()`);
 let food=0,trade=0,shortage=0;
 for(let n=0;n<150;n++){
  a.step();
  const totals=a.inspect(`(()=>{let food=0,trade=0,shortage=0;for(const o of networkEconomy.states.values()){food+=o.imports;trade+=o.trade;shortage+=o.shortfall}return {food,trade,shortage}})()`);
  food+=totals.food;trade+=totals.trade;shortage+=totals.shortage;
  if(n%10===0)assert.deepEqual(a.inspect('simulationIssues()'),[],seed+' year '+a.state.year);
 }
 assert.ok(food>0);assert.ok(trade>0);assert.ok(shortage>0);
 console.log(JSON.stringify({seed,year:a.state.year,states:a.state.alive.length,wars:a.state.wars.length,colonies:a.state.colonies.size,outbreaks:a.state.outbreaks.length,
  foodMoved:Math.round(food),tradeRevenue:Math.round(trade),unmetCapacity:Math.round(shortage)}));
}
console.log('Passed: three 150-year prepared worlds with regular integrity checks.');
