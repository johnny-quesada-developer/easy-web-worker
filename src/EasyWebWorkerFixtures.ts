export const generatedId = (): string =>
  `${new Date().getTime()}${Math.random().toString(36).substr(2, 9)}`;

/**
 * This is the template of the worker, should be and string to avoid compilation issues
 */
export const WorkerTemplate = () => `
  /*this-code-was auto-generated*/
  const easyWorker = new (class {
    onMessageCallback = () => {
      throw "you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";
    };

    onMessage = (callback) => {
      this.onMessageCallback = callback;
    };
  })();

  self.onmessage = (event) => {
    const { messageId, payload } = event.data;

    // each message should have his own resolution methods
    const message = new (class {
      payload = payload;

      messageId = messageId;

      resolve = (...result) => self.postMessage({ messageId, payload: result });

      reject = (reason) => self.postMessage({ messageId, reason });

      cancel = (reason) => self.postMessage({  messageId, reason, wasCanceled: true });

      reportProgress = (progressPercentage) => self.postMessage({ messageId, progressPercentage });
    })();

    easyWorker.onMessageCallback(message, event);
  };
`;

export const minifyJS = (code: string) => {
  // Remove comments
  let result = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

  // Remove whitespace
  result = result.replace(/\s+/g, ' ');

  let output = '';
  let insideString = false;
  let buffer = '';

  for (let i = 0; i < result.length; i++) {
    const currentChar = result[i];
    const nextChar = result[i + 1];

    // Check if we're inside a string
    if (currentChar === '"' && result[i - 1] !== '\\') {
      insideString = !insideString;
      buffer += currentChar;
      continue;
    }

    // Skip whitespace
    if (/\s/.test(currentChar)) {
      continue;
    }

    // Remove unnecessary semicolons
    if (currentChar === ';' && nextChar === '}') {
      i++;
      continue;
    }

    // Remove whitespace around operators
    if (/[\+\-\*\/%=<>!&|^?:]/.test(currentChar)) {
      output += buffer.trimRight() + currentChar;
      buffer = '';
    } else {
      buffer += currentChar;
      if (!insideString) {
        output += buffer;
        buffer = '';
      }
    }
  }

  output += buffer.trimRight();

  return output;
};
