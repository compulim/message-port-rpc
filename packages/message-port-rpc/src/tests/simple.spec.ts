import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { waitFor } from '@testduet/wait-for';

import messagePortRPC from '../messagePortRPC';

// The following is for copying to our bug.yml.
describe('simple', () => {
  type Fn = (x: number, y: number) => number;

  let fn: jest.Mock<Fn>;
  let port1: MessagePort;
  let port2: MessagePort;
  let rpc: ReturnType<typeof messagePortRPC<Fn>>;

  // GIVEN: Stub to perform summation.
  beforeEach(async () => {
    ({ port1, port2 } = new MessageChannel());

    fn = jest.fn<Fn>((x, y) => x + y);

    messagePortRPC<Fn>(port1, fn);
    rpc = messagePortRPC<Fn>(port2);
  });

  afterEach(() => {
    port1?.close();
    port2?.close();
  });

  describe('when called with 1 and 2', () => {
    let promise: Promise<number>;

    // WHEN: Called with 1 and 2.
    beforeEach(() => {
      promise = rpc(1, 2);
    });

    // THEN: Should have called the server stub.
    test('should call the server stub', () => waitFor(() => expect(fn).toHaveBeenCalledTimes(1)));

    // THEN: Should return 3.
    test('should resolve 3', () => waitFor(() => expect(promise).resolves.toBe(3)));
  });
});
