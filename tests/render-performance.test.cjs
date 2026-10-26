const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const {loadCore}=require('./core-harness.cjs');
const root=path.resolve(__dirname,'..');

test('atlas ranking preserves numeric and tradition-name ordering for tied archived records',()=>{
 const app=loadCore();app.earth();app.start();
 const result=app.inspect(`(()=>{
  const ids=[200,11,2,100,1,10];S.pols=ids.map(id=>({id,alive:false}));
  const states=atlasRanking('state','area').map(r=>r.entity.id);
  const names=['state:River 20','state:River 2','people:11','people:2','state:River 1'];
  S.historicalAtlas.tradition=new Map(names.map(id=>[id,{id,alive:false}]));
  return {states,traditions:atlasRanking('tradition','area').map(r=>r.entity.id),expected:names.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))};
 })()`);
 assert.deepEqual(result.states,[1,2,10,11,100,200]);assert.deepEqual(result.traditions,result.expected);
});

test('map repaint work is coalesced and hidden routes are not selected on desktop or phone',async t=>{
 const server=http.createServer((req,res)=>{const relative=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^(index\.html|(?:assets|styles|js)\/[\w.-]+)$/.test(relative)){res.writeHead(404).end();return}res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,relative)))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});t.after(()=>browser.close());
 for(const viewport of [{width:1280,height:900},{width:390,height:844}])await t.test(viewport.width+'px',async()=>{
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/#seed-render-regression`);
  await page.waitForFunction(()=>typeof ui!=='undefined'&&ui.ready&&document.getElementById('busy').hidden&&!ui.dirty);
  assert.deepEqual(await page.evaluate(()=>{
   const source=WD.generation.source,imported=WD.importSource,original=encodeMap;let encodes=0;
   try{WD.generation.source='import';WD.importSource={height:WD.eHi,temp:WD.tHi,prec:WD.pHi};encodeMap=()=>{encodes++;throw new Error('Unexpected map encoding')};finishHistory();document.getElementById('btn-share').click();return {encodes,hash:location.hash==='#seed-'+encodeURIComponent(S.seed),message:document.getElementById('share-status').textContent.includes('Use Export setup')}}
   finally{WD.generation.source=source;WD.importSource=imported;encodeMap=original}
  }),{encodes:0,hash:true,message:true},'custom startup and unavailable share links avoid encoding terrain');
  assert.deepEqual(await page.evaluate(()=>{
   const original=selectAtlasRoutes;let calls=0;selectAtlasRoutes=(...args)=>{calls++;return original(...args)};
   try{ui.mode='terrain';drawMap();const terrain=calls;ui.mode='political';drawMap();return{terrain,political:calls}}finally{selectAtlasRoutes=original}
  }),{terrain:0,political:1});
  assert.deepEqual(await page.evaluate(()=>{
   window.repaintCounts={build:0,draw:0};window.originalPaint={build:buildComp,draw:drawMap};
   buildComp=(...args)=>{repaintCounts.build++;return originalPaint.build(...args)};drawMap=(...args)=>{repaintCounts.draw++;return originalPaint.draw(...args)};
   const box=document.querySelector('[data-layer="cityNames"]');box.checked=false;box.dispatchEvent(new Event('change',{bubbles:true}));box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));
   return {...repaintCounts,visible:mapLayers.cityNames};
  }),{build:0,draw:0,visible:true});
  await page.waitForFunction(()=>repaintCounts.build===1&&!ui.dirty);
  assert.deepEqual(await page.evaluate(()=>{const result={...repaintCounts};repaintCounts.build=repaintCounts.draw=0;return result}),{build:1,draw:1});
  assert.equal(await page.evaluate(()=>{for(let n=0;n<20;n++)zoomAt(mapDim.w/2,mapDim.h/2,1.02);return repaintCounts.draw}),0);
  await page.waitForFunction(()=>repaintCounts.draw===1&&!ui.viewDirty);
  const view=await page.evaluate(()=>({z:ui.z,draw:repaintCounts.draw,build:repaintCounts.build,cell:screenToCell(mapDim.w/2,mapDim.h/2)}));
  assert.ok(Math.abs(view.z-1.02**20)<1e-10);assert.equal(view.draw,1);assert.equal(view.build,0);assert.ok(view.cell>=0);
  await page.evaluate(()=>{buildComp=originalPaint.build;drawMap=originalPaint.draw});
  assert.deepEqual(errors,[]);await page.close();
 });
});
