export const dummyUrl = 'http://test.com';

export const createObjectURL = () => dummyUrl;

export class WorkerMock {
  public postMessage({
    messageId,
    payload,
  }: {
    messageId: string;
    payload: any;
  }) {}

  public onmessage({
    messageId,
    payload,
  }: {
    messageId: string;
    payload: any;
  }) {}

  public onerror() {}

  public terminate() {}
}

export const MockBlob = jest.fn(
  (content: string[], config: { type: string }) => {}
);

export const createMockFunctionFromContent = (content: string) => {
  return new Function(`return ((self) => {${content}})(...arguments)`);
};

export const getMockBlobContent = () =>
  `self.importScripts(['fake.js']);constcreateEasyWebWorker=(targetOrigin)=>{constworkerMessages=newMap();constworkerCallbacks=newMap([['',()=>{throw'youdidn'tdefinedamessage-callback,pleaseassignacallbackbycallingIEasyWorkerInstance.onMessage';},],]);constcreateMessage=({messageId,payload,origin})=>{constcancelCallbacks=newSet();constpostMessage=(data)=>{const{progress}=data;if(!progress){workerMessages.delete(messageId);}self.postMessage({messageId,...data},origin);};constresolve=(...result)=>{postMessage({resolved:{payload:result}});};constreject=(reason)=>{postMessage({rejected:{reason}});};constcancel=(reason)=>{constcallbacks=[...cancelCallbacks];callbacks.forEach((callback)=>callback(reason));postMessage({worker_canceled:{reason}});};constreportProgress=(percentage,payload)=>{postMessage({progress:{percentage,payload}});};constonCancel=(callback)=>{cancelCallbacks.add(callback);return()=>cancelCallbacks.delete(callback);};return{payload,resolve,reject,cancel,onCancel,reportProgress,};};constimportScripts=(...scripts)=>{self.importScripts(...scripts);};constonMessage=(...args)=>{const[param1,param2]=args;consthasCustomCallbackKey=typeofparam1==='string';if(hasCustomCallbackKey){constcallbackKey=param1;constcallback=param2;workerCallbacks.set(callbackKey,callback);return;}constcallback=param1;workerCallbacks.set('',callback);};constclose=()=>{constmessages=[...workerMessages.values()];messages.forEach((message)=>message.reject(newError('workerclosed')));self.close();};self.onmessage=(event)=>{const{data,origin}=event;const{messageId,cancelation}=data;if(cancelation){const{reason}=cancelation;constmessage=workerMessages.get(messageId);message.cancel(reason);return;}const{method,execution}=data;const{payload}=execution;constmessage=createMessage({messageId,payload,origin:targetOrigin||origin||undefined,});workerMessages.set(messageId,message);constcallback=workerCallbacks.get(method||'');callback(message,event);};return{importScripts,onMessage,close,};};vareasyWorker=createEasyWebWorker('');((easyWorker,context)=>{context.globalPropertyTest='globalPropertyTest';easyWorker.onMessage((message)=>{message.resolve();});})(easyWorker,self);`;

export default WorkerMock;
