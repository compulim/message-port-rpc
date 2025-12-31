import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { afterEach, beforeEach, describe, mock, test, type Mock } from 'node:test';
import forGenerator from '../../forGenerator.ts';

type Fn = (object: Record<string, string>) => Generator<string, number, boolean>;

let abortController: AbortController;
let fn: Mock<Fn>;
let initFn: Mock<() => void>;
let port1: MessagePort;
let port2: MessagePort;
let rpc: ReturnType<typeof forGenerator<Fn>>;

beforeEach(async () => {
  ({ port1, port2 } = new MessageChannel());

  abortController = new AbortController();
  fn = mock.fn<Fn>();
  initFn = mock.fn();

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
    fn.mock.mockImplementationOnce(function* () {
      throw new Error('Hello, World!');
    });

    generator = rpc.withOptions({ signal: abortController.signal })({ hello: 'World!' });

    await waitFor(() => expect(fn.mock.callCount()).toBe(1));
  });

  test('should generate with arguments', () => expect(fn.mock.calls[0]?.arguments).toEqual([{ hello: 'World!' }]));
  test('should not call fn()', () => expect(initFn.mock.callCount()).toBe(0));

  describe('next() for the first time', () => {
    let promise: Promise<unknown>;

    beforeEach(() => {
      promise = generator.next();
      promise.catch(() => {});
    });

    test('should throw', () => expect(() => promise).rejects.toThrow('Hello, World!'));
  });
});
