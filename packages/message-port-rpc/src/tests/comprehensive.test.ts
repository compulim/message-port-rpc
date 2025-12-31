import { describeEach } from '@compulim/test-harness/describeEach';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { afterEach, beforeEach, describe, mock, test, type Mock } from 'node:test';
import messagePortRPC from '../messagePortRPC.ts';

type Fn = (x: number, y: number) => Promise<number>;
type MockFn = Mock<Fn>;
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

    fn1 = mock.fn();
    fn2 = mock.fn();

    rpc1 = messagePortRPC(port1, fn1);
    rpc2 = messagePortRPC(port2, fn2);
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  describeEach<[string, () => [RPC, MockFn]]>([
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
        theFn.mock.mockImplementation((x, y) => Promise.resolve(x + y));

        resultPromise = theRPC(12, 34);
      });

      test('should return value', () => expect(resultPromise).resolves.toBe(12 + 34));
    });

    describe('call() twice', () => {
      let deferred1: PromiseWithResolvers<void>;
      let deferred2: PromiseWithResolvers<void>;

      let result1Promise: Promise<number>;
      let result2Promise: Promise<number>;

      beforeEach(() => {
        deferred1 = Promise.withResolvers<void>();
        deferred2 = Promise.withResolvers<void>();

        theFn.mock.mockImplementation(async (x, y) => {
          if (theFn.mock.callCount() === 0) {
            await deferred1.promise;

            return x + y;
          } else {
            await deferred2.promise;

            return x * y;
          }
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
          Promise.race<void>([
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
        theFn.mock.mockImplementation(() => Promise.reject(123));

        resultPromise = theRPC(12, 34);
      });

      test('should reject', () => expect(resultPromise).rejects.toBe(123));
    });

    describe('call() rejected with an Error', () => {
      let resultPromise: Promise<number>;

      beforeEach(() => {
        theFn.mock.mockImplementation(() => Promise.reject(new Error('Artificial.')));

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
