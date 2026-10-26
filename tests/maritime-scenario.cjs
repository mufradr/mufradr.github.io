// Controlled Age-of-Sail ports with a known real Atlantic route; no forced founding RNG.
// This verifies maritime development, not the dates of a complete world history.
const assert=require('node:assert/strict'),{loadCore}=require('./core-harness.cjs');
const a=loadCore();a.earth();a.start();
const site=a.inspect(`(()=>{S.year=1500;P.warRate=P.crisis=0;const i=15790;S.pop[i]=150000;
 for(const k of [0,3,5,6,10,12,14,15,17,19,22]){S.tk[k][i]=1;S.firstTech[k]??={y:1400,cell:i}}
 newPolity(i,null);const v=traceVoyage(i,250*Math.PI/180,voyageRange(i));S.pop[v.to]=25000;S.pol[v.to]=0;
 S.seaRoutes.set('atlantic',{...v,born:1480,last:1500});return {from:i,to:v.to,founder:S.eth[i]}})()`);
let founded=false,diaspora=false,dependent=false,peakSettlers=0;const independent=new Set();
for(let n=1;n<=300;n++){
 a.step();const colonies=[...a.state.colonies.values()];founded||=colonies.length>0;diaspora||=a.state.seaDiasporas.size>0;
 for(const c of colonies)peakSettlers=Math.max(peakSettlers,c.settlers);
 for(const c of colonies){dependent||=c.administration==='dependent'&&a.state.pol[c.cell]===c.homeState;if(c.independentState)independent.add(c.independentState)}
 if(n%10===0)assert.deepEqual(a.inspect('simulationIssues()'),[],`year ${a.state.year}`);
 if(n%50===0)console.log(JSON.stringify({year:a.state.year,communities:colonies.length,active:colonies.filter(c=>c.status==='active').length,
  dependent:colonies.filter(c=>c.administration==='dependent'&&a.state.pol[c.cell]===c.homeState).length,independentRegions:independent.size,
  peakSettlers:Math.round(peakSettlers),diasporas:a.state.seaDiasporas.size,portPopulation:Math.round(a.state.pop[site.to])}));
}
assert.ok(founded,'known ocean routes should support actual founding in this seeded scenario');
assert.ok(dependent,'new colonies should actually belong to their parent state');
assert.ok(diaspora,'passenger movements should support a maritime minority');assert.ok(peakSettlers>=500);
console.log('Passed: 300 years of maritime communities, minority exchange and integrity checks.');
