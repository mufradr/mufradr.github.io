// Controlled agricultural scenario: all historical hearths due by 5000 BCE
// activate from an initially foraging population. This is not a dated replay.
const {loadCore}=require('./core-harness.cjs');const a=loadCore();a.earth();a.start();a.inspect('S.year=-5010');const t=Date.now();
for(let n=1;n<=4010;n++){
 a.step();
 if(n%100===0)require('node:assert/strict').deepEqual(a.inspect('simulationIssues()'),[],'state integrity at year '+a.state.year);
 if(n%500===0){console.log(JSON.stringify(a.inspect(`(()=>{const regions=[['Mexico',14,23,-105,-86],['Andes',-20,-4,-82,-68]].map(([name,a,b,c,d])=>{let pop=0,pol=new Set(),maxChance=0,manure=0;for(const i of WD.landIdx){const la=WD.lat[i]*180/Math.PI,lo=WD.cxA[i]*360/W-180;if(la<a||la>b||lo<c||lo>d)continue;pop+=S.pop[i];if(S.pol[i])pol.add(S.pol[i]);maxChance=Math.max(maxChance,stateFormationChance(i));manure=Math.max(manure,S.manure[i]);}return {name,pop:Math.round(pop),states:pol.size,maxChance,manure}});return {year:S.year,regions,tech:TECH.filter((t,k)=>S.firstTech[k]).map(t=>t.k)};})()`)));}

}
const result=a.inspect(`(()=>{const regions=[['Mexico',14,23,-105,-86],['Andes',-20,-4,-82,-68]];return regions.map(([name,a,b,c,d])=>({name,states:new Set(WD.landIdx.filter(i=>{const la=WD.lat[i]*180/Math.PI,lo=WD.cxA[i]*360/W-180;return la>=a&&la<=b&&lo>=c&&lo<=d&&S.pol[i]}).map(i=>S.pol[i])).size}));})()`);
for(const region of result)require('node:assert/strict').ok(region.states>0,region.name+' must develop states in this scenario');
console.log('Elapsed seconds',(Date.now()-t)/1000);
