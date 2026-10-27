"use strict";
// Urban residents remain a subset of province residents; institutions belong to places.
const CITY_LABEL_POP=3000;
function cityAt(i){const id=S.city[i];return id>=0?S.cities[id]:null}
function cityPopulation(c){return c?Math.min(S.pop[c.cell],c.population||0):0}
function cityPreservation(i){const c=cityAt(i);return c&&cityPopulation(c)>=300?clamp(c.institutions*c.scholarship,0,1):0}
function civilianHarvestLabor(i){
 const military=militaryLabor(i),o=S.pols[S.pol[i]],m=o?.military;
 const draft=m?.year===S.year?clamp(m.mobilized/Math.max(1,m.populationBasis),0,0.08):0;
 const urban=cityPopulation(cityAt(i))/Math.max(1,S.pop[i]);
 return Math.max(0.2,1-military-0.65*urban*(1-draft));
}
function newCityRecord(i,name,holy=false){
 const p=S.pop[i];return {name,cell:i,born:S.year,eth:S.eth[i],holy,population:Math.min(p*0.02,500),peak:Math.min(p*0.02,500),
  provincePopulation:p,lastYear:S.year,institutions:0,scholarship:0,knowledge:null,foodAccess:1,security:1,commerce:0,urbanTarget:0};
}
function urbanConditions(i){
 const s=S,owner=s.pols[s.pol[i]],o=owner?.alive?owner:null,live=networkEconomy.state===s&&networkEconomy.year===s.year,p=s.pop[i];
 const food=live?clamp(networkEconomy.food[i]/Math.max(1,p),0,1):clamp(s.K[i]/Math.max(1,p),0,1);
 const commerce=live?clamp(networkEconomy.income[i]/Math.max(1,p*0.04),0,1):clamp(s.car[i],0,1);
 const security=o?clamp(0.25+0.5*s.control[i]+0.25*s.loyalty[i]-0.15*(o.military?.exhaustion||0)-0.15*Math.min(1,o.shock||0),0,1):clamp(0.4+0.4*s.s[i],0,1);
 const works=worksQuality(i),capital=o?.capital===i?1:0,c=cityAt(i);
 const share=clamp(0.01+0.04*s.farm[i]+0.06*s.admin[i]+0.06*roadWorks(i)+0.04*s.paper[i]+0.09*commerce+0.04*capital+0.04*(c?.institutions||0),0,0.38);
 return {food,commerce,security,works,target:p*share*food*food*(0.25+0.75*security)*(0.4+0.6*works)};
}
function urbanTax(i,o=S.pols[S.pol[i]]){const c=cityAt(i);if(!c)return 0;const m=o?.military;return cityPopulation(c)*(1-(m?.mobilized||0)/Math.max(1,m?.populationBasis||1))*0.04*c.institutions}
function aggregateUrban(i,o){
 const c=cityAt(i);if(!c)return;const p=cityPopulation(c);o.cityPop+=p;o.civicPopulation+=p*c.institutions;o.scholarPopulation+=p*c.scholarship;
 const score=p*cityPreservation(i);if(score>(o.learningScore||0)){o.learningScore=score;o.learningCell=i}
}
function urbanAdministration(o){return Math.min(8,2*Math.log1p((o.civicPopulation||0)/10000))}
function innovationSite(o){const i=o.learningCell;return i!=null&&S.pol[i]===o.id&&cityPreservation(i)>0.02?i:o.capital}
function updateUrbanKnowledge(c,years){
 const s=S,i=c.cell,keep=cityPreservation(i);if(!c.knowledge&&keep>=0.02)c.knowledge=new Float32Array(TECH.length);
 if(!c.knowledge)return;
 for(let k=0;k<TECH.length;k++){
  const old=c.knowledge[k],live=s.tk[k][i];
  if(keep>0.02&&live>old)c.knowledge[k]+=Math.min(1,years*0.04*(0.2+c.scholarship))*(live-old);
  else c.knowledge[k]*=Math.max(0,1-years*(0.002+0.012*(1-keep)));
  if(s.pop[i]>=300&&keep>0.02&&s.firstTech[k]&&c.knowledge[k]>s.tk[k][i])s.tk[k][i]+=Math.min(0.15,years*0.04*keep)*(c.knowledge[k]-s.tk[k][i]);
 }
}
function urbanStep(){
 const s=S;if(s.urbanYear===s.year)return;s.urbanYear=s.year;
 const holy=new Map();for(const R of s.rels)if(R.alive){let list=holy.get(R.holy);if(!list)holy.set(R.holy,list=[]);list.push(R)}
 let discoveries=0;
 for(const c of s.cities){
  const i=c.cell,p=s.pop[i],years=clamp(s.year-c.lastYear,0,10);if(!years)continue;
  const env=urbanConditions(i),previous=c.provincePopulation;
  // Births, migration, disease and deaths affect towns before rural/urban relocation.
  c.population=Math.min(p,c.population*p/Math.max(1,previous));
  const rate=env.target<c.population?0.06:0.018;c.population=clamp(c.population+(env.target-c.population)*(1-Math.exp(-rate*years)),0,p);
  c.peak=Math.max(c.peak,c.population);c.provincePopulation=p;c.lastYear=s.year;c.foodAccess=env.food;c.security=env.security;c.commerce=env.commerce;c.urbanTarget=env.target;
  const owner=s.pols[s.pol[i]],o=owner?.alive?owner:null,b=o?.budget,funded=b?.administrationRequired?clamp(b.administration/b.administrationRequired,0,1):0.35+0.65*env.commerce;
  const density=clamp(c.population/5000,0,1),target=density*(0.3+0.7*s.admin[i])*env.food*env.security*env.works*(0.3+0.7*funded);
  c.institutions=clamp(c.institutions+(target-c.institutions)*(1-Math.exp(-(target<c.institutions?0.012:0.025)*years)),0,1);
  const learning=target*(0.2+0.5*s.admin[i]+0.3*s.paper[i]);c.scholarship=clamp(c.scholarship+(learning-c.scholarship)*(1-Math.exp(-(learning<c.scholarship?0.015:0.02)*years)),0,1);
  if(calendarPhase(s.year,5)===0)updateUrbanKnowledge(c,5);
  if(!o&&calendarPhase(s.year,5)===0&&c.scholarship>0.15&&discoveries<2&&P.invent>0){
   for(let k=6;k<TECH.length&&discoveries<2;k++){const t=TECH[k],em=t.em;if(!em||s.tk[k][i]>=0.5||c.population<em.pop*0.03||t.pre.some(q=>s.tk[q][i]<0.7)||(em.after&&WD.isEarth&&s.year<em.after)||(em.cells&&em.cells>1)||(em.coast&&!WD.coast[i])||(em.horse&&s.horse[i]<0.6)||(em.heavy&&WD.heavy[i]<=0.4))continue;
    if(s.r()<em.b*P.invent*5*(0.5+c.scholarship)){seedTech(s.tk[k],i,1,1);firstTech(k,i,null);discoveries++;break}
   }
  }
  if(c.holy&&P.faith>0)for(const R of holy.get(i)||[])changeFaith(i,R.id,0.008*years*(0.4+c.institutions)*(R.miss||0.2));
 }
}
function discoverUrbanSites(){
 for(const i of WD.landIdx){if(S.city[i]>=0||S.pop[i]<12000||S.farm[i]<0.5||S.settled[i]<80&&S.admin[i]<0.4)continue;
  const e=urbanConditions(i);if(e.target<1500||e.food<0.9||e.security<0.45)continue;
  const id=S.cities.length;S.city[i]=id;S.cities.push(newCityRecord(i,cityWord(langAt(i),S.r)));
 }
}
