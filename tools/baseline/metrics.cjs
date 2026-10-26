const protocol=require('./protocol.json');
function distribution(values){
 const a=values.filter(Number.isFinite).sort((x,y)=>x-y),at=p=>a.length?a[Math.min(a.length-1,Math.ceil(p*a.length)-1)]:null;
 return {count:a.length,min:a[0]??null,median:at(.5),p95:at(.95),p99:at(.99),max:a.at(-1)??null};
}
function memorySample(){const m=process.memoryUsage();return {rssBytes:m.rss,heapUsedBytes:m.heapUsed,externalBytes:m.external,arrayBufferBytes:m.arrayBuffers}}
function reachableBuffers(...roots){
 const seen=new Set(),buffers=new Set(),pending=[...roots];let bytes=0;
 while(pending.length){const o=pending.pop();if(!o||typeof o!=='object'||seen.has(o))continue;seen.add(o);
  if(ArrayBuffer.isView(o)){if(!buffers.has(o.buffer)){buffers.add(o.buffer);bytes+=o.buffer.byteLength}continue}
  if(o instanceof ArrayBuffer){if(!buffers.has(o)){buffers.add(o);bytes+=o.byteLength}continue}
  if(o instanceof Map){for(const [k,v] of o){pending.push(k,v)}}else if(o instanceof Set){for(const v of o)pending.push(v)}else for(const v of Object.values(o))pending.push(v);
 }
 return {bytes,buffers:buffers.size};
}
class Observer{
 constructor(world,options=protocol){
  this.protocol=options;this.records=new Map();this.previousOwned=new Set();this.seenColonies=new Set();this.independences=new Set();this.snapshots=[];this.first={chiefdom:null,kingdom:null,empire:null,oceanKnowledge:null,colony:null,colonialIndependence:null};this.colonies=[];this.regions=options.regions.map(r=>({...r,cells:[]}));
  for(const i of world.landIdx){const lat=world.lat[i]*180/Math.PI,lon=(world.cxA[i]+.5)*360/400-180;for(const r of this.regions){const [a,b,c,d]=r.box;if(lat>=a&&lat<=b&&lon>=c&&lon<=d)r.cells.push(i)}}
 }
 observe(s,w,snapshot=false){
  const owned=new Map();let population=0;
  for(const i of w.landIdx){population+=s.pop[i];const id=s.pol[i];if(!id)continue;let o=owned.get(id);if(!o){o={cells:0,population:0,area:0};owned.set(id,o)}o.cells++;o.population+=s.pop[i];o.area+=w.area[i]}
  const y=s.year,c=this.protocol.majorDecline;
  for(const [id,v] of owned){const o=s.pols[id];let r=this.records.get(id);
   if(!r){r={id,name:o.full,kind:o.kind,born:o.born,firstObserved:y,lastObserved:y,peakArea:0,peakCells:0,peakPopulation:0,peakYear:y,firstEmpireYear:null,empireObservedSamples:0,major:false,decline:null,lastAboveHealthy:y,ended:null,ownershipGaps:0};this.records.set(id,r)}
   if(r.ended!==null){r.ownershipGaps++;r.ended=null}
   r.lastObserved=y;r.name=o.full;r.kind=o.kind;
   if(v.area>r.peakArea){r.peakArea=v.area;r.peakYear=y}r.peakCells=Math.max(r.peakCells,v.cells);r.peakPopulation=Math.max(r.peakPopulation,v.population);
   r.major||=o.kind==='state'&&v.cells>=c.minimumPeakCells&&v.population>=c.minimumPeakPopulation;
   if(v.area>=r.peakArea*c.healthyAreaFraction)r.lastAboveHealthy=y;
   this.decline(r,v.area,y,c);
   if(o.kind==='state'){
    this.first.chiefdom??=y;
    if(['Kingdom','Khanate','Empire','Khaganate'].includes(o.tier))this.first.kingdom??=y;
    if(['Empire','Khaganate'].includes(o.tier)){this.first.empire??=y;r.firstEmpireYear??=y;r.empireObservedSamples++}
   }
  }
  for(const id of this.previousOwned)if(!owned.has(id)){const r=this.records.get(id);r.ended=y;this.decline(r,0,y,c)}
  this.previousOwned=new Set(owned.keys());
  const ocean=s.firstTech[17];if(ocean)this.first.oceanKnowledge??=ocean.y;
  for(const col of s.colonies.values()){
   const key=col.cell+':'+col.founded+':'+col.founderPeople;
   if(!this.seenColonies.has(key)){this.seenColonies.add(key);this.first.colony=this.first.colony===null?col.founded:Math.min(this.first.colony,col.founded);this.colonies.push({cell:col.cell,founded:col.founded,source:col.source,homeState:col.homeState,founderPeople:col.founderPeople})}
   if(col.independentState){this.independences.add(col.independentState);this.first.colonialIndependence=this.first.colonialIndependence===null?col.independentYear:Math.min(this.first.colonialIndependence,col.independentYear)}
  }
  if(snapshot)this.snapshots.push(this.snapshot(s,w,owned,population));
 }
 decline(r,area,y,c){if(r.major&&!r.decline&&area<=r.peakArea*c.retainedAreaFraction){const years=y-r.lastAboveHealthy;r.decline={year:y,peakYear:r.peakYear,peakArea:r.peakArea,remainingArea:area,yearsFromHealthy:years,type:years<=c.suddenWithinYears?'sudden':'gradual'}}}
 snapshot(s,w,owned,population){
  const bloc=id=>{const seen=new Set();while(s.pols[id]?.over&&!seen.has(id)){seen.add(id);id=s.pols[id].over}return id};
  const regions=this.regions.map(r=>{let pop=0,governed=0;const states=new Map(),blocs=new Map();for(const i of r.cells){const p=s.pop[i],id=s.pol[i];pop+=p;if(!id)continue;governed+=p;states.set(id,(states.get(id)||0)+p);const b=bloc(id);blocs.set(b,(blocs.get(b)||0)+p)}
   return {name:r.name,population:pop,polities:states.size,governedShare:pop?governed/pop:0,largestStateShare:pop?Math.max(0,...states.values())/pop:0,largestBlocShare:pop?Math.max(0,...blocs.values())/pop:0};
  });
  const colonies=[...s.colonies.values()],active=colonies.filter(c=>c.status==='active');
  return {year:s.year,population,polities:owned.size,states:[...owned.keys()].filter(id=>s.pols[id].kind==='state').length,empires:[...owned.keys()].filter(id=>['Empire','Khaganate'].includes(s.pols[id].tier)).length,
   largestStateArea:Math.max(0,...[...owned.values()].map(o=>o.area)),regions,
   overseas:{routes:s.seaRoutes.size,totalFoundings:this.seenColonies.size,active:active.length,dependent:active.filter(c=>c.administration==='dependent').length,independentRegions:this.independences.size,diasporas:s.seaDiasporas.size,communityPopulation:active.reduce((n,c)=>n+c.settlers,0)},
   wars:s.wars.length,outbreaks:s.outbreaks.length,plagueDeaths:s.outbreaks.reduce((n,o)=>n+o.deaths,0),cities:s.cities.length,peoples:s.eths.length};
 }
 result(endYear){
  const records=[...this.records.values()],empires=records.filter(r=>r.firstEmpireYear!==null),ended=empires.filter(r=>r.ended!==null),living=empires.filter(r=>r.ended===null),declines=records.filter(r=>r.decline);
  return {first:this.first,totalPolitiesObserved:records.length,statesObserved:records.filter(r=>r.kind==='state').length,
   empireLongevity:{total:empires.length,ended:ended.length,rightCensored:living.length,completedStateLifetimes:distribution(ended.map(r=>r.ended-r.firstObserved)),completedYearsSinceFirstEmpire:distribution(ended.map(r=>r.ended-r.firstEmpireYear)),ongoingObservedYears:distribution(living.map(r=>endYear-r.firstObserved))},
   majorDecline:{eligible:records.filter(r=>r.major).length,observed:declines.length,sudden:declines.filter(r=>r.decline.type==='sudden').length,gradual:declines.filter(r=>r.decline.type==='gradual').length,notYetObserved:records.filter(r=>r.major&&!r.decline).length},
   snapshots:this.snapshots,polities:records,colonies:this.colonies};
 }
}
module.exports={distribution,memorySample,reachableBuffers,Observer};
