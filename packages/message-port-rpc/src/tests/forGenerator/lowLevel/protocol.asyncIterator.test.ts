import { scenario } from '@testduet/given-when-then';
import { expect } from 'expect';
import { relative } from 'node:path';
import * as NodeTest from 'node:test';
import { fileURLToPath } from 'node:url';
import forGenerator from '../../../forGenerator.ts';

scenario(
  relative(process.cwd(), fileURLToPath(import.meta.url)),
  bdd => {
    bdd
      .given(
        'a MessageChannel',
        () => ({
          messageChannel: new MessageChannel()
        }),
        ({ messageChannel }) => {
          messageChannel.port1.close();
          messageChannel.port2.close();
        }
      )
      .when('a client generator stub is created', precondition => {
        return forGenerator(precondition.messageChannel.port1)();
      })
      .then('the stub [Symbol.asyncIterator] should point to itself', (_, generator) => {
        expect(generator[Symbol.asyncIterator]()).toBe(generator);
      });
  },
  NodeTest
);
