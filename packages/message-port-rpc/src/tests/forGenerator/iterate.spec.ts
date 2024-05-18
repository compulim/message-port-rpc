import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import forGenerator from '../../forGenerator';

type Fn = (object: unknown) => Iterator<number>;

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
});

describe('when iterating', () => {
  let iterator: AsyncIterableIterator<number>;
  let values: number[];

  beforeEach(async () => {
    fn.mockImplementationOnce(() => [1, 2, 3].values());
    iterator = rpc.withOptions({ signal: abortController.signal })({ hello: 'World!' });

    values = [];

    for await (const value of iterator) {
      values.push(value);
    }
  });

  test('should initialize with arguments', () => expect(fn).toHaveBeenNthCalledWith(1, { hello: 'World!' }));
  test('should have iterated all values', () => expect(values).toEqual([1, 2, 3]));
});
