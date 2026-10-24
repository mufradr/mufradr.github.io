"use strict";
// Data-only graph format: preserve aliases, Maps, Sets and exact typed-array bytes.
// No functions, dynamic constructors or executable content are accepted.
const SAVE_MAX_BYTES=256*1024*1024,SAVE_MAX_FILE_BYTES=128*1024*1024;
const SAVE_TYPES={Uint8Array,Int8Array,Uint16Array,Int16Array,Uint32Array,Int32Array,Float32Array,Float64Array,Uint8ClampedArray};
const SAVE_MAGIC=new TextEncoder().encode('WESAVE01');
function saveCRC(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function encodeSaveGraph(root){
 const nodes=[],seen=new Map(),blocks=[];let byteLength=0;
 const ref=v=>{
  if(v===undefined)return {u:1};
  if(typeof v==='number'&&!Number.isFinite(v))return {n:String(v)};
  if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number')return v;
  if(typeof v!=='object')throw new Error('Unsupported value in world save.');
  if(seen.has(v))return {r:seen.get(v)};
  const id=nodes.length;seen.set(v,id);nodes.push(null);let node;
  if(ArrayBuffer.isView(v)){
   if(!Object.hasOwn(SAVE_TYPES,v.constructor.name))throw new Error('Unsupported array in save.');
   node={t:v.constructor.name,o:byteLength,l:v.length};const b=new Uint8Array(v.buffer,v.byteOffset,v.byteLength);blocks.push(b);byteLength+=b.length;
  }else if(Array.isArray(v))node={t:'Array',v:Array.from(v,ref)};
  else if(v instanceof Map)node={t:'Map',v:[...v].map(([k,val])=>[ref(k),ref(val)])};
  else if(v instanceof Set)node={t:'Set',v:[...v].map(ref)};
  else{if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw new Error('Unsupported object in save.');node={t:'Object',v:Object.entries(v).map(([k,val])=>[k,ref(val)])}}
  nodes[id]=node;return {r:id};
 };
 const top=ref(root),header=new TextEncoder().encode(JSON.stringify({schemaVersion:1,root:top,nodes}));
 const size=16+header.length+byteLength;if(size>SAVE_MAX_BYTES||header.length>32*1024*1024||nodes.length>1000000)throw new Error('This world exceeds the save size limit.');
 const out=new Uint8Array(size),view=new DataView(out.buffer);out.set(SAVE_MAGIC);view.setUint32(8,header.length,true);out.set(header,12);let offset=12+header.length;
 for(const b of blocks){out.set(b,offset);offset+=b.length}view.setUint32(size-4,saveCRC(out.subarray(0,size-4)),true);return out;
}
function decodeSaveGraph(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<16||bytes.length>SAVE_MAX_BYTES||!SAVE_MAGIC.every((v,k)=>bytes[k]===v))throw new Error('This is not a World Engine save file.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),length=view.getUint32(8,true);
 if(length>32*1024*1024||length>bytes.length-16)throw new Error('Invalid save header.');
 if(saveCRC(bytes.subarray(0,bytes.length-4))!==view.getUint32(bytes.length-4,true))throw new Error('Save checksum failed. The file is incomplete or damaged.');
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(12,12+length))),nodes=data.nodes;
 if(data.schemaVersion!==1||!Array.isArray(nodes)||nodes.length>1000000)throw new Error('Unsupported save format.');
 const start=12+length,objects=nodes.map(n=>{
  if(!n||typeof n!=='object')throw new Error('Invalid save record.');
  if(Object.hasOwn(SAVE_TYPES,n.t)){
   const Type=SAVE_TYPES[n.t],size=n.l*Type.BYTES_PER_ELEMENT;
   if(!Number.isSafeInteger(n.l)||n.l<0||!Number.isSafeInteger(n.o)||n.o<0||n.o+size>bytes.length-4-start)throw new Error('Invalid saved array size.');
   return new Type(bytes.slice(start+n.o,start+n.o+size).buffer);
  }
  if(!Array.isArray(n.v))throw new Error('Invalid save collection.');
  switch(n.t){case'Array':return [];case'Map':return new Map();case'Set':return new Set();case'Object':return {};default:throw new Error('Unsupported save record type.')}
 });
 const value=v=>{
  if(v===null||['string','boolean','number'].includes(typeof v))return v;
  if(!v||typeof v!=='object')throw new Error('Invalid save value.');
  if(v.u===1&&Object.keys(v).length===1)return undefined;
  if(Object.keys(v).length===1&&['NaN','Infinity','-Infinity'].includes(v.n))return Number(v.n);
  if(!Number.isInteger(v.r)||v.r<0||v.r>=objects.length||Object.keys(v).length!==1)throw new Error('Invalid save reference.');return objects[v.r];
 };
 nodes.forEach((n,k)=>{const o=objects[k];if(ArrayBuffer.isView(o))return;
  if(n.t==='Array')for(const v of n.v)o.push(value(v));
  else if(n.t==='Set')for(const v of n.v)o.add(value(v));
  else for(const pair of n.v){if(!Array.isArray(pair)||pair.length!==2)throw new Error('Invalid save entry.');const [key,v]=pair;
   if(n.t==='Map')o.set(value(key),value(v));
   else{if(typeof key!=='string'||['__proto__','constructor','prototype'].includes(key))throw new Error('Invalid save property.');Object.defineProperty(o,key,{value:value(v),enumerable:true,writable:true,configurable:true})}
  }
 });return value(data.root);
}
async function encodeWorldFile(payload){
 const raw=encodeSaveGraph(payload);if(typeof CompressionStream==='undefined')return raw;
 return new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
}
async function decodeWorldFile(input){
 let bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(bytes.length>SAVE_MAX_FILE_BYTES)throw new Error('Save file is too large (maximum 128 MiB).');
 if(bytes[0]===31&&bytes[1]===139){
  if(typeof DecompressionStream==='undefined')throw new Error('Update your browser to open compressed world saves.');
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let total=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>SAVE_MAX_BYTES)throw new Error('Expanded save exceeds the 256 MiB limit.');chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
  bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
 }
 return decodeSaveGraph(bytes);
}
