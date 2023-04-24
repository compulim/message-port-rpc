type Deferred<T = void> = {
  promise: Promise<T>;
  reject: (reason: unknown) => void;
  resolve: (value: T) => void;
};

export default function createDeferred<T = void>(): Deferred<T> {
  const deferred: Partial<Deferred<T>> = {};

  deferred.promise = new Promise((resolve, reject) => {
    deferred.reject = reject;
    deferred.resolve = resolve;
  });

  return deferred as Deferred<T>;
}
