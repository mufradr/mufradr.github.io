const test=require('node:test'),assert=require('node:assert/strict');
const {loadCore}=require('./core-harness.cjs');

test('transport connects subsistence, commerce, contact and government',async t=>{
 const a=loadCore();a.earth();
 function prepare(){a.start();return a.inspect(`(()=>{
  S.year=1500;P.migration=0;P.seafaring=P.techDiff=P.faith=P.disease=1;S.pop.fill(0);S.pol.fill(0);S.K.fill(1);S.roads.fill(0);S.herd.fill(0);S.farm.fill(0);
  const from=15790;S.pop[from]=100000;S.eth[from]=0;S.sail[from]=S.nav[from]=S.ocean[from]=S.farm[from]=1;
  const v=traceVoyage(from,250*Math.PI/180,voyageRange(from)),to=v.to;S.pop[to]=50000;S.eth[to]=1;S.farm[to]=1;
  S.K[from]=200000;S.K[to]=10000;const home=newPolity(from,null),host=newPolity(to,null);
  S.seaRoutes.set('known',{...v,born:1480,last:1500});globalThis.networkSites={from,to,home,host};return networkSites;
 })()`)}
 await t.test('food is limited by real surplus, shipping capacity and spoilage',()=>{
  const p=prepare(),r=a.inspect(`(()=>{const {from,to}=networkSites,before=S.K[from]+S.K[to];transportEconomy();return {before,after:S.K[from]+S.K[to],sent:200000-S.K[from],received:S.K[to]-10000,available:networkEconomy.available[from],pop:S.pop[from]+S.pop[to]}})()`);
  assert.ok(r.sent>0&&r.sent<=15000);assert.ok(r.received>0&&r.received<r.sent);assert.ok(Math.abs(r.received-r.sent*.8)<.02);
  assert.ok(r.after<r.before);assert.equal(r.pop,150000);assert.equal(a.state.K[p.from]>=a.state.pop[p.from],true);
 });
 await t.test('no surplus, absent routes, old routes and disabled sailing cannot supply a deficit',()=>{
  for(const change of ['S.K[networkSites.from]=50000','S.seaRoutes.clear()',"S.seaRoutes.get('known').last=1489",'P.seafaring=0']){
   const p=prepare();a.inspect(change+';transportEconomy()');assert.equal(a.state.K[p.to],10000,change);
  }
 });
 await t.test('duplicate routes cannot exhaust a producer or create unlimited income',()=>{
  const p=prepare();a.inspect(`for(let k=0;k<100;k++)S.seaRoutes.set(String(k),{...S.seaRoutes.get('known')});transportEconomy()`);
  assert.ok(a.state.K[p.from]>=185000);assert.ok(a.state.K[p.to]<=22000.1);
  const economy=a.inspect('networkEconomy.states.get(networkSites.home)');assert.ok(economy.trade<=8000);
 });
 await t.test('roads link adjacent food markets; hostile borders interrupt relief',()=>{
  prepare();const r=a.inspect(`(()=>{S.seaRoutes.clear();const {from,home}=networkSites,j=[0,1,2,3].map(d=>WD.nb[from*4+d]).find(j=>j>=0&&WD.land[j]);S.pop[j]=50000;S.K[j]=10000;S.farm[j]=1;S.roads[from]=S.roads[j]=1;const id=newPolity(j,null);transportEconomy();const fed=S.K[j];S.K[from]=200000;S.K[j]=10000;declareWar([S.pols[home]],[S.pols[id]],null,false,false,false);transportEconomy();return {fed,blocked:S.K[j]}})()`);
  assert.ok(r.fed>10000);assert.equal(r.blocked,10000);
 });
 await t.test('commerce, supplies and ideas stop at war but charts still permit naval campaigning',()=>{
  const p=prepare(),r=a.inspect(`(()=>{const {from,to,home,host}=networkSites;transportEconomy();const peaceTrade=networkEconomy.states.get(home).trade;S.paper[from]=1;S.paper[to]=0;declareWar([S.pols[home]],[S.pols[host]],null,false,false,false);S.year=1515;transportEconomy();seaTrade();return {peaceTrade,warTrade:networkEconomy.states.get(home).trade,paper:S.paper[to],capacity:S.K[to],routeLast:S.seaRoutes.get('known').last,charts:overseasTransport().has(from),supply:colonySupply({cell:to,homeState:home})}})()`);
  assert.ok(r.peaceTrade>0);assert.equal(r.warTrade,0);assert.equal(r.paper,0);assert.equal(r.routeLast,1500);assert.equal(r.charts,true);assert.equal(r.supply,-1);
  assert.equal(a.state.pol[p.to],p.host);
 });
 await t.test('shortages and lost commerce affect treasury and legitimacy through statecraft',()=>{
  function assess(war){prepare();return a.inspect(`(()=>{const {from,to,home,host}=networkSites;${war?'declareWar([S.pols[home]],[S.pols[host]],null,false,false,false);':''}transportEconomy();const o=S.pols[host];o.cells=4;o.pop=50000;o.tax=5000;o.trade=0;o.cplx=.5;o.treas=.3;o.ineq=.25;o.shock=0;o.mandate=1;o.press=1;o.S=.5;statecraft(o,to,S.year);return {trade:o.trade,tax:o.tax,stress:o.foodStress,imports:o.foodImports,mandate:o.mandate,burden:o.burden}})()`)}
  const peace=assess(false),war=assess(true);assert.ok(peace.trade>war.trade);assert.ok(peace.tax>war.tax);assert.ok(peace.imports>0);assert.equal(war.imports,0);assert.ok(war.stress>peace.stress);assert.ok(war.mandate<peace.mandate);assert.ok(war.burden>peace.burden);
 });
 await t.test('empty caravan stops no longer create tax revenue',()=>{
  prepare();const r=a.inspect(`(()=>{const {from,to,home}=networkSites;S.seaRoutes.clear();S.car[from]=S.car[to]=1;S.routes.push({a:from,b:to,path:[from,to],last:S.year});transportEconomy();const full=networkEconomy.states.get(home).trade;S.pop[from]=0;transportEconomy();return {full,empty:networkEconomy.states.get(home).trade}})()`);assert.ok(r.full>0);assert.equal(r.empty,0);
 });
 await t.test('caravans reject hostile intermediate jurisdictions',()=>{
  prepare();const r=a.inspect(`(()=>{const {from,to,home}=networkSites,c=cellAt(32,45.5),third=newPolity(c,null);S.pop[c]=10000;const route={a:from,b:to,path:[from,c,to],last:S.year},before=landRouteTrading(route);declareWar([S.pols[home]],[S.pols[third]],null,false,false,false);return {before,after:landRouteTrading(route)}})()`);assert.equal(r.before,true);assert.equal(r.after,false);
 });
 await t.test('trade spreads faith and existing outbreaks alongside knowledge',()=>{
  prepare();const r=a.inspect(`(()=>{const {from,to}=networkSites;S.paper[from]=1;S.paper[to]=0;S.rel[from]=0;S.rel[to]=-1;S.rels=[{id:0,kind:'universal',miss:1}];S.infect[from]=2;S.ob[from]=0;S.outbreaks=[{id:0,done:false,cells:1,spread:[],year:1500}];S.inf=[from];const r=S.r;try{S.r=()=>0;tradeContact(from,to,.08)}finally{S.r=r}return {paper:S.paper[to],faith:S.rel[to],infect:S.infect[to],outbreak:S.ob[to],count:S.inf.filter(i=>i===to).length,cells:S.outbreaks[0].cells}})()`);
  assert.ok(r.paper>0);assert.equal(r.faith,0);assert.equal(r.infect,3);assert.equal(r.outbreak,0);assert.equal(r.count,1);assert.equal(r.cells,2);
 });
 await t.test('contact respects faith/knowledge settings, ethnic faith limits and immunity',()=>{
  prepare();const r=a.inspect(`(()=>{const {from,to}=networkSites;S.paper[from]=1;S.paper[to]=0;S.rel[from]=0;S.rel[to]=-1;S.rels=[{id:0,kind:'ethnic',fam:-999,miss:1}];S.infect[from]=2;S.ob[from]=0;S.outbreaks=[{id:0,done:false,cells:1,spread:[],year:1500}];S.inf=[from];S.immune[to]=1;P.techDiff=0;const r=S.r;try{S.r=()=>0;tradeContact(from,to,.08);const ethnic=S.rel[to];S.rels[0].kind='universal';P.faith=0;tradeContact(from,to,.08);return {ethnic,faith:S.rel[to],paper:S.paper[to],infect:S.infect[to]}}finally{S.r=r}})()`);
  assert.deepEqual(r,{ethnic:-1,faith:-1,paper:0,infect:0});
 });
 await t.test('first landfall respects disabled diffusion and new epidemic frequency',()=>{
  prepare();const r=a.inspect(`(()=>{const {from,to}=networkSites;S.paper[from]=1;S.paper[to]=0;S.dp[from]=1;S.dp[to]=0;S.xcrops[from]=S.xcrops[to]=0;P.techDiff=P.disease=0;const r=S.r;try{S.r=()=>0;seaContact(S.seaRoutes.get('known'));const blocked={paper:S.paper[to],crops:S.xcrops[to],outbreaks:S.outbreaks.length};P.techDiff=P.disease=1;seaContact(S.seaRoutes.get('known'));return {blocked,paper:S.paper[to],crops:S.xcrops[to],outbreaks:S.outbreaks.length}}finally{S.r=r}})()`);
  assert.deepEqual(r.blocked,{paper:0,crops:0,outbreaks:0});assert.ok(r.paper>0);assert.ok(r.crops>0);assert.ok(r.outbreaks>0);
 });
 await t.test('persistent regional famine accumulates gradually and reports without chronicle spam',()=>{
  prepare();const r=a.inspect(`(()=>{const {from,to,host}=networkSites,o=S.pols[host];S.seaRoutes.clear();o.cells=4;o.cplx=.5;o.treas=.3;o.ineq=.25;o.pop=50000;o.press=1;o.S=.5;o.mandate=1;o.shock=0;
   for(let y=1500;y<=1565;y++){S.year=y;S.K[from]=100000;S.K[to]=10000;transportEconomy();o.tax=5000;o.trade=0;o.mandate=Math.min(1,o.mandate+.006);o.shock*=.92;statecraft(o,to,y)}
   return {stress:o.foodStress,mandate:o.mandate,reports:S.chron.filter(x=>x.t==='famine').map(x=>x.y)}})()`);
  assert.ok(r.stress>.7);assert.ok(r.mandate<.5);assert.equal(r.reports.length,2);assert.ok(r.reports[1]-r.reports[0]>=60);
 });
 await t.test('old saves resume with derived budgets rebuilt and preserve exact new continuation',async()=>{
  prepare();a.inspect('transportEconomy();politics()');const data=await a.decode(await a.encode(a.save('Connected economy')));data.engineVersion='0.15.0';
  const b=loadCore();b.restore(data);assert.equal(b.inspect('networkEconomy.state===S'),false);
  for(let k=0;k<12;k++){a.step();b.step()}
  assert.deepEqual(a.save('same').state,b.save('same').state);assert.deepEqual(a.inspect('simulationIssues()'),[]);
  const bad=await a.decode(await a.encode(a.save()));bad.state.pols[bad.state.alive[0]].foodStress=NaN;assert.throws(()=>b.restore(bad),/foodStress/);
 });
});
