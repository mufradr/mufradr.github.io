const test = require('node:test');
const assert = require('node:assert/strict');
const {loadCore} = require('./core-harness.cjs');

test('regional climate, independent agriculture, and overseas contact', async t => {
  const app = loadCore(); app.earth(); app.start();
  await t.test('monsoon plains and humid China improve while deserts stay dry', () => {
    const locations=app.inspect(`[
      ['Delhi',28.6,77.2],['Bengal',23.5,90],['Guangzhou',23.1,113.3],
      ['Yangtze',30.5,112],['Sahara',23,15],['Atacama',-24,-69]
    ].map(([name,lat,lon])=>{const i=cellAt(lat,lon);return {name,rain:WD.Pr[i],raw:WD.rawP[i],biome:WD.biome[i]}})`);
    const byName=Object.fromEntries(locations.map(p=>[p.name,p]));
    assert.ok(byName.Delhi.raw>400 && byName.Delhi.raw<1000);
    assert.ok(byName.Bengal.rain>1200 && byName.Bengal.rain<2500);
    assert.equal(byName.Bengal.biome,10,'seasonal woodland rather than uniform savanna');
    for (const name of ['Guangzhou','Yangtze']) {
      assert.equal(byName[name].biome,4,'humid subtropical forest');
      assert.ok(byName[name].rain>1000);
    }
    for (const name of ['Sahara','Atacama']) {
      assert.equal(byName[name].biome,7);
      assert.ok(byName[name].rain<200);
    }
  });
  await t.test('Mexican and Andean farming hearths work, with viable highland yields', () => {
    app.start();
    const result=app.inspect(`(()=>{
      S.year=-5000;hearthCheck();
      const hearths=S.hearths.filter(h=>h.kind==='farm'&&[18,-13].includes(h.lat));
      const regions=[[19.4,-99.1],[-13,-72]].map(([lat,lon])=>{
        const i=cellAt(lat,lon),suitability=WD.sF[i];
        S.farm[i]=1;S.grain[i]=.8;S.herd[i]=.6;S.forest[i]=.1;computeK();const early=S.K[i];
        S.admin[i]=S.manure[i]=S.crops[i]=1;S.irrig[i]=.7;computeK();
        return {suitability,early,intensive:S.K[i],iron:S.iron[i],horse:S.horse[i]};
      });
      return {hearths:hearths.map(h=>h.done),regions};
    })()`);
    assert.deepEqual(result.hearths,[true,true]);
    for (const region of result.regions) {
      assert.ok(region.suitability>.35 && region.suitability<=1);
      assert.ok(region.early>5000);
      assert.ok(region.intensive>region.early*3);
      assert.equal(region.iron,0); assert.equal(region.horse,0);
    }
  });
  await t.test('accounting, roads, records and intensive crops do not require metallurgy', () => {
    app.start();
    const chances=app.inspect(`(()=>{
      const c=cellAt(-13,-72),o={capital:c,pop:3e6,cells:30,coastN:0,cult:1,press:1};
      S.farm[c]=1;
      const out=[];
      for(const k of [6,10,11,14,15,22]){
        out.push(inventionChance(o,k));S.tk[k][c]=1;
      }
      S.farm[c]=0;S.admin[c]=0;out.push(inventionChance(o,6));
      return out;
    })()`);
    for (const chance of chances.slice(0,-1)) assert.ok(chance>0);
    assert.equal(chances.at(-1),0,'farming remains a prerequisite for accounting');
  });
  await t.test('crowded highland farmers can found states without metal, horses or irrigation', () => {
    app.start();
    const result=app.inspect(`(()=>{
      const cells=[[18,-97],[-13,-72]].map(([lat,lon])=>cellAt(lat,lon));
      return cells.map(i=>{
        S.farm[i]=S.grain[i]=1;S.pop[i]=WD.area[i]*3;
        S.s[i]=.6;S.circE[i]=.9;const capable=stateFormationChance(i);
        S.grain[i]=0;const noStaples=stateFormationChance(i);
        S.pop[i]=10;const sparse=stateFormationChance(i);
        return {capable,noStaples,sparse,metal:S.metal[i],irrigation:S.irrig[i],horses:S.horse[i]};
      });
    })()`);
    for(const region of result){
      assert.ok(region.capable>0.00001);
      assert.ok(region.noStaples<region.capable/5);
      assert.equal(region.sparse,0);
      assert.equal(region.metal,0);assert.equal(region.irrigation,0);assert.equal(region.horses,0);
    }
  });
  await t.test('ocean-going ships require maritime knowledge and a plausible Earth era', () => {
    app.start();
    const result=app.inspect(`(()=>{
      const c=15790,o={capital:c,pop:3e6,cells:30,coastN:5,cult:1,press:1};
      S.sail[c]=S.nav[c]=S.paper[c]=1;S.year=500;
      const early=inventionChance(o,17);S.year=1450;const ready=inventionChance(o,17);
      S.nav[c]=0;const missingNavigation=inventionChance(o,17);
      return {early,ready,missingNavigation};
    })()`);
    assert.equal(result.early,0); assert.ok(result.ready>0);
    assert.equal(result.missingNavigation,0);
  });
  await t.test('Atlantic crossing, return trade, crops and disease follow actual sea paths', () => {
    app.start();
    const result=app.inspect(`(()=>{
      const i=15790;S.year=1450;S.pop[i]=150000;
      S.sail[i]=S.nav[i]=S.paper[i]=S.ocean[i]=1;
      const v=traceVoyage(i,240*Math.PI/180,voyageRange(i));
      const short=traceVoyage(i,240*Math.PI/180,2000);
      const j=v.to;S.pop[j]=80000;S.farm[i]=S.farm[j]=1;S.dp[i]=1;S.dp[j]=0;
      S.manure[j]=1;S.manure[i]=0;S.r=()=>0;
      const people=S.eth[j],polity=S.pol[j];seaContact(v);
      const firstCount=S.seaRoutes.size;seaContact(v);
      const before=S.manure[i];S.year=1455;seaTrade();
      return {short,km:v.km,targetLon:WD.cxA[j]*360/W-180,
        peopleUnchanged:S.eth[j]===people,polityUnchanged:S.pol[j]===polity,
        firstCount,routes:S.seaRoutes.size,crops:S.cropX.size,
        cropOrigin:S.xcrops[i],cropDestination:S.xcrops[j],
        knowledgeReturned:S.manure[i]>before,outbreaks:S.outbreaks.length,
        pathHasWater:v.path.some(c=>!WD.land[c])};
    })()`);
    assert.equal(result.short,null); assert.ok(result.km>5000 && result.km<9000);
    assert.ok(result.targetLon< -50); assert.ok(result.pathHasWater);
    assert.ok(result.peopleUnchanged && result.polityUnchanged);
    assert.equal(result.firstCount,1); assert.equal(result.routes,1,'duplicate voyages reuse the route');
    assert.equal(result.crops,1); assert.ok(result.cropOrigin>.5 && result.cropDestination>.5);
    assert.ok(result.knowledgeReturned); assert.ok(result.outbreaks>0);
  });
  await t.test('routes fade when ports are abandoned; disabling seafaring stops expeditions', () => {
    app.start();
    const result=app.inspect(`(()=>{
      const i=15790;S.year=1450;S.pop[i]=150000;S.sail[i]=S.nav[i]=S.ocean[i]=1;
      const v=traceVoyage(i,240*Math.PI/180,voyageRange(i));seaContact(v);
      const established=S.seaRoutes.size;S.pop[i]=0;S.year=1510;seaTrade();
      const expired=S.seaRoutes.size;P.seafaring=0;S.pop[i]=150000;
      for(let n=0;n<50;n++){S.year++;seaHop()}
      const disabled=S.seaRoutes.size;P.seafaring=1;
      return {established,expired,disabled};
    })()`);
    assert.deepEqual(result,{established:1,expired:0,disabled:0});
  });
  await t.test('a full route budget still admits a new ocean discovery', () => {
    app.start();
    const result=app.inspect(`(()=>{
      const i=15790;S.year=1450;S.pop[i]=150000;S.sail[i]=S.nav[i]=S.ocean[i]=1;
      const v=traceVoyage(i,240*Math.PI/180,voyageRange(i));
      for(let n=0;n<128;n++)S.seaRoutes.set('local-'+n,{from:i,to:v.to,km:600,last:1400,path:[i,v.to]});
      seaContact(v);
      return {count:S.seaRoutes.size,discovery:[...S.seaRoutes.values()].some(r=>r.km>5000)};
    })()`);
    assert.deepEqual(result,{count:128,discovery:true});
  });
  await t.test('mature ports discover overseas land through the normal expedition loop', () => {
    app.start();
    const result=app.inspect(`(()=>{
      const i=15790;S.pop[i]=150000;S.sail[i]=S.nav[i]=S.paper[i]=S.ocean[i]=1;
      let years=0;for(;years<200&&!S.contacts?.size;years++){S.year=1450+years;seaHop()}
      return {years,contacts:S.contacts?.size||0,routes:S.seaRoutes.size,
        americanRoute:[...S.seaRoutes.values()].some(v=>WD.cxA[v.to]*360/W-180< -50)};
    })()`);
    assert.ok(result.contacts>0 && result.americanRoute,'normal seeded expeditions find America');
    assert.ok(result.routes>0 && result.routes<=128);
    assert.ok(result.years<200);
  });
});
