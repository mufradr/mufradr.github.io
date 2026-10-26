const {createHash}=require('node:crypto');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib');
const {loadCore,snapshot}=require('./core-harness.cjs');
const {loadBenchmarkCore,setup,digest,explainDifference}=require('./performance-benchmark.cjs');
const reference=require('./fixtures/political-loops-before.cjs');
test('lossless Earth packing retains original elevation and climate bytes and legacy input',()=>{
 const a=loadCore();const result=a.inspect(`(()=>{const e=inflateSync(Uint8Array.from(atob(EARTH_ELEV_B64),c=>c.charCodeAt(0))),k=inflateSync(Uint8Array.from(atob(KOPPEN_B64),c=>c.charCodeAt(0)));const out=decodeEarth(e,k),d=new Int16Array(HW*HH);for(let y=0;y<HH;y++)for(let x=0;x<HW;x++){const i=y*HW+x;d[i]=out.height[i]-(x?out.height[i-1]:0)}return {out,d,k,legacy:decodeEarth(new Uint8Array(d.buffer),k)}})()`);
 const expected=require('./fixtures/earth-bytes.json'),hash=v=>createHash('sha256').update(Buffer.from(v.buffer,v.byteOffset,v.byteLength)).digest('hex');assert.equal(hash(result.d),expected.elevationDeltas);assert.equal(hash(result.k),expected.climate);assert.deepEqual(result.out,result.legacy);a.earth();a.start();assert.equal(snapshot(a).terrain,require('./fixtures/simulation.json').earth.initial.terrain);
 assert.throws(()=>a.inspect('decodeEarth(new Uint8Array([87,69,69,49]),new Uint8Array(HW*HH))'),/Invalid Earth/);
});
test('byte-plane saves preserve exact array bytes, integer histories, fractions and signed zero',()=>{
 const a=loadCore(),result=a.inspect(`(()=>{const root={};for(const [name,T] of Object.entries(SAVE_TYPES)){const v=new T(1025);for(let k=0;k<v.length;k++)v[k]=(k%3?-1:1)*k/4;root[name]=v.subarray(1)}
 const bits=new Uint32Array(1024);for(let i=0;i<bits.length;i++)bits[i]=[0x7fc00001,0x80000000,0x7f800000,0xff800000][i%4];root.special=new Float32Array(bits.buffer);root.small=Array.from({length:300},(_,i)=>i%7);root.negative=Array.from({length:300},(_,i)=>i-130);root.wide=Array.from({length:300},(_,i)=>4294967296+i);root.fractions=Array.from({length:300},(_,i)=>i/7);root.zero=Array(300).fill(-0);root.sparse=Array(33).fill(undefined);root.sparse[4]=3;root.alias=root.small;root.self=root;
 const bytes=encodeSaveGraph(root),out=decodeSaveGraph(bytes);return {root,out,bytes}})()`);
 assert.deepEqual(result.out,result.root);assert.equal(result.out.alias,result.out.small);assert.equal(result.out.self,result.out);assert.ok(result.out.zero.every(v=>Object.is(v,-0)));
 for(const name of Object.keys(result.root).filter(k=>ArrayBuffer.isView(result.root[k])))assert.deepEqual(Buffer.from(result.out[name].buffer),Buffer.from(result.root[name].buffer,result.root[name].byteOffset,result.root[name].byteLength));
 const header=JSON.parse(new TextDecoder().decode(result.bytes.subarray(12,12+new DataView(result.bytes.buffer).getUint32(8,true))));assert.equal(header.schemaVersion,3);assert.ok(header.nodes.some(n=>n.t==='Numbers'&&n.k==='Uint8Array'));
});
test('graph schema 2 remains readable after byte-plane encoding',()=>{
 const a=loadCore(),out=a.inspect(`(()=>{const header=new TextEncoder().encode(JSON.stringify({schemaVersion:2,root:{r:0},shapes:[['hist']],nodes:[{t:'Object',s:0,v:[{r:1}]},{t:'Numbers',o:0,l:3}]}));const raw=new Uint8Array(16+header.length+24);raw.set(SAVE_MAGIC);new DataView(raw.buffer).setUint32(8,header.length,true);raw.set(header,12);raw.set(new Uint8Array(new Float64Array([1,-0,3.5]).buffer),12+header.length);new DataView(raw.buffer).setUint32(raw.length-4,saveCRC(raw.subarray(0,raw.length-4)),true);return decodeSaveGraph(raw)})()`);
 assert.deepEqual(out.hist,[1,-0,3.5]);
});
for(const scenario of ['early','developed'])test(`political loop extraction preserves complete ${scenario} continuation`,()=>{
 const a=loadBenchmarkCore(),b=loadBenchmarkCore();b.inspect(`politicsG=(${reference.politicsG});`);
 // Compare loop extraction with the later overseas-governance additions disabled
 // in both engines. Also neutralize maintained-road/canal condition because the
 // retained loop fixture predates all maintenance effects, including storage.
 // Freeze condition too; dedicated economy tests cover the evolving physics.
 for(const app of [a,b])app.inspect('overseasTransport=()=>new Map();isDependentColony=()=>false;roadWorks=i=>S.roads[i];canalWorks=i=>S.irrig[i];maintainWorks=()=>{}');
 setup(a,scenario);setup(b,scenario);for(let k=0;k<40;k++){a.step();b.step()}const da=digest(a),db=digest(b);assert.equal(da,db,da===db?undefined:explainDifference(a.save('Compare'),b.save('Compare')));
});
test('packed numeric histories retain a decoded memory budget and reject invalid layouts',()=>{
 const a=loadCore();const make=(node,payloadLength)=>a.inspect(`(()=>{const h=new TextEncoder().encode(JSON.stringify({schemaVersion:3,root:{r:0},shapes:[],nodes:[${JSON.stringify(node)}]}));const raw=new Uint8Array(16+h.length+${payloadLength});raw.set(SAVE_MAGIC);new DataView(raw.buffer).setUint32(8,h.length,true);raw.set(h,12);new DataView(raw.buffer).setUint32(raw.length-4,saveCRC(raw.subarray(0,raw.length-4)),true);return raw})()`);
 const source=fs.readFileSync(require('node:path').join(__dirname,'../js/save-codec.js'),'utf8').replace('512*1024*1024','131072');
 const decode=Function(source+';return decodeSaveGraph')();
 assert.throws(()=>decode(make({t:'Numbers',k:'Uint8Array',o:0,l:65536,b:1},65536)),/memory budget/);
 assert.throws(()=>decode(make({t:'Uint16Array',o:0,l:3,b:4},6)),/byte layout/);
 assert.throws(()=>decode(make({t:'Numbers',k:'Function',o:0,l:3,b:1},3)),/number type/);
});
