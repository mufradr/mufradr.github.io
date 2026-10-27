// Prepared campaign stress; injected ports/war continuity are not historical runs.
const assert=require('node:assert/strict');
const {loadBenchmarkCore,setup}=require('./performance-benchmark.cjs');
for(const seed of ['campaign-a','campaign-b']){
 const a=loadBenchmarkCore();setup(a,'developed');
 a.inspect(`(()=>{S.r=mulberry32(hashStr('${seed}'));P.crisis=P.migration=0;P.warRate=3;const i=15790;S.pop[i]=200000;for(const k of [5,6,12,14,17])S.tk[k][i]=1;
  const v=traceVoyage(i,250*Math.PI/180,voyageRange(i)),j=v.to;S.pop[j]=100000;S.eth[j]=Math.max(0,S.eth[j]);if(!S.pol[j])newPolity(j,null);for(const k of [0,5,6,12,14,17,19])S.tk[k][j]=1;
  S.seaRoutes.set('campaign-atlantic',{...v,born:1380,last:S.year});globalThis.campaignProbe={i,j,seaOperations:0,overseasOperations:0,commitments:0};
  const original=attack;attack=(o,i,j,sea)=>{const before=o.military?.operations||0;const result=original(o,i,j,sea);if((o.military?.operations||0)>before){campaignProbe.commitments++;if(sea){campaignProbe.seaOperations++;if(6371*angDist(i,j)>=2000)campaignProbe.overseasOperations++}}return result};})()`);
 let militarySpending=0,provisions=0,peakExhaustion=0,warMean=0;
 for(let n=0;n<120;n++){
  if(n<60)a.inspect(`(()=>{const {i,j}=campaignProbe,o=S.pols[S.pol[i]],d=S.pols[S.pol[j]];if(o?.alive&&d?.alive&&o!==d&&!o.enemies.has(d.id))declareWar([o],[d],'Prepared Atlantic campaign',false,false,false)})()`);
  if(n===60)a.inspect('P.warRate=P.raid=0;for(const wid of S.activeWars)endWar(S.wars[wid]);S.activeWars=[]');
  a.step();
  const row=a.inspect(`(()=>{let paid=0,sum=0,peak=0,count=0;for(const id of S.alive){const o=S.pols[id],m=o.military;if(!m)continue;paid+=o.budget?.military||0;sum+=m.exhaustion;peak=Math.max(peak,m.exhaustion);count++}return {paid,mean:count?sum/count:0,peak,food:S.foodLedger.campaignUse}})()`);
  militarySpending+=row.paid;provisions+=row.food;peakExhaustion=Math.max(peakExhaustion,row.peak);if(n===59)warMean=row.mean;
  if(n%10===0)assert.deepEqual(a.inspect('simulationIssues()'),[],seed+' year '+a.state.year);
 }
 const result=a.inspect(`(()=>{let sum=0,count=0,deaths=0;for(const o of S.pols){if(!o?.military)continue;deaths+=o.military.totalDeaths;if(o.alive){sum+=o.military.exhaustion;count++}}return {year:S.year,states:S.alive.length,wars:S.wars.length,seaOperations:campaignProbe.seaOperations,overseasOperations:campaignProbe.overseasOperations,commitments:campaignProbe.commitments,militaryDeaths:deaths,peaceMeanExhaustion:count?sum/count:0}})()`);
 assert.ok(result.commitments>0);assert.ok(result.overseasOperations>0);assert.ok(militarySpending>0&&provisions>0&&result.militaryDeaths>0);
 assert.ok(result.peaceMeanExhaustion<warMean,'sixty years of peace should lower aggregate exhaustion');assert.deepEqual(a.inspect('simulationIssues()'),[]);
 console.log(JSON.stringify({seed,...result,militarySpending:Math.round(militarySpending),campaignProvisions:Math.round(provisions),peakExhaustion,warMeanExhaustion:warMean}));a.inspect('delete globalThis.campaignProbe');
}
console.log('Passed: two 120-year prepared campaign/recovery worlds, including real overseas operations.');
