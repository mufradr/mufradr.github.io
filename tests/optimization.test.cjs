const test=require('node:test'),assert=require('node:assert/strict'),{loadCore}=require('./core-harness.cjs'),legacy=require('./fixtures/save-codec-v1.cjs');
test('compact save metadata preserves long numeric histories and legacy compatibility',()=>{
 const a=loadCore(),shared={name:'old realm',hist:Array.from({length:2048},(_,k)=>k/7),dead:true};
 const records=Array.from({length:4000},(_,id)=>({...shared,id,hist:shared.hist.slice()})),root={records,shared};
 assert.throws(()=>legacy.encodeSaveGraph(root),/save size limit/);
 globalThis.optimizationFixture=root;
 const bytes=a.inspect('encodeSaveGraph(globalThis.optimizationFixture)'),header=new DataView(bytes.buffer).getUint32(8,true);
 assert.ok(header<2*1024*1024,'numeric histories should not occupy graph metadata');
 globalThis.optimizationBytes=bytes;
 const decoded=a.inspect('decodeSaveGraph(globalThis.optimizationBytes)');assert.deepEqual(decoded,root);assert.ok(Array.isArray(decoded.records[0].hist));
 const old=legacy.encodeSaveGraph({a:shared,b:shared});globalThis.optimizationBytes=old;
 const back=a.inspect('decodeSaveGraph(globalThis.optimizationBytes)');assert.equal(back.a,back.b);assert.deepEqual(back.a,shared);
 delete globalThis.optimizationFixture;delete globalThis.optimizationBytes;
});
test('state founding needs surplus and managed rivers while dense African farming stays eligible',()=>{
 const a=loadCore();a.earth();a.start();
 const r=a.inspect(`(()=>{const sites=[['Australia',-27,150],['Congo',0,23],['Sahel',13,-5],['Ethiopia',10,39],['Mexico',18,-97],['Andes',-12,-76]];return sites.map(([name,la,lo])=>{const i=cellAt(la,lo);S.farm[i]=S.grain[i]=1;S.settled[i]=1500;WD.sF[i]=.8;WD.nomad[i]=0;WD.rv[i]=.7;S.s[i]=.6;S.circE[i]=.9;
 const area=WD.area[i]*Math.max(.35,1-.65*WD.rough[i]);S.pop[i]=area*3;for(let d=0;d<4;d++){const j=WD.nb[i*4+d];if(j>=0&&WD.land[j])S.pop[j]=100000}const sparse=stateFormationChance(i);S.pop[i]=area*12;const dense=stateFormationChance(i);S.irrig[i]=1;const managed=stateFormationChance(i);S.grain[i]=.02;S.irrig[i]=0;const roots=stateFormationChance(i);S.admin[i]=.9;const institutions=stateFormationChance(i);return {name,sparse,dense,managed,roots,institutions}})})()`);
 for(const x of r){assert.ok(x.dense>x.sparse,x.name);assert.ok(x.managed>=x.dense,x.name);assert.ok(x.roots<x.dense/5,x.name);assert.ok(x.institutions>x.roots,x.name);assert.ok(x.dense>0,x.name)}
});
test('v0.13 graph-1 checkpoints load into the new engine without losing progress',()=>{
 const a=loadCore();a.earth();a.start();a.step();const save=a.save('Previous release');save.engineVersion='0.13.0';const bytes=legacy.encodeSaveGraph(save);
 globalThis.optimizationBytes=bytes;
 const candidate=a.inspect('decodeSaveGraph(globalThis.optimizationBytes)');const b=loadCore();b.restore(candidate);assert.equal(b.state.year,a.state.year);assert.equal(b.state.r.state(),a.state.r.state());assert.equal(b.state.farm,b.state.tk[0]);
 a.step();b.step();assert.deepEqual([...b.state.pop],[...a.state.pop]);delete globalThis.optimizationBytes;
});
