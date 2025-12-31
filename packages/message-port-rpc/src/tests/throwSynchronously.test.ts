import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { afterEach, beforeEach, describe, mock, test, type Mock } from 'node:test';
import messagePortRPC from '../messagePortRPC.ts';

describe('throw synchronously', () => {
  type Fn = () => never;

  let fn: Mock<Fn>;
  let port1: MessagePort;
  let port2: MessagePort;
  let rpc: ReturnType<typeof messagePortRPC<Fn>>;
  let promise: Promise<never>;

  beforeEach(async () => {
    ({ port1, port2 } = new MessageChannel());

    fn = mock.fn<Fn>(() => {
      throw new Error('Artificial.');
    });

    messagePortRPC<Fn>(port2, fn);
    rpc = messagePortRPC<Fn>(port1);

    promise = rpc();

    // Catch it once so Node.js don't consider as unhandled rejection.
    promise.catch(() => {
      // Do nothing.
    });

    await waitFor(() => expect(fn.mock.callCount()).toBe(1));
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  test('should reject', () => waitFor(() => expect(promise).rejects.toThrow('Artificial.')));
});
