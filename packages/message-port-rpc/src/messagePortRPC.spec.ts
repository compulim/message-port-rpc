import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import createDeferred from '../__tests__/__setup__/createDeferred';
import messagePortRPC from './messagePortRPC';
import waitFor from '../__tests__/__setup__/waitFor';

type Fn = (x: number, y: number) => Promise<number>;
type MockFn = jest.Mock<Fn>;
type RPC = ReturnType<typeof messagePortRPC<Fn, Fn>>;

describe('create RPC from port', () => {
  let fn1: MockFn;
  let fn2: MockFn;
  let port1: MessagePort;
  let port2: MessagePort;
  let rpc1: RPC;
  let rpc2: RPC;

  beforeEach(() => {
    ({ port1, port2 } = new MessageChannel());

    fn1 = jest.fn();
    fn2 = jest.fn();

    rpc1 = messagePortRPC(port1, fn1);
    rpc2 = messagePortRPC(port2, fn2);
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  describe.each([
    ['port 1 -> port 2', () => [rpc1, fn2] as [RPC, MockFn]],
    ['port 2 -> port 1', () => [rpc2, fn1] as [RPC, MockFn]]
  ])('%s', (_, getParameters) => {
    let theFn: MockFn;
    let theRPC: RPC;

    beforeEach(() => {
      [theRPC, theFn] = getParameters();
    });

    describe('call()', () => {
      let resultPromise: Promise<number>;

      beforeEach(() => {
        theFn.mockImplementation((x, y) => Promise.resolve(x + y));

        resultPromise = theRPC(12, 34);
      });

      test('should return value', () => expect(resultPromise).resolves.toBe(12 + 34));
    });

    describe('call() twice', () => {
      let deferred1: ReturnType<typeof createDeferred<void>>;
      let deferred2: ReturnType<typeof createDeferred<void>>;

      let result1Promise: Promise<number>;
      let result2Promise: Promise<number>;

      beforeEach(() => {
        deferred1 = createDeferred<void>();
        deferred2 = createDeferred<void>();

        theFn.mockImplementationOnce(async (x, y) => {
          await deferred1.promise;

          return x + y;
        });

        theFn.mockImplementationOnce(async (x, y) => {
          await deferred2.promise;

          return x * y;
        });

        result1Promise = theRPC(12, 34);
        result2Promise = theRPC(12, 34);
      });

      describe('when second call resolve', () => {
        beforeEach(() => deferred2.resolve());

        // Resolving `deferred1` so we release `MessagePort` appropriately.
        // Otherwise, the immediate tests below will leave the `MessagePort` listen forever.
        afterEach(() => deferred1.resolve());

        test('should return value', () => waitFor(() => expect(result2Promise).resolves.toBe(12 * 34)));
        test('first call should not resolve/reject', () =>
          Promise.race([
            result1Promise.then(() => Promise.reject('should not resolve')),
            new Promise(resolve => setTimeout(resolve, 0))
          ]));

        describe('when first call resolve', () => {
          beforeEach(() => deferred1.resolve());

          test('should return value', () => waitFor(() => expect(result1Promise).resolves.toBe(12 + 34)));
        });
      });
    });

    describe('call() rejected with a number', () => {
      let resultPromise: Promise<number>;

      beforeEach(() => {
        theFn.mockImplementation(() => Promise.reject(123));

        resultPromise = theRPC(12, 34);
      });

      test('should reject', () => expect(resultPromise).rejects.toBe(123));
    });

    describe('call() rejected with an Error', () => {
      let resultPromise: Promise<number>;

      beforeEach(() => {
        theFn.mockImplementation(() => Promise.reject(new Error('Artificial.')));

        resultPromise = theRPC(12, 34);
      });

      test('should reject with an Error object', async () => {
        await resultPromise.catch(error => expect(Object.prototype.toString.call(error)).toBe('[object Error]'));

        await expect(resultPromise).rejects.toEqual(
          expect.objectContaining({
            message: 'Artificial.',
            stack: expect.any(String)
          })
        );
      });
    });
  });
});

describe('send transferables', () => {
  let fn: jest.Mock<(arrayBuffer: ArrayBuffer, port: MessagePort) => Promise<void>>;
  let rpc: ReturnType<typeof messagePortRPC<typeof fn>>;
  let port1: MessagePort;
  let port2: MessagePort;

  beforeEach(() => {
    ({ port1, port2 } = new MessageChannel());

    fn = jest.fn();

    messagePortRPC(port2, fn);
    rpc = messagePortRPC<typeof fn>(port1);
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  describe('when sending a port', () => {
    let port1: MessagePort;
    let port2: MessagePort;

    beforeEach(async () => {
      ({ port1, port2 } = new MessageChannel());

      const arrayBuffer = new Int8Array([1, 2, 3]).buffer;

      rpc.withOptions({ transfer: [arrayBuffer, port1] })(arrayBuffer, port1);

      await waitFor(() => expect(fn).toBeCalledTimes(1));
    });

    afterEach(() => {
      port1?.close();
      port2?.close();
    });

    test('should pass ArrayBuffer', () => {
      const arrayBuffer = fn.mock.calls[0]?.[0];

      expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);

      const typedArray = new Int8Array(arrayBuffer);

      expect(Array.from(typedArray)).toEqual([1, 2, 3]);
    });

    test('should pass MessagePort', async () => {
      const receivePort = fn.mock.calls[0]?.[1];

      expect(receivePort).toBeInstanceOf(MessagePort);

      receivePort.onmessage = jest.fn();
      port2.postMessage({ one: 1 });

      await waitFor(() => {
        expect(receivePort.onmessage).toBeCalledTimes(1);
        expect(receivePort.onmessage).toHaveBeenCalledWith(expect.objectContaining({ data: { one: 1 } }));
      });
    });
  });
});

describe('send with abort', () => {
  let abortController: AbortController;
  let fn: MockFn;
  let port1: MessagePort;
  let port2: MessagePort;
  let promise: Promise<number>;
  let rpc: RPC;

  beforeEach(async () => {
    ({ port1, port2 } = new MessageChannel());

    abortController = new AbortController();
    fn = jest.fn(
      () =>
        new Promise(() => {
          // Do nothing.
        })
    );

    messagePortRPC(port2, fn);

    rpc = messagePortRPC(port1);
    promise = rpc.withOptions({ signal: abortController.signal })(12, 34);

    // Catch it once so Node.js don't consider as unhandled rejection.
    promise.catch(() => {
      // Do nothing.
    });

    await waitFor(() => expect(fn).toBeCalledTimes(1));
  });

  afterEach(() => {
    port1?.close();
    port2?.close();

    // Call abort() to release resources.
    abortController.abort();
  });

  test('signal should not abort initially', async () => {
    expect(fn.mock.contexts[0]).toHaveProperty('signal.aborted', false);
  });

  describe('when abort()', () => {
    beforeEach(() => {
      abortController.abort();
    });

    test('should reject on abort', async () => {
      await waitFor(() => expect(promise).rejects.toThrow('Aborted.'));
    });

    test('signal should be aborted', async () => {
      await waitFor(() => expect(fn.mock.contexts[0]).toHaveProperty('signal.aborted', true));
    });
  });
});

describe('assymetric functions', () => {
  type Fn1 = (value: number) => string;
  type Fn2 = (value: string) => number;

  let fn1: jest.Mock<Fn1>;
  let fn2: jest.Mock<Fn2>;
  let port1: MessagePort;
  let port2: MessagePort;
  let rpc1: ReturnType<typeof messagePortRPC<Fn2, Fn1>>;
  let rpc2: ReturnType<typeof messagePortRPC<Fn1, Fn2>>;

  beforeEach(() => {
    ({ port1, port2 } = new MessageChannel());

    fn1 = jest.fn<(value: number) => string>(value => '' + value);
    fn2 = jest.fn<(value: string) => number>(value => +value);

    // TODO: Verify typing.
    rpc1 = messagePortRPC<Fn2, Fn1>(port1, fn1);
    rpc2 = messagePortRPC<Fn1, Fn2>(port2, fn2);
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  test('port 1 -> port 2: call', async () => {
    await expect(rpc1('123')).resolves.toBe(123);
  });

  test('port 2 -> port 1: call', async () => {
    await expect(rpc2(123)).resolves.toBe('123');
  });
});

describe('throw synchronously', () => {
  type Fn = () => never;

  let fn: jest.Mock<Fn>;
  let port1: MessagePort;
  let port2: MessagePort;
  let rpc: ReturnType<typeof messagePortRPC<Fn>>;
  let promise: Promise<never>;

  beforeEach(async () => {
    ({ port1, port2 } = new MessageChannel());

    fn = jest.fn<Fn>(() => {
      throw new Error('Artificial.');
    });

    messagePortRPC<Fn>(port2, fn);
    rpc = messagePortRPC<Fn>(port1);

    promise = rpc();

    // Catch it once so Node.js don't consider as unhandled rejection.
    promise.catch(() => {
      // Do nothing.
    });

    await waitFor(() => expect(fn).toBeCalledTimes(1));
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  test('should reject', () => waitFor(() => expect(promise).rejects.toThrow('Artificial.')));
});

// The following is for copying to our bug.yml.
describe('simple', () => {
  type Fn = (x: number, y: number) => number;

  let fn: jest.Mock<Fn>;
  let port1: MessagePort;
  let port2: MessagePort;
  let rpc: ReturnType<typeof messagePortRPC<Fn>>;

  // GIVEN: Stub to perform summation.
  beforeEach(async () => {
    ({ port1, port2 } = new MessageChannel());

    fn = jest.fn<Fn>((x, y) => x + y);

    messagePortRPC<Fn>(port1, fn);
    rpc = messagePortRPC<Fn>(port2);
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  describe('when called with 1 and 2', () => {
    let promise: Promise<number>;

    // WHEN: Called with 1 and 2.
    beforeEach(() => {
      promise = rpc(1, 2);
    });

    // THEN: Should have called the server stub.
    test('should call the server stub', () => waitFor(() => expect(fn).toBeCalledTimes(1)));

    // THEN: Should return 3.
    test('should resolve 3', () => waitFor(() => expect(promise).resolves.toBe(3)));
  });
});
