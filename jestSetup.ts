import { JSDOM } from 'jsdom';
import {
  WorkerMock,
  MockBlob,
  createObjectURL,
} from './@tests/testFixtures/Mocks';

const { window } = new JSDOM('<!DOCTYPE html>');

beforeEach(() => {
  const globalAny: any = global;

  globalAny.window = window;
  globalAny.Blob = MockBlob;

  globalAny.window.URL = {
    createObjectURL,
  };

  globalAny.window.webkitURL = {
    createObjectURL,
  };

  globalAny.Worker = WorkerMock;

  globalAny.self = {
    importScripts: jest.fn(),
    close: jest.fn(),
    postMessage: (data) => {
      globalAny.self.onmessage({
        data,
      });
    },
    onmessage: () => {},
  };
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
