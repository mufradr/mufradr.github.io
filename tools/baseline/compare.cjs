const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function compare(before,after){
 assert.equal(before.protocol,after.protocol,'Measurement protocols differ');
 const old=new Map(before.runs.map(r=>[r.id,r])),now=new Map(after.runs.map(r=>[r.id,r])),ratio=(a,b)=>Number.isFinite(a)&&a>0&&Number.isFinite(b)?b/a:null;
 return {protocol:before.protocol,missingBefore:[...now.keys()].filter(k=>!old.has(k)),missingAfter:[...old.keys()].filter(k=>!now.has(k)),runs:[...now.values()].filter(b=>old.has(b.id)).map(b=>{
  const a=old.get(b.id);assert.equal(a.category,b.category);assert.equal(a.startYear,b.startYear,'Run starting years differ');assert.equal(a.endYear,b.endYear,'Run horizons differ');assert.equal(a.repeats,b.repeats,'Repeat counts differ');
  return {id:b.id,category:b.category,kernelTimeRatio:ratio(a.performance.kernelMs.median,b.performance.kernelMs.median),sliceP95Ratio:ratio(a.performance.sliceP95Ms.median,b.performance.sliceP95Ms.median),finalSaveRatio:ratio(a.save.final.gzipBytes,b.save.final.gzipBytes),worldBufferRatio:ratio(a.worldBuffers.bytes,b.worldBuffers.bytes),
   before:{first:a.first,longevity:a.empireLongevity,decline:a.majorDecline,final:a.final},after:{first:b.first,longevity:b.empireLongevity,decline:b.majorDecline,final:b.final}};
 })};
}
function main(){
 const [beforeDir,afterDir]=process.argv.slice(2);if(!beforeDir||!afterDir)throw Error('Usage: node tools/baseline/compare.cjs BEFORE_DIRECTORY AFTER_DIRECTORY');
 const read=(d,f)=>JSON.parse(fs.readFileSync(path.join(d,f),'utf8')),before=read(beforeDir,'manifest.json'),after=read(afterDir,'manifest.json');
 assert.deepEqual(before.identity.protocol,after.identity.protocol,'Protocol definitions differ');assert.equal(before.identity.runnerSHA256,after.identity.runnerSHA256,'Use the same measurement harness against both engine checkouts');assert.equal(before.identity.requestedEndYear,after.identity.requestedEndYear,'Requested horizons differ');
 const result=compare(read(beforeDir,'summary.json'),read(afterDir,'summary.json'));
 result.environmentWarnings=['node','platform','arch','cpu','logicalCPUs'].filter(k=>before.environment[k]!==after.environment[k]).map(k=>'Different '+k+'; timings are not directly comparable');
 result.source={before:before.identity.source.commit,after:after.identity.source.commit};
 for(const r of result.runs)r.withinProvisionalCPUAllowance=result.environmentWarnings.length?null:r.kernelTimeRatio<=1.1;
 const bfile=path.join(beforeDir,'browser.json'),afile=path.join(afterDir,'browser.json');
 if(fs.existsSync(bfile)&&fs.existsSync(afile)){
  const b=read(beforeDir,'browser.json'),a=read(afterDir,'browser.json');result.browser={sameBrowser:b.browserVersion===a.browserVersion,sameHarness:b.runnerSHA256===a.runnerSHA256,before:b.cases,after:a.cases};
 }
 fs.writeFileSync(path.join(afterDir,'comparison.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
}
if(require.main===module)try{main()}catch(e){console.error(e.message);process.exitCode=1}
module.exports={compare};
