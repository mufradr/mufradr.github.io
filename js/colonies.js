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
  s.pop[i]-=amount;s.pop[j]+=amount;colony.settlers+=amount;
  if(old<1||s.eth[j]<0){s.eth[j]=people;s.eth2[j]=-1;s.mix[j]=0;s.rel[j]=s.rel[i];s.adapt[j]=s.adapt[i]}
  else if(s.eth[j]===people){s.mix[j]=minor/s.pop[j]}
  else{
    const existing=s.eth2[j]===people?minor:0;
    s.eth2[j]=people;s.mix[j]=(existing+amount)/s.pop[j];
    if(s.mix[j]>0.5){const local=s.eth[j];s.eth[j]=people;s.eth2[j]=local;s.mix[j]=1-s.mix[j]}
  }
  for(const field of s.tk)field[j]=Math.max(field[j],field[i]*0.85);
  s.s[j]=Math.max(s.s[j],0.4);colony.settlers=Math.min(colony.settlers,s.pop[j]);colony.lastPopulation=s.pop[j];
  const origin=s.colonies.get(i);if(origin&&origin!==colony){origin.settlers=Math.min(origin.settlers,s.pop[i]);origin.lastPopulation=s.pop[i]}
  return amount;
}
function tryIndependentColony(voyage){
  const s=S,w=WD,i=voyage.from,j=voyage.to;
  if((w.isEarth&&s.year<1300)||P.migration<=0||P.seafaring<=0||voyage.km<2000||voyage.km>voyageRange(i))return false;
  if(!w.coast[j]||s.pop[i]<20000||s.eth[i]<0||s.farm[i]<0.7||s.nav[i]<0.7||s.ocean[i]<0.7)return false;
  if(s.pol[j]||w.sF[j]<0.15||w.T[j]<2||s.pop[j]/w.area[j]>4)return false;
  const previous=s.colonies.get(j);if(previous&&previous.status!=='failed')return false;
  // The two-people representation must not erase an existing substantial minority.
  if(s.eth2[j]>=0&&s.eth2[j]!==s.eth[i]&&s.mix[j]>=0.03)return false;
  const space=colonyCapacity(i,j)-s.pop[j];
  const settlers=Math.min(1500,s.pop[i]*0.015,space*0.15,s.pop[j]>=1?s.pop[j]*0.2:Infinity);
  if(settlers<300||(s.pop[j]>=1&&settlers/(s.pop[j]+settlers)<0.04))return false;
  if(s.r()>=Math.min(0.3,0.08*P.seafaring))return false;
  if(s.colonies.size>=128&&!previous){
    const abandoned=[...s.colonies].find(([,c])=>c.status==='failed');
    if(!abandoned)return false;s.colonies.delete(abandoned[0]);
  }
  const colony={name:placeWord(s.eths[s.eth[i]].lang,s.r),cell:j,source:i,people:s.eth[i],founderPeople:s.eth[i],homeState:s.pol[i],
    founded:s.year,settlers:0,lastPopulation:s.pop[j],status:'active',daughter:false};
  addColonyMigrants(colony,settlers);s.colonies.set(j,colony);s.lmFound[w.lm[j]]=1;
  const people=s.eths[colony.people];
  chron('migration',`Settlers of the ${people.name} found the independent overseas community of ${colony.name}. They bring their farming, skills and faith, without extending the rule of their homeland.`,j,[RE(people)]);
  spot(`An independent colony of the ${people.name} takes root overseas`,j,[RE(people)]);
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
    const accepting=!owner||colonyDescendant(owner.core,colony.founderPeople);
    const route=[...s.seaRoutes.values()].some(r=>(r.from===i&&r.to===j)||(r.from===j&&r.to===i));
    if(s.year-colony.founded>=5&&calendarPhase(s.year,5)===0&&accepting&&route&&P.seafaring>0&&P.migration>0&&s.pop[i]>=20000&&s.ocean[i]>=0.7&&voyageRange(i)>=Math.max(2000,6371*angDist(i,j))){
      const room=Math.max(0,colonyCapacity(i,j)-pop);
      if((s.eth2[j]<0||s.eth2[j]===colony.people||s.eth[j]===colony.people||s.mix[j]<0.03)&&s.eth[i]>=0&&colonyDescendant(s.eth[i],colony.founderPeople)){
        addColonyMigrants(colony,Math.min(600*P.migration,s.pop[i]*0.01,room*0.1));
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
