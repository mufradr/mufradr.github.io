const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');

// Serve both a domain root and a Pages-style subdirectory to check relative URLs.
function serve(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname.replace(/^\/project\//, '/');
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!/^(index\.html|(?:assets|styles|js)\/[\w.-]+)$/.test(relative)) {
    res.writeHead(404).end(); return;
  }
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {res.writeHead(404).end(); return;}
  res.setHeader('Content-Type', relative.endsWith('.css') ? 'text/css' : relative.endsWith('.js') ? 'text/javascript' : 'text/html');
  fs.createReadStream(file).pipe(res);
}

test('browser: startup, controls, pacing, and Pages-relative resources', async t => {
  const server = http.createServer(serve);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({executablePath, args:['--no-sandbox']});
  t.after(() => browser.close());
  for (const prefix of ['/', '/project/']) {
    await t.test(`served at ${prefix}`, async () => {
      const page = await browser.newPage();
      const errors = [], failedResources = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => {if (r.url().startsWith('http://127.0.0.1') && r.status() >= 400) failedResources.push(r.url());});
      // External fonts are optional; make tests independent of their availability.
      await page.route('https://fonts.googleapis.com/**', r => r.abort());
      await page.route('https://fonts.gstatic.com/**', r => r.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}${prefix}#seed-regression`);
      await page.waitForFunction(() => typeof ui !== 'undefined' && ui.ready && document.getElementById('busy').hidden);
      assert.equal(await page.title(), 'World Engine');
      assert.equal(await page.locator('.brand .mark').innerText(), 'World Engine');
      assert.match(await page.locator('.brand .sub').innerText(), /v0\.17\.0-dev\.4/i);
      assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), 'World Engine');
      const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel="manifest"]').href)).json());
      assert.equal(manifest.name, 'World Engine');
      assert.equal(manifest.short_name, 'World Engine');

      assert.equal(await page.evaluate(() => WD.isEarth), true, 'Earth data loaded without fallback');
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(230, 233, 228)');
      const initial = await page.evaluate(() => S.year);
      await page.getByRole('button', {name:'Play', exact:true}).click();
      await page.waitForFunction(year => ui.completedYear > year, initial);
      assert.equal(await page.getByRole('button', {name:'Pause', exact:true}).count(), 1);
      await page.getByRole('button', {name:'Pause', exact:true}).click();
      const paused = await page.evaluate(() => S.year);
      await page.waitForTimeout(350);
      assert.equal(await page.evaluate(() => S.year), paused, 'pause stops simulation advancement');
      await page.getByRole('button',{name:'Map options',exact:true}).click();
      await page.getByRole('button', {name:'Knowledge', exact:true}).click();
      const ships = page.locator('#legend [data-k="ocean"]');
      assert.match(await ships.innerText(), /Ocean-going ships/);
      assert.match(await ships.getAttribute('title'), /Celestial navigation.*Portable records/);
      assert.match(await ships.getAttribute('title'), /800 CE/);
      assert.ok(await page.evaluate(() => {
        const v=traceVoyage(15790,240*Math.PI/180,11520);
        if(!v)return false;
        S.seaRoutes.set('browser-test',{...v,last:S.year});
        const original=mapCtx.stroke;let strokes=0;
        try{
          mapCtx.stroke=function(...args){if(this.getLineDash().join(',')==='5,4')strokes++;return original.apply(this,args)};
          buildComp();drawMap();return strokes>0;
        }finally{mapCtx.stroke=original;S.seaRoutes.delete('browser-test');drawMap()}
      }), 'overseas routes render on the knowledge map');
      await page.getByRole('button',{name:'Map options',exact:true}).click();
      await page.getByRole('button', {name:'Cohesion', exact:true}).click();
      assert.equal(await page.evaluate(() => ui.mode), 'asabiya');
      assert.match(await page.locator('#legend').innerText(), /Social cohesion/);
      await page.getByRole('button',{name:'Map options',exact:true}).click();
      await page.getByRole('button', {name:'States', exact:true}).click();
      const labels = page.getByRole('button', {name:'Map display options', exact:true});
      await page.evaluate(()=>{mapLayers.optimizeCities=false});
      // Starting in prehistory means no real cities exist yet. Temporarily supply
      // a capital and a town and observe their actual canvas drawing operations.
      const cityDrawing = () => page.evaluate(() => {
        const first = WD.landIdx.find(i => Math.abs(WD.lat[i]) < 0.3);
        const second = first + 1;
        const previous = {cities:S.cities, pop:[S.pop[first],S.pop[second]],
          pol:[S.pol[first],S.pol[second]], z:ui.z, ox:ui.ox, oy:ui.oy};
        const methods = ['fillRect','strokeRect','arc','fillText','fill'];
        const original = Object.fromEntries(methods.map(name => [name,mapCtx[name]]));
        const counts = {capital:0,town:0,names:0,colonies:0,countries:0};
        const previousColony=S.colonies.get(first);
        try {
          const id = S.pols.length;
          S.pols.push({capital:first,cells:12,lx:WD.cxA[first]*2*Math.PI/W-Math.PI,ly:WD.cyA[first],base:'Test Country',tier:'Kingdom'});S.alive.push(id); S.pol[first]=id; S.pol[second]=0;
          S.pop[first]=S.pop[second]=100000;
          S.cities=[{cell:first,name:'Test Capital',population:20000},{cell:second,name:'Test Town',population:15000}];
          S.colonies.set(first,{cell:first,name:'Test Colony',status:'active'});
          ui.z=3; centerOn(first);
          for (const name of methods) mapCtx[name] = function(...args) {
            if (name==='fillRect' && args[2]===6 && args[3]===6) counts.capital++;
            if (name==='arc' && args[2]===2.5) counts.town++;
            if (name==='fill' && this.fillStyle==='#207b83') counts.colonies++;
            if (name==='fillText' && args[0]==='Test Country') counts.countries++;
            if (name==='fillText' && ['Test Capital','Test Town'].includes(args[0])) counts.names++;
            return original[name].apply(this,args);
          };
          drawMap();
          return counts;
        } finally {
          for (const name of methods) mapCtx[name]=original[name];
          S.pols.pop();S.alive.pop(); S.cities=previous.cities;
          if(previousColony)S.colonies.set(first,previousColony);else S.colonies.delete(first);
          [S.pop[first],S.pop[second]]=previous.pop;
          [S.pol[first],S.pol[second]]=previous.pol;
          Object.assign(ui,{z:previous.z,ox:previous.ox,oy:previous.oy});
          drawMap();
        }
      });
      await labels.click();
      assert.equal(await labels.getAttribute('aria-expanded'), 'true');
      const layer=k=>page.locator('#map-layers [data-layer="'+k+'"]');
      const visible = await cityDrawing();
      assert.ok(visible.capital>0 && visible.town>0 && visible.names>=2 && visible.colonies>0 && visible.countries>0);
      await layer('cityMarkers').uncheck();
      assert.deepEqual(await cityDrawing(), {...visible,capital:0,town:0}, 'city markers can hide while country and city names remain');
      await layer('cityNames').uncheck();
      assert.deepEqual(await cityDrawing(), {...visible,capital:0,town:0,names:0}, 'countries remain with all cities hidden');
      await layer('cityMarkers').check();await layer('cityNames').check();await layer('states').uncheck();
      assert.deepEqual(await cityDrawing(), {...visible,countries:0}, 'cities remain with country names hidden');
      await layer('colonies').uncheck();
      assert.deepEqual(await cityDrawing(), {...visible,countries:0,colonies:0}, 'colony markers have their own control');
      await layer('states').check();await layer('colonies').check();
      assert.deepEqual(await cityDrawing(), visible);
      await layer('peoples').uncheck();await layer('faiths').uncheck();await layer('routes').uncheck();
      await page.evaluate(()=>savePrefs());
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('asabiya.v1')).layers),
        {states:true,peoples:false,faiths:false,cityMarkers:true,cityNames:true,colonies:true,routes:false,optimizeCities:false,optimizeRoutes:true,borders:true,fortifications:true});
      await page.evaluate(()=>{mapLayers.peoples=mapLayers.faiths=mapLayers.routes=true;loadPrefs()});
      assert.equal(await layer('routes').isChecked(),false,'display preferences restore');
      await layer('peoples').check();await layer('faiths').check();await layer('routes').check();
      await page.evaluate(()=>{mapLayers.optimizeCities=true});
      await page.keyboard.press('Escape');
      assert.equal(await labels.getAttribute('aria-expanded'),'false');
      await page.getByRole('button',{name:'Map options',exact:true}).click();
      await page.getByRole('button', {name:'Terrain', exact:true}).click();
      assert.equal(await page.locator('#modes [data-m=terrain]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => ui.mode), 'terrain');
      // Inspect a substantial set of map pixels, not just the presence of a canvas.
      assert.ok(await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const colors = new Set();
        for (let i=0; i<pixels.length; i+=400) colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
        return colors.size > 10;
      }), 'map contains rendered terrain');
      assert.deepEqual(await page.evaluate(() => {
        const clock = createSimulationClock(); let years = 0;
        const run = (now, rate) => clock.run(now, rate, 10, () => false, () => {years++; return true;}, () => 0);
        run(0, 2); run(1000, 2); const first = years;
        clock.reset(10000); run(10000, 2); const afterReset = years;
        run(10500, 2); const resumed = years;
        run(11000, 10); const afterRateChange = years;
        return {first, afterReset, resumed, afterRateChange};
      }), {first:2, afterReset:2, resumed:3, afterRateChange:3});
      assert.deepEqual(errors, []);
      assert.deepEqual(failedResources, []);
      await page.evaluate(()=>{
        const c=cellAt(30.5,112),id=newPolity(c,null),o=S.pols[id];S.pop[c]=10000;o.scl=1.5;
        const previous=P.crisis;P.crisis=0;try{politics()}finally{P.crisis=previous}
        openPage('pol',id);renderPage();
      });
      assert.match(await page.locator('#pane-insp').innerText(),/Institutional sclerosis/);
      assert.match(await page.locator('#pane-insp').innerText(),/Poor integration/);
      await page.getByRole('tab', {name:'Setup',exact:true}).click();
      await page.locator('#p-growth').evaluate(el=>{el.value='.02';el.dispatchEvent(new Event('input',{bubbles:true}))});
      await page.evaluate(()=>{CL.monsoon=.91});
      await page.locator('#btn-world').click();
      await page.waitForFunction(()=>ui.ready&&WD.climateRules.monsoon===.91&&S.initialRules.growth===.02);
      await page.locator('#btn-share').click();
      const shared=await page.locator('#share-link').inputValue();
      assert.ok(shared.includes('#experiment='));
      const downloadPromise=page.waitForEvent('download');
      await page.locator('#btn-export-setup').click();
      const download=await downloadPromise;
      const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
      assert.equal(exported.engineVersion,'0.17.0-dev.4');assert.equal(exported.rules.growth,.02);
      const other=await browser.newPage();
      await other.route('https://fonts.googleapis.com/**',r=>r.abort());
      await other.goto(shared);
      await other.waitForFunction(()=>ui.ready);
      assert.deepEqual(await other.evaluate(()=>exportExperiment()),exported,'shared link restores the entire starting configuration');
      await other.close();
      await page.locator('#experiment-file').setInputFiles({name:'setup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
      await page.waitForFunction(()=>ui.ready&&document.getElementById('share-status').textContent.includes('setup loaded'));
      assert.deepEqual(await page.evaluate(()=>exportExperiment()),exported);
      await page.locator('#experiment-file').setInputFiles({name:'wrong-version.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...exported,engineVersion:'0.1.0'}))});
      await page.waitForFunction(()=>document.getElementById('share-status').textContent.includes('needs World Engine'));
      assert.equal(await page.evaluate(()=>ui.ready),true,'bad imports preserve the running world');
      await page.getByRole('tab', {name:'Checks',exact:true}).click();
      await page.locator('#btn-integrity').click();
      assert.match(await page.locator('#integrity-status').innerText(),/Integrity checks passed/);
      assert.deepEqual(errors, []);
      await page.close();
    });
  }
});

test('atlas: traditions, rankings, knowledge fade, borders and independent detail controls',async t=>{
 const server=http.createServer(serve);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>server.close(r)));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});t.after(()=>browser.close());
 for(const [name,viewport] of [['desktop',{width:1280,height:800}],['phone',{width:390,height:844}]])await t.test(name,async()=>{
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/#seed-atlas%20test%20%E4%B8%AD`);
  await page.waitForFunction(()=>typeof ui!=='undefined'&&ui.ready&&document.getElementById('busy').hidden);
  const chartCache=await page.evaluate(()=>{const original=chartCtx.clearRect;let clears=0;chartCtx.clearRect=function(...args){clears++;return original.apply(this,args)};
   try{ui.chartState=null;drawChart();const before=chartCtx.getImageData(0,0,chartCv.width,chartCv.height).data;drawChart();sizeCanvas(chartCv);drawChart();const after=chartCtx.getImageData(0,0,chartCv.width,chartCv.height).data;
    const same=before.every((v,i)=>v===after[i]);recordStats();drawChart();return {clears,same}}finally{chartCtx.clearRect=original}});
  assert.deepEqual(chartCache,{clears:2,same:true});
  assert.equal(await page.locator('#hseed').inputValue(),'atlas test 中');assert.match(new URL(page.url()).hash,/^#seed-/);
  await page.clock.install();
  assert.equal(await page.locator('#modes').isVisible(),false);
  const mapBox=await page.locator('#map').boundingBox();
  await page.getByRole('button',{name:'Map options',exact:true}).click();
  assert.equal(await page.locator('#modes').isVisible(),true);
  assert.deepEqual(await page.locator('#map').boundingBox(),mapBox,'expanded options do not consume map height');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#modes').isVisible(),false);
  assert.equal(await page.locator('#map-options-toggle').evaluate(el=>el===document.activeElement),true);
  await page.getByRole('button',{name:'Map options',exact:true}).click();
  await page.getByRole('button',{name:'States',exact:true}).click();
  assert.equal(await page.locator('#modes').isVisible(),false,'selecting a view closes the panel');
  await page.locator('#map').click({position:{x:170,y:140}});
  await page.clock.fastForward(9000);
  assert.equal(await page.locator('#legend').evaluate(el=>el.classList.contains('selector-idle')&&el.inert),true,'ordinary map explanation fades too');
  await page.getByRole('button',{name:'Legend',exact:true}).click();
  assert.equal(await page.locator('#legend').evaluate(el=>el.classList.contains('selector-idle')||el.inert),false);
  await page.getByRole('button',{name:'Map options',exact:true}).click();
  await page.locator('#map').click({position:{x:mapBox.width/2,y:mapBox.height-20}});
  assert.equal(await page.locator('#modes').isVisible(),false,'outside click closes options');
  await page.getByRole('button',{name:'Map options',exact:true}).click();
  await page.getByRole('button',{name:'Knowledge',exact:true}).click();
  await page.locator('#map').click({position:{x:170,y:140}});
  await page.clock.fastForward(11000);
  assert.equal(await page.locator('#legend').evaluate(el=>el.classList.contains('selector-idle')&&el.inert),true);
  await page.getByRole('button',{name:'Knowledge filters',exact:true}).click();
  assert.equal(await page.locator('#legend').evaluate(el=>el.classList.contains('selector-idle')||el.inert),false);
  await page.locator('#legend button').first().focus();await page.keyboard.press('Tab');await page.clock.fastForward(11000);
  assert.equal(await page.locator('#legend').evaluate(el=>el.classList.contains('selector-idle')),false,'keyboard use keeps the selector available');
  const borders=await page.evaluate(()=>{
   const c=cellAt(32,45),j=WD.nb[c*4+1];S.pop[c]=S.pop[j]=10000;
   const p=S.pols[newPolity(c,null)],q=S.pols[newPolity(j,null)];q.civ=p.civ;globalThis.atlasIds=[p.id,q.id];
   S.fort[c]=S.fort[j]=1;ui.mode='political';ui.page=null;buildComp();const first=compCtx.getImageData(0,0,HW,HH).data;
   for(let k=0;k<3;k++)buildComp();const next=compCtx.getImageData(0,0,HW,HH).data;
   const stable=first.every((v,k)=>v===next[k]);mapLayers.borders=false;buildComp();const hidden=compCtx.getImageData(0,0,HW,HH).data;
   const differs=first.some((v,k)=>v!==hidden[k]);mapLayers.borders=true;buildComp();return {stable,differs};
  });assert.deepEqual(borders,{stable:true,differs:true});
  await page.getByRole('button',{name:'Map options',exact:true}).click();
  await page.getByRole('button',{name:'Traditions',exact:true}).click();
  assert.ok(await page.evaluate(()=>{buildComp();return ui.traditions.size>0&&ui.traditionGrid[S.pols[atlasIds[0]].capital]>0&&ui.traditionGrid[S.pols[atlasIds[0]].capital]===ui.traditionGrid[S.pols[atlasIds[1]].capital]}));
  await page.evaluate(()=>{
   const [p,q]=atlasIds.map(id=>S.pols[id]);Object.assign(p,{base:'Atlas Large',full:'Empire of Atlas Large',pop:1000000,maxPop:2000000,area:300000,peakArea:900000});Object.assign(q,{base:'Atlas Small',full:'Kingdom of Atlas Small',pop:20000,maxPop:40000,area:40000,peakArea:45000});
   foundReligion(p);foundReligion(q);S.rels[0].peakPop=1000000;S.rels[0].pop=900000;S.rels[0].peak=50;
   const war=declareWar([p],[q],'Atlas Scale War',true,false,false);war.gA=30;
  });
  await page.getByRole('tab',{name:'Stats',exact:true}).click();
  await page.locator('#rank-kind').focus();await page.keyboard.press('Space');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>ui.running),false,'Space in ranking controls must not start playback');
  assert.match(await page.locator('#rankings tbody tr').first().innerText(),/Atlas Large/);
  await page.locator('#rank-metric').selectOption('peakArea');assert.match(await page.locator('#rankings tbody tr').first().innerText(),/900k km²/);
  await page.locator('#rank-metric').selectOption('population');assert.match(await page.locator('#rankings tbody tr').first().innerText(),/1\.0M/);
  await page.locator('#rank-kind').selectOption('religion');assert.equal(await page.locator('#rank-metric').isDisabled(),false);assert.match(await page.locator('#ranking-note').innerText(),/followers/);assert.ok(await page.locator('#rankings tbody tr').count()>=2);
  await page.locator('#rank-kind').selectOption('war');assert.match(await page.locator('#rankings').innerText(),/Atlas Scale War/);
  await page.locator('#rankings .lnk').first().focus();await page.keyboard.press('Enter');assert.match(await page.locator('#pane-insp').innerText(),/Provinces taken/);
  await page.getByRole('button',{name:'Map display options',exact:true}).click();
  await page.locator('[data-layer="optimizeCities"]').uncheck();await page.locator('[data-layer="optimizeRoutes"]').uncheck();
  assert.deepEqual(await page.evaluate(()=>({cities:mapLayers.optimizeCities,routes:mapLayers.optimizeRoutes})),{cities:false,routes:false});
  await page.locator('[data-layer="optimizeCities"]').check();assert.equal(await page.evaluate(()=>mapLayers.optimizeRoutes),false);
  await page.evaluate(()=>savePrefs());assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('asabiya.v1')).layers.optimizeRoutes),false);
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);await page.screenshot({path:`/tmp/world-engine-atlas-${name}.png`});await page.close();
 });
});

test('historical ranking maps work on desktop and phone without rewinding the world',async t=>{
 const server=http.createServer(serve);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
 const browser=await chromium.launch({executablePath,args:['--no-sandbox']});t.after(()=>browser.close());
 for(const viewport of [{width:1280,height:900},{width:390,height:844}])await t.test(`${viewport.width}px`,async()=>{
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/#seed-history-ui`);await page.waitForFunction(()=>typeof ui!=='undefined'&&ui.ready);
  await page.evaluate(()=>{
   setRunning(false);const c=cellAt(32,45),j=WD.nb[c*4+1],p=S.pols[newPolity(c,null)];S.pol[j]=p.id;S.pop[c]=S.pop[j]=100;S.year=0;recordAtlasHistory();
   S.year=10;S.pol[j]=0;S.pop[c]=1000;foundReligion(p);S.rel[c]=0;recordAtlasHistory();globalThis.peakId=p.id;ui.completedYear=S.year;
  });
  await page.getByRole('tab',{name:'Stats',exact:true}).click();await page.locator('#rank-metric').selectOption('peakArea');await page.locator('#rankings .lnk').first().click();
  await page.locator('#historical-banner').waitFor({state:'visible'});assert.match(await page.locator('#historical-banner').innerText(),/Peak area/);
  assert.deepEqual(await page.evaluate(()=>({year:S.year,shown:ui.historical.snapshot.year,running:ui.running,pop:S.pop[S.pols[peakId].capital]})),{year:10,shown:0,running:false,pop:1000});
  assert.equal(await page.locator('#history-map').isVisible(),true);
  await page.locator('#history-metric').selectOption('population');await page.locator('#history-show').click();assert.equal(await page.evaluate(()=>ui.historical.snapshot.year),10);
  await page.locator('#history-close').click();assert.equal(await page.evaluate(()=>ui.historical),null);
  await page.getByRole('tab',{name:'Stats',exact:true}).click();await page.locator('#rank-kind').selectOption('tradition');await page.locator('#rankings .lnk').first().click();assert.equal(await page.evaluate(()=>ui.historical.kind),'tradition');assert.match(await page.locator('#pane-insp').innerText(),/Civilizational tradition/i);
  await page.locator('#history-close').click();await page.getByRole('tab',{name:'Stats',exact:true}).click();await page.locator('#rank-kind').selectOption('religion');await page.locator('#rankings .lnk').first().click();assert.equal(await page.evaluate(()=>ui.historical.kind),'religion');
  await page.evaluate(()=>setRunning(true));assert.equal(await page.evaluate(()=>ui.historical),null);await page.evaluate(()=>setRunning(false));assert.deepEqual(errors,[]);await page.close();
 });
});
