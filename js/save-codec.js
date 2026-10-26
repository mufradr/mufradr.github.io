"use strict";
// Data-only graph format: preserve aliases, Maps, Sets and exact typed-array bytes.
// No functions, dynamic constructors or executable content are accepted.
const SAVE_MAX_BYTES=512*1024*1024,SAVE_MAX_FILE_BYTES=256*1024*1024;
const SAVE_TYPES={Uint8Array,Int8Array,Uint16Array,Int16Array,Uint32Array,Int32Array,Float32Array,Float64Array,Uint8ClampedArray};
const SAVE_MAGIC=new TextEncoder().encode('WESAVE01');
const SAVE_CRC_TABLE=Uint32Array.from({length:256},(_,i)=>{for(let k=0;k<8;k++)i=(i>>>1)^((i&1)?0xedb88320:0);return i>>>0});
function saveCRC(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++)c=(c>>>8)^SAVE_CRC_TABLE[(c^bytes[i])&255];return(c^0xffffffff)>>>0}
function saveNumberType(values){
 let lo=Infinity,hi=-Infinity;
 for(const v of values){if(!Number.isInteger(v)||Object.is(v,-0))return Float64Array;if(v<lo)lo=v;if(v>hi)hi=v}
 return lo>=0?(hi<=255?Uint8Array:hi<=65535?Uint16Array:hi<=4294967295?Uint32Array:Float64Array):lo>=-128&&hi<=127?Int8Array:lo>=-32768&&hi<=32767?Int16Array:lo>=-2147483648&&hi<=2147483647?Int32Array:Float64Array;
}
function encodeSaveGraph(root){
 const nodes=[],seen=new Map(),blocks=[],shapes=[],shapeIds=new Map();let byteLength=0,decodedBytes=0;
 // Schema 3 groups each byte position into a plane so gzip sees repeated high
 // bytes together. Write directly into the output to avoid another world copy.
 const block=(node,v)=>{
  const bytes=new Uint8Array(v.buffer,v.byteOffset,v.byteLength),width=v.BYTES_PER_ELEMENT;
  decodedBytes+=node.t==='Numbers'?v.length*16:bytes.length;
  if(bytes.length>SAVE_MAX_BYTES||decodedBytes>SAVE_MAX_BYTES*2)throw new Error('This world exceeds the save memory budget.');
  if(v.length>=256){let uniform=true;for(let i=width;i<bytes.length;i++)if(bytes[i]!==bytes[i&(width-1)]){uniform=false;break}
   if(uniform)return {t:'Fill',k:v.constructor.name,l:v.length,v:Array.from(bytes.subarray(0,width)),a:node.t==='Numbers'};
  }
  node.b=width>1&&v.length>=256?width:1;blocks.push({bytes,width:node.b});byteLength+=bytes.length;return node;
 };
 const ref=v=>{
  if(v===undefined)return {u:1};
  if(typeof v==='number'&&!Number.isFinite(v))return {n:String(v)};
  if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number')return v;
  if(typeof v!=='object')throw new Error('Unsupported value in world save.');
  if(seen.has(v))return {r:seen.get(v)};
  const id=nodes.length;seen.set(v,id);nodes.push(null);let node;
  if(ArrayBuffer.isView(v)){
   if(!Object.hasOwn(SAVE_TYPES,v.constructor.name))throw new Error('Unsupported array in save.');
   node=block({t:v.constructor.name,o:byteLength,l:v.length},v);
  }else if(Array.isArray(v)&&v.length>=32&&!v.includes(undefined)&&v.every(x=>typeof x==='number'&&Number.isFinite(x))){
   const Type=saveNumberType(v),values=Type.from(v);node=block({t:'Numbers',k:Type.name,o:byteLength,l:v.length},values);
  }else if(Array.isArray(v))node={t:'Array',v:Array.from(v,ref)};
  else if(v instanceof Map)node={t:'Map',v:[...v].map(([k,val])=>[ref(k),ref(val)])};
  else if(v instanceof Set)node={t:'Set',v:[...v].map(ref)};
  else{if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw new Error('Unsupported object in save.');const keys=Object.keys(v),key=JSON.stringify(keys);let shape=shapeIds.get(key);if(shape===undefined){shape=shapes.length;shapeIds.set(key,shape);shapes.push(keys)}node={t:'Object',s:shape,v:keys.map(k=>ref(v[k]))}}
  nodes[id]=node;return {r:id};
 };
 const top=ref(root),header=new TextEncoder().encode(JSON.stringify({schemaVersion:3,root:top,nodes,shapes}));
 const size=16+header.length+byteLength;if(size>SAVE_MAX_BYTES||header.length>128*1024*1024||nodes.length>4000000)throw new Error('This world exceeds the save size limit.');
 const out=new Uint8Array(size),view=new DataView(out.buffer);out.set(SAVE_MAGIC);view.setUint32(8,header.length,true);out.set(header,12);let offset=12+header.length;
 for(const {bytes:b,width} of blocks){if(width===1)out.set(b,offset);else{const count=b.length/width;for(let c=0;c<width;c++)for(let i=0,j=c;i<count;i++,j+=width)out[offset+c*count+i]=b[j]}offset+=b.length}view.setUint32(size-4,saveCRC(out.subarray(0,size-4)),true);return out;
}
function decodeSaveGraph(bytes,transferBuffers=null){
 if(!(bytes instanceof Uint8Array)||bytes.length<16||bytes.length>SAVE_MAX_BYTES||!SAVE_MAGIC.every((v,k)=>bytes[k]===v))throw new Error('This is not a World Engine save file.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),length=view.getUint32(8,true);
 if(length>128*1024*1024||length>bytes.length-16)throw new Error('Invalid save header.');
 if(saveCRC(bytes.subarray(0,bytes.length-4))!==view.getUint32(bytes.length-4,true))throw new Error('Save checksum failed. The file is incomplete or damaged.');
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(12,12+length))),nodes=data.nodes;
 if(![1,2,3].includes(data.schemaVersion)||!Array.isArray(nodes)||nodes.length>4000000||(data.schemaVersion>=2&&!Array.isArray(data.shapes)))throw new Error('Unsupported save format.');
 let decodedBytes=0;
 const start=12+length,objects=nodes.map(n=>{
  if(!n||typeof n!=='object')throw new Error('Invalid save record.');
  if(n.t==='Fill'){
   if(data.schemaVersion!==3||!Object.hasOwn(SAVE_TYPES,n.k)||typeof n.a!=='boolean')throw new Error('Invalid saved fill type.');
   const Type=SAVE_TYPES[n.k],size=n.l*Type.BYTES_PER_ELEMENT;
   if(!Number.isSafeInteger(n.l)||n.l<0||!Number.isSafeInteger(size)||size>SAVE_MAX_BYTES||!Array.isArray(n.v)||n.v.length!==Type.BYTES_PER_ELEMENT||n.v.some(b=>!Number.isInteger(b)||b<0||b>255))throw new Error('Invalid saved fill size.');
   decodedBytes+=n.a?n.l*16:size;if(decodedBytes>SAVE_MAX_BYTES*2)throw new Error('Decoded arrays exceed the save memory budget.');
   const buffer=new Uint8Array(size);
   if(n.v.some(b=>b!==0)&&size){buffer.set(n.v);for(let filled=n.v.length;filled<size;filled*=2)buffer.copyWithin(filled,0,Math.min(filled,size-filled))}
   const values=new Type(buffer.buffer);if(n.a)return Array.from(values);
   if(transferBuffers)transferBuffers.push(values.buffer);return values;
  }
  if(Object.hasOwn(SAVE_TYPES,n.t)||n.t==='Numbers'){
   const kind=n.t==='Numbers'?(data.schemaVersion===3?n.k:'Float64Array'):n.t;
   if(!Object.hasOwn(SAVE_TYPES,kind))throw new Error('Invalid saved number type.');
   const Type=SAVE_TYPES[kind],size=n.l*Type.BYTES_PER_ELEMENT,width=data.schemaVersion===3?n.b:1;
   if(width!==1&&width!==Type.BYTES_PER_ELEMENT)throw new Error('Invalid saved byte layout.');
   if(!Number.isSafeInteger(n.l)||n.l<0||!Number.isSafeInteger(n.o)||n.o<0||n.o+size>bytes.length-4-start)throw new Error('Invalid saved array size.');
   decodedBytes+=n.t==='Numbers'?n.l*16:size;if(decodedBytes>SAVE_MAX_BYTES*2)throw new Error('Decoded arrays exceed the save memory budget.');
   const buffer=new Uint8Array(size),offset=start+n.o;
   if(width===1)buffer.set(bytes.subarray(offset,offset+size));else for(let c=0;c<width;c++)for(let i=0,j=c;i<n.l;i++,j+=width)buffer[j]=bytes[offset+c*n.l+i];
   const values=new Type(buffer.buffer);
   if(n.t==='Numbers')return Array.from(values);
   // Decoded arrays belong to this checkpoint, so a worker can move them to the
   // UI without cloning the entire world's buffers a second time.
   if(transferBuffers)transferBuffers.push(values.buffer);return values;
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
 nodes.forEach((n,k)=>{const o=objects[k];if(ArrayBuffer.isView(o)||n.t==='Numbers'||n.t==='Fill')return;
  if(n.t==='Array')for(const v of n.v)o.push(value(v));
  else if(n.t==='Set')for(const v of n.v)o.add(value(v));
  else if(n.t==='Object'&&data.schemaVersion>=2){
   const keys=data.shapes[n.s];if(!Number.isInteger(n.s)||!Array.isArray(keys)||keys.length!==n.v.length)throw new Error('Invalid save object shape.');
   keys.forEach((key,i)=>{if(typeof key!=='string'||['__proto__','constructor','prototype'].includes(key))throw new Error('Invalid save property.');Object.defineProperty(o,key,{value:value(n.v[i]),enumerable:true,writable:true,configurable:true})});
  }else for(const pair of n.v){if(!Array.isArray(pair)||pair.length!==2)throw new Error('Invalid save entry.');const [key,v]=pair;
   if(n.t==='Map')o.set(value(key),value(v));
   else{if(typeof key!=='string'||['__proto__','constructor','prototype'].includes(key))throw new Error('Invalid save property.');Object.defineProperty(o,key,{value:value(v),enumerable:true,writable:true,configurable:true})}
  }
 });return value(data.root);
}
async function encodeWorldFile(payload){
 const raw=encodeSaveGraph(payload);if(typeof CompressionStream==='undefined')return raw;
 return new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
}
async function decodeWorldFile(input,transferBuffers=null){
 let bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(bytes.length>SAVE_MAX_FILE_BYTES)throw new Error('Save file is too large (maximum 256 MiB).');
 if(bytes[0]===31&&bytes[1]===139){
  if(typeof DecompressionStream==='undefined')throw new Error('Update your browser to open compressed world saves.');
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let total=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>SAVE_MAX_BYTES)throw new Error('Expanded save exceeds the 512 MiB limit.');chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
  bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
 }
 return decodeSaveGraph(bytes,transferBuffers);
}
