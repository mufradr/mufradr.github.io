"use strict";
// Read-only atlas analysis and deterministic screen-space detail selection.
function traditionAt(i){
 const o=S.pol[i]?S.pols[S.pol[i]]:null,e=S.eth[i]>=0?S.eths[S.eth[i]]:null;
 if(o)return {key:'state:'+String(o.civ||o.base),name:String(o.civ||o.base)};
 if(e){const root=S.eths[e.fam]||e;return {key:'people:'+root.id,name:root.name}}
 return null;
}
function traditionColor(key){return hsl(hashStr(key)%360,0.48,0.52)}
function stateRenown(o){
 const years=Math.max(0,(o.alive?S.year:o.died??S.year)-o.born);
 return 6*Math.log1p(Math.max(o.maxPop||0,o.pop||0)/1000)+2*Math.sqrt((o.peakArea||o.area||0)/10000)
  +0.8*Math.sqrt(years)+2*(o.works?.length||0)+Math.min(100,(o.conq||0)*0.1);
}
function religionRenown(r){
 const years=Math.max(0,(r.alive?S.year:r.died??S.year)-r.born);
 return 6*Math.log1p((r.peakPop||r.pop||0)/1000)+2*Math.sqrt(r.peak||0)+0.5*Math.sqrt(years)
  +2*(r.states?.length||0)+3*(r.kids?.length||0);
}
function warRenown(w){
 const duration=Math.max(1,(w.finished?w.end:S.year)-w.start);
 return 5*Math.log1p((w.populationAtStart||0)/1000)+3*Math.sqrt((w.gA||0)+(w.gD||0))
  +Math.sqrt(duration)+2*new Set([...w.a,...w.d]).size;
}
function atlasRanking(kind,metric='renown',scope='all'){
 const list=kind==='religion'?S.rels:kind==='war'?S.wars:S.pols.filter(Boolean);
 const score=o=>kind==='religion'?religionRenown(o):kind==='war'?warRenown(o):metric==='area'?(o.alive?o.area||0:0):metric==='population'?(o.alive?o.pop||0:0):metric==='peakArea'?o.peakArea||o.area||0:metric==='peakPopulation'?Math.max(o.maxPop||0,o.pop||0):stateRenown(o);
 return list.filter(o=>scope!=='living'||(kind==='war'?!o.finished:o.alive)).map(o=>({entity:o,score:score(o)}))
  .sort((a,b)=>b.score-a.score||a.entity.id-b.entity.id);
}
// Resolve wrapped coordinates in CSS pixels before choosing display density.
function atlasScreenPoint(cell,view){
 const worldWidth=HW*view.scale;
 let x=view.ox+(WD.cxA[cell]+0.5)*SC*view.scale;
 x=((x%worldWidth)+worldWidth)%worldWidth;
 if(x>view.width+40&&x-worldWidth>=-40)x-=worldWidth;
 const y=view.oy+(WD.cyA[cell]+0.5)*SC*view.scale;
 return x>=-40&&x<=view.width+40&&y>=-40&&y<=view.height+40?{x,y}:null;
}
function selectAtlasCities(cities,view,optimize=true){
 const visible=cities.filter(c=>S.pop[c.cell]>=60000&&atlasScreenPoint(c.cell,view));
 if(!optimize)return visible;
 visible.sort((a,b)=>S.pop[b.cell]-S.pop[a.cell]||a.cell-b.cell);
 const gap=view.zoom>=5?14:view.zoom>=2.6?30:48,bins=new Map(),out=[];
 for(const c of visible){const p=atlasScreenPoint(c.cell,view),bx=Math.floor(p.x/gap),by=Math.floor(p.y/gap);let crowded=false;
  for(let x=bx-1;x<=bx+1;x++)for(let y=by-1;y<=by+1;y++)for(const q of bins.get(x+','+y)||[])if(Math.hypot(p.x-q.x,p.y-q.y)<gap)crowded=true;
  if(crowded)continue;const key=bx+','+by;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(p);out.push(c);
 }
 return out;
}
function selectAtlasRoutes(routes,view,optimize=true){
 if(!optimize)return routes.map(r=>({...r,displayPath:r.path}));
 const ranked=routes.filter(r=>r.path?.some(c=>atlasScreenPoint(c,view))).sort((a,b)=>(S.pop[b.from]||0)+(S.pop[b.to]||0)-(S.pop[a.from]||0)-(S.pop[a.to]||0)||a.from-b.from||a.to-b.to);
 const limit=Math.max(8,Math.min(180,Math.ceil(view.width*view.height/(view.zoom<2?28000:view.zoom<5?12000:5000))));
 const bins=new Set(),out=[],gap=view.zoom<2?72:view.zoom<5?40:20;
 for(const r of ranked){let p=atlasScreenPoint(r.to,view)||atlasScreenPoint(r.from,view);if(!p){const cell=r.path.find(c=>atlasScreenPoint(c,view));p=atlasScreenPoint(cell,view)}
  const key=Math.floor(p.x/gap)+','+Math.floor(p.y/gap);if(bins.has(key))continue;bins.add(key);
  const path=[r.path[0]];let last=path[0];
  for(let n=1;n<r.path.length-1;n++){const c=r.path[n];let dx=Math.abs(WD.cxA[c]-WD.cxA[last]);dx=Math.min(dx,W-dx);
   if(Math.hypot(dx,WD.cyA[c]-WD.cyA[last])*SC*view.scale>=4){path.push(c);last=c}}
  if(r.path.length>1)path.push(r.path.at(-1));out.push({...r,displayPath:path});if(out.length>=limit)break;
 }
 return out;
}
