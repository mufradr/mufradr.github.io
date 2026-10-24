const test=require('node:test'),assert=require('node:assert/strict');
const {loadCore,snapshot}=require('./core-harness.cjs');
test('historical footprints retain separate dated peaks without changing simulation',()=>{
 const a=loadCore();a.earth();a.start();
 const r=a.inspect(`(()=>{
  const c=cellAt(32,45),j=WD.nb[c*4+1],p=S.pols[newPolity(c,null)],q=S.pols[newPolity(j,p)];
  S.pol[j]=p.id;S.pop[c]=100;S.pop[j]=100;foundReligion(p);const faith=S.rels[0];S.rel[c]=S.rel[j]=faith.id;
  S.year=0;recordAtlasHistory();const first=historicalSnapshot('state',p.id),before=Array.from(first.runs),key=traditionAt(c).key;
  S.year=10;S.pol[j]=q.id;S.pop[c]=1000;recordAtlasHistory();const pop=historicalSnapshot('state',p.id,'population');
  const tradition=historicalSnapshot('tradition',key),rel=historicalSnapshot('religion',faith.id);
  const war=declareWar([p],[q],'Test war',true,false,false),initial=historicalSnapshot('war',war.id);
  recordWarCapture(war.id,j);recordWarCapture(war.id,j);const captures=historicalSnapshot('war',war.id,'captures');
  S.year=20;S.pol[c]=0;S.pop[c]=0;recordAtlasHistory();
  const ids=[1,2,3,65535,65536,79999],decoded=[];eachFootprint(encodeFootprint(ids),i=>decoded.push(i));
  const bounds=footprintBounds(encodeFootprint([4000,4399]));
  return {firstYear:first.year,popYear:pop.year,firstCells:first.cells,popCells:pop.cells,firstUnchanged:JSON.stringify(before)===JSON.stringify(Array.from(first.runs)),retained:historicalSnapshot('state',p.id)===first,inactive:!historicalRecord('state',p.id).alive,traditionCells:tradition.cells,relCells:rel.cells,warCells:initial.cells,warSides:initial.sides.length,captureCells:captures.cells,decoded,bounds,missing:historicalSnapshot('state',99999)};
 })()`);
 assert.equal(r.firstYear,0);assert.equal(r.popYear,10);assert.equal(r.firstCells,2);assert.equal(r.popCells,1);assert.ok(r.firstUnchanged&&r.retained&&r.inactive);
 assert.equal(r.traditionCells,2);assert.equal(r.relCells,2);assert.equal(r.warCells,2);assert.equal(r.warSides,2);assert.equal(r.captureCells,1);
 assert.deepEqual(r.decoded,[1,2,3,65535,65536,79999]);assert.equal(r.bounds.width,2);assert.equal(r.missing,null);
 a.start();assert.equal(a.inspect('S.historicalAtlas.state.size'),0);
});
test('recording history consumes no random draws and preserves model outcomes',()=>{
 const a=loadCore(),b=loadCore();for(const x of [a,b]){x.earth();x.start();x.inspect(`(()=>{const c=cellAt(32,45),j=WD.nb[c*4+1],p=S.pols[newPolity(c,null)],q=S.pols[newPolity(j,p)];foundReligion(p);declareWar([p],[q],'Observer war',true,false,false)})()`)}
 b.inspect('recordAtlasHistory=()=>{};recordWarStart=()=>{};recordWarCapture=()=>{}');
 for(let i=0;i<60;i++){a.step();b.step()}
 assert.deepEqual(snapshot(a),snapshot(b));assert.equal(a.inspect('S.r()'),b.inspect('S.r()'));
});
