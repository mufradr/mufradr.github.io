const test=require('node:test');
const assert=require('node:assert/strict');
const {loadCore}=require('./core-harness.cjs');
test('settlement maturity and institutional limits',async t=>{
 const a=loadCore();a.earth();
 await t.test('new farmers wait generations; mature highland communities remain eligible',()=>{
  a.start();const result=a.inspect(`(()=>{const i=cellAt(18,-97);S.farm[i]=S.grain[i]=1;S.pop[i]=WD.area[i]*3;S.s[i]=.6;S.circE[i]=.9;
   S.settled[i]=0;const fresh=stateFormationChance(i);S.settled[i]=599;const young=stateFormationChance(i);
   S.settled[i]=1500;const mature=stateFormationChance(i);S.settled[i]=2000;const established=stateFormationChance(i);
   S.farm[i]=0;growth();const abandoned=S.settled[i];S.pop[i]=0;growth();return {fresh,young,mature,established,abandoned,empty:S.settled[i]}})()`);
  assert.equal(result.fresh,0);assert.equal(result.young,0);assert.ok(result.mature>0);assert.ok(result.established>result.mature);
  assert.equal(result.abandoned,1998);assert.equal(result.empty,0);
 });
 await t.test('valley settlement density preserves viable highland chiefdoms',()=>{
  a.start();const r=a.inspect(`(()=>{const i=cellAt(18,-97),rough=WD.rough[i];S.farm[i]=S.grain[i]=1;S.settled[i]=1500;S.pop[i]=WD.area[i]*1.8;S.s[i]=.6;S.circE[i]=.9;
   try{WD.rough[i]=0;const flat=stateFormationChance(i);WD.rough[i]=.8;return {flat,valley:stateFormationChance(i)}}finally{WD.rough[i]=rough}})()`);
  assert.equal(r.flat,0);assert.ok(r.valley>0);
 });
 await t.test('institutions enable territorial growth; river organization supports stable regional kingdoms',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(32,45.5),o=S.pols[newPolity(c,null)];o.cells=20;
   const early={capacity:governingCapacity(o),expansion:expansionReadiness(o),decay:interiorDecay(o)};
   S.irrig[c]=1;const river={capacity:governingCapacity(o),expansion:expansionReadiness(o),decay:interiorDecay(o)};
   S.admin[c]=S.law[c]=S.roads[c]=S.paper[c]=1;const mature={capacity:governingCapacity(o),expansion:expansionReadiness(o)};
   return {early,river,mature}})()`);
  assert.equal(r.early.expansion,0);assert.ok(r.river.capacity>r.early.capacity);assert.ok(r.river.capacity>r.early.capacity);
  assert.ok(r.river.decay<r.early.decay);assert.ok(r.mature.capacity>r.river.capacity);assert.equal(r.mature.expansion,1);
 });
 await t.test('accounting alone cannot produce an empire or bypass the early territorial ceiling',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(50,10),o=S.pols[newPolity(c,null)];S.admin[c]=1;o.adm=1;o.cells=40;o.pop=2000000;
   const early={expansion:expansionReadiness(o),tier:tierOf(o)};S.law[c]=S.roads[c]=1;return {early,later:{expansion:expansionReadiness(o),tier:tierOf(o)}}})()`);
  assert.equal(r.early.expansion,0);assert.equal(r.early.tier,'Kingdom');assert.ok(r.later.expansion>0);assert.equal(r.later.tier,'Empire');
 });
 await t.test('advanced settlers retain governing skills and pastoral growth needs transport',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(18,-97);S.farm[c]=S.grain[c]=1;S.pop[c]=WD.area[c]*3;S.admin[c]=.85;S.settled[c]=0;
   const settlers=stateFormationChance(c),o={kind:'horde',capital:c,cells:30};S.admin[c]=0;
   const foot=expansionReadiness(o);S.horse[c]=S.caval[c]=1;return {settlers,foot,mounted:expansionReadiness(o)}})()`);
  assert.ok(r.settlers>0);assert.ok(r.foot<.001);assert.ok(r.mounted>r.foot);
 });
 await t.test('river towns can develop accounting before a large empire exists',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(32,45.5),o={capital:c,pop:350000,cells:4,coastN:0,cult:1,press:1};S.farm[c]=1;
   const dry=inventionChance(o,6);S.irrig[c]=1;return {dry,river:inventionChance(o,6),rv:WD.rv[c]}})()`);
  assert.equal(r.dry,0);assert.ok(r.river>0);
 });
 await t.test('a capital victory yields tribute when direct annexation exceeds governing capacity',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(32,45.5),d=cellAt(34,43),o=S.pols[newPolity(c,null)],v=S.pols[newPolity(d,null)];
   o.cells=20;v.cells=10;const war=declareWar([o],[v],null,false,false,false);S.r=()=>0;decisive(o,v,war);
   return {owner:S.pol[d],victim:v.id,over:v.over,winner:o.id,tribute:o.tribs}})()`);
  assert.equal(r.owner,r.victim);assert.equal(r.over,r.winner);assert.equal(r.tribute,1);
 });
 await t.test('forest travel is slower before roads and the distance search stays bounded',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(50,10),j=WD.nb[c*4],id=newPolity(c,null);S.pol[j]=id;S.forest[j]=1;
   distBFS();const forest=S.dist[j];S.roads[j]=1;distBFS();return {forest,road:S.dist[j]}})()`);
  assert.ok(r.forest>r.road);assert.ok(r.road>0);
 });
});
