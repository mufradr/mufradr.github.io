"use strict";
// Physical food flows use annual person-rations. K remains potential/effective
// support capacity, never an inventory. Only foodStock persists between years.
function worksQuality(i){return S.works?.[i]??1}
function roadWorks(i){return S.roads[i]*worksQuality(i)}
function canalWorks(i){return S.irrig[i]*worksQuality(i)}
function maintainWorks(i,years){
 const s=S,weight=clamp((s.roads[i]+0.8*s.irrig[i]+0.4*s.admin[i]*s.farm[i])/2.2,0,1);
 if(!weight)return;
 const owner=s.pol[i]?s.pols[s.pol[i]]:null;
 const funding=owner?.alive&&owner.kind==='state'?owner.infrastructureFunding??0.8:0.8*clamp(s.pop[i]/Math.max(1,WD.area[i]*4),0,1);
 const q=s.works[i],wear=0.003*years*weight*(1+0.5*WD.rough[i]);
 s.works[i]=clamp(q-wear+0.04*years*funding*(1-q),0.05,1);
}
function foodStorageCapacity(i,efficiency=cerealEff(i),quality=worksQuality(i)){
 const s=S;
 if(!s.farm[i]||s.pop[i]<=0)return 0;
 return s.pop[i]*s.farm[i]*(0.05+0.65*efficiency+0.35*s.admin[i])*quality;
}
function beginFoodYear(i,ledger){
 const s=S,n=networkEconomy,p=s.pop[i],opening=s.foodStock[i];
 if(!p&&!opening){n.production[i]=n.food[i]=n.available[i]=0;return false}
 const production=Math.min(s.K[i],p*civilianHarvestLabor(i)*(1.04+0.26*s.farm[i]+0.05*s.herd[i]));
 if(!s.farm[i]&&!opening){
  n.production[i]=n.food[i]=production;n.available[i]=s.herd[i]>=0.5?Math.max(0,production-p)*0.15:0;
  ledger.production+=production;ledger.demand+=p;ledger.unmet+=Math.max(0,p-production);return s.herd[i]>0;
 }
 const efficiency=cerealEff(i),quality=worksQuality(i),capacity=n.storageCapacity[i]=foodStorageCapacity(i,efficiency,quality);
 const spoiled=opening?opening*clamp(0.08+0.18*(1-efficiency)+0.04*WD.trop[i]-0.04*s.admin[i]*quality,0.03,0.35):0;
 let stored=opening-spoiled;const overflow=Math.max(0,stored-capacity);stored-=overflow;
 // A sparse population cannot harvest the full theoretical output of unused land.
 const released=Math.min(stored,Math.max(0,p-production));stored-=released;s.foodStock[i]=stored;
 n.production[i]=production;n.food[i]=production+released;s.K[i]+=released;
 n.available[i]=Math.max(0,production-p)*0.15*(Math.max(s.farm[i],s.herd[i])>=0.5?1:0);
 ledger.openingStock+=opening;ledger.production+=production;ledger.demand+=p;ledger.unmet+=Math.max(0,p-n.food[i]);ledger.spoilage+=spoiled;ledger.waste+=overflow;
 return true;
}
function finishFoodYear(i,ledger){
 const s=S,n=networkEconomy,p=s.pop[i],food=n.food[i];let surplus=Math.max(0,food-p);
 surplus-=campaignFood(i,surplus,ledger);
 if(!p&&!s.foodStock[i])return;
 if(!s.farm[i]&&!s.foodStock[i]){ledger.waste+=surplus;if(food<p)s.K[i]=Math.min(s.K[i],food);return}
 const deposited=Math.min(surplus,Math.max(0,n.storageCapacity[i]-s.foodStock[i]));
 s.foodStock[i]+=deposited;ledger.waste+=surplus-deposited;ledger.closingStock+=s.foodStock[i];
 // Food availability only constrains growth when it actually falls short. The
 // potential K of a lightly settled landscape is not reduced to its small harvest.
 if(food<p)s.K[i]=Math.min(s.K[i],food);
}
function governmentBudget(o,c,administration,domesticRevenue,maintenance){
 const tributeIn=o.tributeIn||0,tributeOut=o.tributeOut||0,revenue=domesticRevenue+tributeIn;
 const opening=o.treas,military=militaryBudgetNeed(o);
 const reserveDraw=Math.min(Math.max(0,opening)*revenue/0.04,revenue*0.2);
 const infrastructure=Math.min(maintenance,Math.max(0,revenue+reserveDraw-tributeOut-administration-military));
 // Mandatory costs may borrow against the existing bounded credit line. At its
 // limit unpaid costs remain explicit instead of disappearing into a clamp.
 const mandatory=administration+military,credit=Math.max(0,opening+2)*revenue/0.04;
 const paid=mandatory?Math.min(1,Math.max(0,revenue+credit-infrastructure-tributeOut)/mandatory):1;
 const administrationPaid=administration*paid,militaryPaid=military*paid;
 const spending=administrationPaid+militaryPaid+infrastructure+tributeOut,balance=revenue-spending;
 const closing=clamp(opening+0.04*balance/revenue,-2,1),retained=(closing-opening)*revenue/0.04;
 o.treas=closing;if(o.military?.year===S.year)o.military.funding=military?militaryPaid/military:1;
 o.infrastructureFunding=maintenance?infrastructure/maintenance:1;
 o.burden=(administration+military+maintenance+tributeOut)/revenue;
 o.budget={year:S.year,revenue,domesticRevenue,tributeIn,tributeOut,administrationRequired:administration,militaryRequired:military,administration:administrationPaid,military:militaryPaid,infrastructure,maintenanceRequired:maintenance,spending,balance,
  unpaid:mandatory*(1-paid),openingTreasury:opening,closingTreasury:closing,surplusDiscarded:Math.max(0,balance-retained),debtRelief:0};
 return o.budget;
}
