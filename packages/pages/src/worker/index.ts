import { messagePortRPC } from 'message-port-rpc';

type Fn = (x: number, y: number) => Promise<number>;

addEventListener('message', ({ ports }) => {
  const [firstPort] = ports;

  if (!firstPort) {
    throw new Error('Handshake message must contains a port.');
  }

  messagePortRPC<Fn>(firstPort, (x, y) => Promise.resolve(x + y));
});
