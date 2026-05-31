// Naming is from https://www.w3.org/History/1992/nfs_dxcern_mirror/rpc/doc/Introduction/HowItWorks.html.

import messagePortRPC from './messagePortRPC.ts';

const GENERATE = 'GENERATOR_GENERATE';

type ClientDisposeReason = 'abort' | 'dispose' | 'done';

// type GeneratorSubroutine<TArgs extends unknown[] = any[], T = unknown, TReturn = any, TNext = unknown> = (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeneratorSubroutine = (...args: any[]) => AsyncGenerator | Generator | AsyncIterator<unknown> | Iterator<unknown>;
type RPCGeneratorGenerateMessage<T extends GeneratorSubroutine> = [
  typeof GENERATE,
  Readonly<{
    asyncDispose: MessagePort;
    next: MessagePort;
    return: MessagePort;
    throw: MessagePort;
  }>,
  ...Parameters<T>
];

type CallInit = {
  signal?: AbortSignal;
  transfer?: Transferable[];
};

type NextOfGenerator<T extends AsyncGenerator | Generator | AsyncIterator<unknown> | Iterator<unknown>> =
  T extends AsyncGenerator<unknown, unknown, infer U> ? U : T extends Generator<unknown, unknown, infer V> ? V : never;
type ReturnOfGenerator<T extends AsyncGenerator | Generator | AsyncIterator<unknown> | Iterator<unknown>> =
  T extends AsyncGenerator<unknown, infer U> ? U : T extends Generator<unknown, infer V> ? V : never;
type YieldOfGenerator<T extends AsyncGenerator | Generator | AsyncIterator<unknown> | Iterator<unknown>> =
  T extends AsyncGenerator<infer U>
    ? U
    : T extends Generator<infer U>
      ? U
      : T extends AsyncIterator<infer U>
        ? U
        : T extends Iterator<infer U>
          ? U
          : never;

// Regardless whether T returns Promise or not, the client stub must return Promise.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientGeneratorStub<T extends GeneratorSubroutine> = (
  ...args: Parameters<T>
) => AsyncGenerator<YieldOfGenerator<ReturnType<T>>, ReturnOfGenerator<ReturnType<T>>, NextOfGenerator<ReturnType<T>>>;

type ClientGeneratorStubWithExtra<T extends GeneratorSubroutine> = ClientGeneratorStub<T> & {
  /**
   * Creates a new stub with options.
   *
   * @param {AbortSignal} init.signal - Abort signal to abort the call to the stub.
   * @param {Transferable[]} init.transfer - Transfer ownership of objects specified in `args`.
   */
  withOptions: (init: CallInit) => ClientGeneratorStub<T>;
};

type ServerStub<T extends GeneratorSubroutine> = (...args: Parameters<T>) => ReturnType<T>;

/**
 * Binds a generator function to a `MessagePort` in RPC fashion and/or create a RPC function stub connected to a `MessagePort`.
 *
 * In a traditional RPC setting:
 *
 * - server should call this generator function with `fn` argument, the returned function should be ignored;
 * - client should call this generator function without `fn` argument, the returned function is the stub to call the server.
 *
 * This function supports bidirectional RPC when both sides are passing the `fn` argument.
 *
 * When calling the returned function stub, the arguments and return value are transferred over `MessagePort`.
 * Thus, they will be cloned by the underlying structured clone algorithm.
 *
 * The returned stub has a variant `withOptions` for passing transferables and abort signal.
 *
 * Notes: if `next()` is used on the client stub and did not iterate until `{ done: true }`, caller must use the `withOptions({ signal: AbortSignal })`
 * to release resources.
 *
 * @param {MessagePort} port - The `MessagePort` object to send the calls. The underlying `MessageChannel` must be exclusively used by this function only.
 * @param {Function} fn - The generator function to invoke. If not set, this RPC cannot be invoked by the other side of `MessagePort`.
 *
 * @returns An asynchronous generator function, when called, will invoke the generator function on the other side of `MessagePort`.
 */
export default function forGenerator<C extends GeneratorSubroutine>(port: MessagePort): ClientGeneratorStubWithExtra<C>;

export default function forGenerator<C extends GeneratorSubroutine, S extends GeneratorSubroutine = C>(
  port: MessagePort,
  fn: ServerStub<S>
): ClientGeneratorStubWithExtra<C>;

export default function forGenerator<C extends GeneratorSubroutine, S extends GeneratorSubroutine = C>(
  port: MessagePort,
  fn: ServerStub<S>,
  options: { signal: AbortSignal }
): ClientGeneratorStubWithExtra<C>;

export default function forGenerator<C extends GeneratorSubroutine, S extends GeneratorSubroutine = C>(
  port: MessagePort,
  fn?: ServerStub<S>
): ClientGeneratorStubWithExtra<C> {
  // We cannot neuter the input port because it would cause memory leak:
  // - We can neuter a port by passing it through Structured Clone Algorithm so the input port will become non-functional
  // - After a port is neutered, closing the neutered port will not close the cloned port
  // - Thus, the port owner will no longer able to close the port
  // - This defeated our philosophy: whoever pass a resources to a function, should own the resources unless it is intentional and no other workarounds

  type ClientSubroutineParameters = Parameters<C>;
  type ClientSubroutineYield = YieldOfGenerator<ReturnType<C>>;
  type ClientSubroutineReturn = ReturnOfGenerator<ReturnType<C>>;
  type ClientSubroutineNext = NextOfGenerator<ReturnType<C>>;
  type ClientSubroutineIteratorResult = IteratorResult<ClientSubroutineYield, ClientSubroutineReturn>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessage = (event: MessageEvent<RPCGeneratorGenerateMessage<S>>): void => {
    const data = event.data as RPCGeneratorGenerateMessage<S> | undefined;

    if (Array.isArray(data) && data[0] === GENERATE) {
      event.stopImmediatePropagation();

      if (!fn) {
        throw new Error(
          'No function was registered on this RPC. This is probably calling a client which do not implement the function.'
        );
      }

      const [_, messagePorts, ...args] = data;

      const generator = fn(...args);

      const serverClosePorts = () => {
        messagePorts.asyncDispose.close();
        messagePorts.next.close();
        messagePorts.return.close();
        messagePorts.throw.close();
      };

      messagePortRPC(messagePorts.next, async (...args: ClientSubroutineNext) => {
        const result = await generator.next(...args);

        // Automatically close server ports when iteration is done.
        // Client will fake the next()/return()/throw() output after iteration is done.
        result.done && serverClosePorts();

        return result;
      });

      // This is a slight deviation from the actual `Iterator`.
      // In the original approach, `Iterator.return` is not defined.
      // In our approach, the client stub does not know if the server stub has `Iterator.return` defined or not, instead, we simply return `{ done: true }`.
      messagePortRPC(messagePorts.return, async value => {
        return (await generator.return?.(value)) ?? { done: true };
      });

      messagePortRPC(messagePorts.throw, async error => {
        return (await generator.throw?.(error)) ?? Promise.reject(error);
      });

      messagePortRPC(messagePorts.asyncDispose, async (): Promise<void> => {
        try {
          const symbolAsyncDispose: typeof Symbol.asyncDispose =
            Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose');
          const symbolDispose: typeof Symbol.dispose = Symbol.dispose || Symbol.for('Symbol.dispose');

          symbolAsyncDispose in generator
            ? await generator[symbolAsyncDispose]()
            : symbolDispose in generator && generator[symbolDispose]();
        } finally {
          serverClosePorts();
        }
      });
    }
  };

  port.addEventListener('message', handleMessage);
  port.start();

  const createWithOptions = (
    init: CallInit
  ): ((
    ...args: ClientSubroutineParameters
  ) => AsyncGenerator<ClientSubroutineYield, ClientSubroutineReturn, ClientSubroutineNext>) => {
    return (...args: ClientSubroutineParameters) => {
      const { port1: asyncDisposePort1, port2: asyncDisposePort2 } = new MessageChannel();
      const { port1: nextPort1, port2: nextPort2 } = new MessageChannel();
      const { port1: returnPort1, port2: returnPort2 } = new MessageChannel();
      const { port1: throwPort1, port2: throwPort2 } = new MessageChannel();

      const subInit = { signal: init.signal };

      const asyncDisposeRPC = messagePortRPC<() => void>(asyncDisposePort1).withOptions(subInit);

      const nextRPC =
        messagePortRPC<(next: ClientSubroutineNext | void) => ClientSubroutineIteratorResult>(nextPort1).withOptions(
          subInit
        );

      const returnRPC =
        messagePortRPC<(returnValue: ClientSubroutineReturn) => ClientSubroutineIteratorResult>(
          returnPort1
        ).withOptions(subInit);

      const throwRPC =
        messagePortRPC<(error: unknown) => ClientSubroutineIteratorResult>(throwPort1).withOptions(subInit);

      const callAsyncDispose = async (disposeReason: ClientDisposeReason) => {
        if (isDone(false)) {
          return;
        }

        // AsyncDispose has never been called.
        if (disposeReason === 'abort' || disposeReason === 'dispose') {
          // Only call server for AsyncDispose if the user intentionally abort or dispose.
          // Otherwise, the server-side object should have already disposed due to "done" and "error".
          await asyncDisposeRPC();
        }

        if (disposeReason === 'done') {
          isDone = () => true;
        } else {
          disposeReason satisfies 'abort' | 'dispose';

          isDone = (throwOnDispose = true) => {
            if (throwOnDispose === true) {
              // Already disposed, the MessagePort are all closed, return previous result.
              throw new Error('This generator has been disposed.');
            }

            return true;
          };
        }

        asyncDisposePort1.close();
        asyncDisposePort2.close();
        nextPort1.close();
        nextPort2.close();
        returnPort1.close();
        returnPort2.close();
        throwPort1.close();
        throwPort2.close();
      };

      let isDone: (throwOnDispose?: boolean | undefined) => boolean = () => false;

      const generator: AsyncGenerator<ClientSubroutineYield, ClientSubroutineReturn, ClientSubroutineNext> = {
        next: async (value: NextOfGenerator<ReturnType<C>> | void) => {
          if (isDone()) {
            // Return type of any generators should allow `undefined`.
            // For example, after the generator is exhausted, the return value will be `undefined`.
            return { done: true, value: undefined } satisfies IteratorReturnResult<undefined> as any;
          }

          const result = await nextRPC(value);

          if (result.done) {
            await callAsyncDispose('done');
          }

          return result;
        },
        return: async (value: ReturnOfGenerator<ReturnType<C>>) => {
          if (isDone()) {
            return { done: true, value };
          }

          return await returnRPC(value);
        },
        throw: async (error: unknown) => {
          if (isDone()) {
            throw error;
          }

          return await throwRPC(error);
        },
        // Ponyfills for Symbol.asyncDispose
        [Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose')]: async () => {
          await callAsyncDispose('dispose');
        },
        [Symbol.asyncIterator]: () => generator
      };

      port.postMessage(
        [
          GENERATE,
          { asyncDispose: asyncDisposePort2, next: nextPort2, return: returnPort2, throw: throwPort2 },
          ...args
        ] satisfies RPCGeneratorGenerateMessage<C>,
        [...(init.transfer || []), asyncDisposePort2, nextPort2, returnPort2, throwPort2]
      );

      init.signal?.addEventListener('abort', () => callAsyncDispose('abort').catch(() => {}), { once: true });

      return generator;
    };
  };

  const stub = createWithOptions({}) as ClientGeneratorStubWithExtra<C>;

  stub.withOptions = createWithOptions;

  return stub;
}
