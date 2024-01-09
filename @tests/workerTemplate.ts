// backup of the worker template

/**
 * This is the template of the worker, should be and string to avoid compilation issues
 */
const getWorkerTemplateBK = () => {
  const template = `
  const createEasyWebWorker = (targetOrigin) => {
    /* Keep track of the messages sent allowing us to cancel them */
    const workerMessages = new Map();
  
    /* This structure allows us to have multiple callbacks for the same worker */
    const workerCallbacks = new Map([
      [
        '',
        () => {
          throw "you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";
        },
      ],
    ]);
  
    const createMessage = ({ messageId, payload, origin }) => {
      const cancelCallbacks = new Set();
  
      const postMessage = (data) => {
        const { progress } = data;
  
        if (!progress) {
          /* If it's not a progress message means that the message is resolved | rejected | canceled */
          workerMessages.delete(messageId);
        }
  
        self.postMessage({ messageId, ...data }, origin);
      };
  
      const resolve = (...result) => {
        postMessage({ resolved: { payload: result } });
      };
  
      const reject = (reason) => {
        postMessage({ rejected: { reason } });
      };
  
      const cancel = (reason) => {
        const callbacks = [...cancelCallbacks];
  
        callbacks.forEach((callback) => callback(reason));
  
        postMessage({ worker_canceled: { reason } });
      };
  
      const reportProgress = (percentage, payload) => {
        postMessage({ progress: { percentage, payload } });
      };
  
      /* Returns a function that can be used to unsubscribe from the cancelation */
      const onCancel = (callback) => {
        cancelCallbacks.add(callback);
  
        return () => cancelCallbacks.delete(callback);
      };
  
      return {
        payload,
        resolve,
        reject,
        cancel,
        onCancel,
        reportProgress,
      };
    };
  
    const importScripts = (...scripts) => {
      self.importScripts(...scripts);
    };
  
    const onMessage = (...args) => {
      const [param1, param2] = args;
      const hasCustomCallbackKey = typeof param1 === 'string';
  
      if (hasCustomCallbackKey) {
        const callbackKey = param1;
        const callback = param2;
  
        workerCallbacks.set(callbackKey, callback);
  
        return;
      }
  
      const callback = param1;
      workerCallbacks.set('', callback);
    };
  
    const close = () => {
      /* should cancel all the promises of the main thread */
      const messages = [...workerMessages.values()];
  
      messages.forEach((message) => message.reject(new Error('worker closed')));
  
      self.close();
    };
  
    self.onmessage = (event) => {
      const { data, origin } = event;
      const { messageId, cancelation } = data;
  
      if (cancelation) {
        const { reason } = cancelation;
  
        const message = workerMessages.get(messageId);
  
        message.cancel(reason);
  
        return;
      }
  
      const { method, execution } = data;
      const { payload } = execution;
  
      const message = createMessage({
        messageId,
        payload,
        origin: targetOrigin || origin || undefined,
      });
  
      workerMessages.set(messageId, message);
  
      const callback = workerCallbacks.get(method || '');
  
      callback(message, event);
    };
  
    return {
      importScripts,
      onMessage,
      close,
    };
  };`;

  return template;
};

const workerTemplateResult = (self) => {
  self.primitiveParameters = JSON.parse(`[]`);
  self.importScripts(['fake.js']);
  self.cw$ = (a) => {
    const b = new Map(),
      c = new Map([
        [
          '',
          () => {
            throw "you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";
          },
        ],
      ]),
      d = ({ messageId: e, payload: f, origin: g }) => {
        const h = new Set(),
          i = (j) => {
            const { progress: k } = j;
            k || b.delete(e), self.postMessage({ messageId: e, ...j }, g);
          },
          l = (...m) => {
            i({ resolved: { payload: m } });
          },
          n = (o) => {
            i({ rejected: { reason: o } });
          },
          p = (q) => {
            // @ts-ignore
            [...h].forEach((r) => r(q)), i({ worker_canceled: { reason: q } });
          },
          s = (t, u) => {
            i({ progress: { percentage: t, payload: u } });
          },
          v = (w) => (h.add(w), () => h.delete(w));
        return {
          payload: f,
          resolve: l,
          reject: n,
          cancel: p,
          onCancel: v,
          reportProgress: s,
        };
      },
      x = (...y) => {
        self.importScripts(...y);
      },
      z = (...A) => {
        const [B, C] = A,
          D = typeof B === 'string';
        if (D) {
          const E = B,
            F = C;
          c.set(E, F);
          return;
        }
        const G = B;
        c.set('', G);
      },
      H = () => {
        [...b.values()].forEach((I) => I.reject(new Error('worker closed')));
        self.close();
      };
    self.onmessage = (J) => {
      const { data: K, origin: L } = J,
        { messageId: M, cancelation: N } = K;
      if (N) {
        const { reason: O } = N,
          P = b.get(M);
        P.cancel(O);
        return;
      }
      const { method: Q, execution: R } = K,
        { payload: S } = R,
        T = d({ messageId: M, payload: S, origin: a || L || undefined });
      b.set(M, T);
      const U = c.get(Q || '');
      // @ts-ignore
      U(T, J);
    };
    return { importScripts: x, onMessage: z, close: H };
  };

  self.ew$ = self.cw$('');

  ((easyWorker, context) => {
    context.globalPropertyTest = 'globalPropertyTest';
    easyWorker.onMessage((message) => {
      message.resolve();
    });
  })(self.ew$, self);
};

const OfuscateTemplateBK = () => {
  `self.primitiveParameters=JSON.parse(\`[]\`);self.importScripts(['fake.js']);self.cw$=a=>{constb=newMap(),c=newMap([['',()=>{throw'youdidn'tdefinedamessage-callback,pleaseassignacallbackbycallingIEasyWorkerInstance.onMessage'}]]),d=({messageId:e,payload:f,origin:g})=>{consth=newSet(),i=j=>{const{progress:k}=j;k||b.delete(e),self.postMessage({messageId:e,...j},g)},l=(...m)=>{i({resolved:{payload:m}})},n=o=>{i({rejected:{reason:o}})},p=q=>{[...h].forEach(r=>r(q)),i({worker_canceled:{reason:q}})},s=(t,u)=>{i({progress:{percentage:t,payload:u}})},v=w=>(h.add(w),()=>h.delete(w));return{payload:f,resolve:l,reject:n,cancel:p,onCancel:v,reportProgress:s}},x=(...y)=>{self.importScripts(...y)},z=(...A)=>{const[B,C]=A,D=typeofB==='string';if(D){constE=B,F=C;c.set(E,F);return;}constG=B;c.set('',G)},H=()=>{[...b.values()].forEach(I=>I.reject(newError('workerclosed')));self.close();};self.onmessage=J=>{const{data:K,origin:L}=J,{messageId:M,cancelation:N}=K;if(N){const{reason:O}=N,P=b.get(M);P.cancel(O);return;}const{method:Q,execution:R}=K,{payload:S}=R,T=d({messageId:M,payload:S,origin:a||L||undefined});b.set(M,T);constU=c.get(Q||'');U(T,J)};return{importScripts:x,onMessage:z,close:H}};self.ew$=self.cw$('');((easyWorker,context)=>{context.globalPropertyTest='globalPropertyTest';easyWorker.onMessage((message)=>{message.resolve();});})(self.ew$,self);`;
};
