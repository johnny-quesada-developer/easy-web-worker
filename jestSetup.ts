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
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
