const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const digest=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const path=require('node:path');
const {loadCore,snapshot}=require('./core-harness.cjs');

test('calendar, scratch buffers, institutions and state integrity',async t=>{
  const app=loadCore();app.earth();app.start();
  await t.test('BCE and CE both schedule disease pools and caravans',()=>{
    const result=app.inspect(`(()=>{
      const original=[poolPass,caravanPass];let pool=0,caravan=0;
      poolPass=()=>pool++;caravanPass=()=>caravan++;
      try{
        S.year=-41;for(let n=0;n<40;n++)step();const bce={pool,caravan};
        pool=caravan=0;S.year=0;for(let n=0;n<40;n++)step();
        return {bce,ce:{pool,caravan}};
      }finally{[poolPass,caravanPass]=original}
    })()`);
    assert.deepEqual(result,{bce:{pool:4,caravan:2},ce:{pool:4,caravan:2}});
    assert.deepEqual(app.inspect('[-21,-20,-1,0,1,20,21].map(y=>calendarPhase(y,20))'),[19,0,19,0,1,0,1]);
  });
  await t.test('disease calculations ignore stale pathfinding data and initialize every output',()=>{
    app.start();
    const result=app.inspect(`(()=>{
      const i=WD.landIdx.find(i=>S.pop[i]<1);S.dp[i]=.5;
      S.bfsPar.fill(12345);S.poolNext.fill(NaN);poolPass();
      return {empty:S.dp[i],bounded:[...S.dp].every(v=>Number.isFinite(v)&&v>=0&&v<=1),
        unchanged:[...S.bfsPar].every(v=>v===12345)};
    })()`);
    assert.ok(Math.abs(result.empty-.49)<1e-6);assert.ok(result.bounded);assert.ok(result.unchanged);
  });
  await t.test('caravan visitation stamps reset before signed integer overflow',()=>{
    app.start();
    const result=app.inspect(`(()=>{
      const id=newPolity(cellAt(30.5,112),null);
      for(const i of WD.landIdx){S.pol[i]=id;S.pop[i]=WD.area[i]*2;S.camel[i]=1}
      S.bfsMark.fill(2147483646);S.bfsStamp=2147483646;caravanPass();
      return {stamp:S.bfsStamp,valid:[...S.bfsMark].every(v=>v>=0&&v<=S.bfsStamp)};
    })()`);
    assert.ok(result.stamp>0&&result.stamp<100);assert.ok(result.valid);
  });
  await t.test('civil-war and mixing scratch labels are cleared after use',()=>{
    app.start();
    const result=app.inspect(`(()=>{
      const c=cellAt(30.5,112),id=newPolity(c,null),o=S.pols[id];
      ring(c,3,j=>{if(WD.land[j]){S.pol[j]=id;S.pop[j]=20000;S.integ[j]=.2;S.dist[j]=20}});
      S.dist[c]=0;civilWar(o,true);mixPass();
      return {clean:[...S.lab].every(v=>v===0),issues:simulationIssues()};
    })()`);
    assert.ok(result.clean);assert.deepEqual(result.issues,[]);
  });
  await t.test('succession-born states wait for aggregation before their first policy update',()=>{
    app.start();
    const result=app.inspect(`(()=>{
      const c=cellAt(30.5,112),id=newPolity(c,null,{kind:'horde'}),o=S.pols[id];
      ring(c,3,j=>{if(WD.land[j]){S.pol[j]=id;S.pop[j]=20000;S.integ[j]=.2;S.dist[j]=20}});
      // An exceptional, already failing confederation can still split at succession.
      ring(c,3,j=>{if(WD.land[j])S.s[j]=.1});o.fiscalStress=.9;o.treas=-2;o.burden=3;
      S.year=100;o.ruler.birth=0;o.ruler.death=30;S.r=()=>.1;
      const oldCount=S.pols.length;politics();
      return {newborns:S.pols.slice(oldCount).map(o=>({why:o.why,cult:o.cult,psi:o.psi})),issues:simulationIssues()};
    })()`);
    assert.ok(result.newborns.length>0,'succession actually creates successors');
    for(const state of result.newborns){assert.equal(state.why,null);assert.ok(Number.isFinite(state.cult));assert.equal(state.psi,0)}
    assert.deepEqual(result.issues,[]);
  });
  await t.test('wartime institutional coordination accumulates and fades in peace',()=>{
    app.start();
    const result=app.inspect(`(()=>{
      const c=cellAt(30.5,112),o=S.pols[newPolity(c,null)];o.tax=10000;o.pop=10000;
      o.enemies.set(999,0);for(let n=0;n<20;n++)statecraft(o,c,n);const war=o.warC;
      o.enemies.clear();for(let n=0;n<20;n++)statecraft(o,c,n);return {war,peace:o.warC};
    })()`);
    assert.ok(result.war>0 && result.war<=1);assert.ok(result.peace>0 && result.peace<result.war);
  });
  await t.test('all instability contributions are recorded and named',()=>{
    app.start();
    const result=app.inspect(`(()=>{
      const c=cellAt(30.5,112),o=S.pols[newPolity(c,null)];S.pop[c]=10000;o.scl=1.5;
      const crisis=P.crisis;P.crisis=0;try{politics()}finally{P.crisis=crisis}
      return {included:o.why.pC>0,explained:topCauses({pC:2}),sum:Object.values(o.why).reduce((a,b)=>a+b,0),psi:o.psi};
    })()`);
    assert.ok(result.included);assert.match(result.explained[0],/entrenched/);assert.equal(result.sum,result.psi);
  });
  await t.test('ordinary completed years satisfy invariants and deliberate corruption is reported',()=>{
    app.start();for(let n=0;n<30;n++)app.step();
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
    const errors=app.inspect(`(()=>{const i=WD.landIdx[0];S.pop[i]=NaN;S.dp[i]=2;S.pol[i]=999999;S.tk[0][i]=Infinity;return simulationIssues()})()`);
    for(const pattern of [/population/,/dp/,/owner/,/technique/])assert.ok(errors.some(e=>pattern.test(e)));
    app.start();
    const relations=app.inspect(`(()=>{const a=newPolity(cellAt(30.5,112),null),b=newPolity(cellAt(35,109),null);S.pols[a].allies.push(b);return simulationIssues()})()`);
    assert.ok(relations.some(e=>e.includes('Nonreciprocal alliance')));
  });
});

test('paused, sliced playback gives the same completed simulation at every rate',()=>{
  const ui=fs.readFileSync(path.join(__dirname,'../js/ui.js'),'utf8');
  const source=ui.slice(ui.indexOf('function createSimulationClock(){'),ui.indexOf('const simClock='));
  const createClock=Function(source+';return createSimulationClock;')();
  const app=loadCore();app.earth();let expected;
  for(const [rate,frameMs] of [[.5,16],[25,100],[1e9,33]]){
    app.start();const clock=createClock();let now=0,pending=null,completed=0,slices=0,paused=false;
    for(let frame=0;completed<20&&frame<10000;frame++){
      now+=frameMs;let cpu=0;
      clock.run(now,rate,1,()=>!!pending,()=>{
        pending??=app.inspect('stepG()');slices++;
        if(pending.next().done){pending=null;completed++;if(completed===20)return false}
        return true;
      },()=>{cpu+=.2;return cpu});
      if(!paused&&slices>=4&&pending){now+=10000;clock.reset(now);paused=true}
    }
    assert.equal(completed,20);assert.ok(paused,'test pauses with an unfinished year');
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
    const result={snapshot:snapshot(app),pool:digest(app.state.dp),tech:app.state.tk.map(digest),nextRandom:app.state.r()};
    if(expected)assert.deepEqual(result,expected);else expected=result;
  }
});


test('release metadata and script cache versions agree',()=>{
  const root=path.join(__dirname,'..'),pkg=require('../package.json'),lock=require('../package-lock.json');
  const app=loadCore();assert.equal(app.inspect('ENGINE_VERSION'),pkg.version);
  assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.includes('v'+pkg.version));
  for(const match of html.matchAll(/src="js\/[^"?]+\.js\?v=([^" ]+)"/g))assert.equal(match[1],pkg.version);
  assert.ok(fs.readFileSync(path.join(root,'CHANGELOG.md'),'utf8').includes('## '+pkg.version));
});
