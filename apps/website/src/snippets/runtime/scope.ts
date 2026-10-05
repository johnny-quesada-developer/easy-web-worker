import { createWorker } from 'easy-web-worker/createWorker';

const greeting = 'Hello';

export const broken = () =>
  createWorker(() => ({
    // `greeting` does not exist inside the worker: this throws when it is called
    greet: (name: string) => `${greeting} ${name}`,
  }));

export const working = () =>
  createWorker(() => {
    // defined inside the function, so it travels with it
    const greeting = 'Hello';

    return {
      greet: (name: string) => `${greeting} ${name}`,
    };
  });
