"use strict";
importScripts('save-codec.js?v=0.13.0');
self.onmessage=async({data})=>{
 try{const result=data.action==='encode'?await encodeWorldFile(data.payload):await decodeWorldFile(data.bytes);
  self.postMessage({result},result instanceof Uint8Array?[result.buffer]:[]);
 }catch(error){self.postMessage({error:error.message||'The world save could not be processed.'})}
};
