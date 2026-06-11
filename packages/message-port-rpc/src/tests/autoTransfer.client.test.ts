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
        'server stub which send MessagePort',
        () => {
          const { port1, port2 } = new MessageChannel();
          const { port1: innerPort1, port2: innerPort2 } = new MessageChannel();
          const messages: unknown[] = [];

          messagePortRPC(port1, () => innerPort1);

          innerPort2.addEventListener('message', ({ data }) => messages.push(data));
          innerPort2.start();

          const teardown = () => {
            port1.close();
            port2.close();
            innerPort1.close();
            innerPort2.close();
          };

          const client = messagePortRPC<() => MessagePort>(port2);

          return { client, messages, teardown };
        },
        ({ teardown }) => teardown()
      )
      .when('client stub is called', async ({ client }) => {
        return await client();
      })
      .then('should return a MessagePort', (_, messagePort) => {
        expect(messagePort).toEqual(expect.any(MessagePort));
      })
      .and('calling the inner MessagePort should work', async ({ messages }, messagePort) => {
        messagePort.postMessage('Hello, World!');

        await waitFor(() => expect(messages).toEqual(['Hello, World!']));
      });
  },
  NodeTest
);
