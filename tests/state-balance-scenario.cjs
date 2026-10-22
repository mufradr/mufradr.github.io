// Report early political development without prescribing historical winners.
// Polities include chiefdoms; regional unity is measured by population, not cell count.
const assert=require('node:assert/strict');
const {loadCore}=require('./core-harness.cjs');
const app=loadCore(),seed=process.argv[2]||'regression-history';
const years=Number(process.argv[3]||6500);
assert.ok(Number.isInteger(years)&&years>0&&years<=20000);
app.earth();app.inspect(`newHistory(${JSON.stringify(seed)})`);
for(let n=1;n<=years;n++){
 app.step();
 if(n%100===0)assert.deepEqual(app.inspect('simulationIssues()'),[],`integrity at year ${app.state.year}`);
 if(n%1000!==0&&n!==years)continue;
 console.log(JSON.stringify(app.inspect(`(()=>{
  const regions=[['Europe',36,60,-10,30],['Fertile Crescent',29,38,34,49]].map(([name,a,b,c,d])=>{
   let population=0,governed=0;const states=new Map(),blocs=new Map();
   for(const i of WD.landIdx){const la=WD.lat[i]*180/Math.PI,lo=WD.cxA[i]*360/W-180;
    if(la<a||la>b||lo<c||lo>d)continue;population+=S.pop[i];let owner=S.pol[i];if(!owner)continue;
    governed+=S.pop[i];states.set(owner,(states.get(owner)||0)+S.pop[i]);
    const seen=new Set();while(S.pols[owner]?.over&&!seen.has(owner)){seen.add(owner);owner=S.pols[owner].over}
    blocs.set(owner,(blocs.get(owner)||0)+S.pop[i]);
   }
   return {name,population:Math.round(population),governedPercent:Math.round(governed/population*100),polities:states.size,
    largestStatePercent:Math.round(Math.max(0,...states.values())/population*100),largestBlocPercent:Math.round(Math.max(0,...blocs.values())/population*100)};
  });
  return {seed:S.seed,year:S.year,regions,largestRealmCells:Math.max(0,...S.alive.map(id=>S.pols[id].cells))};
 })()`)));
}
