// Lossless repacking: retain every original signed elevation delta and climate byte.
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib');
const file=path.resolve(__dirname,'../assets/earth.js'),source=fs.readFileSync(file,'utf8');
const [e,k]=Function(source+';return [EARTH_ELEV_B64,KOPPEN_B64]')();
const packed=z.inflateSync(Buffer.from(e,'base64')),width=1600,count=1280000;
let deltas;
if(packed.length===count*2)deltas=new Int16Array(packed.buffer,packed.byteOffset,count);
else{
 if(packed.toString('ascii',0,4)!=='WEE1')throw Error('Unknown elevation format');
 deltas=new Int16Array(count);let at=4;
 for(let i=0;i<count;i++){let v=0,shift=0,b;do{b=packed[at++];v|=(b&127)<<shift;shift+=7}while(b&128);deltas[i]=((v>>>1)^-(v&1))+(i>=width?deltas[i-width]:0)}
 if(at!==packed.length)throw Error('Invalid elevation length');
}
const bytes=[87,69,69,49];
for(let i=0;i<count;i++){
 const x=(deltas[i]-(i>=width?deltas[i-width]:0))<<16>>16;let v=(x<<1)^(x>>15);
 do{const b=v&127;v>>>=7;bytes.push(b|(v?128:0))}while(v);
}
const elevation=z.deflateSync(Buffer.from(bytes),{level:9}).toString('base64');
const climate=z.deflateSync(z.inflateSync(Buffer.from(k,'base64')),{level:9}).toString('base64');
const result=`const EARTH_ELEV_B64=${JSON.stringify(elevation)};\nconst KOPPEN_B64=${JSON.stringify(climate)};\n`;
fs.writeFileSync(file,result);console.log(JSON.stringify({beforeBytes:Buffer.byteLength(source),afterBytes:Buffer.byteLength(result)}));
