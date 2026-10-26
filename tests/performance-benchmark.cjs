// Reproducible CPU workloads, independent of rendering and save compression.
// node tests/performance-benchmark.cjs --baseline /path/to/previous-core.js
const fs=require('node:fs'),path=require('node:path'),{inflateSync}=require('node:zlib'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
function loadBenchmarkCore(corePath=path.join(root,'js/core.js'),historyPath,coloniesPath,assetsPath){
 const files=['assets/earth.js','js/core.js','js/colonies.js','js/atlas.js','js/history.js','js/experiments.js','js/diagnostics.js','js/save-codec.js','js/saves.js'];
 const source=files.map(f=>fs.readFileSync(f==='assets/earth.js'&&assetsPath?assetsPath:f==='js/core.js'?corePath:f==='js/history.js'&&historyPath?historyPath:f==='js/colonies.js'&&coloniesPath?coloniesPath:path.join(root,f),'utf8')).join('\n');
 return Function('inflateSync',source+`\nreturn {inspect(code){return eval(code)},step,slices:stepG,save:captureWorldSave,get state(){return S}}`)(inflateSync);
}
const EARTH_SETUP=`(()=>{const e=decodeEarth(inflateSync(Uint8Array.from(atob(EARTH_ELEV_B64),c=>c.charCodeAt(0))),inflateSync(Uint8Array.from(atob(KOPPEN_B64),c=>c.charCodeAt(0))));WD=genWorld({seed:'Earth',earth:true,height:e.height,kg:e.kg,fit:true});newHistory('cpu-benchmark');})()`;
// A deliberately busy controlled world; this is not a historical calibration.
const DEVELOPED_SETUP=`(()=>{S.year=1400;S.hearths.forEach(h=>h.done=true);for(let k=0;k<TECH.length;k++)S.firstTech[k]={y:1200,cell:15790};
 for(const i of WD.landIdx){if(S.eth[i]<0||WD.T[i]<-9)continue;for(let k=0;k<TECH.length;k++)S.tk[k][i]=0.6+0.4*((i+k*7)%29)/29;S.farm[i]=0.95;S.grain[i]=0.95;S.settled[i]=1500;S.s[i]=0.6;S.integ[i]=0.7;}
 computeK();for(const i of WD.landIdx)if(S.eth[i]>=0)S.pop[i]=S.K[i]*0.8;
 const regions=new Map();for(const i of WD.landIdx){if(S.pop[i]<500||S.eth[i]<0)continue;const key=Math.floor(WD.cxA[i]/10)+40*Math.floor(WD.cyA[i]/10);let p=regions.get(key);if(!p){p=newPolity(i,null);regions.set(key,p);}S.pol[i]=p;}
 politics();distBFS();recordStats();})()`;
function setup(app,scenario){app.inspect(EARTH_SETUP);if(scenario==='developed')app.inspect(DEVELOPED_SETUP);}
function digest(app){
 const save=app.save('Performance regression');save.savedAt='2026-01-01T00:00:00.000Z';
 return createHash('sha256').update(JSON.stringify(save,(_,v)=>ArrayBuffer.isView(v)?{type:v.constructor.name,hash:createHash('sha256').update(Buffer.from(v.buffer,v.byteOffset,v.byteLength)).digest('hex')}:v instanceof Map?{map:[...v]}:v instanceof Set?{set:[...v]}:v)).digest('hex');
}
function median(values){const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];}
function run(corePath,scenario,years,repeats,historyPath,coloniesPath,assetsPath){
 const times=[],sliceTimes=[];let output;
 for(let trial=0;trial<repeats;trial++){
  const app=loadBenchmarkCore(corePath,historyPath,coloniesPath,assetsPath);setup(app,scenario);
  // Warm both paths before timing, while preserving the same starting history.
  for(let n=0;n<20;n++)app.step();
  const start=performance.now();for(let n=0;n<years;n++){const slices=app.slices();let done=false;while(!done){const at=performance.now();done=slices.next().done;sliceTimes.push(performance.now()-at)}}times.push(performance.now()-start);
  const result={year:app.state.year,activeStates:app.state.alive.length,stateRecords:app.state.pols.length,peoples:app.state.eths.length,wars:app.state.wars.length,digest:digest(app)};
  if(output&&output.digest!==result.digest)throw Error('Benchmark trials diverged');output=result;
 }
 sliceTimes.sort((a,b)=>a-b);return {scenario,years,repeats,medianMs:median(times),trialsMs:times,sliceP95Ms:sliceTimes[Math.floor(sliceTimes.length*.95)],sliceMaxMs:sliceTimes.at(-1),...output};
}
if(require.main===module){
 const args=process.argv.slice(2),option=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1]};
 const years=Number(option('--years',120)),repeats=Number(option('--repeats',3)),scenario=option('--scenario','all'),baseline=option('--baseline',null),baselineHistory=option('--baseline-history',null),baselineColonies=option('--baseline-colonies',null);
 if(!Number.isInteger(years)||years<1||years>2000||!Number.isInteger(repeats)||repeats<1||repeats>9||!['all','early','developed'].includes(scenario))throw Error('Invalid benchmark options');
 const results=[];
 for(const name of scenario==='all'?['early','developed']:[scenario]){
  const before=baseline?run(path.resolve(baseline),name,years,repeats,baselineHistory?path.resolve(baselineHistory):undefined,baselineColonies?path.resolve(baselineColonies):undefined,option('--baseline-assets',undefined)):null;
  const after=run(undefined,name,years,repeats);
  if(before&&before.digest!==after.digest)throw Error(`${name} baseline continuation differs`);
  const result={before,after,speedup:before?before.medianMs/after.medianMs:null};results.push(result);console.log(JSON.stringify(result));
 }
}
module.exports={loadBenchmarkCore,setup,digest};
