import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ onMessage }) => ({
  validate: onMessage((input: string, message) => {
    if (!input) {
      // the call is rejected on the main thread with this reason
      message.cancel('Nothing to validate');

      return false;
    }

    return input.length > 3;
  }),
}));

export type ValidatorWorker = typeof worker;
