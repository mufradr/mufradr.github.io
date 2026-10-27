"use strict";
importScripts('save-codec.js?v=0.17.0-dev.2');
self.onmessage=async({data})=>{
 try{const transfer=[];const result=data.action==='encode'?await encodeWorldFile(data.payload):await decodeWorldFile(data.bytes,transfer);
  if(data.action==='encode')transfer.push(result.buffer);
  self.postMessage({result},transfer);
 }catch(error){self.postMessage({error:error.message||'The world save could not be processed.'})}
};
