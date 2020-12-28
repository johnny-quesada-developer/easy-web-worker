# easy-web-worker
This is a package to easily create and handle Workers, both run time and .js workers

## Creating a simple Web Worker

```
const backgroundWorker = new EasyWebWorker<string, string>((easyWorker) => {
  easyWorker.onMessage((message) => {
    const { payload } = message;

    message.resolve(`this is  a message from the worker: ${payload}`);
  });
});

backgroundWorker.send('hello!');
```
