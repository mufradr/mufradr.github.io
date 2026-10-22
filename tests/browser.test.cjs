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
      assert.match(await page.locator('.brand .sub').innerText(), /v0\.10\.0/i);
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
      await page.getByRole('button', {name:'Cohesion', exact:true}).click();
      assert.equal(await page.evaluate(() => ui.mode), 'asabiya');
      assert.match(await page.locator('#legend').innerText(), /Social cohesion/);
      await page.getByRole('button', {name:'States', exact:true}).click();
      const labels = page.getByRole('button', {name:'Map display options', exact:true});
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
          S.cities=[{cell:first,name:'Test Capital'},{cell:second,name:'Test Town'}];
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
        {states:true,peoples:false,faiths:false,cityMarkers:true,cityNames:true,colonies:true,routes:false});
      await page.evaluate(()=>{mapLayers.peoples=mapLayers.faiths=mapLayers.routes=true;loadPrefs()});
      assert.equal(await layer('routes').isChecked(),false,'display preferences restore');
      await layer('peoples').check();await layer('faiths').check();await layer('routes').check();
      await page.keyboard.press('Escape');
      assert.equal(await labels.getAttribute('aria-expanded'),'false');
      await page.getByRole('button', {name:'Terrain', exact:true}).click();
      assert.equal(await page.getByRole('button', {name:'Terrain', exact:true}).getAttribute('aria-pressed'), 'true');
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
      assert.equal(exported.engineVersion,'0.10.0');assert.equal(exported.rules.growth,.02);
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
