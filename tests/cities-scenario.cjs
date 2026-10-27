// Prepared town/collapse/recovery worlds, not historical urbanization samples.
const assert=require('node:assert/strict');
const {loadBenchmarkCore,setup}=require('./performance-benchmark.cjs');
for(const seed of ['urban-a','urban-b']){
 const a=loadBenchmarkCore();setup(a,'developed');
 a.inspect(`(()=>{S.r=mulberry32(hashStr('${seed}'));P.warRate=P.crisis=P.migration=0;const i=cellAt(32,45.5);S.pop[i]=200000;S.farm[i]=S.grain[i]=S.admin[i]=S.paper[i]=S.roads[i]=1;S.works[i]=1;
  if(!S.pol[i])newPolity(i,null);let id=S.city[i];if(id<0){id=S.cities.length;S.city[i]=id;S.cities.push(newCityRecord(i,'Prepared Centre'))}
  const c=S.cities[id];c.population=c.peak=30000;c.provincePopulation=S.pop[i];c.institutions=c.scholarship=.8;c.name='Prepared Centre';
  globalThis.urbanProbe={i,id,originalOwner:S.pol[i],born:c.born};})()`);
 const phases=[];
 for(let n=0;n<120;n++){
  if(n===40)a.inspect(`(()=>{const {i}=urbanProbe,id=S.pol[i],o=S.pols[id];if(o){for(const j of WD.landIdx)if(S.pol[j]===id)S.pol[j]=0;o.alive=false;o.died=S.year;for(const [q] of o.enemies)S.pols[q]?.enemies.delete(id);o.enemies.clear();S.alive=S.alive.filter(q=>q!==id)}S.pop[i]*=.4;S.paper[i]=.02;S.works[i]=.2;distBFS()})()`);
  if(n===80)a.inspect(`(()=>{const {i}=urbanProbe;newPolity(i,null);S.works[i]=1;S.admin[i]=S.paper[i]=1;S.control[i]=S.loyalty[i]=.9;distBFS()})()`);
  a.step();
  if(n%10===0||n===119)assert.deepEqual(a.inspect('simulationIssues()'),[],seed+' year '+a.state.year);
  if([39,40,79,119].includes(n))phases.push(a.inspect(`(()=>{const {i,id}=urbanProbe,c=S.cities[id];return {year:S.year,owner:S.pol[i],provincePopulation:S.pop[i],urbanPopulation:c.population,urbanShare:c.population/Math.max(1,S.pop[i]),institutions:c.institutions,scholarship:c.scholarship,foodAccess:c.foodAccess,security:c.security,paper:S.paper[i],archivedPaper:c.knowledge?.[14]||0}})()`));
 }
 const result=a.inspect(`(()=>{const {i,id,born}=urbanProbe,c=S.cities[id];let population=0,urban=0,archives=0,peopleMinorities=0,faithMinorities=0;for(const j of WD.landIdx){population+=S.pop[j];if(S.eth2[j]>=0&&S.mix[j]>0)peopleMinorities++;if(S.faith2[j]!==-2)faithMinorities++;if(S.faith3[j]!==-2)faithMinorities++}for(const c of S.cities){urban+=cityPopulation(c);if(c.knowledge)archives++}return {states:S.alive.length,cities:S.cities.length,archives,population,urban,urbanShare:urban/population,peopleMinorities,faithMinorities,sameName:c.name==='Prepared Centre',sameFounding:c.born===born}})()`);
 assert.ok(result.sameName&&result.sameFounding);assert.ok(result.archives>0&&result.urban>0&&result.urban<result.population);
 assert.ok(phases[0].archivedPaper>0&&phases[2].archivedPaper>0,'an institution retains knowledge after the injected collapse');
 assert.ok(phases[1].urbanPopulation<phases[0].urbanPopulation,'town responds to injected demographic shock');
 assert.ok(phases.every(p=>p.urbanShare>=0&&p.urbanShare<=1));
 console.log(JSON.stringify({seed,prepared:true,interventions:'40 supported years; owner removed, population reduced 60%, works/records damaged; 40 years later a successor and restored works/records; 40 recovery years',...result,phases}));
 a.inspect('delete globalThis.urbanProbe');
}
console.log('Passed: two 120-year prepared urban/collapse/recovery worlds with regular integrity checks.');
