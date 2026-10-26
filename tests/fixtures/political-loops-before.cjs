// Political phase before extracting hot loops from the generator.
module.exports={politicsG:(function* politicsG(){
  const s=S,w=WD,r=s.r,y=s.year,pols=s.pols,L=w.landIdx,pol=s.pol,pop=s.pop;
  const sampleNow=y%10===0;
  for(const id of s.alive){const o=pols[id];o.pop=0;o.K=0;o.cells=0;o.area=0;o.sS=0;o.dS=0;o.ad=0;o.nom=0;o.cx=0;o.cy=0;o.yy=0;o.mp=-1;o.mc=-1;o.coastN=0;o.farmN=0;o.fortN=0;o.lmN=0;o.tax=0;o.ig=0;o.wasteN=0;o.plN=0;o.hvN=0;o.trade=0;o.n0=0;o.n1=0;o.n2=0;o.n3=0;o.nw=0;o.forP=0;if(sampleNow)o.sample=[]}
  for(let k=0;k<L.length;k++){if(k&&(k&2047)===0)yield;const i=L[k],p=pol[i];if(!p)continue;const o=pols[p],pp=pop[i];
    o.pop+=pp;o.K+=s.K[i];o.cells++;o.area+=w.area[i];o.sS+=s.s[i];const di=dd(i);o.dS+=di;let eD=0;if(pp>=1){o.n0+=pp*w.nT[i];o.n1+=pp*w.nM[i];o.n2+=pp*w.nN[i];o.n3+=pp*w.nD[i];o.nw+=pp;if(o.ni){eD=ecoD(i,o);if(eD>0.8)o.forP+=pp}}o.ad+=s.admin[i];o.ig+=s.integ[i];const pl=s.ard[i]>0.5&&!w.tsetse[i];o.tax+=pp>=1?pp*s.farm[i]*cerealEff(i)*Math.exp(-di/(o.h||6))*(0.5+0.5*s.integ[i])*(0.6+0.4*s.circE[i])*(pl?1.1:0.8)/(1+0.3*P.eco*eD):0;if(pl)o.plN++;if(w.heavy[i]>0.4)o.hvN++;if(isWaste(i,o.kind==="horde"))o.wasteN++;if(s.car[i]>0.3){const tl=1500*s.car[i];o.tax+=tl;o.trade+=tl}
    if(w.nomad[i])o.nom++;if(w.coast[i])o.coastN++;if(s.farm[i]>0.5&&w.sF[i]>0.25&&pp/w.area[i]>2)o.farmN++;if(s.fort[i]>0.5)o.fortN++;
    o.cx+=w.cosLon[i];o.cy+=w.sinLon[i];o.yy+=w.cyA[i];if(pp>o.mp){o.mp=pp;o.mc=i}
    if(sampleNow){if(o.sample.length<24)o.sample.push(i);else if(r()<24/o.cells)o.sample[(r()*24)|0]=i}}
  recordAtlasHistory();
  const next=[];
  for(const id of s.alive){const o=pols[id];
    if(o.cells===0){o.alive=false;o.died=y;
      for(const [q] of o.enemies){const p=pols[q];if(p)p.enemies.delete(id)}o.enemies.clear();
      for(const q of o.allies){const p=pols[q];if(p)p.allies=p.allies.filter(x=>x!==id)}
      if(o.ruler.fig!=null){const f=s.figs[o.ruler.fig];if(!f.died){f.died=y;deed(f,`Died as the ${o.full} fell`)}}
      const sc=new Map();for(const c of o.sample){const q=pol[c];if(q&&q!==id)sc.set(q,(sc.get(q)||0)+1)}
      o.succ=[...sc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
      if(o.maxCells>=40){s.fallen.push(o);if(s.fallen.length>60)s.fallen.shift();
        if(s.admin[o.capital]>0.6)s.darkWatch.push({y,id,cells:o.sample.slice()})}
      if(o.departed){}
      else if(o.maxCells>=25){const sn=o.succ.slice(0,3).map(k=>pols[k]).filter(Boolean);
        chron('fall',`The ${o.peak} is extinguished${o.lastBy&&pols[o.lastBy]?` by the ${pols[o.lastBy].full}`:''}. Founded ${fy(o.born)}, it held ${o.maxCells} provinces at its height.${sn.length?` Its lands pass to the ${sn.map(p=>p.full).join(', the ')}.`:''}`,o.capital,[['pol',id,o.peak],...(o.lastBy&&pols[o.lastBy]?[R_(pols[o.lastBy])]:[]),...sn.map(R_)])}
      continue}
    next.push(id);
    if(o.nw>0){const k=1/o.nw,nv=[o.n0*k,o.n1*k,o.n2*k,o.n3*k];o.ni=o.ni?o.ni.map((v,q)=>v*0.8+nv[q]*0.2):nv}o.forS=o.pop>0?o.forP/o.pop:0;
    o.S=o.sS/o.cells;o.integ=o.ig/o.cells;if(o.mandate==null)o.mandate=1;o.press=o.K>0?o.pop/o.K:1;o.md=o.dS/o.cells;o.adm=o.ad/o.cells;o.nomF=o.nom/o.cells;
    if(pol[o.capital]!==id&&o.mc>=0){o.capital=o.mc;if(s.eth[o.mc]>=0&&!o.conqDyn)o.core=s.eth[o.mc]}
    // nomads who come to rule farmland settle down
    if(o.kind==='horde'&&o.farmN>=Math.max(3,o.cells*0.3)){const old=o.full;o.kind='state';o.conqDyn=true;o.settledY=y;o.origin=Object.assign({},o.origin,{settled:y});o.tier=tierOf(o);o.full=fullName(o);
      if(o.cells>=8){chron('rise',`Masters now of settled farmland, the ${old} put down roots and rule as the ${o.full}.`,o.capital,[R_(o)]);spot(`Nomad conquerors settle as the ${o.full}`,o.capital,[R_(o)])}}
    o.tier=tierOf(o);o.full=fullName(o);
    if(o.cells>o.maxCells){o.maxCells=o.cells;o.peak=o.full}
    if(o.pop>o.maxPop)o.maxPop=o.pop;
    o.peakArea=Math.max(o.peakArea||0,o.area||0);
    o.lx=Math.atan2(o.cy,o.cx);o.ly=o.yy/o.cells;
    const c=o.capital;
    o.spc=clamp(0.9*Math.log10(Math.max(o.pop,1e3))-2.7+0.6*Math.log10(o.cells+1)+(o.tier==='Empire'||o.tier==='Khaganate'?1.6:o.tier==='Kingdom'||o.tier==='Khanate'?0.8:0)+s.admin[c]+0.8*s.law[c]+0.6*s.coin[c]+0.5*s.paper[c]+0.5*s.roads[c],0,10);
  }
  s.alive=next;
  // count island cells per state (needs this year's landmass of capital)
  for(let k=0;k<L.length;k++){const i=L[k],p=pol[i];if(p){const o=pols[p];if(w.lm[i]===w.lm[o.capital])o.lmN++}}
  yield;
  const infl=P.leaderInfl;
  // Successors created during this phase join next year, after aggregation.
  // Iterating the live array processed newborn states with missing totals.
  for(const id of next.slice()){const o=pols[id];if(!o.alive)continue;
    const R=o.ruler,c=o.capital;
    {const lm=w.lm[c],ls=w.lmSize[lm];
    o.island=ls>=4&&ls<=700&&s.lmPop[lm]>0&&o.lmN>=0.8*s.lmPop[lm];
    if(o.island&&s.isleBy[lm]!==id&&o.cells>=4){const first=!s.isleName[lm];if(first)s.isleName[lm]=placeWord(langAt(c),r);s.isleBy[lm]=id;
      if(ls>=10){chron('rise',`The ${o.full} unites the whole island of ${s.isleName[lm]}${first?'':' once more'}.`,c,[R_(o)]);const f=figFor(o,o.ruler,'ruler');deed(f,`Unified the island of ${s.isleName[lm]}`,[R_(o)])}}}
    if(y-R.birth>=R.death){succession(o);if(!o.alive||o.cells===0)continue}
    const Rn=o.ruler,comp=0.5+infl*(Rn.comp-0.5);
    o.aggrM=Math.max(0.12,1+infl*(4*Rn.aggr-2)*0.6);
    const a=s.anom[c];o.wet=o.wet*0.92+a*0.08;
    o.loot*=0.9;
    o.gate=clamp(0.5+1.1*(1-o.press)+(o.nomF>0.5||o.kind==='horde'?0.5:0.22)*a+Math.min(0.5,o.tribs*0.15)-(o.over?0.15:0)+Math.min(0.5,o.loot/(o.pop+1)*4)-Math.min(0.3,o.fortN*0.004),0.15,1.9);
    o.h=P.reach*(0.3+0.7*Math.min(1,1.5*s.admin[c]+s.roads[c]+0.6*riverAdministration(c)))*(1+0.8*s.admin[c]+0.5*s.law[c]+0.7*s.roads[c]+0.4*s.coin[c]+0.6*s.gun[c])*(0.7+0.6*comp)*(o.kind==='horde'?1.4:1)*(o.kind==='state'?0.75+0.5*Math.min(1.4,o.cplx||0.2):1)*(1+0.15*s.tk[24][c]+0.1*s.tk[31][c]);
    const Et=etOf(o);
    o.E=clamp(o.E+0.012*o.E*(1-o.press)*(0.8+0.4*comp)*(0.5+(o.ineq==null?0.5:o.ineq)),0.004,0.12);
    o.shock*=0.92;
    o.mandate=Math.min(1,o.mandate+0.006);
    statecraft(o,c,y);
    if(o.kind==='state'&&o.pop<FLOOR.chief*P.floor){o.lowY=o.lowY||y;if(y-o.lowY>25){if(o.maxCells>=8)chron('fall',`The ${o.full} dwindles below the numbers needed to sustain a ruler and his household; it dissolves back into villages and kin-groups.`,c,[R_(o)],'Too few people remained to feed a court, an army and their collectors.');for(const i of polCells(id))pol[i]=0;continue}}else o.lowY=0;
    const pP=Math.max(0,o.press-0.85)*3,pE=Math.max(0,o.E/Et-1.15)*1.1,pS=Math.max(0,0.42-o.S)*2.2,pX=Math.max(0,o.md/o.h-0.85)*(s.admin[c]<0.5?2.2:1.0),pR=Math.max(0,0.5-comp)*0.8,pI=Math.max(0,0.45-o.integ)*0.8,pM=Math.max(0,0.5-o.mandate)*1.2,pZ=o.kind==='state'?Math.max(0,o.cells/(170*(1+0.6*s.roads[c]+0.4*s.admin[c]+0.3*s.paper[c]))-1)*0.9:0;
    const pT=o.pT||0,pF=o.pF||0,pQ=o.pQ||0,pC=Math.max(0,(o.scl||0)-0.35)*1.7;const pN=o.kind==='state'?P.eco*0.8*Math.max(0,(o.forS||0)-0.35):0;o.why={pP,pE,pS,pX,pR,pI,pM,pZ,pN,pT,pF,pQ,pC,sh:o.shock};o.psi=pP+pE+pS+pX+pR+pI+pM+pZ+pT+pF+pQ+pN+pC+o.shock;
    const isl=o.island?0.4:1;
    if(o.kind==='state'&&o.cells>=40&&o.psi>2.2&&r()<P.crisis*0.008*(o.psi-2)*isl){o.shock+=0.4;if(o.cells>=80)chron('fall',`The ${o.full} shatters into rival kingdoms.`,o.capital,[R_(o)],'Driven by '+topCauses(o.why).join(' and ')+'.');civilWar(o,true)}
    else if(o.cells>=3&&r()<P.crisis*0.0035*o.psi*o.psi*isl)civilWar(o,(o.scl||0)>1.1&&o.cells>=10);
    else if(o.cells>=2&&o.S<(o.island?0.08:0.12)&&r()<0.02)collapse(o);
    {const cx=Math.min(1.5,o.cplx||0.2);o.scl=Math.max(0,(o.scl||0)+P.scl*0.0016*(0.4+(o.ineq==null?0.5:o.ineq))*(0.4+cx)*(1-0.6*Math.min(1,o.shock)))}
    if(y%10===0&&o.kind==='state'&&!o.restores&&o.cells>=12){for(const F of s.fallen){if(F.restoredBy||y-F.died>500||F.id===id||o.born<F.died-20)continue;
      const fe=s.eths[F.core],ce=s.eths[o.core];if(!fe||!ce||fe.fam!==ce.fam)continue;
      if(o.cells<0.6*F.maxCells||pol[F.capital]!==id)continue;
      F.restoredBy=id;o.restores=F.id;o.base=F.base;o.civ=F.civ||F.base;o.origin={type:'restoration',from:F.id,people:o.core};o.full=fullName(o);
      chron('rise',`Having won back the old heartland and grown as large as its predecessor, the ${o.full} claims the legacy of the fallen ${F.peak}.`,c,[R_(o),['pol',F.id,F.peak]]);break}}
    if(o.kind==='horde'&&o.cells<=2&&y-o.born>30&&r()<0.03){for(const i of polCells(id)){pol[i]=0}continue}
    culture(o);
    if(y%5===0){
      if(o.p5&&o.pop<0.8*o.p5&&o.wet<-0.3)o.mandate=Math.max(0,o.mandate-0.25);
      if(o.p5&&o.pop<0.8*o.p5&&o.cells>=15&&o.wet<-0.3&&y-o.famY>60){o.famY=y;o.shock+=0.5;
        chron('famine',`Years of drought bring famine to the ${o.full}; it loses ${Math.round((1-o.pop/o.p5)*100)}% of its people.`,c,[R_(o)])}
      o.p5=o.pop}
    // conquerors fade into the conquered
    if(o.conqDyn&&y%10===0){const ce=s.eth[c];if(ce>=0&&ce!==o.core){o.assimT+=10;if(o.assimT>=90){const old=s.eths[o.core],nw=s.eths[ce];o.core=ce;o.conqDyn=false;
        if(o.cells>=15)chron('people',`Four generations on, the ruling ${old.name} of the ${o.full} have become ${nw.name} in all but name.`,c,[R_(o),RE(old),RE(nw)])}}else o.assimT=0}
    // figures and milestones
    if(Rn.fig!=null){const f=s.figs[Rn.fig];f.conq=Rn.conq;if(o.cells>f.realm)f.realm=o.cells;f.title=`${cap(titleOf(o,Rn))} of the ${o.full}`}
    while(Rn.mi<4&&Rn.conq>=[25,50,100,200][Rn.mi]&&o.cells>=25){const m=[25,50,100,200][Rn.mi];Rn.mi++;
      const f=figFor(o,Rn,'ruler');f.conq=Rn.conq;
      const bits=[];if(Rn.exc==='aggr')bits.push('a ruler of uncommon ferocity');if(o.wet>0.35)bits.push(o.nomF>0.5||o.kind==='horde'?'with grass made rich by a run of wet years':'during a run of wet years');else if(o.wet<-0.35)bits.push('despite years of drought');
      deed(f,`Had conquered ${m} provinces for the ${o.full}${o.wet>0.35?' during a run of wet years':''}`,[R_(o)]);
      chron('rise',`${cap(rulerName(o))} of the ${o.full}${bits.length?', '+bits.join(', ')+',':''} has conquered ${m} provinces.`,c,[R_(o),RF(f)]);
      if(m>=50)spot(`${cap(rulerName(o))} has conquered ${m} provinces`,c,[RF(f),R_(o)])}
    if(!o.fK&&o.cells>=40){o.fK=1;
      const f=figFor(o,o.founderR,'founder');if(!f.deeds.some(d=>d[1].startsWith('Founded')))deed(f,`Founded the ${o.base} state`,[R_(o)]);
      chron('rise',`The ${o.full} rises under ${rulerName(o)}.`,c,[R_(o)])}
    if(!o.fE&&o.cells>=100){o.fE=1;const f=figFor(o,Rn,'ruler');deed(f,`Ruled the ${o.full} at ${o.cells} provinces`,[R_(o)]);
      chron('rise',`The ${o.base} realm grows to ${o.cells} provinces under ${rulerName(o)}.`,c,[R_(o),RF(f)]);spot(`The ${o.full} reaches ${o.cells} provinces`,c,[R_(o)])}
    // invention, tied to cultural vigour
    if(o.kind==='state')for(let k=6;k<TECH.length;k++){
      const chance=inventionChance(o,k);if(!chance)continue;
      if(r()<chance){
        seedTech(s.tk[k],c,1,1);if(k===6)for(const i of L)if(pol[i]===id)s.admin[i]=Math.max(s.admin[i],0.35);
        firstTech(k,c,o)}}
    // faith
    const cr=s.rel[c];
    if(cr>=0&&cr!==o.rel&&r()<0.04){o.rel=cr;const Rl=s.rels[cr];if(!Rl.states.includes(id))Rl.states.push(id);
      if(o.cells>=30){const f=figFor(o,Rn,'ruler');deed(f,`Made ${Rl.name} the faith of the realm`,[RR(Rl)]);
        chron('faith',`${cap(rulerName(o))} makes ${Rl.name} the faith of the ${o.full}.`,c,[R_(o),RR(Rl),RF(f)])}}
    if(o.kind==='state'&&o.cells>=4&&r()<P.faith*((o.shock>0.25||o.why.pS>0.2)?0.0004:0.00012)*(s.admin[c]>0.5?1:0.6)*(o.rel>=0?0.5:1.5))foundReligion(o);
    // nomads on the move
    if(o.kind==='horde'&&o.cells>=6&&o.pop>50000&&s.activeMigs.length<10&&((o.wet<-0.4&&o.press>0.75&&r()<0.02*P.wander)||(o.S>0.55&&Rn.aggr>0.7&&r()<0.006*P.wander))){hordeMigration(o)}
    // war
    if(o.cells>=2&&o.enemies.size<3&&r()<P.warRate*0.02*o.aggrM*o.gate){
      let best=0,bw=0,holy=false;const po=power(o),Rl=o.rel>=0?s.rels[o.rel]:null,hp=Rl?pol[Rl.holy]:0;
      for(const [q,b] of o.nb){const t=pols[q];if(!t||!t.alive||o.enemies.has(q)||o.allies.includes(q)||o.over===q||t.over===id||(o.truce.get(q)||-1e9)>y)continue;
        let wt=b*Math.pow(po/(power(t)+1),1.5);
        if(Rl&&t.rel!==o.rel&&t.rel>=0)wt*=1+0.4*P.zeal*Rn.piety;
        const isHoly=Rl&&q===hp&&t.rel!==o.rel&&Rn.piety>0.6;if(isHoly)wt*=1+4*P.zeal;
        bw+=wt;if(wt>0&&r()*bw<wt){best=q;holy=isHoly}}
      if(best){const t=pols[best];const war=declareWar([o],[t],holy?`the Holy War for ${holyName(Rl)}`:null,holy,false,holy);
        const tot=war.a.concat(war.d).reduce((sm,k)=>sm+pols[k].cells,0);
        if(holy||tot>=150||(o.cells>=30&&t.cells>=30)){war.notable=true;
          const al=war.a.slice(1).map(k=>pols[k].base),dl=war.d.slice(1).map(k=>pols[k].base);
          chron('war',`${holy?'Holy war':'War'}: the ${o.full} attacks the ${t.full}${holy?` to win back ${holyName(Rl)}`:''}${al.length?`, joined by ${al.join(' and ')}`:''}${dl.length?`; ${dl.join(' and ')} ${dl.length>1?'come':'comes'} to the defence`:''}.`,t.capital,[R_(o),R_(t),RW(war)])}}}
  }
  // active wars
  const still=[];
  for(const wid of s.activeWars){const war=s.wars[wid];
    const aAlive=war.a.some(k=>pols[k].alive),dAlive=war.d.some(k=>pols[k].alive),yrs=y-war.start;
    const fresh=y-(war.lastGain||war.start);
    if(!aAlive||!dAlive||r()<0.02+(fresh>8?0.08:0)+(yrs>40?0.1:0)){endWar(war);continue}
    still.push(wid)}
  s.activeWars=still;
  if(y%5===0)diplomacy();
  yield;
  // border pass
  for(const id of s.alive)pols[id].nb=new Map();
  const asR=P.asabR,wr=P.warRate*0.03,rev=y&1,rels=s.rels,fz=P.fortify;
  for(let kk=0;kk<L.length;kk++){
    // Let input/painting run between bounded groups without reordering updates.
    if(kk&&(kk&1023)===0)yield;
    const i=L[rev?L.length-1-kk:kk],p=pol[i],pi=pop[i],ei=s.eth[i],ri=s.rel[i];
    const o=p?pols[p]:null,horde=o&&o.kind==='horde';
    let fr=0,cand=-1,nc=0,candSea=false,threat=0,rcand=-1,rn=0;
    const cl=w.cosLat[i];
    for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j<0||!w.land[j])continue;const q=pol[j],wt=d<2?1:cl;
      if(q!==p){const ej=s.eth[j];
        if(ej>=0&&ei>=0&&ej!==ei&&ethDist(ei,ej)>0.22)fr=1;
        else if(ri>=0&&s.rel[j]>=0&&s.rel[j]!==ri)fr=1;
        if(o){if(q){const t=pols[q];o.nb.set(q,(o.nb.get(q)||0)+1);
            if(t.kind==='horde'||o.enemies.has(q))threat=1;
            if(o.enemies.has(q)||(horde&&t.kind==='horde')){nc+=3*wt;if(r()*nc<3*wt)cand=j}
            else if(horde&&t.kind==='state'){rn+=wt;if(r()*rn<wt)rcand=j}}
          else if(!horde||w.nomad[j]||w.desert[j]||pop[j]>=1){nc+=wt;if(r()*nc<wt)cand=j}}}}
    if(o&&w.coast[i]&&s.sail[i]>0.5){for(let q2=w.ls[i];q2<w.ls[i+1];q2++){const j=w.lt[q2];if(w.ld[q2]>3&&s.nav[i]<0.5)continue;const q=pol[j];if(q===p)continue;
      if(q){o.nb.set(q,(o.nb.get(q)||0)+1);if(o.enemies.has(q)){nc+=1;if(r()*nc<1){cand=j;candSea=true}}}
      else if(o.kind==='state'&&w.coast[j]&&s.pop[j]>=0.3&&r()<0.012*P.seafaring*(0.4+s.nav[i])&&r()*(nc+1)<1){nc+=1;cand=j;candSea=true}}}
    let sv=s.s[i];
    if(o){const decay=interiorDecay(o);
      sv+=fr?asR*sv*(1-sv):-decay*sv;sv+=0.004*infl*(o.ruler.char-0.5);if(ri>=0&&ri===o.rel)sv+=0.0015*(0.5+rels[ri].cent);
      s.s[i]=clamp(sv,0.02,1);
      if(s.integ[i]<1){const fam=ei>=0&&s.eths[ei]&&s.eths[o.core]&&s.eths[ei].fam===s.eths[o.core].fam;s.integ[i]=Math.min(1,s.integ[i]+0.0011/(1+0.8*P.eco*ecoD(i,o))*(0.5+s.admin[i]+s.roads[i]+0.5*s.law[i])*(fam?1.5:0.6)*(ri>=0&&ri===o.rel?1.2:0.8)*(s.uni[i]>0.3&&s.eths[o.core]&&s.uniFam[i]===s.eths[o.core].fam?1.6:1))}
      if(cand>=0&&s.taken[i]!==y){const q=pol[cand];
        if(horde&&!q&&!w.nomad[cand]&&!w.desert[cand]&&pop[cand]>=1){if(r()<P.raid*0.02*o.aggrM*o.gate){const t0=pop[cand]*0.03;pop[cand]-=t0;o.loot+=t0*0.5;displace(cand,0.02,o.id)}}
        else{const rate=q?wr*2*(1+3*s.circE[cand]):wr*(horde?1:Math.min(1,Math.max(0.1,pop[i]/w.area[i]/6))*(0.3+0.7*Math.min(1,o.press))*(1+2*s.gun[i]));if(r()<rate*o.aggrM*o.gate*expansionReadiness(o))attack(o,i,cand,candSea)}}
      if(horde&&rcand>=0&&r()<P.raid*0.025*o.aggrM*o.gate*(1-0.8*s.fort[rcand]))raid(o,i,rcand);
      const c=o.core;
      if(ei>=0&&c>=0&&ei!==c&&pi>=1&&!o.conqDyn&&r()<P.assim*0.004*o.S*(1-0.8*ethDist(ei,c))*(ri>=0&&ri===o.rel?1.5:1))s.eth[i]=c;
      if(o.conqDyn&&ei!==c&&pi>=1)mixIn(i,c,0.0006);
      if(o.rel>=0&&ri!==o.rel&&pi>=1){const Rl=rels[o.rel];if(!(Rl.kind==='ethnic'&&ei>=0&&s.eths[ei].fam!==Rl.fam)&&r()<0.003*P.faith*o.S*(Rl.miss+0.3)*(0.7+0.6*Rl.cent))s.rel[i]=o.rel}
      // fortify threatened frontiers if the state is cohesive and can pay
      if(threat&&!horde&&o.S>0.45&&o.gate>0.7&&s.admin[o.capital]>0.3&&s.fort[i]<1)s.fort[i]=Math.min(1,s.fort[i]+0.006*fz*(1+s.roads[i]));
    }else{
      sv+=fr?asR*0.6*sv*(1-sv):(0.3-sv)*0.02;s.s[i]=clamp(sv,0.02,1);
      if(pi>=1){const dens=pi/w.area[i],past=s.herd[i]*Math.max(w.sH[i],w.desert[i]*s.camel[i]*0.6);
        const founding=stateFormationChance(i);
        if(founding>0){
          if(r()<founding){
            const id=newPolity(i,null);
            for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0&&w.land[j]&&!pol[j]&&s.eth[j]===ei&&pop[j]>=1&&r()<0.5){pol[j]=id;s.dist[j]=2}}}}
        else if(past>0.3&&dens>0.5&&(w.nomad[i]||w.desert[i])&&fr){
          if(r()<P.nomad*0.0003*(0.4+s.s[i])*(0.5+s.horse[i]+s.camel[i])){
            const id=newPolity(i,null,{kind:'horde'});
            for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0&&w.land[j]&&!pol[j]&&(w.nomad[j]||w.desert[j])&&pop[j]>=1&&r()<0.6){pol[j]=id;s.dist[j]=2}}}}
      }
    }
    if(s.fort[i]>0){const keep=o&&!horde&&o.S>0.3&&o.press<1;s.fort[i]=keep?s.fort[i]*0.9995:s.fort[i]*0.99;if(s.fort[i]<0.01)s.fort[i]=0}
  }
  // first great walls
  for(const id of s.alive){const o=pols[id];if(o.fortN>=8&&!o.wallLogged&&o.cells>=20){o.wallLogged=1;chron('culture',`The ${o.full} begins to fortify its frontier with a great line of walls and forts.`,o.capital,[R_(o)]);spot(`The ${o.full} builds a great wall`,o.capital,[R_(o)])}}
  for(const id of s.activeMigs.slice())migStep(s.migs[id]);
  if(y%5===0){yield;distBFS();yield;
    for(const i of w.landIdx){const p=s.pol[i];const ob=p?s.pols[p]:null;
      if(ob&&ob.kind==='state'&&ob.cells>=60&&s.integ[i]>0.55&&s.pop[i]>=1&&s.eths[ob.core]&&ecoD(i,ob)<0.6){const f=s.eths[ob.core].fam;if(s.uniFam[i]!==f){if(s.uni[i]<0.15){s.uniFam[i]=f;s.uni[i]=0}else{s.uni[i]*=0.985;continue}}s.uni[i]+=0.0035*(1-s.uni[i])}
      else s.uni[i]*=0.9975}
    if(y%10===0){yield;exitPass(0,0.25);yield;exitPass(0.25,0.5);yield;exitPass(0.5,0.75);yield;exitPass(0.75,1);yield}
    for(const i of w.landIdx){const p=s.pol[i];if(!p)continue;const o=s.pols[p];if(o.kind!=='state'||i===o.capital)continue;const ce=cerealEff(i);
      if(isWaste(i)){let rim=0;for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0&&s.pol[j]===p&&!isWaste(j))rim++}
        const keep=rim>0||s.fort[i]>0.3||s.car[i]>0.3||(dd(i)<0.35*o.h&&o.S>0.4&&(o.burden||0)<1.1);if(!keep&&r()<0.3){s.pol[i]=0;continue}}
      if(ce<0.35&&r()<0.15*(1-ce/0.35)*(1.2-0.5*s.integ[i]))s.pol[i]=0}}
})};

module.exports.stateFormationChance=(function stateFormationChance(i){
  // Mountain cells include large uninhabitable slopes: villages concentrate in valleys.
  const s=S,w=WD,settledArea=w.area[i]*Math.max(0.35,1-0.65*w.rough[i]),dens=s.pop[i]/settledArea,crop=cerealEff(i);
  const agr=s.farm[i]*Math.max(w.sF[i],0.7*w.rv[i]*s.irrig[i]);
  if((s.settled[i]<600&&s.admin[i]<0.7)||agr<=0.35||dens<=2||w.nomad[i]||localPop(i)<FLOOR.chief*3*P.floor)return 0;
  const communal=0.35*s.farm[i]*crop*(0.4+0.6*s.circE[i]);
  const organization=Math.max(communal,(s.irrig[i]+0.1*w.rv[i])*clamp(1-(w.Pr[i]-300)/700,0.2,1),0.5*s.metal[i],s.iron[i],0.8*s.admin[i]);
  const maturity=Math.max(clamp((s.settled[i]-500)/1500,0,1),s.admin[i]>=0.7?s.admin[i]:0);
  const settlement=clamp((dens-1.5)/4,0,1);
  return maturity*settlement*P.formRate*0.0012*(0.2+1.6*P.circ*s.circE[i])*(0.4+s.s[i])*(1+Math.min(2,dens/15))
    *Math.min(1,0.05+communal+s.metal[i]+s.admin[i]+s.horse[i]*0.5+Math.min(0.4,Math.max(0,dens-5)/25)+0.15*Math.max(0,s.circE[i]-0.5))
    *(0.003+0.997*crop*crop)*Math.pow(0.05+0.95*organization,1.7)
    *Math.max(clamp((dens-2)/6,0,1),s.admin[i],riverAdministration(i));
});
