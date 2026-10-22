const test=require('node:test');
const assert=require('node:assert/strict');
const {loadCore,snapshot}=require('./core-harness.cjs');

test('versioned experiment round trips',async t=>{
  const app=loadCore();
  await t.test('Earth custom rules, climate, Unicode seed and initial conditions survive JSON and links',()=>{
    app.inspect("P.growth=.02;P.hearthMode='random';P.shuffleNames=true;CL.monsoon=.9");
    app.earth();app.inspect("newHistory('custom-雨 & seed')");
    const initial=snapshot(app),config=app.inspect('exportExperiment()');
    assert.equal(config.rules.growth,.02);assert.equal(config.climate.monsoon,.9);
    assert.equal(config.rules.hearthMode,'random');
    // Edits made after the run started must not rewrite its starting conditions.
    app.inspect('P.growth=.01;CL.monsoon=.4');
    assert.equal(app.inspect('exportExperiment().rules.growth'),.02);
    assert.equal(app.inspect('exportExperiment().climate.monsoon'),.9);
    const linked=app.inspect(`experimentFromHash(experimentHash(${JSON.stringify(config)}))`);
    assert.deepEqual(linked,config);
    for(let n=0;n<5;n++)app.step();const progressed=snapshot(app);
    app.inspect(`(()=>{const e=decodeEarth(inflateSync(Uint8Array.from(atob(EARTH_ELEV_B64),c=>c.charCodeAt(0))),inflateSync(Uint8Array.from(atob(KOPPEN_B64),c=>c.charCodeAt(0))));restoreExperiment(${JSON.stringify(config)},e)})()`);
    assert.deepEqual(snapshot(app),initial);
    // Reproduce the same deliberate runtime edit before comparing evolved output.
    app.inspect('P.growth=.01;CL.monsoon=.4');
    for(let n=0;n<5;n++)app.step();assert.deepEqual(snapshot(app),progressed);
  });
  await t.test('generated worlds preserve land share, world seed and climate',()=>{
    app.inspect("P.landFrac=.27;CL.monsoon=.83;WD=genWorld({seed:'islands-42',landFrac:.27});newHistory('42')");
    const initial=snapshot(app),config=app.inspect('exportExperiment()');
    app.inspect('P.landFrac=.5;CL.monsoon=.1');
    app.inspect(`restoreExperiment(${JSON.stringify(config)})`);
    assert.deepEqual(snapshot(app),initial);assert.equal(app.inspect('WD.seed'),'islands-42');
    assert.deepEqual(app.inspect('simulationIssues()'),[]);
  });
  await t.test('imported height, temperature and rain maps round trip exactly',()=>{
    app.inspect(`(()=>{
      const height=new Float32Array(HW*HH),temp=new Float32Array(HW*HH).fill(17),prec=new Float32Array(HW*HH).fill(1100);
      for(let y=0;y<HH;y++)for(let x=0;x<HW;x++)height[y*HW+x]=x>HW*.2&&x<HW*.8?300+20*Math.sin(y/15):-1000;
      WD=genWorld({seed:'imported atlas',height,temp,prec});newHistory('import-42');
    })()`);
    const initial=snapshot(app);
    // Keep the multi-megabyte JSON inside the engine harness rather than tool output.
    app.inspect('globalThis.savedSetup=JSON.stringify(exportExperiment())');
    app.inspect('restoreExperiment(JSON.parse(savedSetup))');
    assert.deepEqual(snapshot(app),initial);
    assert.equal(app.inspect('WD.tHi[100]'),17);assert.equal(app.inspect('WD.pHi[100]'),1100);
    assert.throws(()=>app.inspect('experimentHash(exportExperiment())'),/Export setup/);
    app.inspect('delete globalThis.savedSetup');
  });
  await t.test('generation failures roll back world, history and settings atomically',()=>{
    app.earth();app.start();const before=snapshot(app),rules=app.inspect('({...P})'),climate=app.inspect('({...CL})');
    assert.throws(()=>app.inspect(`(()=>{
      const config=exportExperiment(),original=genWorld;config.rules.growth=.025;config.climate.monsoon=.95;
      genWorld=()=>{throw new Error('test generation failure')};
      try{restoreExperiment(config,{height:WD.eHi,kg:WD.kgHi})}finally{genWorld=original}
    })()`),/test generation failure/);
    assert.deepEqual(snapshot(app),before);assert.deepEqual(app.inspect('({...P})'),rules);assert.deepEqual(app.inspect('({...CL})'),climate);
  });
  await t.test('malformed or different-version setups are rejected before changing state',()=>{
    app.earth();app.start();
    const initial=snapshot(app);
    for(const mutation of ["c.engineVersion='0.1.0'",'c.schemaVersion=999',"c.world.dataset='unknown'",'c.rules.growth=-1','c.climate.monsoon=NaN',"c.historySeed=''",'c.rules.shuffleNames=1',"c.world.source='import';c.world.maps={height:{encoding:'bad',data:'bad'}}"]){
      assert.throws(()=>app.inspect(`(()=>{const c=exportExperiment();${mutation};restoreExperiment(c)})()`));
      assert.deepEqual(snapshot(app),initial);
    }
    assert.throws(()=>app.inspect("experimentFromHash('#experiment=%oops')"));
  });
});
