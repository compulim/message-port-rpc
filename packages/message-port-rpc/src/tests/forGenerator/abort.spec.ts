import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import waitFor from '../../../__tests__/__setup__/waitFor';
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
  port1.close();
  port2.close();

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

    await waitFor(() => expect(fn).toBeCalledTimes(1));
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

    describe('when abort', () => {
      beforeEach(() => abortController.abort());

      test('should throw on next()', () =>
        expect(() => generator.next()).rejects.toThrow('This generator has been aborted.'));
      test('should throw on return()', () =>
        expect(() => generator.return(0)).rejects.toThrow('This generator has been aborted.'));
      test('should throw on throw()', () =>
        expect(() => generator.throw(new Error('Something else.'))).rejects.toThrow(
          'This generator has been aborted.'
        ));
    });
  });
});
