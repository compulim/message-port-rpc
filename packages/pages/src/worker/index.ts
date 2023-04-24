import { messagePortRPC } from 'message-port-rpc';

type Fn = (x: number, y: number) => Promise<number>;

addEventListener('message', ({ ports }) => {
  messagePortRPC<Fn>(ports[0], (x, y) => Promise.resolve(x + y));
});
