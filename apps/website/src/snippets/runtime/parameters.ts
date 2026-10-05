import { createWorker } from 'easy-web-worker/createWorker';

export const labels = createWorker(
  (_helpers, context) => {
    // the second parameter is the global scope of the worker
    const [prefix] = context.primitiveParameters;

    return {
      label: (text: string) => `${prefix} ${text}`,
    };
  },
  {
    primitiveParameters: ['Result:'] as [string],
  },
);

export const labeled = labels.label('complete'); // 'Result: complete'
