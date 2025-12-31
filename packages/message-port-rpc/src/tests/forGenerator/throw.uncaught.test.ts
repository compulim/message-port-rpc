import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { afterEach, beforeEach, describe, mock, test, type Mock } from 'node:test';
import forGenerator from '../../forGenerator.ts';

type Fn = (object: Record<string, string>) => Generator<string, number, boolean>;
type NextFn = (value: boolean) => void;

let abortController: AbortController;
let catchFn: Mock<(error: unknown) => void>;
let fn: Mock<Fn>;
let finallyFn: Mock<() => void>;
let initFn: Mock<() => void>;
let nextFn: Mock<NextFn>;
let port1: MessagePort;
let port2: MessagePort;
let rpc: ReturnType<typeof forGenerator<Fn>>;

beforeEach(async () => {
  ({ port1, port2 } = new MessageChannel());

  abortController = new AbortController();
  catchFn = mock.fn<(error: unknown) => void>();
  finallyFn = mock.fn();
  fn = mock.fn<Fn>();
  initFn = mock.fn();
  nextFn = mock.fn<NextFn>();

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
    fn.mock.mockImplementationOnce(function* () {
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

    await waitFor(() => expect(fn.mock.callCount()).toBe(1));
  });

  test('should generate with arguments', () => expect(fn.mock.calls[0]?.arguments).toEqual([{ hello: 'World!' }]));
  test('should not call fn()', () => expect(initFn.mock.callCount()).toBe(0));

  describe('next() for the first time', () => {
    let result: IteratorResult<string, number>;

    beforeEach(async () => {
      result = await generator.next();
    });

    test('should call fn()', () => expect(initFn.mock.callCount()).toBe(1));
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
