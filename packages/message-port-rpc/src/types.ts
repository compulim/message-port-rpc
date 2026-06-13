// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Subroutine = (...args: any[]) => Promise<unknown> | unknown;

type CallInit = {
  signal?: AbortSignal | undefined;
};

// Regardless whether T returns Promise or not, the client stub must return Promise.
type ClientStub_<T extends Subroutine> = (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>;

type ClientStub<T extends Subroutine> = ClientStub_<T> & {
  /**
   * Creates a new stub with options.
   *
   * @param {AbortSignal} init.signal - Abort signal to abort the call to the stub.
   */
  withOptions: (init: CallInit) => ClientStub_<T>;
};

type ServerStub<T extends Subroutine> = (this: { signal: AbortSignal }, ...args: Parameters<T>) => ReturnType<T>;

export type { CallInit, ClientStub_, ClientStub, ServerStub, Subroutine };
