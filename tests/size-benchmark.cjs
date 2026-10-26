// Lossless size/encoding benchmark; node tests/size-benchmark.cjs --codec previous-codec.js
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib');
const {loadCore}=require('./core-harness.cjs'),root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),files=['index.html',...[...html.matchAll(/(?:src|href)="((?:js|assets|styles)\/[^"?]+)(?:\?[^" ]*)?"/g)].map(m=>m[1])];
const resources=[...new Set(files)].map(file=>{const bytes=fs.readFileSync(path.join(root,file));return{file,bytes:bytes.length,gzipBytes:z.gzipSync(bytes).length}});
const a=loadCore();a.earth();a.start();const payload=a.save('Size benchmark');
function measure(encode){const at=performance.now(),raw=encode(payload),encodeMs=performance.now()-at,t=performance.now(),gzip=z.gzipSync(raw);return{rawBytes:raw.length,gzipBytes:gzip.length,encodeMs,gzipMs:performance.now()-t}}
globalThis.sizeBenchmarkPayload=payload;const current=measure(()=>a.inspect('encodeSaveGraph(globalThis.sizeBenchmarkPayload)'));delete globalThis.sizeBenchmarkPayload;
const args=process.argv.slice(2),i=args.indexOf('--codec');let previous;
if(i>=0){const encode=Function(fs.readFileSync(args[i+1],'utf8')+';return encodeSaveGraph')();previous=measure(encode)}
let customAddress;
if(args.includes('--custom-address')){
 a.inspect("WD.generation.source='import';WD.importSource={height:WD.eHi,temp:WD.tHi,prec:WD.pHi}");
 let at=performance.now();const oldHash=a.inspect('experimentAddressHash(exportExperiment())'),previousMs=performance.now()-at;
 at=performance.now();const newHash=a.inspect('currentExperimentAddressHash()'),currentMs=performance.now()-at;
 if(oldHash!==newHash)throw new Error('Custom-world addresses differ');customAddress={previousMs,currentMs};
}
console.log(JSON.stringify({resources,totalBytes:resources.reduce((n,r)=>n+r.bytes,0),totalGzipBytes:resources.reduce((n,r)=>n+r.gzipBytes,0),initialSave:{previous,current},customAddress},null,2));
