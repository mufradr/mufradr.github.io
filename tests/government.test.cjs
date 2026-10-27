const test=require('node:test'),assert=require('node:assert/strict');
const {loadCore}=require('./core-harness.cjs');
test('provincial government, gradual decline and bounded dependency obligations',async t=>{
 const a=loadCore();a.earth();
 function prepare(){a.start();return a.inspect(`(()=>{S.year=500;P.warRate=P.crisis=P.migration=0;S.pol.fill(0);S.pop.fill(0);S.alive=[];const start=cellAt(32,45.5),cells=[start];for(let h=0;cells.length<24&&h<cells.length;h++)for(let d=0;d<4&&cells.length<24;d++){const j=WD.nb[cells[h]*4+d];if(j>=0&&WD.land[j]&&!cells.includes(j))cells.push(j)}for(const i of cells){S.pop[i]=10000;S.eth[i]=0;S.integ[i]=.8;S.farm[i]=S.grain[i]=1;S.admin[i]=.7;S.K[i]=15000}const id=newPolity(start,null),o=S.pols[id];o.cells=cells.length;o.pop=cells.length*10000;o.tax=10000;o.trade=0;o.cplx=.2;o.treas=.4;o.ineq=.25;o.warC=0;o.h=10;o.integ=.8;o.mandate=1;o.infrastructureFunding=1;for(const i of cells){S.pol[i]=id;S.taken[i]=400;S.dist[i]=i===start?0:5;S.governor[i]=id;S.control[i]=S.loyalty[i]=.9}globalThis.govSite={id,cells,i:cells.at(-1)};return govSite})()`)}
 function annual(n,code=''){return a.inspect(`(()=>{const {id,cells,i}=govSite,o=S.pols[id];for(let n=0;n<${n};n++){S.year++;${code};beginGovernmentYear();for(const c of cells)if(S.pol[c]===id)provincialGovernment(c,o,true)}return {control:S.control[i],loyalty:S.loyalty[i],autonomy:S.autonomy[i],integration:S.integ[i],fiscal:o.fiscalStress}})()`)}
 await t.test('persistent trouble erodes control, tax collection and loyalty over decades',()=>{
  prepare();const first=annual(1,'o.treas=-2;o.burden=3;o.mandate=.1;o.infrastructureFunding=0;S.dist[i]=65535;S.integ[i]=.15');
  assert.ok(first.control>.87&&first.loyalty>.87,'one bad year cannot erase established government');
  const later=annual(70,'o.treas=-2;o.burden=3;o.mandate=.1;o.infrastructureFunding=0;S.dist[i]=65535');
  assert.ok(later.control<first.control*.5&&later.loyalty<first.loyalty*.5);assert.ok(later.autonomy>.35);assert.ok(later.integration<.15);
  const collection=a.inspect('S.control[govSite.i]*(1-.55*S.autonomy[govSite.i])');assert.ok(collection<.3);assert.equal(a.state.pol[govSite.i],govSiteId());
 });
 function govSiteId(){return a.inspect('govSite.id')}
 await t.test('solvent legitimate government and reconnection recover without recreating the state',()=>{
  prepare();const low=annual(100,'o.treas=-2;o.burden=3;o.mandate=.1;o.infrastructureFunding=0;S.dist[i]=65535;S.integ[i]=.2');
  const recovered=annual(150,'o.treas=.5;o.burden=.6;o.mandate=1;o.infrastructureFunding=1;S.dist[i]=3;S.integ[i]=Math.min(.9,S.integ[i]+.005)');
  assert.ok(recovered.control>low.control+.4);assert.ok(recovered.loyalty>low.loyalty+.5);assert.ok(recovered.fiscal<.01);assert.ok(recovered.autonomy<low.autonomy);assert.equal(a.state.pol[a.inspect('govSite.i')],govSiteId());
 });
 await t.test('tax aggregation uses provincial control and concessions; same-year recalculation does not age government',()=>{
  prepare();const result=a.inspect(`(()=>{const o=S.pols[govSite.id],L=new Int32Array([govSite.i]),phase={s:S,w:WD,r:S.r,pols:S.pols,L,pol:S.pol,pop:S.pop,sampleNow:false};for(const key of ['tax','pop','controlTotal','loyaltyTotal','autonomyTotal'])o[key]=0;aggregatePoliticalCells(phase,0,1);const strong=o.tax;o.tax=0;S.control[govSite.i]=.3;S.autonomy[govSite.i]=.6;aggregatePoliticalCells(phase,0,1);const weak=o.tax;const first=beginGovernmentYear(),again=beginGovernmentYear();return {strong,weak,first,again}})()`);
  assert.ok(result.weak<result.strong*.3);assert.equal(result.first,true);assert.equal(result.again,false);
 });
 await t.test('negotiated autonomy creates a bounded vassal region without erasing people, works or fiscal distress',()=>{
  prepare();const result=a.inspect(`(()=>{const {id,cells}=govSite,o=S.pols[id];S.year=600;P.crisis=1;o.born=400;o.treas=-1.5;beginGovernmentYear();for(const i of cells){if(i===o.capital)continue;S.control[i]=.35;S.loyalty[i]=.45;S.autonomy[i]=.7;S.taken[i]=400;provincialGovernment(i,o,false)}const pop=S.pop.reduce((n,v)=>n+v,0),people=S.eth.slice(),works=S.works.slice();governmentRegionalStep();const child=S.pols.at(-1);return {id,child,parent:S.pol[o.capital],popBefore:pop,popAfter:S.pop.reduce((n,v)=>n+v,0),samePeople:S.eth.every((v,i)=>v===people[i]),sameWorks:S.works.every((v,i)=>v===works[i]),wars:S.wars.length,issues:simulationIssues()}})()`);
  assert.equal(result.parent,result.id);assert.equal(result.child.over,result.id);assert.ok(result.child.cells<=4&&result.child.cells>=1);assert.equal(result.child.treas,-1.5);assert.equal(result.popBefore,result.popAfter);assert.ok(result.samePeople&&result.sameWorks);assert.equal(result.wars,0);assert.deepEqual(result.issues,[]);
 });
 await t.test('rebellion is regional; routine instability does not authorize sudden disintegration',()=>{
  prepare();const result=a.inspect(`(()=>{const {id,cells}=govSite,o=S.pols[id];S.year=600;P.crisis=P.warRate=1;o.born=400;beginGovernmentYear();for(const i of cells){if(i===o.capital)continue;S.control[i]=.15;S.loyalty[i]=.1;S.autonomy[i]=.6;S.taken[i]=400;provincialGovernment(i,o,false)}o.psi=8;o.shock=.3;o.mandate=.2;o.fiscalStress=.9;const ordinary=exceptionalGovernmentCrisis(o);governmentRegionalStep();o.shock=1.5;return {ordinary,exceptional:exceptionalGovernmentCrisis(o),parent:S.pol[o.capital],id,war:S.wars.at(-1),child:S.pols.at(-1)}})()`);
  assert.equal(result.ordinary,false);assert.equal(result.exceptional,true);assert.equal(result.parent,result.id);assert.equal(result.child.over,0);assert.ok(result.war.civil);assert.ok(result.child.cells<5);
 });
 function dependency(){prepare();return a.inspect(`(()=>{const parent=S.pols[govSite.id],c=govSite.cells.at(-1),id=newPolity(c,null,{base:'Dependent'}),child=S.pols[id];parent.tax=10000;parent.pop=500000;parent.control=parent.loyalty=1;parent.autonomy=0;child.pop=10000;child.cells=3;child.tax=2000;child.trade=0;child.cplx=.1;child.treas=.3;child.ineq=.25;child.warC=0;child.integ=.8;child.control=1;child.autonomy=0;setDependency(child,parent);globalThis.govDependent=id;return {parent:parent.id,child:id}})()`)}
 await t.test('tribute is a matched payment and receipt, constrained to domestic means',()=>{
  const ids=dependency();const result=a.inspect(`(()=>{governmentRevenueStep(false);const child=S.pols[govDependent],parent=S.pols[govSite.id];governmentBudget(child,child.capital,100,child.domesticRevenue,50);governmentBudget(parent,parent.capital,100,parent.domesticRevenue,50);return {child:child.budget,parent:parent.budget,ledger:S.tributeLedger}})()`);
  assert.ok(result.child.tributeOut>0);assert.equal(result.child.tributeOut,result.parent.tributeIn);assert.equal(result.parent.revenue,result.parent.domesticRevenue+result.parent.tributeIn);assert.equal(result.child.spending,result.child.administration+result.child.military+result.child.infrastructure+result.child.tributeOut);assert.ok(result.child.tributeOut<=result.child.domesticRevenue*.12);assert.equal(result.ledger.transfers[0].from,ids.child);assert.equal(result.ledger.paid,result.ledger.received);assert.deepEqual(a.inspect('simulationIssues()'),[]);a.inspect('S.tributeLedger.transfers[0].paid*=.5');assert.ok(a.inspect('simulationIssues()').some(s=>s.includes('Tribute')));
 });
 await t.test('debt relief balances against total receipts when a protector receives tribute',()=>{
  dependency();const result=a.inspect(`(()=>{governmentRevenueStep(false);const o=S.pols[govSite.id];o.treas=-1.8;o.cplx=1;S.law[o.capital]=1;const r=S.r;try{S.r=()=>.01;statecraft(o,o.capital,S.year)}finally{S.r=r}return o.budget})()`);
  assert.ok(result.tributeIn>0&&result.debtRelief>0);assert.ok(Math.abs(result.closingTreasury-result.openingTreasury-.04*(result.balance-result.surplusDiscarded+result.debtRelief)/result.revenue)<1e-10);assert.deepEqual(a.inspect('simulationIssues()'),[]);
 });
 await t.test('fiscal exhaustion withholds tribute without minting money or erasing the relationship',()=>{
  dependency();const result=a.inspect(`(()=>{const o=S.pols[govDependent];o.cplx=2;o.treas=-2;governmentRevenueStep(false);return {over:o.over,d:o.dependency,income:S.pols[govSite.id].tributeIn,ledger:S.tributeLedger}})()`);
  assert.ok(result.over>0);assert.equal(result.d.paid,0);assert.equal(result.d.withheld,1);assert.equal(result.income,0);assert.ok(result.ledger.withheld>0);
 });
 await t.test('nested vassals cannot forward the same tribute repeatedly or form cycles',()=>{
  dependency();const result=a.inspect(`(()=>{const p=S.pols[govSite.id],middle=S.pols[govDependent],id=newPolity(govSite.cells[5],null),child=S.pols[id];child.tax=50000;child.pop=10000;child.cplx=.1;child.control=1;child.autonomy=0;setDependency(child,middle);const cycle=setDependency(p,child);governmentRevenueStep(false);return {cycle,over:p.over,middle,child,ledger:S.tributeLedger,issues:simulationIssues()}})()`);
  assert.equal(result.cycle,false);assert.equal(result.over,0);assert.ok(result.middle.tributeOut<=result.middle.domesticRevenue*.12);assert.ok(result.middle.tributeIn>result.middle.tributeOut);assert.deepEqual(result.issues,[]);
 });
 await t.test('a capable protector joins a defensive war; an exhausted one loses credibility',()=>{
  for(const exhausted of [false,true]){dependency();const result=a.inspect(`(()=>{const p=S.pols[govSite.id],child=S.pols[govDependent],enemy=S.pols[newPolity(govSite.cells[4],null)];if(${exhausted}){p.treas=-2;p.fiscalStress=1}const before=child.dependency.protection,w=declareWar([enemy],[child],null,false,false,false);return {defenders:w.d,parent:p.id,before,after:child.dependency.protection,issues:simulationIssues()}})()`);
   assert.equal(result.defenders.includes(result.parent),!exhausted);if(exhausted)assert.ok(result.after<result.before);assert.deepEqual(result.issues,[]);
  }
 });
 await t.test('protectors do not join vassal aggression and explicit war ends dependence',()=>{
  dependency();const result=a.inspect(`(()=>{const p=S.pols[govSite.id],child=S.pols[govDependent],enemy=S.pols[newPolity(govSite.cells[4],null)];const w=declareWar([child],[enemy],null,false,false,false),joined=w.a.includes(p.id);declareWar([child],[p],null,false,false,false);return {joined,over:child.over,dependency:child.dependency,issues:simulationIssues()}})()`);
  assert.equal(result.joined,false);assert.equal(result.over,0);assert.equal(result.dependency,null);assert.deepEqual(result.issues,[]);
 });
 await t.test('prolonged protection failure and withholding lead to independence; recovery eases pressure',()=>{
  dependency();const result=a.inspect(`(()=>{const parent=S.pols[govSite.id],o=S.pols[govDependent];o.dependency.protection=.1;o.dependency.loyalty=.25;o.dependency.pressure=.7;o.dependency.since=400;parent.mandate=.05;parent.fiscalStress=1;parent.tax=10;parent.pop=1000;o.cplx=2;for(let n=0;n<100&&o.over;n++){S.year++;o.dependency.protection=.05;governmentRevenueStep(true)}return {over:o.over,year:S.year,wars:S.wars.length}})()`);
  assert.equal(result.over,0);assert.ok(result.year>500);assert.equal(result.wars,0);
  dependency();const recovered=a.inspect(`(()=>{const o=S.pols[govDependent];o.dependency.pressure=.7;o.dependency.protection=.4;for(let n=0;n<80;n++){S.year++;governmentRevenueStep(true)}return o.dependency})()`);assert.ok(recovered.pressure<.4);assert.ok(recovered.loyalty>.6);assert.ok(recovered.protection>.7);
 });
 await t.test('owned colonies share provincial concessions without paying a second layer of tribute',()=>{
  prepare();const result=a.inspect(`(()=>{const i=15790;S.pop[i]=150000;S.eth[i]=0;for(const k of [0,3,5,6,12,14,15,17,19,22])S.tk[k][i]=1;const id=newPolity(i,null),home=S.pols[id];home.mandate=.3;home.fiscalStress=.8;S.year=1500;const v=traceVoyage(i,250*Math.PI/180,voyageRange(i)),j=v.to;S.pop[j]=0;S.pol[j]=0;S.eth[j]=S.eth2[j]=-1;S.seaRoutes.set('known',{...v,born:1480,last:1500});registerColony(v,2000,false);const colony=S.colonies.get(j);S.governor[j]=id;S.control[j]=.2;S.loyalty[j]=.25;S.autonomy[j]=.8;S.year=1505;colonyGovernmentStep();governmentRevenueStep(false);return {owner:S.pol[j],id,autonomy:colony.autonomy,provincial:S.autonomy[j],tribute:home.tributeOut,ledger:S.tributeLedger,issues:simulationIssues()}})()`);
  assert.equal(result.owner,result.id);assert.ok(result.autonomy>=.79);assert.equal(result.autonomy,result.provincial);assert.equal(result.tribute,0);assert.equal(result.ledger.transfers.length,0);assert.deepEqual(result.issues,[]);
 });
 await t.test('overseas separation negotiates with loyal communities but can contest a hostile breakaway',()=>{
  for(const loyal of [true,false]){prepare();const result=a.inspect(`(()=>{P.warRate=1;const i=15790;S.pop[i]=150000;S.eth[i]=0;for(const k of [0,3,5,6,12,14,15,17,19,22])S.tk[k][i]=1;const id=newPolity(i,null),home=S.pols[id];home.mandate=1;home.S=.8;home.psi=0;S.year=1500;const v=traceVoyage(i,250*Math.PI/180,voyageRange(i)),j=v.to;S.pop[j]=0;S.pol[j]=0;S.eth[j]=S.eth2[j]=-1;S.seaRoutes.set('known',{...v,born:1480,last:1500});registerColony(v,2000,false);const c=S.colonies.get(j);S.pop[j]=c.settlers=c.lastPopulation=60000;c.autonomy=1;S.governor[j]=id;S.autonomy[j]=1;S.loyalty[j]=${loyal?.8:.1};S.year=1700;S.seaRoutes.get('known').last=S.year;colonyGovernmentStep();return {id,owner:S.pol[j],administration:c.administration,wars:S.wars.length,issues:simulationIssues()}})()`);
   assert.notEqual(result.owner,result.id);assert.equal(result.administration,'independent');assert.equal(result.wars,loyal?0:1);assert.deepEqual(result.issues,[]);
  }
 });
 await t.test('a dynasty changes without resetting the treasury, province identity, infrastructure or technical knowledge',()=>{
  prepare();const result=a.inspect(`(()=>{const o=S.pols[govSite.id];o.treas=-1.2;o.E=1;const before={people:S.eth[govSite.i],stock:S.foodStock[govSite.i],works:S.works[govSite.i],tech:S.admin[govSite.i],owner:S.pol[govSite.i]},dyn=o.dyn;const r=S.r;try{S.r=()=>.4;succession(o)}finally{S.r=r}return {before,after:{people:S.eth[govSite.i],stock:S.foodStock[govSite.i],works:S.works[govSite.i],tech:S.admin[govSite.i],owner:S.pol[govSite.i]},treasury:o.treas,shock:o.successionShock,gen:o.gen,rulers:o.rulers.length,oldDyn:dyn,newDyn:o.dyn}})()`);
  assert.deepEqual(result.after,result.before);assert.equal(result.treasury,-1.2);assert.ok(result.shock>0);assert.equal(result.rulers,1);assert.equal(result.gen,1);
 });
 await t.test('development-1 saves migrate without fabricated tribute or mutating the caller; new fields resume exactly',async()=>{
  dependency();for(let n=0;n<3;n++)a.step();const file=await a.encode(a.save('Government')),old=await a.decode(file);old.engineVersion='0.17.0-dev.1';for(const k of ['governmentVersion','control','loyalty','autonomy','governor','governmentYear','tributeLedger'])delete old.state[k];const b=loadCore();b.restore(old);assert.equal(old.state.control,undefined);assert.equal(b.state.tributeLedger,null);assert.ok(b.state.control[a.inspect('govSite.cells[0]')]>0);assert.deepEqual(b.inspect('simulationIssues()'),[]);
  const c=loadCore();c.restore(await c.decode(file));for(let n=0;n<10;n++){a.step();c.step()}assert.deepEqual(a.save('same').state,c.save('same').state);
  for(const field of ['control','loyalty','autonomy']){const bad=await c.decode(file);bad.state[field][a.inspect('govSite.cells[0]')]=1.5;assert.throws(()=>c.restore(bad),new RegExp(field))}
  const bad=await c.decode(file);delete bad.state.governmentVersion;assert.throws(()=>c.restore(bad),/government schema/);
 });
 a.inspect('delete globalThis.govSite;delete globalThis.govDependent');
});
