export const generatedId = (): string =>
  `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;

export const getWorkerTemplate = () => {
  const template = `self.cw$=a=>{const b=new Map(),c=new Map([['',()=>{throw"you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage"}]]),d=({messageId:e,payload:f,origin:g})=>{const h=new Set(),i=j=>{const{progress:k}=j;k||b.delete(e),self.postMessage({messageId:e,...j},g)},l=(...m)=>{i({resolved:{payload:m}})},n=o=>{i({rejected:{reason:o}})},p=q=>{[...h].forEach(r=>r(q)),i({worker_canceled:{reason:q}})},s=(t,u)=>{i({progress:{percentage:t,payload:u}})},v=w=>(h.add(w),()=>h.delete(w));return{payload:f,resolve:l,reject:n,cancel:p,onCancel:v,reportProgress:s}},x=(...y)=>{self.importScripts(...y)},z=(...A)=>{const[B,C]=A,D=typeof B==='string';if(D){const E=B,F=C;c.set(E,F);return;}const G=B;c.set('',G)},H=()=>{[...b.values()].forEach(I=>I.reject(new Error('worker closed')));self.close();};self.onmessage=J=>{const{data:K,origin:L}=J,{messageId:M,cancelation:N}=K;if(N){const{reason:O}=N,P=b.get(M);P.cancel(O);return;}const{method:Q,execution:R}=K,{payload:S}=R,T=d({messageId:M,payload:S,origin:a||L||undefined});b.set(M,T);const U=c.get(Q||'');U(T,J)};return{importScripts:x,onMessage:z,close:H}};`;
  return template;
};
