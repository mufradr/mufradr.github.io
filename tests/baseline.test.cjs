const test=require('node:test'),assert=require('node:assert/strict');
const {Observer,distribution,reachableBuffers}=require('../tools/baseline/metrics.cjs');
const {loadEngine,hash,prepare}=require('../tools/baseline/engine.cjs');
const {compare}=require('../tools/baseline/compare.cjs');
const protocol=require('../tools/baseline/protocol.json');
function fixture(){
 const n=40,w={landIdx:Int32Array.from({length:n},(_,i)=>i),lat:new Float32Array(n),cxA:new Int16Array(n).fill(200),area:new Float32Array(n).fill(1000)};
 const s={year:0,pop:new Float32Array(n).fill(30000),pol:new Int32Array(n).fill(1),pols:[null,{kind:'state',full:'Empire of Test',born:0,tier:'Empire',over:0}],firstTech:[],colonies:new Map(),seaRoutes:new Map(),seaDiasporas:new Map(),wars:[],outbreaks:[],cities:[],eths:[]};
 return {w,s,observer:new Observer(w,{...protocol,regions:[{name:'Test',box:[-1,1,0,2]}]})};
}
test('baseline distributions retain empty results and tail delays',()=>{
 assert.equal(distribution([]).median,null);assert.deepEqual(distribution([100,1,3,2]),{count:4,min:1,median:2,p95:100,p99:100,max:100});
});
test('decline observations separate abrupt loss, gradual loss, extinction and censoring',()=>{
 let {w,s,observer}=fixture();observer.observe(s,w,true);s.year=1;s.pol.fill(0,20);observer.observe(s,w,true);s.year=2;s.pol.fill(0);observer.observe(s,w,true);s.year=3;observer.observe(s,w);
 let r=observer.result(3);assert.equal(r.majorDecline.sudden,1);assert.equal(r.majorDecline.observed,1);assert.equal(r.empireLongevity.ended,1);assert.equal(r.empireLongevity.completedStateLifetimes.median,2);
 ({w,s,observer}=fixture());observer.observe(s,w);for(let y=1;y<=10;y++){s.year=y;s.pol.fill(0,40-y*2);observer.observe(s,w)}r=observer.result(10);
 assert.equal(r.majorDecline.gradual,1);assert.equal(r.empireLongevity.rightCensored,1);assert.equal(r.empireLongevity.completedStateLifetimes.count,0);
});
test('major-state eligibility needs simultaneous population and territory; year zero is retained',()=>{
 const {w,s,observer}=fixture();s.pop.fill(1000);observer.observe(s,w);s.year=1;s.pol.fill(0,5);s.pop.fill(300000);observer.observe(s,w);const r=observer.result(1);
 assert.equal(r.majorDecline.eligible,0);assert.equal(r.first.empire,0);
});
test('regional population shares include tributary blocs and empty regions safely',()=>{
 const {w,s,observer}=fixture();s.pols.push({kind:'state',full:'Vassal',born:0,tier:'Kingdom',over:1});s.pol.fill(2,20);observer.observe(s,w,true);const r=observer.result(0).snapshots[0].regions[0];assert.equal(r.largestStateShare,.5);assert.equal(r.largestBlocShare,1);
});
test('memory measurements count shared and sliced buffers once and handle cycles',()=>{
 const a=new Float32Array(20),o={a,b:a.subarray(1)};o.self=o;assert.deepEqual(reachableBuffers(o),{bytes:80,buffers:1});
});
test('comparison preserves separate cases and rejects mismatched horizons',()=>{
 const row={id:'a',category:'historical-earth',startYear:0,endYear:10,repeats:1,performance:{kernelMs:{median:10},sliceP95Ms:{median:2}},save:{final:{gzipBytes:100}},worldBuffers:{bytes:200}};
 const a={protocol:'v1',runs:[row]},b=structuredClone(a);b.runs[0].performance.kernelMs.median=11;assert.equal(compare(a,b).runs[0].kernelTimeRatio,1.1);b.runs[0].endYear=11;assert.throws(()=>compare(a,b),/horizons/);
});
test('observing an actual engine does not alter any checkpoint byte or RNG state',()=>{
 const a=loadEngine(),b=loadEngine();a.initialize('earth','observer-purity');b.initialize('earth','observer-purity');const observer=new Observer(a.world);observer.observe(a.state,a.world,true);
 for(let n=0;n<15;n++){a.step();observer.observe(a.state,a.world,n%5===0);b.step()}
 const digest=app=>{const data=app.save('Purity');data.savedAt='2026-01-01T00:00:00.000Z';return hash(app.encodeGraph(data))};assert.equal(digest(a),digest(b));assert.deepEqual(a.issues(),[]);
});
test('the developed baseline fixture matches the established performance workload exactly',()=>{
 const {loadBenchmarkCore,setup}=require('./performance-benchmark.cjs'),a=loadEngine(),b=loadBenchmarkCore();prepare(a,'developed','cpu-benchmark');setup(b,'developed');
 for(let n=0;n<12;n++){a.step();b.step()}
 const data=a.save('Fixture equivalence');data.savedAt='2026-01-01T00:00:00.000Z';
 const before=b.inspect(`(()=>{const data=captureWorldSave('Fixture equivalence');data.savedAt='2026-01-01T00:00:00.000Z';return encodeSaveGraph(data)})()`);
 assert.equal(hash(a.encodeGraph(data)),hash(before));
});
