import type { ReturnValueOfPromise } from './private/types/ReturnValueOfPromise';

const CALL = 'CALL';
const REJECT = 'REJECT';
const RESOLVE = 'RESOLVE';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RPCCallMessage<T extends (...args: any[]) => Promise<unknown>> = [typeof CALL, ...Parameters<T>];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RPCRejectMessage = [typeof REJECT, any];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RPCResolveMessage<T extends (...args: any[]) => Promise<unknown>> = [
  typeof RESOLVE,
  ReturnValueOfPromise<ReturnType<T>>
];

type Init = {
  signal?: AbortSignal;
  transfer?: Transferable[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReturnValue<T extends (...args: any[]) => Promise<unknown>> = {
  (...args: Parameters<T>): Promise<ReturnValueOfPromise<ReturnType<T>>>;
  withOptions: (args: Parameters<T>, init: Init) => Promise<ReturnValueOfPromise<ReturnType<T>>>;
};

/**
 * Converts a `MessagePort` into a RPC function.
 *
 * In a traditional RPC setting:
 * - server should call this function with `fn` argument, the returned function should be ignored;
 * - client should call this function without `fn` argument, the returned function is the stub to call the server.
 *
 * This function supports bidirectional RPC when both sides are passing the `fn` argument.
 *
 * When calling the returned function stub, the arguments and return value are transferred over `MessagePort`.
 * Thus, they will be cloned by the underlying structured clone algorithm.
 *
 * The returned stub has a variant `withOptions` for passing transferables and abort signal.
 *
 * @param {MessagePort} port - The `MessagePort` object to send the calls. The underlying `MessageChannel` must be exclusively used by this function only.
 * @param {Function} fn - The function to invoke. If not set, this RPC cannot be invoked by the other side of `MessagePort`.
 *
 * @returns A function, when called, will invoke the function on the other side of `MessagePort`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function messagePortRPC<T extends (...args: any[]) => Promise<unknown>>(
  port: MessagePort,
  fn?: T
): ReturnValue<T> {
  type P = Parameters<T>;
  type R = ReturnValueOfPromise<ReturnType<T>>;

  port.addEventListener('message', event => {
    const data = event.data as RPCCallMessage<T> | undefined;

    if (Array.isArray(data) && data[0] === CALL) {
      event.stopImmediatePropagation();

      const [returnPort] = event.ports;

      if (fn) {
        (async function () {
          try {
            returnPort.postMessage([RESOLVE, await fn(...data.slice(1))]);
          } catch (error) {
            returnPort.postMessage([REJECT, error]);
          } finally {
            returnPort.close();
          }
        })();
      } else {
        returnPort.postMessage([
          REJECT,
          new Error(
            'No function was registered on this RPC. This is probably calling a client which do not implement the function.'
          )
        ]);
        returnPort.close();
      }
    }
  });

  port.start();

  const stubWithOptions = (args: P, init: Init = {}): Promise<R> =>
    new Promise<R>((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      port1.onmessage = event => {
        const data = event.data as RPCRejectMessage | RPCResolveMessage<T>;

        if (data[0] === RESOLVE) {
          resolve(data[1]);
        } else {
          reject(data[1]);
        }

        port1.close();
      };

      init?.signal?.addEventListener('abort', () => {
        port1.close();
        reject(new Error('Aborted.'));
      });

      const callMessage: RPCCallMessage<T> = [CALL, ...args];

      port.postMessage(callMessage, [port2, ...(init.transfer || [])]);
    });

  const stub = (...args: P): Promise<R> => stubWithOptions(args);

  stub.withOptions = stubWithOptions;

  return stub;
}
