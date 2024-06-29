const { expect } = require('expect');
const { messagePortRPC } = require('message-port-rpc');

describe('simple scenario', () => {
  let port1, port2;

  beforeEach(() => {
    ({ port1, port2 } = new MessageChannel());
  });

  afterEach(() => {
    port1.close();
    port2.close();
  });

  it('should work', async () => {
    const clientStub = messagePortRPC(port1);

    messagePortRPC(port2, (x, y) => Promise.resolve(x + y));

    await expect(clientStub(1, 2)).resolves.toBe(3);
  });
});
