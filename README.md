# easy-web-worker
This is a package to easily create and handle Workers, both run time and static .js workers files

## Creating a simple Web Worker

Creating a new worker is as simple as

```
const backgroundWorker = new EasyWebWorker<string, string>((easyWorker) => {
  easyWorker.onMessage((message) => {
    const { payload } = message;

    message.resolve(`this is  a message from the worker: ${payload}`);
  });
});

const messsageResult = await backgroundWorker.send('hello!');
```

### Important notes: 

EasyWebWorker<IPayload, IResult> has two generic parameters... They will affect the typing of the send() and response() methods.
* If IResult is null, the *resolve* method will not require parameters
* If IPayload is null, the *send* method will not require parameters

Take into consideration that the *workerBody* is a template to create a worker in run time, so you'll not be able to use anything outside of the Worker-Scope

```
const message = 'Hello';

await new EasyWebWorker<null, string>((easyWorker) => {
  easyWorker.onMessage((message) => {

    message.resolve(message); // THIS WILL PRODUCE AND ERROR!! the variable *message* will not exist in Worker-Scope.
  });
}).send('hello!');

```

Take a look at Workers API if you don't know yet how they work: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API,
If you need t to send data to the worker, please define IPayload while creating a worker. *new EasyWebWorker<IPayload>(*
You are just allowed to send information to Workers by messages, and vice versa

## IEasyWebWorkerMessage<IPayload = null, IResult = void>
When you defined an onMessage callback in your *Worker*, this will receive all messages from the *send* method: 
```
easyWorker.onMessage((message) => {
  // the *message* will be strongly typed with TS

 // the message could resolve the *send* promise.
  message.resolve();

 // the message could also reject the *send* promise with an error.
  message.reject(new Error());

  // you could also report progress to the principal thread if you configurated a onProgress callback
  message.reportProgress(25);
});
```

## onProgress
Let say you are performing some heavy process in your worker, but you still wanted to implement some kind of progress bar in the main thread... you could add an onProgress callback.

```
await worker.send().onProgress((progress: number) => {
  // change some progress bar percentage
}).then(doSomething);
```

onProgress Is gonna be executed every time you call  *message.reportProgress* inside the worker... the cool part here is that the *reportProgress* is not gonna finish the main promise returned by the *send* method.

## Having multiple Worker-Templates

As *WorkerBody* are just templates, you could reuse them on other *Workers*, or use them as plugins for your *Workers*. Let's see:

```
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

## Importing scripts into your *Workers*

Web Workers has this amazing method called importScripts, are you passed an array of strings in the EeasyWorker extra configuration, all those files are gonna be imported into your worker.

// test.js
```
self.message = 'Hello coders!';
selft.doSomething = () => console.log(self.message);
```

```
await new EasyWebWorker((easyWorker, context) => {
  easyWorker.onMessage((message) => context.doSomething());
}, {
  scripts: ['http://localhost:3000/test.js'],
}).send();

```

This is a very simple example, but you could import a whole library into your worker, as *JQUERY*, *Bluebird* for example

## StaticEasyWebWorker

If you want to create a *Worker* with a static .js file and don't want to lose the structure of messages and promises and the onProgress callback from the library... you could use *StaticEasyWebWorker<IPayload = null, IResult = void>* directly in your Worker.

trust me, talking about performance it's going to be the same. but may if you are trying to create something very complex and huge into a *Worker*... OK, a static js file could be a good option.

Workers are gonna work just as the javascript you have in your main thread, but into another thread, so, the user experience could improve!!

let's see how to use it: 

// worker.js
// This is gonna be the content of your worker
// onMessage Callback is gonna receive all *send* method calls.
```
const onMessageCallback = (message: IEasyWebWorkerMessage<null, number>) => {
  setTimeout(() => {
    message.resolve(200);
  }, 5000);
};

//  this is gonna create the same message structure the runtime Workers
new StaticEasyWebWorker<null, number>(onMessageCallback);
```

and in your main thread:
```
const worker = new EasyWebWorker<null,number>('http://localhost:3000/worker.js');
await worker.send();
```

Super easy right? 

## Want to see more? 

Here is an example of how you could easily create data filter into a Worker, to avoid performing loops process into the main thread that could end affecting user experience.

```
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

```
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

*Thanks for reading, hope this help someone*