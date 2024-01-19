export const generatedId = (): string =>
  `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;

/**
 * This function contains an obfuscated version of the StaticEasyWebWorker internal auto invocable function, without comments or types
 * this template is used to create dynamic workers from strings templates
 * PLEASE KEEP THIS FUNCTION UPDATED WITH THE LATEST VERSION OF THE StaticEasyWebWorker CLASS
 * [IMPORTANT] Avoid ";" at the end of the template
 * for minifying the template, please use the following options:
 * - remove comments
 * - remove types
 * - compress using: https://www.toptal.com/developers/javascript-minifier
 */
export const getWorkerTemplate = () => {
  const template = `(()=>{let e=new Map,o=new Map([["",()=>{throw"you didn't define a message-callback, please assign a callback by calling easyWorker.onMessage"}]]),t=({messageId:o,payload:t,method:n})=>{let a="pending",r=new Map,s=(t,s,l=[])=>{let c=a,i="progress"===t?"pending":t;if(!e.has(o)){let g="%c#"+o+" Message Not Found: %cThis means that the message was already resolved | rejected | canceled. To avoid this error, please make sure that you are not resolving | rejecting | canceling the same message twice. Also make sure that you are not reporting progress after the message was processed. Remember each message can handle his one cancelation by adding a handler with the %cmessage.onCancel%c method. To now more about this method, please check the documentation at: %chttps://www.npmjs.com/package/easy-web-worker#ieasywebworkermessageipayload--null-iresult--void %cTrying to process message:";console.error(g,"color: darkorange; font-size: 12px; font-weight: bold;","font-weight: normal;","font-weight: bold;","font-weight: normal;","color: lightblue; font-size: 10px; font-weight: bold;","font-weight: bold; color: darkorange;",{messageId:o,status:{current:c,target:i},method:n,action:s});return}let d={resolved:"onResolve",rejected:"onReject",canceled:"onCancel",worker_cancelation:"onCancel",pending:"onProgress"}[i],h=r.get(d);h?.forEach(e=>e(s,l));let w=!s.progress;w&&(r.get("onFinalize")?.forEach(e=>e(s,l)),e.delete(o)),self.postMessage({messageId:o,...s},l),a=i},l=(e,o=[])=>s("resolved",{resolved:{payload:void 0===e?[]:[e]}},o),c=(e,o=[])=>{s("rejected",{rejected:{reason:e}},o)},i=(e,o=[])=>s("worker_cancelation",{worker_cancelation:{reason:e}},o),g=(e,o,t=[])=>{s("progress",{progress:{percentage:e,payload:o}},t)},d=e=>o=>{r.has(e)||r.set(e,new Set);let t=r.get(e);return t.add(o),()=>t.delete(o)};return{messageId:o,method:n,payload:t,getStatus:()=>a,isPending:()=>"pending"===a,resolve:l,reject:c,cancel:i,reportProgress:g,onResolve:d("onResolve"),onReject:d("onReject"),onCancel:d("onCancel"),onProgress:d("onProgress"),onFinalize:d("onFinalize")}},n=(...e)=>{let[t,n]=e,a="string"==typeof t;if(a){let r=t,s=n;o.set(r,s);return}let l=t;o.set("",l)},a=()=>{let o=[...e.values()];o.forEach(e=>e.reject(Error("worker closed"))),self.close()};self.onmessage=n=>{let{data:a}=n,{messageId:r,cancelation:s}=a;if(s){let{reason:l}=s,c=e.get(r);c.cancel(l);return}let{method:i,execution:g}=n.data,{payload:d}=g,h=t({method:i,messageId:r,payload:d});e.set(r,h);let w=o.get(i||"");w(h,n)};let r=(...e)=>{self.importScripts(...e)};return{onMessage:n,close:a,importScripts:r}})()`;

  return template;
};
