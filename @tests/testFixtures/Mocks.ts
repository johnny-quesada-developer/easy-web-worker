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
  `self.primitiveParameters=JSON.parse(\`[]\`);self.importScripts(['fake.js']);self.cw$=a=>{constb=newMap(),c=newMap([['',()=>{throw'youdidn'tdefinedamessage-callback,pleaseassignacallbackbycallingIEasyWorkerInstance.onMessage'}]]),d=({messageId:e,payload:f,origin:g})=>{consth=newSet(),i=j=>{const{progress:k}=j;k||b.delete(e),self.postMessage({messageId:e,...j},g)},l=(...m)=>{i({resolved:{payload:m}})},n=o=>{i({rejected:{reason:o}})},p=q=>{[...h].forEach(r=>r(q)),i({worker_canceled:{reason:q}})},s=(t,u)=>{i({progress:{percentage:t,payload:u}})},v=w=>(h.add(w),()=>h.delete(w));return{payload:f,resolve:l,reject:n,cancel:p,onCancel:v,reportProgress:s}},x=(...y)=>{self.importScripts(...y)},z=(...A)=>{const[B,C]=A,D=typeofB==='string';if(D){constE=B,F=C;c.set(E,F);return;}constG=B;c.set('',G)},H=()=>{[...b.values()].forEach(I=>I.reject(newError('workerclosed')));self.close();};self.onmessage=J=>{const{data:K,origin:L}=J,{messageId:M,cancelation:N}=K;if(N){const{reason:O}=N,P=b.get(M);P.cancel(O);return;}const{method:Q,execution:R}=K,{payload:S}=R,T=d({messageId:M,payload:S,origin:a||L||undefined});b.set(M,T);constU=c.get(Q||'');U(T,J)};return{importScripts:x,onMessage:z,close:H}};self.ew$=self.cw$('');((easyWorker,context)=>{context.globalPropertyTest='globalPropertyTest';easyWorker.onMessage((message)=>{message.resolve();});})(self.ew$,self);`;
export default WorkerMock;
