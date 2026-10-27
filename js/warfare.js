"use strict";
// State totals, annual service capacity, and home-province casualty distribution.
// No soldier/ship agents or saved per-province military grids.
const militaryScratch={state:null,year:null,heads:new Map(),neighbors:new Map(),portUsed:new Map(),next:new Int32Array(N),overseas:null};
function newMilitaryState(){
 return {year:null,closedYear:null,mobilized:0,populationBasis:0,exhaustion:0,funding:1,supply:1,strain:0,
  opening:0,recruited:0,demobilized:0,combatDeaths:0,attritionDeaths:0,pendingDeaths:0,populationDeaths:0,rounding:0,
  totalDeaths:0,operations:0,attackRemaining:0,defenseRemaining:0,provisionsNeed:0,provisionsUsed:0,rations:0,foodPopulation:0};
}
function militaryState(o){return o.military||(o.military=newMilitaryState())}
function prepareMilitaryYear(){
 const s=S;if(s.militaryYear===s.year)return;s.militaryYear=s.year;
 militaryScratch.state=s;militaryScratch.year=s.year;militaryScratch.heads.clear();militaryScratch.neighbors.clear();militaryScratch.portUsed.clear();militaryScratch.overseas=null;
 for(const id of s.alive){const o=s.pols[id],m=militaryState(o),p=Math.max(0,o.pop||0),war=o.enemies.size>0;
  m.year=s.year;m.opening=m.mobilized;m.recruited=m.demobilized=m.combatDeaths=m.attritionDeaths=m.pendingDeaths=m.populationDeaths=m.rounding=0;
  m.operations=0;m.populationBasis=p;m.provisionsNeed=m.provisionsUsed=m.rations=m.foodPopulation=0;
  const authority=clamp((o.control??0.7)*(0.4+0.6*(o.loyalty??0.7)),0,1);
  const frontier=Math.min(0.05,(o.frontierPopulation||0)*0.15/Math.max(1,p));
  const fraction=war?Math.min(0.08,0.05+0.01*Math.min(3,o.enemies.size-1)):Math.max(o.kind==='horde'?0.012:0.006,frontier);
  const target=p*fraction*(0.35+0.65*authority)*(0.3+0.7*m.funding)*(1-0.55*m.exhaustion);
  if(target>m.mobilized){m.recruited=Math.min(target-m.mobilized,p*0.01);m.mobilized+=m.recruited}
  else{m.demobilized=(m.mobilized-target)*0.4;m.mobilized-=m.demobilized}
  clampMilitaryManpower(m,p);
  const capacity=m.mobilized*(0.35+0.65*m.supply)*(1-0.7*m.exhaustion);
  m.attackRemaining=capacity*0.65;m.defenseRemaining=capacity*0.35;
  if(o.dependency&&!war)o.dependency.serviceWithheld=(o.dependency.serviceWithheld||0)*0.9;
 }
}
function clampMilitaryManpower(m,p){
 const excess=Math.max(0,m.mobilized-0.08*p);m.mobilized-=excess;m.demobilized+=excess;m.populationBasis=p;
 const total=m.attackRemaining+m.defenseRemaining;if(total>m.mobilized){const ratio=m.mobilized/total;m.attackRemaining*=ratio;m.defenseRemaining*=ratio;}
}
function beginMilitaryPolitics(){
 prepareMilitaryYear();militaryScratch.heads.clear();militaryScratch.neighbors.clear();militaryScratch.portUsed.clear();militaryScratch.overseas=null;
 // The live border pass rebuilds nb incrementally. Aid uses the last completed map.
 for(const id of S.alive)militaryScratch.neighbors.set(id,new Set(S.pols[id].nb.keys()));
}
function linkMilitaryHome(i,o){
 const g=militaryScratch;g.next[i]=g.heads.get(o.id)??-1;g.heads.set(o.id,i);
}
function militaryLabor(i){
 const o=S.pols[S.pol[i]],m=o?.military;
 return m?.year===S.year&&m.populationBasis>0?clamp(m.mobilized/m.populationBasis,0,0.08)*(S.farm[i]>0.3?1:0.45):0;
}
function noteMilitaryFrontier(o,j){if(!S.pol[j]&&S.pop[j]>=1000)o.frontierPopulation=Math.max(o.frontierPopulation||0,S.pop[j])}
function militaryCampaigning(o){return o.enemies.size>0||(o.frontierPopulation||0)>0}
function resetMilitaryFood(){
 for(const id of S.alive){const m=S.pols[id].military;if(m?.year===S.year)m.provisionsNeed=m.provisionsUsed=m.rations=m.foodPopulation=0}
}
function campaignFood(i,surplus,ledger){
 const o=S.pols[S.pol[i]],m=o?.military;if(!m||m.year!==S.year||!m.mobilized)return 0;
 const p=S.pop[i],share=clamp(m.mobilized/Math.max(1,m.populationBasis),0,0.08);
 // People under arms already eat their ordinary ration in civilian consumption.
 // Only additional fodder/handling losses are a separate physical food expense.
 const need=p*share*0.25*(militaryCampaigning(o)?1+0.5*m.strain:0.2),used=Math.min(surplus,need);
 m.provisionsNeed+=need;m.provisionsUsed+=used;m.rations+=Math.min(p,networkEconomy.food[i])*share;m.foodPopulation+=p*share;
 ledger.campaignUse+=used;S.K[i]=Math.max(0,S.K[i]-used);return used;
}
function finishMilitaryFood(){
 for(const id of S.alive){const m=S.pols[id].military;if(!m||m.year!==S.year)continue;
  const rations=m.foodPopulation?clamp(m.rations/m.foodPopulation,0,1):1,extras=m.provisionsNeed?clamp(m.provisionsUsed/m.provisionsNeed,0,1):1;
  m.supply=rations*(0.25+0.75*extras);
 }
}
function militaryBudgetNeed(o){
 const m=o.military;if(!m||m.year!==S.year)return 0;
 const c=o.capital,equipment=1+0.4*S.gun[c]+0.2*S.iron[c]+0.3*S.caval[c];
 return m.mobilized*(militaryCampaigning(o)?0.4:0.18)*equipment*(1+0.6*m.strain);
}
function militaryReadiness(o){
 const m=o.military;if(!m)return 0.5;
 return clamp((0.2+0.8*m.funding)*(0.2+0.8*m.supply)*(1-0.8*m.exhaustion),0,1);
}
function militaryProtectionReady(o){
 const m=o.military;return !m||((m.year!==S.year||m.mobilized>=1)&&m.exhaustion<0.85&&m.funding>=0.25&&m.supply>=0.2);
}
function campaignAccess(o,i,j,sea=false){
 const s=S,w=WD,m=o.military;if(!m||m.year!==s.year||s.pol[i]!==o.id||s.dist[i]===65535)return 0;
 const road=roadWorks(i),reach=Math.exp(-s.dist[i]/Math.max(4,(o.h||P.reach)*(1+road)));
 const terrain=1/(1+P.terrain*(0.7*w.rough[j]+0.06*Math.max(0,w.tcost[j]-2)+0.25*s.forest[j]));
 let connection=1;
 if(sea){
  if(P.seafaring<=0||!w.coast[i]||!w.coast[j]||s.pop[i]<1000)return 0;
  if(!militaryScratch.overseas)militaryScratch.overseas=overseasTransport();
  const corridor=militaryScratch.overseas.get(i)?.find(e=>e.cell===j);
  let km=corridor?.km??0;
  if(!corridor){let near=false;for(let k=w.ls[i];k<w.ls[i+1];k++)if(w.lt[k]===j&&(w.ld[k]<=3||s.nav[i]>=0.5)){near=true;break}if(!near)return 0;km=6371*angDist(i,j)}
  if(voyageRange(i)<km)return 0;
  connection=(0.25+0.75*s.nav[i])*(0.4+0.6*worksQuality(i))/(1+km/4000);
 }
 const local=networkEconomy.state===s&&networkEconomy.year===s.year?clamp(networkEconomy.food[i]/Math.max(1,s.pop[i]),0,1):1;
 return clamp(reach*terrain*connection*local*(0.3+0.7*s.control[i]),0,1);
}
function portCampaignCapacity(i){return S.pop[i]*0.12*(0.25+0.75*S.nav[i])*(0.4+0.6*worksQuality(i))}
function dependencySupportAccess(support,defender,j){
 let access=0,port=-1;const km=6371*angDist(support.capital,j);
 const neighbors=militaryScratch.state===S&&militaryScratch.year===S.year?militaryScratch.neighbors.get(support.id)??support.nb:support.nb;
 if(WD.lm[support.capital]===WD.lm[j]&&neighbors.has(defender.id))access=Math.exp(-km/(800+250*(support.h||P.reach)));
 for(const route of S.seaRoutes.values()){
  if(!seaRouteViable(route)||S.year-route.last>50)continue;
  const from=S.pol[route.from]===support.id&&S.pol[route.to]===defender.id?route.from:S.pol[route.to]===support.id&&S.pol[route.from]===defender.id?route.to:-1;
  if(from<0||S.pop[from]<1000||voyageRange(from)<route.km)continue;
  const sea=(0.25+0.75*S.nav[from])*(0.4+0.6*worksQuality(from))/(1+route.km/4000);
  if(sea>access){access=sea;port=from}
 }
 return {access:access*(0.3+0.7*(defender.control??0.7)),port};
}
function reserveDefensiveSupport(attacker,defender,j,gap){
 const wid=attacker.enemies.get(defender.id),war=wid!=null?S.wars[wid]:null,result=[];if(!war)return result;
 const side=war.aSet.has(defender.id)?war.a:war.d;
 for(const id of side){const helper=S.pols[id],m=helper.military;if(gap<1||result.length>=3)break;
  if(id===defender.id||!helper.alive||!(helper.over===defender.id||defender.over===id)||m?.year!==S.year||!militaryProtectionReady(helper))continue;
  const {access,port}=dependencySupportAccess(helper,defender,j);
  const room=port<0?Infinity:Math.max(0,portCampaignCapacity(port)-(militaryScratch.portUsed.get(port)||0));
  const troops=Math.min(gap,m.defenseRemaining,m.mobilized,room)*access;
  if(troops<1)continue;m.defenseRemaining-=troops;m.strain=Math.max(m.strain,1-access);gap-=troops;
  if(port>=0)militaryScratch.portUsed.set(port,(militaryScratch.portUsed.get(port)||0)+troops);
  result.push({id,troops});
 }
 return result;
}
function commitCampaign(o,i,j,sea=false){
 const m=o.military,access=campaignAccess(o,i,j,sea);if(!m||access<0.04||m.mobilized<1)return null;
 const want=Math.min(m.mobilized*0.65,Math.max(25,S.pop[j]*0.08));
 const room=sea?Math.max(0,portCampaignCapacity(i)-(militaryScratch.portUsed.get(i)||0)):Infinity;
 const committed=Math.min(want,m.attackRemaining,m.mobilized,room)*m.funding;
 if(committed<1)return null;m.attackRemaining=Math.max(0,m.attackRemaining-committed);m.operations++;
 if(sea){militaryScratch.portUsed.set(i,(militaryScratch.portUsed.get(i)||0)+committed);for(const route of S.seaRoutes.values())if(route.from===i&&route.to===j||route.to===i&&route.from===j){route.last=S.year;break}}
 const strain=clamp(1-access,0,1);m.strain=Math.max(m.strain,strain);
 const d=S.pols[S.pol[j]],dm=d?.military;
 let defenders=0;
 const defendNeed=Math.max(want,Math.min(S.pop[j]*0.02,(dm?.mobilized||0)*0.15));
 if(dm?.year===S.year){
  defenders=Math.min(defendNeed,dm.defenseRemaining,dm.mobilized);dm.defenseRemaining-=defenders;
 }
 const supporters=d?reserveDefensiveSupport(o,d,j,defendNeed-defenders):[];

 const drafted=dm?.populationBasis?clamp(dm.mobilized/dm.populationBasis,0,0.08):0;
 const militia=S.pop[j]*(1-drafted)*(d?0.006*(0.3+0.7*S.control[j]):0.012);
 return {committed,defenders,supporters,militia,target:j,access};
}
function campaignDefense(j,plan){
 const d=S.pols[S.pol[j]];let field=plan.defenders*(d?militaryReadiness(d):1);
 for(const h of plan.supporters)field+=h.troops*militaryReadiness(S.pols[h.id]);
 return Math.pow(field+plan.militia+1,P.scaleExp)*(d?0.5*d.S+0.5*S.s[j]:S.s[j])*milAt(j)*(1+1.6*WD.rough[j])*(1+2.5*S.fort[j]);
}
function militaryLoss(o,amount,attrition=false,war=null){
 const m=o?.military;if(!m||m.year!==S.year)return 0;
 const lost=Math.min(Math.max(0,amount),m.mobilized);m.mobilized-=lost;m.pendingDeaths+=lost;
 if(attrition)m.attritionDeaths+=lost;else m.combatDeaths+=lost;
 m.attackRemaining=Math.min(m.attackRemaining,m.mobilized);m.defenseRemaining=Math.min(m.defenseRemaining,Math.max(0,m.mobilized-m.attackRemaining));
 if(war){war.campaignLosses??={a:0,d:0,civilian:0};war.campaignLosses[war.aSet.has(o.id)?'a':'d']+=lost}
 return lost;
}
function resolveCampaign(o,d,plan,won,war){
 militaryLoss(o,plan.committed*(won?0.025:0.06)*(1+1.5*(1-plan.access)),false,war);
 if(d)militaryLoss(d,plan.defenders*(won?0.07:0.025),false,war);
 for(const h of plan.supporters||[])militaryLoss(S.pols[h.id],h.troops*(won?0.07:0.025),false,war);
 if(plan.militia){const i=plan.target,before=S.pop[i];S.pop[i]=Math.max(0,before-plan.militia*(won?0.03:0.01));if(war){war.campaignLosses??={a:0,d:0,civilian:0};war.campaignLosses.militia=(war.campaignLosses.militia||0)+before-S.pop[i]}}
}
function campaignCivilianLoss(i,fraction,war=null){
 const before=S.pop[i];S.pop[i]=Math.max(0,before*(1-fraction));const lost=before-S.pop[i];
 if(war){war.campaignLosses??={a:0,d:0,civilian:0};war.campaignLosses.civilian+=lost}return lost;
}
function finishMilitaryYear(){
 const s=S;if(militaryScratch.state!==s||militaryScratch.year!==s.year)return;
 // Include defeated states: their recruitment homes still exist after annexation.
 for(const [id,head]of militaryScratch.heads){const o=s.pols[id],m=o.military;if(!m||m.year!==s.year)continue;
  if(m.closedYear!==s.year){
   const war=o.enemies.size>0,activity=clamp(m.operations/Math.max(1,o.cells*0.1),0,1);
   if(war||activity){militaryLoss(o,m.mobilized*(war?0.005:0.001)*(1-m.supply)*(1+m.strain),true);m.exhaustion=clamp(m.exhaustion+0.012*(war?1:activity)+0.035*(1-m.supply)+0.025*(1-m.funding)+0.012*m.strain,0,1)}
   else m.exhaustion=Math.max(0,m.exhaustion-0.025*(0.3+0.7*m.supply)*m.funding);
   m.strain*=0.8;m.closedYear=s.year;
  }
  if(!m.pendingDeaths)continue;
  let population=0;for(let i=head;i>=0;i=militaryScratch.next[i])population+=s.pop[i];
  const requested=m.pendingDeaths,rate=Math.min(1,requested/Math.max(1,population));let actual=0;
  for(let i=head;i>=0;i=militaryScratch.next[i]){const before=s.pop[i];s.pop[i]=before*(1-rate);actual+=before-s.pop[i]}
  m.populationDeaths+=actual;m.rounding+=actual-requested;m.totalDeaths+=requested;m.pendingDeaths=0;
 }
}
function militaryPeacePressure(o){
 const m=o.military;return m?clamp(0.6*m.exhaustion+0.2*(1-m.supply)+0.2*(1-m.funding)+0.15*(o.fiscalStress||0),0,1):0;
}
function campaignPeaceChance(war){
 const pressure=ids=>{let sum=0,n=0;for(const id of ids){const o=S.pols[id];if(o?.alive){sum+=militaryPeacePressure(o);n++}}return n?sum/n:1};
 const a=pressure(war.a),d=pressure(war.d),years=S.year-war.start,fresh=S.year-(war.lastGain??war.start);
 return clamp(0.02+(years>=3?0.25*Math.max(a,d)+0.1*Math.min(a,d):0)+(fresh>8?0.08:0)+(years>40?0.1:0),0,0.75);
}
function addVassalMilitaryService(war){
 for(const id of S.alive){const o=S.pols[id],d=o.dependency;if(!d||!war.d.includes(o.over)||war.a.includes(id)||war.d.includes(id))continue;
  const willing=d.loyalty>=0.55&&d.pressure<0.6&&militaryProtectionReady(o)&&war.d.every(k=>!o.enemies.has(k));
  d.serviceWithheld=willing?0:1;if(willing)war.d.push(id);
 }
}
