const test=require('node:test');
const assert=require('node:assert/strict');
const {loadCore}=require('./core-harness.cjs');

test('dependent overseas colonies and cultural exchange',async t=>{
  const app=loadCore();app.earth();
  function prepare(pop=8000){
    app.start();return app.inspect(`(()=>{
      P.migration=P.seafaring=1;S.year=1500;const i=15790;S.pop[i]=150000;S.K[i]=200000;
      for(const k of [0,3,5,6,12,14,15,17,19,22]){S.tk[k][i]=1;S.firstTech[k]??={y:1400,cell:i}}
      const home=newPolity(i,null),v=traceVoyage(i,250*Math.PI/180,voyageRange(i)),j=v.to;
      S.pop[j]=${pop};S.pol[j]=0;S.eth2[j]=-1;S.mix[j]=0;
      if(S.pop[j]<1)S.eth[j]=-1;
      S.seaRoutes.set('known',{...v,born:1480,last:1500});globalThis.colonyVoyage=v;
      return {source:i,cell:j,home,native:S.eth[j],founder:S.eth[i],km:v.km};
    })()`);
  }
  function found(){return app.inspect(`(()=>{const r=S.r;S.r=()=>0;try{seaContact(colonyVoyage)}finally{S.r=r}return [...S.colonies.values()][0]})()`)}
  await t.test('a viable empty coast receives real emigrants, knowledge and homeland ownership',()=>{
    const site=prepare(0),before=app.state.pop[site.source];const colony=found();
    assert.ok(site.km>5000);assert.ok(colony);assert.equal(colony.homeState,site.home);
    assert.equal(app.state.pop[site.source]+app.state.pop[site.cell],before);
    assert.equal(app.state.eth[site.cell],site.founder);assert.equal(app.state.pol[site.cell],site.home);
    assert.ok(app.state.farm[site.cell]>.8);assert.ok(app.state.seaRoutes.size>0);
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('inhabited unclaimed coasts keep their existing majority and gain a settler minority',()=>{
    const site=prepare(),source=app.state.pop[site.source],colony=found();
    assert.ok(colony);assert.equal(app.state.eth[site.cell],site.native);
    assert.equal(app.state.eth2[site.cell],site.founder);
    assert.ok(app.state.mix[site.cell]>0&&app.state.mix[site.cell]<=.2);
    assert.equal(app.state.pop[site.source]+app.state.pop[site.cell],source+8000);
    assert.equal(app.state.pol[site.cell],site.home);assert.equal(colony.status,'active');
  });
  await t.test('an existing emigrant majority can organize without erasing its local minority',()=>{
    const site=prepare();app.inspect(`S.eth[${site.cell}]=${site.founder};S.eth2[${site.cell}]=${site.native};S.mix[${site.cell}]=.2`);
    const nativePopulation=app.state.pop[site.cell]*app.state.mix[site.cell],colony=found();
    assert.ok(colony);assert.equal(app.state.eth2[site.cell],site.native);
    assert.ok(Math.abs(app.state.pop[site.cell]*app.state.mix[site.cell]-nativePopulation)<.01);
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('early ships, crowded shores, foreign ownership and existing minorities block founding',()=>{
    for(const change of ["S.seaRoutes.get('known').born=S.year",'S.ocean[colonyVoyage.from]=.4','S.pop[colonyVoyage.from]=5000','S.pol[colonyVoyage.to]=S.pol[colonyVoyage.from]',
      'S.pop[colonyVoyage.to]=WD.area[colonyVoyage.to]*20','P.migration=0','P.seafaring=0',
      'S.eth2[colonyVoyage.to]=0;S.mix[colonyVoyage.to]=.2']){
      const site=prepare();const before=app.state.pop[site.source];
      const success=app.inspect(`(()=>{${change};const r=S.r;S.r=()=>0;try{return tryColony(colonyVoyage)}finally{S.r=r}})()`);
      assert.equal(success,false,change);assert.equal(app.state.colonies.size,0);
      if(!change.includes('=5000'))assert.equal(app.state.pop[site.source],before);
    }
  });
  await t.test('settlers inherit their source people and develop a daughter language over generations',()=>{
    const site=prepare(0),colony=found();assert.ok(colony);const total=app.state.pop[site.source]+app.state.pop[site.cell];
    assert.equal(app.state.eth[site.cell],site.founder);assert.equal(colony.administration,'dependent');
    app.inspect('P.assim=0;for(let n=1;n<=220;n++){S.year=1500+n;colonyStep()}');
    const c=app.state.colonies.get(site.cell);assert.ok(c.daughter);assert.equal(app.state.eths[c.people].parent,site.founder);
    assert.ok(Math.abs(app.state.pop[site.source]+app.state.pop[site.cell]-total)<.2,'migration and cultural development do not create population');
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('cutting routes or migration stops arrivals without deleting existing settlers',()=>{
    const site=prepare();found();app.state.seaRoutes.clear();
    const before=app.state.pop[site.source];app.inspect('S.year=1510;colonyStep()');
    assert.equal(app.state.pop[site.source],before);assert.equal(app.state.colonies.get(site.cell).status,'active');
    app.inspect('P.seafaring=0;S.year=1520;colonyStep()');
    assert.equal(app.state.pop[site.source],before);
  });
  await t.test('a failed community does not resurrect its population or culture',()=>{
    const site=prepare();found();app.inspect(`S.pop[${site.cell}]=0;S.eth[${site.cell}]=-1;S.eth2[${site.cell}]=-1;S.mix[${site.cell}]=0;S.year=1510;colonyStep()`);
    assert.equal(app.state.colonies.get(site.cell).status,'failed');assert.equal(app.state.colonies.get(site.cell).settlers,0);
    app.inspect('S.year=1520;colonyStep()');assert.equal(app.state.pop[site.cell],0);
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('revisited ocean trade can found a community without forcing random success',()=>{
    const site=prepare(25000);app.inspect(`S.seaRoutes.set('known',{...colonyVoyage,born:1480,last:1500})`);
    for(let n=1;n<=30&&!app.state.colonies.has(site.cell);n++)app.inspect(`S.year=${1500+n*5};seaTrade();colonyStep()`);
    assert.ok(app.state.colonies.has(site.cell));assert.equal(app.state.pol[site.cell],site.home);
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('peaceful treaty settlements keep the host government and existing majority',()=>{
    const site=prepare(25000);
    const host=app.inspect(`(()=>{const id=newPolity(${site.cell},null);S.pols[id].allies.push(${site.home});S.pols[${site.home}].allies.push(id);return id})()`);
    const native=app.state.eth[site.cell],colony=found();
    assert.ok(colony);assert.equal(app.state.pol[site.cell],host);assert.equal(app.state.eth[site.cell],native);
    assert.equal(app.state.eth2[site.cell],site.founder);
    app.inspect(`declareWar([S.pols[${site.home}]],[S.pols[${host}]],null,false,false,false)`);
    assert.equal(app.inspect(`colonyHostAllows(${site.source},${site.cell})`),false);
  });
  await t.test('trade carries real migrants and small diasporas persist after contact ends',()=>{
    const site=prepare(25000),before=app.state.pop[site.source]+app.state.pop[site.cell];
    app.inspect(`S.seaRoutes.set('passengers',{...colonyVoyage,born:1480,last:1500});S.year=1520;maritimePassengerExchange(S.seaRoutes.get('passengers'))`);
    assert.ok(Math.abs(app.state.pop[site.source]+app.state.pop[site.cell]-before)<.1);
    assert.equal(app.state.eth2[site.cell],site.founder);assert.ok(app.state.mix[site.cell]<.03);
    app.inspect('mixPass()');assert.equal(app.state.eth2[site.cell],site.founder,'trade-supported minority is retained');
    assert.ok(app.state.seaRoutes.get('passengers').migrants>0);
    app.inspect('S.year=1600;mixPass()');assert.equal(app.state.eth2[site.cell],site.founder,'loss of shipping alone does not erase an established identity');
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('passenger exchange respects third minorities and disabled migration',()=>{
    const site=prepare(25000);app.inspect(`S.year=1520;S.eth2[${site.cell}]=0;S.mix[${site.cell}]=.1`);
    const pop=app.state.pop[site.source];app.inspect('maritimePassengerExchange(colonyVoyage)');assert.equal(app.state.pop[site.source],pop);
    app.inspect(`S.eth2[${site.cell}]=-1;S.mix[${site.cell}]=0;P.migration=0;maritimePassengerExchange(colonyVoyage)`);
    assert.equal(app.state.pop[site.source],pop);assert.equal(app.state.eth2[site.cell],-1);
  });
  await t.test('a small port does not lose its minority when a hybrid culture cannot form',()=>{
    const site=prepare(25000);app.inspect(`S.eth2[${site.cell}]=${site.founder};S.mix[${site.cell}]=.35;S.mixT[${site.cell}]=15`);
    const before=app.state.mix[site.cell];
    app.inspect('(()=>{const r=S.r;S.r=()=>0;try{mixPass()}finally{S.r=r}})()');
    assert.equal(app.state.eth[site.cell],site.native);assert.equal(app.state.eth2[site.cell],site.founder);assert.equal(app.state.mix[site.cell],before);
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('real yearly processes preserve colony integrity through growth, migration and disease',()=>{
    prepare();found();
    for(let n=0;n<120;n++){app.step();if(n%10===0)assert.deepEqual(app.inspect('simulationIssues()'),[],`year ${app.state.year}`)}
    assert.ok(app.state.colonies.size>0);assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('maintained ocean trade permits dependent founding before the old 1300 cutoff',()=>{
    const site=prepare(0);app.inspect("S.year=1200;S.seaRoutes.get('known').born=1190;S.seaRoutes.get('known').last=1200");const c=found();assert.ok(c);assert.equal(app.state.pol[site.cell],site.home);assert.equal(c.administration,'dependent');
  });
  await t.test('ocean supply gives real administrative distance and disappears when routes close',()=>{
    const site=prepare(0);found();app.inspect('distBFS()');assert.ok(app.state.dist[site.cell]>0&&app.state.dist[site.cell]<65535);app.state.seaRoutes.clear();app.inspect('distBFS()');assert.equal(app.state.dist[site.cell],65535);assert.equal(app.state.pol[site.cell],site.home);
  });
  await t.test('small dependencies remain owned even after many decades',()=>{
    const site=prepare(0);found();app.inspect("P.migration=0;for(let n=1;n<=150;n++){S.year=1500+n;S.seaRoutes.get('known').last=S.year;colonyStep()}");assert.equal(app.state.pol[site.cell],site.home);assert.equal(app.state.colonies.get(site.cell).administration,'dependent');
  });
  await t.test('connected overseas provinces gain independence together when large relative to the homeland',()=>{
    const site=prepare(0);found();const neighbor=app.inspect(`(()=>{const j=[0,1,2,3].map(d=>WD.nb[${site.cell}*4+d]).find(j=>j>=0&&WD.land[j]);S.pol[j]=${site.home};S.pop[j]=35000;S.eth[j]=${site.founder};S.pop[${site.cell}]=35000;const c=S.colonies.get(${site.cell});c.settlers=30000;c.lastPopulation=35000;P.migration=0;return j})()`);
    app.inspect("for(let n=1;n<=150;n++){S.year=1500+n;S.seaRoutes.get('known').last=S.year;colonyStep()}");const c=app.state.colonies.get(site.cell);assert.equal(c.administration,'independent');assert.notEqual(c.independentState,site.home);assert.equal(app.state.pol[site.cell],c.independentState);assert.equal(app.state.pol[neighbor],c.independentState);assert.equal(app.state.pol[site.source],site.home);assert.equal(app.state.pols[c.independentState].from,site.home);assert.equal(app.state.pols[c.independentState].origin.type,'colony-independence');assert.ok(c.independentYear>=1560);assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('absolute colony size alone does not release a small share of a much larger homeland',()=>{
    const site=prepare(0);found();app.inspect(`S.pop[${site.source}]=1000000;S.pop[${site.cell}]=30000;const c=S.colonies.get(${site.cell});c.settlers=c.lastPopulation=30000;P.migration=0;for(let n=1;n<=200;n++){S.year=1500+n;S.seaRoutes.get('known').last=S.year;colonyStep()}`);assert.equal(app.state.pol[site.cell],site.home);assert.ok(app.state.colonies.get(site.cell).populationRatio<.2);
  });
  await t.test('assimilation changes cultural shares without creating population and can be disabled',()=>{
    let site=prepare();found();app.inspect('P.migration=0;P.assim=0;S.year=1501');const before=app.state.mix[site.cell];app.inspect('colonyStep()');assert.equal(app.state.mix[site.cell],before);
    site=prepare();found();const total=app.state.pop[site.source]+app.state.pop[site.cell],fraction=app.state.mix[site.cell];app.inspect('P.migration=0;P.assim=3;S.year=1501;colonyStep()');assert.ok(app.state.mix[site.cell]>fraction);assert.equal(app.state.pop[site.source]+app.state.pop[site.cell],total);
  });
  await t.test('captured territories are not magically reassigned to their former parent',()=>{
    const site=prepare(0);found();const captor=app.inspect(`newPolity(${site.cell},null,{base:'Captor'})`);app.inspect('S.year=1505;colonyStep()');assert.equal(app.state.pol[site.cell],captor);assert.equal(app.state.colonies.get(site.cell).administration,'occupied');
  });
  await t.test('legacy unclaimed charters rejoin surviving parents but existing independent states stay sovereign',()=>{
    let site=prepare(0);found();app.inspect(`delete S.colonies.get(${site.cell}).administration;S.pol[${site.cell}]=0;S.year=1501;colonyStep()`);assert.equal(app.state.pol[site.cell],site.home);
    site=prepare(0);found();const owner=app.inspect(`newPolity(${site.cell},null)`);app.inspect(`delete S.colonies.get(${site.cell}).administration;S.year=1501;colonyStep()`);assert.equal(app.state.pol[site.cell],owner);
  });
  await t.test('mature orphaned dependencies can form a state when their parent collapses',()=>{
    const site=prepare(0);found();app.inspect(`S.pol[${site.source}]=0;S.pols[${site.home}].alive=false;S.alive=[];S.pop[${site.cell}]=10000;const c=S.colonies.get(${site.cell});c.lastPopulation=c.settlers=10000;S.year=1530;colonyStep()`);const c=app.state.colonies.get(site.cell);assert.equal(c.administration,'independent');assert.equal(app.state.pol[site.cell],c.independentState);assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('another homeland port can supply a colony after its original port is captured',()=>{
    const site=prepare(0);found();const alternate=app.inspect(`(()=>{const i=WD.coastIdx.find(i=>i!==${site.source}&&angDist(i,${site.source})<.03);S.pop[i]=20000;S.pol[i]=${site.home};for(const k of [0,3,5,6,12,14,15,17,19,22])S.tk[k][i]=1;S.pols[${site.home}].capital=i;newPolity(${site.source},null);S.seaRoutes.set('alternate',{...colonyVoyage,from:i,born:1480,last:1505});P.assim=0;S.year=1505;return i})()`);const before=app.state.pop[alternate],original=app.state.pop[site.source];app.inspect('colonyStep()');assert.ok(app.state.pop[alternate]<before);assert.equal(app.state.pop[site.source],original);assert.equal(app.state.pol[site.cell],site.home);
  });
  await t.test('declared enemies can fight along a known ocean corridor without peaceful annexation',()=>{
    const site=prepare(0);found();const r=app.inspect(`(()=>{const target=newPolity(${site.cell},null);declareWar([S.pols[${site.home}]],[S.pols[target]],null,false,false,false);const idx=WD.landIdx.indexOf(${site.source}),original=attack,calls=[];attack=(o,i,j,sea)=>calls.push({owner:o.id,i,j,sea});try{updatePoliticalBorders({s:S,w:WD,r:()=>0,y:S.year,pols:S.pols,L:WD.landIdx,pol:S.pol,pop:S.pop,asR:P.asabR,wr:P.warRate*.03,rev:0,rels:S.rels,fz:P.fortify,infl:P.leaderInfl,overseas:overseasTransport()},idx,idx+1)}finally{attack=original}return {target,calls}})()`);assert.ok(r.calls.some(c=>c.i===site.source&&c.j===site.cell&&c.sea));assert.equal(app.state.pol[site.cell],r.target);
  });
  await t.test('old colony saves upgrade on continuation and invalid autonomy is rejected before installation',async()=>{
    const site=prepare(0);found();const file=await app.encode(app.save('Legacy charter')),legacy=await app.decode(file),c=legacy.state.colonies.get(site.cell);legacy.engineVersion='0.14.1';for(const key of ['administration','autonomy','isolationYears','identityYears','governmentYear'])delete c[key];legacy.state.pol[site.cell]=0;
    const b=loadCore();b.restore(legacy);assert.equal(b.state.pol[site.cell],0);b.inspect('colonyStep()');assert.equal(b.state.pol[site.cell],site.home);assert.deepEqual(b.inspect('simulationIssues()'),[]);
    const bad=await app.decode(file);bad.state.colonies.get(site.cell).autonomy=NaN;assert.throws(()=>b.restore(bad),/colony autonomy/);assert.ok(Number.isFinite(b.state.colonies.get(site.cell).autonomy));
  });
  await t.test('small inhabited coasts can receive a charter without erasing their native population',()=>{
    const site=prepare(100),native=app.state.eth[site.cell],before=app.state.pop[site.source]+app.state.pop[site.cell],c=found();assert.ok(c);assert.equal(app.state.eth[site.cell],site.founder);assert.equal(app.state.eth2[site.cell],native);assert.ok(Math.abs(app.state.pop[site.cell]*app.state.mix[site.cell]-100)<.01);assert.equal(app.state.pop[site.source]+app.state.pop[site.cell],before);
    app.inspect(`P.assim=0;S.pop[${site.cell}]=10000;S.mix[${site.cell}]=.01;mixPass()`);assert.equal(app.state.eth2[site.cell],native,'disabled assimilation preserves a small native minority');
  });
  await t.test('first ocean landfalls create parent-owned outposts using real source population',()=>{
    const site=prepare(0);app.state.seaRoutes.clear();const before=app.state.pop[site.source];app.inspect('seaContact(colonyVoyage)');const c=app.state.colonies.get(site.cell);assert.ok(c.outpost);assert.equal(c.administration,'dependent');assert.equal(app.state.pol[site.cell],site.home);assert.equal(app.state.pop[site.source]+app.state.pop[site.cell],before);
    app.inspect("S.year=1505;P.migration=0;for(const r of S.seaRoutes.values())r.last=S.year;colonyStep()");assert.equal(c.outpost,false);assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('pioneers from small stateless ports also leave real source people behind',()=>{
    const site=prepare(0);app.inspect(`S.pop[${site.source}]=6000;S.pol[${site.source}]=0;S.pols[${site.home}].alive=false;S.alive=[];seaContact(colonyVoyage)`);assert.equal(app.state.pop[site.source]+app.state.pop[site.cell],6000);assert.equal(app.state.colonies.size,0);
  });
  await t.test('prospecting uses the same capable-port floor as colonial founding',()=>{
    prepare(0);const result=app.inspect(`(()=>{S.pop[colonyVoyage.from]=10000;const r=S.r;S.r=()=>.5;try{return scoutColonyCoast(colonyVoyage)}finally{S.r=r}})()`);assert.ok(result);
  });
  app.inspect('delete globalThis.colonyVoyage');
});
