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
        let initValue: number;
        let yieldedValue: number;

        return {
          generate: async function* generate(value: number) {
            initValue = value;

            yieldedValue = yield 1;
          },
          getInitValue: () => initValue,
          getLastYieldedValue: () => yieldedValue
        };
      })
      .and.oneOf<{
        readonly generator: AsyncGenerator<number, any, any>;
        readonly getInitValue: () => number;
        readonly getLastYieldedValue: () => number;
        readonly messageChannel?: MessageChannel | undefined;
      }>([
        [
          'a stub generator',
          precondition => {
            const messageChannel = createIsolatedMessageChannel();

            forGenerator(messageChannel.port1, precondition.generate);

            const clientStub = forGenerator<typeof precondition.generate>(messageChannel.port2);
            const generator = clientStub(123);

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
            generator: precondition.generate(123)
          })
        ]
      ])
      .when('initialized', () => {})
      .then('the init value should NOT be passed', ({ getInitValue }) => {
        // The generator function is only called when next() is being called for the first time,
        // and not called before the first next().
        expect(getInitValue()).toBeUndefined();
      })
      .when('generator.next() is called', async ({ generator }) => {
        return await generator.next();
      })
      .then('the init value should NOT be passed', ({ getInitValue }) => {
        expect(getInitValue()).toBe(123);
      })
      .and('should return 1', (_, value) => {
        expect(value).toEqual({ done: false, value: 1 });
      })
      .when('generator.next() is called', async ({ generator }) => {
        return await generator.next(789);
      })
      .then('should pass yield value', ({ getLastYieldedValue: getLastYieldValue }) => {
        // The generator receive the control only when next() is called.
        expect(getLastYieldValue()).toBe(789);
      })
      .and('should return done', (_, value) => {
        expect(value).toEqual({ done: true });
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
