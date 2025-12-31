import { expect } from 'expect';
import { afterEach, beforeEach, describe, mock, test, type Mock } from 'node:test';
import messagePortRPC from '../messagePortRPC.ts';

describe('assymetric functions', () => {
  type Fn1 = (value: number) => string;
  type Fn2 = (value: string) => number;

  let fn1: Mock<Fn1>;
  let fn2: Mock<Fn2>;
  let port1: MessagePort;
  let port2: MessagePort;
  let rpc1: ReturnType<typeof messagePortRPC<Fn2, Fn1>>;
  let rpc2: ReturnType<typeof messagePortRPC<Fn1, Fn2>>;

  beforeEach(() => {
    ({ port1, port2 } = new MessageChannel());

    fn1 = mock.fn<(value: number) => string>(value => '' + value);
    fn2 = mock.fn<(value: string) => number>(value => +value);

    // TODO: Verify typing.
    rpc1 = messagePortRPC<Fn2, Fn1>(port1, fn1);
    rpc2 = messagePortRPC<Fn1, Fn2>(port2, fn2);
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  test('port 1 -> port 2: call', async () => {
    await expect(rpc1('123')).resolves.toBe(123);
  });

  test('port 2 -> port 1: call', async () => {
    await expect(rpc2(123)).resolves.toBe('123');
  });
});
