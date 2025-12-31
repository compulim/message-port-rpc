import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { afterEach, beforeEach, describe, mock, test, type Mock } from 'node:test';
import messagePortRPC from '../messagePortRPC.ts';

describe('send transferables', () => {
  let fn: Mock<(arrayBuffer: ArrayBuffer, port: MessagePort) => Promise<void>>;
  let rpc: ReturnType<typeof messagePortRPC<typeof fn>>;
  let port1: MessagePort;
  let port2: MessagePort;

  beforeEach(() => {
    ({ port1, port2 } = new MessageChannel());

    fn = mock.fn();

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

      await waitFor(() => expect(fn.mock.callCount()).toBe(1));
    });

    afterEach(() => {
      port1?.close();
      port2?.close();
    });

    describe('should call host function', () => {
      test('once', () => expect(fn.mock.callCount()).toBe(1));

      test('with ArrayBuffer and MessagePort', () =>
        expect(fn.mock.calls[0]?.arguments).toEqual([expect.any(ArrayBuffer), expect.any(MessagePort)]));

      test('with content', () => {
        const arrayBuffer = fn.mock.calls[0]?.arguments[0];

        if (!arrayBuffer) {
          throw new Error('first argument must not be falsy.');
        }

        expect(Array.from(new Int8Array(arrayBuffer))).toEqual([1, 2, 3]);
      });

      test('with working MessagePort', async () => {
        const receivePort = fn.mock.calls[0]?.arguments[1];

        if (!receivePort) {
          throw new Error('second argument must not be falsy.');
        }

        const handleMessage = mock.fn<(this: MessagePort, ev: MessageEvent<unknown>) => unknown>();

        receivePort.onmessage = handleMessage;
        port2.postMessage({ one: 1 });

        await waitFor(() => {
          expect(handleMessage.mock.callCount()).toBe(1);
          expect(handleMessage.mock.calls[0]?.arguments).toEqual([expect.objectContaining({ data: { one: 1 } })]);
        });
      });
    });
  });
});
