
"use strict";
/* ================= SIMULATION CORE (no DOM) ================= */
const ENGINE_VERSION='0.14.0';
const calendarPhase=(year,period)=>((year%period)+period)%period;
const W=400,H=200,N=W*H,SC=4,HW=W*SC,HH=H*SC,AGW=40,AGH=20;
const PDEF=[
['World','landFrac','Land share',0.2,0.5,0.01,0.33,'Share of the surface above sea level (generated worlds).',1],
['World','bands','Founding peoples',3,24,1,10,'Unrelated language families at the start (generated worlds).',1],
['World','hearths','Farming hearths',1,8,1,4,'Places where crops are first domesticated (random hearths).',1],
['World','startYear','Start year',-12000,-4000,500,-9000,'Year the simulation begins.',1],
['Climate','climVar','Weather variability',0,2,0.05,1,'Size of year-to-year rainfall swings.'],
['Climate','climPersist','Wet and dry runs',0,0.95,0.01,0.8,'How long a wet or dry spell tends to last.'],
['Climate','volcano','Volcanic winters',0,3,0.1,1,'How often eruptions cool the world for a few years.'],
['People','growth','Growth rate',0.004,0.03,0.001,0.012,'Yearly growth while below carrying capacity.'],
['People','migration','Migration',0,3,0.05,1,'How readily people move toward emptier land.'],
['People','seafaring','Seafaring',0,3,0.05,1,'How often coastal peoples cross open water.'],
['People','splitDist','Split radius',4,24,1,10,'How far (in cells) a people spreads before it splits.'],
['People','assim','Assimilation',0,3,0.05,1,'How fast states absorb minority peoples.'],
['People','mixing','Mixing into new peoples',0,3,0.05,1,'How readily long-mingled peoples merge into a new one.'],
['People','wander','Great migrations',0,3,0.05,1,'How readily displaced peoples and hordes set off across the map.'],
['States','formRate','State formation',0,3,0.05,1,'How often dense farming or herding peoples form chiefdoms.'],
['States','warRate','War frequency',0,3,0.05,1,'How often states declare war and press their attacks.'],
['States','asabR','Frontier cohesion',0.01,0.3,0.005,0.1,'Cohesion gained on frontiers with unfamiliar peoples or faiths.'],
['States','asabD','Interior decay',0.001,0.05,0.001,0.006,'Cohesion lost in safe interiors.'],
['States','reach','Administrative reach',2,20,0.5,6,'Cells from the capital at which power falls to 37%, before technology.'],
['States','crisis','Instability sensitivity',0,3,0.05,1,'How easily structural pressure turns into civil war.'],
['States','allyRate','Alliances',0,3,0.05,1,'How readily states with shared interests ally.'],
['States','terrain','Terrain friction',0,3,0.05,1,'How much deserts, mountains and forests slow armies and administration.'],
['States','floor','Population floor',0.2,3,0.05,1,'Scales the population a chiefdom, kingdom or empire needs to exist. States that fall below their floor demote or dissolve.'],
['States','circ','Circumscription',0,2,0.05,1,'How much hemmed-in land (Carneiro) and the lack of an exit option favour state formation and taxation.'],
['States','eco','Ecological reach',0,3,0.05,1,'How much harder it is to conquer, tax and hold lands unlike the state\'s home climate and way of life. Higher favours empires that follow one climate belt, river or coast.'],
['States','scaleExp','Returns to scale',0.6,1,0.01,0.8,'How strongly a bigger tax base turns into military reach. Higher favours large empires.'],
['States','fortify','Fortification',0,3,0.05,1,'How readily cohesive, wealthy states fortify threatened frontiers.'],
['States','scl','Institutional sclerosis',0,3,0.05,1,'How fast old states silt up with entrenched elites and costly, diminishing-return bureaucracy (Olson, Tainter). Sclerotic states face more crises, and the worst cases break apart instead of reforming. 0 turns it off.'],
['Nomads','nomad','Nomad confederations',0,3,0.05,1,'How readily herders unite into confederations under strong leaders.'],
['Nomads','raid','Raiding',0,3,0.05,1,'How often nomads raid settled neighbours.'],
['Leaders','leaderInfl','Leader influence',0,1,0.01,0.6,'How much a ruler’s traits matter.'],
['Leaders','leaderFlair','Exceptional rulers',0,0.15,0.005,0.03,'Chance that a ruler has one extreme trait.'],
['Ideas & faith','invent','Invention',0,3,0.05,1,'How often states make new discoveries.'],
['Ideas & faith','techDiff','Idea diffusion',0,3,0.05,1,'How fast techniques spread between neighbours.'],
['Ideas & faith','techLoss','Skill loss in isolation',0,3,0.05,1,'Small, cut-off groups forget techniques.'],
['Ideas & faith','faith','Prophets and schisms',0,3,0.05,1,'How often new religions and schisms arise.'],
['Ideas & faith','zeal','Holy wars',0,3,0.05,1,'How readily pious rulers fight over faith and holy sites.'],
['Climate','epochs','Climate epochs',0,3,0.05,1,'How often centuries-long cold, warm or dry epochs occur.'],
['Ideas & faith','disease','Epidemics',0,3,0.05,1,'How often crowd diseases break out.'],
['Ideas & faith','degrade','Soil exhaustion',0,3,0.05,1,'How fast overworked farmland loses fertility.'],
];
const P={};for(const d of PDEF)P[d[1]]=d[6];
P.hearthMode='historical';P.fitClimate=true;P.shuffleNames=false;
const CDEF=[
['tEq','Equator temperature (°C)',22,32,0.5,29],
['tGrad','Equator-to-pole drop (°C)',30,60,1,47],
['lapse','Cooling with height (°C/km)',4,9,0.1,6],
['rainBelt','Tropical rain belt (mm)',600,4000,50,3150],
['midlat','Mid-latitude storm belt (mm)',200,2000,25,1400],
['subDry','Subtropical dry belt (mm)',0,800,10,590],
['dry','Interior drying rate',0.002,0.06,0.001,0.038],
['floor','Interior moisture floor',0,0.95,0.01,0.75],
['orog','Mountain rainfall',0,5000,100,2400],
['recycle','Rainforest moisture recycling',0,1,0.01,0.9],
['monsoon','Monsoon reach',0,1.2,0.01,0.75],
['monsoonP','Monsoon rainfall (mm)',0,2500,50,1700],
['maritime','West-coast ocean warmth (°C)',0,8,0.25,5.5],
['contKm','Continentality distance (km)',300,3000,50,650],
['seas','Maritime seasonal swing',0.05,0.4,0.01,0.165],
['contSeas','Continental seasonal swing',0,1,0.01,0.55],
];
const CL={};for(const d of CDEF)CL[d[0]]=d[5];

function mulberry32(a){const random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};random.state=()=>a>>>0;return random}
function hashStr(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function gauss(r){const u=r()||1e-9,v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185307*v)}
function pick(r,a){return a[(r()*a.length)|0]}
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
function fy(y){return y<=0?`${(1-y).toLocaleString('en-US')} BCE`:`${y} CE`}
function hsl(h,s,l){h=((h%360)+360)%360/360;const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return[f(0),f(8),f(4)]}
function makeNoise(r){
  const perm=new Uint8Array(512),val=new Float32Array(256),p=[];
  for(let i=0;i<256;i++)p.push(i);
  for(let i=255;i>0;i--){const j=(r()*(i+1))|0;const t=p[i];p[i]=p[j];p[j]=t}
  for(let i=0;i<512;i++)perm[i]=p[i&255];
  for(let i=0;i<256;i++)val[i]=r()*2-1;
  return function(x,y,z){
    const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;
    const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf),X=xi&255,Y=yi&255,Z=zi&255;
    const a0=perm[X]+Y,a1=perm[X+1]+Y,b00=perm[a0]+Z,b01=perm[a0+1]+Z,b10=perm[a1]+Z,b11=perm[a1+1]+Z;
    const c000=val[perm[b00]],c001=val[perm[b00+1]],c010=val[perm[b01]],c011=val[perm[b01+1]],c100=val[perm[b10]],c101=val[perm[b10+1]],c110=val[perm[b11]],c111=val[perm[b11+1]];
    const x00=c000+(c100-c000)*u,x01=c001+(c101-c001)*u,x10=c010+(c110-c010)*u,x11=c011+(c111-c011)*u,y0=x00+(x10-x00)*v,y1=x01+(x11-x01)*v;
    return y0+(y1-y0)*w;
  };
}
function fbm(n,x,y,z,o){let s=0,a=1,f=1,t=0;for(let i=0;i<o;i++){s+=a*n(x*f+i*17.1,y*f-i*9.7,z*f+i*3.3);t+=a;a*=0.5;f*=2.03}return s/t}
function boxBlur(a,w,h,rx,ry,wrap){
  const tmp=new Float32Array(a.length);
  if(rx>0)for(let y=0;y<h;y++){const o=y*w;let s=0;for(let d=-rx;d<=rx;d++)s+=a[o+((d+w)%w)];for(let x=0;x<w;x++){tmp[o+x]=s/(2*rx+1);s+=a[o+((x+rx+1)%w)]-a[o+((x-rx+w)%w)]}}else tmp.set(a);
  if(ry>0)for(let x=0;x<w;x++)for(let y=0;y<h;y++){let s=0,c=0;for(let d=-ry;d<=ry;d++){const yy=y+d;if(yy<0||yy>=h)continue;s+=tmp[yy*w+x];c++}a[y*w+x]=s/c}else a.set(tmp);
}

/* ---------- Earth assets ---------- */
function decodeEarth(elevBytes,kgBytes){
  const count=HW*HH,h=new Float32Array(count);let d;
  if(elevBytes.length===count*2)d=new Int16Array(elevBytes.buffer,elevBytes.byteOffset,count);
  else{
    if(elevBytes[0]!==87||elevBytes[1]!==69||elevBytes[2]!==69||elevBytes[3]!==49)throw new Error('Invalid Earth elevation format.');
    d=new Int16Array(count);let at=4;
    for(let i=0;i<count;i++){let v=0,shift=0,b;do{if(at>=elevBytes.length||shift>14)throw new Error('Invalid Earth elevation data.');b=elevBytes[at++];v|=(b&127)<<shift;shift+=7}while(b&128);d[i]=((v>>>1)^-(v&1))+(i>=HW?d[i-HW]:0)}
    if(at!==elevBytes.length)throw new Error('Invalid Earth elevation length.');
  }
  for(let y=0;y<HH;y++){let acc=0;for(let x=0;x<HW;x++){acc+=d[y*HW+x];h[y*HW+x]=acc}}
  return{height:h,kg:new Uint8Array(kgBytes.buffer,kgBytes.byteOffset,HW*HH)};
}
const KG_CODES=['','Af','Am','As','Aw','BSh','BSk','BWh','BWk','Cfa','Cfb','Cfc','Csa','Csb','Csc','Cwa','Cwb','Cwc','Dfa','Dfb','Dfc','Dfd','Dsa','Dsb','Dsc','Dsd','Dwa','Dwb','Dwc','Dwd','EF','ET','Ocean'];
const KG_GROUPS=['Tropical (A)','Desert (BW)','Steppe (BS)','Temperate (C)','Continental (D)','Polar (E)'];
function kgGroup(c){return c>=1&&c<=4?0:c===5||c===6?2:c===7||c===8?1:c>=9&&c<=17?3:c>=18&&c<=29?4:c===30||c===31?5:-1}
function simGroup(T,Pp,A){const Tw=T+A/2,Tc=T-A/2;if(Tw<10)return 5;const th=Math.max(0,20*T+140);if(Pp<th)return Pp<th/2?1:2;if(Tc>=18)return 0;if(Tc>0)return 3;return 4}

/* ---------- climate ---------- */
function genClimate(eHi){
  const n=HW*HH,tHi=new Float32Array(n),pHi=new Float32Array(n),aHi=new Float32Array(n),mZ=new Float32Array(n),oZ=new Float32Array(n),cZ=new Float32Array(n),mR=new Float32Array(n),mM=new Float32Array(n),oM=new Float32Array(n),baseRow=new Float32Array(HH);
  const latOf=y=>90-(y+0.5)/HH*180;
  const base=latD=>{const a=Math.abs(latD);return Math.max(60,260+CL.rainBelt*Math.exp(-(((latD-3)/13)**2))+CL.midlat*Math.exp(-(((a-50)/12)**2))-CL.subDry*Math.exp(-(((a-24)/7)**2))-150*clamp((a-65)/20,0,1))};
  for(let y=0;y<HH;y++)baseRow[y]=base(latOf(y));
  // one moisture march along a row or column; idx(st) gives the pixel, km is the step length
  // mode 0: prevailing wind; 1: onshore flow from an eastern coast; 2: summer flow from tropical oceans
  const march=(len,idx,km,bp,outM,outO,outC,mode)=>{
    // Summer ocean moisture is depleted inland; do not replenish it over deserts.
    let m=mode===2?0:1,prev=0,ds=0;const fl=mode?0:Math.min(0.95,CL.floor+CL.recycle*bp/2000),dr=mode===1?CL.dry*0.3:mode===2?CL.dry*0.35:CL.dry,rc=mode?0.05:0.25;
    for(let st=0;st<(mode===2?len:2*len);st++){const i=idx(st%len),e=eHi[i];let rain=0;
      if(e<=0){m+=(1-m)*rc;prev=0;ds=0}
      else{const dh=e-prev;if(dh>0){rain=m*(1-Math.exp(-dh/1500));m-=rain}m+=(fl-m)*dr*(km/31);prev=e;ds+=km}
      if(mode===2||st>=len){outM[i]=m;if(outO)outO[i]=rain;if(outC)outC[i]=1-Math.exp(-ds/CL.contKm)}}
  };
  for(let y=0;y<HH;y++){
    const latD=latOf(y),a=Math.abs(latD),dir=a<30?-1:(a<62?1:-1),kmPx=Math.max(5,40075*Math.cos(latD*Math.PI/180)/HW),o=y*HW;
    march(HW,dir>0?k=>o+k:k=>o+HW-1-k,kmPx,baseRow[y],mZ,oZ,cZ);
    march(HW,k=>o+HW-1-k,kmPx,baseRow[y],mR,null,null,1);
  }
  // summer monsoon: moisture drawn poleward from the tropical oceans
  const kmV=20004/HH,y0=Math.floor((90-45)/180*HH),y1=Math.floor((90+45)/180*HH);
  // Sample poleward and diagonal ocean paths: Bay of Bengal / western Pacific
  // moisture can reach inland plains without crossing every mountain to the south.
  // These paths have open ends: start dry and acquire moisture only over water.
  const pathM=new Float32Array(n),pathO=new Float32Array(n);
  for(const dx of [0,-1,1]){
    for(let x=0;x<HW;x++){
      const ys=Math.floor((90+12)/180*HH),lenN=ys-y0;
      march(lenN,k=>(ys-k)*HW+(x+dx*k+HW)%HW,kmV*Math.hypot(1,dx),0,pathM,pathO,null,2);
      const ys2=Math.floor((90-12)/180*HH),lenS=y1-ys2;
      march(lenS,k=>(ys2+k)*HW+(x+dx*k+HW)%HW,kmV*Math.hypot(1,dx),0,pathM,pathO,null,2);
    }
    for(let i=0;i<n;i++){mM[i]=Math.max(mM[i],pathM[i]);oM[i]=Math.max(oM[i],pathO[i])}
  }
  for(let y=0;y<HH;y++){
    const latD=latOf(y),a=Math.abs(latD),s=Math.sin(latD*Math.PI/180),s2=s*s;
    const Tsea=CL.tEq-CL.tGrad*s2*(0.55+0.5*s2*s2),dir=a<30?-1:(a<62?1:-1);
    const mon=CL.monsoon*clamp((52-a)/20,0,1)*clamp((a-2)/6,0,1),eastW=clamp((a-18)/8,0,1);
    for(let x=0;x<HW;x++){const i=y*HW+x,e=eHi[i];
      const cont=e<=0?0:cZ[i];
      tHi[i]=Tsea-CL.lapse*0.001*Math.max(0,e)+(dir>0?CL.maritime*(1-cont)*clamp((a-30)/15,0,1):0);
      const mm=Math.max(mR[i]*eastW,mM[i]);
      const orog=Math.max(oZ[i],mon*oM[i]);
      pHi[i]=e<=0?baseRow[y]:baseRow[y]*(0.12+0.88*mZ[i])+CL.monsoonP*mon*mm+CL.orog*orog*(0.35+baseRow[y]/1400);
      aHi[i]=0.5+a*(CL.seas+CL.contSeas*cont);
    }
  }
  boxBlur(pHi,HW,HH,4,2,true);boxBlur(aHi,HW,HH,6,2,true);boxBlur(tHi,HW,HH,1,1,true);
  return{tHi,pHi,aHi};
}
const KGP={Af:2400,Am:2300,As:1100,Aw:1200,Cfa:1250,Cfb:1100,Cfc:1300,Csa:650,Csb:700,Csc:800,Cwa:1200,Cwb:1100,Cwc:1000,Dfa:800,Dfb:700,Dfc:550,Dfd:450,Dsa:500,Dsb:550,Dsc:500,Dsd:400,Dwa:650,Dwb:550,Dwc:450,Dwd:300};
function fitClimate(tHi,pHi,aHi,eHi,kg){
  let changed=0;
  for(let i=0;i<HW*HH;i++){
    if(eHi[i]<=0)continue;const g=kgGroup(kg[i]);if(g<0)continue;
    let T=tHi[i],Pp=pHi[i];const A=aHi[i],T0=T,P0=Pp;
    const Tw=()=>T+A/2,Tc=()=>T-A/2;
    {const cd=KG_CODES[kg[i]],c0=cd.charAt(0),c2=cd.charAt(2);
     if((c0==='C'||c0==='D')&&c2==='a'&&Tw()<22.3)T+=22.3-Tw();else if((c0==='C'||c0==='D')&&c2==='b'&&Tw()>21.5)T-=Tw()-21.5}
    if(g===5){if(Tw()>=10)T-=Tw()-9.5}else if(Tw()<10)T+=10.5-Tw();
    if(g===0&&Tc()<18)T+=18.5-Tc();
    if(g===3){if(Tc()>=18)T-=Tc()-17.5;if(Tc()<=0)T+=0.5-Tc()}
    if(g===4&&Tc()>0)T-=Tc()+0.5;
    const th=Math.max(0,20*T+140);
    if(g===1){if(Pp>=th/2)Pp=th*0.35}
    else if(g===2){if(Pp>=th)Pp=th*0.8;else if(Pp<th/2)Pp=th*0.65}
    else if(g!==5){const tg=KGP[KG_CODES[kg[i]]];if(tg){const u=clamp(Pp/(2*tg),0,1);Pp=tg*(0.8+0.6*u)}if(Pp<th*1.1)Pp=th*1.25+40}
    tHi[i]=T;pHi[i]=Pp;if(T!==T0||Pp!==P0)changed++;
  }
  return changed;
}
function gradeClimate(w,rawT,rawP,rawA){
  if(!w.kgGrid)return null;
  const code=new Uint8Array(N),per=[];for(let g=0;g<6;g++)per.push({ok:0,tot:0});
  let ok=0,tot=0;const RANK=[3,1,1,2,1,0];
  for(const i of w.landIdx){const og=kgGroup(w.kgGrid[i]);if(og<0)continue;
    const sg=simGroup(rawT[i],rawP[i],rawA[i]),a=w.area[i];
    per[og].tot+=a;tot+=a;
    if(sg===og){per[og].ok+=a;ok+=a;code[i]=1;continue}
    const sB=sg===1||sg===2,oB=og===1||og===2;
    if(sB&&!oB)code[i]=2;else if(oB&&!sB)code[i]=3;
    else if(sB&&oB)code[i]=sg===1?2:3;
    else code[i]=[3,0,0,2,1,0][sg]<[3,0,0,2,1,0][og]?4:5;
  }
  return{score:tot?ok/tot:0,per,code};
}

/* ---------- world ---------- */
const BIOMES=['Ocean','Ice','Tundra','Boreal forest','Temperate forest','Grassland','Steppe','Desert','Savanna','Tropical forest','Seasonal woodland'];
function biomeOf(T,Pp,observed=0){
  // Köppen observations distinguish seasonal woodland from arid grassland.
  // Annual mean temperature alone mislabels humid subtropical China as savanna.
  const g=kgGroup(observed);
  if(g===1)return 7;if(g===2)return 6;
  if(g===0)return observed===4?(Pp>=900?10:8):9;
  if(g===3)return observed>=12&&observed<=14?10:4;
  if(g===4)return T<5?3:4;
  if(T<-9)return 1;if(T<-1)return 2;if(T<5)return Pp<250?2:3;
  const t=Math.max(T,0);if(Pp<150+8*t)return 7;if(Pp<330+13*t)return 6;if(T>=20)return Pp<1300?8:9;return Pp<700?5:4;
}
function cellAt(lat,lon){const y=clamp(Math.floor((90-lat)/180*H),0,H-1),x=((Math.floor((lon+180)/360*W)%W)+W)%W;return y*W+x}
const REGIONS=[
 {k:'meso',n:'Mesopotamia',box:[29,37,39,49],ref:-3099},
 {k:'egypt',n:'Egypt',box:[22,31.5,29,34],ref:-3099},
 {k:'indus',n:'Indus valley',box:[23,33,66,76],ref:-2599},
 {k:'nchina',n:'Yellow River',box:[32,41,105,120],ref:-1899},
 {k:'mesoam',n:'Mesoamerica',box:[14,22,-100,-86],ref:-499},
 {k:'andes',n:'Central Andes',box:[-20,-5,-80,-68],ref:-199},
 {k:'europe',n:'Western Europe',box:[42,55,-6,15],ref:-49},
 {k:'wafrica',n:'West Africa',box:[8,18,-12,8],ref:700},
];
const NOSTATE=[{n:'New Guinea',box:[-10,-1,131,151]},{n:'Congo interior',box:[-5,4,15,28]},{n:'Amazon interior',box:[-10,0,-72,-52]}];
const NOFARM=[{n:'Siberia',box:[55,75,60,180]},{n:'Australia',box:[-40,-11,113,154]},{n:'Northern North America',box:[52,72,-170,-55]},{n:'Southern Africa',box:[-35,-25,15,32]}];
const CHINA_REF=[[-1600,0.25],[-1046,0.5],[-771,0.25],[-221,0.9],[220,0.45],[280,0.85],[304,0.45],[589,0.95],[907,0.35],[960,0.7],[1127,0.5],[1279,1],[1368,0.95],[1644,1],[1800,1]];
function genWorld(o){
  const r=mulberry32(hashStr('world:'+o.seed));
  const eHi=new Float32Array(HW*HH);
  if(o.height){eHi.set(o.height)}else{
    const n1=makeNoise(r),n2=makeNoise(r),n3=makeNoise(r),n4=makeNoise(r);
    const raw=new Float32Array(HW*HH),smp=[];
    for(let y=0;y<HH;y++){
      const lat=Math.PI/2-(y+0.5)/HH*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat);
      for(let x=0;x<HW;x++){
        const lon=(x+0.5)/HW*2*Math.PI-Math.PI,X=cl*Math.cos(lon),Y=cl*Math.sin(lon),Z=sl;
        const wx=fbm(n2,X*1.1+3.1,Y*1.1,Z*1.1,3),wy=fbm(n2,X*1.1,Y*1.1+7.3,Z*1.1,3),wz=fbm(n2,X*1.1,Y*1.1,Z*1.1+1.7,3);
        const qx=X+0.75*wx,qy=Y+0.75*wy,qz=Z+0.75*wz,c=fbm(n1,qx*1.45,qy*1.45,qz*1.45,6);
        let rg=1-Math.abs(fbm(n3,qx*2.7,qy*2.7,qz*2.7,4)*1.7);rg=clamp(rg,0,1);rg=rg*rg*rg;
        const v=c+0.17*rg*(c>-0.04?1:0.25)+0.05*fbm(n4,X*7,Y*7,Z*7,3);
        raw[y*HW+x]=v;if((x%3===0)&&(y%2===0)&&r()<cl)smp.push(v);
      }
    }
    smp.sort((a,b)=>a-b);
    const sl=smp[Math.floor(smp.length*(1-o.landFrac))],mx=smp[smp.length-1],mn=smp[0];
    for(let i=0;i<raw.length;i++){const v=raw[i];eHi[i]=v>sl?20+Math.pow((v-sl)/(mx-sl),1.35)*6200:-(60+Math.pow((sl-v)/(sl-mn),0.5)*5600)}
  }
  const C=genClimate(eHi);
  const w={generation:{source:o.earth?'earth':o.height?'import':'generated',seed:String(o.seed),landFrac:o.landFrac??P.landFrac,fitClimate:!!(o.kg&&o.fit)},climateRules:{...CL},importSource:o.height&&!o.earth?{height:o.height,temp:o.temp||null,prec:o.prec||null}:null,seed:o.seed,eHi,isEarth:!!o.earth,imported:!!o.height&&!o.earth,kgHi:o.kg||null,fitted:false};
  // raw (model) climate on the coarse grid, kept for grading
  const rawT=new Float32Array(N),rawP=new Float32Array(N),rawA=new Float32Array(N);
  const agg=(src,dst)=>{for(let cy=0;cy<H;cy++)for(let cx=0;cx<W;cx++){let s=0;for(let dy=0;dy<SC;dy++)for(let dx=0;dx<SC;dx++)s+=src[(cy*SC+dy)*HW+cx*SC+dx];dst[cy*W+cx]=s/(SC*SC)}};
  agg(C.tHi,rawT);agg(C.pHi,rawP);agg(C.aHi,rawA);
  if(o.temp)C.tHi.set(o.temp);if(o.prec)C.pHi.set(o.prec);
  if(o.kg&&o.fit){w.fitChanged=fitClimate(C.tHi,C.pHi,C.aHi,eHi,o.kg);w.fitted=true}
  w.tHi=C.tHi;w.pHi=C.pHi;w.aHi=C.aHi;
  const elev=new Float32Array(N),T=new Float32Array(N),Pr=new Float32Array(N),amp=new Float32Array(N),rough=new Float32Array(N),land=new Uint8Array(N);
  for(let cy=0;cy<H;cy++)for(let cx=0;cx<W;cx++){
    let se=0,se2=0,st=0,sp=0,sa=0,nl=0;
    for(let dy=0;dy<SC;dy++)for(let dx=0;dx<SC;dx++){const k=(cy*SC+dy)*HW+cx*SC+dx,e=eHi[k];se+=e;se2+=e*e;st+=C.tHi[k];sp+=C.pHi[k];sa+=C.aHi[k];if(e>0)nl++}
    const n=SC*SC,i=cy*W+cx,em=se/n;
    land[i]=nl*2>=n?1:0;elev[i]=land[i]?Math.max(em,5):Math.min(em,-5);T[i]=st/n;Pr[i]=Math.max(0,sp/n);amp[i]=sa/n;
    rough[i]=land[i]?clamp(Math.sqrt(Math.max(0,se2/n-em*em))/700+Math.max(0,em-1200)/3000,0,1):0;
  }
  Object.assign(w,{elev,T,Pr,amp,rough,land,rawT,rawP,rawA});
  if(o.kg){const kgGrid=new Uint8Array(N);
    for(let cy=0;cy<H;cy++)for(let cx=0;cx<W;cx++){const cnt=new Uint8Array(33);let best=0,bc=0;
      for(let dy=0;dy<SC;dy++)for(let dx=0;dx<SC;dx++){const c=o.kg[(cy*SC+dy)*HW+cx*SC+dx];if(c>=1&&c<=31){cnt[c]++;if(cnt[c]>bc){bc=cnt[c];best=c}}}
      kgGrid[cy*W+cx]=best}
    w.kgGrid=kgGrid}
  const lat=new Float32Array(N),area=new Float32Array(N),x3=new Float32Array(N),y3=new Float32Array(N),z3=new Float32Array(N),cosLon=new Float32Array(N),sinLon=new Float32Array(N),cxA=new Int16Array(N),cyA=new Int16Array(N),nb=new Int32Array(N*4);
  for(let cy=0;cy<H;cy++)for(let cx=0;cx<W;cx++){
    const i=cy*W+cx,la=(90-(cy+0.5)/H*180)*Math.PI/180,lo=((cx+0.5)/W*360-180)*Math.PI/180;
    lat[i]=la;area[i]=(40075/W)*(20004/H)*Math.cos(la);cxA[i]=cx;cyA[i]=cy;
    cosLon[i]=Math.cos(lo);sinLon[i]=Math.sin(lo);x3[i]=Math.cos(la)*Math.cos(lo);y3[i]=Math.cos(la)*Math.sin(lo);z3[i]=Math.sin(la);
    nb[i*4]=cy*W+(cx+W-1)%W;nb[i*4+1]=cy*W+(cx+1)%W;nb[i*4+2]=cy>0?i-W:-1;nb[i*4+3]=cy<H-1?i+W:-1;
  }
  const cosLat=new Float32Array(N);for(let i=0;i<N;i++)cosLat[i]=Math.max(0.2,Math.cos(lat[i]));
  Object.assign(w,{lat,area,x3,y3,z3,cosLon,sinLon,cxA,cyA,nb,cosLat});
  const landList=[],coastList=[],coast=new Uint8Array(N);
  for(let i=0;i<N;i++)if(land[i]){landList.push(i);for(let d=0;d<4;d++){const j=nb[i*4+d];if(j>=0&&!land[j]){coast[i]=1;break}}if(coast[i])coastList.push(i)}
  w.landIdx=Int32Array.from(landList);w.coastIdx=Int32Array.from(coastList);w.coast=coast;
  const lm=new Int32Array(N).fill(-1),lmSize=[],q=new Int32Array(N);
  for(const s0 of landList){if(lm[s0]>=0)continue;const id=lmSize.length;let h=0,t=0;q[t++]=s0;lm[s0]=id;
    while(h<t){const i=q[h++];for(let d=0;d<4;d++){const j=nb[i*4+d];if(j>=0&&land[j]&&lm[j]<0){lm[j]=id;q[t++]=j}}}lmSize.push(t)}
  w.lm=lm;w.lmSize=lmSize;w.lmCount=lmSize.length;
  // drainage
  const filled=new Float32Array(N),down=new Int32Array(N).fill(-1),vis=new Uint8Array(N),order=[],hk=[],hv=[];
  const hpush=(i,k)=>{let n=hk.length;hk.push(k);hv.push(i);while(n>0){const p=(n-1)>>1;if(hk[p]<=hk[n])break;[hk[p],hk[n]]=[hk[n],hk[p]];[hv[p],hv[n]]=[hv[n],hv[p]];n=p}};
  const hpop=()=>{const top=hv[0],lk=hk.pop(),lv=hv.pop();if(hk.length){hk[0]=lk;hv[0]=lv;let n=0;for(;;){const l=2*n+1,rr=l+1;let m=n;if(l<hk.length&&hk[l]<hk[m])m=l;if(rr<hk.length&&hk[rr]<hk[m])m=rr;if(m===n)break;[hk[m],hk[n]]=[hk[n],hk[m]];[hv[m],hv[n]]=[hv[n],hv[m]];n=m}}return top};
  const n8=(i,f)=>{const cx=i%W,cy=(i/W)|0;for(let dy=-1;dy<=1;dy++){const yy=cy+dy;if(yy<0||yy>=H)continue;for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;f(yy*W+(cx+dx+W)%W)}}};
  for(let i=0;i<N;i++)if(!land[i])vis[i]=1;
  for(const i of coastList){filled[i]=elev[i];vis[i]=1;let oc=-1;n8(i,j=>{if(!land[j]&&oc<0)oc=j});down[i]=oc;hpush(i,elev[i])}
  while(hv.length){const i=hpop();order.push(i);n8(i,j=>{if(!vis[j]){vis[j]=1;filled[j]=Math.max(elev[j],filled[i]+0.01);down[j]=i;hpush(j,filled[j])}})}
  const acc=new Float32Array(N);
  for(const i of landList)acc[i]=Math.max(0,Pr[i]-200)*area[i]*1e-4*(T[i]<-9?0.2:1);
  for(let k=order.length-1;k>=0;k--){const i=order[k],d=down[i];if(d>=0&&land[d])acc[d]+=acc[i]}
  const rv=new Float32Array(N),th=2500;for(const i of landList)rv[i]=acc[i]>th?clamp(Math.log(acc[i]/th)/Math.log(100)+0.2,0,1):0;
  w.down=down;w.acc=acc;w.rv=rv;
  // suitability
  const sF=new Float32Array(N),sH=new Float32Array(N),nomad=new Uint8Array(N),biome=new Uint8Array(N);
  for(const i of landList){
    const t=T[i],p=Pr[i],tw=t+amp[i]/2;biome[i]=biomeOf(t,p,w.fitted&&w.kgGrid?w.kgGrid[i]:0);
    if(t<-9)continue;
    const half=amp[i]/2,gs=half<0.5?(t>6?12:0):(t-half>=6?12:t+half<=6?0:12*Math.acos(clamp((6-t)/half,-1,1))/Math.PI);
    w.gs=w.gs||new Float32Array(N);w.gs[i]=gs;
    const tS=clamp((gs-4.3)/2.2,0,1)*clamp((tw-10)/8,0,1)*clamp((31-t)/5,0,1)*(t<2?clamp((t+4)/6,0,1):1)*(biomeOf(t,p)===3?0.45:1);
    // loess and black-earth soils: semi-arid temperate grassland soils are deep and fertile once worked
    const pS=Math.max(clamp((p-280)/450,0,1)*clamp((3400-p)/1600,0.25,1),t>9.5&&t<18?0.62*clamp((p-330)/120,0,1)*clamp((850-p)/150,0,1):0);
    const irr=rv[i]*clamp((tw-14)/6,0,1);
    const leach=elev[i]<1500?clamp((p-1300)/900,0,1)*clamp((t-21)/3,0,1)*(1-clamp((rv[i]-0.55)*2.5,0,0.8)):0;
    w.leach=w.leach||new Float32Array(N);w.leach[i]=leach;
    w.trop=w.trop||new Float32Array(N);w.trop[i]=elev[i]<1200?clamp((t-22)/4,0,1)*clamp((p-1100)/800,0,1):0;
    // A coarse mountain cell includes farmable valleys; cool-season crops do not
    // need cereal-style hot summers. Retain frost, aridity and elevation limits.
    sF[i]=Math.max(tS*pS,tS*irr*0.95)*(1-0.45*rough[i])*clamp((5000-elev[i])/1700,0,1)*(1-0.7*leach);
    sH[i]=clamp((tw-4)/10,0,1)*clamp((27-t)/7,0,1)*clamp((p-120)/180,0,1)*clamp((1100-p)/500,0.15,1)*(1-0.4*rough[i]);
    nomad[i]=(sH[i]>0.45&&sF[i]<0.3)?1:0;
  }
  Object.assign(w,{sF,sH,nomad,biome});
  // travel cost (units of a half flat cell), tsetse belt, orbital monsoon zone
  const tcost=new Uint8Array(N),tsetse=new Uint8Array(N),monZone=new Float32Array(N),desert=new Uint8Array(N);
  for(const i of landList){const b=biome[i],t=T[i],p=Pr[i],la=lat[i]*180/Math.PI;
    let c=2;if(b===7){c=8;desert[i]=1}else if(b===9)c=6;else if(b===10)c=4;else if(b===1||b===2)c=6;else if(b===3)c=3;
    c+=Math.round(rough[i]*8);if(rv[i]>0.3)c=Math.max(1,c>>1);tcost[i]=Math.min(20,c);
    tsetse[i]=(t>22&&p>900&&Math.abs(la)<14)?1:0;
    if(p<520)monZone[i]=clamp((33-Math.abs(la))/8,0,1)*clamp((Math.abs(la)-9)/5,0,1)*(la>0?1:0.45)*clamp((520-p)/250,0,1)}
  Object.assign(w,{tcost,tsetse,monZone,desert});
  // weather interpolation
  const wi=new Int32Array(N*4),wf=new Float32Array(N*2);
  for(let i=0;i<N;i++){const cx=i%W,cy=(i/W)|0,gx=(cx+0.5)/W*AGW-0.5,gy=clamp((cy+0.5)/H*AGH-0.5,0,AGH-1.001);
    const x0=Math.floor(gx),y0=Math.floor(gy),xa=(x0+AGW)%AGW,xb=(x0+1)%AGW,y1=Math.min(y0+1,AGH-1);
    wi[i*4]=y0*AGW+xa;wi[i*4+1]=y0*AGW+xb;wi[i*4+2]=y1*AGW+xa;wi[i*4+3]=y1*AGW+xb;wf[i*2]=gx-x0;wf[i*2+1]=gy-y0}
  w.wi=wi;w.wf=wf;
  // sea links: coastal cell -> coastal cells across water within 6 sea steps
  const ls=new Int32Array(N+1),lt=[],ld=[],seen=new Int32Array(N).fill(-1),qd=new Uint8Array(N);
  for(let i=0;i<N;i++){ls[i]=lt.length;if(!coast[i])continue;
    let h=0,t=0;const found=[];
    for(let d=0;d<4;d++){const j=nb[i*4+d];if(j>=0&&!land[j]&&seen[j]!==i){seen[j]=i;q[t++]=j;qd[j]=1}}
    while(h<t){const c=q[h++],dc=qd[c];
      n8(c,j=>{if(seen[j]===i)return;seen[j]=i;
        if(land[j]){if(j!==i&&dc>=2&&coast[j])found.push([j,dc])}
        else if(dc<6){qd[j]=dc+1;q[t++]=j}})}
    found.sort((a,b)=>(lm[b[0]]!==lm[i])-(lm[a[0]]!==lm[i])||a[1]-b[1]);
    for(const [j,d] of found.slice(0,10)){lt.push(j);ld.push(d)}
  }
  ls[N]=lt.length;w.ls=ls;w.lt=Int32Array.from(lt);w.ld=Uint8Array.from(ld);
  if(w.isEarth){
    w.regions=REGIONS.map(R=>{const cells=[];for(const i of landList){const la=lat[i]*180/Math.PI,lo=(cxA[i]+0.5)/W*360-180;if(la>=R.box[0]&&la<=R.box[1]&&lo>=R.box[2]&&lo<=R.box[3])cells.push(i)}return Object.assign({},R,{cells:Int32Array.from(cells)})});
    const med=[],china=[];
    for(const i of landList){const la=lat[i]*180/Math.PI,lo=(cxA[i]+0.5)/W*360-180;
      if(la>=21&&la<=41&&lo>=100&&lo<=122)china.push(i);
      if(la>=30&&la<=46.5&&lo>=-10&&lo<=37){let near=false;const cx=cxA[i],cy=cyA[i];
        for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++){const yy=cy+dy;if(yy<0||yy>=H)continue;const j=yy*W+(cx+dx+W)%W;
          if(land[j])continue;const la2=lat[j]*180/Math.PI,lo2=(cxA[j]+0.5)/W*360-180;
          if(lo2>-5.6&&!(la2>40.8&&lo2>26.5)&&la2<46&&lo2<37){near=true;break}}
        if(near)med.push(i)}}
    w.medCells=Int32Array.from(med);w.chinaCells=Int32Array.from(china);
  }
  w.grade=gradeClimate(w,rawT,rawP,rawA);
  return w;
}

/* ---------- languages: sound families modelled on real language families ---------- */
const SP=s=>s.split(' ').filter(Boolean);
const STYLES={
 romance:{cons:'t t r r n n l l s s c c m v p d g b f',cl:'tr pr br cr fl gr',vow:'a a e e i o o u',pat:'CV CV CV CVC KV V',coda:'n r s l',place:'ia ia a ona aria ica',ppl:'ians ans ese ini',pers:'us o a io ius ian',city:'a um ona ia ento'},
 germanic:{cons:'t r n s d l g k h w b f m th',cl:'st sk br dr fr gr hr kn',vow:'a e i o u a e ae',pat:'CV CVC CVC KVC VC',coda:'n r d l s rd ld nd st lf',place:'land heim mark ia burg',ppl:'s ings ar ians',pers:'ric mund bert wulf hild ald',city:'burg ford wick stead ham'},
 slavic:{cons:'v r n s l k m d b p t z ch sh y g',cl:'pr br st sl kr zv',vow:'a o e i u y a o',pat:'CV CV CVC KV',coda:'v n k r l sk',place:'ia ov grad ava inia',ppl:'ians ichi ani s',pers:'slav mir ko av ana',city:'grad ov ets ava'},
 celtic:{cons:'b r d n l c m g t s v',cl:'br dr gl',vow:'a e i o u ai',pat:'CV CVC CV',coda:'n r d g ch',place:'ia an ach dun or',ppl:'ii ans ach',pers:'ach an ig rix',city:'dun ach on'},
 greek:{cons:'t k p r s l n m th ph ch d',cl:'kr tr pl th',vow:'a e i o y a o e',pat:'CV CV CVC V',coda:'s n r',place:'ia os is ene eia',ppl:'ians ioi ites',pers:'os as es ion ikos',city:'polis ia os on'},
 semitic:{cons:'m l k b r d sh t n h s q y z kh',vow:'a a i u a i u',pat:'CV CVC CV CVC',coda:'m n r l b d k',place:'a at ar ad iya',ppl:'ites i ans',pers:'el at ar on ah',city:'at a it un',t:{k:'malik',e:'great malik',c:'sheikh'}},
 kemetic:{cons:'t m n k h s r w b dj p',vow:'e a i o u',pat:'CV CVC',coda:'t n s r f',place:'et ti ut an',ppl:'ites i',pers:'et is u ef',city:'et u is'},
 berber:{cons:'t m z gh r n l s k d y w',vow:'a i u a',pat:'CV CVC VC',coda:'t n r z',place:'a ast at',ppl:'en ans',pers:'en as an',city:'at ast'},
 persian:{cons:'d r s sh k b m n p f z kh v g j',vow:'a a e i o u',pat:'CV CVC CV',coda:'r n d sh z s',place:'an stan ia ar',ppl:'ians i ans',pers:'ush es an dad zad',city:'abad gird shahr',t:{k:'shah',e:'shahanshah',c:'khan'}},
 indic:{cons:'r m n d s v t k j h b p g dh bh ch',vow:'a a i u e o aa',pat:'CV CV CVC',coda:'n r t m sh',place:'pur desh ra va ana',ppl:'is as ans',pers:'ra deva an ita esh',city:'pur nagar abad',t:{k:'raja',e:'maharaja',c:'thakur'}},
 dravidian:{cons:'k t n r l m v p ch y d',vow:'a i u e o a',pat:'CV CV CVC',coda:'n l r m',place:'am ai ur an',ppl:'ar ans',pers:'an appan ai',city:'ur ai am'},
 sinitic:{cons:'zh ch sh j q x h l m n d t g k b p w y s c z',vow:'a ai ao an ang e ei en eng i ia iao ian iang in ing o ong ou u uan uang ui un uo',pat:'CV',coda:'',place:'',ppl:'',pers:'',city:'an yang du zhou ling',mono:1,t:{k:'wang',e:'huangdi',c:'chief'}},
 japonic:{cons:'k s t n h m y r w g z d b',vow:'a i u e o',pat:'CV CV CV',coda:'',place:'ma shima no',ppl:'',pers:'ro ko mi ra',city:'yama kawa ta'},
 tibetan:{cons:'g d b k t p ts dz zh sh s l r m n ng y w',vow:'a e i o u',pat:'CV CVC',coda:'g d b m n ng r l s',place:'',ppl:'pa',pers:'pa ma',city:'kar ling'},
 turkic:{cons:'t k q b s r l m n y ch sh g d',vow:'a a i u o e y',pat:'CV CVC CVC V',coda:'r n k l g sh z q',place:'ia an li',ppl:'s lar',pers:'tay gul ar bek',city:'kent balik',t:{k:'khan',e:'khagan',c:'bey',h:'khan'}},
 mongolic:{cons:'b t g kh m n ch s d r l y',vow:'a o u e i',pat:'CV CVC',coda:'n r l g d',place:'ia ai',ppl:'s ut id',pers:'tai atu gun ei',city:'balgas khot',t:{k:'khan',e:'khagan',c:'noyan',h:'khan'}},
 uralic:{cons:'k t s m n l v p h r j',vow:'a e i o u a',pat:'CV CVC CV',coda:'n s t k l',place:'maa la ia',ppl:'s ians',pers:'ko nen o',city:'la va'},
 bantu:{cons:'k m t l s b w ny z g',cl:'mb nd ng nk nz',vow:'a a i u e o',pat:'CV CV KV CV',coda:'',place:'',ppl:'',pers:'',city:'',pre:{ppl:'Ba Wa A',place:'U Bu Ki'},t:{k:'mwene',e:'great mwene',c:'chief'}},
 mande:{cons:'k m s d n b t g f l j',vow:'a i u o e',pat:'CV CVC',coda:'n',place:'ba ka dugu',ppl:'nke s',pers:'ba ta ri',city:'dugu ba',t:{k:'mansa',e:'great mansa',c:'farin'}},
 austronesian:{cons:'k t m n l p h w s r g ng',vow:'a a i u e o',pat:'CV CV V CVC',coda:'n ng',place:'a ia u',ppl:'ns',pers:'a i ana',city:'a ang',t:{k:'raja',e:'maharaja',c:'datu'}},
 thai:{cons:'k kh t th p ph ch s n m ng l w y',vow:'a ai ao e i o u ua',pat:'CV CVC',coda:'n ng m k t p',place:'',ppl:'',pers:'',city:'buri thani'},
 pama:{cons:'w y ng b d g m n l r rr',vow:'a i u',pat:'CV CVC',coda:'n l r',place:'',ppl:'',pers:'',city:''},
 nahuatl:{cons:'t tl tz ch m n x k p y w l',vow:'a e i o',pat:'CV CVC CV',coda:'tl n c',place:'tlan pan co can',ppl:'ca eca',pers:'tl otl atzin',city:'tlan pan co',t:{k:'tlatoani',e:'huey tlatoani',c:'chief'}},
 maya:{cons:'k b ch t p m n l y w h x',vow:'a a e i o u',pat:'CV CVC',coda:'k l n m b',place:'il al',ppl:'ob',pers:'ab il',city:'il tun'},
 algonquian:{cons:'k w n m s t p ch',vow:'a e i o',pat:'CV CVC',coda:'k n t',place:'ak ig',ppl:'s',pers:'ak in',city:'ak'},
 quechua:{cons:'k q t p ch m n ll y w r s h',vow:'a i u',pat:'CV CVC',coda:'q y n r s',place:'marka suyu',ppl:'kuna',pers:'pa ki yu',city:'marka pampa'},
 tupi:{cons:'t p m n r k g y w b',vow:'a i u e o y',pat:'CV CV V',coda:'',place:'ba ra ma',ppl:'s',pers:'a i',city:'ba tuba'},
};
for(const k in STYLES){const s=STYLES[k];for(const f of ['cons','cl','vow','pat','coda','place','ppl','pers','city'])s[f]=SP(s[f]||'');if(s.pre){s.pre.ppl=SP(s.pre.ppl);s.pre.place=SP(s.pre.place)}s.t=Object.assign({k:'king',e:'emperor',c:'chief',h:'khan'},s.t||{})}
const MACROS={ie:['romance','germanic','slavic','celtic','greek'],afro:['semitic','kemetic','berber'],indo:['indic','dravidian','persian'],sino:['sinitic','japonic','tibetan'],alt:['turkic','mongolic','uralic'],afr:['bantu','mande'],aus:['austronesian','thai'],pama:['pama'],nam:['nahuatl','maya','algonquian'],sam:['quechua','tupi']};
const MACRO_KEYS=Object.keys(MACROS);
const LEX=['root','river','god','sun','sea','mountain','mother','grain'];
const RULES=[['p','f'],['k','h'],['t','s'],['b','v'],['d','z'],['g','y'],['s','h'],['a','e'],['o','u'],['e','i'],['u','o'],['ai','e'],['kh','h'],['ch','sh'],['l','r'],['r','l'],['th','t'],['sh','s'],['ei','i'],['c','g'],['ct','t'],'drop','voice','palatal','nasal','prothesis','geminate'];
function applyRule(w,R){
  if(Array.isArray(R))return w.split(R[0]).join(R[1]);
  switch(R){
    case'drop':return w.length>4&&/[aeiou]$/.test(w)&&!/[aeiou]{2}$/.test(w)?w.slice(0,-1):w;
    case'voice':return w.replace(/([aeiou])p(?=[aeiou])/g,'$1b').replace(/([aeiou])t(?=[aeiou])/g,'$1d').replace(/([aeiou])k(?=[aeiou])/g,'$1g');
    case'palatal':return w.replace(/k(?=[ie])/g,'ch').replace(/c(?=[ie])/g,'ch').replace(/t(?=i)/g,'ch');
    case'nasal':return w.length>4?w.replace(/[mn]$/,''):w;
    case'prothesis':return w.replace(/^s(?=[ptkm])/,'es');
    case'geminate':return w.replace(/([aeiou])([ptk])(?=[aeiou])/,'$1$2$2');
  }
  return w;
}
function applyRules(w,rs){for(const R of rs)w=applyRule(w,R);return tidy(w)}
function tidy(w){return w.replace(/(.)\1\1+/g,'$1$1').replace(/([wyhjvqx])\1/g,'$1').replace(/^([^aeiouy])\1/,'$1').replace(/[aeiou]{3,}/g,m=>m.slice(0,2))}
function syl(S,r){
  const pat=pick(r,S.pat);let w='';
  for(const ch of pat){
    if(ch==='V')w+=pick(r,S.vow);
    else if(ch==='K')w+=S.cl.length?pick(r,S.cl):pick(r,S.cons);
    else if(ch==='C')w+=pick(r,S.cons);
    else if(ch==='F')w+=S.coda.length?pick(r,S.coda):'';
  }
  if(pat.endsWith('C')&&!pat.endsWith('VC')){}
  return w;
}
function rawWord(L,r,n){const S=STYLES[L.style];let w='';n=n||1+(r()<0.55?1:0);if(S.mono)n=Math.min(n,2);for(let i=0;i<n;i++)w+=syl(S,r);
  if(!S.mono&&S.coda.length&&r()<0.3&&/[aeiou]$/.test(w))w+=pick(r,S.coda);
  if(!S.vow.includes('aa'))w=w.replace(/([aeiou])\1/g,'$1');
  return tidy(w).slice(0,10)}
function join(a,b){if(!b)return a;if(b==='s'&&/[^aeiounrlk]$/.test(a))b='ians';if(/^[aeiouy]/.test(b)&&/[aeiouy]$/.test(a))a=a.replace(/[aeiouy]+$/,'')||a;if(a&&a[a.length-1]===b[0]&&!/[aeiou]/.test(b[0]))b=b.slice(1);return a+b}
function word(L,r,n){let w;for(let t=0;t<8;t++){w=applyRules(rawWord(L,r,n),L.rules);if(w.length>=2&&w.length<=10)break}return w}
function makeLang(r,style,macro){
  const S=STYLES[style];
  const L={style,macro,rules:[],lex:{},placeSuf:S.place.length?pick(r,S.place):'',pplSuf:S.ppl.length?pick(r,S.ppl):'',prePpl:S.pre?pick(r,S.pre.ppl):'',prePlace:S.pre?pick(r,S.pre.place):''};
  for(const k of LEX)L.lex[k]=word(L,r,k==='root'?(S.mono?1:1+(r()<0.5?1:0)):undefined);
  for(let t=0;t<6&&!S.mono&&L.lex.root.length<3;t++)L.lex.root=word(L,r,2);
  langNames(L);return L;
}
function langNames(L){const S=STYLES[L.style],root=L.lex.root;
  const rt=S.mono?root:root;
  L.lex.place=cap(L.prePlace?L.prePlace+rt:join(rt,L.placeSuf));
  L.lex.people=cap(L.prePpl?L.prePpl+rt:join(rt,L.pplSuf));
  L.lex.land=L.lex.place;
}
function childLang(L,r){
  const nr=[];const n=STYLES[L.style].mono?0:1+(r()<0.5?1:0);for(let i=0;i<n;i++)nr.push(pick(r,RULES));
  let style=L.style;if(r()<0.22&&MACROS[L.macro]&&MACROS[L.macro].length>1)style=pick(r,MACROS[L.macro]);
  const S=STYLES[style];
  const C={style,macro:L.macro,rules:L.rules.concat(nr).slice(-6),lex:{},placeSuf:style!==L.style||r()<0.3?(S.place.length?pick(r,S.place):''):L.placeSuf,pplSuf:style!==L.style||r()<0.3?(S.ppl.length?pick(r,S.ppl):''):L.pplSuf,prePpl:S.pre?pick(r,S.pre.ppl):'',prePlace:S.pre?pick(r,S.pre.place):''};
  for(const k of LEX)C.lex[k]=r()<0.12?word(C,r):applyRules(L.lex[k],nr);
  if(C.lex.root===L.lex.root||C.lex.root.length<3)C.lex.root=r()<0.5?applyRules(L.lex.root,[pick(r,RULES)]):word(C,r,S.mono?1:2);
  langNames(C);
  if(C.lex.people===L.lex.people){C.lex.root=word(C,r);langNames(C)}
  return C;
}
function hybridLang(A,B,r){
  const C={style:A.style,macro:A.macro,rules:A.rules.slice(-2),lex:{},placeSuf:r()<0.5?A.placeSuf:B.placeSuf,pplSuf:A.pplSuf,prePpl:A.prePpl,prePlace:A.prePlace};
  for(const k of LEX)C.lex[k]=r()<0.5?A.lex[k]:B.lex[k];
  const a=A.lex.root,b=B.lex.root;C.lex.root=tidy(a.slice(0,Math.ceil(a.length/2))+b.slice(Math.floor(b.length/2)));
  if(C.lex.root.length<3)C.lex.root=a+b.slice(-2);
  langNames(C);return C;
}
function personName(L,r){const S=STYLES[L.style];
  if(S.mono){const a=cap(rawWord(L,r,1)),b=rawWord(L,r,1);return r()<0.5?a+' '+cap(b):a+b}
  let w='';for(let t=0;t<8&&w.length<4;t++){w=rawWord(L,r,1+(r()<0.6?1:0));if(S.pers.length&&r()<0.75)w=join(w,pick(r,S.pers));w=applyRules(w,L.rules).slice(0,12)}return cap(w)}
function placeWord(L,r){const S=STYLES[L.style];const rt=word(L,r,S.mono?1:1+(r()<0.4?1:0));return cap(L.prePlace?L.prePlace+rt:join(rt,S.place.length?(r()<0.6?L.placeSuf:pick(r,S.place)):''))}
function cityWord(L,r){const S=STYLES[L.style];if(S.mono)return cap(rawWord(L,r,1))+(r()<0.5?pick(r,S.city):'');const rt=word(L,r,1+(r()<0.4?1:0));return cap(S.city.length&&r()<0.7?join(rt,pick(r,S.city)):rt)}
function roman(n){const v=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let s='';for(const [a,b] of v)while(n>=a){s+=b;n-=a}return s}
/* ---------- technology ---------- */
const TECH=[
 {k:'farm',n:'Farming',era:1},
 {k:'herd',n:'Herding',era:1},
 {k:'irrig',n:'Irrigation',era:1,pre:[0]},
 {k:'copper',n:'Bronze',era:2,pre:[0]},
 {k:'horse',n:'Horse riding',era:2,pre:[1]},
 {k:'sail',n:'Seafaring',era:1},
 {k:'writing',n:'Writing and accounting',era:2,pre:[0],em:{b:1/5000,pop:1.5e6,cells:4}},
 {k:'wheel',n:'Wheel and chariot',era:2,pre:[3],em:{b:1/5000,pop:1e6}},
 {k:'iron',n:'Ironworking',era:3,pre:[3,7,6],em:{b:1/12000,pop:3e6}},
 {k:'coin',n:'Coinage',era:4,pre:[6,8],em:{b:1/3600,pop:4e6}},
 {k:'law',n:'Law codes',era:4,pre:[6],em:{b:1/3200,pop:3e6,cells:15}},
 {k:'roads',n:'Road networks',era:4,pre:[6,10],em:{b:1/3200,pop:4e6,cells:25}},
 {k:'nav',n:'Celestial navigation',era:4,pre:[5,6],em:{b:1/3600,pop:2e6,coast:1}},
 {k:'caval',n:'Heavy cavalry',era:5,pre:[4,8,10,9],em:{b:1/5600,pop:3e6,horse:1}},
 {k:'paper',n:'Portable records',era:5,pre:[6,10],em:{b:1/5600,pop:6e6}},
 {k:'crops',n:'Intensive cropping',era:5,pre:[0,6,10],em:{b:1/3600,pop:1e6},d:'Rotations, intercropping and managed fields raise yields without requiring iron tools or animal-drawn ploughs.'},
 {k:'gun',n:'Gunpowder',era:6,pre:[14,13],em:{b:1/8000,pop:12e6}},
 {k:'ocean',n:'Ocean-going ships',era:7,pre:[5,12,14],em:{b:1/1800,pop:3e6,coast:1,after:800},d:'Long-range sailing, navigation and portable charts support ocean expeditions and return trade routes.'},
 {k:'camel',n:'Camels',era:2,pre:[1]},
 {k:'grain',n:'Storable staples',era:1,pre:[0]},
 {k:'ard',n:'Scratch plough',era:2,pre:[0,1],pos:[0.5,0.3]},
 {k:'plough',n:'Heavy plough',era:5,pre:[20,8],em:{b:1/5200,pop:1.5e6,press:1,heavy:1},pos:[0.6,0.6]},
 {k:'manure',n:'Compost and manuring',era:3,pre:[0],em:{b:1/3000,pop:5e5,press:1},pos:[0.8,-0.2]},
 {k:'xcrops',n:'Crops from across the ocean',era:7,pre:[0]},
 {k:'kitesig',n:'Kite signalling',era:4,pre:[6,5],em:{b:1/16000,pop:2e6},pos:[0.5,-0.3],synth:1,d:'Signal kites relay orders along frontiers: administrative reach +15%.'},
 {k:'windcart',n:'Wind wagons',era:5,pre:[7,12],em:{b:1/16000,pop:2e6},pos:[-0.3,0.9],synth:1,d:'Sail-driven carts cross flat deserts and steppe: they open caravan routes like camels do.'},
 {k:'fungal',n:'Forest fungal gardens',era:3,pre:[0,22],em:{b:1/14000,pop:3e5,press:1},pos:[0.9,-0.8],synth:1,d:'Cultivated fungi on forest litter: +40% food in forest and leached soils.'},
 {k:'ledger',n:'Clockwork ledgers',era:5,pre:[14,9],em:{b:1/16000,pop:4e6},pos:[-0.7,0.6],synth:1,d:'Geared tallying engines for the treasury: +10% tax, slower-growing upkeep.'},
 {k:'tidemill',n:'Tide mills',era:4,pre:[8,12],em:{b:1/14000,pop:1.5e6,coast:1},pos:[0,0.95],synth:1,d:'Tidal water power for milling and forges: +15% food on coasts.'},
 {k:'feverbark',n:'Fever-bark medicine',era:4,pre:[6,15],em:{b:1/14000,pop:2e6},pos:[0.6,-0.4],synth:1,d:'A bark remedy for marsh fevers: halves the malaria burden, plague deaths -20%.'},
 {k:'saltflush',n:'Salt-flushing canals',era:4,pre:[2,10],em:{b:1/12000,pop:1e6,press:1},pos:[0.7,0.3],synth:1,d:'Drainage that rinses salt from irrigated fields: reverses salinization.'},
 {k:'pigeon',n:'Courier birds',era:3,pre:[6,1],em:{b:1/14000,pop:8e5},pos:[-0.2,-0.6],synth:1,d:'Trained birds carry messages: reach +10% and faster spread of ideas.'},
];
// positions of the real techniques in the need/energy space (see techFit)
[[0.6,-0.6],[0.2,-0.5],[0.7,0.2],[0.1,0.5],[-0.2,0.4],[0.3,0.1],[-0.4,0],[0,0.5],[0.3,0.7],[-0.6,0.2],[-0.5,-0.1],[-0.4,0.5],[0,0.4],[0.2,0.8],[-0.6,-0.1],[0.7,0.1],[0.2,0.9],[-0.2,0.8],[0.3,-0.3],[0.5,-0.5]].forEach((p,k)=>{if(!TECH[k].pos)TECH[k].pos=p});
const TI={};TECH.forEach((t,k)=>TI[t.k]=k);
const SYNTH0=TECH.findIndex(t=>t.synth);
const ERAS=['Foraging','Neolithic','Bronze Age','Iron Age','Classical','Medieval','Gunpowder age','Age of Sail'];
function eraOf(i){
  const t=S.tk,v=k=>t[k][i]>0.5;
  if(v(17))return 7;if(v(16))return 6;
  if((v(13)+v(14)+v(15))>=2)return 5;
  if(v(8)&&(v(9)||v(10)))return 4;
  if(v(8))return 3;if(v(3))return 2;
  if((v(0)&&WD.sF[i]>0.1)||(v(1)&&WD.sH[i]>0.1))return 1;
  return 0;
}

/* ---------- history state ---------- */
let WD=null,S=null;
function newEth(par,par2,lang){
  const s=S,r=s.r,id=s.eths.length,p=par>=0?s.eths[par]:null,p2=par2>=0&&par2!=null?s.eths[par2]:null;
  if(!lang)lang=p2?hybridLang(p.lang,p2.lang,r):p?childLang(p.lang,r):null;
  const cult=new Float32Array(6);for(let k=0;k<6;k++)cult[k]=p?clamp((p2?(p.cult[k]+p2.cult[k])/2:p.cult[k])+gauss(r)*0.12,0,1):r();
  let hue,sat,lit;
  if(p){hue=p2?(p.hue+p2.hue)/2+gauss(r)*10:p.hue+gauss(r)*16;sat=clamp(p.sat+gauss(r)*0.05,0.32,0.72);lit=clamp(p.lit+gauss(r)*0.06,0.36,0.68)}
  else{hue=(s.famN*137.508+20)%360;sat=0.55;lit=0.52;s.famN++}
  const e={id,name:lang.lex.people,lang,cult,fam:p?p.fam:id,parent:p?par:-1,parent2:p2?par2:-1,depth:p?p.depth+1:0,born:s.year,hue,sat,lit,rgb:hsl(hue,sat,lit),alive:true,cells:0,pop:0,peak:0,lon:0,la:0,kids:[]};
  if(p)p.kids.push(id);if(p2)p2.kids.push(id);
  s.eths.push(e);return id;
}
function ethDist(a,b){
  if(a===b)return 0;if(a<0||b<0)return 1;const A=S.eths[a].cult,B=S.eths[b].cult;let d=0;
  for(let k=0;k<6;k++){const t=A[k]-B[k];d+=t*t}
  d=Math.sqrt(d/6)*1.6;if(S.eths[a].fam!==S.eths[b].fam)d+=0.35;return d>1?1:d;
}
const R_=o=>['pol',o.id,o.full],RB=o=>['pol',o.id,o.base],RE=e=>['eth',e.id,e.name],RF=f=>['fig',f.id,f.name],RR=x=>['rel',x.id,x.name],RW=w=>['war',w.id,w.name],RPl=o=>['plague',o.id,o.name],RM=m=>['mig',m.id,m.name];
function chron(t,txt,cell,refs,why){S.chron.push({y:S.year,t,txt,cell:cell==null?-1:cell,refs:refs||[],why:why||null});if(S.chron.length>30000)S.chron.splice(0,4000)}
function spot(txt,cell,refs){S.spot.push({y:S.year,txt,cell,refs:refs||[]});if(S.spot.length>60)S.spot.shift()}
function angDist(a,b){const w=WD;return Math.acos(clamp(w.x3[a]*w.x3[b]+w.y3[a]*w.y3[b]+w.z3[a]*w.z3[b],-1,1))}
function seedTech(f,c,v,rad){const w=WD;const cx=w.cxA[c],cy=w.cyA[c];
  for(let dy=-rad;dy<=rad;dy++){const y=cy+dy;if(y<0||y>=H)continue;for(let dx=-rad;dx<=rad;dx++){const j=y*W+(cx+dx+W)%W;if(w.land[j])f[j]=Math.max(f[j],v*(dx||dy?0.85:1))}}}
function nearestPeopled(c,maxR,test){
  const w=WD,s=S;let best=-1,bd=1e9;const cx=w.cxA[c],cy=w.cyA[c];
  for(let dy=-maxR;dy<=maxR;dy++){const y=cy+dy;if(y<0||y>=H)continue;for(let dx=-maxR;dx<=maxR;dx++){const j=y*W+(cx+dx+W)%W;
    if(!w.land[j]||s.pop[j]<1||(test&&!test(j)))continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=j}}}
  return best;
}
function ring(c,rad,f){const w=WD,cx=w.cxA[c],cy=w.cyA[c];for(let dy=-rad;dy<=rad;dy++){const y=cy+dy;if(y<0||y>=H)continue;for(let dx=-rad;dx<=rad;dx++)f(y*W+(cx+dx+W)%W,dx,dy)}}
function dirWord(dx,dy){const a=Math.atan2(-dy,dx)*180/Math.PI;const k=Math.round(((a+360)%360)/45)%8;return['east','north-east','north','north-west','west','south-west','south','south-east'][k]}
function dxWrap(a,b){let d=WD.cxA[b]-WD.cxA[a];if(d>W/2)d-=W;if(d<-W/2)d+=W;return d}
const EARTH_HEARTHS=[
 {kind:'farm',lat:36.5,lon:40,y:-9000,crop:'wheat and barley',anim:'sheep and goats',grain:1},
 {kind:'farm',lat:30.5,lon:112,y:-7500,crop:'rice',anim:'pigs',grain:1},
 {kind:'farm',lat:35,lon:109,y:-7000,crop:'millet',anim:'pigs and dogs',grain:1},
 {kind:'farm',lat:-6,lon:145,y:-7000,crop:'taro and bananas',anim:'pigs',grain:0},
 {kind:'farm',lat:18,lon:-97,y:-5000,crop:'maize, beans and squash',anim:'turkeys and dogs',grain:1},
 {kind:'farm',lat:-13,lon:-72,y:-5000,crop:'potatoes and quinoa',anim:'llamas and guinea pigs',grain:0.9},
 {kind:'farm',lat:14,lon:2,y:-3000,crop:'sorghum and pearl millet',anim:'cattle',grain:1},
 {kind:'farm',lat:37,lon:-88,y:-2500,crop:'sunflowers and squash',anim:'dogs',grain:0.6},
 {kind:'copper',lat:39,lon:35,y:-4700},
 {kind:'copper',lat:36,lon:104,y:-2600},
 {kind:'copper',lat:-14,lon:-72,y:-1200},
 {kind:'horse',lat:48,lon:50,y:-3700},
 {kind:'sail',lat:37,lon:25,y:-3500},
 {kind:'sail',lat:23.5,lon:120.5,y:-3000},
 {kind:'camel',lat:22,lon:50,y:-1200},
 {kind:'ard',lat:33,lon:44,y:-4300},
 {kind:'irrig',lat:32,lon:45.5,y:-5500},
 {kind:'irrig',lat:26.5,lon:32.5,y:-4200},
 {kind:'irrig',lat:28,lon:68.5,y:-3800},
 {kind:'irrig',lat:-10.8,lon:-77.2,y:-3000},
 {kind:'irrig',lat:35,lon:110.5,y:-2800},
];
const EARTH_SEEDS=[[5,25,'afr'],[33,40,'afro'],[48,10,'ie'],[22,78,'indo'],[35,110,'sino'],[5,105,'aus'],[-25,134,'pama'],[60,100,'alt'],[40,-100,'nam'],[-10,-60,'sam']];

function newHistory(hseed){
  const w=WD,r=mulberry32(hashStr('hist:'+hseed+':'+w.seed));
  const tk=TECH.map(()=>new Float32Array(N));
  S={r,initialRules:{...P},seed:hseed,year:P.startYear,start:P.startYear,famN:0,tk,
    settled:new Uint16Array(N),pop:new Float32Array(N),K:new Float32Array(N),eth:new Int32Array(N).fill(-1),eth2:new Int32Array(N).fill(-1),mix:new Float32Array(N),mixT:new Uint8Array(N),
    pol:new Int32Array(N),s:new Float32Array(N).fill(0.3),rel:new Int32Array(N).fill(-1),fort:new Float32Array(N),
    fert:new Float32Array(N).fill(1),immune:new Float32Array(N),infect:new Uint8Array(N),ob:new Int32Array(N).fill(-1),
    dist:new Uint16Array(N).fill(65535),taken:new Int32Array(N).fill(-1e9),q:new Int32Array(N),lab:new Int32Array(N),city:new Int32Array(N).fill(-1),
    AG:new Float32Array(AGW*AGH),anom:new Float32Array(N),wm:new Float32Array(N).fill(1),dT:0,dTt:0,gT:0,epoch:null,dry:null,orbM:0,orb0:0,
    eths:[],pols:[null],alive:[],chron:[],outbreaks:[],inf:[],stats:[],hearths:[],figs:[],rels:[],wars:[],activeWars:[],cities:[],migs:[],activeMigs:[],press:new Map(),
    spot:[],famTitle:{},isleName:{},isleBy:{},lmPop:new Int32Array(w.lmCount),fallen:[],darkWatch:[],epochs:[],
    historicalAtlas:newHistoricalAtlas(),firstTech:new Array(TECH.length).fill(null),lmFound:new Uint8Array(w.lmCount),regionFirst:{},medBest:{share:0,y:null,pol:0},chinaHist:[],medHist:[],farmCheck:null};
  const s=S;
  s.farm=tk[0];s.herd=tk[1];s.irrig=tk[2];s.metal=tk[3];s.horse=tk[4];s.sail=tk[5];s.admin=tk[6];s.wheel=tk[7];s.iron=tk[8];s.coin=tk[9];s.law=tk[10];s.roads=tk[11];s.nav=tk[12];s.caval=tk[13];s.paper=tk[14];s.crops=tk[15];s.gun=tk[16];s.ocean=tk[17];s.camel=tk[18];s.grain=tk[19];s.ard=tk[20];s.plough=tk[21];s.manure=tk[22];s.xcrops=tk[23];s.integ=new Float32Array(N);s.uni=new Float32Array(N);s.uniFam=new Int32Array(N).fill(-1);
  prepEco(w);Object.assign(s,{forest:Float32Array.from(w.forest0),salt:new Float32Array(N),adapt:new Float32Array(N),dp:new Float32Array(N),poolNext:new Float32Array(N),car:new Float32Array(N),exit:new Float32Array(N),circE:Float32Array.from(w.circ),rp:new Float32Array(N),routes:[],carPairs:new Set(),cropX:new Set(),seaRoutes:new Map(),seaDiasporas:new Map(),colonies:new Map(),bfsPar:new Int32Array(N),bfsD:new Int16Array(N),bfsMark:new Int32Array(N),bfsStamp:0});
  for(const i of w.landIdx)s.adapt[i]=w.mal[i]*0.5;
  s.orb0=w.isEarth?null:(r()*23000);
  for(const i of w.coastIdx)s.sail[i]=0.05;
  for(let k=0;k<s.AG.length;k++)s.AG[k]=gauss(r);
  climateStep();computeK();
  const seeds=[],macs=[];
  if(w.isEarth){
    const pool=MACRO_KEYS.slice();for(let i=pool.length-1;i>0;i--){const j=(r()*(i+1))|0;[pool[i],pool[j]]=[pool[j],pool[i]]}
    EARTH_SEEDS.forEach(([la,lo,mac],k)=>{let c=cellAt(la,lo);if(!w.land[c]){for(let kk=1;kk<15&&!w.land[c];kk++)c=cellAt(la,lo+kk*0.9)}if(w.land[c]){seeds.push(c);macs.push(P.shuffleNames?pool[k%pool.length]:mac)}})}
  else{let sep=0.38;
    for(let t=0;t<20000&&seeds.length<P.bands;t++){if(t%4000===3999)sep*=0.7;
      const i=w.landIdx[(r()*w.landIdx.length)|0];if(w.T[i]<4||w.Pr[i]<350||w.lmSize[w.lm[i]]<20)continue;
      if(seeds.every(j=>angDist(i,j)>sep)){seeds.push(i);macs.push(MACRO_KEYS[(seeds.length-1+((r()*MACRO_KEYS.length)|0))%MACRO_KEYS.length])}}}
  const q=s.q;let h=0,t=0;
  seeds.forEach((i,k)=>{const mac=macs[k];s.eth[i]=newEth(-1,-1,makeLang(r,pick(r,MACROS[mac]),mac));q[t++]=i});
  while(h<t){const i=q[h++];
    for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0&&w.land[j]&&s.eth[j]<0&&w.T[j]>-9){s.eth[j]=s.eth[i];q[t++]=j}}
    if(w.coast[i]){ring(i,3,j=>{if(w.land[j]&&s.eth[j]<0&&w.T[j]>-9){s.eth[j]=s.eth[i];q[t++]=j}})}
  }
  for(const i of w.landIdx)if(s.eth[i]>=0){s.pop[i]=s.K[i]*0.55;s.lmFound[w.lm[i]]=1}
  for(let k=0;k<10;k++)ethPass(false);
  if(w.isEarth&&P.hearthMode!=='random'){
    for(const hh of EARTH_HEARTHS){if(hh.y<s.start)continue;s.hearths.push(Object.assign({},hh,{cell:cellAt(hh.lat,hh.lon),year:hh.y,done:false,fixed:true}))}
  }else{
    const cand=[];for(const i of w.landIdx)if(w.sF[i]>0.45&&w.lmSize[w.lm[i]]>40)cand.push(i);
    const hs=[];
    for(let t2=0;t2<4000&&hs.length<P.hearths&&cand.length;t2++){const i=cand[(r()*cand.length)|0];if(r()>w.sF[i]*(0.6+0.4*w.rv[i]))continue;if(hs.every(j=>angDist(i,j)>0.32))hs.push(i)}
    hs.forEach((c,k)=>s.hearths.push({kind:'farm',cell:c,year:s.start+(k===0?200+r()*900:400+r()*5500)|0,done:false}));
    s.hearths.push({kind:'sail',year:s.start+1500+r()*3000|0,done:false});
    s.hearths.push({kind:'copper',year:s.start+3800+r()*1800|0,done:false});
    s.hearths.push({kind:'horse',year:s.start+4000+r()*1500|0,done:false});
    s.hearths.push({kind:'camel',year:s.start+6500+r()*1500|0,done:false});
    s.hearths.push({kind:'ard',year:s.start+4300+r()*1500|0,done:false});
    s.hearths.push({kind:'irrig',year:s.start+3500+r()*1500|0,done:false});
  }
  chron('nature',`Foragers of ${seeds.length} unrelated stocks people the habitable world.`,seeds[0]);
  recordStats();recordAtlasHistory();
}

/* ---------- climate through time ---------- */
const EPOCH_KINDS=[
 {k:'cold',w:0.5,amp:[-1.3,-0.7],dur:[150,380],start:'A long cold epoch sets in: growing seasons shorten and the northern edge of farming retreats.',end:'The long cold epoch eases.'},
 {k:'warm',w:0.3,amp:[0.5,0.9],dur:[150,320],start:'A warm epoch begins: harvests improve in the north and farming creeps toward the poles.',end:'The warm epoch fades.'},
 {k:'dry',w:0.2,amp:[-1.6,-1.0],dur:[80,250],start:'A great drought settles over the',end:'Rain returns to the'},
];
function climateStep(){
  const s=S,r=s.r,y=s.year;
  s.gT+=-s.gT/150+0.35*Math.sqrt(2/150)*gauss(r);
  if(s.epoch){const e=s.epoch;
    if(y>=e.end){const K=EPOCH_KINDS.find(k=>k.k===e.k);chron('nature',e.k==='dry'?`${K.end} ${e.where} after ${y-e.start} years.`:`${K.end}`,e.cell);e.done=true;s.epoch=null}}
  else if(r()<0.0007*P.epochs){
    let u=r(),K=EPOCH_KINDS[0];for(const k of EPOCH_KINDS){if(u<k.w){K=k;break}u-=k.w}
    const amp=K.amp[0]+r()*(K.amp[1]-K.amp[0]),dur=Math.round(K.dur[0]+r()*(K.dur[1]-K.dur[0]));
    const e={k:K.k,start:y,end:y+dur,amp,cell:-1,where:''};
    if(K.k==='dry'){const L=WD.landIdx;let c=-1;for(let t=0;t<200;t++){const i=L[(r()*L.length)|0];if(s.pop[i]>1000&&WD.T[i]>5){c=i;break}}
      if(c<0)return;e.cell=c;e.cx=WD.cxA[c];e.cy=WD.cyA[c];e.rad=10+r()*12;e.where=regionName(c);
      chron('nature',`${K.start} ${e.where}; it will last for generations.`,c)}
    else chron('nature',K.start,-1);
    s.epoch=e;s.epochs.push(e);
  }
  // orbital forcing of the subtropical monsoon
  if(WD.isEarth)s.orbM=1/(1+Math.exp((y+3300)/320));
  else s.orbM=0.5+0.5*Math.cos(2*Math.PI*(y-s.orb0)/23000);
}
function epochTemp(){const e=S.epoch;if(!e||e.k==='dry')return 0;const y=S.year,ramp=Math.min(1,(y-e.start)/40,(e.end-y)/40);return e.amp*Math.max(0,ramp)}
function regionName(c){const la=WD.lat[c]*180/Math.PI,lo=(WD.cxA[c]+0.5)/W*360-180;
  const e=S.eth[c]>=0?S.eths[S.eth[c]]:null;return e?`lands of the ${e.name}`:`region near ${Math.abs(la).toFixed(0)}°${la>=0?'N':'S'}, ${Math.abs(lo).toFixed(0)}°${lo>=0?'E':'W'}`}

/* ---------- yearly processes ---------- */
function weather(){
  const s=S,w=WD,g=s.AG,phi=P.climPersist,sd=Math.sqrt(1-phi*phi),r=s.r,cv=0.28*P.climVar;
  for(let k=0;k<g.length;k++)g[k]=phi*g[k]+sd*gauss(r);
  const L=w.landIdx,wi=w.wi,wf=w.wf,e=s.epoch&&s.epoch.k==='dry'?s.epoch:null;
  let ramp=0;if(e)ramp=Math.max(0,Math.min(1,(s.year-e.start)/20,(e.end-s.year)/20));
  for(let k=0;k<L.length;k++){const i=L[k],fx=wf[i*2],fyy=wf[i*2+1];
    let a=(g[wi[i*4]]*(1-fx)+g[wi[i*4+1]]*fx)*(1-fyy)+(g[wi[i*4+2]]*(1-fx)+g[wi[i*4+3]]*fx)*fyy;
    if(e){let dx=Math.abs(w.cxA[i]-e.cx);if(dx>W/2)dx=W-dx;const d2=(dx*dx+(w.cyA[i]-e.cy)**2)/(e.rad*e.rad);if(d2<1)a+=e.amp*ramp*(1-d2)}
    s.anom[i]=a;s.wm[i]=Math.exp(cv*a)}
}
function computeK(){
  const s=S,w=WD,L=w.landIdx,dT=s.dT+s.gT+epochTemp(),orb=s.orbM;
  for(let k=0;k<L.length;k++){
    const i=L[k],T=w.T[i]+dT;
    if(T<-9){s.K[i]=1;continue}
    const wm=s.wm[i],mz=w.monZone[i],Pn=w.Pr[i]*wm+orb*mz*420,ar=w.area[i],rv=w.rv[i];
    const npp=Math.min(3000/(1+Math.exp(1.315-0.119*(T+w.amp[i]*0.15))),3000*(1-Math.exp(-0.000664*Pn)));
    const Kf=ar*0.1*npp/1000*(1+0.5*w.coast[i]+0.4*rv);
    const dry=clamp(wm,0.3,1.6);
    let sh=w.sH[i];if(mz>0)sh=Math.max(sh,orb*mz*0.7);if(w.desert[i])sh=Math.max(sh,0.25*s.camel[i]);
    const Kh=ar*1.6*sh*s.herd[i]*Math.min(1.3,dry)*(1+0.2*s.horse[i])*(1-s.rp[i]);
    const irr=s.irrig[i]*rv;
    const wf=1+(Math.min(dry,1.25)-1)*(1-0.75*irr);
    const T_=s.tk,hv=w.heavy[i],lc=w.leach[i];
    let Kfa=ar*3.5*Math.max(w.sF[i],0.7*w.rv[i]*s.irrig[i])*s.farm[i]*s.fert[i]*wf*(1+0.8*s.metal[i]+0.9*s.iron[i]*(1-0.4*lc)+3.0*s.crops[i]+0.7*s.admin[i]+0.55*s.ard[i]*(1-0.6*hv)+0.7*s.plough[i]*hv+0.6*s.manure[i]+s.xcrops[i]*(0.25+0.8*lc+0.5*w.trop[i]+0.3*(1-w.sF[i]))+0.4*T_[26][i]*Math.max(lc,s.forest[i])+0.15*T_[28][i]*w.coast[i])*(1+rv*(0.25+2.2*s.irrig[i]));
    // Terraces, canals and managed fertility recover some highland valley yield.
    Kfa*=1+0.65*w.rough[i]*Math.max(s.irrig[i],s.manure[i],s.admin[i]);
    Kfa*=(0.45+0.55*(1-s.forest[i]))*(1-0.6*s.salt[i])*(1-0.5*w.oncho[i]);
    if(w.T[i]<12)Kfa*=clamp(1+0.18*dT,0.4,1.35);
    // heavy, wet temperate forest soils: hard to clear and work until iron axes and ploughs
    if(hv>0)Kfa*=1-0.7*hv*(1-Math.max(s.plough[i],0.4*s.iron[i]));
    s.K[i]=Math.max(1,Kf,Kh+0.4*Kf,Kfa+0.3*Kh+0.2*Kf)*(1-0.5*w.mal[i]*(1-s.adapt[i])*(1-0.5*s.tk[29][i]));
  }
}
function growth(){
  const s=S,w=WD,L=w.landIdx,g=P.growth,dg=P.degrade;
  for(let k=0;k<L.length;k++){const i=L[k];let p=s.pop[i];if(p<=0){s.settled[i]=0;continue}const K=s.K[i];
    // Durable farming settlements need generations to build political institutions.
    s.settled[i]=s.farm[i]>=0.5?Math.min(2000,s.settled[i]+1):Math.max(0,s.settled[i]-2);
    if(p<K)p+=g*p*(1-p/K)*(0.6+0.4*Math.min(1,s.farm[i]+0.5*s.herd[i]));else{const ex=(p-K)*0.2;p-=ex;if(!s.pol[i]&&p>1.2*K&&p>20000&&s.eth[i]>=0)pushPressure(s.eth[i],ex*0.35,i,0,null)}
    if(p<0.5){p=0;s.eth[i]=-1;s.eth2[i]=-1;s.rel[i]=-1}
    s.pop[i]=p;
    const pr=p/K,fm=s.farm[i];
    if(fm>0.3&&w.sF[i]>0.1){const silt=clamp(w.rv[i]*1.5,0,0.8),lc=w.leach[i];
      if(pr>0.7)s.fert[i]=Math.max(0.3,s.fert[i]-dg*0.0012*(pr-0.7)*fm*(1+1.5*lc)*(1-0.45*s.crops[i])*(1-0.5*s.manure[i])*(1-silt));
      s.fert[i]+=0.0025*(1-s.fert[i])*(1+0.6*s.herd[i]*w.sH[i]+(pr<0.5?1+lc:0));
      if(s.forest[i]<0.15&&w.rough[i]>0.3)s.fert[i]=Math.max(0.3,s.fert[i]-0.0003*w.rough[i]*fm);
      const ir=s.irrig[i]*Math.min(1,w.rv[i]*2);
      if(ir>0.1&&w.Pr[i]<550&&pr>0.5)s.salt[i]=Math.min(0.85,s.salt[i]+0.0004*ir*Math.min(1.2,pr)*(1-0.9*s.tk[30][i]));
      if(s.salt[i]>0&&(pr<0.3||s.tk[30][i]>0.5))s.salt[i]=Math.max(0,s.salt[i]-0.0004-0.002*s.tk[30][i])}
    const f0=w.forest0[i];
    if(f0>0){let fo=s.forest[i];
      // farmers clear forest when they need land; with stone and bronze tools it is slow work, iron axes speed it
      if(fm>0.2&&pr>0.6)fo-=0.0015*fm*Math.min(1,(pr-0.6)*2.5)*fo*(1+2.5*s.iron[i]+0.5*s.metal[i]);
      else fo+=0.004*(f0-fo)*(1-0.6*s.herd[i]*Math.min(1,pr*3));
      s.forest[i]=clamp(fo,0,f0)}
    if(s.rp[i]>0)s.rp[i]*=0.96;
    if(w.mal[i]>0)s.adapt[i]+=0.0012*w.mal[i]*Math.max(0,0.55-s.adapt[i]);
  }
}
function mixIn(j,e,share){const s=S;if(e<0||e===s.eth[j])return;if(s.eth2[j]===e)s.mix[j]=Math.min(1,s.mix[j]+share);else if(s.eth2[j]<0||share>s.mix[j]){s.eth2[j]=e;s.mix[j]=share;s.mixT[j]=0}}
function migrate(){
  const s=S,w=WD,L=w.landIdx,r=s.r,mg=P.migration,rev=s.year&1,T=s.tk;
  for(let kk=0;kk<L.length;kk++){
    const i=L[rev?L.length-1-kk:kk],p=s.pop[i];if(p<1)continue;
    const pr=p/s.K[i];if(pr<0.55)continue;
    const j=w.nb[i*4+((r()*4)|0)];if(j<0||!w.land[j])continue;
    const kj=s.K[j];if(kj<2&&w.sF[j]<0.05&&w.sH[j]<0.05)continue;
    const ar=w.area[j],kE=Math.max(kj,ar*3*w.sF[j]*s.farm[i]*(1+0.6*s.metal[i]+0.6*s.iron[i]),ar*1.1*w.sH[j]*s.herd[i]);
    const pj=s.pop[j],prj=pj/kE,diff=pr-prj;if(diff<0.1)continue;
    let mob=mg*(0.08+0.25*s.herd[i]*w.sH[i]*(0.5+s.horse[i]));
    if(s.pol[j]&&s.pol[j]!==s.pol[i])mob*=0.4;
    else if(s.pol[i]&&!s.pol[j]){const o=s.pols[s.pol[i]];if(o.kind==='state')mob*=1+2*Math.max(0,(o.burden||0)-0.7)+1.5*Math.max(0,(o.ineq||0)-0.5)}
    const mv=Math.min(p*mob*diff/(1+diff),p*0.3);
    s.pop[i]-=mv;s.pop[j]+=mv;
    if(pj<1||s.eth[j]<0){s.eth[j]=s.eth[i];s.eth2[j]=-1;s.rel[j]=s.rel[i];s.s[j]=s.s[i];s.adapt[j]=s.adapt[i];for(const f of T)f[j]=Math.max(f[j],f[i]*0.9)}
    else if(s.eth[j]!==s.eth[i]){mixIn(j,s.eth[i],mv/(pj+mv)*0.6);if(s.eth2[j]===s.eth[i]&&s.mix[j]>0.5){const a=s.eth[j];s.eth[j]=s.eth2[j];s.eth2[j]=a;s.mix[j]=1-s.mix[j]}for(const f of T)f[j]=Math.max(f[j],f[i]*0.8)}
  }
}
function virginSoil(tgt,src){
  const s=S,r=s.r;
  const gap=s.dp[src]-s.dp[tgt];
  if(gap>0.2&&!s.infect[tgt]&&s.pop[tgt]>1000&&r()<0.35*gap){
    const e=s.eths[s.eth[src]];
    const o={id:s.outbreaks.length,name:`${e?cap(e.lang.lex.sea)+' ':''}${pick(r,PLAGUE)}`,origin:tgt,year:s.year,deaths:0,vir:0.12+0.25*gap+r()*0.08,cells:1,active:1,done:false,spread:[[0,tgt]],hit:new Set(),virgin:true,from:s.eth[src],dp:s.dp[src]};
    s.outbreaks.push(o);s.infect[tgt]=3;s.ob[tgt]=o.id;s.inf.push(tgt);
  }
}
// Voyage ranges are kilometres, independent of latitude and map resolution.
function voyageRange(i){
  return 120+1400*S.sail[i]+(S.nav[i]>0.5?1500:0)+(S.ocean[i]>0.5?8500:0);
}
function traceVoyage(i,bearing,rangeKm){
  const w=WD,lat=w.lat[i],lon=(w.cxA[i]+0.5)/W*2*Math.PI-Math.PI;
  const sinLat=Math.sin(lat),cosLat=Math.cos(lat),path=[i];let water=false;
  // Great-circle arcs respect the date line and do not jump across continents.
  for(let km=45;km<=rangeKm;km+=45){
    const d=km/6371,la=Math.asin(clamp(sinLat*Math.cos(d)+cosLat*Math.sin(d)*Math.cos(bearing),-1,1));
    const lo=lon+Math.atan2(Math.sin(bearing)*Math.sin(d)*cosLat,Math.cos(d)-sinLat*Math.sin(la));
    const j=cellAt(la*180/Math.PI,lo*180/Math.PI);
    if(path[path.length-1]!==j)path.push(j);
    if(!w.land[j]){if(w.T[j]<-5)return null;water=true;continue}
    if(water)return w.T[j]>-9?{from:i,to:j,km,path,bearing}:null;
    if(km>180)return null; // leave the coastal cell, never march across land
  }
  return null;
}
function seaContact(voyage){
  const s=S,w=WD,i=voyage.from,tgt=voyage.to;
  if(s.pop[i]<30||s.eth[i]<0)return;
  tryIndependentColony(voyage);
  if(s.pop[tgt]<1){
    s.pop[tgt]=Math.min(60+s.pop[i]*0.02,s.K[tgt]*0.5+1);s.eth[tgt]=s.eth[i];s.rel[tgt]=s.rel[i];s.s[tgt]=0.4;
    for(const f of s.tk)f[tgt]=Math.max(f[tgt],f[i]*0.8);s.admin[tgt]*=0.3;
    const lm=w.lm[tgt];
    if(!s.lmFound[lm]){s.lmFound[lm]=1;if(w.lmSize[lm]>=4){const e=s.eths[s.eth[i]];chron('migration',`Seafarers of the ${e.name} reach an unpeopled ${w.lmSize[lm]>60?'land':'island'}.`,tgt,[RE(e)])}}
  }else if(s.eth[tgt]!==s.eth[i]){
    for(const f of s.tk)f[tgt]=Math.max(f[tgt],f[i]*0.5);
    if(s.ocean[i]>0.5&&w.lm[tgt]!==w.lm[i]){
      virginSoil(tgt,i);cropExchange(i,tgt);
      const e1=s.eths[s.eth[i]],e2=s.eths[s.eth[tgt]],key=[e1.fam,e2.fam].sort().join(':');
      if(!s.contacts)s.contacts=new Set();
      if(e1.fam!==e2.fam&&!s.contacts.has(key)&&w.lmSize[w.lm[tgt]]>200){
        s.contacts.add(key);chron('migration',`Ocean-going ships of the ${e1.name} make landfall among the ${e2.name}, across the open ocean. A return sea route opens for trade and ideas.`,tgt,[RE(e1),RE(e2)]);
        spot(`Ships of the ${e1.name} reach the ${e2.name} across the ocean`,tgt,[RE(e1),RE(e2)]);
      }
    }
  }
  // First contact is not conquest: no automatic replacement of existing peoples.
  if(voyage.km>=500&&s.nav[i]>0.5&&s.pop[tgt]>=1){
    const key=[i,tgt].sort((a,b)=>a-b).join(':');
    const route=s.seaRoutes.get(key);
    if(route)route.last=s.year;
    else{
      if(s.seaRoutes.size>=128){
        // Local traffic must not fill the route budget before an ocean discovery.
        let drop=null;
        for(const entry of s.seaRoutes){if(!drop||entry[1].last<drop[1].last||(entry[1].last===drop[1].last&&entry[1].km<drop[1].km))drop=entry}
        s.seaRoutes.delete(drop[0]);
      }
      s.seaRoutes.set(key,{...voyage,born:s.year,last:s.year});
    }
  }
}
function seaTrade(){
  const s=S;if(s.year%5!==0)return;
  let scouts=0;
  for(const [key,R] of [...s.seaRoutes]){
    if(!s.seaRoutes.has(key))continue;
    const a=R.from,b=R.to;
    if(s.pop[a]<1||s.pop[b]<1||Math.max(voyageRange(a),voyageRange(b))<R.km){
      if(s.year-R.last>50)s.seaRoutes.delete(key);continue;
    }
    R.last=s.year;
    tryIndependentColony(R);
    tryIndependentColony({...R,from:b,to:a});maritimePassengerExchange(R);
    if(s.year%20===0&&scouts<8&&s.pop[a]>=20000&&s.ocean[a]>=0.7&&!s.colonies.has(b)){scouts++;scoutColonyCoast(R)}
    // Return voyages carry knowledge both ways; mature techniques take decades.
    for(const f of s.tk){const d=(f[a]-f[b])*0.08*P.techDiff;if(d>0)f[b]=Math.min(1,f[b]+d);else f[a]=Math.min(1,f[a]-d)}
    cropExchange(a,b);virginSoil(b,a);virginSoil(a,b);
  }
}
function seaHop(){
  const s=S,w=WD,r=s.r,C=w.coastIdx;if(!C.length||P.seafaring<=0)return;
  seaTrade();
  // Developed ports actively outfit expeditions, instead of being drowned out
  // by thousands of coast cells that know little about ocean sailing.
  const ports=C.filter(i=>s.pop[i]>=1000&&s.nav[i]>0.5&&s.ocean[i]>0.5);
  const ex=(C.length*0.004+Math.min(8,ports.length*0.025))*P.seafaring;
  let tries=Math.floor(ex)+(r()<ex%1?1:0),attempt=0;
  while(tries-->0){
    const pool=ports.length&&attempt++%3===0?ports:C,i=pool[(r()*pool.length)|0];
    if(s.pop[i]<30||s.eth[i]<0||r()>0.04+0.5*s.sail[i])continue;
    let bearing=r()*2*Math.PI;
    // Trade winds favour westward tropical passages; westerlies favour return
    // passages further poleward. Other headings remain available to explorers.
    if(s.ocean[i]>0.5&&r()<0.5)bearing=(Math.abs(w.lat[i])<Math.PI/6?1.5:0.5)*Math.PI+gauss(r)*0.65;
    const voyage=traceVoyage(i,bearing,voyageRange(i));if(voyage)seaContact(voyage);
  }
}
function firstTech(k,cell,o){
  const s=S;if(s.firstTech[k])return;s.firstTech[k]={y:s.year,cell,pol:o?o.id:0,eth:s.eth[cell]};
  const t=TECH[k],e=s.eths[s.eth[cell]]||null;
  const where=o?`the ${o.full}`:e?`the ${e.name}`:'a distant people';
  const refs=o?[R_(o)]:e?[RE(e)]:[];
  const verb={plough:'forge a heavy iron plough that turns the wet, clay soils',manure:'begin to gather manure and night soil to feed their fields',kitesig:'fly signal kites to send orders across the realm',windcart:'build sail-driven wagons that cross the flat deserts',fungal:'cultivate fungal gardens on the forest floor',ledger:'build geared engines to keep the treasury accounts',tidemill:'harness the tides to turn mills and forge hammers',feverbark:'brew a bark remedy that tames the marsh fevers',saltflush:'dig flushing canals that rinse the salt from their fields',pigeon:'train birds to carry messages between cities',irrig:'dig the first irrigation canals',wheel:'build the first wheeled carts and chariots',writing:'develop writing and accounting systems',iron:'learn to smelt iron',coin:'strike the first coins',law:'write down the first law code',roads:'lay the first long paved roads',nav:'learn to steer by the stars across open seas',caval:'field the first armoured horsemen',paper:'develop portable records for administration and navigation',crops:'intensify farming with managed fields, rotations and intercropping',gun:'make the first gunpowder weapons',ocean:'build ocean-going ships and prepare charts for long voyages'}[t.k];
  if(verb){chron('ideas',`Scholars and craftsmen of ${where} ${verb}${t.synth?', a path our own history never took':''}.`,cell,refs);if(k>=8)spot(`${t.n} first appears in ${where}`,cell,refs)}
}
function techStep(a0,b0){if(a0==null){a0=0;b0=1}
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
}
function hearthCheck(){
  const s=S,w=WD,r=s.r,y=s.year;
  for(const h of s.hearths){if(h.done||y<h.year)continue;
    let c=h.cell;
    if(h.fixed){c=nearestPeopled(h.cell,4,h.kind==='farm'?j=>w.sF[j]>0.15:null);if(c<0){h.year=y+20;continue}}
    if(h.kind==='farm'){
      if(s.pop[c]<1||s.eth[c]<0){h.year=y+20;continue}
      seedTech(s.farm,c,1,2);seedTech(s.herd,c,0.6,1);s.firstTech[0]=s.firstTech[0]||{y,cell:c};s.firstTech[1]=s.firstTech[1]||{y,cell:c};
      let crop=h.crop,anim=h.anim,gr=h.grain;if(!crop){[crop,anim,gr]=cropFor(w.T[c],w.Pr[c],w.rv[c])}
      seedTech(s.grain,c,gr==null?1:gr,2);s.firstTech[19]=s.firstTech[19]||{y,cell:c};
      const e=s.eths[s.eth[c]];chron('ideas',`Among the ${e.name}, people begin to sow ${crop} and keep ${anim}.`,c,[RE(e)]);h.done=true;
    }else{
      if(!h.fixed){let best=-1,bp=0;
        for(let t=0;t<500;t++){const i=w.landIdx[(r()*w.landIdx.length)|0];if(s.pop[i]<1||s.eth[i]<0)continue;
          let ok=false;
          if(h.kind==='copper')ok=s.farm[i]>0.5&&w.rough[i]>0.2;
          else if(h.kind==='horse')ok=w.sH[i]>0.45&&w.sF[i]<0.35&&s.herd[i]>0.2;
          else if(h.kind==='camel')ok=s.herd[i]>0.3&&(w.desert[i]||w.Pr[i]<350);
          else if(h.kind==='ard')ok=s.farm[i]>0.8&&s.herd[i]>0.5&&!w.tsetse[i]&&w.Pr[i]<900;
          else if(h.kind==='irrig')ok=s.farm[i]>0.6&&(w.desert[i]||w.Pr[i]<600)&&w.rv[i]>0.04;
          else ok=w.coast[i]&&s.pop[i]>200;
          if(ok&&s.pop[i]>bp){bp=s.pop[i];best=i}}
        if(best<0){h.year=y+25;continue}c=best}
      if(s.eth[c]<0){h.year=y+20;continue}
      const e=s.eths[s.eth[c]];
      if(h.kind==='copper'){seedTech(s.metal,c,1,1);chron('ideas',`Smiths among the ${e.name} learn to smelt copper, and later bronze.`,c,[RE(e)]);s.firstTech[3]=s.firstTech[3]||{y,cell:c}}
      else if(h.kind==='horse'){seedTech(s.horse,c,1,1);seedTech(s.herd,c,1,1);chron('ideas',`On the grasslands, the ${e.name} tame and ride the horse.`,c,[RE(e)]);s.firstTech[4]=s.firstTech[4]||{y,cell:c}}
      else if(h.kind==='ard'){seedTech(s.ard,c,1,1);chron('ideas',`Farmers among the ${e.name} yoke oxen to a scratch plough; one family can now till far more land.`,c,[RE(e)]);s.firstTech[20]=s.firstTech[20]||{y,cell:c}}
      else if(h.kind==='irrig'){seedTech(s.irrig,c,1,2);chron('ideas',`The ${e.name} dig canals and ditches to carry river water onto their fields.`,c,[RE(e)]);s.firstTech[2]=s.firstTech[2]||{y,cell:c}}
      else if(h.kind==='camel'){seedTech(s.camel,c,1,2);chron('ideas',`The ${e.name} tame the camel; the deserts begin to open to caravans and raiders.`,c,[RE(e)]);s.firstTech[18]=s.firstTech[18]||{y,cell:c}}
      else{seedTech(s.sail,c,1,1);chron('ideas',`The ${e.name} build boats that can cross open sea.`,c,[RE(e)])}
      h.done=true;
    }
  }
}
function cropFor(T,Pp,rv){
  if(T>22&&Pp>1500)return['yams and taro','pigs and fowl',0];
  if(T>20&&Pp>1000)return[rv>0.3?'rice':'millet and rice','pigs and water buffalo',1];
  if(T>17&&Pp<900)return['sorghum and millet','cattle',1];
  if(T>=9&&(Pp<800||rv>0.3))return['wheat and barley','sheep and goats',1];
  if(T<9)return['rye and oats','cattle and sheep',1];
  return['maize and beans','turkeys and dogs',1];
}
const PLAGUE=['fever','pox','sweat','plague','flux','ague'];
function disease(){
  const s=S,w=WD,r=s.r,L=w.landIdx,dz=P.disease;
  for(let t=0;t<40;t++){
    const i=L[(r()*L.length)|0];if(s.pop[i]<1||s.infect[i])continue;
    const dens=s.pop[i]/w.area[i];
    if(r()<dz*0.0002*dens*(s.farm[i]+s.herd[i])){
      const e=s.eth[i]>=0?s.eths[s.eth[i]]:null;
      const o={id:s.outbreaks.length,name:`${e?cap(e.lang.lex.river)+' ':''}${pick(r,PLAGUE)}`,origin:i,year:s.year,deaths:0,vir:0.04+r()*0.13,cells:1,active:1,done:false,spread:[[0,i]],hit:new Set()};
      s.outbreaks.push(o);s.infect[i]=3;s.ob[i]=o.id;s.inf.push(i);
    }
  }
  const nl=[];
  for(const o of s.outbreaks)if(!o.done)o.active=0;
  for(const i of s.inf){if(!s.infect[i])continue;
    const o=s.outbreaks[s.ob[i]],dens=s.pop[i]/w.area[i];
    const m=Math.min(0.7,o.vir*(1-s.immune[i])*(0.5+0.5*Math.min(1,dens/15))*(o.virgin?1+2.5*Math.max(0,(o.dp||0)-s.dp[i]):1)*(1-0.2*s.tk[29][i])),dd=s.pop[i]*m;
    s.pop[i]-=dd;o.deaths+=dd;o.active++;
    if(s.pol[i]){const po=s.pols[s.pol[i]];po.shock+=0.003;po.plagueD=(po.plagueD||0)+dd;o.hit.add(s.pol[i])}
    const spreadTo=j=>{s.infect[j]=3;s.ob[j]=o.id;nl.push(j);o.cells++;if(o.spread.length<4000)o.spread.push([s.year-o.year,j])};
    for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j<0||s.pop[j]<1||s.infect[j]||s.immune[j]>0.95||s.ob[j]===o.id)continue;
      const dj=s.pop[j]/w.area[j];
      if(r()<0.4*(1-s.immune[j])*Math.min(1,(dens+dj)/8+0.15)*(s.pol[j]===s.pol[i]?1:0.7))spreadTo(j)}
    if(w.coast[i]&&s.sail[i]>0.5)for(let q=w.ls[i];q<w.ls[i+1];q++){const j=w.lt[q];if(s.pop[j]<1||s.infect[j]||s.immune[j]>0.95||s.ob[j]===o.id)continue;if(r()<0.06*(1-s.immune[j]))spreadTo(j)}
    s.infect[i]--;
    if(s.infect[i]===0){s.immune[i]=Math.max(s.immune[i],0.85);if(o.virgin)s.dp[i]=Math.max(s.dp[i],o.dp*0.6)}else nl.push(i);
  }
  s.inf=nl;
  for(const o of s.outbreaks){if(o.done||o.active>0||o.year===s.year)continue;o.done=true;o.end=s.year;o.hit=[...o.hit];
    if(o.deaths>250000){const d=o.deaths>=1e6?`${(o.deaths/1e6).toFixed(1)} million`:`${Math.round(o.deaths/1000)} thousand`;
      chron('plague',`The ${o.name} burns out after killing about ${d} across ${o.cells} provinces${o.virgin?', most of them people who had never met such a disease':''}.`,o.origin,[RPl(o)]);
      if(o.deaths>5e6)spot(`The ${o.name} has killed ${d}`,o.origin,[RPl(o)])}}
  if(s.year%5===0)for(let k=0;k<L.length;k++)s.immune[L[k]]*=0.927;
}

/* ---------- figures ---------- */
function figFor(o,R,kind){
  if(R.fig!=null)return S.figs[R.fig];
  const f={id:S.figs.length,name:R.name+(R.epithet?' '+R.epithet:''),kind,pol:o?o.id:0,eth:o?o.core:-1,born:R.birth,died:0,title:o?`${cap(titleOf(o,R))} of the ${o.full}`:'',deeds:[],conq:0,realm:0,rel:-1,exc:R.exc||'',works:0};
  S.figs.push(f);R.fig=f.id;return f;
}
function deed(f,txt,refs){f.deeds.push([S.year,txt,refs||[]])}
function figScore(f){let s=f.conq*1.5+f.realm+f.deeds.length*4+(f.exc?5:0)+f.works*12;if(f.rel>=0){const R=S.rels[f.rel];s+=10*Math.sqrt(R.peak)+Math.min(100,R.states?R.states.length:0)*0.5}return s}

/* ---------- states ---------- */
const FLOOR={chief:5e3,king:6e4,emp:6e5};
function tierOf(o){const n=o.cells-(o.wasteN||0),p=o.pop;
  if(o.kind==='horde')return n<6||p<2e4?'Clans':n<25||p<2e5?'Horde':'Confederation';
  const nom=o.nomF>0.5;
  // a narrow, crowded river kingdom is still a kingdom: size in people counts, not only in land
  if(p<FLOOR.king*P.floor||(n<4&&p<4*FLOOR.king*P.floor))return'Chiefdom';
  if(n<20||(!nom&&(o.adm<0.45||S.law[o.capital]<0.3))||p<FLOOR.emp*P.floor)return nom?'Khanate':'Kingdom';
  return nom?'Khaganate':'Empire'}
function fullName(o){const t=o.tier;return t==='Horde'||t==='Clans'?`${o.base} ${t}`:`${t} of ${o.base}`}
function styleOf(o){const e=S.eths[o.core];return e?STYLES[e.lang.style]:STYLES.romance}
function titleOf(o,R){const st=styleOf(o).t,f=R.fem;const fam=S.eths[o.core]?S.eths[o.core].fam:-1;
  switch(o.tier){case'Chiefdom':case'Clans':return st.c;case'Horde':case'Confederation':case'Khanate':return st.h;
    case'Kingdom':return st.k==='king'&&f?'queen':st.k;
    default:{if(S.famTitle[fam])return S.famTitle[fam].word;return st.e==='emperor'&&f?'empress':st.k==='khan'?'khagan':st.e}}}
function rulerName(o){const R=o.ruler;return`${titleOf(o,R)} ${R.name}${R.epithet?' '+R.epithet:''}`}
function newRuler(L,o){
  const s=S,r=s.r,tri=()=>(r()+r()+r())/3;
  let base=personName(L,r),num=0;
  if(o&&o.rulers.length&&r()<0.4){const famous=o.rulers.filter(x=>x.fig!=null);const pool=famous.length&&r()<0.7?famous:o.rulers;base=pick(r,pool).base||base}
  if(o){o.nameUse=o.nameUse||{};num=(o.nameUse[base]||0)+1;o.nameUse[base]=num}
  const R={base,name:num>1?`${base} ${roman(num)}`:base,fem:r()<0.15,aggr:tri(),comp:tri(),char:tri(),piety:tri(),exc:'',epithet:'',conq:0,since:s.year,mi:0,fig:null};
  const acc=16+r()*28;R.birth=s.year-Math.floor(acc);R.death=Math.floor(clamp(50+gauss(r)*14,acc+1,88));
  if(r()<P.leaderFlair){const k=pick(r,['aggr','comp','char','piety']);R[k]=0.93+0.07*r();R.exc=k;
    R.epithet=pick(r,k==='aggr'?['the Great','the Conqueror','the Terrible']:k==='comp'?['the Wise','the Lawgiver','the Builder']:k==='char'?['the Beloved','the Radiant','the Lion']:['the Pious','the Saint','the Devout'])}
  return R;
}
function langAt(c){const e=S.eth[c];return S.eths[e>=0?e:0].lang}
function newPolity(c,from,opt){
  opt=opt||{};
  const s=S,r=s.r,id=s.pols.length,e=s.eth[c]>=0?s.eth[c]:0,L=s.eths[e].lang;
  let base=opt.base||L.lex.place;
  if(!opt.base&&(from||s.alive.some(k=>s.pols[k].base===base)))base=placeWord(L,r);
  const o={id,base,core:e,capital:c,rgb:hsl(r()*360,0.42+0.22*r(),0.5+0.1*r()),born:s.year,dyn:personName(L,r),gen:1,kind:opt.kind||'state',
    E:0.02,shock:0,S:0.5,press:0.5,md:0,adm:0,nomF:0,cells:1,pop:s.pop[c],K:1,maxCells:1,maxPop:0,area:WD.area[c],peakArea:0,conq:0,alive:true,wet:0,p5:0,famY:-1e9,
    h:P.reach,gate:1,aggrM:1,psi:0,why:null,hist:[],tier:'Chiefdom',full:'',peak:'',from:from?from.id:0,lastBy:0,fK:0,fE:0,lx:0,ly:0,crises:0,
    rel:s.rel[c],allies:[],enemies:new Map(),truce:new Map(),nb:new Map(),over:0,tribs:0,spc:0,era:0,rulers:[],warsF:[],kids:[],
    origin:opt.origin||(from?{type:'rebellion',from:from.id}:s.colonies.has(c)&&s.colonies.get(c).status==='active'&&colonyDescendant(e,s.colonies.get(c).founderPeople)?{type:'colony',people:s.colonies.get(c).founderPeople,settlement:s.colonies.get(c).name,year:s.colonies.get(c).founded}:{type:'emerged',people:e}),loot:0,cult:0.2,works:[],golds:[],goldStart:0,sample:[],succ:null,fortN:0,cityPop:0,island:false,assimT:0,conqDyn:!!opt.conqDyn,settledY:0,restores:opt.restores||0};
  o.ruler=newRuler(L,o);o.founderR=o.ruler;o.tier=tierOf(o);o.full=fullName(o);o.peak=o.full;
  o.civ=from?(from.civ||from.base):o.base;if(from)from.kids.push(id);
  if(from&&from.cplx!=null){o.cplx=from.cplx*0.55;o.ineq=from.ineq*0.85;o.treas=0.2;o.warC=0}
  s.pols.push(o);s.alive.push(id);s.pol[c]=id;s.dist[c]=0;s.integ[c]=Math.max(s.integ[c],0.7);o.mandate=1;
  // a new state in the heartland of a fallen great power may claim its name
  if(opt.claim&&!opt.base&&o.kind==='state'){for(const F of s.fallen){if(s.year-F.died>900||F.restoredBy)continue;
      const fe=s.eths[F.core],ce=s.eths[e];if(!fe||!ce||fe.fam!==ce.fam)continue;
      if(!F.sample.includes(c)&&angDist(c,F.capital)>0.06)continue;
      if(r()<0.5){F.restoredBy=id;o.base=F.base;o.restores=F.id;o.origin={type:'restoration',from:F.id,people:e};o.full=fullName(o);
        chron('rise',`Claiming the legacy of the fallen ${F.peak}, a new state rises in its old heartland and takes its name.`,c,[['pol',F.id,F.peak]])}
      break}}
  return id;
}
function succession(o){
  const s=S,r=s.r,L=s.eths[o.core]?s.eths[o.core].lang:s.eths[0].lang,Et=etOf(o),old=o.dyn,R0=o.ruler;
  const pU=0.06+0.25*Math.max(0,o.E/Et-1)+0.35*Math.max(0,0.6-(o.mandate==null?1:o.mandate));
  o.rulers.push({name:R0.name,base:R0.base,epithet:R0.epithet,from:R0.since,to:s.year,conq:R0.conq,fig:R0.fig,dyn:o.dyn});
  if(o.rulers.length>60)o.rulers.shift();
  o.ruler=newRuler(L,o);
  const usurp=r()<pU;
  if(R0.fig!=null){const f=s.figs[R0.fig];f.died=s.year;deed(f,usurp?`Overthrown at ${s.year-R0.birth} by ${o.ruler.name}`:`Died at ${s.year-R0.birth}`);
    const fam=s.eths[o.core]?s.eths[o.core].fam:-1;
    if((f.conq>=80||f.realm>=200)&&fam>=0&&!s.famTitle[fam]&&r()<0.25){
      const w=R0.base.toLowerCase().replace(/[aeiou]+$/,'')+pick(r,['ar','or','an','er','ar']);
      s.famTitle[fam]={word:w,fig:f.id,from:o.id};
      chron('culture',`The name of ${f.name} outlives its bearer: rulers of the ${s.eths[fam].name} family of peoples will style themselves ${w}.`,o.capital,[RF(f),R_(o)])}}
  if(o.kind==='horde'&&r()<0.1+0.45*(1-o.S)){o.shock+=0.6;if(o.cells>=10)chron('war',`On the death of ${R0.name}, the ${o.full} begins to splinter among rival chiefs.`,o.capital,[R_(o)]);civilWar(o,true);return}
  if(usurp){o.dyn=personName(L,r);o.gen=1;o.shock+=0.3;o.mandate=0.75;
    if(o.cells>=60){const f=figFor(o,o.ruler,'usurper');deed(f,`Seized the throne of the ${o.full}, ending the House of ${old}`,[R_(o)]);
      chron('war',`${o.ruler.name} seizes the throne of the ${o.full}; the House of ${old} falls.`,o.capital,[R_(o),RF(f)])}}
  else o.gen++;
}
function etOf(o){const c=o.capital,s=S;return 0.02*(1+s.admin[c]+0.5*s.coin[c]+0.5*s.law[c])}
const WHY_LABEL={pN:'rule stretched over lands unlike its own',pT:'a government that cost more than it returned',pF:'an empty treasury and mounting debts',pQ:'a widening gulf between the great and the poor',pZ:'an empire grown too large to govern',pI:'restless, poorly integrated provinces',pM:'a dynasty that had lost its mandate',pP:'population pressing on the land',pE:'too many elites competing for office',pS:'weak cohesion',pX:'an overextended realm',pR:'an inept ruler',pC:'institutions clogged with entrenched interests',sh:'recent famine, plague, invasion or succession strife'};
function topCauses(why){return Object.entries(why).filter(e=>e[1]>0.08).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>WHY_LABEL[e[0]])}
function polCells(id){const s=S,out=[];for(const i of WD.landIdx)if(s.pol[i]===id)out.push(i);return out}
function civilWar(o,breakup){
  const s=S,w=WD,r=s.r,id=o.id,cells=polCells(id);
  if(cells.length<3)return;
  const dd=i=>(s.dist[i]===65535?9999:s.dist[i])*(1.2-s.integ[i]);
  const ecS=new Map();for(const c of cells)ecS.set(c,1+P.eco*ecoD(c,o));
  cells.sort((a,b)=>dd(b)*ecS.get(b)-dd(a)*ecS.get(a));
  const n=clamp(1+(r()<0.5?1:0)+(cells.length>=80&&r()<0.5?1:0)+Math.floor(cells.length/250)+(breakup?2:0),1,6),top=cells.slice(0,Math.max(1,Math.round(cells.length*0.6))),seeds=[];
  for(let t=0;t<60&&seeds.length<n;t++){const c=pick(r,top);if(c===o.capital)continue;if(seeds.every(q=>angDist(q,c)>0.07))seeds.push(c)}
  if(!seeds.length)return;
  const oldName=o.full,causes=topCauses(o.why||{}),why=breakup?(o.kind==='state'&&(o.scl||0)>1.1?'An old regime, clogged with entrenched interests, could no longer reform itself.':'A confederation held together by one leader rarely outlives him.'):causes.length?'Driven by '+causes.join(' and ')+'.':null;
  const lab=s.lab,q=s.q;let h=0,t=0;
  for(const i of cells)lab[i]=-2;
  lab[o.capital]=id;q[t++]=o.capital;
  if(!breakup){const keep=cells.length-top.length;for(let k=cells.length-1;k>=0;k--){const c=cells[k];if(c===o.capital)continue;if(k>=top.length||s.integ[c]>0.8&&r()<0.7){lab[c]=id;q[t++]=c}}}
  const sOK=seeds.filter(c=>lab[c]===-2);if(!sOK.length){for(const i of cells)lab[i]=0;return}
  const ids=sOK.map(c=>{const nid=newPolity(c,o,{kind:o.kind,origin:{type:'rebellion',from:id,why}});lab[c]=nid;q[t++]=c;return nid});
  while(h<t){const i=q[h++],l=lab[i];for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0&&lab[j]===-2){lab[j]=l;q[t++]=j}}}
  for(const i of cells){const l=lab[i];if(l>0&&l!==id){s.pol[i]=l;s.s[i]=Math.min(1,s.s[i]+0.12)}s.pop[i]*=0.94;lab[i]=0}
  {let kept=0;for(const i of cells)if(s.pol[i]===id)kept++;
   if(cells.length>=10&&(breakup||kept<0.55*cells.length)){const o0=o,nid=newPolity(o.capital,o,{kind:o.kind,origin:{type:'successor',from:id}});for(const i of cells)if(s.pol[i]===id)s.pol[i]=nid;
    const n2=s.pols[nid];n2.born=s.year+1;n2.civ=o0.civ||o0.base;n2.rel=o0.rel;if(o0.cplx!=null){n2.cplx=o0.cplx*0.7;n2.ineq=o0.ineq*0.8}o=n2}}
  o.E=0.7*etOf(o);o.shock=0.2;o.crises++;o.scl=(o.scl||0)*(breakup?0.3:0.6);if(o.cplx!=null){o.cplx*=breakup?0.7:0.85;o.ineq=Math.max(0.2,o.ineq*(breakup?0.7:0.88))}
  const rebels=ids.map(k=>s.pols[k]);
  for(const k of ids){const p=s.pols[k];p.rel=s.rel[p.capital]>=0?s.rel[p.capital]:o.rel}
  for(const i of cells){const p=s.pol[i];if(p&&i!==s.pols[p].capital&&cerealEff(i)<0.3&&r()<0.6)s.pol[i]=0}
  const big=cells.length>=40;
  const war=declareWar(rebels,[o],`the ${o.base} Civil War`,big,true);
  war.why=why;
  if(big&&!breakup){const names=ids.map(k=>s.pols[k].base);
    const nm=names.length>1?names.slice(0,-1).join(', ')+' and '+names[names.length-1]:names[0];
    chron('war',`Civil war breaks the ${oldName}; ${nm} ${names.length>1?'break':'breaks'} away.`,o.capital,[['pol',id,oldName],...ids.map(k=>RB(s.pols[k])),RW(war)],why)}
}
function collapse(o){
  const s=S,w=WD;let lost=0;
  for(const i of w.landIdx)if(s.pol[i]===o.id&&s.dist[i]>2&&i!==o.capital){s.pol[i]=0;s.s[i]=0.3;lost++}
  if(o.maxCells>=20&&lost>=5)chron('fall',`The ${o.full} loses its grip; ${lost} provinces fall away into stateless hands.`,o.capital,[R_(o)],'Its cohesion had decayed below the point where it could hold together.');
}
function milAt(c){const s=S,w=WD,ts=w.tsetse[c]?0.15:1;return 1+0.4*s.metal[c]+0.3*s.wheel[c]*ts+0.5*s.iron[c]+ts*(s.horse[c]*(0.3+(w.nomad[c]?0.9:0))+0.6*s.caval[c]*(w.nomad[c]?1:0.5))+1.2*s.gun[c]+0.2*s.admin[c]+0.3*s.camel[c]*w.desert[c]}
function stateFormationChance(i){
  // Mountain cells include large uninhabitable slopes: villages concentrate in valleys.
  const s=S,w=WD;
  if((s.settled[i]<600&&s.admin[i]<0.7)||w.nomad[i])return 0;
  const agr=s.farm[i]*Math.max(w.sF[i],0.7*w.rv[i]*s.irrig[i]);
  if(agr<=0.35)return 0;
  const settledArea=w.area[i]*Math.max(0.35,1-0.65*w.rough[i]),dens=s.pop[i]/settledArea;
  if(dens<=2||localPop(i)<FLOOR.chief*3*P.floor)return 0;
  const crop=cerealEff(i);
  const communal=0.35*s.farm[i]*crop*(0.4+0.6*s.circE[i]);
  const organization=Math.max(communal,(s.irrig[i]+0.1*w.rv[i])*clamp(1-(w.Pr[i]-300)/700,0.2,1),0.5*s.metal[i],s.iron[i],0.8*s.admin[i]);
  const maturity=Math.max(clamp((s.settled[i]-500)/1500,0,1),s.admin[i]>=0.7?s.admin[i]:0);
  const settlement=clamp((dens-1.5)/4,0,1);
  return maturity*settlement*P.formRate*0.0012*(0.2+1.6*P.circ*s.circE[i])*(0.4+s.s[i])*(1+Math.min(2,dens/15))
    *Math.min(1,0.05+communal+s.metal[i]+s.admin[i]+s.horse[i]*0.5+Math.min(0.4,Math.max(0,dens-5)/25)+0.15*Math.max(0,s.circE[i]-0.5))
    *(0.003+0.997*crop*crop)*Math.pow(0.05+0.95*organization,1.7)
    *Math.max(clamp((dens-2)/6,0,1),s.admin[i],riverAdministration(i));
}
// Governing capacity grows with institutions and transport, not the calendar or a region bonus.
function riverAdministration(i){return S.irrig[i]*WD.rv[i]*(1-0.5*WD.rough[i])}
function governingCapacity(o){
  const s=S,c=o.capital;
  if(o.kind==='horde')return 4+12*s.horse[c]+20*s.caval[c]+12*s.camel[c]+6*s.admin[c];
  return 4+8*s.admin[c]+12*s.law[c]+30*s.roads[c]+12*s.paper[c]+10*s.iron[c]+20*s.gun[c]
    +12*riverAdministration(c)+8*s.nav[c]*Math.min(1,(o.coastN||0)/Math.max(1,o.cells));
}
function expansionReadiness(o){
  const cap=governingCapacity(o),c=o.capital;
  // Accounting alone cannot support unlimited accumulation of conquered provinces.
  if(o.kind==='state'&&S.law[c]<0.5&&S.roads[c]<0.5&&o.cells>=1.5*cap)return 0;
  return Math.exp(-2*Math.max(0,o.cells-cap)/cap);
}
function interiorDecay(o){
  const c=o.capital;
  return P.asabD*(o.island?0.5:1)*(o.conqDyn?1.6:1)
    /(1+1.5*S.admin[c]+S.law[c]+S.roads[c]+2*riverAdministration(c));
}
function cerealEff(i){return S.grain[i]*(1-0.75*WD.leach[i])*(1-0.65*WD.trop[i])}
function strength(o){return o.kind==='horde'?o.pop+o.loot*3:(o.tax||0)*1.6+0.25*o.pop}
function power(o){return Math.pow(strength(o)+1,P.scaleExp)*(0.3+o.S)*milAt(o.capital)}
const dd=i=>S.dist[i]>=65534?40:Math.min(60,S.dist[i]*0.5);
function defense(j){const s=S,w=WD,q=s.pol[j];let Ud;
  if(q){const d=s.pols[q];Ud=Math.pow(strength(d)+1,P.scaleExp)*(0.5*d.S+0.5*s.s[j])*milAt(j)*Math.exp(-dd(j)/d.h)*(0.6+0.4*s.integ[j])}
  else Ud=Math.pow(s.pop[j]*4+1,0.75)*s.s[j]*milAt(j)*0.8;
  return Ud*(1+1.6*w.rough[j])*(1+2.5*s.fort[j]);
}
function displace(j,frac,byPol){const s=S;const p=s.pop[j]*frac;if(p<1)return 0;s.pop[j]-=p;pushPressure(s.eth[j],p,j,byPol,null);return p}
function attack(o,i,j,sea){
  const s=S,w=WD,q=s.pol[j];
  const di=dd(i);
  let Ua=Math.pow(strength(o)+1,P.scaleExp)*(0.5*o.S+0.5*s.s[i])*milAt(i)*Math.exp(-di/o.h);if(sea){const dq=s.pol[j]?s.pols[s.pol[j]]:null;const nv=x=>x?(0.3+s.nav[x.capital]+0.5*s.ocean[x.capital])*Math.min(1,0.2+2*x.coastN/Math.max(1,x.cells)):0;Ua*=clamp(0.35+0.5*(nv(o)-0.7*nv(dq)),0.15,0.9)}
  if(!q&&s.pop[j]<1){if(!sea&&s.r()<(o.kind==='horde'?0.15:dd(i)<0.45*o.h||s.fort[i]>0.3?0.05:0.005)&&(o.kind!=='horde'||w.nomad[j]||w.desert[j])){s.pol[j]=o.id;s.taken[j]=s.year;s.dist[j]=Math.min(65534,s.dist[i]+(w.tcost[j]||2))}return}
  let Ud=defense(j);
  // stateless peoples melt into forest and hills and fight on; with no capital to take there is no single victory. Only gunpowder changes the odds.
  if(!q&&o.kind==='state')Ud*=(2.2+2*s.forest[j]+2*w.rough[j])/(1+3*s.gun[i]);
  if(w.nomad[j]&&o.kind!=='horde'&&o.nomF<0.4)Ud*=2.5/(1+2*s.gun[i]);
  if(w.tsetse[j]&&!w.tsetse[o.capital])Ud*=1.5;
  if(w.desert[j]&&w.rv[j]<0.3&&o.kind!=='horde'&&s.camel[i]<0.5)Ud*=1.5;
  // Carneiro: in a hemmed-in valley the beaten cannot flee, so wars end in absorption
  // the fortunes of war: even a match between equals can be won
  const pw=clamp(((Ua-Ud)/(Ua+Ud)*1.6+(q?0.1:0))*(q&&o.kind==='state'?1+0.8*s.circE[j]:1),0,0.92);
  const dpol=q?s.pols[q]:null;
  const kin=dpol&&s.eths[dpol.core]&&s.eths[o.core]&&s.eths[dpol.core].fam===s.eths[o.core].fam;
  const of=s.eths[o.core]?s.eths[o.core].fam:-2,ub=s.uni[j]>0.25&&s.uniFam[j]===of&&o.cells>=12?1+0.5*s.uni[j]:dpol&&s.uni[j]>0.25&&s.eths[dpol.core]&&s.eths[dpol.core].fam!==s.uniFam[j]?1+0.3*s.uni[j]:1;
  const tro=WD.trop[j]>0.5&&WD.trop[o.capital]<0.3?0.45:1;
  const pw2=tro*ub*(kin&&dpol.rel===o.rel?Math.min(0.9,pw*1.15+0.01):pw)*(o.kind==='state'?0.1+0.9*Math.pow(cerealEff(j),1.5):1);
  const eA=ecoD(j,o),pw3=pw2*Math.exp(-P.eco*(o.kind==='horde'?0.4:1.2)*Math.pow(Math.max(0,eA-0.4),1.3));
  if(s.r()<pw3){
    const ej=s.eth[j];
    s.integ[j]=(ej>=0&&s.eths[ej]&&s.eths[o.core]&&s.eths[ej].fam===s.eths[o.core].fam?0.35:0.08)+(s.rel[j]===o.rel&&o.rel>=0?0.15:0);
    s.pol[j]=o.id;s.taken[j]=s.year;s.pop[j]*=0.93;s.s[j]=Math.max(s.s[j]*0.8,0.05);s.dist[j]=Math.min(65534,s.dist[i]+(sea?6:(w.tcost[j]||2)));
    if(o.kind==='horde'&&ej>=0&&ej!==o.core)displace(j,0.2,o.id);
    o.conq++;o.ruler.conq++;
    if(q){const d=s.pols[q];d.lastBy=o.id;d.shock+=0.004;d.mandate=Math.max(0,(d.mandate||1)-0.01);const wid=o.enemies.get(q);if(wid!=null){const war=s.wars[wid];recordWarCapture(wid,j);if(war.aSet.has(o.id))war.gA++;else war.gD++;war.lastGain=s.year;
        if(j===d.capital&&o.kind==='state'&&(d.cells<0.7*o.cells||d.S<0.35))decisive(o,d,war)}}
  }
}
function raid(o,i,j){
  const s=S,q=s.pol[j],t=s.pols[q];if(!t||t.over===o.id)return;
  const Ua=Math.pow(o.pop+1,0.75)*(0.5*o.S+0.5*s.s[i])*milAt(i),Ud=defense(j);
  if(s.r()<clamp((Ua-Ud*0.6)/(Ua+Ud),0.05,0.9)){
    const taken=s.pop[j]*0.03;s.pop[j]-=taken;o.loot+=taken*0.5;t.shock+=0.012;t.raided=(t.raided||0)+1;
    displace(j,0.04,o.id);
  }
}
function decisive(o,d,war){
  const s=S,r=s.r;const kin=s.eths[d.core]&&s.eths[o.core]&&s.eths[d.core].fam===s.eths[o.core].fam;
  const idn=s.uni[d.capital]>0.3&&s.eths[o.core]&&s.uniFam[d.capital]===s.eths[o.core].fam;
  // A capital victory can secure tribute before the victor can administer annexation.
  const canGovern=o.cells+d.cells<=governingCapacity(o)*1.5;
  const annex=canGovern&&(d.cells<=0.35*o.cells||(kin||idn)&&r()<0.7||r()<0.35);
  const n=d.cells,old=d.full;
  if(annex){for(const i of polCells(d.id)){s.pol[i]=o.id;s.integ[i]=Math.min(s.integ[i],kin?0.4:0.12);s.dist[i]=Math.min(65534,(s.dist[d.capital]<65535?s.dist[d.capital]:4)+s.dist[i])}
    o.conq+=n;o.ruler.conq+=n;d.lastBy=o.id;
    if(n>=8){chron('war',`The capital of the ${old} falls, and with it the whole realm: the ${o.full} annexes all ${n} provinces.`,o.capital,[['pol',d.id,old],R_(o),RW(war)]);if(n>=25)spot(`The ${o.full} swallows the ${old}`,o.capital,[R_(o)])}}
  else{d.over=o.id;o.tribs++;endWar(war);s.activeWars=s.activeWars.filter(k=>k!==war.id);
    if(n>=8)chron('war',`With its capital taken, the ${old} submits and becomes a vassal of the ${o.full}.`,d.capital,[R_(d),R_(o),RW(war)])}
}
function distBFS(){
  const s=S,w=WD,pols=s.pols;s.dist.fill(65535);
  const B=[];for(let k=0;k<32;k++)B.push([]);let pending=0;
  for(const id of s.alive){const c=pols[id].capital;if(s.pol[c]===id){s.dist[c]=0;B[0].push(c);pending++}}
  const tf=P.terrain;
  for(let d=0;pending>0&&d<60000;d++){
    const bk=B[d&31];B[d&31]=[];
    for(const i of bk){pending--;if(s.dist[i]!==d)continue;const p=s.pol[i],horde=pols[p].kind==='horde';
      for(let k=0;k<4;k++){const j=w.nb[i*4+k];if(j<0||s.pol[j]!==p)continue;
        let c=2+(w.tcost[j]-2)*tf;c+=(horde?2:4)*s.forest[j]*(1-s.roads[j])*tf;if(k<2)c*=w.cosLat[i];if(s.roads[j]>0.5)c*=0.6;if(w.desert[j]&&(s.camel[j]>0.5||horde))c*=0.5;if(horde&&w.nomad[j])c=Math.min(c,1.5);
        const nd=d+Math.max(1,Math.min(30,Math.round(c)));if(s.dist[j]>nd){s.dist[j]=nd;B[nd&31].push(j);pending++}}
      if(w.coast[i]&&s.sail[i]>0.5)for(let q=w.ls[i];q<w.ls[i+1];q++){const j=w.lt[q],dl=w.ld[q];if(dl>3&&s.nav[i]<0.5)continue;if(s.pol[j]!==p)continue;const nd=d+Math.min(30,2+2*dl);if(s.dist[j]>nd){s.dist[j]=nd;B[nd&31].push(j);pending++}}
    }
  }
}
/* wars and diplomacy */
function declareWar(As,Ds,name,notable,civil,holy){
  const s=S,r=s.r,id=s.wars.length,A=As[0],D=Ds[0];
  const war={id,name:name||`the ${A.base}–${D.base} War`,a:As.map(o=>o.id),d:Ds.map(o=>o.id),start:s.year,end:0,gA:0,gD:0,civil:!!civil,holy:!!holy,notable:!!notable,aSet:null,why:null,outcome:''};
  if(!civil){
    for(const al of A.allies){const p=s.pols[al];if(p&&p.alive&&!D.allies.includes(al)&&!war.d.includes(al)&&!p.enemies.has(D.id)&&r()<(holy&&p.rel===A.rel?0.85:0.6))war.a.push(al)}
    for(const al of D.allies){const p=s.pols[al];if(p&&p.alive&&!war.a.includes(al)&&!war.d.includes(al)&&r()<0.75)war.d.push(al)}
    if(holy){for(const [q] of D.nb){const p=s.pols[q];if(p&&p.alive&&p.kind==='state'&&p.rel===A.rel&&!war.a.includes(q)&&!war.d.includes(q)&&!p.enemies.has(D.id)&&r()<0.3*P.zeal)war.a.push(q)}}
  }
  war.populationAtStart=[...new Set(war.a.concat(war.d))].reduce((n,k)=>n+(s.pols[k]?.pop||0),0);war.finished=false;
  war.aSet=new Set(war.a);
  for(const a of war.a)for(const d of war.d){const pa=s.pols[a],pd=s.pols[d];if(!pa.enemies.has(d)){pa.enemies.set(d,id);pd.enemies.set(a,id)}}
  for(const k of war.a.concat(war.d))s.pols[k].warsF.push(id);
  s.wars.push(war);s.activeWars.push(id);recordWarStart(war);
  return war;
}
function endWar(war){
  const s=S;war.end=s.year;war.finished=true;
  for(const a of war.a)for(const d of war.d){const pa=s.pols[a],pd=s.pols[d];
    if(pa.enemies.get(d)===war.id){pa.enemies.delete(d);pd.enemies.delete(a)}
    pa.truce.set(d,s.year+25);pd.truce.set(a,s.year+25)}
  const A=s.pols[war.a[0]],D=s.pols[war.d[0]],yrs=s.year-war.start;
  let out;
  if(war.civil){out=A.alive&&D.alive?`${A.base} and the other rebels keep their independence`:A.alive?`the rebels prevail`:`the old regime restores its rule`}
  else if(war.gA>war.gD+2)out=`the ${A.base} side takes ${war.gA-war.gD} provinces`;
  else if(war.gD>war.gA+2)out=`the ${D.base} side turns the tide and takes ${war.gD-war.gA} provinces`;
  else out='it ends without decisive gains';
  war.outcome=out;
  if(war.notable||war.gA+war.gD>=25)chron('war',`${cap(war.name)} ends after ${yrs} year${yrs===1?'':'s'}; ${out}.`,A.alive?A.capital:D.capital,[RW(war),RB(A),RB(D)]);
  const win=war.gA>war.gD+2?A:war.gD>war.gA+2?D:null;
  if(win&&win.alive&&Math.abs(war.gA-war.gD)>=15){const f=figFor(win,win.ruler,'ruler');deed(f,`Victor in ${war.name}`,[RW(war)])}
}
function affinity(o,p){
  const s=S;let a=0,threat=null;
  if(o.rel>=0&&o.rel===p.rel)a+=0.45;else if(o.rel>=0&&p.rel>=0)a-=0.2;
  a+=0.3*(1-ethDist(o.core,p.core));
  const po=power(o),pp=power(p);
  for(const [t] of o.nb){if(t===p.id||!p.nb.has(t))continue;const T=s.pols[t];if(T&&T.alive&&power(T)>1.3*Math.max(po,pp)){a+=0.45+(T.rel>=0&&T.rel!==o.rel&&o.rel===p.rel?0.25:0);threat=T;break}}
  if((o.truce.get(p.id)||-1e9)>s.year-10)a-=0.4;
  if(o.enemies.has(p.id))a-=1;
  return[a,threat];
}
function diplomacy(){
  const s=S,r=s.r,pols=s.pols;
  for(const id of s.alive){const o=pols[id];
    o.allies=o.allies.filter(q=>{const p=pols[q];if(!p||!p.alive||o.enemies.has(q))return false;
      if(q>id){const [a]=affinity(o,p);if(a<0.15&&r()<0.3){p.allies=p.allies.filter(x=>x!==id);
        if(o.cells>=40&&p.cells>=40)chron('diplomacy',`The alliance between the ${o.full} and the ${p.full} lapses.`,o.capital,[R_(o),R_(p)]);return false}}
      return true});
    if(o.cells<2)continue;
    for(const [q] of o.nb){if(q<=id)continue;const p=pols[q];if(!p||!p.alive||o.allies.includes(q)||o.enemies.has(q)||p.cells<2)continue;
      if(o.allies.length>=3||p.allies.length>=3)continue;
      let [a,threat]=affinity(o,p);const marriage=r()<0.06&&o.kind==='state'&&p.kind==='state';if(marriage)a+=0.3;
      if(a>0.55&&r()<0.25*P.allyRate){o.allies.push(q);p.allies.push(id);
        if(o.cells>=30&&p.cells>=30){const faith=o.rel>=0&&o.rel===p.rel&&threat&&threat.rel!==o.rel;
          chron('diplomacy',`The ${o.full} and the ${p.full} conclude an alliance${threat?` against the ${threat.full}`:''}${faith?`, brothers in ${s.rels[o.rel].name} against an unbelieving power`:''}${marriage?', sealed by a royal marriage':''}.`,o.capital,threat?[R_(o),R_(p),R_(threat)]:[R_(o),R_(p)])}}}
    if(o.kind==='horde'&&o.cells>=6){for(const [q] of o.nb){const p=pols[q];if(!p||!p.alive||p.kind==='horde'||p.over||o.enemies.has(q)||p.cells<3)continue;
      if(power(o)>1.3*power(p)&&(p.raided||0)>3&&r()<0.15){p.over=id;o.tribs++;if(p.cells>=25)chron('diplomacy',`Worn down by raids, the ${p.full} agrees to pay tribute to the ${o.full}.`,p.capital,[R_(p),R_(o)])}}}
    o.raided=0;
    const y=s.year;if(o.over&&!o.overY)o.overY=y;if(!o.over)o.overY=0;
    if(o.over&&o.kind==='state'){const ov=pols[o.over];if(ov&&ov.alive&&ov.kind==='state'&&y-o.overY>40&&power(ov)>3*power(o)&&r()<0.01*(s.eths[ov.core]&&s.eths[o.core]&&s.eths[ov.core].fam===s.eths[o.core].fam?2:1)){const n=o.cells,old=o.full;for(const c of polCells(o.id)){s.pol[c]=ov.id;s.integ[c]=Math.max(s.integ[c]*0.6,0.3);s.dist[c]=Math.min(65534,(s.dist[o.capital]<65535?s.dist[o.capital]:0)+s.dist[c]+4)}ov.tribs=Math.max(0,ov.tribs-1);o.over=0;if(n>=10)chron('diplomacy',`The ${ov.full} absorbs its long-time vassal, the ${old}.`,o.capital,[R_(ov),['pol',o.id,old]]);continue}}
    if(o.over){const ov=pols[o.over];if(!ov||!ov.alive||power(o)>power(ov)){if(ov&&ov.alive&&o.cells>=25)chron('diplomacy',`The ${o.full} stops paying tribute to the ${ov.full}.`,o.capital,[R_(o),R_(ov)]);if(ov)ov.tribs=Math.max(0,ov.tribs-1);o.over=0}}
  }
}
/* ---------- faith ---------- */
function foundReligion(o){
  const s=S,r=s.r,cells=polCells(o.id);if(!cells.length)return;
  const c=pick(r,cells),L=langAt(c),e=s.eth[c]>=0?s.eths[s.eth[c]]:null;
  const Rp=newRuler(L,null);Rp.epithet='';Rp.birth=s.year-(25+((r()*15)|0));Rp.death=Rp.birth+55+((r()*25)|0);
  const f=figFor(null,Rp,'prophet');f.pol=o.id;f.eth=s.eth[c];f.title=`Prophet of the ${e?e.name:'people'}`;f.died=Rp.death;
  const G=cap(L.lex.god),F=Rp.base;
  const name=pick(r,[`${G}ism`,`the Way of ${F}`,`the ${G} Covenant`,`the Faith of ${G}`,`${F}ism`,`the ${cap(L.lex.sun)} Path`]);
  const universal=r()<(s.admin[c]>0.5?0.5:0.12);
  if(s.city[c]<0){s.city[c]=s.cities.length;s.cities.push({name:cityWord(L,r),cell:c,born:s.year,eth:s.eth[c],peak:s.pop[c],holy:true})}
  const R={id:s.rels.length,name,founder:f.id,born:s.year,origin:c,holy:c,pol:o.id,eth:s.eth[c],fam:e?e.fam:-1,kind:universal?'universal':'ethnic',miss:universal?0.35+0.65*r():0.15,cent:universal?0.3+0.4*r():0.1,holder:o.id,rgb:hsl(r()*360,0.55,0.48),parent:-1,kids:[],cells:0,pop:0,peak:0,alive:true,states:[],councils:0};
  s.rels.push(R);f.rel=R.id;
  s.rel[c]=R.id;for(let d=0;d<4;d++){const j=WD.nb[c*4+d];if(j>=0&&s.pop[j]>=1&&s.pol[j]===o.id)s.rel[j]=R.id}
  deed(f,`Began to preach ${name} in the ${o.full}`,[RR(R),R_(o)]);
  chron('faith',`The prophet ${f.name} begins to preach ${name} in the ${o.full}${universal?', a faith open to every people':''}.`,c,[RF(f),RR(R),R_(o)]);
  spot(`The prophet ${f.name} begins to preach ${name}`,c,[RF(f),RR(R)]);
}
function foundFolk(c){
  const s=S,r=s.r,L=langAt(c),e=s.eths[s.eth[c]];
  const Rp=newRuler(L,null);Rp.epithet='';Rp.birth=s.year-(25+((r()*15)|0));Rp.death=Rp.birth+55+((r()*25)|0);
  const f=figFor(null,Rp,'prophet');f.eth=s.eth[c];f.title=`Seer of the ${e.name}`;f.died=Rp.death;
  const G=cap(L.lex.god),name=pick(r,[`the ${G} Cult`,`the Rites of ${G}`,`${G}ism`,`the ${cap(L.lex.sun)} Rites`,`the Way of ${Rp.base}`]);
  if(s.city[c]<0){s.city[c]=s.cities.length;s.cities.push({name:cityWord(L,r),cell:c,born:s.year,eth:s.eth[c],peak:s.pop[c],holy:true})}
  const R={id:s.rels.length,name,founder:f.id,born:s.year,origin:c,holy:c,pol:s.pol[c]||0,eth:s.eth[c],fam:e.fam,kind:'ethnic',miss:0.15,cent:0.1,holder:s.pol[c]||0,rgb:hsl(r()*360,0.55,0.48),parent:-1,kids:[],cells:0,pop:0,peak:0,alive:true,states:[],councils:0};
  s.rels.push(R);f.rel=R.id;s.rel[c]=R.id;
  for(let d=0;d<4;d++){const j=WD.nb[c*4+d];if(j>=0&&s.pop[j]>=1&&s.eth[j]===s.eth[c]&&s.rel[j]<0)s.rel[j]=R.id}
  deed(f,`Began to preach ${name} among the ${e.name}`,[RR(R)]);
  chron('faith',`Among the ${e.name}, the seer ${f.name} gathers a following around ${name}.`,c,[RF(f),RR(R),RE(e)])}
function holyName(R){const c=S.city[R.holy];return c>=0?S.cities[c].name:'its holy city'}
function relPass(){
  const s=S,w=WD,E=s.rels,n=E.length;if(!n)return;
  const L=w.landIdx,sx=new Float64Array(n),sy=new Float64Array(n),sz=new Float64Array(n),cnt=new Int32Array(n),pp=new Float64Array(n);
  for(let k=0;k<L.length;k++){const i=L[k],e=s.rel[i];if(e<0||s.pop[i]<1)continue;sx[e]+=w.x3[i];sy[e]+=w.y3[i];sz[e]+=w.z3[i];cnt[e]++;pp[e]+=s.pop[i]}
  for(let e=0;e<n;e++){const R=E[e];R.cells=cnt[e];R.pop=pp[e];R.peakPop=Math.max(R.peakPop||0,R.pop);if(cnt[e]>R.peak)R.peak=cnt[e];
    if(R.alive&&!cnt[e]){R.alive=false;R.died=s.year;if(R.peak>=30)chron('faith',`The last followers of ${R.name} are gone; at its height it held ${R.peak} provinces.`,R.origin,[RR(R)])}
    if(cnt[e]){const m=Math.hypot(sx[e],sy[e],sz[e])||1;sx[e]/=m;sy[e]/=m;sz[e]/=m;R.lon=Math.atan2(sy[e],sx[e]);R.la=Math.asin(clamp(sz[e],-1,1))}
    if(!R.alive)continue;
    // centralization follows who holds the holy city
    const hp=s.pol[R.holy],holder=hp?s.pols[hp]:null,faithful=holder&&holder.rel===R.id;
    if(faithful)R.cent=clamp(R.cent+0.04*(0.3+s.admin[R.holy]),0,1);else R.cent=clamp(R.cent-0.05,0,1);
    if(holder&&holder.id!==R.holder&&R.peak>=20){
      if(!faithful&&holder.rel>=0)chron('faith',`The holy city of ${holyName(R)} falls to the ${holder.full}, who follow ${E[holder.rel].name}; the faithful of ${R.name} lose their centre.`,R.holy,[RR(R),R_(holder),RR(E[holder.rel])]);
      else if(faithful&&R.holder&&s.pols[R.holder]&&s.pols[R.holder].rel!==R.id)chron('faith',`The faithful of ${R.name} recover their holy city of ${holyName(R)} under the ${holder.full}.`,R.holy,[RR(R),R_(holder)])}
    R.holder=holder?holder.id:0;
  }
  const md=new Float64Array(n).fill(2),far=new Int32Array(n).fill(-1);
  for(let k=0;k<L.length;k++){const i=L[k],e=s.rel[i];if(e<0||s.pop[i]<1)continue;const d=w.x3[i]*sx[e]+w.y3[i]*sy[e]+w.z3[i]*sz[e];if(d<md[e]){md[e]=d;far[e]=i}}
  {const ne=s.eths.length,rc=new Int32Array(ne),cl=new Int32Array(ne).fill(-1);let nf=0;
   for(const R of E)if(R.alive&&R.kind==='ethnic')nf++;
   for(let k=0;k<L.length;k++){const i=L[k],q=s.eth[i];if(q<0||s.pop[i]<1)continue;if(s.rel[i]>=0)rc[q]++;else if(cl[q]<0||s.r()<0.2)cl[q]=i}
   let fm=0;if(nf<30)for(let q=0;q<ne&&fm<1;q++){const e=s.eths[q];if(!e.alive||e.cells<12||cl[q]<0||rc[q]>0.3*e.cells)continue;
     if(s.r()<P.faith*0.0022*Math.min(2,e.cells/25)){foundFolk(cl[q]);fm++}}}
  const thr=7*2*Math.PI/W;let made=0;
  for(let e=0;e<n&&made<4;e++){const R=E[e];
    if(!R.alive||cnt[e]<15||far[e]<0||Math.acos(clamp(md[e],-1,1))<thr)continue;
    const f0=far[e],age=(s.year-R.born)/1000;
    const pSch=0.22*P.faith*(1-0.7*R.cent)*(1+1.5*s.paper[f0])*(1+0.5*Math.min(2,age));
    if(s.r()>pSch)continue;
    if(R.cent>0.55&&s.r()<R.cent*0.7){R.councils++;if(R.peak>=30)chron('faith',`A council at ${holyName(R)} settles a dispute that threatened to split ${R.name}.`,R.holy,[RR(R)]);continue}
    const L2=langAt(f0),Rp=newRuler(L2,null);Rp.epithet='';Rp.birth=s.year-30;Rp.death=s.year+20+((s.r()*25)|0);
    const fg=figFor(null,Rp,'reformer');fg.pol=s.pol[f0];fg.eth=s.eth[f0];fg.title='Reformer';fg.died=Rp.death;
    const core=(R.root||R.name).replace(/^the /,'');
    if(s.city[f0]<0){s.city[f0]=s.cities.length;s.cities.push({name:cityWord(L2,s.r),cell:f0,born:s.year,eth:s.eth[f0],peak:s.pop[f0],holy:true})}
    const cityN=s.cities[s.city[f0]].name,used=new Set(E.map(x=>x.name));
    const cands=[[`Reformed ${core}`,1],[`Orthodox ${core}`,1],[`Old ${core}`,1],[`${core} of ${cityN}`,1],[`the ${cityN} Rite`,0],[`${cap(word(L2,s.r))}ism`,0],[`the ${Rp.base} Church`,0]];
    let pk=cands.filter(x=>!used.has(x[0]));if(!pk.length)pk=[[`${Rp.base}\u2019s ${core}`,1]];
    const [nm,keepRoot]=pick(s.r,pk);
    if(s.city[f0]<0){s.city[f0]=s.cities.length;s.cities.push({name:cityWord(L2,s.r),cell:f0,born:s.year,eth:s.eth[f0],peak:s.pop[f0],holy:true})}
    const C={id:E.length,name:nm,founder:fg.id,born:s.year,origin:f0,holy:f0,pol:s.pol[f0],eth:s.eth[f0],fam:R.fam,kind:R.kind,miss:clamp(R.miss+gauss(s.r)*0.15,0.1,1),cent:0.25,holder:s.pol[f0],rgb:hsl(s.r()*360,0.5,0.5),parent:e,kids:[],cells:0,pop:0,peak:0,alive:true,states:[],councils:0};
    C.root=keepRoot?core:nm.replace(/^the /,'');E.push(C);R.kids.push(C.id);fg.rel=C.id;made++;
    for(let k=0;k<L.length;k++){const i=L[k];if(s.rel[i]!==e)continue;
      if(w.x3[i]*w.x3[f0]+w.y3[i]*w.y3[f0]+w.z3[i]*w.z3[f0]>w.x3[i]*sx[e]+w.y3[i]*sy[e]+w.z3[i]*sz[e])s.rel[i]=C.id}
    deed(fg,`Broke with ${R.name} and founded ${nm}`,[RR(R),RR(C)]);
    const causes=[];if(R.cent<0.3)causes.push('the faith had no strong centre');if(s.paper[f0]>0.5)causes.push('cheap books spread new readings');if(age>1)causes.push('long-standing grievances against its clergy');
    chron('faith',`A schism splits ${R.name}: followers of the reformer ${fg.name} form ${nm}.`,f0,[RR(R),RF(fg),RR(C)],causes.length?'Because '+causes.join(', and ')+'.':null);
  }
}
/* ---------- migrations ---------- */
function pushPressure(e,amount,cell,byPol,fromMig){
  const s=S,r=s.r;if(e<0||amount<1)return;
  let m=s.press.get(e);if(!m||s.year-m.y>40){m={p:0,y:s.year,cell,by:byPol,mig:fromMig};s.press.set(e,m)}
  m.p+=amount;m.cell=cell;if(byPol)m.by=byPol;if(fromMig!=null)m.mig=fromMig;
  const E0=s.eths[e];
  if(m.p>80000&&s.activeMigs.length<10&&r()<0.35*P.wander&&!(E0.lastMig&&s.year-E0.lastMig<150)){
    s.press.delete(e);E0.lastMig=s.year;
    let dx=0,dy=0;const by=m.by?s.pols[m.by]:null;
    if(by&&by.alive){dx=-dxWrap(cell,by.capital);dy=-(WD.cyA[by.capital]-WD.cyA[cell])}
    if(m.mig!=null){const M=s.migs[m.mig];if(M){dx=M.dx;dy=M.dy}}
    if(!dx&&!dy){const a=r()*6.28;dx=Math.cos(a);dy=Math.sin(a)}
    startMigration({eth:e,pop:m.p,cell,dx,dy,kind:'people',by,prev:m.mig})
  }
}
function startMigration(o){
  const s=S,w=WD,e=s.eths[o.eth];const n=Math.hypot(o.dx,o.dy)||1;
  const M={id:s.migs.length,eth:o.eth,rel:s.rel[o.cell],name:o.kind==='horde'&&o.pol?o.pol.full:e.name,pop:o.pop,cell:o.cell,dx:o.dx/n,dy:o.dy/n,path:[o.cell],kind:o.kind,start:s.year,steps:0,max:20+((s.r()*25)|0),fails:0,
    S:0.75,mil:milAt(o.cell),farm:s.farm[o.cell],herd:s.herd[o.cell],techs:s.tk.map(f=>f[o.cell]),pol:o.pol?o.pol.id:0,prev:o.prev!=null?o.prev:-1,by:o.by?o.by.id:0,done:false,result:'',broke:[],cause:o.cause||''};
  s.migs.push(M);s.activeMigs.push(M.id);
  const refs=[RM(M),RE(e)];let txt;
  const dir=dirWord(M.dx,M.dy);
  if(o.kind==='horde')txt=`${o.cause==='drought'?'Driven from parched pastures':'Hungry for richer lands'}, the ${M.name} sets out ${dir}ward, some ${fmtK(M.pop)} strong.`;
  else if(M.prev>=0){const P0=s.migs[M.prev];refs.push(RM(P0));txt=`Fleeing the ${P0.name}, the ${e.name} take to the roads and head ${dir}, ${fmtK(M.pop)} people in all.`}
  else if(o.by){refs.push(R_(o.by));txt=`Driven out by the ${o.by.full}, the ${e.name} take to the roads and head ${dir}, ${fmtK(M.pop)} people in all.`}
  else txt=`The ${e.name} take to the roads and head ${dir}, ${fmtK(M.pop)} people in all.`;
  M.startTxt=txt;M.logged=M.pop>=100000||o.kind==='horde'||M.prev>=0;
  if(M.logged)chron('migration',txt,o.cell,refs);
  if(M.pop>400000)spot(`The ${M.name} ${o.kind==='horde'?'is':'are'} on the move`,o.cell,[RM(M)]);
  return M;
}
function fmtK(n){return n>=1e6?(n/1e6).toFixed(1)+' million':Math.round(n/1000)*1000>=1000?Math.round(n/1000)+' thousand':Math.round(n)+''}
function migStep(M){
  const s=S,w=WD,r=s.r;
  if(M.done)return;
  let best=-1,bs=-1e9;const c=M.cell,cx=w.cxA[c],cy=w.cyA[c];
  ring(c,1,(j,dx,dy)=>{if(j===c||!w.land[j]||w.T[j]<-9)return;
    const k=s.K[j],p=s.pop[j],room=k>1?clamp((k-p)/(k+1),-1,1):-1;
    let sc=2.2*(dx*M.dx+dy*M.dy)/Math.hypot(dx,dy)-0.15*(w.tcost[j]-2)*P.terrain+0.8*room+r()*0.7;
    if(M.path.includes(j))sc-=3;if(w.desert[j]&&M.kind!=='horde')sc-=1;
    if(sc>bs){bs=sc;best=j}});
  if(best<0){disperse(M,'trapped');return}
  const j=best;M.cell=j;M.steps++;M.pop*=0.985;if(M.path.length<240)M.path.push(j);
  const q=s.pol[j];
  if(q&&q!==M.pol){
    const t=s.pols[q];
    const Um=Math.pow(M.pop,0.75)*M.S*M.mil,Ud=defense(j)*(t.kind==='horde'?0.8:1);
    if(r()<clamp((Um-Ud)/(Um+Ud)*1.6+0.12,0.04,0.92)){
      M.pop*=0.94;displace(j,0.25,0);const pr=s.press.get(s.eth[j]);if(pr)pr.mig=M.id;
      t.shock+=t.cells>=20?0.08:0.02;
      if(!M.broke.includes(q)){M.broke.push(q);if(t.cells>=20){if(!M.logged){M.logged=true;chron('migration',M.startTxt,M.path[0],[RM(M),RE(s.eths[M.eth])])}chron('migration',`The ${M.name} break through the frontier of the ${t.full}.`,j,[RM(M),R_(t)]);t.invaded=(t.invaded||0)+1}}
      if((M.steps>=3&&r()<0.12)||M.steps>M.max)settle(M,j,t);
    }else{M.pop*=0.8;M.fails++;const a=(r()<0.5?1:-1)*(0.8+r()*0.9),ca=Math.cos(a),sa=Math.sin(a),nx=M.dx*ca-M.dy*sa,ny=M.dx*sa+M.dy*ca;M.dx=nx;M.dy=ny;
      if(M.fails>5)settle(M,M.path[Math.max(0,M.path.length-2)],null)}
  }else{
    if(s.pop[j]>1000&&s.eth[j]>=0&&s.eth[j]!==M.eth){displace(j,0.15,0);const pr=s.press.get(s.eth[j]);if(pr)pr.mig=M.id}
    const room=s.K[j]-s.pop[j];
    if((room>M.pop*0.15&&M.steps>4&&r()<0.25)||M.steps>M.max)settle(M,j,null);
  }
  if(!M.done&&M.pop<15000)disperse(M,'dwindled');
}
function disperse(M,why){const s=S;M.done=true;M.end=s.year;M.result=why==='trapped'?'trapped and scattered':'dwindled and scattered';
  if(M.pop>0&&M.cell>=0){s.pop[M.cell]+=M.pop*0.5}
  s.activeMigs=s.activeMigs.filter(k=>k!==M.id);
  if(M.logged&&M.path.length>8)chron('migration',`The ${M.name} ${M.result} after ${s.year-M.start} years of wandering.`,M.cell,[RM(M)])}
function settle(M,j,t){
  const s=S,w=WD,r=s.r;M.done=true;M.end=s.year;s.activeMigs=s.activeMigs.filter(k=>k!==M.id);
  const cells=[];ring(j,2,(c)=>{if(w.land[c]&&w.T[c]>-9&&cells.length<9)cells.push(c)});
  const per=M.pop/cells.length;
  for(const c of cells){const old=s.pop[c],oe=s.eth[c];s.pop[c]+=per;
    if(oe<0||old<1){s.eth[c]=M.eth;s.eth2[c]=-1}
    else if(oe!==M.eth){if(per>old){s.eth[c]=M.eth;s.eth2[c]=oe;s.mix[c]=old/(old+per)}else{s.eth2[c]=M.eth;s.mix[c]=per/(old+per)}s.mixT[c]=0}
    if(M.rel>=0&&per>old)s.rel[c]=M.rel;
    for(let k=0;k<s.tk.length;k++)s.tk[k][c]=Math.max(s.tk[k][c],M.techs[k]*0.8)}
  const e=s.eths[M.eth],farmland=w.sF[j]>0.3&&M.farm>0.5;
  const strong=M.pop>100000;
  let o=null;
  if(strong){
    const id=newPolity(j,null,{kind:farmland?'state':'horde',origin:{type:'migration',mig:M.id,people:M.eth,from:t?t.id:0},conqDyn:!!t});
    o=s.pols[id];o.S=0.7;for(const c of cells){s.pol[c]=id;s.s[c]=Math.max(s.s[c],0.65)}
  }
  M.settledPol=o?o.id:0;
  M.result=o?`settled and founded the ${o.full}`:`settled among the locals`;
  const refs=[RM(M),RE(e)];if(t)refs.push(R_(t));if(o)refs.push(R_(o));
  if(M.logged||o)chron('migration',`After ${s.year-M.start} years on the move, the ${M.name} settle${t?` in the lands of the ${t.full}`:''}${o?` and found the ${o.full}`:' and mingle with the people there'}.`,j,refs);
  if(o&&t&&t.cells>=30)spot(`The ${M.name} found the ${o.full} inside the ${t.full}`,j,[R_(o),R_(t)]);
}
function hordeMigration(o){
  const s=S,r=s.r,cells=polCells(o.id);if(!cells.length)return;
  let best=null,bp=0;for(const [q] of o.nb){const t=s.pols[q];if(t&&t.alive&&t.kind==='state'&&t.pop>bp){bp=t.pop;best=t}}
  let tot=0;for(const c of cells){const take=s.pop[c]*0.6;s.pop[c]-=take;tot+=take}
  let dx,dy;if(best){dx=dxWrap(o.capital,best.capital);dy=WD.cyA[best.capital]-WD.cyA[o.capital]}else{const a=r()*6.28;dx=Math.cos(a);dy=Math.sin(a)}
  o.shock+=0.4;
  startMigration({eth:o.core,pop:tot,cell:o.capital,dx,dy,kind:'horde',pol:o,cause:o.wet<-0.4?'drought':'riches'});
}
/* ---------- culture ---------- */
const WORKS=['epic','temple','chronicle','law treatise','observatory','song cycle','palace','book of hymns','philosophy','great library'];
function culture(o){
  const s=S,r=s.r,c=o.capital;
  const surplus=clamp(1.15-o.press,0,1),stab=clamp(1-o.psi/2,0,1),lit=s.admin[c];
  const conn=0.5*clamp((o.nb.size+o.allies.length)/8,0,1)+0.5*clamp(s.paper[c]+(WD.coast[c]?0.3:0),0,1);
  const urb=clamp(o.cityPop/(o.pop+1)*4,0,1),patron=clamp(o.E/etOf(o),0,2)/2;
  const tgt=(0.3+0.7*Math.sqrt(surplus))*stab*(0.3+0.7*lit)*(0.5+0.5*(0.4*urb+0.3*conn+0.3*patron))*(o.kind==='horde'?0.5:1);
  o.cult+=(tgt-o.cult)*0.05;
  o.cultWhy={surplus,stab,lit,conn,urb,patron};
  if(o.cult>0.5){if(!o.goldStart)o.goldStart=s.year;
    if(r()<0.01*o.cult&&o.cells>=6){const L=langAt(c),Rp=newRuler(L,null);Rp.epithet='';Rp.birth=s.year-30-((r()*20)|0);Rp.death=s.year+((r()*25)|0);
      const f=figFor(o,Rp,'sage');f.title=`Sage of the ${o.full}`;f.died=Rp.death;f.works=1;
      const kind=pick(r,WORKS),name=`the ${kind} of ${Rp.base}`;o.works.push({y:s.year,name,fig:f.id});deed(f,`Created ${name}`,[R_(o)]);
      if(o.cells>=25)chron('culture',`In the ${o.full}, ${Rp.base} completes ${name}.`,c,[R_(o),RF(f)])}}
  else if(o.goldStart&&o.cult<0.38){const len=s.year-o.goldStart;
    if(len>=60){o.golds.push([o.goldStart,s.year]);
      const why=o.cultWhy,parts=[];if(why.surplus>0.4)parts.push('ample harvests');if(why.stab>0.6)parts.push('long peace at home');if(why.urb>0.5)parts.push('great cities');if(why.conn>0.5)parts.push('busy contacts abroad');if(why.patron>0.5)parts.push('rich patrons');
      const nw=o.works.filter(x=>x.y>=o.goldStart).length;
      if(o.cells>=20&&nw>=1)chron('culture',`Looking back, the years ${fy(o.goldStart)} to ${fy(s.year)} were a flowering for the ${o.full}${parts.length?', fed by '+parts.slice(0,3).join(', '):''}; ${nw} great work${nw>1?'s':''} date${nw>1?'':'s'} from it.`,c,[R_(o)])}
    o.goldStart=0}
}
/* ---------- states, each year ---------- */
// Hot cell loops use ordinary functions; the scheduler yields between chunks.
// Keep phase inputs fixed and visit cells/RNG draws in their original order.
function aggregatePoliticalCells(phase,from,to){
  const {s,w,r,pols,L,pol,pop,sampleNow}=phase;
  for(let k=from;k<to;k++){const i=L[k],p=pol[i];if(!p)continue;const o=pols[p],pp=pop[i];
    o.pop+=pp;o.K+=s.K[i];o.cells++;o.area+=w.area[i];o.sS+=s.s[i];const di=dd(i);o.dS+=di;let eD=0;if(pp>=1){o.n0+=pp*w.nT[i];o.n1+=pp*w.nM[i];o.n2+=pp*w.nN[i];o.n3+=pp*w.nD[i];o.nw+=pp;if(o.ni){eD=ecoD(i,o);if(eD>0.8)o.forP+=pp}}o.ad+=s.admin[i];o.ig+=s.integ[i];const pl=s.ard[i]>0.5&&!w.tsetse[i];o.tax+=pp>=1?pp*s.farm[i]*cerealEff(i)*Math.exp(-di/(o.h||6))*(0.5+0.5*s.integ[i])*(0.6+0.4*s.circE[i])*(pl?1.1:0.8)/(1+0.3*P.eco*eD):0;if(pl)o.plN++;if(w.heavy[i]>0.4)o.hvN++;if(isWaste(i,o.kind==="horde"))o.wasteN++;if(s.car[i]>0.3){const tl=1500*s.car[i];o.tax+=tl;o.trade+=tl}
    if(w.nomad[i])o.nom++;if(w.coast[i])o.coastN++;if(s.farm[i]>0.5&&w.sF[i]>0.25&&pp/w.area[i]>2)o.farmN++;if(s.fort[i]>0.5)o.fortN++;
    o.cx+=w.cosLon[i];o.cy+=w.sinLon[i];o.yy+=w.cyA[i];if(pp>o.mp){o.mp=pp;o.mc=i}
    if(sampleNow){if(o.sample.length<24)o.sample.push(i);else if(r()<24/o.cells)o.sample[(r()*24)|0]=i}}

}
function updatePoliticalBorders(phase,from,to){
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

}
function politics(){for(const _ of politicsG());}
function* politicsG(){
  const s=S,w=WD,r=s.r,y=s.year,pols=s.pols,L=w.landIdx,pol=s.pol,pop=s.pop;
  const sampleNow=y%10===0;
  for(const id of s.alive){const o=pols[id];o.pop=0;o.K=0;o.cells=0;o.area=0;o.sS=0;o.dS=0;o.ad=0;o.nom=0;o.cx=0;o.cy=0;o.yy=0;o.mp=-1;o.mc=-1;o.coastN=0;o.farmN=0;o.fortN=0;o.lmN=0;o.tax=0;o.ig=0;o.wasteN=0;o.plN=0;o.hvN=0;o.trade=0;o.n0=0;o.n1=0;o.n2=0;o.n3=0;o.nw=0;o.forP=0;if(sampleNow)o.sample=[]}
  const phase={s,w,r,y,pols,L,pol,pop,sampleNow};
  for(let from=0;from<L.length;from+=2048){if(from)yield;aggregatePoliticalCells(phase,from,Math.min(from+2048,L.length))}
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
  Object.assign(phase,{asR:P.asabR,wr:P.warRate*0.03,rev:y&1,rels:s.rels,fz:P.fortify,infl});
  for(let from=0;from<L.length;from+=1024){if(from)yield;updatePoliticalBorders(phase,from,Math.min(from+1024,L.length))}
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
}

/* ---------- peoples, mixing, cities, records ---------- */
function ethPass(log){
  const s=S,w=WD,E=s.eths,n=E.length,L=w.landIdx;
  const sx=new Float64Array(n),sy=new Float64Array(n),sz=new Float64Array(n),cnt=new Int32Array(n),pp=new Float64Array(n);
  for(let k=0;k<L.length;k++){const i=L[k],e=s.eth[i];if(e<0||s.pop[i]<1)continue;sx[e]+=w.x3[i];sy[e]+=w.y3[i];sz[e]+=w.z3[i];cnt[e]++;pp[e]+=s.pop[i]}
  for(let e=0;e<n;e++){const o=E[e];o.cells=cnt[e];o.pop=pp[e];if(pp[e]>o.peak)o.peak=pp[e];
    if(o.alive&&!cnt[e])o.died=s.year;o.alive=cnt[e]>0;
    if(cnt[e]){const m=Math.hypot(sx[e],sy[e],sz[e])||1;sx[e]/=m;sy[e]/=m;sz[e]/=m;o.lon=Math.atan2(sy[e],sx[e]);o.la=Math.asin(clamp(sz[e],-1,1))}}
  const md=new Float64Array(n).fill(2),far=new Int32Array(n).fill(-1);
  for(let k=0;k<L.length;k++){const i=L[k],e=s.eth[i];if(e<0||s.pop[i]<1)continue;const d=w.x3[i]*sx[e]+w.y3[i]*sy[e]+w.z3[i]*sz[e];if(d<md[e]){md[e]=d;far[e]=i}}
  const thr=P.splitDist*2*Math.PI/W;let made=0;
  for(let e=0;e<n&&made<12;e++){
    if(cnt[e]<6||far[e]<0)continue;
    if(Math.acos(clamp(md[e],-1,1))<=thr||s.r()>0.5)continue;
    const f=far[e],c=newEth(e);made++;
    for(let k=0;k<L.length;k++){const i=L[k];if(s.eth[i]!==e)continue;
      const df=w.x3[i]*w.x3[f]+w.y3[i]*w.y3[f]+w.z3[i]*w.z3[f],dc=w.x3[i]*sx[e]+w.y3[i]*sy[e]+w.z3[i]*sz[e];
      if(df>dc)s.eth[i]=c}
    if(log&&pp[e]>2e6&&cnt[e]>=30){
      const dlat=w.lat[f]-Math.asin(clamp(sz[e],-1,1));let dlon=Math.atan2(w.y3[f],w.x3[f])-Math.atan2(sy[e],sx[e]);
      if(dlon>Math.PI)dlon-=2*Math.PI;if(dlon<-Math.PI)dlon+=2*Math.PI;
      const dir=Math.abs(dlat)>Math.abs(dlon)*Math.cos(w.lat[f])?(dlat>0?'north':'south'):(dlon>0?'east':'west');
      chron('people',`The ${E[e].name} drift apart; in the ${dir} a new people, the ${E[c].name}, emerges.`,f,[RE(E[e]),RE(E[c])]);
    }
  }
  for(const o of E)if(o.alive)for(let k=0;k<6;k++)o.cult[k]=clamp(o.cult[k]+gauss(s.r)*0.015,0,1);
}
function mixPass(){
  const s=S,w=WD,r=s.r,L=w.landIdx;let born=0;
  for(let k=0;k<L.length;k++){const i=L[k],b=s.eth2[i];if(b<0)continue;
    if(s.pop[i]<1||b===s.eth[i]){s.eth2[i]=-1;continue}
    let m=s.mix[i];
    if(m>0.5){const a=s.eth[i];s.eth[i]=b;s.eth2[i]=a;m=1-m;s.mix[i]=m}
    const diaspora=s.seaDiasporas.get(i),supported=diaspora&&diaspora.people===s.eth2[i]&&s.year-diaspora.last<=40;
    if(m<0.03&&!supported){s.eth2[i]=-1;s.mixT[i]=0;continue}
    if(m>0.25)s.mixT[i]=Math.min(255,s.mixT[i]+1);else s.mixT[i]=Math.max(0,s.mixT[i]-1);
    if(s.mixT[i]>=15&&born<2&&r()<0.08*P.mixing){
      const A=s.eth[i];if(A<0)continue;
      const nid=newEth(A,b);born++;
      const q=s.q,changed=[];let h=0,t=0,cnt=0,pp=0;q[t++]=i;s.lab[i]=-7;
      while(h<t&&cnt<60){const c=q[h++];const ea=s.eth[c],eb=s.eth2[c];
        if((ea===A&&eb===b)||(ea===b&&eb===A)){changed.push({cell:c,eth:ea,eth2:eb,mix:s.mix[c],time:s.mixT[c]});s.eth[c]=nid;s.eth2[c]=-1;s.mix[c]=0;s.mixT[c]=0;cnt++;pp+=s.pop[c];
          for(let d=0;d<4;d++){const j=w.nb[c*4+d];if(j>=0&&w.land[j]&&s.lab[j]!==-7){s.lab[j]=-7;q[t++]=j}}}}
      for(let z=0;z<t;z++)s.lab[q[z]]=0;
      const E=s.eths,ne=E[nid];
      if(cnt<5){for(const old of changed){const c=old.cell;s.eth[c]=old.eth;s.eth2[c]=old.eth2;s.mix[c]=old.mix;s.mixT[c]=old.time}ne.alive=false;ne.stillborn=true;continue}
      if(pp>300000){chron('people',`From long mingling of the ${E[A].name} and the ${E[b].name}, a new people emerges: the ${ne.name}.`,i,[RE(E[A]),RE(E[b]),RE(ne)]);spot(`A new people, the ${ne.name}, is born of the ${E[A].name} and ${E[b].name}`,i,[RE(ne)])}
    }
  }
}
function cityPass(){
  const s=S,w=WD,r=s.r,pols=s.pols;
  for(const id of s.alive)pols[id].cityPop=0;
  for(const i of w.landIdx){const p=s.pol[i];
    if(s.city[i]>=0){if(p)pols[p].cityPop+=s.pop[i];continue}
    if(s.pop[i]<60000||s.farm[i]<0.5||!p)continue;
    const o=pols[p];if(i!==o.capital&&s.pop[i]<Math.max(90000,o.mp*0.6))continue;
    const L=langAt(i);s.city[i]=s.cities.length;s.cities.push({name:cityWord(L,r),cell:i,born:s.year,eth:s.eth[i],peak:s.pop[i]})}
  for(const c of s.cities)if(s.pop[c.cell]>c.peak)c.peak=s.pop[c.cell];
}
// shape of an empire at its peak: east-west versus north-south extent in km (Turchin, Adams & Hall 2006)
function polShape(o){const w=WD,cols=new Uint8Array(W);let la0=90,la1=-90,sl=0,n=0;
  for(const i of w.landIdx){if(S.pol[i]!==o.id||isWaste(i))continue;const la=w.lat[i]*57.2958;if(la<la0)la0=la;if(la>la1)la1=la;cols[w.cxA[i]]=1;sl+=la;n++}
  if(n<10)return null;let gap=0,run=0;for(let k=0;k<2*W;k++){if(cols[k%W])run=0;else{run++;if(run>gap)gap=run}}gap=Math.min(gap,W);
  const span=(W-gap+1)*360/W,ml=sl/n,ew=span*111*Math.cos(ml/57.2958),ns=(la1-la0+180/H)*111;return{ew:Math.round(ew),ns:Math.round(ns),n}}
function shapePass(){const s=S;
  for(const id of s.alive){const o=s.pols[id];if(o.kind!=='state')continue;const real=o.cells-(o.wasteN||0);if(real<60||real<(o.shapeN||0)*1.08)continue;
    const sh=polShape(o);if(!sh)continue;o.shapeN=real;o.shape=sh;if(!o.inShapes){o.inShapes=1;s.shapes.push(o.id)}}}
function regionPass(){
  const s=S,w=WD;
  if(s.year%50===0){if(!s.shapes)s.shapes=[];shapePass()}
  s.lmPop.fill(0);for(const i of w.landIdx)if(s.pop[i]>=1)s.lmPop[w.lm[i]]++;
  // dark ages: has writing been forgotten where a literate great power fell?
  s.darkWatch=s.darkWatch.filter(d=>{if(s.year-d.y<100)return true;let a=0;for(const c of d.cells)a+=s.admin[c];a/=Math.max(1,d.cells.length);
    const o=s.pols[d.id];if(a<0.3&&o)chron('culture',`A century after the fall of the ${o.peak}, writing has fallen out of use in most of its old lands.`,o.capital,[['pol',o.id,o.peak]],'With no state to pay scribes and no cities to need them, the skill was not passed on.');return false});
  if(!w.isEarth)return;
  const cnt=new Map();
  // the first kingdom holding a large share of a region's people (not its empty land)
  for(const R of w.regions){if(s.regionFirst[R.k])continue;cnt.clear();let tot=0;for(const i of R.cells){const pp=s.pop[i];tot+=pp;const p=s.pol[i];if(p&&s.pols[p].kind==='state'&&s.pols[p].tier!=='Chiefdom')cnt.set(p,(cnt.get(p)||0)+pp)}
    let best=0,bp=0;for(const [p,c] of cnt)if(c>best){best=c;bp=p}
    if(tot>0&&best>=0.3*tot){const o=s.pols[bp];s.regionFirst[R.k]={y:s.year,pol:bp,name:o.full}}}
  const share=cells=>{cnt.clear();for(const i of cells){let p=s.pol[i];if(!p)continue;let wt=1;const o=s.pols[p];if(o.over&&s.pols[o.over]&&s.pols[o.over].alive){p=o.over;wt=0.6}cnt.set(p,(cnt.get(p)||0)+wt)}let best=0,bp=0;for(const [p,c] of cnt)if(c>best){best=c;bp=p}return[cells.length?best/cells.length:0,bp]};
  const [cs,cp]=share(w.chinaCells);s.chinaHist.push([s.year,cs,cp]);
  const [ms,mp]=share(w.medCells);s.medHist.push([s.year,ms,mp]);
  if(ms>s.medBest.share)s.medBest={share:ms,y:s.year,pol:mp,name:mp?s.pols[mp].full:''};
  if(s.year%100===0||s.year>=0&&!s.farmCheck){s.stateNow={y:s.year,res:NOSTATE.map(R=>{let pc=0,sc=0;for(const i of w.landIdx){const la=w.lat[i]*180/Math.PI,lo=(w.cxA[i]+0.5)/W*360-180;if(la<R.box[0]||la>R.box[1]||lo<R.box[2]||lo>R.box[3]||s.pop[i]<1)continue;pc++;if(s.pol[i]&&s.pols[s.pol[i]].kind==='state'&&s.pols[s.pol[i]].tier!=='Chiefdom')sc++}return{n:R.n,share:pc?sc/pc:0,pc}})}}
  if(s.year>=0&&!s.farmCheck||s.year%100===0){const res=NOFARM.map(R=>{let pc=0,fc=0;for(const i of w.landIdx){const la=w.lat[i]*180/Math.PI,lo=(w.cxA[i]+0.5)/W*360-180;if(la<R.box[0]||la>R.box[1]||lo<R.box[2]||lo>R.box[3]||s.pop[i]<1)continue;pc++;if(s.farm[i]>0.5&&w.sF[i]>0.15)fc++}return{n:R.n,share:pc?fc/pc:0}});
    if(s.year>=0&&!s.farmCheck)s.farmCheck={y:s.year,res};s.farmNow={y:s.year,res}}
}
function recordStats(){
  const s=S,w=WD;let tp=0;const eraPop=new Float64Array(ERAS.length);
  for(const i of w.landIdx){const p=s.pop[i];if(p<1)continue;tp+=p;eraPop[eraOf(i)]+=p}
  let np=0,nh=0,big=null;for(const id of s.alive){const o=s.pols[id];if(o.cells>=2){if(o.kind==='horde')nh++;else np++}if(!big||o.cells>big.cells)big=o;if(o.cells>=3)o.hist.push(s.year,o.cells)}
  let pe=0;for(const e of s.eths)if(e.alive)pe++;
  let lead=0;for(let k=ERAS.length-1;k>=0;k--)if(eraPop[k]>tp*0.03){lead=k;break}
  s.stats.push({y:s.year,pop:tp,np,nh,big:big?big.full:'',bc:big?big.cells:0,pe,lead,gT:s.gT+epochTemp(),orb:s.orbM,eraPop:Array.from(eraPop,v=>v/(tp||1))});
}
function step(){for(const _ of stepG());}
// one simulated year, split into slices so the page can stay responsive between them
function* stepG(){
  const s=S;s.year++;
  climateStep();weather();hearthCheck();
  if(s.dTt>0){s.dTt--;if(!s.dTt)s.dT=0}
  else if(s.r()<0.0012*P.volcano)volcano();
  computeK();growth();yield;migrate();seaHop();
  if(s.year%3===0){techStep(0,0.34);yield;techStep(0.34,0.67);yield;techStep(0.67,1);yield}
  disease();if(calendarPhase(s.year,10)===5)poolPass();if(calendarPhase(s.year,20)===7)caravanPass();yield;
  yield* politicsG();
  if(s.year%20===0){yield;ethPass(true);yield;relPass()}
  if(s.year%10===0){yield;recordStats();cityPass();yield;regionPass();yield;mixPass()}
  colonyStep();
}

/* ================= v0.5: land, ecology, disease, contact, inequality ================= */
// static ecological layers derived from the world once
function prepEco(w){
  if(w.ecoReady)return;
  const forest0=new Float32Array(N),heavy=new Float32Array(N),mal=new Float32Array(N),oncho=new Float32Array(N),circ=new Float32Array(N),good=new Float32Array(N);
  for(const i of w.landIdx){const t=w.T[i],p=w.Pr[i],rv=w.rv[i];
    forest0[i]=w.desert[i]?0:clamp((p-380)/520,0,1)*clamp((t+6)/8,0,1)*(1-0.5*clamp((w.elev[i]-3000)/800,0,1));
    heavy[i]=clamp((p-650)/400,0,1)*clamp((17-t)/5,0,1)*(1-clamp(rv*2,0,0.6));
    mal[i]=w.elev[i]<1500?clamp((t-19)/5,0,1)*clamp((p-650)/700,0,1):0;
    oncho[i]=rv>0.25&&w.rough[i]>0.12?clamp((t-21)/3,0,1)*clamp((p-700)/300,0,1)*clamp((1900-p)/300,0,1):0;
    good[i]=w.sF[i]+0.5*w.rv[i]*(w.sF[i]>0.05?1:0)}
  // environmental circumscription (Carneiro): good land hemmed in by poor land or sea
  const sur=Float32Array.from(good);boxBlur(sur,W,H,7,6,true);
  for(const i of w.landIdx){const own=good[i];if(own<0.15)continue;circ[i]=clamp((1-sur[i]/own)*1.3,0,1)}
  // ecological niche of each province (Turchin, Adams & Hall 2006): climate, moisture, way of life, disease setting
  const nT=new Float32Array(N),nM=new Float32Array(N),nN=new Float32Array(N),nD=new Float32Array(N);
  for(const i of w.landIdx){nT[i]=w.T[i]/8;nM[i]=2*clamp(Math.log(Math.max(1,w.Pr[i])/150)/Math.log(20),0,1);nN[i]=w.nomad[i]?1.2:w.desert[i]?0.8:0;nD[i]=0.8*mal[i]+(w.tsetse[i]?0.5:0)}
  Object.assign(w,{forest0,heavy,mal,oncho,circ,nT,nM,nN,nD,ecoReady:true});
}
// how strongly a place's people are tied to a technique's ecological niche
// Multiple societies developed accounting and roads without iron, wheels or
// coinage. Gate the practical skills themselves rather than one regional sequence.
function inventionChance(o,k){
  const s=S,w=WD,T=TECH[k],em=T.em,c=o.capital;
  if(!em||s.tk[k][c]>=0.5)return 0;
  // Irrigated towns can develop accounting before a large territorial kingdom exists.
  const emP=em.pop*0.6*(k===6?1-0.75*riverAdministration(c):1);
  if((em.after&&w.isEarth&&s.year<em.after)||o.pop<emP*0.5||(em.cells&&o.cells<em.cells)||(em.coast&&!w.coast[c]&&o.coastN<2)||(em.horse&&s.horse[c]<0.6)||(em.heavy&&(o.hvN||0)<3))return 0;
  if(T.pre.some(p=>s.tk[p][c]<0.7))return 0;
  const fit=techFit(o,k),bos=em.press?clamp((o.press-0.7)*5,0,2):1;
  return em.b*P.invent*Math.min(3,Math.sqrt(o.pop/emP))*(0.7+0.9*o.cult)*bos*(T.synth?fit*fit*2.5:0.6+0.8*fit);
}
function techFit(o,k){const p=TECH[k].pos;if(!p||!o.fac)return 1;const dx=p[0]-o.fac[0],dy=p[1]-o.fac[1];return Math.exp(-(dx*dx+dy*dy)/0.6)}
function ecoD(i,o){const v=o.ni;if(!v)return 0;const w=WD,a=w.nT[i]-v[0],b=w.nM[i]-v[1],c=w.nN[i]-v[2],d=w.nD[i]-v[3];return Math.sqrt(a*a+b*b+c*c+d*d)}
// land with nothing a state can tax: empty, or held by foragers with no fields or herds worth the name
function isWaste(i,horde){const s=S,w=WD;if(s.pop[i]<1)return true;if(s.pop[i]/w.area[i]<0.25&&w.sF[i]<0.12)return true;if(s.farm[i]*w.sF[i]>=0.12||s.car[i]>=0.3||s.city[i]>=0)return false;
  const hp=s.herd[i]*Math.max(w.sH[i],w.desert[i]*s.camel[i]*0.6);return horde?hp<0.15:s.K[i]/w.area[i]<2.5}
// Tainter: complexity has rising upkeep; Goldstone: fiscal crisis; Turchin/Scheidel: the wealth pump and its levellers
function statecraft(o,c,y){
  const s=S,r=s.r;
  if(o.cplx==null){o.cplx=0.2;o.treas=0.3;o.ineq=0.25;o.warC=0}
  if(o.kind!=='state'){o.pT=o.pF=o.pQ=0;o.burden=0;return}
  const real=Math.max(1,o.cells-(o.wasteN||0));
  const atWar=o.enemies.size>0;
  // Sustained campaigning can build coordination; it fades gradually in peace.
  o.warC=clamp((o.warC||0)*0.995+(atWar?0.005:0),0,1);
  const tgt=0.15+0.35*s.admin[c]+0.2*s.law[c]+0.2*s.roads[c]+0.15*s.paper[c]+0.3*Math.min(1,real/250)+0.1*Math.min(1,o.fortN/20)+0.2*Math.min(1,o.warC);
  o.cplx+=tgt>o.cplx?0.01*(tgt-o.cplx):0.0015*(tgt-o.cplx);
  const ledger=s.tk[27][c]>0.5;
  const upkeep=0.28*Math.pow(o.cplx,ledger?1.6:1.8)*o.pop,rev=(o.tax||0)*(ledger?1.1:1)+1;
  o.burden=upkeep/rev;
  o.pT=Math.max(0,o.burden-1)*1.2;
  o.treas=clamp(o.treas+0.04*(1-o.burden)-(atWar?0.02:0),-2,1);
  o.pF=Math.max(0,-o.treas)*0.6;
  if(o.treas<-1.2&&s.law[c]>0.5&&r()<0.02){
    if(o.ineq>0.5&&r()<0.5){o.treas=0;o.ineq=Math.max(0.2,o.ineq-0.12);o.mandate=Math.min(1,o.mandate+0.15);if(real>=25)chron('culture',`${cap(rulerName(o))} of the ${o.full} proclaims a jubilee: debts are cancelled and debt-slaves freed.`,c,[R_(o)],'Debts had piled up faster than anyone could repay them; cancelling them bought peace and loyalty.')}
    else{o.treas=-0.2;o.mandate=Math.max(0,o.mandate-0.2);o.shock+=0.3;if(real>=25)chron('fall',`The treasury of the ${o.full} is empty: the crown defaults on its debts and its soldiers go unpaid.`,c,[R_(o)],'Spending on armies and officials had long outrun what the land could pay.')}}
  // the wealth pump: crowded land and peace concentrate wealth, faster where the plough makes land the prize
  const plF=(o.plN||0)/real;
  o.ineq=clamp(o.ineq+0.0012*(o.press-0.75)*(1+0.8*plF)+(atWar?0:0.0004)-0.0004*(1-plF)*(o.ineq-0.25),0.15,0.92);
  o.pQ=Math.max(0,o.ineq-0.55)*(o.press>0.85?1.6:0.6);
  // labour scarcity after great dying
  if(y%10===0){if(o.p10&&o.pop<0.8*o.p10&&o.plagueD>0.1*o.p10){const was=o.ineq;o.ineq=Math.max(0.2,o.ineq-0.15);if(real>=30&&was>0.45)chron('culture',`After the great dying, labour is scarce in the ${o.full}: wages rise and the great landholders lose their grip.`,c,[R_(o)],'So many had died that the survivors could bargain for their work.')}
    o.p10=o.pop;o.plagueD=0}
  // position in need/energy space, for invention
  const need=clamp((o.press-0.8)*2+(atWar?0.3:0)+0.5*Math.max(0,o.burden-0.8)-0.3*Math.max(0,1-o.press),-1,1);
  const energy=clamp(-0.8+0.6*s.ard[c]+0.5*s.iron[c]+0.4*s.horse[c]+0.3*(o.coastN/Math.max(1,o.cells))+0.4*WD.rv[c]+0.3*s.camel[c]+0.3*s.wheel[c],-1,1);
  o.fac=[need,energy];
}
function localPop(i){const w=WD,s=S;let t=s.pop[i];for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0)t+=s.pop[j]}return t*1.8}
// the exit option (Herbst, Scott): open land nearby lets subjects walk away; crowding or barren surroundings trap them (Carneiro)
// Reusable scratch space stays outside saves; each call refreshes all land values.
const exitOpportunity=new Float64Array(N);
function exitPass(a0,b0){if(a0==null){a0=0;b0=1}
  const s=S,w=WD,LL=w.landIdx,opportunity=exitOpportunity;
  // A destination's attraction is identical for every nearby origin. Compute it
  // once, then sum in the same order as before to preserve exact results.
  for(const j of LL){const q=Math.max(w.sF[j],0.5*w.forest0[j]*(w.T[j]>10?1:0.3),0.4*w.sH[j]),pd=Math.max(0.3,7*q);opportunity[j]=q*Math.max(0,1-s.pop[j]/w.area[j]/pd)*(s.pol[j]?0.4:1)}
  for(let kk=Math.floor(a0*LL.length),ke=Math.floor(b0*LL.length);kk<ke;kk++){const i=LL[kk];if(s.pop[i]<1||w.sF[i]<0.1){s.circE[i]=w.circ[i];continue}
    const cx=w.cxA[i],cy=w.cyA[i];let tot=0,n=0;
    for(let dy=-3;dy<=3;dy++){const yy=cy+dy;if(yy<0||yy>=H)continue;for(let dx=-3;dx<=3;dx++){if(!dx&&!dy)continue;const j=yy*W+(cx+dx+W)%W;n++;if(!w.land[j])continue;
      tot+=opportunity[j]}}
    const ex=tot/n,own=w.sF[i]+0.1;s.exit[i]=ex;
    s.circE[i]=clamp(Math.max(w.circ[i],1-1.6*ex/own),0,1)}
}
// disease pools (McNeill, Crosby): dense, connected farming and herding peoples build up crowd diseases and immunity to them
function poolPass(){
  const s=S,w=WD,L=w.landIdx,dp=s.dp,tmp=s.poolNext;tmp.fill(0);
  for(const i of L){if(s.pop[i]<1){tmp[i]=clamp(dp[i]*0.98,0,1);continue}
    const dens=s.pop[i]/w.area[i],tgt=Math.min(1,0.22*Math.log10(1+dens)+0.3*s.herd[i]*s.farm[i]+(s.city[i]>=0?0.2:0));
    let m=dp[i];for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j<0||s.pop[j]<1)continue;const c=Math.min(1,Math.sqrt(s.pop[i]*s.pop[j])/20000+s.car[i]);m=Math.max(m,dp[j]*(0.9+0.08*c))}
    if(w.coast[i]&&s.sail[i]>0.5)for(let q=w.ls[i];q<w.ls[i+1];q++){const j=w.lt[q];if(s.pop[j]>=1)m=Math.max(m,dp[j]*0.92)}
    tmp[i]=clamp(dp[i]+0.06*(Math.max(tgt,m)-dp[i]),0,1)}
  dp.set(tmp);
  // cattle plague
  const r=s.r;
  if(r()<0.04*P.disease){for(let t=0;t<60;t++){const c=L[(r()*L.length)|0];if(s.herd[c]<0.6||w.sH[c]<0.3||s.pop[c]<100)continue;
    let n=0;ring(c,9,(j,dx,dy)=>{if(w.land[j]&&s.herd[j]>0.3&&dx*dx+dy*dy<=81){s.rp[j]=Math.max(s.rp[j],0.65);n++}});
    const e=s.eth[c]>=0?s.eths[s.eth[c]]:null;chron('plague',`A cattle plague sweeps the herds${e?` of the ${e.name}`:''}; herders lose most of their beasts, and hunger drives many from the land.`,c,e?[RE(e)]:[]);
    if(e)pushPressure(s.eth[c],s.pop[c]*0.3*Math.min(20,n),c,0,null);break}}
}
// volcanic winters, small and great
function volcano(){
  const s=S,r=s.r,great=r()<0.15;
  s.dT=great?-2.3:-0.8-0.6*r();s.dTt=great?4+((r()*3)|0):1+((r()*2)|0);
  if(!great){chron('nature','A great eruption veils the sun; harvests fail across the cooler lands for several years.');return}
  chron('nature','A colossal eruption darkens the sky: the sun is dim for years, summers fail across the world, and hunger stalks every land.',-1,[],'Volcanic ash and sulphur in the high atmosphere reflect sunlight back to space.');
  spot('A volcanic winter grips the world',-1,[]);
  for(const id of s.alive){const o=s.pols[id];o.mandate=Math.max(0,(o.mandate==null?1:o.mandate)-0.25);o.shock+=0.15}
  // famine weakens bodies: a plague often follows
  if(r()<0.5){const L=WD.landIdx;let best=-1,bd=0;for(let t=0;t<300;t++){const i=L[(r()*L.length)|0];const d=s.pop[i]/WD.area[i]*(1+s.car[i]*3+(s.city[i]>=0?2:0));if(d>bd&&!s.infect[i]){bd=d;best=i}}
    if(best>=0){const e=s.eth[best]>=0?s.eths[s.eth[best]]:null;const o={id:s.outbreaks.length,name:`${e?cap(e.lang.lex.river)+' ':''}${pick(r,PLAGUE)}`,origin:best,year:s.year,deaths:0,vir:0.18+r()*0.1,cells:1,active:1,done:false,spread:[[0,best]],hit:new Set()};
      s.outbreaks.push(o);s.infect[best]=3;s.ob[best]=o.id;s.inf.push(best);chron('plague',`In the hungry years after the eruption, the ${o.name} breaks out.`,best,[RPl(o)])}}
}
// caravan routes across deserts: need camels (or wind wagons), people at both ends, and demand
function caravanPass(){
  const s=S,w=WD,r=s.r,L=w.landIdx,par=s.bfsPar,dist=s.bfsD;
  for(const i of L)if(s.car[i]>0)s.car[i]*=0.82;
  const arid=j=>w.land[j]&&(w.desert[j]||w.Pr[j]<300);
  const srcs=[];
  for(let t=0;t<2500&&srcs.length<14;t++){const i=L[(r()*L.length)|0];if(arid(i)||!s.pol[i]||s.pop[i]/w.area[i]<1.5)continue;
    if(s.camel[i]<0.5&&s.tk[25][i]<0.5)continue;let ok=false;for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j>=0&&arid(j))ok=true}if(ok)srcs.push(i)}
  const mark=s.bfsMark||(s.bfsMark=new Int32Array(N));
  for(const a of srcs){
    if(s.bfsStamp>=2147483646){mark.fill(0);s.bfsStamp=0}
    const st=++s.bfsStamp;
    const q=[a];mark[a]=st;par[a]=-1;dist[a]=0;let hit=-1;
    for(let h=0;h<q.length&&hit<0;h++){const i=q[h];if(dist[i]>70)break;
      for(let d=0;d<4;d++){const j=w.nb[i*4+d];if(j<0||!w.land[j]||mark[j]===st)continue;
        if(arid(j)){if(q.length<6000){mark[j]=st;par[j]=i;dist[j]=dist[i]+1;q.push(j)}}
        else if(dist[i]>=8&&s.pop[j]/w.area[j]>1.5&&s.pol[j]!==s.pol[a]){par[j]=i;hit=j;break}}}
    if(hit<0)continue;
    const path=[];for(let c=hit,g=0;c>=0&&g<200;c=par[c],g++){path.push(c);if(c===a)break}
    for(const c of path)s.car[c]=1;
    const pa=s.pols[s.pol[a]],pb=s.pols[s.pol[hit]]||null,ea=s.eths[s.eth[a]],eb=s.eths[s.eth[hit]];
    const key=[ea?ea.fam:-1,eb?eb.fam:-1].sort().join(':');
    let R=s.routes.find(x=>x.key===key);
    const pts=path.filter((c,k)=>k%2===0||k===path.length-1);
    if(!R){R={id:s.routes.length,key,born:s.year,a,b:hit,path:pts};s.routes.push(R);
      if(ea&&eb&&ea.fam!==eb.fam&&!s.carPairs.has(key)){s.carPairs.add(key);chron('migration',`Caravans begin to cross the desert between the ${pa?pa.full:ea.name} and the ${pb?pb.full:eb.name}, carrying salt, gold, slaves and ideas.`,path[path.length>>1],[pa?R_(pa):RE(ea),pb?R_(pb):RE(eb)])}}
    else{R.path=pts;R.a=a;R.b=hit}
    R.last=s.year;
  }
  s.routes=s.routes.filter(R=>s.year-R.last<80);
}
// the exchange of crops between long-separated farming worlds (Crosby)
function cropExchange(a,b){
  const s=S,w=WD;if(s.farm[a]<0.5||s.farm[b]<0.5||Math.max(s.ocean[a],s.ocean[b])<=0.5||w.lm[a]===w.lm[b]||Math.max(w.lmSize[w.lm[a]],w.lmSize[w.lm[b]])<200)return;
  const key=[w.lm[a],w.lm[b]].sort().join(':');if(s.cropX.has(key))return;s.cropX.add(key);
  seedTech(s.xcrops,a,1,1);seedTech(s.xcrops,b,1,1);s.firstTech[23]=s.firstTech[23]||{y:s.year,cell:b};
  const ca=cropFor(w.T[a],w.Pr[a],w.rv[a])[0],cb=cropFor(w.T[b],w.Pr[b],w.rv[b])[0],ea=s.eths[s.eth[a]],eb=s.eths[s.eth[b]];
  chron('ideas',`Ships carry ${ca} to the ${eb?eb.name:'far shore'}, and bring ${cb===ca?'other crops':cb} home to the ${ea?ea.name:'homeland'}. Over the coming centuries the new crops will let poor and marginal soils feed far more people.`,b,[ea?RE(ea):null,eb?RE(eb):null].filter(Boolean));
  spot('New crops cross the ocean',b,[]);
}

