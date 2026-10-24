"use strict";
const SAVE_DB_NAME='world-engine-saves-v1';
let saveDatabase=null;
function openSaveDatabase(){
 if(saveDatabase)return saveDatabase;
 saveDatabase=new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new Error('Local saves are unavailable in this browser. You can still export a file.'));return}
  const request=indexedDB.open(SAVE_DB_NAME,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('slots',{keyPath:'id'});
  request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Close other World Engine tabs, then try again.'));
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();saveDatabase=null};resolve(db)};
 }).catch(error=>{saveDatabase=null;throw error});return saveDatabase;
}
async function readWorldSlot(id){const db=await openSaveDatabase();return new Promise((resolve,reject)=>{const r=db.transaction('slots').objectStore('slots').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function listWorldSlots(){const db=await openSaveDatabase();return new Promise((resolve,reject)=>{const r=db.transaction('slots').objectStore('slots').getAll();r.onsuccess=()=>resolve(r.result.map(({blob,previous,...meta})=>({...meta,hasPrevious:!!previous})));r.onerror=()=>reject(r.error)})}
async function writeWorldSlot(id,blob,meta){
 const db=await openSaveDatabase();return new Promise((resolve,reject)=>{
  const tx=db.transaction('slots','readwrite'),store=tx.objectStore('slots');let saved;
  const r=id==='auto'?store.getAll():store.get(id);
  r.onsuccess=()=>{try{
   let previous=r.result;
   if(id==='auto'){
    const autos=previous.filter(o=>/^auto-[123]$/.test(o.id));
    id=[1,2,3].map(n=>'auto-'+n).find(key=>!autos.some(o=>o.id===key))||autos.sort((a,b)=>a.savedAt.localeCompare(b.savedAt)||a.id.localeCompare(b.id))[0].id;previous=null;
   }
   saved={id,blob,...meta};if(id.startsWith('manual-')&&previous){const {previous:older,...backup}=previous;saved.previous=backup}store.put(saved);
  }catch(error){tx.abort();reject(error)}};
  tx.oncomplete=()=>resolve(saved);tx.onabort=()=>reject(tx.error||new Error('The save was not written. Previous saves are unchanged.'));tx.onerror=()=>{};
 });
}
async function deleteWorldSlot(id){const db=await openSaveDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('slots','readwrite');tx.objectStore('slots').delete(id);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})}
