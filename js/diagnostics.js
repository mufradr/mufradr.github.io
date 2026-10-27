"use strict";
// Run at completed-year boundaries in tests/debugging; never in the render loop.
function simulationIssues(limit=50,state=S,world=WD){
  const errors=[],s=state,w=world;
  const report=message=>{if(errors.length<limit)errors.push(message)};
  if(!s||!w)return ['No simulation is loaded.'];
  const index=(v,list,empty=-1)=>Number.isInteger(v)&&(v===empty||(v>=0&&v<list.length&&list[v]!=null));
  if(s.economyVersion!==1||!(s.foodStock instanceof Float64Array)||s.foodStock.length!==N||!(s.works instanceof Float32Array)||s.works.length!==N)return ['Invalid economy schema'];
  if(s.governmentVersion!==1||['control','loyalty','autonomy'].some(k=>!(s[k] instanceof Float32Array)||s[k].length!==N)||!(s.governor instanceof Int32Array)||s.governor.length!==N)return ['Invalid government schema'];
  if(s.warfareVersion!==1||s.militaryYear!==null&&!Number.isSafeInteger(s.militaryYear))report('Invalid warfare schema');
  if(s.governmentYear!==null&&!Number.isSafeInteger(s.governmentYear))report('Invalid government clock');
  for(let i=0;i<N;i++)if(!w.land[i]){if(s.pol[i]!==0||s.pop[i]!==0)report('Invalid water-cell settlement at '+i);if(s.foodStock[i]!==0)report('Invalid water-cell food stock at '+i)}
  if(s.worksYear!==null&&!Number.isSafeInteger(s.worksYear))report('Invalid infrastructure clock');
  for(const i of w.landIdx){
    if(!Number.isFinite(s.foodStock[i])||s.foodStock[i]<0)report('Invalid food stock at '+i);
    if(!Number.isFinite(s.works[i])||s.works[i]<0.049999||s.works[i]>1)report('Invalid infrastructure condition at '+i);
    if(!index(s.governor[i],s.pols,0))report('Invalid governor at '+i);
    if(!Number.isFinite(s.pop[i])||s.pop[i]<0)report('Invalid population at '+i);
    if(!Number.isInteger(s.settled[i])||s.settled[i]<0||s.settled[i]>2000)report('Invalid settlement history at '+i);
    if(!Number.isFinite(s.K[i])||s.K[i]<0)report('Invalid carrying capacity at '+i);
    for(const name of ['control','loyalty','autonomy','dp','immune','mix','integ','s','fert','salt','adapt'])if(!Number.isFinite(s[name][i])||s[name][i]<0||s[name][i]>1)report('Invalid '+name+' at '+i);
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
  if(s.foodLedger){const f=s.foodLedger,keys=['openingStock','production','demand','consumption','spoilage','shippingLoss','waste','closingStock','unmet'];
    if(!Number.isInteger(f.year)||keys.some(k=>!Number.isFinite(f[k])||f[k]<0)||!Number.isFinite(f.campaignUse??0)||(f.campaignUse??0)<0)report('Invalid food ledger');
    else if(Math.abs(f.openingStock+f.production-f.consumption-f.spoilage-f.shippingLoss-(f.campaignUse??0)-f.waste-f.closingStock)>1e-8*Math.max(1,f.openingStock+f.production))report('Food ledger does not balance');
    else if(Math.abs(f.consumption+f.unmet-f.demand)>1e-8*Math.max(1,f.demand))report('Food demand does not balance');
  }
  for(const id of s.alive){
    const o=s.pols[id];if(!o){report('Invalid active polity '+id);continue}
    for(const key of ['pop','K','S','press','h','cult','psi'])if(!Number.isFinite(o[key]))report('Nonfinite polity '+key+' for '+id);
    for(const key of ['foodStress','foodImports','foodExports'])if(o[key]!==undefined&&(!Number.isFinite(o[key])||o[key]<0||(key==='foodStress'&&o[key]>1)))report('Invalid polity '+key+' for '+id);
    if(o.foodCrisisYear!==undefined&&!Number.isSafeInteger(o.foodCrisisYear))report('Invalid food crisis year for '+id);
    for(const key of ['infrastructureFunding','infrastructureCondition','fiscalStress','control','loyalty','autonomy','successionShock'])if(o[key]!==undefined&&(!Number.isFinite(o[key])||o[key]<0||o[key]>1))report('Invalid '+key+' for '+id);
    if(o.treas!==undefined&&(!Number.isFinite(o.treas)||o.treas < -2||o.treas>1))report('Invalid treasury for '+id);
    if(o.military){const m=o.military,nonnegative=['mobilized','populationBasis','opening','recruited','demobilized','combatDeaths','attritionDeaths','pendingDeaths','populationDeaths','totalDeaths','operations','attackRemaining','defenseRemaining','provisionsNeed','provisionsUsed','rations','foodPopulation'];
      if(nonnegative.some(k=>!Number.isFinite(m[k])||m[k]<0)||['exhaustion','funding','supply','strain'].some(k=>!Number.isFinite(m[k])||m[k]<0||m[k]>1)||!Number.isFinite(m.rounding)||m.year!==null&&!Number.isSafeInteger(m.year)||m.closedYear!==null&&!Number.isSafeInteger(m.closedYear))report('Invalid military state for '+id);
      else if(m.mobilized>0.08*m.populationBasis+1e-6||m.attackRemaining+m.defenseRemaining>m.mobilized+1e-6||m.provisionsUsed>m.provisionsNeed+1e-6)report('Military resources exceeded for '+id);
      else if(m.year!==null&&Math.abs(m.opening+m.recruited-m.demobilized-m.combatDeaths-m.attritionDeaths-m.mobilized)>1e-8*Math.max(1,m.opening+m.recruited))report('Military manpower does not balance for '+id);
      else if(m.pendingDeaths>1e-8)report('Unsettled military deaths for '+id);
      else if(Math.abs(m.populationDeaths-m.combatDeaths-m.attritionDeaths-m.rounding)>1e-6)report('Military population losses do not balance for '+id);
    }
    if(o.budget){const b=o.budget,positive=['revenue','administrationRequired','militaryRequired','administration','military','infrastructure','maintenanceRequired','spending','unpaid','surplusDiscarded','debtRelief'];
      if(!(b.revenue>0)||positive.some(k=>!Number.isFinite(b[k])||b[k]<0)||!Number.isFinite(b.balance)||!Number.isFinite(b.openingTreasury)||!Number.isFinite(b.closingTreasury))report('Invalid government budget for '+id);
      else if(Math.abs(b.administrationRequired+b.militaryRequired-b.administration-b.military-b.unpaid)>1e-8*Math.max(1,b.revenue)||Math.abs(b.revenue-b.spending-b.balance)>1e-8*Math.max(1,b.revenue)||Math.abs(b.administration+b.military+b.infrastructure+(b.tributeOut||0)-b.spending)>1e-8*Math.max(1,b.spending)||Math.abs(b.closingTreasury-b.openingTreasury-0.04*(b.balance-b.surplusDiscarded+b.debtRelief)/b.revenue)>1e-8)report('Government budget does not balance for '+id);
    }
    if(!Number.isInteger(o.capital)||o.capital<0||o.capital>=N||!w.land[o.capital])report('Invalid capital for '+id);
    if(!index(o.core,s.eths,-2))report('Invalid core people for '+id);
    if(o.budget?.domesticRevenue!==undefined){const b=o.budget;if(['domesticRevenue','tributeIn','tributeOut'].some(k=>!Number.isFinite(b[k])||b[k]<0)||Math.abs(b.domesticRevenue+b.tributeIn-b.revenue)>1e-8*Math.max(1,b.revenue)||b.tributeOut>b.domesticRevenue+1e-8)report('Invalid tribute budget for '+id)}
    if(o.dependency){const d=o.dependency;if(d.parent!==o.over||!o.over||['loyalty','pressure','protection','withheld'].some(k=>!Number.isFinite(d[k])||d[k]<0||d[k]>1)||['since','year'].some(k=>!Number.isSafeInteger(d[k]))||!Number.isFinite(d.due)||!Number.isFinite(d.paid)||d.paid<0||d.paid>d.due+1e-8)report('Invalid dependency for '+id)}
    if(o.over&&!index(o.over,s.pols,0))report('Invalid overlord for '+id);
    for(const other of o.allies)if(!s.pols[other]||!s.pols[other].allies.includes(id))report('Nonreciprocal alliance '+id+':'+other);
  for(const [other,war] of o.enemies)if(!s.pols[other]||s.pols[other].enemies.get(id)!==war||!s.wars[war])report('Invalid war relation '+id+':'+other);
    if(o.why&&(!Number.isFinite(o.psi)||Math.abs(Object.values(o.why).reduce((a,b)=>a+b,0)-o.psi)>1e-6))report('Instability explanation does not sum for '+id);
  }
  const done=new Set();for(const id of s.alive){let p=id;const path=new Set();while(p&&!done.has(p)){if(path.has(p)){report('Cyclic dependency');break}path.add(p);p=s.pols[p]?.over||0}for(const k of path)done.add(k)}
  if(s.tributeLedger){const l=s.tributeLedger;let paid=0,withheld=0;
   if(!Number.isInteger(l.year)||!Array.isArray(l.transfers)||[l.paid,l.received,l.withheld].some(v=>!Number.isFinite(v)||v<0))report('Invalid tribute ledger');
   else {const payers=new Set(),receipts=new Map();for(const t of l.transfers){if(!index(t.from,s.pols,0)||!index(t.to,s.pols,0)||!t.from||!t.to||t.from===t.to||payers.has(t.from)||!Number.isFinite(t.due)||!Number.isFinite(t.paid)||t.paid<0||t.paid>t.due)report('Invalid tribute transfer');payers.add(t.from);paid+=t.paid;withheld+=t.due-t.paid;receipts.set(t.to,(receipts.get(t.to)||0)+t.paid);const b=s.pols[t.from]?.budget;if(b?.year===l.year&&Math.abs((b.tributeOut||0)-t.paid)>1e-8*Math.max(1,t.paid))report('Tribute payment does not match budget')}
    for(const [id,received]of receipts){const b=s.pols[id]?.budget;if(b?.year===l.year&&Math.abs((b.tributeIn||0)-received)>1e-8*Math.max(1,received))report('Tribute receipt does not match budget')}
    if(Math.abs(l.paid-paid)>1e-8*Math.max(1,paid)||Math.abs(l.received-paid)>1e-8*Math.max(1,paid)||Math.abs(l.withheld-withheld)>1e-8*Math.max(1,withheld))report('Tribute ledger does not balance');
   }
  }
  for(const id of s.activeWars)if(!s.wars[id])report('Invalid active war '+id);
  for(const war of s.wars)if(war.campaignLosses&&(['a','d','civilian'].some(k=>!Number.isFinite(war.campaignLosses[k])||war.campaignLosses[k]<0)||!Number.isFinite(war.campaignLosses.militia??0)||(war.campaignLosses.militia??0)<0))report('Invalid campaign casualty record');
  for(const war of s.wars)for(const id of war.a.concat(war.d))if(!s.pols[id])report('Invalid war participant '+id);
  for(const city of s.cities)if(!w.land[city.cell]||!index(city.eth,s.eths))report('Invalid city record');
  for(const route of s.seaRoutes.values())if(!w.land[route.from]||!w.land[route.to]||!Number.isFinite(route.km)||route.km<=0||route.path.some(i=>!Number.isInteger(i)||i<0||i>=N))report('Invalid sea route');
  if(s.seaDiasporas.size>256)report('Too many maritime diaspora records');
  for(const [cell,d] of s.seaDiasporas)if(!w.land[cell]||!index(d.people,s.eths,-2)||!Number.isFinite(d.last))report('Invalid maritime diaspora');
  if(s.colonies.size>128)report('Too many colony records');
  for(const [cell,c] of s.colonies){
    if(cell!==c.cell||!w.land[cell]||!w.coast[cell]||!w.coast[c.source])report('Invalid colony location');
    if(!index(c.people,s.eths,-2)||!index(c.founderPeople,s.eths,-2)||!index(c.homeState,s.pols,0))report('Invalid colony origin');
    if(!['active','failed'].includes(c.status)||!Number.isFinite(c.founded)||!Number.isFinite(c.settlers)||c.settlers<0||c.settlers>s.pop[cell]+0.01||!Number.isFinite(c.lastPopulation))report('Invalid colony demographics');
    if(c.administration!==undefined&&!['dependent','integrated','independent','enclave','occupied','unaffiliated'].includes(c.administration))report('Invalid colony administration');
    if(['dependent','integrated'].includes(c.administration)&&!c.homeState)report('Invalid colony parent');
    if(c.outpost!==undefined&&typeof c.outpost!=='boolean')report('Invalid colony outpost');
    if(c.autonomy!==undefined&&(!Number.isFinite(c.autonomy)||c.autonomy<0||c.autonomy>1))report('Invalid colony autonomy');
    for(const key of ['isolationYears','identityYears','populationRatio','regionalPopulation','regionalCommunityPopulation','homelandPopulation'])if(c[key]!==undefined&&(!Number.isFinite(c[key])||c[key]<0))report('Invalid colony '+key);
    for(const key of ['governmentYear','independentYear','lastReintegration'])if(c[key]!==undefined&&!Number.isInteger(c[key]))report('Invalid colony '+key);
    if(c.independentState!==undefined&&!index(c.independentState,s.pols,0))report('Invalid independent colony state');
  }
  return errors;
}
