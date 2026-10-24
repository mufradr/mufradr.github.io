"use strict";
// Two independent, dated peak footprints per entity; no yearly map archive or RNG use.
function appendFootprintRun(runs,cell){const n=runs.length;if(n&&runs[n-2]+runs[n-1]===cell)runs[n-1]++;else runs.push(cell,1)}
function encodeFootprint(cells){const runs=[];for(const c of [...cells].sort((a,b)=>a-b))appendFootprintRun(runs,c);return Uint32Array.from(runs)}
function eachFootprint(runs,visit){for(let k=0;k<runs.length;k+=2)for(let c=runs[k],end=c+runs[k+1];c<end;c++)visit(c)}
function newHistoricalAtlas(){return {state:new Map(),religion:new Map(),people:new Map(),tradition:new Map(),war:new Map(),active:{state:new Set(),religion:new Set(),people:new Set(),tradition:new Set()}}}
function recordAtlasHistory(){
 const s=S,w=WD,h=s.historicalAtlas;if(!h)return;
 const groups={state:new Map(),religion:new Map(),people:new Map(),tradition:new Map()},stateKeys=new Map(),familyKeys=new Map();
 for(const id of s.alive){const o=s.pols[id];stateKeys.set(id,'state:'+String(o.civ||o.base))}
 const add=(kind,id,cell,pop)=>{let g=groups[kind].get(id);if(!g){g={area:0,population:0,cells:0,runs:[]};groups[kind].set(id,g)}g.area+=w.area[cell];g.population+=pop;g.cells++;appendFootprintRun(g.runs,cell)};
 for(const i of w.landIdx){const p=s.pop[i],id=s.pol[i];if(id)add('state',id,i,p);
  if(p<1)continue;
  if(s.rel[i]>=0)add('religion',s.rel[i],i,p);
  if(s.eth[i]>=0)add('people',s.eth[i],i,p);
  let key;if(id){const o=s.pols[id];key=stateKeys.get(id)||'state:'+String(o.civ||o.base)}
  else if(s.eth[i]>=0){const family=s.eths[s.eth[i]].fam;if(!familyKeys.has(family))familyKeys.set(family,'people:'+family);key=familyKeys.get(family)}
  if(key)add('tradition',key,i,p);
 }
 for(const kind of Object.keys(groups)){
  for(const id of h.active[kind]){const r=h[kind].get(id);r.alive=false;r.area=0;r.population=0;r.cells=0}
  h.active[kind]=new Set(groups[kind].keys());
  for(const [id,g] of groups[kind]){
   let r=h[kind].get(id);const o=kind==='state'?s.pols[id]:kind==='religion'?s.rels[id]:kind==='people'?s.eths[id]:null;
   const name=o?(o.full||o.name):id.startsWith('state:')?id.slice(6):(s.eths[Number(id.slice(7))]?.name||'Ancestral family');
   if(!r){r={id,name,born:s.year,alive:true,area:0,population:0,cells:0,areaPeak:null,populationPeak:null};h[kind].set(id,r)}
   r.name=name;r.lastYear=s.year;r.alive=true;r.area=g.area;r.population=g.population;r.cells=g.cells;
   const growArea=!r.areaPeak||g.area>r.areaPeak.area,growPopulation=!r.populationPeak||g.population>r.populationPeak.population;
   if(growArea||growPopulation){const snap={year:s.year,area:g.area,population:g.population,cells:g.cells,runs:Uint32Array.from(g.runs),rgb:o?Array.from(o.rgb):traditionColor(id)};if(growArea)r.areaPeak=snap;if(growPopulation)r.populationPeak=snap}
  }
 }
}
function historicalRecord(kind,id){return S.historicalAtlas?.[kind]?.get(id)||null}
function historicalSnapshot(kind,id,metric='area'){
 const r=historicalRecord(kind,id);if(!r)return null;
 if(kind==='war'){
  if(metric!=='captures')return r.initial;
  if(!r.captured.size)return null;
  const runs=encodeFootprint(r.captured);return {year:r.lastCaptureYear,area:r.capturedArea,population:null,cells:r.captured.size,runs,rgb:[205,77,52]};
 }
 return metric==='population'?r.populationPeak:r.areaPeak;
}
function traditionRenown(r){return 6*Math.log1p((r.populationPeak?.population||0)/1000)+2*Math.sqrt((r.areaPeak?.area||0)/10000)+0.8*Math.sqrt(Math.max(0,(r.alive?S.year:r.lastYear)-r.born))}
function recordWarStart(war){
 const h=S.historicalAtlas;if(!h)return;const attackers=new Set(war.a),defenders=new Set(war.d),all=[],a=[],d=[];let area=0,population=0,cells=0;
 for(const i of WD.landIdx){const id=S.pol[i];if(!attackers.has(id)&&!defenders.has(id))continue;appendFootprintRun(all,i);appendFootprintRun(attackers.has(id)?a:d,i);area+=WD.area[i];population+=S.pop[i];cells++}
 const initial={year:S.year,area,population,cells,runs:Uint32Array.from(all),rgb:[75,125,170],sides:[{runs:Uint32Array.from(a),rgb:[75,125,170]},{runs:Uint32Array.from(d),rgb:[208,113,57]}]};
 h.war.set(war.id,{id:war.id,initial,captured:new Set(),capturedArea:0,lastCaptureYear:null});
}
function recordWarCapture(id,cell){const r=historicalRecord('war',id);if(r&&!r.captured.has(cell)){r.captured.add(cell);r.capturedArea+=WD.area[cell]}if(r)r.lastCaptureYear=S.year}
function footprintBounds(runs){
 const cols=new Set();let y0=H,y1=-1;eachFootprint(runs,i=>{cols.add(i%W);y0=Math.min(y0,Math.floor(i/W));y1=Math.max(y1,Math.floor(i/W))});
 if(!cols.size)return null;const xs=[...cols].sort((a,b)=>a-b);let gap=-1,start=xs[0];
 for(let k=0;k<xs.length;k++){const next=xs[(k+1)%xs.length]+(k===xs.length-1?W:0),d=next-xs[k];if(d>gap){gap=d;start=next%W}}
 return {x:start,y:y0,width:W-gap+1,height:y1-y0+1};
}
