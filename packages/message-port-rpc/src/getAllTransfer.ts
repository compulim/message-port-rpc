import { workthru } from 'workthru';
import isTransferable from './isTransferable.ts';

export default function getAllTransfer(data: unknown): MessagePort[] {
  const transferSet = new Set<MessagePort>();

  workthru(data, value => {
    isTransferable(value) && transferSet.add(value);

    return value;
  });

  return Array.from(transferSet.values());
}
