const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{loadCore}=require('./core-harness.cjs');
test('uniform arrays store a single byte pattern and restore independent mutable arrays',()=>{
 const a=loadCore(),result=a.inspect(`(()=>{const root={};for(const [name,T] of Object.entries(SAVE_TYPES)){root[name]=new T(1024).fill(3);root[name+'zero']=new T(1024)}
 const bits=new Uint32Array(1024).fill(0x7fc00001);root.nan=new Float32Array(bits.buffer);root.minusZero=new Float64Array(1024).fill(-0);root.history=Array(1024).fill(-0);root.history2=Array(1024).fill(-0);root.alias=root.history;
 const bytes=encodeSaveGraph(root),buffers=[],out=decodeSaveGraph(bytes,buffers);return {root,out,bytes,buffers}})()`);
 assert.ok(result.bytes.length<5000);assert.deepEqual(result.out,result.root);assert.equal(result.out.history,result.out.alias);assert.notEqual(result.out.history,result.out.history2);
 for(const [key,v] of Object.entries(result.root))if(ArrayBuffer.isView(v))assert.deepEqual(Buffer.from(result.out[key].buffer),Buffer.from(v.buffer));
 assert.equal(new Set(result.buffers).size,result.buffers.length);result.out.Uint8Arrayzero[0]=99;assert.equal(result.out.Uint16Arrayzero[0],0);assert.equal(result.root.Uint8Arrayzero[0],0);
 const clone=structuredClone(result.out,{transfer:result.buffers});assert.ok(clone.minusZero.every(v=>Object.is(v,-0)));assert.ok(clone.history.every(v=>Object.is(v,-0)));assert.equal(clone.alias,clone.history);
});
test('uniform array metadata rejects memory amplification and invalid byte patterns',()=>{
 const a=loadCore(),raw=node=>a.inspect(`(()=>{const h=new TextEncoder().encode(JSON.stringify({schemaVersion:3,root:{r:0},shapes:[],nodes:[${JSON.stringify(node)}]}));const out=new Uint8Array(h.length+16);out.set(SAVE_MAGIC);new DataView(out.buffer).setUint32(8,h.length,true);out.set(h,12);new DataView(out.buffer).setUint32(out.length-4,saveCRC(out.subarray(0,out.length-4)),true);return out})()`);
 const decode=Function(fs.readFileSync(path.join(__dirname,'../js/save-codec.js'),'utf8').replace('512*1024*1024','131072')+';return decodeSaveGraph')();
 const encode=Function(fs.readFileSync(path.join(__dirname,'../js/save-codec.js'),'utf8').replace('512*1024*1024','131072')+';return encodeSaveGraph')();
 assert.throws(()=>encode({large:new Float32Array(65536)}),/memory budget/);
 assert.throws(()=>encode({history:Array(20000).fill(0)}),/memory budget/);
 assert.throws(()=>decode(raw({t:'Fill',k:'Uint8Array',l:65536,a:true,v:[0]})),/memory budget/);
 for(const node of [{t:'Fill',k:'Float64Array',l:65536,a:false,v:Array(8).fill(0)},{t:'Fill',k:'Uint8Array',l:-1,a:false,v:[0]},{t:'Fill',k:'Uint8Array',l:1000,a:false,v:[256]},{t:'Fill',k:'Uint8Array',l:1000,a:false,v:[]},{t:'Fill',k:'Function',l:1000,a:false,v:[0]}])assert.throws(()=>decode(raw(node)),/Invalid saved fill/);
});
test('custom-world address creation does not encode full terrain maps',()=>{
 const a=loadCore();a.generated();a.start();const result=a.inspect(`(()=>{WD.generation.source='import';WD.importSource={height:WD.eHi,temp:WD.tHi,prec:WD.pHi};let encodes=0;encodeMap=()=>{encodes++;throw new Error('Unneeded encoding')};return {hash:currentExperimentAddressHash(true),encodes,seed:S.seed}})()`);
 assert.equal(result.hash,'#seed-'+encodeURIComponent(result.seed));assert.equal(result.encodes,0);
});
test('founding eligibility shortcuts preserve probabilities for every land cell',()=>{
 const a=loadCore();a.earth();a.start();const old=require('./fixtures/political-loops-before.cjs').stateFormationChance;
 a.inspect(`globalThis.previousFounding=(${old})`);
 for(const phase of ['early','developed']){
  if(phase==='developed')a.inspect(`for(const i of WD.landIdx){S.settled[i]=i%3?2000:0;S.admin[i]=(i%17)/16;S.farm[i]=(i%11)/10;S.irrig[i]=(i%5)/4;S.pop[i]=WD.area[i]*(i%19);S.grain[i]=(i%9)/8}`);
  assert.equal(a.inspect('WD.landIdx.every(i=>Object.is(stateFormationChance(i),globalThis.previousFounding(i)))'),true);
 }
 delete globalThis.previousFounding;
});
