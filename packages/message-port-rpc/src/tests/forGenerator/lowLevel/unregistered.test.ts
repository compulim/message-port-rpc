import { scenario } from '@testduet/given-when-then';
import { expect } from 'expect';
import { spyOn } from 'jest-mock';
import { relative } from 'node:path';
import * as NodeTest from 'node:test';
import { fileURLToPath } from 'node:url';
import forGenerator from '../../../forGenerator.ts';
import createIsolatedMessageChannel from '../../private/createIsolatedMessageChannel.ts';
import { waitFor } from '@testduet/wait-for';

scenario(
  relative(process.cwd(), fileURLToPath(import.meta.url)),
  bdd => {
    bdd
      .given(
        'a client stub connect to another client stub',
        () => {
          // const { port1, port2 } = createIsolatedMessageChannel();
          const { port1, port2 } = new MessageChannel();

          return {
            clientStub1: forGenerator(port1),
            clientStub2: forGenerator(port2),
            port1,
            port2
          };
        },
        ({ port1, port2 }) => {
          port1.close();
          port2.close();
        }
      )
      .and('spy of console.warn', precondition => ({ ...precondition, warn: spyOn(console, 'warn') }))
      .when('the client stub is called', async ({ clientStub1 }) => {
        await clientStub1();
      })
      .then('should warn', async ({ warn }) => {
        await waitFor(() => {
          expect(warn).toHaveBeenCalledTimes(1);
          expect(warn).toHaveBeenNthCalledWith(
            1,
            '`message-port-rpc`: No function was registered on this RPC. This is probably calling a client which do not implement the function.'
          );
        });
      });
  },
  NodeTest
);
