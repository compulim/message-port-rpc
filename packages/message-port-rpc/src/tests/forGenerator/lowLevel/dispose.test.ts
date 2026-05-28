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
          yield 2;
        }
      }))
      .and(
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
      )
      .when('generator.next() is called', async ({ generator }) => {
        return await generator.next();
      })
      .then('should return 1', (_, value) => {
        expect(value).toEqual({ done: false, value: 1 });
      })
      .when('generator[Symbol.asyncDispose]() is called', async ({ generator }) => {
        await generator[Symbol.asyncDispose]();
      })
      .then('should not throw', () => {})
      .when.oneOf([
        [
          'generator.next() is called',
          async ({ generator }) => {
            try {
              await generator.next();

              return;
            } catch (error) {
              return error;
            }
          }
        ],
        [
          'generator.return() is called',
          async ({ generator }) => {
            try {
              await generator.return();

              return;
            } catch (error) {
              return error;
            }
          }
        ],
        [
          'generator.throw() is called',
          async ({ generator }) => {
            try {
              await generator.throw(123);

              return;
            } catch (error) {
              return error;
            }
          }
        ]
      ])
      .then('should throw', (_, reason) => {
        expect(reason).toEqual(expect.any(Error));
      });
  },
  NodeTest
);
