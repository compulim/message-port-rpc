// Naming is from https://www.w3.org/History/1992/nfs_dxcern_mirror/rpc/doc/Introduction/HowItWorks.html.

import type { ReturnValueOfPromise } from './private/types/ReturnValueOfPromise';

const ABORT = 'ABORT';
const CALL = 'CALL';
const REJECT = 'REJECT';
const RESOLVE = 'RESOLVE';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Subroutine = (...args: any[]) => Promise<unknown> | unknown;
type RPCCallMessage<T extends Subroutine> = [typeof CALL, ...Parameters<T>];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RPCRejectMessage = [typeof REJECT, any];
type RPCResolveMessage<T extends Subroutine> = [typeof RESOLVE, ReturnValueOfPromise<ReturnType<T>>];

type CallInit = {
  signal?: AbortSignal;
  transfer?: Transferable[];
};

// Regardless whether T returns Promise or not, the client stub must return Promise.
type ClientStub<T extends Subroutine> = (...args: Parameters<T>) => Promise<ReturnValueOfPromise<ReturnType<T>>>;

type ClientStubWithExtra<T extends Subroutine> = ClientStub<T> & {
  /**
   * Creates a new stub with options.
   *
   * @param {AbortSignal} init.signal - Abort signal to abort the call to the stub.
   * @param {Transferable[]} init.transfer - Transfer ownership of objects specified in `args`.
   */
  withOptions: (init: CallInit) => ClientStub<T>;
};

type ServerStub<T extends Subroutine> = (this: { signal: AbortSignal }, ...args: Parameters<T>) => ReturnType<T>;

/**
 * Binds a function to a `MessagePort` in RPC fashion and/or create a RPC function stub connected to a `MessagePort`.
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
export default function messagePortRPC<C extends Subroutine>(port: MessagePort): ClientStubWithExtra<C>;

export default function messagePortRPC<C extends Subroutine, S extends Subroutine = C>(
  port: MessagePort,
  fn: ServerStub<S>
): ClientStubWithExtra<C>;

export default function messagePortRPC<C extends Subroutine, S extends Subroutine = C>(
  port: MessagePort,
  fn: ServerStub<S>,
  options: { signal: AbortSignal }
): ClientStubWithExtra<C>;

export default function messagePortRPC<C extends Subroutine, S extends Subroutine = C>(
  port: MessagePort,
  fn?: ServerStub<S>
): ClientStubWithExtra<C> {
  // We cannot neuter the input port because it would cause memory leak:
  // - We can neuter a port by passing it through Structured Clone Algorithm so the input port will become non-functional
  // - After a port is neutered, closing the neutered port will not close the cloned port
  // - Thus, the port owner will no longer able to close the port
  // - This defeated our philosophy: whoever pass a resources to a function, should own the resources unless it is intentional and no other workarounds

  type ClientSubroutineParameters = Parameters<C>;
  type ClientSubroutineReturnValue = ReturnValueOfPromise<ReturnType<C>>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessage = (event: MessageEvent<RPCCallMessage<S>>): void => {
    const data = event.data as RPCCallMessage<S> | undefined;

    if (Array.isArray(data) && data[0] === CALL) {
      event.stopImmediatePropagation();

      const [returnPort] = event.ports;

      if (!returnPort) {
        throw new Error('RPCCallMessage must contains a port.');
      }

      if (fn) {
        (async function () {
          const abortController = new AbortController();

          try {
            returnPort.onmessage = ({ data }) => Array.isArray(data) && data[0] === ABORT && abortController.abort();

            returnPort.postMessage([
              RESOLVE,
              await fn.call({ signal: abortController.signal }, ...(data.slice(1) as Parameters<S>))
            ]);
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
  };

  port.addEventListener('message', handleMessage);
  port.start();

  const createWithOptions =
    (init: CallInit): ((...args: ClientSubroutineParameters) => Promise<ClientSubroutineReturnValue>) =>
    (...args) => {
      return new Promise<ClientSubroutineReturnValue>((resolve, reject) => {
        const { port1, port2 } = new MessageChannel();

        port1.onmessage = event => {
          const data = event.data as RPCRejectMessage | RPCResolveMessage<C>;

          if (data[0] === RESOLVE) {
            resolve(data[1]);
          } else {
            reject(data[1]);
          }

          port1.close();
        };

        init?.signal?.addEventListener('abort', () => {
          port1.postMessage([ABORT]);
          port1.close();

          reject(new Error('Aborted.'));
        });

        const callMessage: RPCCallMessage<C> = [CALL, ...args];

        port.postMessage(callMessage, [port2, ...(init.transfer || [])]);
      });
    };

  const stub = createWithOptions({}) as ClientStubWithExtra<C>;

  stub.withOptions = createWithOptions;

  return stub;
}
