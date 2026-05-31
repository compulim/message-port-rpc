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
      .given('a generate function', () => ({
        generate: async function* generate() {
          yield 1;

          return 2;
        }
      }))
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
        expect(value).toEqual({ done: false, value: 1 });
      })
      .when('generator.next() is called', async ({ generator }) => {
        return await generator.next();
      })
      .then('should return 2', (_, value) => {
        expect(value).toEqual({ done: true, value: 2 });
      })
      .when('generator.return() is called', async ({ generator }) => {
        try {
          await generator.throw(new Error('Artificial'));

          return;
        } catch (error) {
          return error;
        }
      })
      .then('should return the return value', (_, value) => {
        expect(value).toEqual(expect.any(Error));
        expect(value).toHaveProperty('message', 'Artificial');
      })
      .when('generator.next() is called again', async ({ generator }) => {
        return await generator.next();
      })
      .then('should return undefined', (_, value) => {
        expect(value).toEqual({ done: true });
      });
  },
  NodeTest
);
