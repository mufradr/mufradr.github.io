const test=require('node:test'),assert=require('node:assert/strict');
const {loadCore}=require('./core-harness.cjs');
test('atlas traditions, rankings and screen-space selection',async t=>{
 const a=loadCore();a.earth();
 await t.test('successors share state traditions without assigning ancestral defaults',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(32,45),j=WD.nb[c*4+1],p=S.pols[newPolity(c,null)],q=S.pols[newPolity(j,p)];
   const same=traditionAt(c).key===traditionAt(j).key;S.pol[j]=0;return {same,independent:traditionAt(j),color:traditionColor(traditionAt(c).key)}})()`);
  assert.ok(r.same);assert.equal(r.independent,null);assert.ok(r.color.every(Number.isFinite));
 });
 await t.test('area and population peaks remain after territorial loss; rankings use km²',()=>{
  a.start();const r=a.inspect(`(()=>{P.warRate=P.crisis=P.formRate=P.nomad=0;const c=cellAt(32,45),j=WD.nb[c*4+1],id=newPolity(c,null);S.pol[j]=id;
   politics();const first=S.pols[id].area,expected=WD.area[c]+WD.area[j];S.pol[j]=0;politics();const o=S.pols[id];
   return {first,expected,area:o.area,peak:o.peakArea,pop:o.pop,maxPop:o.maxPop,rank:atlasRanking('state','peakArea')[0].score}})()`);
  assert.ok(Math.abs(r.first-r.expected)<.01);assert.ok(r.peak>r.area);assert.ok(r.maxPop>=r.pop);assert.equal(r.rank,r.peak);
 });
 await t.test('renown distinguishes scale and freezes completed wars including year zero',()=>{
  a.start();const r=a.inspect(`(()=>{const base={id:0,born:-100,died:0,alive:false,maxPop:100000,peakArea:10000,conq:0,works:[]};
   const small=stateRenown(base),large=stateRenown({...base,id:1,maxPop:1000000,peakArea:100000});
   const w={id:0,a:[1],d:[2],start:-10,end:0,finished:true,gA:2,gD:1,populationAtStart:100000};S.year=10;const score=warRenown(w);S.year=1000;
   return {small,large,score,frozen:warRenown(w),religion:religionRenown({born:0,alive:true,pop:1000,peakPop:10000,peak:3,states:[1],kids:[2]})}})()`);
  assert.ok(r.large>r.small);assert.equal(r.score,r.frozen);assert.ok(r.religion>0);
 });
 await t.test('city spacing prefers larger visible cities and the limit can be disabled',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(40,20),j=WD.nb[c*4+1];S.pop[c]=100000;S.pop[j]=300000;
   const cities=[{cell:c,population:10000},{cell:j,population:30000}],v={scale:1,zoom:1,ox:-(WD.cxA[c]+.5)*SC+100,oy:-(WD.cyA[c]+.5)*SC+100,width:300,height:300};
   const low=selectAtlasCities(cities,v),all=selectAtlasCities(cities,v,false),high=selectAtlasCities(cities,{...v,scale:15,zoom:15,ox:-(WD.cxA[c]+.5)*SC*15+100,oy:-(WD.cyA[c]+.5)*SC*15+100});
   return {low:low.map(c=>c.cell),all:all.length,high:high.length,big:j}})()`);
  assert.deepEqual(r.low,[r.big]);assert.equal(r.all,2);assert.equal(r.high,2);
 });
 await t.test('route limits bound crowded routes, preserve endpoints and simplify only display copies',()=>{
  a.start();const r=a.inspect(`(()=>{const c=cellAt(40,20),j=c+20,path=Array.from({length:21},(_,k)=>c+k),routes=Array.from({length:100},(_,k)=>({from:c,to:j,path}));
   const v={scale:.1,zoom:1,ox:0,oy:0,width:200,height:100},limited=selectAtlasRoutes(routes,v),all=selectAtlasRoutes(routes,v,false);
   return {limited:limited.length,all:all.length,length:limited[0]?.displayPath.length,start:limited[0]?.displayPath[0],end:limited[0]?.displayPath.at(-1),c,j,original:path.length}})()`);
  assert.ok(r.limited>0&&r.limited<100);assert.equal(r.all,100);assert.ok(r.length<r.original);assert.equal(r.start,r.c);assert.equal(r.end,r.j);assert.equal(r.original,21);
 });
 await t.test('compact seed addresses preserve full custom and explicitly shared setups',()=>{
  a.start();const r=a.inspect(`(()=>{const c=exportExperiment();c.historySeed='a / 中';c.world.source='earth';c.world.fitClimate=true;
   for(const d of PDEF)c.rules[d[1]]=d[6];for(const d of CDEF)c.climate[d[0]]=d[5];c.rules.hearthMode='historical';c.rules.shuffleNames=false;
   const compact=experimentAddressHash(c),explicit=experimentAddressHash(c,true);c.rules.growth=.02;const custom=experimentAddressHash(c);
   return {compact,explicit:explicit.startsWith('#experiment='),growth:experimentFromHash(custom).rules.growth,seed:experimentFromHash(custom).historySeed}})()`);
  assert.equal(decodeURIComponent(r.compact.slice(6)),'a / 中');assert.ok(r.explicit);assert.equal(r.growth,.02);assert.equal(r.seed,'a / 中');
 });

});
