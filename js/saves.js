"use strict";
const WORLD_SAVE_FORMAT='world-engine-save',WORLD_SAVE_SCHEMA=1;
const SAVE_ARRAY_SCHEMA={"world":{"eHi":["Float32Array","HI"],"kgHi":["Uint8Array","HI"],"tHi":["Float32Array","HI"],"pHi":["Float32Array","HI"],"aHi":["Float32Array","HI"],"elev":["Float32Array","N"],"T":["Float32Array","N"],"Pr":["Float32Array","N"],"amp":["Float32Array","N"],"rough":["Float32Array","N"],"land":["Uint8Array","N"],"rawT":["Float32Array","N"],"rawP":["Float32Array","N"],"rawA":["Float32Array","N"],"kgGrid":["Uint8Array","N"],"lat":["Float32Array","N"],"area":["Float32Array","N"],"x3":["Float32Array","N"],"y3":["Float32Array","N"],"z3":["Float32Array","N"],"cosLon":["Float32Array","N"],"sinLon":["Float32Array","N"],"cxA":["Int16Array","N"],"cyA":["Int16Array","N"],"nb":["Int32Array",320000],"cosLat":["Float32Array","N"],"landIdx":["Int32Array",null],"coastIdx":["Int32Array",null],"coast":["Uint8Array","N"],"lm":["Int32Array","N"],"down":["Int32Array","N"],"acc":["Float32Array","N"],"rv":["Float32Array","N"],"gs":["Float32Array","N"],"leach":["Float32Array","N"],"trop":["Float32Array","N"],"sF":["Float32Array","N"],"sH":["Float32Array","N"],"nomad":["Uint8Array","N"],"biome":["Uint8Array","N"],"tcost":["Uint8Array","N"],"tsetse":["Uint8Array","N"],"monZone":["Float32Array","N"],"desert":["Uint8Array","N"],"wi":["Int32Array",320000],"wf":["Float32Array",160000],"ls":["Int32Array",80001],"lt":["Int32Array",null],"ld":["Uint8Array",null],"medCells":["Int32Array",null],"chinaCells":["Int32Array",null],"forest0":["Float32Array","N"],"heavy":["Float32Array","N"],"mal":["Float32Array","N"],"oncho":["Float32Array","N"],"circ":["Float32Array","N"],"nT":["Float32Array","N"],"nM":["Float32Array","N"],"nN":["Float32Array","N"],"nD":["Float32Array","N"]},"state":{"settled":["Uint16Array","N"],"pop":["Float32Array","N"],"K":["Float32Array","N"],"eth":["Int32Array","N"],"eth2":["Int32Array","N"],"mix":["Float32Array","N"],"mixT":["Uint8Array","N"],"pol":["Int32Array","N"],"s":["Float32Array","N"],"rel":["Int32Array","N"],"fort":["Float32Array","N"],"fert":["Float32Array","N"],"immune":["Float32Array","N"],"infect":["Uint8Array","N"],"ob":["Int32Array","N"],"dist":["Uint16Array","N"],"taken":["Int32Array","N"],"q":["Int32Array","N"],"lab":["Int32Array","N"],"city":["Int32Array","N"],"AG":["Float32Array","AG"],"anom":["Float32Array","N"],"wm":["Float32Array","N"],"lmPop":["Int32Array","LM"],"lmFound":["Uint8Array","LM"],"farm":["Float32Array","N"],"herd":["Float32Array","N"],"irrig":["Float32Array","N"],"metal":["Float32Array","N"],"horse":["Float32Array","N"],"sail":["Float32Array","N"],"admin":["Float32Array","N"],"wheel":["Float32Array","N"],"iron":["Float32Array","N"],"coin":["Float32Array","N"],"law":["Float32Array","N"],"roads":["Float32Array","N"],"nav":["Float32Array","N"],"caval":["Float32Array","N"],"paper":["Float32Array","N"],"crops":["Float32Array","N"],"gun":["Float32Array","N"],"ocean":["Float32Array","N"],"camel":["Float32Array","N"],"grain":["Float32Array","N"],"ard":["Float32Array","N"],"plough":["Float32Array","N"],"manure":["Float32Array","N"],"xcrops":["Float32Array","N"],"integ":["Float32Array","N"],"uni":["Float32Array","N"],"uniFam":["Int32Array","N"],"forest":["Float32Array","N"],"salt":["Float32Array","N"],"adapt":["Float32Array","N"],"dp":["Float32Array","N"],"poolNext":["Float32Array","N"],"car":["Float32Array","N"],"exit":["Float32Array","N"],"circE":["Float32Array","N"],"rp":["Float32Array","N"],"bfsPar":["Int32Array","N"],"bfsD":["Int16Array","N"],"bfsMark":["Int32Array","N"]}};
function captureWorldSave(name='',view=null){
 if(!WD||!S)throw new Error('Build a world first.');
 const {r,...state}=S;
 return {format:WORLD_SAVE_FORMAT,schemaVersion:WORLD_SAVE_SCHEMA,engineVersion:ENGINE_VERSION,width:W,height:H,
  name:String(name).trim().slice(0,40)||'World '+S.seed,savedAt:new Date().toISOString(),rngState:r.state(),
  world:WD,state,rules:{...P},climate:{...CL},view};
}
function validateWorldSave(data){
 const fail=m=>{throw new Error('Invalid world save: '+m)};
 if(!data||data.format!==WORLD_SAVE_FORMAT||data.schemaVersion!==WORLD_SAVE_SCHEMA)throw new Error('Unsupported world save format. Setup files are not world saves.');
 if(!['0.13.0','0.14.0',ENGINE_VERSION].includes(data.engineVersion))throw new Error('This save needs World Engine '+String(data.engineVersion).slice(0,30)+'; this engine is '+ENGINE_VERSION+'. Your current world has not been replaced.');
 if(data.width!==W||data.height!==H)fail('map dimensions');
 if(typeof data.name!=='string'||data.name.length>40||typeof data.savedAt!=='string'||!Number.isFinite(Date.parse(data.savedAt)))fail('save details');
 if(!Number.isInteger(data.rngState)||data.rngState<0||data.rngState>0xffffffff)fail('random state');
 const w=data.world,s=data.state;if(!w||!s||!Number.isInteger(s.year)||!Number.isInteger(s.start)||s.year<s.start||typeof s.seed!=='string'||typeof w.seed!=='string'||!Number.isInteger(w.lmCount)||w.lmCount<0||w.lmCount>N)fail('world or date');
 for(const [key,o]of [['world',w],['state',s]])for(const [field,[type,size]]of Object.entries(SAVE_ARRAY_SCHEMA[key])){
  const a=o[field],length=size==='N'?N:size==='HI'?HW*HH:size==='AG'?AGW*AGH:size==='LM'?w.lmCount:typeof size==='number'?size:null;
  // Köppen and fitted-climate arrays are optional on generated/imported worlds.
  if(key==='world'&&a==null&&(['kgHi','kgGrid','rawT','rawP','rawA'].includes(field)||(!w.isEarth&&['medCells','chinaCells'].includes(field))))continue;
  if(!(a instanceof SAVE_TYPES[type])||(length!==null&&a.length!==length))fail(key+'.'+field);
  if(type.startsWith('Float'))for(const v of a)if(!Number.isFinite(v))fail('nonfinite '+field);
 }
 for(const key of ['landIdx','coastIdx']){if(!(w[key] instanceof Int32Array)||w[key].length>N)fail(key);let prev=-1;for(const i of w[key]){if(i<=prev||i>=N||!w.land[i])fail(key);prev=i}}
 let landCount=0;for(let i=0;i<N;i++){if(w.land[i]>1)fail('land mask');landCount+=w.land[i]}
 if(landCount!==w.landIdx.length)fail('land index');
 for(const i of w.nb)if(i < -1||i>=N)fail('neighbors');
 for(const i of w.wi)if(i<0||i>=AGW*AGH)fail('weather interpolation');
 if(w.lt.length!==w.ld.length||w.ls[N]!==w.lt.length)fail('sea links');
 for(let i=0;i<N;i++)if(w.ls[i]<0||w.ls[i]>w.ls[i+1])fail('sea link offsets');
 for(const i of w.lt)if(i<0||i>=N||!w.land[i])fail('sea link destination');
 if(w.isEarth&&(!Array.isArray(w.regions)||w.regions.some(r=>!r||!(r.cells instanceof Int32Array)||typeof r.k!=='string')))fail('Earth regions');
 if(!w.generation||!['earth','generated','import'].includes(w.generation.source)||!Array.isArray(w.lmSize)||w.lmSize.length!==w.lmCount)fail('world configuration');
 if(!Array.isArray(s.tk)||s.tk.length!==TECH.length||s.tk.some(a=>!(a instanceof Float32Array)||a.length!==N))fail('techniques');
 const aliases=['farm','herd','irrig','metal','horse','sail','admin','wheel','iron','coin','law','roads','nav','caval','paper','crops','gun','ocean','camel','grain','ard','plough','manure','xcrops'];
 for(let i=0;i<aliases.length;i++)if(s[aliases[i]]!==s.tk[i])fail('technique references');
 for(const key of ['eths','pols','alive','chron','outbreaks','inf','stats','hearths','figs','rels','wars','activeWars','cities','migs','activeMigs','spot','fallen','darkWatch','epochs','firstTech','chinaHist','medHist','routes'])if(!Array.isArray(s[key]))fail(key);
 if(s.pols[0]!==null||s.eths.length===0||s.firstTech.length!==TECH.length)fail('entity tables');
 for(const key of ['press','seaRoutes','seaDiasporas','colonies'])if(!(s[key] instanceof Map))fail(key);
 for(const [cell,c] of s.colonies)if(!c||cell!==c.cell||!Number.isInteger(cell)||cell<0||cell>=N||!w.coast[cell]||!Number.isInteger(c.source)||c.source<0||c.source>=N||!w.land[c.source])fail('colony location');
 for(const key of ['carPairs','cropX'])if(!(s[key] instanceof Set))fail(key);
 for(const key of ['famTitle','isleName','isleBy','regionFirst','medBest'])if(!s[key]||typeof s[key]!=='object')fail(key);
 for(const [key,list]of [['pols',s.pols],['eths',s.eths],['rels',s.rels],['wars',s.wars],['figs',s.figs],['migs',s.migs]])list.forEach((o,id)=>{
  if(key==='pols'&&id===0)return;if(!o||o.id!==id)fail(key+' identity');
  if(['pols','eths','rels'].includes(key)&&(!Array.isArray(o.rgb)||o.rgb.length!==3||o.rgb.some(v=>!Number.isFinite(v))))fail('entity color');
  if(key==='pols'&&(!(o.enemies instanceof Map)||!Array.isArray(o.allies)||!o.ruler||!Array.isArray(o.works)||!Array.isArray(o.hist)))fail('state records');
  if(key==='eths'&&(!o.lang||!Object.hasOwn(STYLES,o.lang.style)||!o.lang.lex||!Array.isArray(o.lang.rules)||!Array.isArray(o.kids)))fail('people records');
  if(key==='wars'&&(!(o.aSet instanceof Set)||!Array.isArray(o.a)||!Array.isArray(o.d)))fail('war records');
 });
 const h=s.historicalAtlas;if(!h||!h.active)fail('peak maps');
 for(const kind of ['state','religion','people','tradition','war']){
  if(!(h[kind] instanceof Map)||(kind!=='war'&&!(h.active[kind] instanceof Set)))fail('peak collections');
  for(const r of h[kind].values())for(const snap of kind==='war'?[r.initial]:[r.areaPeak,r.populationPeak]){
   if(!snap||!(snap.runs instanceof Uint32Array)||snap.runs.length%2||!Number.isInteger(snap.year)||!Array.isArray(snap.rgb)||snap.rgb.length!==3)fail('peak footprint');
   for(let k=0;k<snap.runs.length;k+=2)if(snap.runs[k]+snap.runs[k+1]>N)fail('peak extent');
  }
 }
 // Reuse parameter validation without rebuilding terrain or restarting history.
 const seedWorld={...w.generation,dataset:'earth-v1'};
 if(seedWorld.source==='import'){
  if(!w.importSource||!(w.importSource.height instanceof Float32Array)||w.importSource.height.length!==HW*HH)fail('imported terrain');
  // These exact maps already have typed-array/length validation; avoid base64 copies.
  seedWorld.source='generated';
 }
 validateExperiment({format:'world-engine-experiment',schemaVersion:1,engineVersion:ENGINE_VERSION,world:seedWorld,historySeed:s.seed,rules:data.rules,climate:data.climate});
 if(!s.initialRules||typeof s.initialRules!=='object'||!w.climateRules)fail('initial settings');
 for(const key of ['dT','dTt','gT','orbM','famN','bfsStamp'])if(!Number.isFinite(s[key]))fail(key);
 if(s.orb0!==null&&!Number.isFinite(s.orb0))fail('orbital phase');
 for(const e of s.chron)if(!e||typeof e.txt!=='string'||!Number.isFinite(e.y)||typeof e.t!=='string'||!Array.isArray(e.refs))fail('chronicle');
 for(const e of s.spot)if(!e||typeof e.txt!=='string'||!Number.isFinite(e.y)||!Array.isArray(e.refs))fail('events');
 for(const e of s.stats)if(!e||!Number.isFinite(e.y)||!Number.isFinite(e.pop)||!Array.isArray(e.eraPop))fail('statistics');
 const issues=simulationIssues(20,s,w).filter(m=>m!=='Invalid colony location');
 if(issues.length)fail(issues[0]);
 return data;
}
function applyWorldSave(input){
 return applyValidatedWorldSave(validateWorldSave(input));
}
// The load UI validates its detached candidate before confirmation and recovery.
// Installation is shared so that path does not rescan every array a second time.
function applyValidatedWorldSave(data){
 data.state.r=mulberry32(data.rngState);WD=data.world;S=data.state;Object.assign(P,data.rules);Object.assign(CL,data.climate);return data;
}
