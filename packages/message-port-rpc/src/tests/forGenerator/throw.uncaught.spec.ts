import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { waitFor } from '@testduet/wait-for';

import forGenerator from '../../forGenerator';

type Fn = (object: Record<string, string>) => Generator<string, number, boolean>;
type NextFn = (value: boolean) => void;

let abortController: AbortController;
let catchFn: jest.Mock<(error: unknown) => void>;
let fn: jest.Mock<Fn>;
let finallyFn: jest.Mock<() => void>;
let initFn: jest.Mock<() => void>;
let nextFn: jest.Mock<NextFn>;
let port1: MessagePort;
let port2: MessagePort;
let rpc: ReturnType<typeof forGenerator<Fn>>;

beforeEach(async () => {
  ({ port1, port2 } = new MessageChannel());

  abortController = new AbortController();
  catchFn = jest.fn<(error: unknown) => void>();
  finallyFn = jest.fn();
  fn = jest.fn<Fn>();
  initFn = jest.fn();
  nextFn = jest.fn<NextFn>();

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
    fn.mockImplementationOnce(function* () {
      try {
        initFn();

        nextFn(yield 'one');
        nextFn(yield 'two');
        nextFn(yield 'three');

        return 1;
      } catch (error) {
        catchFn(error);

        throw error;
      } finally {
        finallyFn();
      }
    });

    generator = rpc.withOptions({ signal: abortController.signal })({ hello: 'World!' });

    await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
  });

  test('should generate with arguments', () => expect(fn).toHaveBeenNthCalledWith(1, { hello: 'World!' }));
  test('should not call fn()', () => expect(initFn).toHaveBeenCalledTimes(0));

  describe('next() for the first time', () => {
    let result: IteratorResult<string, number>;

    beforeEach(async () => {
      result = await generator.next();
    });

    test('should call fn()', () => expect(initFn).toHaveBeenCalledTimes(1));
    test('should return "one"', () => expect(result).toEqual({ done: false, value: 'one' }));

    describe('throw()', () => {
      let promise: Promise<unknown>;

      beforeEach(() => {
        promise = generator.throw(new Error('Aloha!'));
        promise.catch(() => {});
      });

      test('should throw', () => expect(() => promise).rejects.toThrow('Aloha!'));
    });
  });
});
