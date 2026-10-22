"use strict";
// Versioned starting conditions; simulation progress is deliberately not a save game.
function encodeMap(values){
  const bytes=new Uint8Array(values.length*4),view=new DataView(bytes.buffer);
  for(let i=0;i<values.length;i++)view.setFloat32(i*4,values[i],true);
  const chunks=[];for(let i=0;i<bytes.length;i+=32768)chunks.push(String.fromCharCode(...bytes.subarray(i,i+32768)));
  return {encoding:'float32-le-base64',data:btoa(chunks.join(''))};
}
function decodeMap(map,name){
  const size=HW*HH;
  if(!map||map.encoding!=='float32-le-base64'||typeof map.data!=='string'||map.data.length!==4*Math.ceil(size*4/3))throw new Error('Invalid '+name+' map size or encoding.');
  const raw=atob(map.data);if(raw.length!==size*4)throw new Error('Invalid '+name+' map length.');
  const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),view=new DataView(bytes.buffer),values=new Float32Array(size);
  for(let i=0;i<size;i++){const v=view.getFloat32(i*4,true);if(!Number.isFinite(v)||(name==='precipitation'&&v<0))throw new Error('Invalid '+name+' map value.');values[i]=v}
  return values;
}
function validateExperiment(input){
  if(!input||input.format!=='world-engine-experiment'||input.schemaVersion!==1)throw new Error('Unsupported experiment file.');
  if(input.engineVersion!==ENGINE_VERSION)throw new Error('This experiment needs World Engine '+input.engineVersion+'; this engine is '+ENGINE_VERSION+'.');
  const seed=(v,name)=>{if(typeof v!=='string'||!v.length||v.length>512)throw new Error('Invalid '+name+'.');return v};
  const number=(v,min,max,name)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('Invalid '+name+'.');return v};
  const parameters=(value,defs,keyIndex,minIndex,maxIndex)=>Object.fromEntries(defs.map(d=>[d[keyIndex],number(value&&value[d[keyIndex]],d[minIndex],d[maxIndex],d[keyIndex])]));
  const rules=parameters(input.rules,PDEF,1,3,4),climate=parameters(input.climate,CDEF,0,2,3);
  if(!['historical','random'].includes(input.rules.hearthMode)||typeof input.rules.shuffleNames!=='boolean'||typeof input.rules.fitClimate!=='boolean')throw new Error('Invalid history options.');
  Object.assign(rules,{hearthMode:input.rules.hearthMode,shuffleNames:input.rules.shuffleNames,fitClimate:input.rules.fitClimate});
  const src=input.world;
  if(!src||!['earth','generated','import'].includes(src.source)||typeof src.fitClimate!=='boolean'||src.dataset!=='earth-v1')throw new Error('Unsupported world source or dataset.');
  const world={source:src.source,seed:seed(src.seed,'world seed'),landFrac:number(src.landFrac,0.2,0.5,'land share'),fitClimate:src.fitClimate,dataset:src.dataset};
  if(src.source==='import'){
    decodeMap(src.maps&&src.maps.height,'height');
    if(src.maps.temperature)decodeMap(src.maps.temperature,'temperature');
    if(src.maps.precipitation)decodeMap(src.maps.precipitation,'precipitation');
    world.maps={height:src.maps.height,...(src.maps.temperature?{temperature:src.maps.temperature}:{}),...(src.maps.precipitation?{precipitation:src.maps.precipitation}:{})};
  }
  return {format:'world-engine-experiment',schemaVersion:1,engineVersion:ENGINE_VERSION,world,historySeed:seed(input.historySeed,'history seed'),rules,climate};
}
function exportExperiment(){
  if(!WD||!S)throw new Error('Build a world first.');
  const world={...WD.generation,dataset:'earth-v1'};
  if(WD.importSource){const m=WD.importSource;world.maps={height:encodeMap(m.height),...(m.temp?{temperature:encodeMap(m.temp)}:{}),...(m.prec?{precipitation:encodeMap(m.prec)}:{})}}
  return validateExperiment({format:'world-engine-experiment',schemaVersion:1,engineVersion:ENGINE_VERSION,world,historySeed:String(S.seed),rules:S.initialRules,climate:WD.climateRules});
}
function experimentHash(experiment){
  const config=validateExperiment(experiment);
  if(config.world.source==='import')throw new Error('Imported maps travel with the exported experiment file. Use Export setup to share this world.');
  return '#experiment='+encodeURIComponent(JSON.stringify(config));
}
function experimentFromHash(hash){
  if(!hash.startsWith('#experiment='))return null;
  if(hash.length>65536)throw new Error('Experiment link is too large. Use an experiment file.');
  const config=validateExperiment(JSON.parse(decodeURIComponent(hash.slice(12))));
  if(config.world.source==='import')throw new Error('Import this world from its experiment file.');
  return config;
}
function restoreExperiment(input,earth){
  const config=validateExperiment(input),world=config.world;
  const options={seed:world.seed,landFrac:world.landFrac};
  if(world.source==='earth'){
    if(!earth)throw new Error('Earth assets are not loaded.');
    Object.assign(options,{earth:true,height:earth.height,kg:earth.kg,fit:world.fitClimate});
  }else if(world.source==='import'){
    options.height=decodeMap(world.maps.height,'height');
    if(world.maps.temperature)options.temp=decodeMap(world.maps.temperature,'temperature');
    if(world.maps.precipitation)options.prec=decodeMap(world.maps.precipitation,'precipitation');
  }
  const previous={rules:{...P},climate:{...CL},world:WD,state:S};
  try{Object.assign(P,config.rules);Object.assign(CL,config.climate);WD=genWorld(options);newHistory(config.historySeed)}
  catch(error){Object.assign(P,previous.rules);Object.assign(CL,previous.climate);WD=previous.world;S=previous.state;throw error}
  return config;
}
