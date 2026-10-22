"use strict";
// Run at completed-year boundaries in tests/debugging; never in the render loop.
function simulationIssues(limit=50){
  const errors=[],s=S,w=WD;
  const report=message=>{if(errors.length<limit)errors.push(message)};
  if(!s||!w)return ['No simulation is loaded.'];
  const index=(v,list,empty=-1)=>Number.isInteger(v)&&(v===empty||(v>=0&&v<list.length&&list[v]!=null));
  for(let i=0;i<N;i++)if(!w.land[i]&&(s.pol[i]!==0||s.pop[i]!==0))report('Invalid water-cell settlement at '+i);
  for(const i of w.landIdx){
    if(!Number.isFinite(s.pop[i])||s.pop[i]<0)report('Invalid population at '+i);
    if(!Number.isFinite(s.K[i])||s.K[i]<0)report('Invalid carrying capacity at '+i);
    for(const name of ['dp','immune','mix','integ','s','fert','salt','adapt'])if(!Number.isFinite(s[name][i])||s[name][i]<0||s[name][i]>1)report('Invalid '+name+' at '+i);
    if(!index(s.pol[i],s.pols,0))report('Invalid owner at '+i);
    if(!index(s.eth[i],s.eths)||!index(s.eth2[i],s.eths))report('Invalid people at '+i);
    if(s.pop[i]>=1&&s.eth[i]<0)report('Peopled cell has no people at '+i);
    if(!index(s.rel[i],s.rels))report('Invalid religion at '+i);
    if(!index(s.city[i],s.cities)||(s.city[i]>=0&&s.cities[s.city[i]].cell!==i))report('Invalid city at '+i);
    if(!index(s.ob[i],s.outbreaks))report('Invalid outbreak at '+i);
    for(let k=0;k<s.tk.length;k++)if(!Number.isFinite(s.tk[k][i])||s.tk[k][i]<0||s.tk[k][i]>1)report('Invalid technique '+k+' at '+i);
    if(errors.length>=limit)break;
  }
  if(new Set(s.alive).size!==s.alive.length)report('Duplicate active polity');
  for(const id of s.alive){
    const o=s.pols[id];if(!o){report('Invalid active polity '+id);continue}
    for(const key of ['pop','K','S','press','h','cult','psi'])if(!Number.isFinite(o[key]))report('Nonfinite polity '+key+' for '+id);
    if(!Number.isInteger(o.capital)||o.capital<0||o.capital>=N||!w.land[o.capital])report('Invalid capital for '+id);
    if(!index(o.core,s.eths,-2))report('Invalid core people for '+id);
    if(o.over&&!index(o.over,s.pols,0))report('Invalid overlord for '+id);
    for(const other of o.allies)if(!s.pols[other]||!s.pols[other].allies.includes(id))report('Nonreciprocal alliance '+id+':'+other);
    for(const [other,war] of o.enemies)if(!s.pols[other]||s.pols[other].enemies.get(id)!==war||!s.wars[war])report('Invalid war relation '+id+':'+other);
    if(o.why&&(!Number.isFinite(o.psi)||Math.abs(Object.values(o.why).reduce((a,b)=>a+b,0)-o.psi)>1e-6))report('Instability explanation does not sum for '+id);
  }
  for(const id of s.activeWars)if(!s.wars[id])report('Invalid active war '+id);
  for(const war of s.wars)for(const id of war.a.concat(war.d))if(!s.pols[id])report('Invalid war participant '+id);
  for(const city of s.cities)if(!w.land[city.cell]||!index(city.eth,s.eths))report('Invalid city record');
  for(const route of s.seaRoutes.values())if(!w.land[route.from]||!w.land[route.to]||!Number.isFinite(route.km)||route.km<=0||route.path.some(i=>!Number.isInteger(i)||i<0||i>=N))report('Invalid sea route');
  return errors;
}
