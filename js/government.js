"use strict";
// Annual provincial government reuses political aggregation. Scratch is not saved.
const governmentScratch={state:null,year:null,candidates:new Map(),visited:new Int32Array(N),stamp:0};
function governmentLoyaltyTarget(legitimacy,integration,fiscal,isolation,autonomy,protection=1){
 return clamp(0.12+0.4*legitimacy+0.35*integration-0.35*fiscal-0.25*isolation+0.25*autonomy+0.08*protection,0,1);
}
function governmentIsolation(i,o){
 const c=S.colonies.get(i),distance=S.dist[i]===65535?1:clamp((S.dist[i]/Math.max(1,o.h||P.reach)-1)/3,0,1);
 return c&&isDependentColony(i,o.id)?Math.max(distance,clamp((c.isolationYears||0)/30,0,1)):distance;
}
function beginGovernmentYear(){
 const s=S,g=governmentScratch;g.state=s;g.year=s.year;g.candidates.clear();
 const advance=s.governmentYear!==s.year;s.governmentYear=s.year;
 for(const id of s.alive){const o=s.pols[id];o.controlTotal=0;o.loyaltyTotal=0;o.autonomyTotal=0;
  if(!advance)continue;
  const b=o.budget,unpaid=b?b.unpaid/Math.max(1,b.administrationRequired+b.militaryRequired):0;
  const fiscal=clamp(Math.max(0,-(o.treas??0))/2+0.5*unpaid+0.25*Math.max(0,(o.burden||0)-1),0,1);
  o.fiscalStress=clamp((o.fiscalStress||0)*0.92+0.08*fiscal,0,1);
  o.successionShock=(o.successionShock||0)*0.94;
  if(o.over&&!s.pols[o.over]?.alive)endDependency(o,'its protector no longer survives');
 }
 return advance;
}
function provincialGovernment(i,o,advance=true){
 const s=S;
 if(s.governor[i]!==o.id){
  s.governor[i]=o.id;s.control[i]=clamp(0.35+0.5*s.integ[i],0.2,0.9);s.loyalty[i]=clamp(0.25+0.6*s.integ[i],0.2,0.9);s.autonomy[i]=0;
 }
 if(advance){
  const isolation=governmentIsolation(i,o),fiscal=o.fiscalStress||0,legitimacy=clamp((o.mandate??1)-0.3*(o.successionShock||0),0,1),integration=s.integ[i];
  const concession=clamp(0.65*isolation+0.45*fiscal+0.3*(1-legitimacy)+0.25*(1-s.loyalty[i])-0.3*integration,0,0.85);
  // Bargaining is slower than a conquest; concessions buy loyalty, not free tax.
  const a=s.autonomy[i];s.autonomy[i]=clamp(a+(concession-a)*(concession>a?0.012:0.004),0,1);
  const target=clamp(0.15+0.45*legitimacy+0.35*integration+0.1*(o.infrastructureFunding??0.8)-0.45*isolation-0.45*fiscal-0.25*s.autonomy[i],0.05,1);
  const control=s.control[i];s.control[i]=clamp(control+(target-control)*(target<control?0.025:0.018),0,1);
  const loyalty=governmentLoyaltyTarget(legitimacy,integration,fiscal,isolation,s.autonomy[i]);
  s.loyalty[i]=clamp(s.loyalty[i]+(loyalty-s.loyalty[i])*(loyalty<s.loyalty[i]?0.025:0.018),0,1);
  s.integ[i]=clamp(integration-0.003*fiscal*(1-s.control[i])-0.002*isolation*(1-s.loyalty[i]),0,1);
 }
 const p=s.pop[i];o.controlTotal+=p*s.control[i];o.loyaltyTotal+=p*s.loyalty[i];o.autonomyTotal+=p*s.autonomy[i];
 if(i!==o.capital&&p>=500&&s.year-Math.max(o.born,s.taken[i])>=25&&!isDependentColony(i,o.id)&&s.control[i]<0.45&&s.autonomy[i]>0.35){
  const score=(1-s.control[i])*(1-s.loyalty[i])+s.autonomy[i]*0.3,old=governmentScratch.candidates.get(o.id);
  if(!old||score>old.score)governmentScratch.candidates.set(o.id,{cell:i,score});
 }
 return s.control[i]*(1-0.55*s.autonomy[i]);
}
function setDependency(child,parent){
 if(!child?.alive||!parent?.alive||child.id===parent.id)return false;
 // A dependency forest makes obligations and tribute unambiguous.
 const seen=new Set([child.id]);for(let p=parent;p;p=S.pols[p.over]){if(seen.has(p.id))return false;seen.add(p.id)}
 if(child.over&&S.pols[child.over])S.pols[child.over].tribs=Math.max(0,S.pols[child.over].tribs-1);
 child.over=parent.id;parent.tribs++;child.overY=S.year;
 child.dependency={parent:parent.id,since:S.year,loyalty:0.7,pressure:0,protection:0.8,withheld:0,due:0,paid:0,year:S.year};
 return true;
}
function endDependency(child,reason){
 const parent=S.pols[child.over];if(parent)parent.tribs=Math.max(0,parent.tribs-1);
 if(parent&&child.cells>=3)chron('diplomacy',`The ${child.full} ends its dependence on the ${parent.full}: ${reason}.`,child.capital,[R_(child),R_(parent)]);
 child.over=0;child.overY=0;child.dependency=null;
}
function domesticGovernmentRevenue(o){
 const n=networkEconomy,live=n.state===S&&n.year===S.year,e=live?n.states.get(o.id):null;
 const shortage=e?e.shortfall/Math.max(1,e.population):0;
 const tax=live?Math.max(0,((o.tax||0)-(o.trade||0))*(1-0.5*shortage)+(e?.trade||0)*governmentCollection(o)):Math.max(0,o.tax||0);
 return (o.kind==='horde'?Math.max(tax,0.04*o.pop):tax*(S.tk[27][o.capital]>0.5?1.1:1))+1;
}
function governmentCollection(o){return (o.control??0.8)*(1-0.55*(o.autonomy??0))}
function governmentRevenueStep(advance=true){
 const s=S,ledger=s.tributeLedger={year:s.year,paid:0,received:0,withheld:0,transfers:[]};
 for(const id of s.alive){const o=s.pols[id];o.tributeIn=0;o.tributeOut=0;o.domesticRevenue=domesticGovernmentRevenue(o);o.tribs=0}
 for(const id of s.alive){const o=s.pols[id],parent=s.pols[o.over];if(!o.over||!parent?.alive)continue;
  if(!o.dependency||o.dependency.parent!==parent.id){const original=o.overY;setDependency(o,parent);if(original!=null)o.dependency.since=original}
  const d=o.dependency;
  if(advance){
   let threats=0,covered=0;for(const [enemy] of o.enemies)if(enemy!==parent.id){threats++;if(parent.enemies.has(enemy)&&militaryProtectionReady(parent)&&dependencySupportAccess(parent,o,o.capital).access>0.05)covered++}
   d.protection=clamp(d.protection+(threats?(covered===threats?0.03:-0.04):0.005),0,1);
   const relative=clamp(power(o)/Math.max(1,power(parent)),0,2),isolation=clamp(6371*angDist(o.capital,parent.capital)/12000,0,1);
   const target=governmentLoyaltyTarget(parent.mandate??1,o.integ??0.5,parent.fiscalStress||0,isolation,0.6,d.protection);
   d.loyalty=clamp(d.loyalty+0.025*(target-d.loyalty),0,1);
   const pressure=clamp(0.45*(1-d.loyalty)+0.45*(1-d.protection)+0.3*(parent.fiscalStress||0)+0.35*Math.max(0,relative-0.5)+0.25*d.withheld+0.1*(d.serviceWithheld||0),0,1);
   d.pressure=clamp(d.pressure+0.025*(pressure-d.pressure),0,1);
  }
  if(advance&&s.year-d.since>=15&&d.pressure>0.78&&d.loyalty<0.4){
   const contested=P.warRate>0&&d.protection>0.4&&canProtectDependency(parent,o);
   endDependency(o,d.protection<0.4?'protection has failed':'tribute and authority are no longer accepted');
   if(contested)declareWar([parent],[o],`the Independence War of ${o.base}`,true,false,false);
   continue;
  }
  const revenue=o.domesticRevenue,administration=o.kind==='state'?0.28*Math.pow(o.cplx??0.2,S.tk[27][o.capital]>0.5?1.6:1.8)*o.pop:0;
  const due=revenue*0.12,capacity=Math.max(0,revenue-administration-militaryBudgetNeed(o));
  const willing=clamp((d.loyalty-0.15)/0.55,0,1)*(1-0.75*d.pressure)*d.protection;
  const paid=Math.min(due,capacity)*willing;d.due=due;d.paid=paid;d.withheld=due?1-paid/due:0;d.year=s.year;
  o.tributeOut=paid;parent.tributeIn+=paid;
  ledger.paid+=paid;ledger.received+=paid;ledger.withheld+=due-paid;ledger.transfers.push({from:id,to:parent.id,due,paid});
 }
 for(const id of s.alive)s.pols[id].tribs=0;for(const id of s.alive){const o=s.pols[id];if(o.over&&s.pols[o.over]?.alive)s.pols[o.over].tribs++}
 // No onward transfer of incoming tribute: every payer is capped by domestic receipts.
}
function canProtectDependency(parent,child){
 return parent.alive&&militaryProtectionReady(parent)&&(parent.fiscalStress||0)<0.8&&(parent.treas??0)>-1.8&&(parent.mandate??1)>0.2&&!parent.enemies.has(child.id);
}
function addDependencyProtection(war){
 // Join only defensive wars; a vassal cannot conscript its protector into aggression.
 for(const id of war.d.slice()){
  const child=S.pols[id],parent=S.pols[child.over];if(!parent?.alive||war.d.includes(parent.id)||war.a.includes(parent.id))continue;
  const compatible=war.a.every(k=>!S.pols[k].over||S.pols[k].over!==parent.id)&&war.d.every(k=>!parent.enemies.has(k));
  if(compatible&&canProtectDependency(parent,child))war.d.push(parent.id);
  else if(child.dependency)child.dependency.protection=Math.max(0,child.dependency.protection-0.2);
 }
}
function exceptionalGovernmentCrisis(o){
 return (o.shock>1.1&&(o.mandate??1)<0.25&&(o.fiscalStress||0)>0.7)||
  (o.enemies.size>0&&S.year-(o.capitalLostYear??-Infinity)<=5&&(o.control??1)<0.45&&(o.loyalty??1)<0.4);
}
function governmentRegionalStep(){
 const s=S,g=governmentScratch;if(calendarPhase(s.year,5)!==0||P.crisis<=0)return;
 let releases=0;
 for(const [id,candidate] of g.candidates){
  const o=s.pols[id];if(!o?.alive||o.kind!=='state'||s.year-(o.lastSeparation??o.born)<20||releases>=4)continue;
  const seed=candidate.cell;if(s.pol[seed]!==id)continue;
  const negotiated=s.autonomy[seed]>=0.55&&s.loyalty[seed]>=0.3;
  if(!negotiated&&!(s.loyalty[seed]<0.25&&s.control[seed]<0.3))continue;
  // A bounded contiguous periphery peels away; the capital and settled core remain.
  if(++g.stamp>=2147483647){g.visited.fill(0);g.stamp=1}const cells=[seed];g.visited[seed]=g.stamp;
  const limit=Math.min(256,Math.max(1,Math.floor(o.cells*0.2)));let population=0;
  for(let h=0;h<cells.length;h++){const i=cells[h];population+=s.pop[i];
   for(let d=0;d<4&&cells.length<limit;d++){const j=WD.nb[i*4+d];if(j<0||g.visited[j]===g.stamp||s.pol[j]!==id||j===o.capital||isDependentColony(j,id)||s.control[j]>0.5||s.autonomy[j]<0.3||s.year-s.taken[j]<25)continue;g.visited[j]=g.stamp;cells.push(j)}
  }
  if(population<FLOOR.chief*P.floor)continue;
  const nid=newPolity(seed,o,{origin:{type:negotiated?'autonomy':'rebellion',from:id,year:s.year}}),child=s.pols[nid];
  for(const i of cells){s.pol[i]=nid;s.taken[i]=s.year;s.governor[i]=nid;s.control[i]=Math.max(s.control[i],0.55);s.loyalty[i]=Math.max(s.loyalty[i],0.6);s.autonomy[i]*=0.5}
  child.cells=cells.length;child.pop=population;child.area=cells.reduce((n,i)=>n+WD.area[i],0);child.maxCells=child.cells;child.maxPop=population;child.peakArea=child.area;child.tier=tierOf(child);child.full=fullName(child);child.peak=child.full;
  o.cells=Math.max(1,o.cells-cells.length);o.pop=Math.max(0,o.pop-population);o.area=Math.max(0,o.area-child.area);o.lastSeparation=s.year;
  if(negotiated)setDependency(child,o);
  else if(P.warRate>0)declareWar([child],[o],`the Rebellion of ${child.base}`,cells.length>=10,true,false);
  chron('diplomacy',`The ${child.full} ${negotiated?'negotiates self-government under the '+o.full:'breaks away from the '+o.full} after years of weakening provincial rule.`,seed,[R_(child),R_(o)]);
  releases++;
 }
 if(releases)distBFS();
}
