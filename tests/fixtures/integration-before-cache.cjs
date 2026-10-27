// Retained dev.4 hot loops for exact whole-world optimization regression.
module.exports={
computeK:function computeK(){
  const s=S,w=WD,L=w.landIdx,dT=s.dT+s.gT+epochTemp(),orb=s.orbM,maintain=s.worksYear!==s.year;
  if(maintain)s.worksYear=s.year;
  for(let k=0;k<L.length;k++){
    const i=L[k],T=w.T[i]+dT;
    if(maintain&&(s.roads[i]||s.irrig[i]||s.admin[i]*s.farm[i]))maintainWorks(i,1);
    const irrigation=canalWorks(i);
    if(T<-9){s.K[i]=1;continue}
    const wm=s.wm[i],mz=w.monZone[i],Pn=w.Pr[i]*wm+orb*mz*420,ar=w.area[i],rv=w.rv[i];
    const npp=Math.min(3000/(1+Math.exp(1.315-0.119*(T+w.amp[i]*0.15))),3000*(1-Math.exp(-0.000664*Pn)));
    const Kf=ar*0.1*npp/1000*(1+0.5*w.coast[i]+0.4*rv);
    const dry=clamp(wm,0.3,1.6);
    let sh=w.sH[i];if(mz>0)sh=Math.max(sh,orb*mz*0.7);if(w.desert[i])sh=Math.max(sh,0.25*s.camel[i]);
    const Kh=ar*1.6*sh*s.herd[i]*Math.min(1.3,dry)*(1+0.2*s.horse[i])*(1-s.rp[i]);
    const irr=irrigation*rv;
    const wf=1+(Math.min(dry,1.25)-1)*(1-0.75*irr);
    const T_=s.tk,hv=w.heavy[i],lc=w.leach[i];
    let Kfa=ar*3.5*Math.max(w.sF[i],0.7*w.rv[i]*irrigation)*s.farm[i]*s.fert[i]*wf*(1+0.8*s.metal[i]+0.9*s.iron[i]*(1-0.4*lc)+3.0*s.crops[i]+0.7*s.admin[i]+0.55*s.ard[i]*(1-0.6*hv)+0.7*s.plough[i]*hv+0.6*s.manure[i]+s.xcrops[i]*(0.25+0.8*lc+0.5*w.trop[i]+0.3*(1-w.sF[i]))+0.4*T_[26][i]*Math.max(lc,s.forest[i])+0.15*T_[28][i]*w.coast[i])*(1+rv*(0.25+2.2*irrigation));
    // Terraces, canals and managed fertility recover some highland valley yield.
    Kfa*=1+0.65*w.rough[i]*Math.max(irrigation,s.manure[i],s.admin[i]);
    Kfa*=(0.45+0.55*(1-s.forest[i]))*(1-0.6*s.salt[i])*(1-0.5*w.oncho[i]);
    if(w.T[i]<12)Kfa*=clamp(1+0.18*dT,0.4,1.35);
    // heavy, wet temperate forest soils: hard to clear and work until iron axes and ploughs
    if(hv>0)Kfa*=1-0.7*hv*(1-Math.max(s.plough[i],0.4*s.iron[i]));
    s.K[i]=Math.max(1,Kf,Kh+0.4*Kf,Kfa+0.3*Kh+0.2*Kf)*(1-0.5*w.mal[i]*(1-s.adapt[i])*(1-0.5*s.tk[29][i]));
  }
},
aggregatePoliticalCells:function aggregatePoliticalCells(phase,from,to){
  const {s,w,r,pols,L,pol,pop,sampleNow}=phase;
  for(let k=from;k<to;k++){const i=L[k],p=pol[i];if(!p)continue;const o=pols[p],pp=pop[i];linkMilitaryHome(i,o);const collection=provincialGovernment(i,o,phase.governmentAdvance??false);
    o.pop+=pp;o.K+=s.K[i];o.cells++;o.area+=w.area[i];o.sS+=s.s[i];const di=dd(i);o.dS+=di;let eD=0;if(pp>=1){o.n0+=pp*w.nT[i];o.n1+=pp*w.nM[i];o.n2+=pp*w.nN[i];o.n3+=pp*w.nD[i];o.nw+=pp;if(o.ni){eD=ecoD(i,o);if(eD>0.8)o.forP+=pp}}o.ad+=s.admin[i];o.ig+=s.integ[i];const pl=s.ard[i]>0.5&&!w.tsetse[i];o.tax+=pp>=1?pp*s.farm[i]*cerealEff(i)*Math.exp(-di/(o.h||6))*(0.5+0.5*s.integ[i])*(0.6+0.4*s.circE[i])*(pl?1.1:0.8)/(1+0.3*P.eco*eD)*collection:0;if(pl)o.plN++;if(w.heavy[i]>0.4)o.hvN++;if(isWaste(i,o.kind==="horde"))o.wasteN++;if(s.car[i]>0.3){const tl=1500*s.car[i];o.tax+=tl;o.trade+=tl}o.tax+=urbanTax(i)*collection;aggregateUrban(i,o);
    if(w.nomad[i])o.nom++;if(w.coast[i])o.coastN++;if(s.farm[i]>0.5&&w.sF[i]>0.25&&pp/w.area[i]>2)o.farmN++;if(s.fort[i]>0.5)o.fortN++;
    o.cx+=w.cosLon[i];o.cy+=w.sinLon[i];o.yy+=w.cyA[i];if(pp>o.mp){o.mp=pp;o.mc=i}
    if(sampleNow){if(o.sample.length<24)o.sample.push(i);else if(r()<24/o.cells)o.sample[(r()*24)|0]=i}}

},
updatePoliticalBorders:function updatePoliticalBorders(phase,from,to){
  const {s,w,r,y,pols,L,pol,pop,asR,wr,rev,rels,fz,infl}=phase;
  for(let kk=from;kk<to;kk++){
    const i=L[rev?L.length-1-kk:kk],p=pol[i],pi=pop[i],ei=s.eth[i],ri=s.rel[i];
    const o=p?pols[p]:null,horde=o&&o.kind==='horde';
    let fr=0,cand=-1,nc=0,candSea=false,threat=0,rcand=-1,rn=0;
    const cl=w.cosLat[i];
    for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j<0||!w.land[j])continue;const q=pol[j],wt=d<2?1:cl;
      if(q!==p){const ej=s.eth[j];
        if(ej>=0&&ei>=0&&ej!==ei&&ethDist(ei,ej)>0.22)fr=1;
        else if(ri>=0&&s.rel[j]>=0&&s.rel[j]!==ri)fr=1;
        if(o){noteMilitaryFrontier(o,j);if(q){const t=pols[q];o.nb.set(q,(o.nb.get(q)||0)+1);
            if(t.kind==='horde'||o.enemies.has(q))threat=1;
            if(o.enemies.has(q)||(horde&&t.kind==='horde')){nc+=3*wt;if(r()*nc<3*wt)cand=j}
            else if(horde&&t.kind==='state'){rn+=wt;if(r()*rn<wt)rcand=j}}
          else if(!horde||w.nomad[j]||w.desert[j]||pop[j]>=1){nc+=wt;if(r()*nc<wt)cand=j}}}}
    if(o&&w.coast[i]&&s.sail[i]>0.5){for(let q2=w.ls[i];q2<w.ls[i+1];q2++){const j=w.lt[q2];if(w.ld[q2]>3&&s.nav[i]<0.5)continue;const q=pol[j];if(q===p)continue;
      if(q){o.nb.set(q,(o.nb.get(q)||0)+1);if(o.enemies.has(q)){nc+=1;if(r()*nc<1){cand=j;candSea=true}}}
      else if(o.kind==='state'&&w.coast[j]&&s.pop[j]>=0.3&&r()<0.012*P.seafaring*(0.4+s.nav[i])&&r()*(nc+1)<1){nc+=1;cand=j;candSea=true}}}
    const overseas=phase.overseas?.get(i);
    if(o&&overseas&&s.ocean[i]>=0.6)for(const link of overseas){const q=pol[link.cell];if(q&&q!==p&&voyageRange(i)>=link.km){o.nb.set(q,(o.nb.get(q)||0)+0.35);if(o.enemies.has(q)){threat=1;const weight=0.35*P.seafaring;nc+=weight;if(weight>0&&r()*nc<weight){cand=link.cell;candSea=true}}}}
    let sv=s.s[i];
    if(o){const decay=interiorDecay(o);
      sv+=fr?asR*sv*(1-sv):-decay*sv;sv+=0.004*infl*(o.ruler.char-0.5);if(ri>=0&&ri===o.rel)sv+=0.0015*(0.5+rels[ri].cent);
      s.s[i]=clamp(sv,0.02,1);
      if(s.integ[i]<1){const fam=ei>=0&&s.eths[ei]&&s.eths[o.core]&&s.eths[ei].fam===s.eths[o.core].fam;s.integ[i]=Math.min(1,s.integ[i]+0.0011*s.control[i]*(1-0.5*s.autonomy[i])/(1+0.8*P.eco*ecoD(i,o))*(0.5+s.admin[i]+s.roads[i]+0.5*s.law[i])*(fam?1.5:0.6)*(ri>=0&&ri===o.rel?1.2:0.8)*(s.uni[i]>0.3&&s.eths[o.core]&&s.uniFam[i]===s.eths[o.core].fam?1.6:1))}
      if(cand>=0&&s.taken[i]!==y){const q=pol[cand];
        if(horde&&!q&&!w.nomad[cand]&&!w.desert[cand]&&pop[cand]>=1){if(r()<P.raid*0.02*o.aggrM*o.gate){raid(o,i,cand)}}
        else{const rate=q?wr*2*(1+3*s.circE[cand]):wr*(horde?1:Math.min(1,Math.max(0.1,pop[i]/w.area[i]/6))*(0.3+0.7*Math.min(1,o.press))*(1+2*s.gun[i]));if(r()<rate*o.aggrM*o.gate*expansionReadiness(o))attack(o,i,cand,candSea)}}
      if(horde&&rcand>=0&&r()<P.raid*0.025*o.aggrM*o.gate*(1-0.8*s.fort[rcand]))raid(o,i,rcand);
      const c=o.core;
      politicalCommunityChange(i,o);
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

},
techStep:function techStep(a0,b0){if(a0==null){a0=0;b0=1}
  const s=S,w=WD,L=w.landIdx,T=s.tk,kd=0.12*P.techDiff,loss=0.006*P.techLoss,r=s.r,rels=s.rels,pols=s.pols;
  const suit=[w.sF,w.sH,w.rv,null,w.sH];
  const known=TECH.map((t,k)=>s.firstTech[k]||k===5?1:0);
  const NT=T.length,pop=s.pop,pol=s.pol,INST=TECH.map((t,k)=>k===6||k===9||k===10||k===11||k===14);
  for(let kk=Math.floor(a0*L.length),ke=Math.floor(b0*L.length);kk<ke;kk++){
    const i=L[kk];if(s.pop[i]<1)continue;
    let conn=s.pop[i];const pi=s.pol[i],po=pi?pols[pi]:null;
    for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0)conn+=s.pop[j]}
    const rvb=(1+0.5*w.rv[i])*(1+0.3*s.paper[i]+0.2*roadWorks(i))*(1+0.25*cityPreservation(i));
    const ls0=w.ls[i],ls1=s.sail[i]>0.3?w.ls[i+1]:ls0;
    const preservation=cityPreservation(i),dark=po?po.cult<0.1:true;
    const ct=[1,1,1,1],pg=1+0.4*T[31][i];for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j<0)continue;ct[d]=Math.min(1,0.25+Math.sqrt(s.pop[i]*s.pop[j])/6000+s.car[i]+s.car[j])*pg}
    let nj0=-1,nj1=-1,nj2=-1,nj3=-1;{const b=i*4;let j=w.nb[b];if(j>=0&&pop[j]>=1)nj0=j;j=w.nb[b+1];if(j>=0&&pop[j]>=1)nj1=j;j=w.nb[b+2];if(j>=0&&pop[j]>=1)nj2=j;j=w.nb[b+3];if(j>=0&&pop[j]>=1)nj3=j}
    const clT=w.cosLat[i],lowC=conn<3000,noFarm=s.farm[i]<0.3&&s.herd[i]<0.3;
    for(let f=0;f<NT;f++){
      if(!known[f])continue;
      const A=T[f];let t=A[i];
      if(t<0.995){
        let m=0,same=0,mc=1,v;
        if(nj0>=0&&(v=A[nj0])>m){m=v;same=pi&&pol[nj0]===pi;mc=ct[0]}
        if(nj1>=0&&(v=A[nj1])>m){m=v;same=pi&&pol[nj1]===pi;mc=ct[1]}
        if(nj2>=0&&(v=A[nj2])>m){m=v;same=pi&&pol[nj2]===pi;mc=ct[2]*clT}
        if(nj3>=0&&(v=A[nj3])>m){m=v;same=pi&&pol[nj3]===pi;mc=ct[3]*clT}
        for(let q=ls0;q<ls1;q++){const j=w.lt[q];if(pop[j]<1)continue;v=A[j]*0.9;if(v>m){m=v;same=0;mc=0.7}}
        if(m>t){let k=kd*rvb*(same?1:0.6)*Math.min(1,mc);if(f>=3&&f!==5&&f!==18&&noFarm)k*=0.02;const sf=suit[f];if(sf)k*=0.2+sf[i];if(f===5&&!w.coast[i])k*=0.3;if(f===18)k*=0.2+(w.desert[i]||w.sH[i]>0.3?1:0);if(f===19)k*=0.05+0.95*(1-w.trop[i])*(1-w.leach[i]);else if(f===20)k*=w.tsetse[i]?0.03:0.3+0.7*(1-w.heavy[i]);else if(f===21)k*=0.1+w.heavy[i];else if(f===23)k*=0.3*(s.farm[i]>0.5?1:0.2);else if(f>=SYNTH0)k*=0.5;t+=k*(m-t)}
        if(INST[f]&&dark&&m<0.5)t*=1-(pi?0.006:0.015)*(1-0.9*preservation);
      }else if(INST[f]&&dark){// saturated cell: only decays if no neighbour still knows it
        let m=0;if(nj0>=0)m=Math.max(m,T[f][nj0]);if(nj1>=0)m=Math.max(m,T[f][nj1]);if(nj2>=0)m=Math.max(m,T[f][nj2]);if(nj3>=0)m=Math.max(m,T[f][nj3]);if(m<0.5)t*=1-(pi?0.006:0.015)*(1-0.9*preservation)}
      if(lowC&&t>0)t*=1-loss*(f===0?0.3:1)*(1-0.9*preservation);
      A[i]=t;
    }
    // Village-scale soil management predates states and draft animals. Without
    // this path highland farmers cannot grow the surplus needed to form a state.
    if(s.farm[i]>0.75&&s.manure[i]<0.5&&w.sF[i]>0.2&&conn>12000&&s.pop[i]/Math.max(1,s.K[i])>0.75&&r()<0.001*P.invent){
      seedTech(s.manure,i,1,1);firstTech(22,i,po);
    }
    if(!s.firstTech[2]||s.irrig[i]<0.5){if(s.farm[i]>0.8&&w.rv[i]>0.25&&w.Pr[i]<1000&&s.pop[i]/w.area[i]>4&&r()<0.0008*P.invent){seedTech(s.irrig,i,1,1);firstTech(2,i,po)}}
    religiousContact(i,ls0,ls1);
  }
}
};
