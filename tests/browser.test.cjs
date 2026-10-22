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
      assert.equal(await page.title(), 'Asabiya History Engine');
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
      await page.close();
    });
  }
});
