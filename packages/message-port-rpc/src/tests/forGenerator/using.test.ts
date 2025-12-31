import { describeEach } from '@compulim/test-harness/describeEach';
import { expect } from 'expect';
import { afterEach, beforeEach, describe, mock, test, type Mock } from 'node:test';
import forGenerator from '../../forGenerator.ts';

type Fn = () => AsyncGenerator<string, void, boolean> | Generator<string, void, boolean>;

let fn: Mock<Fn>;
let port1: MessagePort;
let port2: MessagePort;
let rpc: ReturnType<typeof forGenerator<Fn>>;

beforeEach(async () => {
  ({ port1, port2 } = new MessageChannel());

  fn = mock.fn<Fn>();

  forGenerator<Fn>(port2, fn);
  rpc = forGenerator<Fn>(port1);
});

afterEach(() => {
  port1?.close();
  port2?.close();
});

describeEach<['async generator' | 'generator']>([['async generator' as const], ['generator' as const]])(
  'with %s',
  type => {
    let mockAsyncDispose: Mock<() => Promise<void>>;

    beforeEach(async () => {
      mockAsyncDispose = mock.fn();
      mockAsyncDispose.mock.mockImplementationOnce(() => Promise.resolve());

      fn.mock.mockImplementationOnce(() => {
        if (type === 'async generator') {
          const generator = (async function* () {
            yield 'Hello, World!';
          })();

          generator[Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose')] = mockAsyncDispose;
          generator[(Symbol.dispose || Symbol.for('Symbol.dispose')) as unknown as typeof Symbol.asyncDispose] = () => {
            throw new Error('Should not call dispose() while asyncDispose() is present.');
          };

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
    });

    describe('when iterate with using', () => {
      let result: IteratorResult<string, void>;

      beforeEach(async () => {
        await using generator = rpc.withOptions({})();

        result = await generator.next();
      });

      test('should return value', () => expect(result).toEqual({ done: false, value: 'Hello, World!' }));
      test('should have called dispose', () => expect(mockAsyncDispose.mock.callCount()).toBe(1));
    });
  }
);

describe('assumptions', () => {
  let fn: Mock<(value: string) => void>;

  beforeEach(() => {
    fn = mock.fn();
  });

  test('for await using operator, asyncDispose() is preferred over dispose()', () => {
    (async () => {
      await using _disposable = {
        [Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose')]: () => Promise.resolve(fn('asyncDispose')),
        [Symbol.dispose || Symbol.for('Symbol.dispose')]: () => fn('dispose')
      };
    })();

    expect(fn.mock.callCount()).toBe(1);
    expect(fn.mock.calls[0]?.arguments).toEqual(['asyncDispose']);
  });

  test('for using operator, dispose() is preferred over asyncDispose()', () => {
    (() => {
      using _disposable = {
        [Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose')]: () => Promise.resolve(fn('asyncDispose')),
        [Symbol.dispose || Symbol.for('Symbol.dispose')]: () => fn('dispose')
      };
    })();

    expect(fn.mock.callCount()).toBe(1);
    expect(fn.mock.calls[0]?.arguments).toEqual(['dispose']);
  });

  test('for await using operator, asyncDispose() will be called', () => {
    (async () => {
      await using _disposable = {
        [Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose')]: () => Promise.resolve(fn('asyncDispose'))
      };
    })();

    expect(fn.mock.callCount()).toBe(1);
    expect(fn.mock.calls[0]?.arguments).toEqual(['asyncDispose']);
  });

  test('for await using operator, dispose() will be called', () => {
    (async () => {
      await using _disposable = { [Symbol.dispose || Symbol.for('Symbol.dispose')]: () => fn('dispose') };
    })();

    expect(fn.mock.callCount()).toBe(1);
    expect(fn.mock.calls[0]?.arguments).toEqual(['dispose']);
  });

  test('for using operator, dispose() will be called', () => {
    (() => {
      using _disposable = { [Symbol.dispose || Symbol.for('Symbol.dispose')]: () => fn('dispose') };
    })();

    expect(fn.mock.callCount()).toBe(1);
    expect(fn.mock.calls[0]?.arguments).toEqual(['dispose']);
  });
});
