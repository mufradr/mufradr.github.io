"use strict";
// One raster cache, shared by inspector previews and the historical main map.
let historicalCache=null;
function historyKind(t){return {pol:'state',rel:'religion',eth:'people',tradition:'tradition',war:'war'}[t]}
function historicalRaster(snapshot){
 if(historicalCache?.snapshot===snapshot)return historicalCache.canvas;
 const canvas=document.createElement('canvas');canvas.width=HW;canvas.height=HH;const ctx=canvas.getContext('2d');
 for(const side of snapshot.sides||[snapshot]){ctx.fillStyle=`rgba(${side.rgb.join(',')},0.86)`;eachFootprint(side.runs,i=>ctx.fillRect((i%W)*SC,Math.floor(i/W)*SC,SC,SC))}
 historicalCache={snapshot,canvas};return canvas;
}
function historicalSection(t,id){
 const kind=historyKind(t);if(!kind)return '';
 const metric=ui.historical?.kind===kind&&String(ui.historical.id)===String(id)?ui.historical.metric:kind==='war'?'initial':'area';
 return `<h3 class="sec">Historical footprint</h3><label>View <select id="history-metric">${(kind==='war'?[['initial','Participants at outbreak'],['captures','Recorded captures']]:[['area','Peak area'],['population','Peak population']]).map(([v,n])=>`<option value="${v}"${v===metric?' selected':''}>${n}</option>`).join('')}</select></label><div id="history-detail"></div><canvas class="mini" id="history-map" width="800" height="400" aria-label="Historical territory map"></canvas><button class="btn" id="history-show" type="button">Show on map</button><p class="note">Recorded snapshots only; area and population peaks can occur in different years. Colors show dominant provincial identity. Terrain is the current base map.</p>`;
}
function bindHistoricalSection(t,id){
 const select=$('history-metric');if(!select)return;
 const update=()=>{
  const kind=historyKind(t),snapshot=historicalSnapshot(kind,kind==='tradition'?String(id):+id,select.value),cv=$('history-map');
  cv.hidden=!snapshot;$('history-show').disabled=!snapshot;
  $('history-detail').innerHTML=snapshot?`<p>${fy(snapshot.year)} · ${fmtN(snapshot.area)} km²${snapshot.population==null?'':' · '+fmtN(snapshot.population)+' people'}</p>${kind==='war'?'<p class="note">Blue: attackers; orange: defenders at outbreak. Captures show provinces taken in recorded battles, not continuous control.</p>':''}`:'<p class="note">No footprint recorded for this view yet. Earlier territory cannot be reconstructed.</p>';
  if(snapshot){const ctx=cv.getContext('2d'),bounds=footprintBounds(snapshot.runs);ctx.clearRect(0,0,cv.width,cv.height);if(bounds){const pad=4,bw=Math.min(W,bounds.width+pad*2),bh=Math.min(H,bounds.height+pad*2),scale=Math.min(cv.width/(bw*SC),cv.height/(bh*SC)),x=(bounds.x+bounds.width/2)*SC,y=(bounds.y+bounds.height/2)*SC;ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.scale(scale,scale);ctx.translate(-x,-y);ctx.imageSmoothingEnabled=false;for(let k=-1;k<=1;k++){ctx.drawImage(baseCv,k*HW,0);ctx.drawImage(historicalRaster(snapshot),k*HW,0)}ctx.restore()}}
 };
 select.onchange=update;$('history-show').onclick=()=>showHistorical(t,id,select.value);update();
}
function showHistorical(t,id,metric){
 const kind=historyKind(t);id=kind==='tradition'?String(id):+id;
 setRunning(false);if(ui.gen){while(!ui.gen.next().done){}ui.gen=null;noteCompletedYear()}
 const snapshot=historicalSnapshot(kind,id,metric);if(!snapshot){closeHistorical();renderPage();return}
 const camera=ui.historical?.camera||{z:ui.z,ox:ui.ox,oy:ui.oy};ui.historical={kind,id,metric,snapshot,camera};
 const r=historicalRecord(kind,id),name=kind==='war'?S.wars[id].name:r.name,b=footprintBounds(snapshot.runs);
 const label=kind==='war'?(metric==='captures'?'Recorded captures':'Participants at outbreak'):(metric==='population'?'Peak population':'Peak area');
 $('historical-banner').innerHTML=`<strong>${esc(name)}</strong><span>${label} · ${fy(snapshot.year)} · simulation paused</span><button class="btn" type="button" id="history-close">Return to live map</button>`;$('historical-banner').hidden=false;$('tip').hidden=true;$('legend').hidden=true;$('legtog').hidden=true;
 $('history-close').onclick=closeHistorical;
 if(b){ui.z=clamp(Math.min(mapDim.w/((b.width+8)*SC*ui.bs),mapDim.h/((b.height+8)*SC*ui.bs)),1,ZMAX);const k=ui.bs*ui.z;ui.ox=mapDim.w/2-(b.x+b.width/2)*SC*k;ui.oy=mapDim.h/2-(b.y+b.height/2)*SC*k;clampView()}
 ui.dirty=true;buildComp();drawMap();renderPage();
}
function closeHistorical(){
 if(!ui.historical)return;Object.assign(ui,ui.historical.camera);ui.historical=null;$('historical-banner').hidden=true;$('legend').hidden=false;$('legtog').hidden=false;drawLegend();wakeKnowledgeSelector();ui.dirty=true;buildComp();drawMap();
}
