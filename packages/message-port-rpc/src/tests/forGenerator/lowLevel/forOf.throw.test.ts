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
      .given('a generate function', () => ({
        generate: async function* generate() {
          try {
            yield 1;
            yield 2;
            yield 3;
          } catch (error) {
            yield 789;
          }
        }
      }))
      .and.oneOf<{
        readonly generator: AsyncGenerator<number, any, any>;
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
        const values: any[] = [];

        try {
          for await (const value of generator) {
            values.push(value);

            throw 123;
          }
        } catch {}

        return values;
      })
      .then('should run finally', (_, values) => {
        expect(values).toEqual([1]);
      });
  },
  NodeTest
);
