import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import waitFor from '../../__tests__/__setup__/waitFor';
import messagePortRPC from '../messagePortRPC';

type Fn = (x: number, y: number) => Promise<number>;
type MockFn = jest.Mock<Fn>;
type RPC = ReturnType<typeof messagePortRPC<Fn, Fn>>;

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
