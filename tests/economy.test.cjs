const test=require('node:test'),assert=require('node:assert/strict');
const {loadCore}=require('./core-harness.cjs');
test('food reserves and maintained infrastructure share a conserved economic foundation',async t=>{
 const a=loadCore();a.earth();
 function prepare(){a.start();return a.inspect(`(()=>{S.year=100;P.migration=0;S.pop.fill(0);S.pol.fill(0);S.K.fill(1);S.farm.fill(0);S.herd.fill(0);S.foodStock.fill(0);const i=cellAt(32,45.5);S.pop[i]=1000;S.K[i]=2000;S.farm[i]=S.grain[i]=S.admin[i]=1;const id=newPolity(i,null);globalThis.economicSite={i,id};return economicSite})()`)}
 function balance(f){assert.ok(Math.abs(f.openingStock+f.production-f.consumption-f.spoilage-f.shippingLoss-f.waste-f.closingStock)<1e-6)}
 await t.test('only actual harvested surplus can fill a bounded store',()=>{
  const {i}=prepare();a.inspect('transportEconomy()');const f=a.state.foodLedger;balance(f);assert.equal(f.production,1300);assert.equal(f.consumption,1000);assert.equal(a.state.foodStock[i],300);assert.ok(a.state.foodStock[i]<a.inspect('foodStorageCapacity(economicSite.i)'));assert.equal(a.state.pop[i],1000);
 });
 await t.test('foragers and empty productive land do not acquire free grain',()=>{
  const {i}=prepare();a.inspect('S.farm[economicSite.i]=0;transportEconomy()');balance(a.state.foodLedger);assert.equal(a.state.foodStock[i],0);assert.equal(a.state.foodLedger.production,1040);assert.equal(a.state.foodLedger.waste,40);
 });
 await t.test('the subsistence shortcut matches the full accounting path',()=>{
  prepare();const r=a.inspect(`(()=>{S.pol.fill(0);S.alive=[];S.farm.fill(0);transportEconomy();const fast={...S.foodLedger};S.K[economicSite.i]=2000;S.routes.push({a:economicSite.i,b:economicSite.i,path:[],last:S.year-100});transportEconomy();return {fast,full:S.foodLedger}})()`);
  assert.deepEqual(r.fast,r.full);balance(r.fast);
 });
 await t.test('stored food buffers a short harvest failure then runs out during a prolonged one',()=>{
  const {i}=prepare();a.inspect('transportEconomy();S.year++;S.K[economicSite.i]=800;transportEconomy()');balance(a.state.foodLedger);assert.equal(a.state.foodLedger.unmet,0);assert.ok(a.state.foodStock[i]>0&&a.state.foodStock[i]<100);assert.ok(a.state.K[i]>=1000);
  a.inspect('S.year++;S.K[economicSite.i]=800;transportEconomy()');balance(a.state.foodLedger);assert.ok(a.state.foodLedger.unmet>0);assert.equal(a.state.foodStock[i],0);assert.ok(a.state.K[i]<1000);
 });
 await t.test('overflow and spoilage stay visible and storage does not become permanent production',()=>{
  const {i}=prepare();a.inspect('S.foodStock[economicSite.i]=10000;S.K[economicSite.i]=600;transportEconomy()');const f=a.state.foodLedger;balance(f);assert.ok(f.spoilage>0&&f.waste>0);assert.ok(a.state.foodStock[i]<=a.inspect('foodStorageCapacity(economicSite.i)'));assert.equal(a.inspect('networkEconomy.production[economicSite.i]'),600);
 });
 await t.test('neglect gradually damages physical works; funding repairs them without forgetting techniques',()=>{
  const {i}=prepare();const r=a.inspect(`(()=>{const {i,id}=economicSite,o=S.pols[id];S.roads[i]=S.irrig[i]=1;o.infrastructureFunding=0;for(let n=0;n<20;n++)maintainWorks(i,5);const neglected=S.works[i];o.infrastructureFunding=1;for(let n=0;n<20;n++)maintainWorks(i,5);return {neglected,repaired:S.works[i],roadKnowledge:S.roads[i],irrigationKnowledge:S.irrig[i]}})()`);
  assert.ok(r.neglected<.9&&r.neglected>.05);assert.ok(r.repaired>r.neglected);assert.equal(r.roadKnowledge,1);assert.equal(r.irrigationKnowledge,1);assert.equal(a.state.works[i],r.repaired);
 });
 await t.test('canal condition affects harvest potential and road condition affects travel',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,id}=economicSite;S.irrig[i]=1;S.worksYear=S.year;computeK();const maintained=S.K[i];S.works[i]=.1;computeK();const neglected=S.K[i];const j=[0,1,2,3].map(d=>WD.nb[i*4+d]).find(j=>j>=0&&WD.land[j]);S.pol[j]=id;S.roads[j]=1;S.forest[j]=1;S.works[j]=.1;distBFS();const bad=S.dist[j];S.works[j]=1;distBFS();return {maintained,neglected,bad,good:S.dist[j]}})()`);
  assert.ok(r.maintained>r.neglected);assert.ok(r.good<r.bad);
 });
 await t.test('annual maintenance uses that year of funding and never repeats on a recalculation',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,id}=economicSite;S.roads[i]=S.irrig[i]=1;S.works[i]=.5;S.pols[id].infrastructureFunding=0;computeK();const first=S.works[i];computeK();const repeated=S.works[i];S.year++;S.pols[id].infrastructureFunding=1;computeK();return {first,repeated,repaired:S.works[i]}})()`);
  assert.equal(r.first,r.repeated);assert.ok(r.first<.5);assert.ok(r.repaired>r.first);
 });
 await t.test('abandoned stateless works cannot repair themselves without residents',()=>{
  prepare();const q=a.inspect(`(()=>{const {i}=economicSite;S.pol[i]=0;S.pop[i]=0;S.roads[i]=1;S.works[i]=.5;maintainWorks(i,1);return S.works[i]})()`);assert.ok(q<.5);
 });
 await t.test('funded spending, wartime costs and treasury caps balance explicitly',()=>{
  prepare();const r=a.inspect(`(()=>{const o=S.pols[economicSite.id];o.treas=.5;let b=governmentBudget(o,economicSite.i,20,100,10);const peace={...b};o.enemies.set(999,0);o.treas=.5;b=governmentBudget(o,economicSite.i,20,100,10);const war={...b};o.enemies.clear();o.treas=1;b=governmentBudget(o,economicSite.i,20,100,10);return {peace,war,capped:{...b}}})()`);
  for(const b of Object.values(r)){assert.equal(b.spending,b.administration+b.military+b.infrastructure);assert.equal(b.balance,b.revenue-b.spending);assert.ok(Math.abs(b.closingTreasury-b.openingTreasury-.04*(b.balance-b.surplusDiscarded)/b.revenue)<1e-12)}
  assert.equal(r.war.military,50);assert.equal(r.war.spending-r.peace.spending,50);assert.ok(r.capped.surplusDiscarded>0);
 });
 await t.test('a government at its credit limit exposes unpaid costs instead of inventing funding',()=>{
  prepare();const b=a.inspect(`(()=>{const o=S.pols[economicSite.id];o.treas=-2;governmentBudget(o,economicSite.i,500,10,30);return o.budget})()`);
  assert.equal(b.infrastructure,0);assert.equal(b.spending,10);assert.equal(b.unpaid,490);assert.equal(b.closingTreasury,-2);
 });
 await t.test('legacy worlds gain empty reserves and intact condition without mutating their input',async()=>{
  prepare();a.inspect('transportEconomy()');const legacy=await a.decode(await a.encode(a.save('Legacy')));legacy.engineVersion='0.16.0';for(const k of ['economyVersion','foodStock','works','worksYear','foodLedger'])delete legacy.state[k];const b=loadCore();b.restore(legacy);
  assert.equal(legacy.state.foodStock,undefined);assert.equal(b.state.foodStock.reduce((n,v)=>n+v,0),0);assert.ok(b.state.works.every(v=>v===1));assert.equal(b.state.farm,b.state.tk[0]);b.step();assert.deepEqual(b.inspect('simulationIssues()'),[]);
 });
 await t.test('new economy state and exact continuation survive saves; malformed fields are rejected',async()=>{
  prepare();for(let n=0;n<15;n++)a.step();const file=await a.encode(a.save('Economy')),b=loadCore();b.restore(await b.decode(file));for(let n=0;n<12;n++){a.step();b.step()}assert.deepEqual(a.save('same').state,b.save('same').state);
  for(const field of ['foodStock','works']){const bad=await b.decode(file);bad.state[field][economicSite.i]=NaN;assert.throws(()=>b.restore(bad),/nonfinite/)}
  const bad=await b.decode(file);bad.state.foodStock[economicSite.i]=-1;assert.throws(()=>b.restore(bad),/food stock/);
 });
});
