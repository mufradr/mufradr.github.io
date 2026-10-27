// Read-only synthetic rendering benchmark. Optional baselines:
// node tests/render-performance-benchmark.cjs --ui /tmp/ui-before.js --atlas /tmp/atlas-before.js
// Paused worlds, fixed random seed and settings; timings are local Chromium measurements.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2),baseline=name=>{const i=args.indexOf(name);return i<0?null:fs.readFileSync(args[i+1],'utf8')};
async function main(){
 const server=http.createServer((req,res)=>{const relative=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!/^(index\.html|(?:assets|styles|js)\/[\w.-]+)$/.test(relative)){res.writeHead(404).end();return}res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,relative)))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 try{
  const results=[];
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport});
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
   for(const [arg,file] of [['--ui','ui.js'],['--atlas','atlas.js']]){const body=baseline(arg);if(body)await page.route('**/js/'+file+'*',r=>r.fulfill({contentType:'text/javascript',body}))}
   await page.goto(`http://127.0.0.1:${server.address().port}/#seed-render-benchmark`);
   await page.waitForFunction(()=>typeof ui!=='undefined'&&ui.ready&&document.getElementById('busy').hidden);
   const result=await page.evaluate(async()=>{
    ui.running=false;const rand=mulberry32(101),cells=WD.landIdx;S.cities=[];
    for(let q=0;q<100;q++)newPolity(cells[Math.floor(rand()*cells.length)],null);
    // A deliberately crowded stress scene, not a historical forecast.
    for(const i of cells){S.pol[i]=1+Math.floor(rand()*S.alive.length);S.pop[i]=100000+Math.floor(rand()*1000000);S.fort[i]=rand();if(rand()<.12)S.cities.push({cell:i,name:'City '+i,population:S.pop[i]*.2})}
    S.routes=Array.from({length:1200},(_,id)=>{const start=cells[Math.floor(rand()*cells.length)],path=Array.from({length:100},(_,j)=>(start+j)%N);return{id,a:start,b:path.at(-1),path}});
    ui.z=2.8;clampView();ui.mode='political';buildComp();drawMap();
    const bench=(fn,n=30)=>{for(let i=0;i<5;i++)fn();const times=[];for(let i=0;i<n;i++){const t=performance.now();fn();times.push(performance.now()-t)}times.sort((a,b)=>a-b);return {medianMs:times[times.length>>1],p90Ms:times[Math.floor(times.length*.9)]}};
    const politicalBuild=bench(buildComp),politicalDraw=bench(drawMap);
    const digest=async cv=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data))).map(v=>v.toString(16).padStart(2,'0')).join('');
    const compositeHash=await digest(compCv),mapHash=await digest(mapCv);
    ui.mode='terrain';const terrainDraw=bench(drawMap);ui.mode='political';
    let builds=0,draws=0;const oldBuild=buildComp,oldDraw=drawMap;buildComp=()=>{builds++};drawMap=()=>{draws++};
    document.querySelector('[data-layer="cityNames"]').dispatchEvent(new Event('change',{bubbles:true}));buildComp=oldBuild;drawMap=oldDraw;
    const layerToggleImmediate={builds,draws};
    for(let id=101;id<12101;id++)S.pols.push({id,alive:false,born:-500,died:0});
    const archivedStateRanking=bench(()=>atlasRanking('state','area'),10),rank=atlasRanking('state','area').map(r=>r.entity.id);
    return {politicalBuild,politicalDraw,terrainDraw,archivedStateRanking,layerToggleImmediate,compositeHash,mapHash,rankCheck:[rank.length,rank[100],rank.at(-1)],cities:S.cities.length,routes:S.routes.length,land:cells.length};
   });
   results.push({viewport,...result});await page.close();
  }
  console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r))}
}
main().catch(error=>{console.error(error);process.exitCode=1});
