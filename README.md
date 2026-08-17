# easy-web-worker 🌟

<div align="center">

![Johnny Quesada](https://raw.githubusercontent.com/johnny-quesada-developer/global-hooks-example/main/public/avatar2.jpeg)

</div>

<div align="center">

**Real Web Workers. Simple API. Cancelable work.** 🚀

_Heavy computation off the main thread — without fighting the native Worker API._ ✨

[![npm version](https://img.shields.io/npm/v/easy-web-worker.svg)](https://www.npmjs.com/package/easy-web-worker)
[![Downloads](https://img.shields.io/npm/dm/easy-web-worker.svg)](https://www.npmjs.com/package/easy-web-worker)
[![License](https://img.shields.io/github/license/johnny-quesada-developer/easy-web-worker)](https://github.com/johnny-quesada-developer/easy-web-worker/blob/main/LICENSE)

[**Live Demo**](https://johnny-quesada-developer.github.io/easy-web-workers-example/) • [**Video Tutorial**](https://www.youtube.com/watch?v=CK-Uri9lDOE) • [**CodePen**](https://codepen.io/johnnynabetes/full/wvOvygW)

</div>

---

## 🎯 The One-Liner

```ts
import { createEasyWebWorker } from 'easy-web-worker';

const worker = createEasyWebWorker<number, number>(({ onMessage }) => {
  onMessage((message) => message.resolve(message.payload * 2));
});
```

**That's it.** No separate worker file. No message-ID plumbing. No manual promise bridge. 🧵

```ts
const result = await worker.send(21);

console.log(result); // 42
```

Your code runs inside a **real native Web Worker**, while the main thread receives a `CancelablePromise`.

---

## 🚀 Why Developers Love This Library

### 🎓 **Small API Surface**

If you already understand native Web Workers, the mental model stays familiar:

```ts
const worker = createEasyWebWorker(({ onMessage }) => {
  onMessage((message) => {
    // Work inside the Worker
    message.resolve('done');
  });
});

await worker.send();
```

### ⚡ **Real Background Execution**

Move CPU-heavy work away from the browser's main thread so rendering and user interaction can stay responsive.

```ts
const worker = createEasyWebWorker<number, number>(({ onMessage }) => {
  const fibonacci = (n: number): number => {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  };

  onMessage((message) => {
    message.resolve(fibonacci(message.payload));
  });
});
```

### 🛑 **Cancelable Promises**

Every `send()` returns a `CancelablePromise` from [`easy-cancelable-promise`](https://www.npmjs.com/package/easy-cancelable-promise).

```ts
const task = worker.send(45);

task.cancel('No longer needed');
```

Cancellation can travel **from the main thread into the Worker**, allowing the Worker to react and release resources.

### 📊 **Progress Reporting**

Long-running jobs can report progress without resolving the request.

```ts
worker.send(payload).onProgress((percentage) => {
  console.log(`${percentage}%`);
});
```

### 🚦 **Built-In Worker Pool**

Scale a single `EasyWebWorker` across multiple native Worker instances.

```ts
const worker = createEasyWebWorker(workerBody, {
  maxWorkers: 4,
});
```

The public API remains the same — the library manages worker creation and message distribution.

### 🧩 **Multiple Worker Sources**

Use whichever architecture fits the project:

```ts
createEasyWebWorker(workerBody);        // Runtime Worker template
createEasyWebWorker('./worker.js');     // Static Worker file
createEasyWebWorker(new URL(...));      // URL
createEasyWebWorker(new Worker(...));   // Existing Worker
createEasyWebWorker([worker1, worker2]); // Existing Worker pool
```

---

## 📦 Installation

```bash
npm install easy-web-worker
```

`easy-web-worker` uses [`easy-cancelable-promise`](https://www.npmjs.com/package/easy-cancelable-promise) for the promise lifecycle.

> **Upgrading from an old release?**  
> If your project still imports `cancelable-promise-jq`, replace it with `easy-cancelable-promise`. The old package name is deprecated.

---

## 🎬 Quick Start

### 30 Seconds to a Web Worker

```ts
import { createEasyWebWorker } from 'easy-web-worker';

const fibonacciWorker = createEasyWebWorker<number, number>(({ onMessage }) => {
  const fibonacci = (n: number): number => {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  };

  onMessage((message) => {
    message.resolve(fibonacci(message.payload));
  });
});

const result = await fibonacciWorker.send(40);

console.log(result);
```

The Fibonacci calculation executes in a separate native Worker thread instead of blocking the page's main thread. ⚡

### 60 Seconds to Production-Ready

Run [`jsdiff`](https://www.npmjs.com/package/diff) inside a Web Worker so text comparison never blocks the main thread.

#### 🌐 Simple jsdiff implementation.

No Worker file. No extra bundler configuration. Just give `easy-web-worker` the public script URL:

```ts
// example.js
import { createEasyWebWorker } from 'easy-web-worker';

const worker = createEasyWebWorker(
  ({ onMessage }) => {
    onMessage((message, context) => {
      const { input1, input2 } = message.payload;

      message.resolve(context.Diff.diffWords(input1, input2));
    });
  },
  {
    scripts: ['https://cdn.jsdelivr.net/npm/diff@9.0.0/dist/diff.min.js'],
  }
);

const result = await worker.send({
  input1: 'Web Workers are powerful.',
  input2: 'Web Workers are incredibly powerful.',
});

console.log(result);
```

**That's it.** The CDN script is loaded inside the Worker, `jsdiff` exposes its `Diff` API there, and your main thread only sends data and awaits the result. 🚀

- ✅ No separate Worker file
- ✅ No npm import for jsdiff in your application bundle
- ✅ No manual `importScripts()`
- ✅ No `postMessage` / `onmessage` plumbing
- ✅ Type-safe request and result
- ✅ Real background execution

#### 📄 Static Worker file and specific actions

If you prefer normal module imports, your own Worker file, or bundler-controlled dependencies, use `StaticEasyWebWorker`.

**`TextDiff.worker.ts`**

```ts
import { diffWords, type Change } from 'diff';
import { StaticEasyWebWorker } from 'easy-web-worker';
import type { ComparePayload, Change } from './TextDiff.types';

const easyWorker = new StaticEasyWebWorker();

// you can define multiple named methods inside the Worker
easyWorker.onMessage<ComparePayload, Change[]>('compare', (message) => {
  const { input1, input2 } = message.payload;

  message.resolve(diffWords(input1, input2));
});

easyWorker.onMessage<string, string>('uppercase', (message) => {
  message.resolve(message.payload.toUpperCase());
});
```

**That's the whole Worker.** Now connect it to your application:

```ts
import { EasyWebWorker } from 'easy-web-worker';
import workerUrl from './TextDiff.worker?worker&url';

// For vite, use the Worker URL in production and the TypeScript file in development.
const isProduction = import.meta.env.MODE === 'production';

const worker = new EasyWebWorker(
  isProduction ? workerUrl : new URL('./TextDiff.worker.ts', import.meta.url),
  {
    workerOptions: {
      type: 'module',
    },
  }
);

const result = await worker.sendToMethod<ComparePayload, Change[]>('compare', {
  input1: 'Web Workers are powerful.',
  input2: 'Web Workers are incredibly powerful.',
});
```

Both approaches give you the same core result: a normal JavaScript library doing CPU work inside a **Web Worker**, while your application talks to it through a Promise-based API.

| Approach                | Best for                                                                     |
| ----------------------- | ---------------------------------------------------------------------------- |
| 🌐 CDN + runtime Worker | Fastest setup, demos, small integrations, no Worker file                     |
| 📄 Static Worker        | Module imports, larger Worker code, bundler control, production architecture |

And in both cases you still get the `easy-web-worker` features around the Worker:

- ✅ Promise-based communication
- ✅ Cancellation
- ✅ Progress reporting
- ✅ Named Worker methods
- ✅ Worker pooling when needed

---

## 🌟 Core Features Deep Dive

### 1️⃣ Runtime Workers with `createEasyWebWorker`

Create a Worker directly from a function template.

#### 🎨 The Basics

```ts
import { createEasyWebWorker } from 'easy-web-worker';

const backgroundWorker = createEasyWebWorker<string, string>(
  ({ onMessage }) => {
    onMessage((message) => {
      message.resolve(`Message from Worker: ${message.payload}`);
    });
  }
);

const result = await backgroundWorker.send('hello!');

console.log(result);
```

The first generic controls the `send()` payload. The second controls the value returned when the Worker calls `message.resolve()`.

```ts
const worker = createEasyWebWorker<Payload, Result>(workerBody);
```

#### 🎯 Named Worker Methods

A Worker can expose multiple message handlers instead of routing everything through one callback.

```ts
const worker = createEasyWebWorker<string, string>(({ onMessage }) => {
  onMessage((message) => {
    message.resolve(`default: ${message.payload}`);
  });

  onMessage<number, number>('double', (message) => {
    message.resolve(message.payload * 2);
  });

  onMessage<{ first: number; second: number }, number>('sum', (message) => {
    const { first, second } = message.payload;
    message.resolve(first + second);
  });
});

const defaultResult = await worker.send('hello');
const doubled = await worker.sendToMethod<number, number>('double', 21);
const total = await worker.sendToMethod<
  number,
  { first: number; second: number }
>('sum', { first: 20, second: 22 });
```

This makes it possible to build a small, typed API inside one Worker. 🧩

#### 🧠 Worker Scope — Important!

A runtime Worker body becomes the Worker source. It **cannot close over arbitrary variables from the main thread**.

```ts
const greeting = 'Hello';

createEasyWebWorker(({ onMessage }) => {
  onMessage((message) => {
    // ❌ `greeting` does not exist inside the Worker scope.
    message.resolve(greeting);
  });
});
```

Everything needed by the Worker must be:

- Defined inside the Worker body
- Included through reusable Worker templates
- Imported as a script
- Sent in a message
- Passed as a primitive parameter

#### 📦 Primitive Parameters

For small static values that should exist when the runtime Worker is created, use `primitiveParameters`.

```ts
const prefix = 'Result:';

const worker = createEasyWebWorker<null, string>(
  ({ onMessage }, context) => {
    const [prefix] = context.primitiveParameters;

    onMessage((message) => {
      message.resolve(`${prefix} complete`);
    });
  },
  {
    primitiveParameters: [prefix],
  }
);

console.log(await worker.send()); // Result: complete
```

Use regular Worker messages for dynamic application data. `primitiveParameters` are best for small initialization values.

#### 📊 Progress Without Resolving

The Worker can report progress as many times as necessary before the message finishes.

```ts
const worker = createEasyWebWorker<number[], number>(({ onMessage }) => {
  onMessage((message) => {
    let total = 0;

    message.payload.forEach((value, index, values) => {
      total += value;
      message.reportProgress(((index + 1) / values.length) * 100);
    });

    message.resolve(total);
  });
});

const result = await worker.send([10, 20, 30, 40]).onProgress((percentage) => {
  console.log(percentage);
});
```

Output:

```text
25
50
75
100
```

#### 🛑 Two-Way Cancellation

Cancellation is more than rejecting a promise on the main thread. The Worker receives the cancellation event too.

```ts
const worker = createEasyWebWorker<number, number>(({ onMessage }) => {
  onMessage((message) => {
    const interval = setInterval(() => {
      // long-running work...
    }, 100);

    message.onCancel((data) => {
      clearInterval(interval);

      const reason = data.worker_cancelation?.reason ?? data.canceled?.reason;

      console.log('Canceled:', reason);
    });
  });
});

const task = worker.send(100);

task.cancel('User navigated away');
```

Inside a Worker, a message can also cancel itself:

```ts
onMessage((message) => {
  if (!isValid(message.payload)) {
    message.cancel('Invalid payload');
    return;
  }

  // continue...
});
```

#### 🔄 Message Lifecycle

Each `IEasyWebWorkerMessage` provides lifecycle hooks:

```ts
onMessage((message) => {
  const unsubscribeResolve = message.onResolve(() => {});
  const unsubscribeReject = message.onReject(() => {});
  const unsubscribeCancel = message.onCancel(() => {});
  const unsubscribeProgress = message.onProgress(() => {});
  const unsubscribeFinalize = message.onFinalize(() => {});

  const status = message.getStatus();
  const pending = message.isPending();

  // Unsubscribe whenever you no longer need a listener.
  unsubscribeResolve();
  unsubscribeReject();
  unsubscribeCancel();
  unsubscribeProgress();
  unsubscribeFinalize();

  message.resolve();
});
```

#### 🚚 Transferable Objects

Both directions can use native `Transferable[]` values to move ownership instead of cloning large buffers.

```ts
type Payload = {
  buffer: ArrayBuffer;
};

const worker = createEasyWebWorker<Payload, ArrayBuffer>(({ onMessage }) => {
  onMessage((message) => {
    const { buffer } = message.payload;

    // Process the buffer...

    message.resolve(buffer, [buffer]);
  });
});

const buffer = new ArrayBuffer(1_000_000);

const processedBuffer = await worker.send({ buffer }, [buffer]);
```

This is especially useful for `ArrayBuffer`, media processing, binary parsing, and other data-heavy workloads.

---

### 2️⃣ Static Workers with `StaticEasyWebWorker`

Sometimes a dedicated Worker file is the better architecture — especially when the Worker has its own modules, build pipeline, or large implementation.

#### 🎪 The Basics

**`worker.ts`**

```ts
import { createStaticEasyWebWorker } from 'easy-web-worker/createStaticEasyWebWorker';

const { onMessage } = createStaticEasyWebWorker<number, number>();

onMessage((message) => {
  message.resolve(message.payload * 2);
});

onMessage<string, string>('uppercase', (message) => {
  message.resolve(message.payload.toUpperCase());
});
```

**Main thread**

```ts
import { createEasyWebWorker } from 'easy-web-worker';

const worker = createEasyWebWorker<number, number>('./worker.js');

const result = await worker.send(21);
```

You keep the `send()`, cancellation, progress, and message lifecycle API while controlling the Worker file yourself.

#### 🎁 Vite + TypeScript

```ts
import workerUrl from './worker?worker&url';
import { createEasyWebWorker } from 'easy-web-worker';

const workerSource =
  import.meta.env.MODE === 'production'
    ? workerUrl
    : new URL('./worker.ts', import.meta.url);

const worker = createEasyWebWorker(workerSource, {
  workerOptions: {
    type: 'module',
  },
});
```

#### 🔌 Existing Native Worker

Already have a `Worker` instance? Wrap it directly.

```ts
const nativeWorker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module',
});

const worker = createEasyWebWorker(nativeWorker);
```

Or provide an existing pool:

```ts
const worker = createEasyWebWorker([
  new Worker('./worker-a.js'),
  new Worker('./worker-b.js'),
]);
```

When an existing `Worker[]` is supplied, those Worker instances become the pool managed by `EasyWebWorker`.

---

### 3️⃣ Concurrency & Worker Pool

A single `EasyWebWorker` can distribute simultaneous messages across multiple native Workers.

#### 🚦 Scale on Demand

```ts
const worker = createEasyWebWorker<number, number>(
  ({ onMessage }) => {
    const fibonacci = (n: number): number => {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    };

    onMessage((message) => {
      message.resolve(fibonacci(message.payload));
    });
  },
  {
    maxWorkers: 4,
  }
);

const results = await Promise.all([
  worker.send(40),
  worker.send(41),
  worker.send(42),
]);
```

With `maxWorkers: 4`, the library can create additional Workers as concurrent requests arrive, up to the configured limit.

#### 🔥 Warm Up the Pool

Create the full pool immediately:

```ts
const worker = createEasyWebWorker(workerBody, {
  maxWorkers: 4,
  warmUpWorkers: true,
});
```

Useful when startup latency matters more than keeping the initial resource footprint small.

#### 💤 Dispose Idle Workers Automatically

```ts
const worker = createEasyWebWorker(workerBody, {
  maxWorkers: 4,
  keepAlive: false,
  terminationDelay: 5_000,
});
```

When there are no queued messages, idle Workers are terminated after the configured delay.

#### ⚙️ Concurrency Defaults

| Option                     | Current behavior                                                            |
| -------------------------- | --------------------------------------------------------------------------- |
| `maxWorkers`               | Defaults to `1`                                                             |
| `warmUpWorkers`            | Defaults to `true` for a single-worker configuration; otherwise `false`     |
| `keepAlive`                | Defaults to the resolved `warmUpWorkers` value unless explicitly configured |
| `terminationDelay`         | Defaults to `1000` ms                                                       |
| Existing `Worker[]` source | Pool size comes from the supplied array and the workers are kept alive      |

This lets the default experience behave like a persistent single Worker while making larger pools opt-in and demand-driven.

---

### 4️⃣ Reusable Worker Templates

Runtime Worker bodies are templates, so common Worker functionality can be composed.

```ts
import { createEasyWebWorker, type EasyWebWorkerBody } from 'easy-web-worker';

const commonTools: EasyWebWorkerBody = ({ onMessage }, context) => {
  context.doSomething = () => Promise.resolve('Reusable Worker code');
};

const worker = createEasyWebWorker([
  commonTools,
  ({ onMessage }, context) => {
    onMessage(async (message) => {
      const result = await context.doSomething();

      message.resolve(result);
    });
  },
]);

await worker.send();
```

This is useful when multiple runtime Workers share utilities, message handlers, or initialization logic.

---

### 5️⃣ Import Scripts into Runtime Workers

External scripts can be included through the Worker configuration.

```ts
const worker = createEasyWebWorker(
  ({ onMessage }, context) => {
    onMessage((message) => {
      context.doSomething();
      message.resolve();
    });
  },
  {
    scripts: ['https://example.com/worker-library.js'],
  }
);
```

For example, if the imported script adds something to the Worker global scope:

```js
// worker-library.js
self.message = 'Hello from imported script!';
self.doSomething = () => console.log(self.message);
```

For modern module-heavy Workers, a static Worker file with normal ESM imports is often easier to organize.

---

## 🔥 Advanced Patterns

### 🏗️ Build a Worker API with Named Methods

```ts
type User = {
  id: string;
  name: string;
};

const worker = createEasyWebWorker(({ onMessage }) => {
  const users = new Map<string, User>();

  onMessage<User, void>('saveUser', (message) => {
    users.set(message.payload.id, message.payload);
    message.resolve();
  });

  onMessage<string, User | null>('getUser', (message) => {
    message.resolve(users.get(message.payload) ?? null);
  });

  onMessage<string, boolean>('deleteUser', (message) => {
    message.resolve(users.delete(message.payload));
  });
});

await worker.sendToMethod<void, User>('saveUser', {
  id: '42',
  name: 'Johnny',
});

const user = await worker.sendToMethod<User | null, string>('getUser', '42');
```

One Worker, multiple typed operations, one shared Worker-local state.

### 🔎 Filter Large Collections with Progress

The Worker can retrieve, store, and filter a large collection without blocking the main thread.

```ts
type Item = Record<string, unknown>;

const worker = createEasyWebWorker<string, Item[]>(({ onMessage }) => {
  const collection = fetch('https://api.example.com/items').then(
    (response) => response.json() as Promise<Item[]>
  );

  const containsValue = (item: unknown, filter: string): boolean => {
    if (item === null || item === undefined) return false;

    if (typeof item !== 'object') {
      return String(item).toLowerCase().includes(filter);
    }

    return Object.values(item).some((value) => containsValue(value, filter));
  };

  onMessage(async (message) => {
    const items = await collection;
    const filter = message.payload.trim().toLowerCase();

    const result = items.filter((item, index) => {
      message.reportProgress(((index + 1) / items.length) * 100);

      return containsValue(item, filter);
    });

    message.resolve(result);
  });
});
```

Usage:

```ts
const filtered = await worker
  .send('johnny')
  .onProgress((percentage) => console.log(percentage));

console.log(filtered);
```

### 🥇 Latest Request Wins with `override()`

Useful for search, preview generation, parsing, or any workflow where an older queued result becomes irrelevant.

```ts
const result = await worker.override(
  latestPayload,
  'Superseded by a newer request'
);
```

`override()` cancels the current queued work and sends the new message after cancellation completes.

For immediate cancellation/reboot behavior:

```ts
await worker.override(latestPayload, 'Superseded', { force: true });
```

> `force: true` reboots the Worker. A Worker created directly from an existing native `Worker` instance cannot be rebooted by the library.

### 🥈 Keep the Current Task, Replace the Rest

`overrideAfterCurrent()` allows the currently executing message to finish, cancels the other queued messages, then sends the replacement.

```ts
const result = await worker.overrideAfterCurrent(
  latestPayload,
  'Queue replaced'
);
```

This is useful when interrupting the current operation would be expensive or unsafe, but stale queued work should still be discarded.

### 🧹 Explicit Cleanup

Dispose the worker when the owning feature or application no longer needs it.

```ts
await worker.dispose();
```

`dispose()` cancels outstanding work, revokes the generated Worker URL when applicable, terminates Worker instances, and clears the pool.

---

## 🧰 API Reference

### `createEasyWebWorker(source, config?)`

Convenience factory that creates an `EasyWebWorker`.

Supported sources:

```ts
EasyWebWorkerBody
EasyWebWorkerBody[]
string
URL
Worker
Worker[]
```

Example:

```ts
const worker = createEasyWebWorker<Payload, Result>(workerBody, config);
```

### `EasyWebWorker<TPayload, TResult>`

You can also instantiate the class directly:

```ts
import { EasyWebWorker } from 'easy-web-worker';

const worker = new EasyWebWorker<Payload, Result>(workerBody, config);
```

### ⚙️ Worker Configuration

| Option                | Purpose                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `scripts`             | Scripts to include in a runtime Worker                                                                                   |
| `workerOptions`       | Native [`WorkerOptions`](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker) passed when a Worker is created |
| `onWorkerError`       | Handles native Worker errors                                                                                             |
| `maxWorkers`          | Maximum number of native Workers in the pool                                                                             |
| `keepAlive`           | Keep created Workers alive after work completes                                                                          |
| `terminationDelay`    | Delay before idle Workers are terminated when `keepAlive` is `false`                                                     |
| `warmUpWorkers`       | Create the configured Worker pool during initialization                                                                  |
| `primitiveParameters` | Static primitive initialization values exposed through `context.primitiveParameters`                                     |

### 📤 `send(payload?, transfer?)`

Send a message to the default Worker handler.

```ts
const result = await worker.send(payload);
```

With transferables:

```ts
const result = await worker.send(payload, [buffer]);
```

Returns a `CancelablePromise<TResult>`.

### 🎯 `sendToMethod(method, payload?, transfer?)`

Send a message to a named `onMessage(method, callback)` handler.

```ts
const result = await worker.sendToMethod<Result, Payload>('calculate', payload);
```

### 🛑 `cancelAll(reason?, config?)`

Cancel all currently tracked messages.

```ts
await worker.cancelAll('Canceled by user');
```

Force an immediate Worker reboot:

```ts
await worker.cancelAll('Reset', {
  force: true,
});
```

### 🥇 `override(payload?, reason?, config?)`

Cancel current queued work and send a replacement message.

```ts
const result = await worker.override(payload, 'Superseded');
```

### 🥈 `overrideAfterCurrent(payload?, reason?, config?)`

Allow the current message to complete, cancel the remaining queue, then send a replacement.

```ts
const result = await worker.overrideAfterCurrent(payload, 'Queue replaced');
```

### 🔄 `reboot(reason?)`

Terminate the current Worker pool, cancel tracked messages, and initialize the Worker again.

```ts
worker.reboot('Worker configuration reset');
```

A Worker created from an existing native `Worker` instance cannot be rebooted by the library.

### 🧹 `dispose()`

Cancel outstanding messages and release the Worker resources.

```ts
await worker.dispose();
```

---

## 💬 `IEasyWebWorkerMessage<TPayload, TResult>`

Every `onMessage()` handler receives an `IEasyWebWorkerMessage`.

### 📥 `payload`

The payload sent from the main thread.

```ts
onMessage((message) => {
  console.log(message.payload);
});
```

### ✅ `resolve(result?, transfer?)`

Resolve the main-thread promise.

```ts
message.resolve(result);
```

### ❌ `reject(reason?, transfer?)`

Reject the main-thread promise.

```ts
message.reject(new Error('Something failed'));
```

### 🛑 `cancel(reason?, transfer?)`

Cancel the request from inside the Worker.

```ts
message.cancel('No longer needed');
```

### 📊 `reportProgress(percentage, payload?, transfer?)`

Report progress while keeping the request pending.

```ts
message.reportProgress(50, {
  processed: 500,
  total: 1000,
});
```

### 🎬 Lifecycle Subscriptions

```ts
message.onResolve(callback);
message.onReject(callback);
message.onCancel(callback);
message.onProgress(callback);
message.onFinalize(callback);
```

Each subscription returns an unsubscribe function.

### 🔍 Status

```ts
message.getStatus();
message.isPending();
```

---

## 🎨 Worker Source Options

| Source              | Best for                                     | Worker managed by `easy-web-worker`? |
| ------------------- | -------------------------------------------- | ------------------------------------ |
| Function template   | Small/medium Worker logic with minimal setup | ✅                                   |
| Template array      | Composable runtime Worker logic              | ✅                                   |
| `string` / `URL`    | Dedicated static Worker file                 | ✅                                   |
| Existing `Worker`   | Integrating an existing native Worker        | ✅ Wrapped                           |
| Existing `Worker[]` | Supplying your own pre-created pool          | ✅ Wrapped                           |

All approaches use the same message-oriented API on the main thread.

---

## 🎓 Learning Resources

- 🌐 [Live example — text diff](https://johnny-quesada-developer.github.io/easy-web-workers-example/)
- 🎥 [Introduction video](https://www.youtube.com/watch?v=CK-Uri9lDOE)
- 🧩 [Example repository](https://github.com/johnny-quesada-developer/easy-web-workers-example)
- 🧪 [CodePen example](https://codepen.io/johnnynabetes/full/wvOvygW)
- 📘 [MDN — Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- 📦 [npm — easy-web-worker](https://www.npmjs.com/package/easy-web-worker)

---

## 🌐 Framework Compatibility

`easy-web-worker` is built around the browser's native Worker API, so it is not tied to a UI framework.

| Environment        | Usage                 |
| ------------------ | --------------------- |
| React              | ✅                    |
| Angular            | ✅                    |
| Vue                | ✅                    |
| Svelte             | ✅                    |
| Vanilla JavaScript | ✅                    |
| TypeScript         | ✅ Strongly typed API |

The important requirement is a runtime with browser Web Worker support.

---

## 🎉 Why Developers Choose This

### The Bottom Line

| What You Get                  | What You Avoid                         |
| ----------------------------- | -------------------------------------- |
| ✅ Real native Worker threads | ❌ Main-thread CPU bottlenecks         |
| ✅ Promise-based messaging    | ❌ Manual message-ID plumbing          |
| ✅ Cancellation               | ❌ Abandoned long-running work         |
| ✅ Progress events            | ❌ Custom progress protocols           |
| ✅ Named Worker methods       | ❌ Giant message-routing switches      |
| ✅ Transferable support       | ❌ Unnecessary large-data cloning      |
| ✅ Worker pools               | ❌ Hand-written concurrency management |
| ✅ Runtime + static Workers   | ❌ One forced architecture             |
| ✅ TypeScript generics        | ❌ Untyped request/response contracts  |

---

## 🤝 Collaborators

<div align="center">

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/johnny-quesada-developer">
        <img src="https://avatars.githubusercontent.com/u/62082152?v=4&s=150" width="100" alt="Johnny Quesada" />
        <br />
        <sub><b>Johnny Quesada</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/gabrielecirulli">
        <img src="https://avatars.githubusercontent.com/u/886011?v=4&s=150" width="100" alt="Gabriele Cirulli" />
        <br />
        <sub><b>Gabriele Cirulli</b></sub>
      </a>
    </td>
  </tr>
</table>

</div>

---

## 🚀 Get Started Now

```bash
npm install easy-web-worker
```

Then:

```ts
import { createEasyWebWorker } from 'easy-web-worker';

const worker = createEasyWebWorker<string, string>(({ onMessage }) => {
  onMessage((message) => {
    message.resolve(message.payload.toUpperCase());
  });
});

console.log(await worker.send('hello worker'));
// HELLO WORKER
```

**That's it. You're running work in a real Web Worker.** 🎉

---

<div align="center">

### Built with ❤️ for developers who want the main thread to stay responsive

**[⭐ Star on GitHub](https://github.com/johnny-quesada-developer/easy-web-worker)** • **[📝 Report Issues](https://github.com/johnny-quesada-developer/easy-web-worker/issues)** • **[🧩 Examples](https://github.com/johnny-quesada-developer/easy-web-workers-example)**

</div>
