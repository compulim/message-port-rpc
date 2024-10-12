import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import forGenerator from '../../forGenerator';

type Fn = () => AsyncGenerator<string, void, boolean> | Generator<string, void, boolean>;

let abortController: AbortController;
let fn: jest.Mock<Fn>;
let port1: MessagePort;
let port2: MessagePort;
let rpc: ReturnType<typeof forGenerator<Fn>>;

beforeEach(async () => {
  ({ port1, port2 } = new MessageChannel());

  abortController = new AbortController();
  fn = jest.fn<Fn>();

  forGenerator<Fn>(port2, fn);
  rpc = forGenerator<Fn>(port1);
});

afterEach(() => {
  port1?.close();
  port2?.close();

  abortController.abort();
});

describe.each([['async generator' as const], ['generator' as const]])('with %s', type => {
  let generator: AsyncGenerator<string, void, boolean>;
  let mockAsyncDispose: jest.Mock<() => Promise<void>>;

  beforeEach(async () => {
    mockAsyncDispose = jest.fn();
    mockAsyncDispose.mockImplementationOnce(() => Promise.resolve());

    fn.mockImplementationOnce(() => {
      if (type === 'async generator') {
        const generator = (async function* () {
          yield 'Hello, World!';
        })();

        generator[Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose')] = mockAsyncDispose;

        return generator;
      } else {
        const generator = (function* () {
          yield 'Hello, World!';
        })();

        // When Symbol.dispose() is being called, will automatically call Symbol.asyncDispose() as well.
        generator[Symbol.dispose || Symbol.for('Symbol.dispose')] = mockAsyncDispose;

        return generator;
      }
    });

    generator = rpc.withOptions({ signal: abortController.signal })();
  });

  describe('when iterate for the first time', () => {
    let result: IteratorResult<string, void>;

    beforeEach(async () => {
      result = await generator.next();
    });

    test('should return value', () => expect(result).toEqual({ done: false, value: 'Hello, World!' }));

    describe('when generator is disposed', () => {
      beforeEach(async () => {
        const symbolAsyncDispose: typeof Symbol.asyncDispose = Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose');

        if (symbolAsyncDispose in generator) {
          const dispose = generator[symbolAsyncDispose];

          typeof dispose === 'function' && (await dispose());
        }
      });

      test.only('should call dispose', () => expect(mockAsyncDispose).toHaveBeenCalledTimes(1));
      test('should throw on next()', () =>
        expect(() => generator.next()).rejects.toThrow('This generator has been disposed.'));
      test('should throw on return()', () =>
        expect(() => generator.return()).rejects.toThrow('This generator has been disposed.'));
      test('should throw on throw()', () =>
        expect(() => generator.throw(new Error('Something else.'))).rejects.toThrow(
          'This generator has been disposed.'
        ));
    });
  });
});
