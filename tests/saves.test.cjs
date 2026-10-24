const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {loadCore,snapshot}=require('./core-harness.cjs');
function stateDigest(a){
 const root=a.save('Determinism');root.savedAt='2026-01-01T00:00:00.000Z';
 // Compare every value, with exact typed-array bytes. Immutable static objects may
 // acquire different alias topology when newly created entities reuse constants.
 return createHash('sha256').update(JSON.stringify(root,(_,v)=>ArrayBuffer.isView(v)?{type:v.constructor.name,hash:createHash('sha256').update(Buffer.from(v.buffer,v.byteOffset,v.byteLength)).digest('hex')}:v instanceof Map?{map:[...v]}:v instanceof Set?{set:[...v]}:v)).digest('hex');
}
test('save and reload preserves an advanced world and its exact continuation',async()=>{
 const a=loadCore();a.earth();a.start();
 a.inspect(`(()=>{S.year=1500;P.warRate=P.crisis=0;const i=15790;S.pop[i]=150000;for(const k of [0,3,5,6,10,12,14,15,17,19,22]){S.tk[k][i]=1;S.firstTech[k]??={y:1400,cell:i}}newPolity(i,null);const v=traceVoyage(i,250*Math.PI/180,voyageRange(i));S.pop[v.to]=25000;S.pol[v.to]=0;S.seaRoutes.set('atlantic',{...v,born:1480,last:1500})})()`);
 for(let i=0;i<300;i++)a.step();
 assert.ok(a.state.colonies.size>0);const before=stateDigest(a),file=await a.encode(a.save('Voyagers'));
 assert.ok(file.length<20*1024*1024);const decoded=await a.decode(file),b=loadCore();b.restore(decoded);
 assert.equal(stateDigest(b),before);assert.ok(b.inspect('S.farm===S.tk[0]&&S.seaRoutes instanceof Map&&S.cropX instanceof Set'));
 for(let i=0;i<40;i++){a.step();b.step()}
 assert.deepEqual(snapshot(a),snapshot(b));assert.equal(stateDigest(a),stateDigest(b));
});
test('generated and imported custom worlds survive a save without regenerating terrain',async()=>{
 const a=loadCore();a.generated();a.start();let file=await a.encode(a.save('Generated')),b=loadCore();b.restore(await b.decode(file));assert.deepEqual(snapshot(a),snapshot(b));
 a.inspect(`WD=genWorld({seed:'Custom',height:Float32Array.from(WD.eHi),temp:Float32Array.from(WD.tHi),prec:Float32Array.from(WD.pHi)});newHistory('custom-history');`);
 file=await a.encode(a.save('Custom'));b.restore(await b.decode(file));assert.deepEqual(snapshot(a),snapshot(b));assert.equal(b.world.generation.source,'import');assert.ok(b.world.importSource.height instanceof Float32Array);
 a.step();b.step();assert.equal(stateDigest(a),stateDigest(b));
});
test('invalid, damaged and incompatible saves leave the running world untouched',async()=>{
 const a=loadCore();a.earth();a.start();const before=stateDigest(a),file=await a.encode(a.save('Safe'));
 const corrupt=file.slice();corrupt[corrupt.length-15]^=42;await assert.rejects(a.decode(corrupt));
 await assert.rejects(a.decode(new Uint8Array([1,2,3])));
 const future=await a.decode(file);future.engineVersion='999.0.0';assert.throws(()=>a.restore(future),/needs World Engine/);
 const short=await a.decode(file);short.state.pop=new Float32Array(1);assert.throws(()=>a.restore(short),/state.pop/);
 const broken=await a.decode(file);broken.state.farm=new Float32Array(broken.state.farm);assert.throws(()=>a.restore(broken),/references/);
 const owner=await a.decode(file);owner.state.pol[a.world.landIdx[0]]=999999;assert.throws(()=>a.restore(owner),/owner/);
 owner.state.pol[a.world.landIdx[0]]=0;const coast=a.world.coastIdx[0];owner.state.colonies.set(coast,{cell:coast,source:80000});assert.throws(()=>a.restore(owner),/colony location/);
 assert.equal(stateDigest(a),before);
});
test('graph format preserves high cell IDs, shared references, Map/Set identity and rejects executable tags',()=>{
 const a=loadCore(),result=a.inspect(`(()=>{const shared={cells:new Uint32Array([65536,79999])},root={one:shared,two:shared,map:new Map([[shared,new Set([shared])]]),value:undefined};root.self=root;
 const raw=encodeSaveGraph(root),out=decodeSaveGraph(raw);return {shared:out.one===out.two,cycle:out.self===out,map:out.map.get(out.one).has(out.one),cells:[...out.one.cells],undef:Object.hasOwn(out,'value')&&out.value===undefined}})()`);
 assert.deepEqual(result,{shared:true,cycle:true,map:true,cells:[65536,79999],undef:true});
 assert.throws(()=>a.inspect('encodeSaveGraph({run:()=>1})'),/Unsupported/);
});
