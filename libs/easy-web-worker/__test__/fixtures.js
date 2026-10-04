"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URL_MOCK = exports.BLOB_MOCK = exports.WINDOW_MOCK = void 0;
var jsdom_1 = require("jsdom");
var window = new jsdom_1.JSDOM("<!DOCTYPE html>").window;
exports.WINDOW_MOCK = window;
var BLOB_MOCK = /** @class */ (function () {
  function BLOB_MOCK(content, config) {
    this.content = content;
  }
  return BLOB_MOCK;
})();
exports.BLOB_MOCK = BLOB_MOCK;
exports.URL_MOCK = {
  createObjectURL: function (blob) {
    var content = blob.content[0];
    var sourceString = "data:text/javascript;base64,".concat(
      Buffer.from(
        "\n    import { parentPort, isMainThread, workerData } from 'node:worker_threads';\n\n    const self = {\n      importScripts: () => {},\n      close: parentPort.close,\n      postMessage: (data) => {\n        parentPort?.postMessage({\n          data,\n        });\n      },\n      onmessage: null,\n      onerror: null,\n    }\n    \n    parentPort.on('message', (message) => {\n      self.onmessage?.(message);\n    });\n\n    parentPort.on('error', (error) => {\n      self.onerror?.(error);\n    });\n\n    ;" +
          content
      ).toString("base64")
    );
    return new URL(sourceString);
  },
  revokeObjectURL: function () {},
};
