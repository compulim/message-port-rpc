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
          await new Promise(() => {}); // Never end
        }
      }))
      .and(
        'a stub generator',
        precondition => {
          const abortController = new AbortController();
          const messageChannel = createIsolatedMessageChannel();

          forGenerator(messageChannel.port1, precondition.generate);

          const clientStub = forGenerator<typeof precondition.generate>(messageChannel.port2).withOptions({
            signal: abortController.signal
          });

          const generator = clientStub();

          return { ...precondition, abortController, generator, messageChannel };
        },
        async ({ generator, messageChannel }) => {
          await generator[Symbol.asyncDispose]();

          messageChannel!.port1.close();
          messageChannel!.port2.close();
        }
      )
      .when('generator.next() is called followed by abort', async ({ abortController, generator }) => {
        const promise = generator.next();

        promise.catch(() => {});

        await new Promise<void>(resolve => queueMicrotask(() => resolve()));

        abortController.abort();

        try {
          await promise;

          return;
        } catch (error) {
          return error;
        }
      })
      .then('should throw', (_, value) => {
        expect(value).toEqual(expect.any(Error));
      });
  },
  NodeTest
);
