const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const {loadCore}=require('./core-harness.cjs');
test('traditions emerge with states; legacy defaults are hidden and old saves load',async()=>{
 const a=loadCore();a.earth();a.start();assert.equal(a.state.historicalAtlas.tradition.size,0);assert.equal(a.inspect('WD.landIdx.every(i=>traditionAt(i)===null)'),true);
 const r=a.inspect(`(()=>{const c=cellAt(32,45),j=WD.nb[c*4+1];S.pop[c]=1000;S.pop[j]=2000;const p=S.pols[newPolity(c,null)],q=S.pols[newPolity(j,p)];const key=traditionAt(c).key;
 const fresh=traditionSummary(key);recordAtlasHistory();const previous=S.historicalAtlas.people.values().next().value;S.historicalAtlas.tradition.set('people:0',{...previous,id:'people:0'});return {key,fresh,rank:atlasRanking('tradition').map(r=>r.entity.id),summary:traditionSummary(key),area:WD.area[c]+WD.area[j]}})()`);
 assert.equal(r.fresh.record,null);assert.equal(r.fresh.states.length,2);assert.equal(r.summary.population,3000);assert.equal(r.summary.area,r.area);assert.deepEqual(r.rank,[r.key]);
 const save=a.save('Existing world');save.engineVersion='0.14.0';const b=loadCore();b.restore(await b.decode(await b.encode(save)));assert.equal(b.inspect('atlasRanking("tradition").length'),1);assert.ok(b.state.historicalAtlas.tradition.has('people:0'),'legacy archive data remains available for compatibility');
});
test('map clicks and phone taps inspect the selected tradition, including newly founded ones',async t=>{
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const relative=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^(index\.html|(?:assets|styles|js)\/[\w.-]+)$/.test(relative)){res.writeHead(404).end();return}res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,relative)))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});t.after(()=>browser.close());
 for(const width of [1280,390])await t.test(width+'px',async()=>{
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===390}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());await page.goto(`http://127.0.0.1:${server.address().port}/#seed-tradition-inspector`);await page.waitForFunction(()=>typeof ui!=='undefined'&&ui.ready);
  assert.deepEqual(await page.evaluate(()=>{ui.mode='traditions';buildComp();return {groups:ui.traditions.size,rows:atlasRanking('tradition').length}}),{groups:0,rows:0});
  assert.match(await page.evaluate(()=>{document.getElementById('rank-kind').value='tradition';renderAtlasStats();return document.getElementById('rankings').textContent}),/Traditions emerge when states form/);
  const target=await page.evaluate(()=>{const c=cellAt(32,45),j=WD.nb[c*4+1];S.pop[c]=1000;S.pop[j]=2000;const p=S.pols[newPolity(c,null,{base:'River Heritage'})],q=S.pols[newPolity(j,p,{base:'River Successor'})];globalThis.traditionIds=[p.id,q.id];ui.z=4;buildComp();centerOn(c);ui.dirty=false;const point=atlasScreenPoint(c,{scale:ui.bs*ui.z,ox:ui.ox,oy:ui.oy,width:mapDim.w,height:mapDim.h}),box=mapCv.getBoundingClientRect();return {x:box.left+point.x,y:box.top+point.y,key:traditionAt(c).key}});
  if(width===390)await page.touchscreen.tap(target.x,target.y);else await page.mouse.click(target.x,target.y);
  assert.deepEqual(await page.evaluate(()=>ui.page),{t:'tradition',id:target.key});assert.equal(await page.locator('#pane-insp .name').innerText(),'River Heritage');assert.match(await page.locator('#pane-insp').innerText(),/Member states[\s\S]*River Heritage[\s\S]*River Successor/i);assert.doesNotMatch(await page.locator('#pane-insp').innerText(),/could not be drawn/);assert.equal(await page.locator('#history-show').isDisabled(),true);
  await page.evaluate(()=>{recordAtlasHistory();renderPage()});assert.equal(await page.locator('#history-show').isDisabled(),false);await page.locator('#history-show').click();assert.equal(await page.evaluate(()=>ui.historical.id),target.key);await page.locator('#history-close').click();
  await page.locator('#pane-insp .lnk[data-t="pol"]').first().click();assert.equal(await page.evaluate(()=>ui.page.t),'pol');assert.deepEqual(errors,[]);await page.close();
 });
});
