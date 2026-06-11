import NodeTest from 'node:test';
import messagePortRPC from '../messagePortRPC.ts';
import { scenario } from '@testduet/given-when-then';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import expect from 'expect';
import { waitFor } from '@testduet/wait-for';

scenario(
  relative(process.cwd(), fileURLToPath(import.meta.url)),
  bdd => {
    bdd
      .given(
        'client stub which send MessagePort',
        () => {
          const { port1, port2 } = new MessageChannel();
          const { port1: innerPort1, port2: innerPort2 } = new MessageChannel();
          const messages: unknown[] = [];

          messagePortRPC<(messagePort: MessagePort) => void>(port1, innerPort => {
            innerPort.addEventListener('message', ({ data }) => messages.push(data));
            innerPort.start();
          });

          innerPort2.postMessage('Hello, World!');

          const teardown = () => {
            port1.close();
            port2.close();
            innerPort1.close();
            innerPort2.close();
          };

          const client = messagePortRPC<(messagePort: MessagePort) => void>(port2);

          return { client, innerPort1, messages, teardown };
        },
        ({ teardown }) => teardown()
      )
      .when('client stub is called', async ({ client, innerPort1 }) => {
        return await client(innerPort1);
      })
      .then('should send the MessagePort and calling the inner MessagePort should work', async ({ messages }) => {
        await waitFor(() => expect(messages).toEqual(['Hello, World!']));
      });
  },
  NodeTest
);
