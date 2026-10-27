"use strict";
// Two represented peoples and three faiths per province; -1 is folk faith, -2 no minority.
function faithShare(i,id){return S.rel[i]===id?1-S.faithMix[i]-S.faithMix3[i]:S.faith2[i]===id?S.faithMix[i]:S.faith3[i]===id?S.faithMix3[i]:0}
function peopleShare(i,id){return S.eth[i]===id?1-S.mix[i]:S.eth2[i]===id?S.mix[i]:0}
function normalizeCommunity(i,faith=false){
 if(faith){const s=S;
  if(s.faith2[i]===s.rel[i]||s.faithMix[i]<=1e-7){s.faith2[i]=-2;s.faithMix[i]=0}
  if(s.faith3[i]===s.rel[i]||s.faithMix3[i]<=1e-7){s.faith3[i]=-2;s.faithMix3[i]=0}
  if(s.faith3[i]===s.faith2[i]){s.faithMix[i]+=s.faithMix3[i];s.faith3[i]=-2;s.faithMix3[i]=0}
  if(s.faithMix[i]>1-s.faithMix[i]-s.faithMix3[i]){const a=s.rel[i],share=1-s.faithMix[i]-s.faithMix3[i];s.rel[i]=s.faith2[i];s.faith2[i]=a;s.faithMix[i]=share}
  if(s.faithMix3[i]>1-s.faithMix[i]-s.faithMix3[i]){const a=s.rel[i],share=1-s.faithMix[i]-s.faithMix3[i];s.rel[i]=s.faith3[i];s.faith3[i]=a;s.faithMix3[i]=share}
  if(s.faithMix3[i]>s.faithMix[i]){const a=s.faith2[i],share=s.faithMix[i];s.faith2[i]=s.faith3[i];s.faithMix[i]=s.faithMix3[i];s.faith3[i]=a;s.faithMix3[i]=share}return;
 }
 if(S.eth2[i]<0||S.eth2[i]===S.eth[i]||S.mix[i]<=1e-7){S.eth2[i]=-1;S.mix[i]=0;return}
 if(S.mix[i]>0.5){const a=S.eth[i];S.eth[i]=S.eth2[i];S.eth2[i]=a;S.mix[i]=1-S.mix[i]}
}
function canReceiveCommunity(i,people,faith){
 if(S.pop[i]<=0)return true;
 return (people===S.eth[i]||people===S.eth2[i]||S.eth2[i]<0||S.mix[i]<=1e-7)
  &&(faith===S.rel[i]||faith===S.faith2[i]||faith===S.faith3[i]||S.faith2[i]===-2||S.faith3[i]===-2);
}
function removeCommunity(i,amount,people=S.eth[i],faith=S.rel[i]){
 const s=S,p=s.pop[i];amount=Math.min(Math.max(0,amount),p*peopleShare(i,people),p*faithShare(i,faith),p*0.95);if(amount<=0)return 0;
 const ethnicMinor=p*s.mix[i]-(s.eth2[i]===people?amount:0),faithMinor=p*s.faithMix[i]-(s.faith2[i]===faith?amount:0),faithMinor3=p*s.faithMix3[i]-(s.faith3[i]===faith?amount:0);
 s.pop[i]-=amount;s.mix[i]=Math.max(0,ethnicMinor)/s.pop[i];s.faithMix[i]=Math.max(0,faithMinor)/s.pop[i];s.faithMix3[i]=Math.max(0,faithMinor3)/s.pop[i];normalizeCommunity(i);normalizeCommunity(i,true);return amount;
}
function arriveCommunity(i,amount,people,faith){
 if(amount<=0||!canReceiveCommunity(i,people,faith))return 0;
 const s=S,p=s.pop[i],minor=p*s.mix[i],faithMinor=p*s.faithMix[i],faithMinor3=p*s.faithMix3[i];s.pop[i]+=amount;
 if(p<=0||s.eth[i]<0){s.eth[i]=people;s.eth2[i]=-1;s.mix[i]=0;s.rel[i]=faith;s.faith2[i]=-2;s.faithMix[i]=0;s.faith3[i]=-2;s.faithMix3[i]=0}
 else{
  if(s.eth[i]===people)s.mix[i]=minor/s.pop[i];
  else{if(s.eth2[i]!==people){s.eth2[i]=people;s.mixT[i]=0}s.mix[i]=(minor+amount)/s.pop[i]}
  s.faithMix[i]=faithMinor/s.pop[i];s.faithMix3[i]=faithMinor3/s.pop[i];
  if(s.rel[i]!==faith){if(s.faith2[i]===faith||s.faith2[i]===-2){s.faith2[i]=faith;s.faithMix[i]=(faithMinor+amount)/s.pop[i]}
   else{s.faith3[i]=faith;s.faithMix3[i]=(faithMinor3+amount)/s.pop[i]}}

  normalizeCommunity(i);normalizeCommunity(i,true);
 }
 return amount;
}
function transferCommunity(from,to,amount){
 const people=S.eth[from],faith=S.rel[from];if(from===to||people<0||!canReceiveCommunity(to,people,faith))return 0;
 const moved=removeCommunity(from,amount,people,faith);return arriveCommunity(to,moved,people,faith);
}
function assimilatePeople(i,people,rate){
 if(P.assim<=0||people<0||S.pop[i]<1||rate<=0)return 0;
 const s=S,share=peopleShare(i,people);if(share===0&&s.eth2[i]>=0&&s.mix[i]>1e-7)return 0;
 const moved=clamp(rate,0,0.1)*(1-share);
 if(s.eth[i]===people)s.mix[i]=Math.max(0,s.mix[i]-moved);
 else{s.eth2[i]=people;s.mix[i]+=moved}
 normalizeCommunity(i);return moved;
}
function changeFaith(i,id,rate){
 const s=S,R=id>=0?s.rels[id]:null;if(s.pop[i]<1||rate<=0||id< -1||id>=0&&!R)return 0;
 if(R?.kind==='ethnic'&&s.eth[i]>=0&&s.eths[s.eth[i]]?.fam!==R.fam)return 0;
 const share=faithShare(i,id);if(share===0&&s.faith2[i]!==-2&&s.faith3[i]!==-2)return 0;
 rate=clamp(rate,0,0.15);const moved=rate*(1-share);
 if(s.rel[i]===id){s.faithMix[i]*=1-rate;s.faithMix3[i]*=1-rate}
 else if(s.faith2[i]===id){s.faithMix[i]+=moved;s.faithMix3[i]*=1-rate}
 else if(s.faith3[i]===id){s.faithMix3[i]+=moved;s.faithMix[i]*=1-rate}
 else if(s.faith2[i]===-2){s.faith2[i]=id;s.faithMix[i]=rate;s.faithMix3[i]*=1-rate}
 else{s.faith3[i]=id;s.faithMix3[i]=rate;s.faithMix[i]*=1-rate}
 normalizeCommunity(i,true);return moved;
}
function branchFaith(i,parent,child){
 if(S.rel[i]===parent)S.rel[i]=child;
 else if(S.faith2[i]===parent)S.faith2[i]=child;
 else if(S.faith3[i]===parent)S.faith3[i]=child;
}
function exchangeTraditions(a,b,rate){
 if(a<0||b<0||a===b||P.mixing<=0)return;
 const A=S.eths[a],B=S.eths[b],k=clamp(rate*P.mixing,0,0.02);
 for(let n=0;n<6;n++){const d=(A.cult[n]-B.cult[n])*k;A.cult[n]-=d;B.cult[n]+=d}
}
function religiousContact(i,ls0,ls1){
 const s=S,r=s.r;let ri=s.rel[i];if(s.faith2[i]!==-2||s.faith3[i]!==-2){const q=r();if(q<s.faithMix[i])ri=s.faith2[i];else if(q<s.faithMix[i]+s.faithMix3[i])ri=s.faith3[i]}
 if(ri<0||P.faith<=0)return;const R=s.rels[ri];
 let j=WD.nb[i*4+((r()*4)|0)];if(ls1>ls0&&r()<0.2)j=WD.lt[ls0+((r()*(ls1-ls0))|0)];
 if(j<0||s.pop[j]<1||faithShare(j,ri)>=0.999)return;
 const pi=s.pol[i],q=s.pol[j],host=q?s.pols[q]:null,accept=host?.rel===ri?2:host?.rel>=0?0.5:1;
 const contact=Math.min(1,0.15+Math.sqrt(s.pop[i]*s.pop[j])/15000+2*s.car[j]);
 if(r()<0.09*R.miss*P.faith*contact*(pi&&q===pi?1.5:1)*accept*(1+0.5*s.paper[i])*(0.7+0.6*(R.cent??0)))changeFaith(j,ri,0.08*(0.5+0.5*cityPreservation(i)));
}
function politicalCommunityChange(i,o){
 const s=S,e=s.eth[i];if(s.pop[i]<1)return;
 const people=P.assim>0&&e>=0&&e!==o.core&&!isDependentColony(i,o.id),faith=o.rel>=0&&P.faith>0&&faithShare(i,o.rel)<1;
 if(!people&&!faith)return;
 const institution=cityPreservation(i),authority=s.control[i]*(1-s.autonomy[i]);
 if(people)assimilatePeople(i,o.core,P.assim*0.0015*authority*(0.4+0.6*s.integ[i])*(1-0.8*ethDist(e,o.core))*(1+institution));
 if(faith)changeFaith(i,o.rel,P.faith*0.0015*authority*(0.4+0.6*(o.mandate??1))*(1+institution));
}
function culturalSeparation(i,parent){
 const o=S.pols[S.pol[i]];if(!o)return 1.1;
 return clamp((o.core===parent?0.65:1.25)*(1+0.4*S.autonomy[i])*(1-0.25*cityPreservation(i))*(1-0.25*S.uni[i]),0.3,1.8);
}
function faithSeparation(R,i){
 const o=S.pols[S.pol[i]],home=S.pol[R.holy],separate=S.pol[i]!==home;
 return clamp(0.55+(separate?0.65:0)+0.45*S.autonomy[i]+0.4*(o?governmentIsolation(i,o):0.5)+0.2*cityPreservation(i),0.3,2);
}
