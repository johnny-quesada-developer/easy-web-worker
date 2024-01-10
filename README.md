# easy-web-worker 🌟

![Image John Avatar](https://raw.githubusercontent.com/johnny-quesada-developer/global-hooks-example/main/public/avatar2.jpeg)

Hello and welcome to **easy-web-worker** with [cancelable-promise-jq](https://www.npmjs.com/package/cancelable-promise-jq) – your go-to solution for seamless **Web Workers** integration, now enhanced with cancelable promises! 🚀

[Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) are a native tool provided by **JavaScript**, allowing you to use them within your favorite framework like **React**, **Angular**, **Vue**, and others, or with pure **JavaScript** and **TypeScript**.

Check out the running example with **React** and **TypeScript** at [CODEPEN](https://codepen.io/johnnynabetes/pen/wvOvygW?editors=0010); let's explore the capabilities of JavaScript's concurrent processing with Web Workers!"

[Important!] Starting from version 4.0.0, EasyWebWorker supports concurrency mode. This means you can now configure whether a single **EasyWebWorker** should use multiple Web Worker instances. This feature is extremely powerful for code that requires not only heavy computations occasionally but also robust concurrent processing. For more detailed information, please see the section below. [concurrency mode](#concurrency-mode)

### Creating a web worker never was easier!

```ts
/**
 * The callback parameter will be the body of the worker
 */
const worker = createEasyWebWorker((easyWorker) => {
  const fibonacci = (n) => {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  };

  /**
   * Inside the worker we have to define an action when onMessage
   */
  easyWorker.onMessage((message) => {
    /**
     * The payload includes whatever parameters are sent from the main thread
     */
    const { payload } = message;
    const result = fibonacci(payload.base);

    message.resolve(result);
    //message.reject(); // or reject
  });
});
```

Then, for sending a message to the worker:

```ts
/**
 * This returns a CancelablePromise
 */
await worker.send(40);
```

And that's it! You now have a worker running heavy computation in a real separate thread, with real asynchronous programming in JavaScript.

You can also create an easy web worker from a static file, or from a native worker instance:

```ts
const worker = createEasyWebWorker('./worker.js');
const worker = createEasyWebWorker(new Worker('./worker.js')); // ƒ Worker() { [native code] }

const worker = new EasyWebWorker('./worker.js');
const worker = new EasyWebWorker(new Worker('./worker.js')); // ƒ Worker() { [native code] }
```

When working with **static files**, which can offer substantial benefits with web workers, you simply need to create an instance of **StaticEasyWebWorker**.

The **StaticEasyWebWorker** provides an interface to continue working with [cancelable-promise-jq](https://www.npmjs.com/package/cancelable-promise-jq) and build more complex APIs within your worker.

```ts
const easyWorker = new StaticEasyWebWorker();

/**
 *  For adding a default onMessage
 */
easyWorker.onMessage((message) => {
  // do something

  message.reportProgress(10); // report progress

  /** Take action when the message is canceled by the main thread*/
  message.onCancel(() => {});

  message.resolve();
});

/**
 * For adding specific actions
 */
easyWorker.onMessage('readCSV', (message) => {
  // do something

  message.reportProgress(20); // report progress

  /** Take action when the message is canceled by the main thread*/
  message.onCancel(() => {});

  message.resolve();
});
```

**easy-web-worker** is designed to enhance the capabilities of the **Worker** class by integrating a pattern of cancelable promises from the [cancelable-promise-jq](https://www.npmjs.com/package/cancelable-promise-jq) library. For straightforward tasks, it simplifies the process by eliminating the need to configure webpack or other bundlers. And for more complex requirements, the **StaticEasyWebWorker** class allows the integration of easy worker and cancelable promises capabilities into your static workers.

Start enhancing your applications with robust, cancelable promises and easy web worker integration today! 🌐

Experience it in action with a [Live Example featuring text-diff](https://johnny-quesada-developer.github.io/easy-web-workers-example/) 📘.

For a comprehensive understanding, watch our informative [introduction video](https://www.youtube.com/watch?v=CK-Uri9lDOE) 🎥. You can also dive deeper into the code and explore on [easy-web-workers-examples](https://github.com/johnny-quesada-developer/easy-web-workers-example) 🧩.

## Creating a simple Web Worker

Creating a new worker is as simple as

```TS
const backgroundWorker = new EasyWebWorker<string, string>((easyWorker) => {
  easyWorker.onMessage((message) => {
    const { payload } = message;

    message.resolve(`this is  a message from the worker: ${payload}`);
  });

  // you could also define and send specific methods which allow you to create a better structured API
  easyWorker.onMessage<number, number>('doSomething', (message) => {
    const { payload } = message;

    message.resolve(payload + 2);
  });
});

// outside your worker
const messageResult = await backgroundWorker.send('hello!');

// for specific methods us the sendToMethod function
const messageResult2 = await backgroundWorker.sendToMethod('doSomething', 2);
```

### Important notes:

EasyWebWorker<IPayload, IResult> has two generic parameters... They will affect the typing of the send() and response() methods.

- If IResult is null, the _resolve_ method will not require parameters
- If IPayload is null, the _send_ method will not require parameters

Take into consideration that the _workerBody_ is a template to create a worker in run time, so you'll not be able to use anything outside of the Worker-Scope.

```TS
const message = 'Hello';

await new EasyWebWorker<null, string>((easyWorker) => {
  easyWorker.onMessage((message) => {

    message.resolve(message); // THIS WILL PRODUCE AND ERROR!! the variable *message* will not exist in Worker-Scope.
  });
}).send('hello!');

```

Take a look at Workers API if you don't know yet how they work: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API,
If you need t to send data to the worker, please define IPayload while creating a worker. _new EasyWebWorker<IPayload>(_
You are just allowed to send information to Workers by messages, and vice versa

## IEasyWebWorkerMessage<IPayload = null, IResult = void>

When you defined an onMessage callback in your _Worker_, this will receive all messages from the _send_ method:

```TS
easyWorker.onMessage((message) => {
  // the *message* will be strongly typed with TS

 // the message could resolve the *send* promise.
  message.resolve();

 // the message could be rejected from the worker
  message.reject(new Error());

  // this message could be cancelled from inside the worker
  message.cancel();

  // the message is also able to listen to cancelation evens
  message.onCancel(() => {
    // release resources
  })

  // you could also report progress to the principal thread if you configured a onProgress callback
  message.reportProgress(25);
});
```

## onProgress

Let say you are performing some heavy process in your worker, but you still wanted to implement some kind of progress bar in the main thread... you could add an onProgress callback.

```TS
await worker.send().onProgress((progress: number) => {
  // change some progress bar percentage
}).then(doSomething);
```

onProgress Is gonna be executed every time you call _message.reportProgress_ inside the worker... the cool part here is that the _reportProgress_ is not gonna finish the main promise returned by the _send_ method.

## Having multiple Worker-Templates

As _WorkerBody_ are just templates, you could reuse them on other _Workers_, or use them as plugins for your _Workers_. Let's see:

```TS
const WorkerPluggin: EasyWebWorkerBody = (_easyWorker, context) => {
  context.doSomething = () => Promise.resolve('This is a plugin example');
};

const plugginMessage = await new EasyWebWorker([WorkerPluggin, (easyWorker, context) => easyWorker.onMessage(async (message) => {
  // context will have all stuff we added on other plugins
  const plugginResponse = await context.doSomething();

  message.resolve(plugginResponse);
})]).send();

```

In this way, you could avoid having to create more than once the same template for your worker.

## Importing scripts into your _Workers_

Web Workers has this amazing method called importScripts, are you passed an array of strings in the EeasyWorker extra configuration, all those files are gonna be imported into your worker.

// test.js

```TS
self.message = 'Hello coders!';
selft.doSomething = () => console.log(self.message);
```

```TS
await new EasyWebWorker((easyWorker, context) => {
  easyWorker.onMessage((message) => context.doSomething());
}, {
  scripts: ['http://localhost:3000/test.js'],
}).send();

```

This is a very simple example, but you could import a whole library into your worker, as _JQUERY_, _Bluebird_ for example

## StaticEasyWebWorker

If you want to create a _Worker_ with a static .js file and don't want to lose the structure of messages and promises and the onProgress callback from the library... you could use StaticEasyWebWorker<IPayload = null, IResult = void>\_ directly in your Worker.

let's see how to use it:

// worker.js
// This is gonna be the content of your worker
// onMessage Callback is gonna receive all _send_ method calls.

```TS
//  this is gonna create the same message structure the runtime Workers
const worker = new StaticEasyWebWorker((message) => {
  setTimeout(() => {
    message.resolve(200);
  }, 5000);
});
```

and in your main thread:

```TS
const worker = new EasyWebWorker<null,number>('./worker.js');
await worker.send();
```

Super easy right?

## Concurrency mode

With EasyWebWorker, you can create operations that require heavy concurrency and delegate them to a web workers queue, or create workers on demand depending on the traffic and specific tasks. Let's take a look:

```TS
/**
 * Notice that the structure of the worker remains the same;
 * the only changes are in the configuration parameters of the worker.
 * Take a look below.*/
const worker = createEasyWebWorker((easyWorker) => {
  easyWorker.onMessage((message) => {
    const { payload } = message;

    // heavy computation like fibonacci

    message.resolve(result);
  });
}, {
  // We will now scale up to four workers if necessary.
  maxWorkers: 4
});
```

By default, creating an **EasyWebWorker** also creates a single native JavaScript worker. Without any added configuration, this Worker instance will remain active unless it is programmatically disposed. However, by modifying the **maxWorkers** parameter, you can control the number of native workers used, allowing the **EasyWebWorker** to execute multiple messages across multiple threads.

You can also control whether these additional workers should be created on demand when messages are sent to the **EasyWebWorker**. This can be done along with setting the **terminationDelay**, which indicates how long to wait before disposing of a **Worker** to avoid unnecessary resource consumption. Alternatively, you can choose to **warmUp** and keep the Workers alive from the moment the **EasyWebWorker** is created.

From the main thread, the consumption of the worker remains the same. Depending on the configuration, the workers will be created either statically or on-demand as needed. The EasyWebWorker will be responsible for selecting them from a pool. Additionally, the EasyWebWorker will manage the distribution of messages among the available workers.

```ts
// Since maxWorkers is configured to 4, a total of 3 native workers, will be created.
const results = await Promise.all([
  worker.send(payload),
  worker.send(payload1),
  worker.send(payload2),
]);
```

In the previous example, since the **warmUp** parameter wasn’t included, only 3 Native workers will be created to handle the 3 messages, even though the maximum available is 4. Additionally, since the **keepAlive** parameter was not included, if a total of 1 second passes without new messages, the Native workers will be disposed of to save resources.

## Want to see more?

Here is an example of how you could easily create data filter into a Worker, to avoid performing loops process into the main thread that could end affecting user experience.

```TS
interface FilterSource {
  filter: string,
  collection: any[],
  reportProgress: boolean,
}

const worker = new EasyWebWorker<FilterSource, any[]>((easyWorker) => {
  const containsValue = (item: any, filter: string): boolean => {
    const itemKeys = Object.keys(item);

    return itemKeys.some((key) => {
      const prop = item[key] || null;

      if (typeof prop !== 'string' && Object.keys(prop).length) return containsValue(prop, filter);
      if (prop.toString().replace(/(\r\n|\n|\r)/gm, '').trim().toLowerCase()
        .indexOf(filter) !== -1) return true;

      return false;
    });
  };

  easyWorker.onMessage((message: IEasyWebWorkerMessage<FilterSource, any[]>) => {
    const { payload } = message;
    const { collection, filter = '', reportProgress: countProgress } = payload;
    const { length: collectionLength } = collection;
    const result = filter === '' ? collection : [];
    const progressPerItem = collectionLength ? 100 / collectionLength : 0;

    let currentProgress = 0;

    if (filter) {
      for (let index = 0; index < collectionLength; index += 1) {
        if (countProgress) {
          currentProgress += progressPerItem;
          message.reportProgress(currentProgress);
        }

        const item = collection[index];

        if (containsValue(item, filter)) result.push(item);
      }
    }

    message.resolve(result);
  });
});
```

And how to use this?

```TS
worker.send({
  collection: [{ name: 'julio perez' }, { name: 'carol starling' }, { name: 'goku' }, { name: { firstname: 'johnny' } }],
  filter: 'johnny',
  reportProgress: true,
}).onProgress((progressPercentage) => console.log(progressPercentage))
  .then((filtered: any[]) => console.log(filtered));
```

the output should be:
=> 25
=> 50
=> 75
=> 100
=> [{ name: { firstname: 'johnny' } }]

Of course this is a very tiny array, but is just to give you and idea, actually you also could make fetch requests into workers... give it a try.

# Methods

### `EasyWebWorker.reboot(reason?: unknown): CancelableCancelablePromise<void>[]`

This method will reboot the worker and cancel all the messages in the queue.

- `reason` - (optional) reason why the worker will be restarted.

Returns an array of promises that are resolved with the rejection reason provided when the messages are canceled.

Example usage:

```typescript
const worker = new EasyWebWorker<string, string>((easyWorker) => {
  easyWorker.onMessage(async (message) => {
    message.resolve(`Received message: ${message.payload}`);
  });
});

const messagePromise = worker.send('Hello!');

worker.reboot('Worker was restarted');

// The message promise will be rejected with the reason 'Worker was restarted'
```

### override(payload?, reason?, config?): CancelablePromise

Cancel all current messages and send a new one.

### cancelAll(reason?: unknown): CancelablePromise<void>[]

Cancels all messages that are currently waiting to be processed by the worker.

- `reason` - (optional) The reason for the cancellation.

Returns an array of promises that are resolved with the rejection reason provided when the messages are canceled.

### overrideAfterCurrent(payload?, reason?, config?): CancelablePromise

Cancel all the messages but the current execution and add a new message

### send(payload?, reason?, config?): CancelablePromise

Sends a message to the worker

- `payload` - (optional) The message payload.
- `options` - (optional) Additional send options.

**_Thanks for reading, hope this help someone_**

## Collaborators

[![Image Johnny Quesada](https://avatars.githubusercontent.com/u/62082152?v=4&s=150)](https://github.com/johnny-quesada-developer)
&nbsp;&nbsp;&nbsp;&nbsp;[![Image Gabriele Cirulli](https://avatars.githubusercontent.com/u/886011?v=4&s=150)](https://github.com/gabrielecirulli)

[Johnny Quesada](https://github.com/johnny-quesada-developer) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Gabriele Cirulli](https://github.com/gabrielecirulli)
