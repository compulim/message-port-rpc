import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import waitFor from '../../../__tests__/__setup__/waitFor';
import forGenerator from '../../forGenerator';

type Fn = (object: Record<string, string>) => Generator<string, number, boolean>;

let abortController: AbortController;
let fn: jest.Mock<Fn>;
let initFn: jest.Mock<() => void>;
let port1: MessagePort;
let port2: MessagePort;
let rpc: ReturnType<typeof forGenerator<Fn>>;

beforeEach(async () => {
  ({ port1, port2 } = new MessageChannel());

  abortController = new AbortController();
  fn = jest.fn<Fn>();
  initFn = jest.fn();

  forGenerator<Fn>(port2, fn);
  rpc = forGenerator<Fn>(port1);
});

afterEach(() => {
  port1?.close();
  port2?.close();

  abortController.abort();
});

describe('when iterating', () => {
  let generator: AsyncGenerator<string, number, boolean>;

  beforeEach(async () => {
    // eslint-disable-next-line require-yield
    fn.mockImplementationOnce(function* () {
      throw new Error('Hello, World!');
    });

    generator = rpc.withOptions({ signal: abortController.signal })({ hello: 'World!' });

    await waitFor(() => expect(fn).toBeCalledTimes(1));
  });

  test('should generate with arguments', () => expect(fn).toHaveBeenNthCalledWith(1, { hello: 'World!' }));
  test('should not call fn()', () => expect(initFn).toHaveBeenCalledTimes(0));

  describe('next() for the first time', () => {
    let promise: Promise<unknown>;

    beforeEach(() => {
      promise = generator.next();
      promise.catch(() => {});
    });

    test('should throw', () => expect(() => promise).rejects.toThrow('Hello, World!'));
  });
});
