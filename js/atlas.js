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
const ATLAS_ID_COLLATOR=new Intl.Collator(undefined,{numeric:true});
function atlasRanking(kind,metric='renown',scope='all'){
 const list=kind==='tradition'?[...S.historicalAtlas.tradition.values()]:kind==='people'?S.eths:kind==='religion'?S.rels:kind==='war'?S.wars:S.pols.filter(Boolean);
 const score=o=>{
  const r=historicalRecord(kind,o.id);
  if(kind!=='war'&&metric!=='renown'){
   if(metric==='peakArea')return r?.areaPeak?.area||(kind==='state'?o.peakArea||o.area||0:0);
   if(metric==='peakPopulation')return r?.populationPeak?.population||(kind==='state'?Math.max(o.maxPop||0,o.pop||0):kind==='religion'?o.peakPop||o.pop||0:o.peak||0);
   if(metric==='area')return r?.alive?r.area:kind==='state'&&o.alive?o.area||0:0;
   if(metric==='population')return r?.alive?r.population:o.alive?o.pop||o.population||0:0;
  }
  return kind==='religion'?religionRenown(o):kind==='war'?warRenown(o):kind==='tradition'?traditionRenown(o):kind==='people'?6*Math.log1p((r?.populationPeak?.population||o.peak||0)/1000)+Math.sqrt(r?.areaPeak?.area||0)/100:stateRenown(o);
 };
 return list.filter(o=>scope!=='living'||(kind==='war'?!o.finished:o.alive)).map(o=>({entity:o,score:score(o)})).sort((a,b)=>b.score-a.score||ATLAS_ID_COLLATOR.compare(String(a.entity.id),String(b.entity.id)));
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
 const visible=[];
 for(const c of cities)if(S.pop[c.cell]>=60000){const p=atlasScreenPoint(c.cell,view);if(p)visible.push({city:c,point:p})}
 if(!optimize)return visible.map(v=>v.city);
 visible.sort((a,b)=>S.pop[b.city.cell]-S.pop[a.city.cell]||a.city.cell-b.city.cell);
 const gap=view.zoom>=5?14:view.zoom>=2.6?30:48,gap2=gap*gap,bins=new Map(),out=[];
 for(const {city:c,point:p} of visible){const bx=Math.floor(p.x/gap),by=Math.floor(p.y/gap);let crowded=false;
  nearby:for(let x=bx-1;x<=bx+1;x++)for(let y=by-1;y<=by+1;y++)for(const q of bins.get(x+','+y)||[]){const dx=p.x-q.x,dy=p.y-q.y;if(dx*dx+dy*dy<gap2){crowded=true;break nearby}}
  if(crowded)continue;const key=bx+','+by;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(p);out.push(c);
 }
 return out;
}
function selectAtlasRoutes(routes,view,optimize=true){
 if(!optimize)return routes.map(r=>({...r,displayPath:r.path}));
 const ranked=[];
 for(const r of routes){if(!r.path?.length)continue;let point=null;for(const c of r.path){point=atlasScreenPoint(c,view);if(point)break}if(point)ranked.push({route:r,point})}
 ranked.sort((a,b)=>(S.pop[b.route.from]||0)+(S.pop[b.route.to]||0)-(S.pop[a.route.from]||0)-(S.pop[a.route.to]||0)||a.route.from-b.route.from||a.route.to-b.route.to);
 const limit=Math.max(8,Math.min(180,Math.ceil(view.width*view.height/(view.zoom<2?28000:view.zoom<5?12000:5000))));
 const bins=new Set(),out=[],gap=view.zoom<2?72:view.zoom<5?40:20;
 for(const {route:r,point} of ranked){const p=atlasScreenPoint(r.to,view)||atlasScreenPoint(r.from,view)||point;
  const key=Math.floor(p.x/gap)+','+Math.floor(p.y/gap);if(bins.has(key))continue;bins.add(key);
  const path=[r.path[0]];let last=path[0];
  for(let n=1;n<r.path.length-1;n++){const c=r.path[n];let dx=Math.abs(WD.cxA[c]-WD.cxA[last]);dx=Math.min(dx,W-dx);
   if(Math.hypot(dx,WD.cyA[c]-WD.cyA[last])*SC*view.scale>=4){path.push(c);last=c}}
  if(r.path.length>1)path.push(r.path.at(-1));out.push({...r,displayPath:path});if(out.length>=limit)break;
 }
 return out;
}
