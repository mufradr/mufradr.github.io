const test=require('node:test');
const assert=require('node:assert/strict');
const {loadCore}=require('./core-harness.cjs');

test('independent overseas communities',async t=>{
  const app=loadCore();app.earth();
  function prepare(pop=8000){
    app.start();return app.inspect(`(()=>{
      P.migration=P.seafaring=1;S.year=1500;const i=15790;S.pop[i]=150000;S.K[i]=200000;
      for(const k of [0,3,5,6,12,14,15,17,19,22]){S.tk[k][i]=1;S.firstTech[k]??={y:1400,cell:i}}
      const home=newPolity(i,null),v=traceVoyage(i,250*Math.PI/180,voyageRange(i)),j=v.to;
      S.pop[j]=${pop};S.pol[j]=0;S.eth2[j]=-1;S.mix[j]=0;
      if(S.pop[j]<1)S.eth[j]=-1;
      globalThis.colonyVoyage=v;
      return {source:i,cell:j,home,native:S.eth[j],founder:S.eth[i],km:v.km};
    })()`);
  }
  function found(){return app.inspect(`(()=>{const r=S.r;S.r=()=>0;try{seaContact(colonyVoyage)}finally{S.r=r}return [...S.colonies.values()][0]})()`)}
  await t.test('a viable empty coast receives real emigrants, knowledge and no homeland ownership',()=>{
    const site=prepare(0),before=app.state.pop[site.source];const colony=found();
    assert.ok(site.km>5000);assert.ok(colony);assert.equal(colony.homeState,site.home);
    assert.equal(app.state.pop[site.source]+app.state.pop[site.cell],before);
    assert.equal(app.state.eth[site.cell],site.founder);assert.equal(app.state.pol[site.cell],0);
    assert.ok(app.state.farm[site.cell]>.8);assert.ok(app.state.seaRoutes.size>0);
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('inhabited unclaimed coasts keep their existing majority and gain a settler minority',()=>{
    const site=prepare(),source=app.state.pop[site.source],colony=found();
    assert.ok(colony);assert.equal(app.state.eth[site.cell],site.native);
    assert.equal(app.state.eth2[site.cell],site.founder);
    assert.ok(app.state.mix[site.cell]>0&&app.state.mix[site.cell]<=.2);
    assert.equal(app.state.pop[site.source]+app.state.pop[site.cell],source+8000);
    assert.equal(app.state.pol[site.cell],0);assert.equal(colony.status,'active');
  });
  await t.test('early ships, crowded shores, foreign ownership and existing minorities block founding',()=>{
    for(const change of ['S.year=1200','S.ocean[colonyVoyage.from]=.4','S.pop[colonyVoyage.from]=5000','S.pol[colonyVoyage.to]=S.pol[colonyVoyage.from]',
      'S.pop[colonyVoyage.to]=WD.area[colonyVoyage.to]*5','P.migration=0','P.seafaring=0',
      'S.eth2[colonyVoyage.to]=0;S.mix[colonyVoyage.to]=.2']){
      const site=prepare();const before=app.state.pop[site.source];
      const success=app.inspect(`(()=>{${change};const r=S.r;S.r=()=>0;try{return tryIndependentColony(colonyVoyage)}finally{S.r=r}})()`);
      assert.equal(success,false,change);assert.equal(app.state.colonies.size,0);
      if(!change.includes('=5000'))assert.equal(app.state.pop[site.source],before);
    }
  });
  await t.test('return migration develops a daughter culture and can seed an independent state',()=>{
    const site=prepare();const colony=found();assert.ok(colony);
    const initial=app.state.pop[site.source]+app.state.pop[site.cell];
    app.inspect('for(let n=1;n<=100;n++){S.year=1500+n;colonyStep()}');
    const c=app.state.colonies.get(site.cell);
    assert.ok(c.settlers>2000);assert.ok(c.daughter);
    assert.notEqual(c.people,site.founder);assert.equal(app.state.eth[site.cell],c.people);
    assert.equal(app.state.eths[c.people].parent,site.founder);
    assert.ok(Math.abs(app.state.pop[site.source]+app.state.pop[site.cell]-initial)<.1,'no population is created by migration');
    // A mature farming community uses the ordinary agricultural state threshold.
    app.inspect(`S.farm[${site.cell}]=1`);
    assert.ok(app.inspect(`stateFormationChance(${site.cell})`)>0,'ordinary state formation remains possible');
    const state=app.inspect(`S.pols[newPolity(${site.cell},null)]`);
    assert.notEqual(state.id,site.home);assert.equal(state.over,0);assert.equal(state.from,0);
    assert.equal(state.origin.type,'colony');assert.deepEqual(app.inspect('simulationIssues()'),[]);
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
  await t.test('real yearly processes preserve colony integrity through growth, migration and disease',()=>{
    prepare();found();
    for(let n=0;n<120;n++){app.step();if(n%10===0)assert.deepEqual(app.inspect('simulationIssues()'),[],`year ${app.state.year}`)}
    assert.ok(app.state.colonies.size>0);assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  app.inspect('delete globalThis.colonyVoyage');
});
