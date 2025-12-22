import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { waitFor } from '@testduet/wait-for';

import forGenerator from '../../forGenerator';

type Fn = (object: Record<string, string>) => Generator<string, number, boolean>;
type NextFn = (value: boolean) => void;

let abortController: AbortController;
let finallyFn: jest.Mock<() => void>;
let fn: jest.Mock<Fn>;
let initFn: jest.Mock<() => void>;
let nextFn: jest.Mock<NextFn>;
let port1: MessagePort;
let port2: MessagePort;
let rpc: ReturnType<typeof forGenerator<Fn>>;

beforeEach(async () => {
  ({ port1, port2 } = new MessageChannel());

  abortController = new AbortController();
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
      } finally {
        finallyFn();
      }
    });

    generator = rpc.withOptions({ signal: abortController.signal })({ hello: 'World!' });

    await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
  });

  test('should generate with arguments', () => expect(fn).toHaveBeenNthCalledWith(1, { hello: 'World!' }));
  test('should not call initFn()', () => expect(initFn).toHaveBeenCalledTimes(0));

  describe('next() for the first time', () => {
    let result: IteratorResult<string, number>;

    beforeEach(async () => {
      result = await generator.next();
    });

    test('should call fn()', () => expect(initFn).toHaveBeenCalledTimes(1));
    test('should return "one"', () => expect(result).toEqual({ done: false, value: 'one' }));

    describe('next() for the second time', () => {
      beforeEach(async () => {
        result = await generator.next(true);
      });

      describe('should call yieldFn()', () => {
        test('once', () => expect(nextFn).toHaveBeenCalledTimes(1));
        test('with argument', () => expect(nextFn).toHaveBeenNthCalledWith(1, true));
      });

      test('should return "two"', () => expect(result).toEqual({ done: false, value: 'two' }));

      describe('next() for the third time', () => {
        beforeEach(async () => {
          result = await generator.next(false);
        });

        describe('should call yieldFn()', () => {
          test('twice', () => expect(nextFn).toHaveBeenCalledTimes(2));
          test('with argument', () => expect(nextFn).toHaveBeenNthCalledWith(2, false));
        });

        test('should return "three"', () => expect(result).toEqual({ done: false, value: 'three' }));

        describe('next() for the fourth time', () => {
          beforeEach(async () => {
            result = await generator.next(true);
          });

          describe('should call yieldFn()', () => {
            test('three times', () => expect(nextFn).toHaveBeenCalledTimes(3));
            test('with argument', () => expect(nextFn).toHaveBeenNthCalledWith(3, true));
          });

          test('should return done', () => expect(result).toEqual({ done: true, value: 1 }));
          test('should reach finally block', () => expect(finallyFn).toHaveBeenCalledTimes(1));

          describe('next() for the fifth time', () => {
            beforeEach(async () => {
              result = await generator.next(true);
            });

            test('should call yieldFn() three times', () => expect(nextFn).toHaveBeenCalledTimes(3));
            test('should return done again', () => expect(result).toEqual({ done: true, value: undefined }));
          });
        });
      });
    });
  });
});
