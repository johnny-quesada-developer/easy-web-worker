const worker = new Worker(new URL('./fibonacci.worker.js', import.meta.url));
const pending = new Map();
let nextId = 0;

worker.onmessage = ({ data: { id, result } }) => {
  pending.get(id)(result);
  pending.delete(id);
};

export const fibonacci = (n) =>
  new Promise((resolve) => {
    const id = nextId++;

    pending.set(id, resolve);
    worker.postMessage({ id, n });
  });
