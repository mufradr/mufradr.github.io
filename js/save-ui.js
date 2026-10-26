"use strict";
const saveUI={busy:false,auto:true,lastAuto:Date.now(),lastState:null,lastYear:null,records:[],storageError:'',name:''};
function saveStatus(message,error=false){$('saves-status').textContent=message;$('saves-status').classList.toggle('err',error)}
function saveError(error){return error?.name==='QuotaExceededError'?'Device storage is full. Previous saves are unchanged. Export a file, or delete an unneeded slot.':error?.message||'Saving failed. Previous saves are unchanged.'}
function setSaveBusy(on){saveUI.busy=on;for(const b of $('pane-saves').querySelectorAll('button,input'))b.disabled=on;$('saves-status').setAttribute('aria-busy',String(on))}
function processWorldFile(action,payload){
 if(typeof Worker==='undefined'||location.protocol==='file:')return action==='encode'?encodeWorldFile(structuredClone(payload)):decodeWorldFile(payload);
 return new Promise((resolve,reject)=>{
  const worker=new Worker('js/save-worker.js?v=0.16.0'),timer=setTimeout(()=>{worker.terminate();reject(new Error('Save processing timed out. Previous saves are unchanged.'))},120000);
  const done=()=>{clearTimeout(timer);worker.terminate()};
  worker.onmessage=({data})=>{done();data.error?reject(new Error(data.error)):resolve(data.result)};
  worker.onerror=()=>{done();reject(new Error('The save worker could not start. Reload the page and try again.'))};
  // Encoding must copy the live snapshot; decoding owns its input bytes and can
  // transfer them. Never detach terrain or simulation arrays used by playback.
  try{if(action==='encode')worker.postMessage({action,payload});else worker.postMessage({action,bytes:payload},[payload.buffer])}catch(error){done();reject(error)}
 });
}
function settleSaveYear(){
 if(!ui.ready||!S||!WD)throw new Error('Wait until the world has finished loading.');
 setRunning(false);if(ui.gen){while(!ui.gen.next().done){}ui.gen=null;noteCompletedYear();ui.dirty=true}
}
function currentSaveView(){return {mode:ui.mode,know:[...ui.know],z:ui.z,ox:ui.ox,oy:ui.oy,rate:ui.target,pausedAtEnd:ui.pausedAtEnd,layers:{...mapLayers}}}
function saveMetadata(data){let population=0;for(const p of data.state.pop)population+=p;return {name:data.name,savedAt:data.savedAt,year:data.state.year,seed:data.state.seed,source:data.world.generation.source,states:data.state.alive.length,population,engineVersion:data.engineVersion}}
async function makeWorldSave(name){
 const payload=captureWorldSave(name,currentSaveView()),meta=saveMetadata(payload),bytes=await processWorldFile('encode',payload);
 if(bytes.byteLength>SAVE_MAX_FILE_BYTES)throw new Error('Compressed save exceeds the 256 MiB file limit.');
 return {blob:new Blob([bytes],{type:'application/octet-stream'}),meta};
}
async function refreshWorldSlots(){
 try{saveUI.records=await listWorldSlots();saveUI.storageError=''}catch(error){saveUI.storageError=saveError(error)}
 if(ui.pane==='saves'&&!saveUI.busy)renderWorldSaves();
}
function renderWorldSaves(){
 const drafts=new Map([...$('save-slots').querySelectorAll('input[data-edited="yes"]')].map(el=>[el.closest('[data-slot]').dataset.slot,el.value]));
 const card=(id,title)=>{
  const r=saveUI.records.find(o=>o.id===id),manual=id.startsWith('manual-');
  return `<section class="world-slot" data-slot="${id}"><div class="slot-heading"><strong>${title}</strong>${r?`<span>${fy(r.year)}</span>`:'<span>Empty</span>'}</div>${manual?`<label class="field">World name<input class="slot-name" maxlength="40" data-edited="${drafts.has(id)?'yes':''}" value="${esc(drafts.get(id)??(r?.name||saveUI.name||'World '+(S?.seed||'')))}" aria-label="${title} name"></label>`:r?`<p>${esc(r.name)}</p>`:''}${r?`<p class="note">${fmtN(r.population)} people · ${r.states} states · ${esc(r.source)}<br>${esc(new Date(r.savedAt).toLocaleString())} · v${esc(r.engineVersion)}</p>`:''}<div class="actions">${manual?'<button class="btn primary" data-save="write">Save here</button>':''}${r?'<button class="btn" data-save="load">Load</button><button class="btn" data-save="export">Export file</button>':''}${r?.hasPrevious?'<button class="btn" data-save="previous">Load previous save</button>':''}${r?'<button class="btn" data-save="delete">Delete</button>':''}</div></section>`;
 };
 $('save-slots').innerHTML=[1,2,3].map(n=>card('manual-'+n,'Slot '+n)).join('');
 $('autosave-slots').innerHTML=[1,2,3].map(n=>card('auto-'+n,'Autosave '+n)).join('')+(saveUI.records.some(r=>r.id==='before-load')?card('before-load','Before last load'):'');
 $('autosave-enabled').checked=saveUI.auto;
 $('saves-storage-note').textContent=saveUI.storageError||'Slots stay in this browser on this device. Export a file to Files or iCloud Drive for backup or to move a world to another device.';
 if(saveUI.busy)setSaveBusy(true);
}
async function runSaveAction(action){
 if(saveUI.busy)return;setSaveBusy(true);
 try{await action()}catch(error){saveStatus(saveError(error),true)}finally{await refreshWorldSlots();setSaveBusy(false);if(ui.pane==='saves')renderWorldSaves()}
}
async function saveManualSlot(id,name){
 const old=await readWorldSlot(id);
 if(old&&!confirm('Replace '+old.name+' in this slot? Its previous save will be kept as a backup.'))return;
 settleSaveYear();saveStatus('Saving world…');const {blob,meta}=await makeWorldSave(name);await writeWorldSlot(id,blob,meta);saveUI.name=meta.name;
 saveStatus('Saved '+meta.name+' at '+fy(meta.year)+'. The simulation is paused.');
 try{if(navigator.storage?.persist)await navigator.storage.persist()}catch(error){}
}
function downloadWorldFile(blob,name){
 const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=((name||'').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,60)||'world-engine')+'.worldengine';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function restoreSaveView(view){
 if(!view||typeof view!=='object')return;
 if(MODES.some(([key])=>key===view.mode)){ui.mode=view.mode;$('map-mode-name').textContent=MODES.find(([k])=>k===ui.mode)[1];for(const b of $('modes').children)b.setAttribute('aria-pressed',b.dataset.m===ui.mode)}
 ui.know=new Set(Array.isArray(view.know)?view.know.filter(k=>TECH.some(t=>t.k===k)):[]);
 if(Number.isFinite(view.rate))setRate(view.rate);ui.pausedAtEnd=view.pausedAtEnd===true;
 for(const key in mapLayers)if(typeof view.layers?.[key]==='boolean'){mapLayers[key]=view.layers[key];$('map-layers').querySelector('[data-layer="'+key+'"]').checked=mapLayers[key]}
 if([view.z,view.ox,view.oy].every(Number.isFinite)){ui.z=clamp(view.z,1,ZMAX);ui.ox=view.ox;ui.oy=view.oy;clampView()}
}
async function loadWorldBlob(blob){
 saveStatus('Checking saved world…');const data=validateWorldSave(await processWorldFile('decode',new Uint8Array(await blob.arrayBuffer())));
 if(!confirm('Load '+data.name+' at '+fy(data.state.year)+'? This replaces the world on screen. A recovery save of your current world will be kept on this device.'))return;
 settleSaveYear();saveStatus('Backing up current world before loading…');
 const recovery=await makeWorldSave(saveUI.name||'Before load');
 try{await writeWorldSlot('before-load',recovery.blob,recovery.meta)}catch(error){if(!confirm(saveError(error)+' Load without a recovery slot? Export your current world first if you want to keep it.')){saveStatus('Loading cancelled. The world on screen is unchanged.');return}}
 const previous={world:WD,state:S,rules:{...P},climate:{...CL},view:currentSaveView(),name:saveUI.name,src:ui.src,imported:IMPORTED};
 try{
 applyValidatedWorldSave(data);ui.src=WD.generation.source==='generated'?'gen':WD.generation.source;
 for(const b of $('src').children)b.setAttribute('aria-pressed',b.dataset.v===ui.src);
 // Sync settings without recreating the world or consuming random draws.
 syncExperimentControls({historySeed:S.seed,world:WD.generation});paintBase();finishHistory();restoreSaveView(data.view);
 ui.lastSpotObj=S.spot[S.spot.length-1]||null;ui.ringT=0;ui.toastT=0;toggleMapOptions(false);buildComp();drawMap();
 saveUI.name=data.name;saveUI.lastState=S;saveUI.lastYear=S.year;saveUI.lastAuto=Date.now();
 saveStatus('Loaded '+data.name+' at '+fy(S.year)+'. Press Play to continue.');
 }catch(error){
  WD=previous.world;S=previous.state;Object.assign(P,previous.rules);Object.assign(CL,previous.climate);IMPORTED=previous.imported;ui.src=previous.src;
  for(const b of $('src').children)b.setAttribute('aria-pressed',b.dataset.v===ui.src);
  syncExperimentControls({historySeed:S.seed,world:WD.generation});paintBase();finishHistory();restoreSaveView(previous.view);saveUI.name=previous.name;buildComp();drawMap();
  throw new Error('The saved world could not be opened. Your previous world was restored. '+error.message);
 }
}
function maybeAutosave(force=false){
 if(!saveUI.auto||saveUI.busy||!ui.ready||!S||ui.gen||saveUI.storageError)return;
 if(saveUI.lastState===S&&saveUI.lastYear===S.year)return;
 if(!force&&Date.now()-saveUI.lastAuto<60000)return;
 setSaveBusy(true);saveUI.lastAuto=Date.now();const state=S,year=S.year;
 makeWorldSave(saveUI.name||'World '+S.seed).then(async({blob,meta})=>{await writeWorldSlot('auto',blob,meta);saveUI.lastState=state;saveUI.lastYear=year;saveStatus('Autosaved '+meta.name+' at '+fy(year)+'.')}).catch(error=>{saveUI.storageError=saveError(error);saveStatus('Autosave failed: '+saveUI.storageError,true)}).finally(async()=>{await refreshWorldSlots();setSaveBusy(false);if(ui.pane==='saves')renderWorldSaves()});
}
$('pane-saves').addEventListener('input',e=>{if(e.target.matches('.slot-name'))e.target.dataset.edited='yes'});
$('pane-saves').addEventListener('click',e=>{
 const button=e.target.closest('[data-save]');if(!button)return;const card=button.closest('[data-slot]'),id=card.dataset.slot;
 runSaveAction(async()=>{
  const action=button.dataset.save;if(action==='write')return saveManualSlot(id,card.querySelector('.slot-name').value);
  const slot=await readWorldSlot(id);if(!slot)throw new Error('This slot is empty.');
  if(action==='delete'){if(confirm('Delete '+slot.name+' and its backup from this device?'))await deleteWorldSlot(id);return}
  if(action==='export'){downloadWorldFile(slot.blob,slot.name);saveStatus('Save file exported. Keep it in Files or iCloud Drive.');return}
  if(action==='load'||action==='previous')return loadWorldBlob(action==='previous'?slot.previous.blob:slot.blob);
 });
});
$('export-world').addEventListener('click',()=>runSaveAction(async()=>{settleSaveYear();saveStatus('Preparing save file…');const {blob,meta}=await makeWorldSave(saveUI.name||'World '+S.seed);downloadWorldFile(blob,meta.name);saveStatus('Current world exported at '+fy(meta.year)+'. Keep the file in Files or iCloud Drive.')}));
document.querySelector('[for="import-world"]').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!saveUI.busy)$('import-world').click()}});
$('import-world').addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';if(!file)return;runSaveAction(async()=>{if(file.size>SAVE_MAX_FILE_BYTES)throw new Error('Save file is too large (maximum 256 MiB).');await loadWorldBlob(file)})});
$('autosave-enabled').addEventListener('change',e=>{saveUI.auto=e.target.checked;saveUI.storageError='';saveUI.lastAuto=Date.now();try{localStorage.setItem('world-engine.autosave',String(saveUI.auto))}catch(error){}saveStatus(saveUI.auto?'Autosave enabled.':'Autosave disabled. Manual slots are unchanged.')});
// Best effort on pause/background; rotating timed saves remain the reliable fallback
// when iOS suspends a tab before asynchronous storage can finish.
function autosaveOnPause(){if(!saveUI.auto||saveUI.busy||!ui.ready)return;setTimeout(()=>{if(!ui.running&&!saveUI.busy){if(ui.gen)settleSaveYear();maybeAutosave(true)}},0)}
document.addEventListener('visibilitychange',()=>{if(document.hidden)autosaveOnPause()});
try{saveUI.auto=localStorage.getItem('world-engine.autosave')!=='false'}catch(error){}
refreshWorldSlots().then(()=>{renderWorldSaves();if(saveUI.records.length)showPane('saves')});
