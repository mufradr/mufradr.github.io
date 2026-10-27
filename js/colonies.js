"use strict";
// Trade-supported overseas territories, settlement demographics and decolonization.
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
function addColonyMigrants(colony,amount,source=colony.source,maxShare=0.02){
  const s=S,i=source,j=colony.cell,old=s.pop[j];
  if(i===j||s.eth[i]<0)return 0;
  amount=Math.min(amount,s.pop[i]*maxShare);if(amount<=0)return 0;
  const people=s.eth[i],minor=s.eth2[j]>=0?old*s.mix[j]:0;
  if(s.eth[j]!==people&&s.eth2[j]>=0&&s.eth2[j]!==people&&s.mix[j]>=0.03)return 0;
  const sourceMinor=s.pop[i]*s.mix[i];s.pop[i]-=amount;
  if(s.eth2[i]>=0){s.mix[i]=sourceMinor/s.pop[i];if(s.mix[i]>0.5){const a=s.eth[i];s.eth[i]=s.eth2[i];s.eth2[i]=a;s.mix[i]=1-s.mix[i]}}
  s.pop[j]+=amount;if(people===colony.people||colonyDescendant(people,colony.founderPeople??colony.people))colony.settlers+=amount;
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
function colonyRoute(source,cell){
 for(const route of S.seaRoutes.values())if(route.from===source&&route.to===cell||route.to===source&&route.from===cell)return route;
 return null;
}
function colonySeaCost(km){return clamp(Math.ceil(km/800),6,30)}
function colonySupply(colony){
 const s=S,home=s.pols[colony.homeState],owner=s.pol[colony.cell]?s.pols[s.pol[colony.cell]]:null;
 if(P.seafaring<=0||!home?.alive||owner&&owner.id!==home.id&&(home.enemies.has(owner.id)||owner.enemies.has(home.id)))return -1;
 for(const route of s.seaRoutes.values()){
  const source=route.from===colony.cell?route.to:route.to===colony.cell?route.from:-1;
  if(source>=0&&s.pol[source]===home.id&&s.pop[source]>=1000&&s.ocean[source]>=0.5&&seaRouteTrading(route)&&voyageRange(source)>=route.km)return source;
 }
 return -1;
}
function overseasTransport(){
 const edges=new Map(),s=S;if(P.seafaring<=0)return edges;
 const add=(a,b,cost,km)=>{let list=edges.get(a);if(!list){list=[];edges.set(a,list)}list.push({cell:b,cost,km})};
 // Wartime charts remain useful for campaigning after commerce is interrupted.
 for(const route of s.seaRoutes.values())if(s.pol[route.from]&&s.pol[route.to]&&seaRouteViable(route)&&s.year-route.last<=50){
  const cost=colonySeaCost(route.km);add(route.from,route.to,cost,route.km);add(route.to,route.from,cost,route.km);
 }
 return edges;
}
function isDependentColony(cell,owner){const c=S.colonies.get(cell);return owner>0&&c?.status==='active'&&(c.administration==='dependent'||c.administration===undefined)&&c.homeState===owner}
function colonyAssimilation(colony,supplied){
 const s=S,j=colony.cell,pop=s.pop[j];
 if(colony.administration!=='dependent'||s.pol[j]!==colony.homeState||P.assim<=0||pop<1)return;
 const share=clamp(colony.settlers/pop,0,1),rate=0.003*P.assim*(0.3+s.admin[j])*(supplied?1:0.25)*share;
 if(s.eth2[j]>=0&&(s.eth[j]===colony.people||s.eth2[j]===colony.people)){
  const majority=s.eth[j]===colony.people,remaining=majority?s.mix[j]:1-s.mix[j],converted=Math.min(remaining,rate*remaining);
  s.mix[j]+=majority?-converted:converted;colony.settlers=Math.min(pop,colony.settlers+pop*converted);
  if(s.mix[j]>0.5){const old=s.eth[j];s.eth[j]=s.eth2[j];s.eth2[j]=old;s.mix[j]=1-s.mix[j]}
 }
}

// Connected overseas provinces act together; scan each parent's land only once
// per five years. Scratch labels/queues are not serialized into world saves.
let colonialScratch=null;
function colonyGovernmentStep(){
 const s=S,w=WD,candidates=[];
 for(const c of s.colonies.values()){
  if(c.status!=='active')continue;const owner=s.pol[c.cell],home=s.pols[c.homeState];
  if(!c.homeState&&c.administration==='dependent'){c.administration='unaffiliated';continue}
  if(owner===c.homeState&&home?.alive&&['enclave','occupied','independent'].includes(c.administration)){c.administration='dependent';c.autonomy=0.2;c.lastReintegration=s.year;c.governmentYear=s.year}
  if(c.administration!=='dependent')continue;
  if(owner!==c.homeState){
   c.administration=owner?(s.pols[owner].from===c.homeState?'independent':'occupied'):'unaffiliated';
   if(c.administration==='independent'){c.independentState=owner;c.independentYear=s.year}
   continue;
  }
  candidates.push(c);
 }
 if(!candidates.length)return;
 if(!colonialScratch)colonialScratch={labels:new Int32Array(N),queue:new Int32Array(N)};
 const {labels,queue}=colonialScratch;labels.fill(0);
 const parents=new Set(candidates.map(c=>c.homeState)),components=[null];
 for(const start of w.landIdx){const owner=s.pol[start];if(!parents.has(owner)||labels[start])continue;
  const id=components.length,g={owner,cells:[],population:0,colonies:[]};components.push(g);let h=0,t=0;queue[t++]=start;labels[start]=id;
  while(h<t){const i=queue[h++];g.cells.push(i);g.population+=s.pop[i];for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0&&w.land[j]&&!labels[j]&&s.pol[j]===owner){labels[j]=id;queue[t++]=j}}}
 }
 for(const c of candidates)components[labels[c.cell]]?.colonies.push(c);
 let released=false;
 for(const g of components){if(!g?.colonies.length)continue;
  const home=s.pols[g.owner],homeland=home?.alive?components[labels[home.capital]]:null;
  if(g===homeland){for(const c of g.colonies){c.administration='integrated';c.autonomy=0}continue}
  const roots=g.colonies.map(c=>c.founderPeople),related=new Map();let regionalCommunity=0;
  const belongs=people=>{if(people<0)return false;if(!related.has(people))related.set(people,roots.some(root=>colonyDescendant(people,root)));return related.get(people)};
  for(const i of g.cells){if(belongs(s.eth[i]))regionalCommunity+=s.pop[i]*(1-s.mix[i]);if(belongs(s.eth2[i]))regionalCommunity+=s.pop[i]*s.mix[i]}
  const homePop=Math.max(10000,homeland?.population||Math.max(0,(home?.pop||0)-g.population));
  const ratio=g.population/homePop;let pressure=0,settlers=0,age=Infinity,autonomy=0;
  for(const c of g.colonies){
   const elapsed=clamp(s.year-(c.governmentYear??s.year-5),0,10),supplied=colonySupply(c)>=0;
   c.governmentYear=s.year;c.isolationYears=supplied?0:(c.isolationYears||0)+elapsed;
   const distance=clamp(6371*angDist(c.source,c.cell)/8000,0,1),weakness=home?.alive?clamp((home.psi||0)/4+(1-(home.S??0.5))*0.4+0.35*(home.fiscalStress||0)+0.25*(1-(home.mandate??1)),0,1):1;
   const ties=clamp(P.assim*(supplied?1:0),0,1),target=clamp(0.2+0.35*distance+0.75*clamp(ratio/0.35,0,1)+0.35*clamp(c.isolationYears/30,0,1)+0.25*weakness-(supplied?0.2:0)-0.15*ties,0,1);
   c.autonomy=clamp(Math.max(s.governor[c.cell]===home?.id?s.autonomy[c.cell]:0,(c.autonomy||0)+(target-(c.autonomy||0))*Math.min(0.25,elapsed/40)),0,1);
   if(s.governor[c.cell]===home?.id)s.autonomy[c.cell]=c.autonomy;
   c.populationRatio=ratio;c.regionalPopulation=g.population;c.regionalCommunityPopulation=regionalCommunity;c.homelandPopulation=homePop;
   pressure+=c.autonomy;settlers+=c.settlers;age=Math.min(age,s.year-Math.max(c.founded,c.lastReintegration??-Infinity));
  }
  autonomy=pressure/g.colonies.length;settlers=Math.max(settlers,regionalCommunity);
  const orphan=!home?.alive;
  if((orphan&&age>=20&&g.population>=5000&&settlers>=500)||(age>=60&&g.population>=20000&&settlers>=2000&&ratio>=0.2&&autonomy>=0.72)){releaseColonialRegion(g,home,orphan);released=true}
  else if(orphan){for(const i of g.cells)s.pol[i]=0;for(const c of g.colonies)c.administration='unaffiliated';chron('fall','An overseas community loses its parent government and continues without a central state.',g.colonies[0].cell,[])}
 }
 if(released)distBFS();
}
function releaseColonialRegion(region,home,orphan){
 const s=S,leader=region.colonies.reduce((a,b)=>s.pop[a.cell]>=s.pop[b.cell]?a:b);
 // Decide from the departing province's allegiance before newPolity installs its capital.
 const negotiated=!orphan&&(s.governor[leader.cell]!==home.id||s.loyalty[leader.cell]>=0.4)&&(home.mandate??1)>=0.4;
 const id=newPolity(leader.cell,home,{origin:{type:'colony-independence',from:home?.id||0,people:leader.founderPeople,settlement:leader.name,year:leader.founded}}),state=s.pols[id];
 for(const i of region.cells){s.pol[i]=id;s.taken[i]=s.year;s.integ[i]=Math.max(s.integ[i],0.5)}
 if(home){home.pop=0;home.cells=0;home.area=0;for(const i of WD.landIdx)if(s.pol[i]===home.id){home.pop+=s.pop[i];home.cells++;home.area+=WD.area[i]}}
 s.dist[leader.cell]=0;state.cells=region.cells.length;state.pop=region.population;state.maxCells=state.cells;state.maxPop=state.pop;state.area=region.cells.reduce((n,i)=>n+WD.area[i],0);state.peakArea=state.area;state.tier=tierOf(state);state.full=fullName(state);state.peak=state.full;
 for(const c of region.colonies){c.administration='independent';c.independentState=id;c.independentYear=s.year;c.autonomy=1}
 const contested=!negotiated&&P.warRate>0&&!orphan&&home.S>0.4&&(home.psi||0)<2&&region.colonies.some(c=>colonySupply(c)>=0);
 chron('rise',`${state.full} becomes independent ${orphan?'after its parent government collapses':'as its overseas population and autonomy outgrow rule from the '+home.full}.`,leader.cell,[R_(state),...(home?[R_(home)]:[])]);
 if(contested){const war=declareWar([state],[home],`the Independence War of ${state.base}`,true,true,false);chron('war',`The ${home.full} contests the independence of the ${state.full}.`,leader.cell,[R_(home),R_(state),RW(war)])}
}
function colonyHostAllows(source,cell){
 const s=S,owner=s.pol[cell]?s.pols[s.pol[cell]]:null,home=s.pol[source]?s.pols[s.pol[source]]:null;
 if(!owner)return true;
 if(home&&owner.id===home.id)return false;
 if(home&&(home.enemies.has(owner.id)||owner.enemies.has(home.id)))return false;
 if(home&&(home.allies.includes(owner.id)||(home.truce.get(owner.id)||-Infinity)>s.year))return true;
 // Established peaceful trade can support a small enclave under the local government.
 const route=colonyRoute(source,cell);
 return !!(route&&s.year-(route.born??route.last)>=20&&s.year-route.last<=10&&owner.S>=0.35&&s.law[cell]>=0.3);
}
function tryColony(voyage){
  const s=S,w=WD,i=voyage.from,j=voyage.to;
  if(P.migration<=0||P.seafaring<=0||voyage.km<2000||voyage.km>voyageRange(i))return false;
  const home=s.pol[i]?s.pols[s.pol[i]]:null;if(!home?.alive)return false;
  if(!w.coast[i]||!w.coast[j]||s.pop[i]<8000||s.eth[i]<0||s.farm[i]<0.6||s.nav[i]<0.6||s.ocean[i]<0.6)return false;
  const route=colonyRoute(i,j);if(!route||s.year-(route.born??route.last)<5||s.year-route.last>10)return false;
  if(!colonyHostAllows(i,j)||w.sF[j]<0.15||w.T[j]<2||s.pop[j]/w.area[j]>12)return false;
  const previous=s.colonies.get(j);if(previous&&previous.status!=='failed')return false;
  // The two-people representation must not erase an existing substantial minority.
  if(s.eth[j]!==s.eth[i]&&s.eth2[j]>=0&&s.eth2[j]!==s.eth[i]&&s.mix[j]>=0.03)return false;
  const space=colonyCapacity(i,j)-s.pop[j];
  const settlers=Math.min(4000,s.pop[i]*0.04,space*0.2,s.pop[j]>=1&&s.eth[j]!==s.eth[i]?Math.max(300,s.pop[j]*0.15):Infinity);
  if(settlers<300||(s.pop[j]>=1&&settlers/(s.pop[j]+settlers)<0.04))return false;
  if(s.r()>=Math.min(0.45,0.18*P.seafaring))return false;
  return registerColony(voyage,settlers,false);
}
function tryColonyOutpost(voyage){
 const s=S,w=WD,i=voyage.from,j=voyage.to,home=s.pol[i]?s.pols[s.pol[i]]:null;
 if(P.migration<=0||P.seafaring<=0||!home?.alive||s.pop[j]>=1||s.pol[j]||voyage.km<2000||voyage.km>voyageRange(i)||!w.coast[i]||!w.coast[j]||s.pop[i]<8000||s.eth[i]<0||s.farm[i]<0.6||s.nav[i]<0.6||s.ocean[i]<0.6||w.sF[j]<0.15||w.T[j]<2)return false;
 const previous=s.colonies.get(j);if(previous&&previous.status!=='failed')return false;
 const amount=Math.min(500,s.pop[i]*0.02,Math.max(0,colonyCapacity(i,j)-s.pop[j])*0.05);
 return amount>=20&&registerColony(voyage,amount,true);
}
function registerColony(voyage,settlers,outpost){
 const s=S,w=WD,i=voyage.from,j=voyage.to,home=s.pols[s.pol[i]],previous=s.colonies.get(j);
  if(s.colonies.size>=128&&!previous){
    const abandoned=[...s.colonies].find(([,c])=>c.status==='failed');
    if(!abandoned)return false;s.colonies.delete(abandoned[0]);
  }
  const colony={name:placeWord(s.eths[s.eth[i]].lang,s.r),cell:j,source:i,people:s.eth[i],founderPeople:s.eth[i],homeState:s.pol[i],
    founded:s.year,settlers:s.eth[j]===s.eth[i]?s.pop[j]*(1-s.mix[j]):s.eth2[j]===s.eth[i]?s.pop[j]*s.mix[j]:0,lastPopulation:s.pop[j],status:'active',daughter:false,
    administration:s.pol[j]?'enclave':'dependent',outpost,autonomy:0,isolationYears:0,identityYears:0,governmentYear:s.year};
  if(addColonyMigrants(colony,settlers,i,0.04)<=0)return false;s.colonies.set(j,colony);s.lmFound[w.lm[j]]=1;
  if(colony.administration==='dependent'){s.pol[j]=home.id;s.taken[j]=s.year;s.dist[j]=Math.min(65534,(s.dist[i]<65535?s.dist[i]:0)+colonySeaCost(voyage.km));s.integ[j]=Math.max(s.integ[j],0.35)}
  const people=s.eths[colony.people];
  chron('migration',`Settlers of the ${people.name} found ${colony.name}, ${colony.administration==='dependent'?(outpost?'a dependent outpost of the ':'an overseas dependency of the ')+home.full:'a treaty settlement under the local government'}. They bring their language, farming, skills and faith.`,j,[RE(people),R_(home)]);
  spot(`An overseas community of the ${people.name} takes root`,j,[RE(people)]);
  return true;
}
function colonyStep(){
  const s=S;
  for(const colony of s.colonies.values()){
    if(colony.status==='failed')continue;
    const j=colony.cell,i=colony.source,pop=s.pop[j];
    // Continue legacy charters only on unclaimed land with a surviving parent
    // and working route. Existing sovereign states/foreign hosts keep ownership.
    if(colony.administration===undefined){
     const home=s.pols[colony.homeState];
     if(!s.pol[j]&&home?.alive&&colonySupply(colony)>=0){s.pol[j]=home.id;s.integ[j]=Math.max(s.integ[j],0.35);s.dist[j]=Math.min(65534,(s.dist[i]<65535?s.dist[i]:0)+colonySeaCost(6371*angDist(i,j)));s.taken[j]=s.year}
     const owner=s.pol[j]?s.pols[s.pol[j]]:null,former=owner?.origin?.type==='colony'&&owner.origin.settlement===colony.name;
     colony.administration=s.pol[j]===colony.homeState&&colony.homeState?'dependent':former?'independent':owner?'enclave':'unaffiliated';
     if(former){colony.independentState=owner.id;colony.independentYear=owner.born}
    }
    colony.autonomy??=0;colony.isolationYears??=0;colony.identityYears??=0;colony.governmentYear??=s.year;
    // Descendants share the site's real growth and mortality; never add births twice.
    colony.settlers=Math.min(pop,colony.settlers*pop/Math.max(1,colony.lastPopulation));
    const local=s.eth[j],minor=s.eth2[j];
    if(local!==colony.people&&colonyDescendant(local,colony.people)){colony.people=local;colony.daughter=true}
    else if(minor!==colony.people&&colonyDescendant(minor,colony.people)){colony.people=minor;colony.daughter=true}
    else if(colony.administration==='dependent'&&s.pol[j]===colony.homeState&&local===s.pols[colony.homeState]?.core&&P.assim>0)colony.people=local;
    const represented=local===colony.people?pop*(1-s.mix[j]):minor===colony.people?pop*s.mix[j]:0;
    colony.settlers=Math.min(colony.settlers,represented);
    if(pop<1||colony.settlers<20){
      colony.status='failed';colony.settlers=0;colony.lastPopulation=pop;
      chron('migration','An overseas settler community dwindles or merges into its neighbours; it no longer survives as a distinct community.',j,[RE(s.eths[colony.people])]);continue;
    }
    // Route and diplomatic checks are only needed in a resupply year.
    const owner=s.pol[j]?s.pols[s.pol[j]]:null,supply=colonySupply(colony);
    if(s.year-colony.founded>=5&&calendarPhase(s.year,5)===0&&P.migration>0&&supply>=0&&s.pop[supply]>=5000){
      const room=Math.max(0,colonyCapacity(supply,j)-s.pop[j]);
      if(!owner||owner.id===colony.homeState||colonyDescendant(owner.core,colony.founderPeople)||colonyHostAllows(supply,j)){
        addColonyMigrants(colony,Math.min(1200*P.migration,s.pop[supply]*0.015,room*0.15),supply);
      }
    }
    if(colony.outpost&&colony.settlers>=300&&supply>=0){const route=colonyRoute(supply,j);if(route&&s.year-(route.born??route.last)>=5){colony.outpost=false;chron('migration',`The overseas outpost of ${colony.name} becomes a permanent colony.`,j,[RE(s.eths[colony.people])])}}
    colonyAssimilation(colony,supply>=0);
    // After several generations a large local community can develop its own branch.
    colony.identityYears+=(0.4+0.6*clamp(6371*angDist(i,j)/8000,0,1))*(1-0.65*clamp(P.assim*(supply>=0?1:0),0,1));
    if(!colony.daughter&&colony.identityYears>=100&&colony.settlers>=2000&&s.eth[j]===colony.people){
      const parent=colony.people,child=newEth(parent);s.eth[j]=child;colony.people=child;colony.daughter=true;
      chron('people',`Across the sea, descendants of the ${s.eths[parent].name} develop a local identity as the ${s.eths[child].name}.`,j,[RE(s.eths[parent]),RE(s.eths[child])]);
    }
    colony.lastPopulation=s.pop[j];
  }
  if(calendarPhase(s.year,5)===0)colonyGovernmentStep();
}

// Small, two-way passenger movements accompany maintained ocean trade.
function maritimePassengerExchange(route){
 const s=S;if(P.migration<=0||P.seafaring<=0||s.year%20!==0||route.km<2000)return;
 for(const [i,j] of [[route.from,route.to],[route.to,route.from]]){
  if(s.pop[i]<5000||s.pop[j]<1||s.eth[i]<0||Math.max(s.ocean[i],s.ocean[j])<0.6||!(s.pol[i]&&s.pol[i]===s.pol[j])&&!colonyHostAllows(i,j))continue;
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
 if(P.migration<=0||P.seafaring<=0||s.pop[i]<8000||s.farm[i]<0.6||s.ocean[i]<0.6||s.nav[i]<0.6||route.km<2000)return null;
 const lon=c=>(WD.cxA[c]+0.5)/W*2*Math.PI-Math.PI,delta=lon(j)-lon(i);
 const bearing=route.bearing??Math.atan2(Math.sin(delta)*Math.cos(WD.lat[j]),Math.cos(WD.lat[i])*Math.sin(WD.lat[j])-Math.sin(WD.lat[i])*Math.cos(WD.lat[j])*Math.cos(delta));
 const voyage=traceVoyage(i,bearing+(s.r()-0.5)*0.16,voyageRange(i));
 if(!voyage||voyage.km<2000||angDist(voyage.to,j)>0.15)return null;
 seaContact(voyage);return voyage;
}
