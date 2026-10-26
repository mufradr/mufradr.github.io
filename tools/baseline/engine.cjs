const fs=require('node:fs'),path=require('node:path'),{inflateSync}=require('node:zlib'),{createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const defaultRoot=path.resolve(__dirname,'../..');
function hash(bytes){return createHash('sha256').update(bytes).digest('hex')}
function engineFiles(root){
 const excluded=new Set(['js/ui.js','js/history-ui.js','js/save-ui.js','js/save-store.js']);
 return [...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script\b[^>]*\bsrc="([^"?]+)(?:\?[^" ]*)?"/g)].map(m=>m[1]).filter(f=>!excluded.has(f));
}
function sourceIdentity(root=defaultRoot){
 const files=['index.html',...engineFiles(root),'js/ui.js','js/history-ui.js','js/save-ui.js','js/save-store.js','js/save-worker.js','styles/base.css','styles/app.css'];
 const hashes=Object.fromEntries([...new Set(files)].map(f=>[f,hash(fs.readFileSync(path.join(root,f)))]));
 return {commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),runtimeSHA256:hash(JSON.stringify(hashes)),files:hashes};
}
function loadEngine(root=defaultRoot){
 const source=engineFiles(root).map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
 return Function('inflateSync',source+`\nreturn {
  inspect(code){return eval(code)},step,slices:stepG,save:captureWorldSave,encodeGraph:encodeSaveGraph,
  get state(){return S},get world(){return WD},get rules(){return {...P}},get climate(){return {...CL}},version:ENGINE_VERSION,
  initialize(kind,seed){
   if(kind==='earth'){const e=decodeEarth(inflateSync(Uint8Array.from(atob(EARTH_ELEV_B64),c=>c.charCodeAt(0))),inflateSync(Uint8Array.from(atob(KOPPEN_B64),c=>c.charCodeAt(0))));WD=genWorld({seed:'Earth',earth:true,height:e.height,kg:e.kg,fit:true})}
   else WD=genWorld({seed:'development-generated-world-01',landFrac:P.landFrac});
   newHistory(seed);
  },issues(){return simulationIssues()}
 }`)(inflateSync);
}
// Explicitly injected stress fixtures, never presented as historical outcomes.
const developedSetup=`(()=>{S.year=1400;S.hearths.forEach(h=>h.done=true);for(let k=0;k<TECH.length;k++)S.firstTech[k]={y:1200,cell:15790};
 for(const i of WD.landIdx){if(S.eth[i]<0||WD.T[i]<-9)continue;for(let k=0;k<TECH.length;k++)S.tk[k][i]=0.6+0.4*((i+k*7)%29)/29;S.farm[i]=S.grain[i]=.95;S.settled[i]=1500;S.s[i]=.6;S.integ[i]=.7}
 computeK();for(const i of WD.landIdx)if(S.eth[i]>=0)S.pop[i]=S.K[i]*.8;
 const regions=new Map();for(const i of WD.landIdx){if(S.pop[i]<500||S.eth[i]<0)continue;const key=Math.floor(WD.cxA[i]/10)+40*Math.floor(WD.cyA[i]/10);let id=regions.get(key);if(!id){id=newPolity(i,null);regions.set(key,id)}S.pol[i]=id}
 politics();distBFS();recordStats();})()`;
const maritimeSetup=`(()=>{S.year=1500;P.warRate=P.crisis=0;const i=15790;S.pop[i]=150000;
 for(const k of [0,3,5,6,10,12,14,15,17,19,22]){S.tk[k][i]=1;S.firstTech[k]??={y:1400,cell:i}}
 newPolity(i,null);const v=traceVoyage(i,250*Math.PI/180,voyageRange(i));S.pop[v.to]=25000;S.pol[v.to]=0;S.seaRoutes.set('atlantic',{...v,born:1480,last:1500});})()`;
function prepare(app,kind,seed){app.initialize('earth',seed);if(kind==='developed')app.inspect(developedSetup);if(kind==='maritime')app.inspect(maritimeSetup)}
module.exports={defaultRoot,hash,engineFiles,sourceIdentity,loadEngine,developedSetup,maritimeSetup,prepare};
