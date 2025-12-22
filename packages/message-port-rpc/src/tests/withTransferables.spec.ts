import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { waitFor } from '@testduet/wait-for';

import messagePortRPC from '../messagePortRPC';

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

      await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
    });

    afterEach(() => {
      port1?.close();
      port2?.close();
    });

    describe('should call host function', () => {
      test('once', () => expect(fn).toHaveBeenCalledTimes(1));

      test('with ArrayBuffer and MessagePort', () =>
        expect(fn).toHaveBeenNthCalledWith(1, expect.any(ArrayBuffer), expect.any(MessagePort)));

      test('with content', () => {
        const arrayBuffer = fn.mock.calls[0]?.[0];

        if (!arrayBuffer) {
          throw new Error('first argument must not be falsy.');
        }

        expect(Array.from(new Int8Array(arrayBuffer))).toEqual([1, 2, 3]);
      });

      test('with working MessagePort', async () => {
        const receivePort = fn.mock.calls[0]?.[1];

        if (!receivePort) {
          throw new Error('second argument must not be falsy.');
        }

        receivePort.onmessage = jest.fn();
        port2.postMessage({ one: 1 });

        await waitFor(() => {
          expect(receivePort.onmessage).toHaveBeenCalledTimes(1);
          expect(receivePort.onmessage).toHaveBeenCalledWith(expect.objectContaining({ data: { one: 1 } }));
        });
      });
    });
  });
});
