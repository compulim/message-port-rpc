/**
 * Transforms an input by recursively walking it, which could be array, class object, plain object, function, null, primitives, undefined, etc.
 *
 * Input could be recursive, sparse array, and potentially not serializable to JSON.
 *
 * Skip values that has been walked and return the transformed value.
 *
 * Call transformer() on every traversed value. The transformer can return the original value or a new value.
 * If a new value is returned, replace the output with the new value. Otherwise, continue the walk recursively.
 *
 * If the value is an array or object, recursively walk on its value and call transformer() on every item.
 *
 * If part of the input is not modified, return their original values.
 *
 * If the whole input is not modified, return the original input.
 *
 * @param input
 * @param transformer
 */
function walk_(target: any, transformer: (value: any) => any, walked: Map<any, any>): any {
  if (Array.isArray(target)) {
    if (walked.has(target)) {
      return walked.get(target);
    }

    let nextArray = transformer(target);

    if (nextArray !== target) {
      walked.set(target, nextArray);

      return nextArray;
    }

    // for-in loop can handle sparse array.
    for (const index in target) {
      const value = target[index];
      const nextValue = walk_(value, transformer, walked);

      if (nextValue !== value) {
        if (nextArray === target) {
          nextArray = [...target];
        }

        nextArray[index] = nextValue;
      }
    }

    walked.set(target, nextArray);

    return nextArray;
  }

  if (typeof target === 'object' && target !== null) {
    if (walked.has(target)) {
      return walked.get(target);
    }

    const prototype = Object.getPrototypeOf(target);

    if (prototype === null || prototype === Object.prototype) {
      const nextTarget = transformer(target);

      if (nextTarget !== target) {
        walked.set(target, nextTarget);

        return nextTarget;
      }

      const entries = Object.entries(target);
      let nextMap = undefined;

      for (const [key, value] of entries) {
        const nextValue = walk_(value, transformer, walked);

        if (nextValue !== value) {
          if (!nextMap) {
            nextMap = new Map(entries);
          }

          nextMap.set(key, nextValue);
        }
      }

      const nextObject = nextMap ? Object.fromEntries(nextMap.entries()) : target;

      walked.set(target, nextObject);

      return nextObject;
    }
  }

  return transformer(target);
}

function walk(target: any, walker: (value: any) => any): any {
  return walk_(target, walker, new Map());
}

export default walk;
