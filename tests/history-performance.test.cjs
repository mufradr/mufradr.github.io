const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadCore}=require('./core-harness.cjs');
const {chromium}=require('playwright');

test('peak footprint scratch links remain exact through shrinking, regrouping and new worlds',()=>{
 const app=loadCore();app.earth();app.start();
 app.inspect(`S.pols=[null];S.alive=[];for(let id=1;id<=8;id++){S.pols.push({id,full:'State '+id,civ:'Tradition '+(id%3),rgb:[id,80,150]});S.alive.push(id)}
 S.rels=Array.from({length:4},(_,id)=>({id,name:'Religion '+id,rgb:[20,id,70]}));S.historicalAtlas=newHistoricalAtlas();`);
 const peaks={state:new Map(),religion:new Map(),people:new Map(),tradition:new Map()};
 function check(){
  const s=app.state,w=app.world,groups={state:new Map(),religion:new Map(),people:new Map(),tradition:new Map()};
  const add=(kind,id,i)=>{let g=groups[kind].get(id);if(!g){g={area:0,population:0,cells:[]};groups[kind].set(id,g)}g.area+=w.area[i];g.population+=s.pop[i];g.cells.push(i)};
  for(const i of w.landIdx){const id=s.pol[i],e=s.eth[i];if(id)add('state',id,i);if(s.pop[i]<1)continue;
   if(s.rel[i]>=0)add('religion',s.rel[i],i);if(e>=0)add('people',e,i);
   if(id)add('tradition','state:'+s.pols[id].civ,i);
  }
  const rng=s.r.state();app.inspect('recordAtlasHistory()');assert.equal(s.r.state(),rng);
  for(const kind of Object.keys(groups)){
   assert.deepEqual([...s.historicalAtlas.active[kind]],[...groups[kind].keys()]);
   for(const [id,g] of groups[kind]){
    const actual=s.historicalAtlas[kind].get(id),previous=peaks[kind].get(id)||{};
    assert.equal(actual.area,g.area);assert.equal(actual.population,g.population);assert.equal(actual.cells,g.cells.length);assert.equal(actual.alive,true);
    for(const metric of ['area','population']){
     const current=actual[metric+'Peak'],old=previous[metric];
     if(!old||g[metric]>old.value){
      const decoded=[];for(let k=0;k<current.runs.length;k+=2)for(let i=current.runs[k],end=i+current.runs[k+1];i<end;i++)decoded.push(i);
      assert.deepEqual(decoded,g.cells);assert.equal(current.year,s.year);assert.equal(current[metric],g[metric]);
      previous[metric]={value:g[metric],snapshot:current};
     }else assert.strictEqual(current,old.snapshot,'unchanged peaks retain their immutable snapshots');
    }
    peaks[kind].set(id,previous);
   }
   for(const [id,actual] of s.historicalAtlas[kind])if(!groups[kind].has(id)){
    assert.equal(actual.alive,false);assert.equal(actual.area,0);assert.equal(actual.population,0);assert.equal(actual.cells,0);
   }
  }
 }
 for(let frame=0;frame<8;frame++){
  app.inspect(`S.year=${1500+frame};for(let k=0;k<WD.landIdx.length;k++){const i=WD.landIdx[k];S.pol[i]=k%5?1+(Math.floor(k/31)+${frame})%${frame<4?8:4}:0;S.rel[i]=k%4;S.pop[i]=k%7?1000+((k*17+${frame*701})%5000):0}`);
  check();
 }
 // Reuse every scratch buffer after a reset, including an unclaimed new world.
 app.start();app.inspect('recordAtlasHistory()');assert.equal(app.state.historicalAtlas.state.size,0);
 const count=[...app.state.historicalAtlas.people.values()].reduce((n,r)=>n+r.cells,0);
 assert.equal(count,app.world.landIdx.filter(i=>app.state.pop[i]>=1&&app.state.eth[i]>=0).length);
});

test('historical raster batches row spans with identical pixels and snapshot cache behavior',async t=>{
 const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
 const browser=await chromium.launch({executablePath,args:['--no-sandbox']});t.after(()=>browser.close());
 const page=await browser.newPage();
 await page.addScriptTag({content:'const W=400,H=200,SC=4,HW=W*SC,HH=H*SC;'});
 await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'../js/history-ui.js'),'utf8')});
 const result=await page.evaluate(()=>{
  const snapshot={sides:[{runs:new Uint32Array([0,16000,30000,1000,79990,10]),rgb:[70,120,170]},{runs:new Uint32Array([400,78000]),rgb:[200,90,40]}]};
  const reference=document.createElement('canvas');reference.width=HW;reference.height=HH;const ctx=reference.getContext('2d');let oldCalls=0;
  for(const side of snapshot.sides){ctx.fillStyle=`rgba(${side.rgb.join(',')},0.86)`;for(let k=0;k<side.runs.length;k+=2)for(let i=side.runs[k],end=i+side.runs[k+1];i<end;i++){ctx.fillRect(i%W*SC,Math.floor(i/W)*SC,SC,SC);oldCalls++}}
  const original=CanvasRenderingContext2D.prototype.fillRect;let calls=0;
  CanvasRenderingContext2D.prototype.fillRect=function(...args){calls++;return original.apply(this,args)};
  let raster,cached;try{raster=historicalRaster(snapshot);cached=historicalRaster(snapshot)}finally{CanvasRenderingContext2D.prototype.fillRect=original}
  const a=ctx.getImageData(0,0,HW,HH).data,b=raster.getContext('2d').getImageData(0,0,HW,HH).data;
  return {same:a.every((v,i)=>v===b[i]),cached:raster===cached,calls,oldCalls};
 });
 assert.equal(result.same,true);assert.equal(result.cached,true);assert.ok(result.oldCalls>result.calls*100);
});
