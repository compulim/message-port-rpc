import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { waitFor } from '@testduet/wait-for';

import messagePortRPC from '../messagePortRPC';

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

    await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  test('should reject', () => waitFor(() => expect(promise).rejects.toThrow('Artificial.')));
});
