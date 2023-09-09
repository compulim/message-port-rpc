import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import waitFor from './__setup__/waitFor';

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: 10, now: 0 });
});

describe('when wait for', () => {
  let callAt: number[];
  let fn: jest.Mock<() => number | Promise<number | undefined> | undefined>;
  let waitForPromise: Promise<number | undefined>;

  describe('async function which resolve immediately', () => {
    beforeEach(async () => {
      callAt = [];

      fn = jest.fn(() => {
        callAt.push(Date.now());

        return Promise.resolve(1);
      });

      waitForPromise = waitFor(fn);

      await waitForPromise;
    });

    test('should return the value', () => expect(waitForPromise).resolves.toBe(1));
    test('should have called the function', () => {
      expect(fn).toBeCalledTimes(1);
      expect(callAt).toEqual([0]);
    });

    test('should complete at t=0', () => expect(Date.now()).toBe(0));
  });

  describe('async function which resolve later', () => {
    let numCall: number;

    beforeEach(async () => {
      callAt = [];
      numCall = 0;

      fn = jest.fn(() => {
        callAt.push(Date.now());

        return numCall++ >= 1 ? Promise.resolve(1) : Promise.reject(new Error('not ready'));
      });

      waitForPromise = waitFor(fn);

      await waitForPromise;
    });

    test('should return the value', () => expect(waitForPromise).resolves.toBe(1));
    test('should have called the function', async () => {
      expect(fn).toBeCalledTimes(2);
      expect(callAt).toEqual([0, 50]);
    });

    test('should complete at t=50', () => expect(Date.now()).toBe(50));
  });

  describe('async function which reject', () => {
    let numCall: number;

    beforeEach(async () => {
      callAt = [];
      numCall = 0;

      fn = jest.fn(() => {
        callAt.push(Date.now());

        return Promise.reject(++numCall);
      });

      waitForPromise = waitFor(fn);

      try {
        await waitForPromise;
      } catch (error) {}
    });

    // This is 20 because, after Promise.reject(21), the timeout kicked off and returned 20 instead of 21.
    test('should reject with the last reason', () => expect(waitForPromise).rejects.toBe(20));
    test('should have called the function', () => {
      expect(fn).toBeCalledTimes(21);
      expect(callAt).toEqual([
        0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000
      ]);
    });
    test('should complete at t=1000', () => expect(Date.now()).toBe(1000));
  });

  describe('async function which never resolve/reject', () => {
    beforeEach(async () => {
      callAt = [];

      fn = jest.fn(() => {
        callAt.push(Date.now());

        return new Promise(() => {});
      });

      waitForPromise = waitFor(fn);

      try {
        await waitForPromise;
      } catch (error) {}
    });

    test('should reject with "timed out"', () => expect(waitForPromise).rejects.toThrow('timed out'));
    test('should have called the function', () => {
      expect(fn).toBeCalledTimes(1);
      expect(callAt).toEqual([0]);
    });
    test('should complete at t=1000', () => expect(Date.now()).toBe(1000));
  });

  describe.each([
    [1, 'a value'],
    [undefined, 'undefined']
  ])('sync function which return %s immediately', (value, _) => {
    beforeEach(async () => {
      callAt = [];

      fn = jest.fn(() => {
        callAt.push(Date.now());

        return value;
      });

      waitForPromise = waitFor(fn);

      try {
        await waitForPromise;
      } catch (error) {}
    });

    test('should return the value', () => expect(waitForPromise).resolves.toBe(value));
    test('should have called the function', () => {
      expect(fn).toBeCalledTimes(1);
      expect(callAt).toEqual([0]);
    });
    test('should complete at t=0', () => expect(Date.now()).toBe(0));
  });

  describe('sync function which throw immediately', () => {
    let numCall: number;

    beforeEach(async () => {
      callAt = [];
      numCall = 0;

      fn = jest.fn(() => {
        callAt.push(Date.now());

        throw new Error(++numCall + '');
      });

      waitForPromise = waitFor(fn);

      try {
        await waitForPromise;
      } catch (error) {}
    });

    test('should reject with the last reason', () => expect(waitForPromise).rejects.toThrow('21'));
    test('should have called the function', () => {
      expect(fn).toBeCalledTimes(21);
      expect(callAt).toEqual([
        0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000
      ]);
    });
    test('should complete at t=1000', () => expect(Date.now()).toBe(1000));
  });
});
