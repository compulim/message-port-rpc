import { scenario } from '@testduet/given-when-then';
import { expect } from 'expect';
import * as NodeTest from 'node:test';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import forGenerator from '../../../forGenerator.ts';
import createIsolatedMessageChannel from '../../private/createIsolatedMessageChannel.ts';

scenario(
  relative(process.cwd(), fileURLToPath(import.meta.url)),
  bdd => {
    bdd
      .given('a generate function', () => {
        let finalized = false;

        return {
          generate: async function* generate() {
            try {
              yield 1;
              yield 2;
              yield 3;
            } finally {
              finalized = true;
            }
          },
          getFinalized: () => finalized
        };
      })
      .and.oneOf<{
        readonly generator: AsyncGenerator<number, unknown, unknown>;
        readonly getFinalized: () => boolean;
        readonly messageChannel?: MessageChannel | undefined;
      }>([
        [
          'a stub generator',
          precondition => {
            const messageChannel = createIsolatedMessageChannel();

            forGenerator(messageChannel.port1, precondition.generate);

            const clientStub = forGenerator<typeof precondition.generate>(messageChannel.port2);
            const generator = clientStub();

            return { ...precondition, generator, messageChannel };
          },
          async ({ generator, messageChannel }) => {
            await generator[Symbol.asyncDispose]();

            messageChannel!.port1.close();
            messageChannel!.port2.close();
          }
        ],
        [
          'a real generator',
          precondition => ({
            ...precondition,
            generator: precondition.generate()
          })
        ]
      ])
      .when('for-of loop is break after first iteration', async ({ generator }) => {
        for await (const _ of generator) {
          break;
        }
      })
      .then('should run finally', ({ getFinalized }) => {
        expect(getFinalized()).toBe(true);
      });
  },
  NodeTest
);
