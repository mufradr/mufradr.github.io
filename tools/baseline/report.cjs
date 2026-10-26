// Read-only presentation of preserved measurements; never runs the engine.
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib');
function report(out){
 const runs=fs.readdirSync(out).filter(f=>f.endsWith('.json.gz')).sort().map(f=>JSON.parse(z.gunzipSync(fs.readFileSync(path.join(out,f))))).filter(r=>r.definition.category!=='prepared-stress');
 const date=y=>y===null||y===undefined?'not observed':y<=0?(1-y).toLocaleString('en-US')+' BCE':y+' CE',num=n=>Math.round(n).toLocaleString('en-US'),pct=n=>(100*n).toFixed(1)+'%',safe=s=>String(s).replaceAll('|','/').replaceAll('\n',' ');
 let md='# Historical baseline detail\n\nThese are simulated outcomes, not desired historical dates. Default Earth seeds are independent samples; the generated world is a separate experiment. Dates below follow the app’s BCE/CE display. State identity changes can look like abrupt imperial falls. The small initial sample cannot establish regional success rates.\n\n## First observations\n\n| Run | State | Kingdom or higher | Empire | Ocean-going knowledge | Colony | Colonial independence |\n| --- | --- | --- | --- | --- | --- | --- |\n';
 for(const r of runs){const f=r.trials[0].outcomes.first;md+=`| ${r.definition.id} | ${date(f.chiefdom)} | ${date(f.kingdom)} | ${date(f.empire)} | ${date(f.oceanKnowledge)} | ${date(f.colony)} | ${date(f.colonialIndependence)} |\n`}
 md+='\n## End of each observation window\n\nCounts of cities and peoples are stored entity records, including historical records; they are not counts of living settlements or peoples. Colony foundings are observed unique events. Independent-region counts are cumulative observed successor IDs, not current independent countries.\n\n| Run | Population | Direct owners | Settled states | Empire titles | City records | People records | Colony foundings / active | Dependencies / independent regions |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n';
 for(const r of runs){const s=r.trials[0].outcomes.snapshots.at(-1);md+=`| ${r.definition.id} | ${num(s.population)} | ${s.polities} | ${s.states} | ${s.empires} | ${s.cities} | ${s.peoples} | ${s.overseas.totalFoundings} / ${s.overseas.active} | ${s.overseas.dependent} / ${s.overseas.independentRegions} |\n`}
 for(const r of runs){const o=r.trials[0].outcomes;md+='\n## '+r.definition.id+'\n\n';
  md+=`Ever observed as an empire: **${o.empireLongevity.total}**; completed lifetimes: **${o.empireLongevity.ended}**; ongoing/right-censored: **${o.empireLongevity.rightCensored}**. Eligible major states: **${o.majorDecline.eligible}**; first half-area declines: **${o.majorDecline.sudden} sudden / ${o.majorDecline.gradual} gradual**; threshold not reached: **${o.majorDecline.notYetObserved}**.\n\n`;
  const empires=o.polities.filter(p=>p.firstEmpireYear!==null).sort((a,b)=>((b.ended??r.trials[0].endYear)-b.firstObserved)-((a.ended??r.trials[0].endYear)-a.firstObserved)).slice(0,5);
  md+='Longest observed state identities that held an empire title; duration includes their pre-imperial life. Ongoing entries are observed lower bounds, not completed lifetimes.\n\n| ID / final recorded name | First ownership | First empire title | End / observation horizon | Observed state years |\n| --- | --- | --- | --- | ---: |\n';
  for(const p of empires)md+=`| ${p.id}: ${safe(p.name)} | ${date(p.firstObserved)} | ${date(p.firstEmpireYear)} | ${p.ended===null?'ongoing at '+date(r.trials[0].endYear):date(p.ended)} | ${(p.ended??r.trials[0].endYear)-p.firstObserved} |\n`;
  if(r.definition.category==='historical-earth'){
   const years=[-5000,-3000,-1000,0,1000,1800],snapshots=years.map(y=>o.snapshots.find(s=>s.year===y)).filter(Boolean);
   md+='\nLargest direct-owner share of regional population. This includes chiefdoms and nomads and does not imply effective administration of every claim. Empty regions have a zero share.\n\n| Region | '+snapshots.map(s=>date(s.year)).join(' | ')+' |\n| --- | '+snapshots.map(()=>'---:').join(' | ')+' |\n';
   for(const region of snapshots[0]?.regions||[])md+='| '+region.name+' | '+snapshots.map(s=>pct(s.regions.find(q=>q.name===region.name).largestStateShare)).join(' | ')+' |\n';
   md+='\nFinal direct-owner and tributary-bloc shares are separate: a large bloc can consist of several independently owned states.\n\n| Region | Population | Direct owners | Governed share | Largest owner | Largest bloc |\n| --- | ---: | ---: | ---: | ---: | ---: |\n';
   for(const q of o.snapshots.at(-1).regions)md+=`| ${q.name} | ${num(q.population)} | ${q.polities} | ${pct(q.governedShare)} | ${pct(q.largestStateShare)} | ${pct(q.largestBlocShare)} |\n`;
  }
 }
 fs.writeFileSync(path.join(out,'HISTORY.md'),md);return md;
}
if(require.main===module)report(path.resolve(process.argv[2]||'benchmarks/baselines/v0.16.0'));
module.exports={report};
