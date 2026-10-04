import createBlobWorkerDefault, {
  createBlobWorker,
} from 'easy-web-worker/createBlobWorker';

import getWorkerTemplateDefault, {
  getWorkerTemplate,
} from 'easy-web-worker/getWorkerTemplate';

import uniqueIdDefault, { uniqueId } from 'easy-web-worker/uniqueId';
import { EasyWebWorkerBody } from 'easy-web-worker/types';

describe('createBlobWorker', () => {
  const globalAny: any = globalThis;

  const workerBody: EasyWebWorkerBody = (easyWorker) => {
    easyWorker.onMessage((message) => {
      message.resolve();
    });
  };

  /**
   * Returns the content of the worker created by the callback
   */
  const getWorkerContent = (callback: () => unknown): string => {
    const createObjectURL = vi.spyOn(globalAny.window.URL, 'createObjectURL');

    callback();

    const [blob] = createObjectURL.mock.calls[0] as [{ content: string[] }];

    return blob.content[0];
  };

  it('should return the url of the worker', () => {
    const url = createBlobWorker(workerBody);

    expect(url).toBeInstanceOf(URL);
    expect(createBlobWorkerDefault).toBe(createBlobWorker);
  });

  it('should create a javascript blob', () => {
    const createObjectURL = vi.spyOn(globalAny.window.URL, 'createObjectURL');

    globalAny.Blob = class {
      constructor(public content: string[], public config: { type: string }) {}
    };

    createBlobWorker(workerBody);

    const [blob] = createObjectURL.mock.calls[0] as [{ config: unknown }];

    expect(blob).toBeInstanceOf(globalAny.Blob);
    expect(blob.config).toEqual({ type: 'application/javascript' });
  });

  it('should include the worker template and the body', () => {
    const content = getWorkerContent(() => createBlobWorker(workerBody));

    expect(content).toContain(`let ew$=${getWorkerTemplate()};`);
    expect(content).toContain(`(${workerBody.toString().trim()})(ew$,cn$);`);
  });

  it('should include every body when the source is a collection', () => {
    const secondWorkerBody: EasyWebWorkerBody = (_easyWorker, context) => {
      context.secondBody = true;
    };

    const content = getWorkerContent(() =>
      createBlobWorker([workerBody, secondWorkerBody])
    );

    const firstIndex = content.indexOf(workerBody.toString().trim());
    const secondIndex = content.indexOf(secondWorkerBody.toString().trim());

    expect(firstIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeGreaterThan(firstIndex);
  });

  it('should not import scripts by default', () => {
    const content = getWorkerContent(() => createBlobWorker(workerBody));

    expect(content.startsWith('self.primitiveParameters=')).toEqual(true);
  });

  it('should import the scripts before the worker template', () => {
    const script = 'https://example.com/script.js';

    const content = getWorkerContent(() =>
      createBlobWorker(workerBody, [script])
    );

    const importIndex = content.indexOf('self.importScripts(');

    expect(importIndex).toEqual(0);
    expect(content).toContain(script);
    expect(content.indexOf(script)).toBeLessThan(content.indexOf('let ew$='));
  });

  it('should include the primitive parameters', () => {
    const primitiveParameters = [1, 'text', true];

    const content = getWorkerContent(() =>
      createBlobWorker(workerBody, [], { primitiveParameters })
    );

    expect(content).toContain(
      `self.primitiveParameters=JSON.parse(\`${JSON.stringify(
        primitiveParameters
      )}\`);`
    );
  });

  it.each([undefined, null])(
    'should use an empty collection when the primitive parameters are %s',
    (primitiveParameters) => {
      const content = getWorkerContent(() =>
        createBlobWorker(workerBody, [], { primitiveParameters })
      );

      expect(content).toContain('self.primitiveParameters=JSON.parse(`[]`);');
    }
  );

  it('should use webkitURL when URL is not available', () => {
    const webkitURL = {
      createObjectURL: vi.fn(() => 'blob:worker'),
    };

    globalAny.window.URL = undefined;
    globalAny.window.webkitURL = webkitURL;

    try {
      expect(createBlobWorker(workerBody)).toEqual('blob:worker');
      expect(webkitURL.createObjectURL).toHaveBeenCalledTimes(1);
    } finally {
      delete globalAny.window.webkitURL;
    }
  });
});

describe('getWorkerTemplate', () => {
  it('should return the template of the worker', () => {
    const template = getWorkerTemplate();

    expect(typeof template).toEqual('string');
    expect(template.length).toBeGreaterThan(0);
    expect(getWorkerTemplateDefault).toBe(getWorkerTemplate);
  });

  it('should return a valid javascript expression', () => {
    const selfMock = { onmessage: null };

    const easyWorker = new Function(
      'self',
      `return ${getWorkerTemplate()}`
    )(selfMock);

    expect(typeof easyWorker.onMessage).toEqual('function');
    expect(typeof easyWorker.close).toEqual('function');
    expect(typeof easyWorker.importScripts).toEqual('function');
    expect(typeof selfMock.onmessage).toEqual('function');
  });
});

describe('uniqueId', () => {
  it('should return an unique id', () => {
    const ids = new Array(1000).fill(null).map(() => uniqueId());

    expect(new Set(ids).size).toEqual(ids.length);
    expect(uniqueIdDefault).toBe(uniqueId);
  });

  it('should add the prefix', () => {
    expect(uniqueId('prefix:').startsWith('prefix:')).toEqual(true);
    expect(uniqueId().startsWith('prefix:')).toEqual(false);
  });
});
