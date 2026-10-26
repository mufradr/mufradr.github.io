// Reference implementations retained to verify exact simulation trajectories.
module.exports={
techStep:(function techStep(a0,b0){if(a0==null){a0=0;b0=1}
  const s=S,w=WD,L=w.landIdx,T=s.tk,kd=0.12*P.techDiff,loss=0.006*P.techLoss,r=s.r,rels=s.rels,pols=s.pols;
  const suit=[w.sF,w.sH,w.rv,null,w.sH];
  const known=TECH.map((t,k)=>s.firstTech[k]||k===5?1:0);
  const NT=T.length,pop=s.pop,pol=s.pol,INST=TECH.map((t,k)=>k===6||k===9||k===10||k===11||k===14);
  for(let kk=Math.floor(a0*L.length),ke=Math.floor(b0*L.length);kk<ke;kk++){
    const i=L[kk];if(s.pop[i]<1)continue;
    let conn=s.pop[i];const pi=s.pol[i],po=pi?pols[pi]:null;
    for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0)conn+=s.pop[j]}
    const rvb=(1+0.5*w.rv[i])*(1+0.3*s.paper[i]+0.2*s.roads[i]);
    const ls0=w.ls[i],ls1=s.sail[i]>0.3?w.ls[i+1]:ls0;
    const dark=po?po.cult<0.1:true;
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
        if(INST[f]&&dark&&m<0.5)t*=pi?0.994:0.985;
      }else if(INST[f]&&dark){// saturated cell: only decays if no neighbour still knows it
        let m=0;if(nj0>=0)m=Math.max(m,T[f][nj0]);if(nj1>=0)m=Math.max(m,T[f][nj1]);if(nj2>=0)m=Math.max(m,T[f][nj2]);if(nj3>=0)m=Math.max(m,T[f][nj3]);if(m<0.5)t*=pi?0.994:0.985}
      if(lowC&&t>0)t*=1-loss*(f===0?0.3:1);
      A[i]=t;
    }
    // Village-scale soil management predates states and draft animals. Without
    // this path highland farmers cannot grow the surplus needed to form a state.
    if(s.farm[i]>0.75&&s.manure[i]<0.5&&w.sF[i]>0.2&&conn>12000&&s.pop[i]/Math.max(1,s.K[i])>0.75&&r()<0.001*P.invent){
      seedTech(s.manure,i,1,1);firstTech(22,i,po);
    }
    if(!s.firstTech[2]||s.irrig[i]<0.5){if(s.farm[i]>0.8&&w.rv[i]>0.25&&w.Pr[i]<1000&&s.pop[i]/w.area[i]>4&&r()<0.0008*P.invent){seedTech(s.irrig,i,1,1);firstTech(2,i,po)}}
    const ri=s.rel[i];
    if(ri>=0){const R=rels[ri];
      let j=w.nb[i*4+((r()*4)|0)];
      if(ls1>ls0&&r()<0.2)j=w.lt[ls0+((r()*(ls1-ls0))|0)];
      if(j>=0&&s.pop[j]>=1&&s.rel[j]!==ri&&!(R.kind==='ethnic'&&s.eth[j]>=0&&s.eths[s.eth[j]].fam!==R.fam)){
        const qj=s.pol[j],sr=qj?pols[qj].rel:-1;
        let p=0.09*R.miss*P.faith*Math.min(1,0.15+Math.sqrt(s.pop[i]*s.pop[j])/15000+2*s.car[j])*(pi&&qj===pi?1.5:1)*(sr===ri?4:sr>=0?0.25:1)*(s.rel[j]<0?1.3:0.6)*(1+0.5*s.paper[i])*(0.7+0.6*R.cent)*(R.kind==='ethnic'&&s.eth[j]===s.eth[i]?2.5:1);
        if(r()<p)s.rel[j]=ri;
      }}
  }
}).toString(),
exitPass:(function exitPass(a0,b0){if(a0==null){a0=0;b0=1}
  const s=S,w=WD,LL=w.landIdx;
  for(let kk=Math.floor(a0*LL.length),ke=Math.floor(b0*LL.length);kk<ke;kk++){const i=LL[kk];if(s.pop[i]<1||w.sF[i]<0.1){s.circE[i]=w.circ[i];continue}
    const cx=w.cxA[i],cy=w.cyA[i];let tot=0,n=0;
    for(let dy=-3;dy<=3;dy++){const yy=cy+dy;if(yy<0||yy>=H)continue;for(let dx=-3;dx<=3;dx++){if(!dx&&!dy)continue;const j=yy*W+(cx+dx+W)%W;n++;if(!w.land[j])continue;
      const q=Math.max(w.sF[j],0.5*w.forest0[j]*(w.T[j]>10?1:0.3),0.4*w.sH[j]),pd=Math.max(0.3,7*q);tot+=q*Math.max(0,1-s.pop[j]/w.area[j]/pd)*(s.pol[j]?0.4:1)}}
    const ex=tot/n,own=w.sF[i]+0.1;s.exit[i]=ex;
    s.circE[i]=clamp(Math.max(w.circ[i],1-1.6*ex/own),0,1)}
}).toString()
};
