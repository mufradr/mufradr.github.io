#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),z=require('node:zlib'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const protocol=require('./protocol.json');
const {defaultRoot,hash,sourceIdentity,loadEngine,prepare}=require('./engine.cjs');
const {Observer,distribution,memorySample,reachableBuffers}=require('./metrics.cjs');
function args(argv){const out={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw Error('Expected --option');const k=argv[i].slice(2);if(['resume'].includes(k))out[k]=true;else{if(!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Missing value for '+k);out[k]=argv[++i]}}return out}
function atomic(file,data){const temp=file+'.tmp';fs.writeFileSync(temp,data);fs.renameSync(temp,file)}
function saveMeasurement(app){
 const before=memorySample(),payload=app.save('Development baseline');payload.savedAt='2026-01-01T00:00:00.000Z';
 try{const at=performance.now(),raw=app.encodeGraph(payload),encodeMs=performance.now()-at,start=performance.now(),gzip=z.gzipSync(raw,{level:6}),gzipMs=performance.now()-start;
  return {rawBytes:raw.length,gzipBytes:gzip.length,encodeMs,gzipMs,rawSHA256:hash(raw),before,after:memorySample()};
 }catch(error){return {error:error.message,before,after:memorySample()}}
}
function definition(id){
 if(id.startsWith('earth-')&&protocol.historicalSeeds.includes(id.slice(6)))return {id,category:'historical-earth',kind:'earth',seed:id.slice(6),endYear:protocol.endYear,repeats:1,warmupYears:0};
 if(id==='generated-development-01')return {id,category:'ordinary-generated',kind:'generated',seed:'development-01',endYear:protocol.endYear,repeats:1,warmupYears:0};
 if(['stress-early','stress-developed','stress-maritime'].includes(id)){const kind=id.slice(7),maritime=kind==='maritime';return {id,category:'prepared-stress',kind,seed:maritime?'regression-history':'cpu-benchmark',years:maritime?protocol.stress.maritimeYears:protocol.stress.measuredYears,repeats:maritime?1:protocol.stress.repeats,warmupYears:maritime?0:protocol.stress.warmupYears}}
 throw Error('Unknown run '+id);
}
async function runOne(id,root,out,options){
 const d=definition(id);if(options['end-year']!==undefined){const n=Number(options['end-year']);if(d.category==='prepared-stress'||!Number.isInteger(n)||n<=-9000||n>1800)throw Error('Invalid historical --end-year');d.endYear=n}
 const trials=[];
 for(let repeat=0;repeat<d.repeats;repeat++){
  const app=loadEngine(root),at=performance.now();
  if(d.category==='prepared-stress')prepare(app,d.kind,d.seed);else app.initialize(d.kind,d.seed);
  const setupMs=performance.now()-at,initial=repeat===0?saveMeasurement(app):null;
  for(let n=0;n<d.warmupYears;n++)app.step();
  const startYear=app.state.year,end=d.endYear??startYear+d.years,observer=new Observer(app.world,{...protocol,regions:d.kind==='generated'?[]:protocol.regions});observer.observe(app.state,app.world,true);
  const years=[],slices=[],memory=[{year:startYear,...memorySample()}],integrity=[],started=performance.now();let measurementMs=0;
  for(let y=startYear+1;y<=end;y++){
   const gen=app.slices();let total=0,next;
   do{const t=performance.now();next=gen.next();const elapsed=performance.now()-t;slices.push(elapsed);total+=elapsed}while(!next.done);
   years.push(total);const t=performance.now(),snapshot=y%protocol.snapshotEvery===0||y===end;observer.observe(app.state,app.world,snapshot);
   if(y%protocol.integrityEvery===0||y===end){const issues=app.issues();integrity.push({year:y,issues});memory.push({year:y,...memorySample()});console.log(JSON.stringify({run:id,repeat,year:y,elapsedSeconds:Math.round((performance.now()-started)/1000),states:app.state.alive.length,issues:issues.length}))}
   measurementMs+=performance.now()-t;
  }
  const loopWallMs=performance.now()-started,beforeSave=memorySample(),outcomes=observer.result(app.state.year),worldBuffers=reachableBuffers(app.world,app.state),final=saveMeasurement(app);
  trials.push({repeat,startYear,endYear:app.state.year,setupMs,rules:app.rules,climate:app.climate,initialSave:initial,finalSave:final,worldBuffers,
   simulation:{years:years.length,totalKernelMs:years.reduce((n,v)=>n+v,0),yearMs:distribution(years),sliceMs:distribution(slices),slicesOver16ms:slices.filter(v=>v>16).length,slicesOver50ms:slices.filter(v=>v>50).length,measurementMs,wallMs:loopWallMs},
   memory:{samples:memory,beforeFinalSave:beforeSave,processPeakRSSBytes:process.resourceUsage().maxRSS*1024},integrity,outcomes});
 }
 if(d.repeats>1){const hashes=trials.map(t=>t.finalSave.rawSHA256);assert.ok(hashes.every(v=>v&&v===hashes[0]),'Repeated stress trials must have identical final checkpoints')}
 const result={schemaVersion:1,protocol:protocol.protocol,definition:d,source:sourceIdentity(root),trials};
 atomic(path.join(out,id+'.json.gz'),z.gzipSync(JSON.stringify(result),{level:9}));return result;
}
function summarize(out){
 const runs=fs.readdirSync(out).filter(f=>f.endsWith('.json.gz')).sort().map(file=>{const r=JSON.parse(z.gunzipSync(fs.readFileSync(path.join(out,file)))),t=r.trials[0],o=t.outcomes;
  return {id:r.definition.id,category:r.definition.category,years:t.simulation.years,repeats:r.trials.length,startYear:t.startYear,endYear:t.endYear,first:o.first,empireLongevity:o.empireLongevity,majorDecline:o.majorDecline,final:o.snapshots.at(-1),
   performance:{kernelMs:distribution(r.trials.map(t=>t.simulation.totalKernelMs)),sliceP95Ms:distribution(r.trials.map(t=>t.simulation.sliceMs.p95)),sliceP99Ms:distribution(r.trials.map(t=>t.simulation.sliceMs.p99)),maxSliceMs:Math.max(...r.trials.map(t=>t.simulation.sliceMs.max))},
   memory:t.memory,worldBuffers:t.worldBuffers,save:{initial:t.initialSave,final:t.finalSave},integrityIssues:r.trials.flatMap(t=>t.integrity).filter(x=>x.issues.length)};
 });
 atomic(path.join(out,'summary.json'),JSON.stringify({schemaVersion:1,protocol:protocol.protocol,runs},null,2)+'\n');
 const num=v=>v===null?'—':Math.round(v).toLocaleString('en-US'),mb=v=>v===undefined?'error':(v/1048576).toFixed(1);
 let md='# v0.16.0 development baseline\n\nMeasurements, not historical targets. Dates use the engine’s numeric calendar. Ordinary runs and injected stress fixtures are reported separately. See [method](../../../docs/BASELINE.md).\n\n';
 for(const category of ['historical-earth','ordinary-generated','prepared-stress']){
  md+='## '+category+'\n\n| Run | Years / trial | First kingdom | First empire | Completed empire-state lifetime median | Major declines: sudden / gradual | Final colonies | Final gzip save MiB |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n';
  for(const r of runs.filter(r=>r.category===category))md+=`| ${r.id} | ${r.years} | ${num(r.first.kingdom)} | ${num(r.first.empire)} | ${num(r.empireLongevity.completedStateLifetimes.median)} | ${r.majorDecline.sudden} / ${r.majorDecline.gradual} | ${r.final.overseas.totalFoundings} | ${mb(r.save.final.gzipBytes)} |\n`;
  md+='\n';
 }
 md+='## Measured kernel cost and memory\n\nKernel timing excludes observation, integrity scans, startup, saving and rendering. Historical rows are a single run. Stress CPU rows use three independent engines within one child process, one engine at a time, with identical final checkpoints; repeat-process memory can include prior engines awaiting garbage collection. RSS includes the runner and save processing.\n\n| Run | Kernel seconds / trial (median) | Slice p95 ms (median) | Slice p99 ms (median) | Maximum slice ms | Process peak RSS MiB | Final saved-world buffers MiB |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n';
 for(const r of runs)md+=`| ${r.id} | ${(r.performance.kernelMs.median/1000).toFixed(2)} | ${r.performance.sliceP95Ms.median.toFixed(2)} | ${r.performance.sliceP99Ms.median.toFixed(2)} | ${r.performance.maxSliceMs.toFixed(2)} | ${mb(r.memory.processPeakRSSBytes)} | ${mb(r.worldBuffers.bytes)} |\n`;
 md+='\nOngoing empire states are right-censored and excluded from completed-lifetime medians. Decline measures formal state IDs, so succession/replacement can register as abrupt loss without an equivalent collapse of population or civilization. Regional snapshots, all state observations, seed/settings, memory samples and exact checkpoint hashes are preserved in the compressed run files.\n';
 atomic(path.join(out,'REPORT.md'),md);return runs;
}
async function main(){
 const options=args(process.argv.slice(2)),root=path.resolve(options['engine-root']||defaultRoot),out=path.resolve(options.out||path.join(defaultRoot,'benchmarks/baselines/v0.16.0'));fs.mkdirSync(out,{recursive:true});
 if(options.child){await runOne(options.child,root,out,options);return}
 const selected=(options.runs==='all'?[...protocol.historicalSeeds.map(s=>'earth-'+s),'generated-development-01','stress-early','stress-developed','stress-maritime']:!options.runs||options.runs==='initial'?protocol.initialRuns:options.runs.split(','));selected.forEach(definition);
 const source=sourceIdentity(root),runnerFiles=['protocol.json','engine.cjs','metrics.cjs','run.cjs'],runnerSHA256=hash(runnerFiles.map(f=>fs.readFileSync(path.join(__dirname,f))).join('\n'));
 const manifestFile=path.join(out,'manifest.json'),identity={protocol,source,runnerSHA256,requestedEndYear:options['end-year']??null};
 if(fs.existsSync(manifestFile)){const old=JSON.parse(fs.readFileSync(manifestFile));if(!options.resume)throw Error('Output exists; use a new --out or --resume');assert.deepEqual(old.identity,identity,'Cannot resume with changed runtime, measurement code or protocol')}
 else atomic(manifestFile,JSON.stringify({createdAt:new Date().toISOString(),identity,environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logicalCPUs:os.cpus().length,totalMemoryBytes:os.totalmem()}},null,2)+'\n');
 for(const id of selected){if(options.resume&&fs.existsSync(path.join(out,id+'.json.gz')))continue;console.log('Starting '+id);
  const argv=[__filename,'--child',id,'--engine-root',root,'--out',out];if(options['end-year'])argv.push('--end-year',options['end-year']);
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,argv,{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(id+' exited '+code)))});summarize(out);
 }
 summarize(out);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={definition,saveMeasurement,summarize,runOne};
