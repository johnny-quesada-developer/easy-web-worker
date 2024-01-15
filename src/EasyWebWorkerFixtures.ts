export const generatedId = (): string =>
  `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;

/**
 * This function contains an obfuscated version of the StaticEasyWebWorker internal auto invocable function, without comments or types
 * this template is used to create dynamic workers from strings templates
 * PLEASE KEEP THIS FUNCTION UPDATED WITH THE LATEST VERSION OF THE StaticEasyWebWorker CLASS
 * [IMPORTANT] Avoid ";" at the end of the template, and don't forget to inject the targetOrigin variable: ({targetOrigin:'${origin}'})
 * for minifying the template, please use the following options:
 * - remove comments
 * - remove types
 * - compress using: https://www.toptal.com/developers/javascript-minifier
 */
export const getWorkerTemplate = ({ origin = "" }: { origin: string }) => {
  const template = `(e=>{let o=new Map,t=new Map([["",()=>{throw"you didn't define a message-callback, please assign a callback by calling easyWorker.onMessage"}]]),n=({messageId:e,payload:t,method:n,origin:a})=>{let r="pending",s=new Map,l=(t,l,c=[])=>{let i=r,g="progress"===t?"pending":t;if(!o.has(e)){let d="%c#"+e+" Message Not Found: %cThis means that the message was already resolved | rejected | canceled. To avoid this error, please make sure that you are not resolving | rejecting | canceling the same message twice. Also make sure that you are not reporting progress after the message was processed. Remember each message can handle his one cancelation by adding a handler with the %cmessage.onCancel%c method. To know more about this method, please check the documentation at: %chttps://www.npmjs.com/package/easy-web-worker#ieasywebworkermessageipayload--null-iresult--void %cTrying to process message:";console.error(d,"color: darkorange; font-size: 12px; font-weight: bold;","font-weight: normal;","font-weight: bold;","font-weight: normal;","color: lightblue; font-size: 10px; font-weight: bold;","font-weight: bold; color: darkorange;",{messageId:e,status:{current:i,target:g},method:n,action:l});return}let h={resolved:"onResolve",rejected:"onReject",canceled:"onCancel",worker_cancelation:"onCancel",pending:"onProgress"}[g],w=s.get(h);w?.forEach(e=>e(l,c));let p=!l.progress;p&&(s.get("onFinalize")?.forEach(e=>e(l,c)),o.delete(e)),self.postMessage({messageId:e,...l},a,c),r=g},c=(e,o=[])=>l("resolved",{resolved:{payload:void 0===e?[]:[e]}},o),i=(e,o=[])=>l("rejected",{rejected:{reason:e}},o),g=(e,o=[])=>l("worker_cancelation",{worker_cancelation:{reason:e}},o),d=(e,o,t=[])=>l("progress",{progress:{percentage:e,payload:o}},t),h=e=>o=>{s.has(e)||s.set(e,new Set);let t=s.get(e);return t.add(o),()=>t.delete(o)};return{messageId:e,method:n,payload:t,getStatus:()=>r,isPending:()=>"pending"===r,resolve:c,reject:i,cancel:g,reportProgress:d,onResolve:h("onResolve"),onReject:h("onReject"),onCancel:h("onCancel"),onProgress:h("onProgress"),onFinalize:h("onFinalize")}},a=(...e)=>{let[o,n]=e,a="string"==typeof o;if(a){let r=o,s=n;t.set(r,s);return}let l=o;t.set("",l)},r=()=>{let e=[...o.values()];e.forEach(e=>e.reject(Error("worker closed"))),self.close()};self.onmessage=a=>{let{data:r,origin:s}=a,{messageId:l,cancelation:c}=r;if(c){let{reason:i}=c,g=o.get(l);g.cancel(i);return}let{method:d,execution:h}=a.data,{payload:w}=h,p=n({method:d,messageId:l,payload:w,origin:e||s||void 0});o.set(l,p);let m=t.get(d||"");m(p,a)};let s=(...e)=>{self.importScripts(...e)};return{onMessage:a,close:r,importScripts:s}})('${origin}')`;

  return template;
};
