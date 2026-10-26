const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
function serve(req,res){const file=path.join(root,new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html');if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res)}
async function idle(page){await page.waitForFunction(()=>!saveUI.busy,{},{timeout:60000})}
test('save slots, backups, file transfer and autosaves on desktop and iPhone',async t=>{
 const server=http.createServer(serve);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});t.after(()=>browser.close());
 for(const viewport of [{width:1280,height:900},{width:390,height:844}])await t.test(`${viewport.width}px`,async()=>{
  const page=await browser.newPage({viewport,acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/#seed-save-slots`);await page.waitForFunction(()=>typeof ui!=='undefined'&&ui.ready);
  await page.getByRole('tab',{name:'Saves',exact:true}).click();await page.locator('#autosave-enabled').uncheck();
  assert.deepEqual(await page.evaluate(async()=>{
   const live=new Float32Array([1.25,2.5,3.75]),payload={a:live,b:live,map:new Map([[live,new Set([live])]])};payload.self=payload;
   const file=await processWorldFile('encode',payload),out=await processWorldFile('decode',file);
   return {live:[...live],inputTransferred:file.byteLength===0,values:[...out.a],alias:out.a===out.b,cycle:out.self===out,map:out.map.get(out.a).has(out.a)};
  }),{live:[1.25,2.5,3.75],inputTransferred:true,values:[1.25,2.5,3.75],alias:true,cycle:true,map:true},'worker transfers decoded buffers while preserving live arrays and graph aliases');
  assert.equal(await page.locator('#save-slots .world-slot').count(),3);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'save slots fit the viewport');
  const first=page.locator('[data-slot="manual-1"]');await first.locator('input').fill('My Earth');
  await page.evaluate(()=>{ui.gen=stepG();ui.genS=S;ui.gen.next()});
  await first.getByRole('button',{name:'Save here',exact:true}).click();await idle(page);assert.match(await page.locator('#saves-status').innerText(),/Saved My Earth/);
  const original=await page.evaluate(()=>S.year);assert.equal(await page.evaluate(()=>ui.gen),null,'saving completes a pending year');
  await page.evaluate(()=>{step();step();ui.completedYear=S.year});await first.getByRole('button',{name:'Save here',exact:true}).click();await idle(page);
  assert.equal(await first.getByRole('button',{name:'Load previous save',exact:true}).count(),1);
  await page.evaluate(()=>{globalThis.savedValidator=validateWorldSave;globalThis.validationPasses=0;validateWorldSave=(...args)=>{validationPasses++;return savedValidator(...args)}});
  await first.getByRole('button',{name:'Load previous save',exact:true}).click();await idle(page);
  assert.equal(await page.evaluate(()=>{const count=validationPasses;validateWorldSave=savedValidator;return count}),1,'loading validates the detached candidate once before installation');
  assert.equal(await page.evaluate(()=>S.year),original);assert.equal(await page.evaluate(()=>ui.running),false);
  assert.ok(await page.locator('[data-slot="before-load"]').isVisible());
  const downloadEvent=page.waitForEvent('download');await page.locator('#export-world').click();const download=await downloadEvent;await idle(page);
  assert.match(download.suggestedFilename(),/\.worldengine$/);const savedPath=await download.path();assert.ok(fs.statSync(savedPath).size>1000);
  await page.evaluate(()=>{step();ui.completedYear=S.year});await page.locator('#import-world').setInputFiles(savedPath);await idle(page);assert.equal(await page.evaluate(()=>S.year),original);
  await page.locator('#import-world').setInputFiles({name:'broken.worldengine',mimeType:'application/octet-stream',buffer:Buffer.from('not a world')});await idle(page);assert.equal(await page.evaluate(()=>S.year),original);assert.match(await page.locator('#saves-status').innerText(),/not a World Engine save/);
  // A failed replacement transaction must preserve both the current and previous slot blobs.
  const savedTime=await page.evaluate(async()=> (await readWorldSlot('manual-1')).savedAt);
  await page.evaluate(()=>{globalThis.originalSlotPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Full','QuotaExceededError')}});
  await first.getByRole('button',{name:'Save here',exact:true}).click();await idle(page);
  await page.evaluate(()=>{IDBObjectStore.prototype.put=globalThis.originalSlotPut});
  assert.equal(await page.evaluate(async()=> (await readWorldSlot('manual-1')).savedAt),savedTime);assert.match(await page.locator('#saves-status').innerText(),/storage is full/);
  if(viewport.width===1280){
   await page.locator('#autosave-enabled').check();await page.clock.install();
   for(let n=0;n<4;n++){await page.clock.fastForward(61000);await page.evaluate(()=>{step();ui.completedYear=S.year;maybeAutosave()});await idle(page)}
   const slots=await page.evaluate(()=>listWorldSlots());assert.equal(slots.filter(s=>s.id.startsWith('auto-')).length,3);assert.equal(slots.filter(s=>s.id.startsWith('manual-')).length,1);
   assert.equal(Math.max(...slots.filter(s=>s.id.startsWith('auto-')).map(s=>s.year)),original+4);
   await page.locator('#autosave-enabled').uncheck();
  }
  await page.reload();await page.waitForFunction(()=>typeof ui!=='undefined'&&ui.ready);await page.getByRole('tab',{name:'Saves',exact:true}).click();assert.equal(await page.locator('[data-slot="manual-1"] input').inputValue(),'My Earth');
  assert.deepEqual(errors,[]);await page.close();
 });
});
