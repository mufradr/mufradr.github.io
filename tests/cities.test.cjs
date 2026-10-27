const test=require('node:test'),assert=require('node:assert/strict');const {loadCore}=require('./core-harness.cjs');
test('urban communities, learning and bounded demographic change',async t=>{
 const a=loadCore();a.earth();
 function prepare(){a.start();return a.inspect(`(()=>{S.year=1400;P.warRate=P.crisis=P.migration=0;P.assim=P.faith=P.mixing=1;P.invent=0;const i=cellAt(32,45.5),j=WD.nb[i*4+1];S.pop[i]=100000;S.pop[j]=30000;S.eth[i]=0;S.eth[j]=1;S.eth2[i]=S.eth2[j]=-1;S.mix[i]=S.mix[j]=0;S.rel[i]=S.rel[j]=-1;S.faith2[i]=S.faith2[j]=-2;S.faithMix[i]=S.faithMix[j]=0;for(const c of [i,j]){S.farm[c]=S.grain[c]=S.admin[c]=S.roads[c]=S.paper[c]=1;S.integ[c]=S.control[c]=S.loyalty[c]=.9;S.works[c]=1;S.K[c]=S.pop[c]*1.5}const id=newPolity(i,null),o=S.pols[id];S.pol[j]=id;o.pop=130000;o.cells=2;o.cplx=.3;o.treas=.5;o.ineq=.25;o.infrastructureFunding=1;o.mandate=1;S.city[i]=S.cities.length;const c=newCityRecord(i,'Old Town');c.population=c.peak=10000;c.institutions=.5;c.scholarship=.4;S.cities.push(c);S.firstTech[6]={y:1000,cell:i};S.firstTech[14]={y:1200,cell:i};globalThis.urbanSite={i,j,id,city:S.city[i]};return urbanSite})()`)}
 function years(n,code=''){a.inspect(`(()=>{const {i,id,city}=urbanSite,c=S.cities[city],o=S.pols[id];for(let n=0;n<${n};n++){S.year++;${code};urbanStep()}})()`)}
 await t.test('urban residents remain a subset and relocation creates no extra people or mouths',()=>{
  const {i,city}=prepare(),population=a.state.pop[i];years(80);const c=a.state.cities[city];assert.ok(c.population>10000&&c.population<population*.4);assert.equal(a.state.pop[i],population);a.inspect('transportEconomy()');assert.ok(a.state.foodLedger.demand>=population);assert.equal(a.inspect('cityPopulation(S.cities[urbanSite.city])'),c.population);
 });
 await t.test('food access, security, trade and maintained works determine growth and decline',()=>{
  let {city}=prepare();years(50,'S.car[i]=1');const secure=a.state.cities[city].population;
  ({city}=prepare());years(50,'S.K[i]=S.pop[i]*.4;S.works[i]=.1;S.control[i]=S.loyalty[i]=0;o.shock=1');const damaged=a.state.cities[city].population;assert.ok(damaged<3000);assert.ok(secure>damaged*4);assert.ok(a.state.cities[city].institutions<.5);
 });
 await t.test('cities shrink with demographic shocks and can recover without changing name or founding date',()=>{
  const {i,city}=prepare(),c=a.state.cities[city],born=c.born;a.state.pop[i]=10000;years(1);assert.ok(c.population<1100);assert.equal(c.name,'Old Town');assert.equal(c.born,born);a.state.pop[i]=100000;years(100,'S.K[i]=150000');assert.ok(c.population>10000);assert.ok(c.peak>=c.population);assert.deepEqual(a.inspect('simulationIssues()'),[]);
 });
 await t.test('urban workers and mobilized residents share civilian labor once',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,id,city}=urbanSite,o=S.pols[id];S.cities[city].population=20000;o.military.year=S.year;o.military.populationBasis=100000;o.military.mobilized=5000;const factor=civilianHarvestLabor(i),expected=1-.05-.65*.2*(1-.05);return {factor,expected,people:S.pop[i]}})()`);assert.ok(Math.abs(r.factor-r.expected)<1e-9);assert.equal(r.people,100000);
 });
 await t.test('actual urban residents support civic collection and administration instead of the whole province',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,id}=urbanSite;politics();const o=S.pols[id];return {urban:o.cityPop,pop:o.pop,civic:o.civicPopulation,bonus:urbanAdministration(o),site:innovationSite(o),i}})()`);assert.ok(r.urban>0&&r.urban<r.pop*.4);assert.ok(r.civic>0);assert.ok(r.bonus>0&&r.bonus<=8);assert.equal(r.site,r.i);
 });
 await t.test('a scholarly provincial town can be the invention site instead of the political capital',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,j,id}=urbanSite;S.city[j]=S.cities.length;const c=newCityRecord(j,'University Town');c.population=c.peak=20000;c.institutions=c.scholarship=1;S.cities.push(c);S.cities[S.city[i]].scholarship=.1;politics();const o=S.pols[id];return {site:innovationSite(o),j,capital:o.capital}})()`);assert.equal(r.site,r.j);assert.notEqual(r.site,r.capital);
 });
 await t.test('archives preserve only learned techniques and gradually restore practice after political collapse',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,city,id}=urbanSite,c=S.cities[city];c.population=c.peak=20000;c.institutions=c.scholarship=1;for(let n=0;n<10;n++)updateUrbanKnowledge(c,5);const stored=c.knowledge[14];S.pol[i]=0;S.pols[id].alive=false;S.tk[14][i]=.05;S.tk[8][i]=0;updateUrbanKnowledge(c,5);const restored=S.tk[14][i];S.pop[i]=0;c.population=0;S.tk[14][i]=0;updateUrbanKnowledge(c,5);return {stored,restored,unknown:S.tk[8][i],abandoned:S.tk[14][i],name:c.name}})()`);assert.ok(r.stored>.5);assert.ok(r.restored>.05&&r.restored<.3);assert.equal(r.unknown,0);assert.equal(r.abandoned,0);assert.equal(r.name,'Old Town');
 });
 await t.test('scholarly centres reduce skill loss after collapse without making knowledge immortal',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,j,city}=urbanSite;S.pol[i]=S.pol[j]=0;S.pop[i]=S.pop[j]=1000;S.cities[city].population=500;S.cities[city].institutions=S.cities[city].scholarship=1;S.paper[i]=S.paper[j]=1;S.firstTech[14]={y:1200,cell:i};P.techDiff=0;P.techLoss=1;const others=[...WD.landIdx].filter(k=>k!==i&&k!==j);for(const k of others)S.pop[k]=0;for(let n=0;n<20;n++)techStep();return {protected:S.paper[i],unprotected:S.paper[j]}})()`);assert.ok(r.protected>r.unprotected);assert.ok(r.protected<1);
 });
 await t.test('stateless scholarship can innovate without bypassing coastal or territorial prerequisites',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,city}=urbanSite,c=S.cities[city];S.pol[i]=0;S.pop[i]=2000000;S.K[i]=3000000;c.population=c.peak=1000000;c.provincePopulation=S.pop[i];c.institutions=c.scholarship=1;for(const f of S.tk)f[i]=1;S.wheel[i]=S.nav[i]=S.law[i]=0;S.year=1405;P.invent=1;const random=S.r;try{S.r=()=>0;urbanStep()}finally{S.r=random}return {coast:WD.coast[i],wheel:S.wheel[i],navigation:S.nav[i],law:S.law[i]}})()`);assert.equal(r.coast,0);assert.equal(r.wheel,1);assert.equal(r.navigation,0);assert.equal(r.law,0);
 });
 await t.test('abandoned ruins cannot refresh archives from techniques left in an empty province',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,city}=urbanSite,c=S.cities[city];c.institutions=c.scholarship=1;updateUrbanKnowledge(c,5);const before=c.knowledge[14];S.pop[i]=0;c.population=0;S.paper[i]=1;for(let n=0;n<10;n++)updateUrbanKnowledge(c,5);return {before,after:c.knowledge[14]}})()`);assert.ok(r.before>0);assert.ok(r.after<r.before*.6);
 });
 function counts(people,faith){return a.inspect(`(()=>{let e=0,r=0,p=0;for(const i of [urbanSite.i,urbanSite.j]){p+=S.pop[i];e+=S.pop[i]*peopleShare(i,${people});r+=S.pop[i]*faithShare(i,${faith})}return {e,r,p}})()`)}
 await t.test('a small established minority survives without a shipping subsidy or assimilation',()=>{
  prepare();const r=a.inspect(`(()=>{const {j}=urbanSite;S.eth2[j]=2;S.mix[j]=.01;P.assim=P.mixing=0;for(let n=0;n<40;n++)mixPass();return {people:S.eth2[j],share:S.mix[j]}})()`);assert.equal(r.people,2);assert.ok(Math.abs(r.share-.01)<1e-7);
 });
 await t.test('fractional-population provinces retain valid identities through cleanup and emigration',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,j}=urbanSite;S.pop[j]=.75;S.eth2[j]=2;S.mix[j]=.45;mixPass();const minority=S.eth2[j];transferCommunity(j,i,.6);return {minority,people:S.eth[j],share:S.mix[j],population:S.pop[j]}})()`);assert.equal(r.minority,2);assert.equal(r.people,2);assert.ok(r.population>0&&r.share>=0&&r.share<=.5);
 });
 await t.test('migration preserves source and target minority counts and carries actual faiths with assimilation disabled',()=>{
  prepare();a.inspect(`S.eth2[urbanSite.i]=1;S.mix[urbanSite.i]=.2;S.rels=[{id:0,kind:'universal'}];S.rel[urbanSite.i]=0;S.faith2[urbanSite.i]=-1;S.faithMix[urbanSite.i]=.3;P.assim=P.faith=0`);const before=counts(1,-1);const moved=a.inspect('transferCommunity(urbanSite.i,urbanSite.j,5000)');assert.equal(moved,5000);const after=counts(1,-1);assert.ok(Math.abs(before.e-after.e)<.02);assert.ok(Math.abs(before.r-after.r)<.02);assert.equal(before.p,after.p);assert.ok(a.inspect('faithShare(urbanSite.j,0)')>0);
 });
 await t.test('a third substantial community is not silently substituted for an established minority',()=>{
  prepare();a.inspect('S.eth2[urbanSite.j]=2;S.mix[urbanSite.j]=.2');const before=a.state.pop[a.inspect('urbanSite.i')],moved=a.inspect('transferCommunity(urbanSite.i,urbanSite.j,5000)');assert.equal(moved,0);assert.equal(a.state.pop[a.inspect('urbanSite.i')],before);assert.equal(a.state.eth2[a.inspect('urbanSite.j')],2);
 });
 await t.test('settlers can bring a third faith without erasing native religion or folk beliefs',()=>{
  prepare();a.inspect("S.rels=[{id:0,kind:'universal'},{id:1,kind:'universal'}];S.rel[urbanSite.i]=1;S.rel[urbanSite.j]=0;S.faith2[urbanSite.j]=-1;S.faithMix[urbanSite.j]=.2");const before0=counts(0,0),beforeFolk=counts(0,-1);assert.equal(a.inspect('transferCommunity(urbanSite.i,urbanSite.j,5000)'),5000);assert.ok(Math.abs(counts(0,0).r-before0.r)<.01);assert.ok(Math.abs(counts(0,-1).r-beforeFolk.r)<.01);assert.ok(a.inspect('faithShare(urbanSite.j,1)')>0);assert.ok(a.inspect('faithShare(urbanSite.j,0)')>.5);
 });
 await t.test('a regional church branch preserves other congregations and parent lineage',()=>{
  prepare();const r=a.inspect(`(()=>{const {i}=urbanSite;S.rels=[{id:0,kind:'universal'},{id:1,kind:'universal',parent:0}];S.rel[i]=0;S.faith2[i]=-1;S.faithMix[i]=.2;branchFaith(i,0,1);return {parent:S.rels[1].parent,child:faithShare(i,1),folk:faithShare(i,-1),population:S.pop[i]}})()`);assert.equal(r.parent,0);assert.ok(Math.abs(r.child-.8)<1e-6&&Math.abs(r.folk-.2)<1e-6);assert.equal(r.population,100000);
 });
 await t.test('conversion and political integration are gradual and respect disabled settings and ethnic-faith limits',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,j,id}=urbanSite;S.rels=[{id:0,kind:'universal',miss:1,cent:.5}];const pop=S.pop[j];changeFaith(j,0,.1);const first=faithShare(j,0);for(let n=0;n<20;n++)changeFaith(j,0,.1);const later=faithShare(j,0);S.rels.push({id:1,kind:'ethnic',fam:-999});const ethnic=changeFaith(j,1,.1);S.pols[id].core=S.eth[i];P.assim=0;const mix=S.mix[j];politicalCommunityChange(j,S.pols[id]);return {first,later,ethnic,mix,after:S.mix[j],pop,afterPop:S.pop[j]}})()`);assert.ok(r.first>0&&r.first<.2);assert.ok(r.later>.5&&r.later<1);assert.equal(r.ethnic,0);assert.equal(r.mix,r.after);assert.equal(r.pop,r.afterPop);
 });
 await t.test('minority-only peoples and faiths remain alive and histories count their people',()=>{
  prepare();const r=a.inspect(`(()=>{const {i,j}=urbanSite;for(const k of WD.landIdx)if(k!==i&&k!==j)S.pop[k]=0;S.rels=[{id:0,name:'Minority Faith',kind:'universal',alive:true,cells:0,pop:0,peak:0,peakPop:0,born:1300,holy:i,origin:i,cent:.5,miss:1,holder:0,states:[],kids:[],rgb:[20,40,80]}];S.faith2[i]=0;S.faithMix[i]=.2;S.eth2[i]=2;S.mix[i]=.1;P.faith=0;relPass();ethPass(false);recordAtlasHistory();return {faith:S.rels[0].pop,alive:S.rels[0].alive,people:S.eths[2].pop,peopleAlive:S.eths[2].alive,record:historicalRecord('religion',0).population,footprint:historicalRecord('religion',0).cells}})()`);assert.ok(Math.abs(r.faith-20000)<.01);assert.ok(r.alive&&r.peopleAlive);assert.ok(Math.abs(r.people-10000)<.01);assert.equal(r.faith,r.record);assert.equal(r.footprint,0);
 });
 await t.test('contact changes cultural practices without changing names, ancestry or language',()=>{
  prepare();const r=a.inspect(`(()=>{const A=S.eths[0],B=S.eths[1],name=A.name,lang=JSON.stringify(A.lang),parent=A.parent;A.cult.fill(0);B.cult.fill(1);exchangeTraditions(0,1,.01);return {name,sameName:A.name===name,sameLanguage:JSON.stringify(A.lang)===lang,parent,afterParent:A.parent,value:A.cult[0],other:B.cult[0]}})()`);assert.ok(r.sameName&&r.sameLanguage);assert.equal(r.parent,r.afterParent);assert.ok(r.value>0&&r.value<.1);assert.ok(r.other<1&&r.other>.9);
 });
 await t.test('legacy cities migrate to labelled urban estimates without inventing historical city peaks',async()=>{
  prepare();const legacy=await a.decode(await a.encode(a.save('Legacy city')));legacy.engineVersion='0.17.0-dev.3';delete legacy.state.urbanVersion;delete legacy.state.urbanYear;delete legacy.state.faith2;delete legacy.state.faithMix;delete legacy.state.faith3;delete legacy.state.faithMix3;const old=legacy.state.cities[0];old.peak=800000;for(const k of ['population','provincePopulation','lastYear','institutions','scholarship','knowledge','foodAccess','security','commerce','urbanTarget'])delete old[k];const b=loadCore();b.restore(legacy);const c=b.state.cities[0];assert.equal(old.population,undefined);assert.ok(c.population>0&&c.population<b.state.pop[c.cell]);assert.equal(c.legacyProvincePeak,800000);assert.equal(c.peak,c.population);assert.ok(c.legacyEstimate);assert.equal(c.name,'Old Town');b.step();assert.deepEqual(b.inspect('simulationIssues()'),[]);
 });
 await t.test('urban and faith state survive exact save continuation and malformed archives are rejected',async()=>{
  prepare();for(let n=0;n<25;n++)a.step();const bytes=await a.encode(a.save('Urban')),b=loadCore();b.restore(await b.decode(bytes));for(let n=0;n<8;n++){a.step();b.step()}assert.deepEqual(a.save('same').state,b.save('same').state);
  const bad=await b.decode(bytes);bad.state.cities[0].population=1e12;assert.throws(()=>b.restore(bad),/urban population/);const corrupt=await b.decode(bytes);corrupt.state.cities[0].knowledge=new Float32Array(3);assert.throws(()=>b.restore(corrupt),/knowledge archive/);const faith=await b.decode(bytes);faith.state.faithMix[urbanSite.i]=.8;assert.throws(()=>b.restore(faith),/faith mixture/);
 });
 a.inspect('delete globalThis.urbanSite');
});
test('early browser seed keeps valid communities beyond the first 120 years',()=>{
 const a=loadCore();a.earth();a.inspect("newHistory('browser-baseline')");for(let n=0;n<260;n++){a.step();if(n%20===19)assert.deepEqual(a.inspect('simulationIssues()'),[])}
});
