#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),os=require('node:os');
const {chromium}=require('playwright'),protocol=require('./protocol.json');
const {defaultRoot,sourceIdentity,developedSetup,hash}=require('./engine.cjs');
async function main(){
 const argv=process.argv.slice(2),value=(key,fallback)=>{const i=argv.indexOf(key);return i<0?fallback:argv[i+1]},root=path.resolve(value('--engine-root',defaultRoot)),out=path.resolve(value('--out',path.join(defaultRoot,'benchmarks/baselines/v0.16.0'))),durationMs=Number(value('--duration-ms',protocol.browser.durationMs));
 if(!Number.isInteger(durationMs)||durationMs<1000||durationMs>60000)throw Error('Invalid browser duration');
 if(fs.existsSync(path.join(out,'browser.json')))throw Error('Browser output already exists; use another --out for repeat measurements');
 const source=sourceIdentity(root),manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));assert.equal(source.runtimeSHA256,manifest.identity.source.runtimeSHA256,'Browser and CPU runs must use the same runtime');
 const server=http.createServer((req,res)=>{const file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^(index\.html|(?:assets|styles|js)\/[\w.-]+)$/.test(file)){res.writeHead(404).end();return}const full=path.join(root,file);if(!fs.existsSync(full)){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(full))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--enable-precise-memory-info']});
  const cases=[];
  for(const viewport of protocol.browser.viewports)for(const scenario of ['early','developed']){
   const page=await browser.newPage({viewport,hasTouch:viewport.width<1000,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
   await page.goto(`http://127.0.0.1:${server.address().port}/#seed-browser-baseline`);await page.waitForFunction(()=>typeof ui!=='undefined'&&ui.ready&&document.getElementById('busy').hidden);
   await page.evaluate(({scenario,body})=>{saveUI.auto=false;ui.running=false;ui.gen=null;ui.genS=null;newHistory('browser-baseline');if(scenario==='developed')eval(body);for(let n=0;n<20;n++)step();ui.mode='political';ui.page=null;ui.stack=[];ui.speed=1e9;document.getElementById('autoslow').checked=false;buildComp();drawMap();ui.dirty=false},{scenario,body:developedSetup});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const result=await page.evaluate(durationMs=>new Promise(resolve=>{
    const start=performance.now(),year=S.year,gaps=[],tasks=[];let previous=null,raf,autoStoppedAt=null;
    const supported=PerformanceObserver.supportedEntryTypes.includes('longtask');
    const collect=entries=>{for(const e of entries)if(e.startTime>=start)tasks.push(e.duration)},observer=supported?new PerformanceObserver(list=>collect(list.getEntries())):null;observer?.observe({type:'longtask'});
    const sample=t=>{if(previous!==null)gaps.push(t-previous);previous=t;if(!ui.running&&autoStoppedAt===null)autoStoppedAt=performance.now()-start;raf=requestAnimationFrame(sample)};
    setRunning(true);raf=requestAnimationFrame(sample);
    setTimeout(()=>{
     const elapsedMs=performance.now()-start,measurementYear=S.year,pendingYear=!!ui.gen,completedYears=S.year-year-(ui.gen?1:0);setRunning(false);cancelAnimationFrame(raf);if(observer){collect(observer.takeRecords());observer.disconnect()}
     const distribution=a=>{a.sort((a,b)=>a-b);const q=p=>a.length?a[Math.min(a.length-1,Math.ceil(a.length*p)-1)]:null;return {count:a.length,median:q(.5),p95:q(.95),p99:q(.99),max:a.at(-1)??null}};
     const memory=performance.memory?{usedJSHeapBytes:performance.memory.usedJSHeapSize,totalJSHeapBytes:performance.memory.totalJSHeapSize,jsHeapLimitBytes:performance.memory.jsHeapSizeLimit}:null;
     // Validate at a completed boundary, outside the measured playback window.
     if(ui.gen){while(!ui.gen.next().done){}ui.gen=null}
     resolve({elapsedMs,completedYears,yearsPerSecond:completedYears/(elapsedMs/1000),autoStoppedAt,frameGapsMs:distribution(gaps),frameGapsOver50ms:gaps.filter(x=>x>50).length,frameGapsOver100ms:gaps.filter(x=>x>100).length,
      longTasksSupported:supported,longTasksMs:distribution(tasks),memory,measurementYear,verifiedYear:S.year,pendingYear,states:S.alive.length,records:S.pols.length,cities:S.cities.length,integrityIssues:simulationIssues()});
    },durationMs);
   }),durationMs);
   cases.push({scenario,viewport,requestedDurationMs:durationMs,...result,errors});console.log(JSON.stringify(cases.at(-1)));await page.close();
  }
  const result={schemaVersion:1,protocol:protocol.protocol,source,runnerSHA256:hash(fs.readFileSync(__filename)),browserVersion:browser.version(),environment:{node:process.version,cpu:os.cpus()[0]?.model},deviceNote:'Desktop headless Chromium at three viewport sizes; no CPU throttling, Safari or physical iPhone measurement.',cases};
  fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(result,null,2)+'\n');
  let md='# Browser playback baseline\n\nHeadless Chromium, maximum simulation speed, political map, default annotation limits, autosave and event slowdown disabled. Each case warms up 20 years. Viewports emulate layout, not iPhone/iPad hardware or Safari. Frame gaps and Long Tasks measure actual browser scheduling; they differ from headless simulation slice times.\n\n| Scene | Viewport | Completed years/s | Frame-gap p95 / p99 ms | Gaps >50 ms | Long tasks >50 ms | JS heap MiB |\n| --- | --- | ---: | ---: | ---: | ---: | ---: |\n';
  for(const r of cases)md+=`| ${r.scenario} | ${r.viewport.width}×${r.viewport.height} | ${r.yearsPerSecond.toFixed(2)} | ${r.frameGapsMs.p95?.toFixed(2)} / ${r.frameGapsMs.p99?.toFixed(2)} | ${r.frameGapsOver50ms} | ${r.longTasksMs.count} | ${r.memory?(r.memory.usedJSHeapBytes/1048576).toFixed(1):'unavailable'} |\n`;
  md+='\nEight-second windows are initial samples, not stable estimates of rare delays. JS heap is not total browser or device memory. Pending years and any errors/integrity issues are retained in browser.json.\n';fs.writeFileSync(path.join(out,'BROWSER.md'),md);
  assert.ok(cases.every(c=>!c.errors.length&&!c.integrityIssues.length),'Browser errors/integrity issues were recorded');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
}
main().catch(e=>{console.error(e);process.exitCode=1});
