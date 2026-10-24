"use strict";
// Independent settler communities, not overseas provinces of a sending state.
function colonyCapacity(source,cell){
  const s=S,w=WD;
  const farming=w.area[cell]*3.5*w.sF[cell]*s.farm[source]
    *(1+0.8*s.metal[source]+0.9*s.iron[source]+3*s.crops[source]+0.7*s.admin[source]+0.6*s.manure[source])
    *(0.45+0.55*(1-s.forest[cell]));
  return Math.max(s.K[cell],farming);
}
function colonyDescendant(people,ancestor){
  const seen=new Set(),pending=[people];
  while(pending.length&&seen.size<128){
    const id=pending.pop();if(id===ancestor)return true;if(id<0||seen.has(id))continue;
    seen.add(id);const e=S.eths[id];if(e){pending.push(e.parent);if(e.parent2!=null)pending.push(e.parent2)}
  }
  return false;
}
function addColonyMigrants(colony,amount){
  const s=S,i=colony.source,j=colony.cell,old=s.pop[j];
  amount=Math.min(amount,s.pop[i]*0.02);if(amount<=0)return 0;
  const people=colony.people,minor=s.eth2[j]>=0?old*s.mix[j]:0;
  const sourceMinor=s.pop[i]*s.mix[i];s.pop[i]-=amount;
  if(s.eth2[i]>=0){s.mix[i]=sourceMinor/s.pop[i];if(s.mix[i]>0.5){const a=s.eth[i];s.eth[i]=s.eth2[i];s.eth2[i]=a;s.mix[i]=1-s.mix[i]}}
  s.pop[j]+=amount;colony.settlers+=amount;
  if(old<1||s.eth[j]<0){s.eth[j]=people;s.eth2[j]=-1;s.mix[j]=0;s.rel[j]=s.rel[i];s.adapt[j]=s.adapt[i]}
  else if(s.eth[j]===people){s.mix[j]=minor/s.pop[j]}
  else{
    const existing=s.eth2[j]===people?minor:0;
    s.eth2[j]=people;s.mix[j]=(existing+amount)/s.pop[j];
    if(s.mix[j]>0.5){const local=s.eth[j];s.eth[j]=people;s.eth2[j]=local;s.mix[j]=1-s.mix[j]}
  }
  for(const field of s.tk)field[j]=Math.max(field[j],field[i]*0.85);
  s.s[j]=Math.max(s.s[j],0.4);colony.settlers=Math.min(colony.settlers,s.pop[j]);colony.lastPopulation=s.pop[j];
  const origin=s.colonies.get(i);if(origin&&origin!==colony){origin.settlers=Math.min(Math.max(0,origin.settlers-(origin.people===people?amount:0)),s.pop[i]);origin.lastPopulation=s.pop[i]}
  return amount;
}
function colonyHostAllows(source,cell){
 const s=S,owner=s.pol[cell]?s.pols[s.pol[cell]]:null,home=s.pol[source]?s.pols[s.pol[source]]:null;
 if(!owner)return true;
 if(home&&owner.id===home.id)return false;
 if(home&&(home.enemies.has(owner.id)||owner.enemies.has(home.id)))return false;
 if(home&&(home.allies.includes(owner.id)||(home.truce.get(owner.id)||-Infinity)>s.year))return true;
 // Established peaceful trade can support a small enclave under the local government.
 const route=[...s.seaRoutes.values()].find(r=>r.from===source&&r.to===cell||r.to===source&&r.from===cell);
 return !!(route&&s.year-(route.born??route.last)>=20&&s.year-route.last<=10&&owner.S>=0.35&&s.law[cell]>=0.3);
}
function tryIndependentColony(voyage){
  const s=S,w=WD,i=voyage.from,j=voyage.to;
  if((w.isEarth&&s.year<1300)||P.migration<=0||P.seafaring<=0||voyage.km<2000||voyage.km>voyageRange(i))return false;
  if(!w.coast[j]||s.pop[i]<20000||s.eth[i]<0||s.farm[i]<0.7||s.nav[i]<0.7||s.ocean[i]<0.7)return false;
  if(!colonyHostAllows(i,j)||w.sF[j]<0.15||w.T[j]<2||s.pop[j]/w.area[j]>12)return false;
  const previous=s.colonies.get(j);if(previous&&previous.status!=='failed')return false;
  // The two-people representation must not erase an existing substantial minority.
  if(s.eth[j]!==s.eth[i]&&s.eth2[j]>=0&&s.eth2[j]!==s.eth[i]&&s.mix[j]>=0.03)return false;
  const space=colonyCapacity(i,j)-s.pop[j];
  const settlers=Math.min(4000,s.pop[i]*0.02,space*0.2,s.pop[j]>=1&&s.eth[j]!==s.eth[i]?s.pop[j]*0.15:Infinity);
  if(settlers<300||(s.pop[j]>=1&&settlers/(s.pop[j]+settlers)<0.04))return false;
  if(s.r()>=Math.min(0.45,0.18*P.seafaring))return false;
  if(s.colonies.size>=128&&!previous){
    const abandoned=[...s.colonies].find(([,c])=>c.status==='failed');
    if(!abandoned)return false;s.colonies.delete(abandoned[0]);
  }
  const colony={name:placeWord(s.eths[s.eth[i]].lang,s.r),cell:j,source:i,people:s.eth[i],founderPeople:s.eth[i],homeState:s.pol[i],
    founded:s.year,settlers:s.eth[j]===s.eth[i]?s.pop[j]*(1-s.mix[j]):s.eth2[j]===s.eth[i]?s.pop[j]*s.mix[j]:0,lastPopulation:s.pop[j],status:'active',daughter:false};
  addColonyMigrants(colony,settlers);s.colonies.set(j,colony);s.lmFound[w.lm[j]]=1;
  const people=s.eths[colony.people];
  chron('migration',`Settlers of the ${people.name} found the overseas community of ${colony.name}. They bring their farming, skills and faith${s.pol[j]?", under the local government":", independently of their homeland"}.`,j,[RE(people)]);
  spot(`An overseas community of the ${people.name} takes root`,j,[RE(people)]);
  return true;
}
function colonyStep(){
  const s=S;
  for(const colony of s.colonies.values()){
    if(colony.status==='failed')continue;
    const j=colony.cell,i=colony.source,pop=s.pop[j];
    // Descendants share the site's real growth and mortality; never add births twice.
    colony.settlers=Math.min(pop,colony.settlers*pop/Math.max(1,colony.lastPopulation));
    const local=s.eth[j],minor=s.eth2[j];
    if(local!==colony.people&&colonyDescendant(local,colony.people)){colony.people=local;colony.daughter=true}
    else if(minor!==colony.people&&colonyDescendant(minor,colony.people)){colony.people=minor;colony.daughter=true}
    const represented=local===colony.people?pop*(1-s.mix[j]):minor===colony.people?pop*s.mix[j]:0;
    colony.settlers=Math.min(colony.settlers,represented);
    if(pop<1||colony.settlers<20){
      colony.status='failed';colony.settlers=0;colony.lastPopulation=pop;
      chron('migration','An overseas settler community dwindles or merges into its neighbours; it no longer survives as a distinct community.',j,[RE(s.eths[colony.people])]);continue;
    }
    const owner=s.pol[j]?s.pols[s.pol[j]]:null;
    const accepting=!owner||colonyDescendant(owner.core,colony.founderPeople)||colonyHostAllows(i,j);
    const route=[...s.seaRoutes.values()].some(r=>(r.from===i&&r.to===j)||(r.from===j&&r.to===i));
    if(s.year-colony.founded>=5&&calendarPhase(s.year,5)===0&&accepting&&route&&P.seafaring>0&&P.migration>0&&s.pop[i]>=20000&&s.ocean[i]>=0.7&&voyageRange(i)>=Math.max(2000,6371*angDist(i,j))){
      const room=Math.max(0,colonyCapacity(i,j)-pop);
      if((s.eth2[j]<0||s.eth2[j]===colony.people||s.eth[j]===colony.people||s.mix[j]<0.03)&&s.eth[i]>=0&&colonyDescendant(s.eth[i],colony.founderPeople)){
        addColonyMigrants(colony,Math.min(1200*P.migration,s.pop[i]*0.015,room*0.15));
      }
    }
    // After several generations a large local community can develop its own branch.
    if(!colony.daughter&&s.year-colony.founded>=80&&colony.settlers>=2000&&s.eth[j]===colony.people){
      const parent=colony.people,child=newEth(parent);s.eth[j]=child;colony.people=child;colony.daughter=true;
      chron('people',`Across the sea, descendants of the ${s.eths[parent].name} develop a local identity as the ${s.eths[child].name}.`,j,[RE(s.eths[parent]),RE(s.eths[child])]);
    }
    colony.lastPopulation=s.pop[j];
  }
}

// Small, two-way passenger movements accompany maintained ocean trade.
function maritimePassengerExchange(route){
 const s=S;if(P.migration<=0||P.seafaring<=0||s.year%20!==0||route.km<2000)return;
 if(WD.isEarth&&s.year<1300)return;
 for(const [i,j] of [[route.from,route.to],[route.to,route.from]]){
  if(s.pop[i]<20000||s.pop[j]<1||s.eth[i]<0||Math.max(s.ocean[i],s.ocean[j])<0.7||!colonyHostAllows(i,j))continue;
  const people=s.eth[i];if(s.eth2[j]>=0&&s.eth2[j]!==people&&s.eth[j]!==people&&s.mix[j]>0)continue;
  const room=Math.max(0,colonyCapacity(i,j)-s.pop[j]),amount=Math.min(300*P.migration,s.pop[i]*0.002,room*0.02);
  if(amount<5)continue;
  const community=s.colonies.get(j),temporary={source:i,cell:j,people,settlers:0,lastPopulation:s.pop[j]};
  const moved=addColonyMigrants(temporary,amount);
  if(community&&community.status==='active'){
   if(people===community.people)community.settlers+=moved;
   community.settlers=Math.min(community.settlers,s.pop[j]);community.lastPopulation=s.pop[j];
  }
  route.migrants=(route.migrants||0)+moved;
  if(s.eth2[j]===people){
   if(s.seaDiasporas.size>=256&&!s.seaDiasporas.has(j))s.seaDiasporas.delete(s.seaDiasporas.keys().next().value);
   s.seaDiasporas.set(j,{people,last:s.year});
  }
 }
}

// Prospect nearby landfalls along an already discovered ocean corridor.
function scoutColonyCoast(route){
 const s=S,i=route.from,j=route.to;
 if((WD.isEarth&&s.year<1300)||P.migration<=0||P.seafaring<=0||s.pop[i]<20000||s.farm[i]<0.7||s.ocean[i]<0.7||s.nav[i]<0.7||route.km<2000)return null;
 const lon=c=>(WD.cxA[c]+0.5)/W*2*Math.PI-Math.PI,delta=lon(j)-lon(i);
 const bearing=route.bearing??Math.atan2(Math.sin(delta)*Math.cos(WD.lat[j]),Math.cos(WD.lat[i])*Math.sin(WD.lat[j])-Math.sin(WD.lat[i])*Math.cos(WD.lat[j])*Math.cos(delta));
 const voyage=traceVoyage(i,bearing+(s.r()-0.5)*0.16,voyageRange(i));
 if(!voyage||voyage.km<2000||angDist(voyage.to,j)>0.15)return null;
 seaContact(voyage);return voyage;
}
