import { scenario } from '@testduet/given-when-then';
import { expect } from 'expect';
import { relative } from 'node:path';
import * as NodeTest from 'node:test';
import { fileURLToPath } from 'node:url';
import forGenerator from '../../../forGenerator.ts';
import createIsolatedMessageChannel from '../../private/createIsolatedMessageChannel.ts';

scenario(
  relative(process.cwd(), fileURLToPath(import.meta.url)),
  bdd => {
    bdd
      .given('a generate function', () => {
        return {
          // eslint-disable-next-line require-yield
          generate: async function* generate() {
            return 1;
          }
        };
      })
      .and.oneOf<{
        readonly generator: AsyncGenerator<number, unknown, unknown>;
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
      .when('generator.next() is called', async ({ generator }) => {
        return await generator.next();
      })
      .then('should return 1', (_, value) => {
        expect(value).toEqual({ done: true, value: 1 });
      })
      .when('generator.next() is called', async ({ generator }) => {
        return await generator.next();
      })
      .then('should return done', (_, value) => {
        expect(value).toEqual({ done: true });
      });
  },
  NodeTest
);
