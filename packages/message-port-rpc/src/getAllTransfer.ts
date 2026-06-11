import { workthru } from 'workthru';
import isTransferable from './isTransferable.ts';

export default function getAllTransfer(data: unknown): Transferable[] {
  const transferSet = new Set<Transferable>();

  workthru(data, value => {
    if (isTransferable(value)) {
      transferSet.add(value as Transferable);
    }

    return value;
  });

  return Array.from(transferSet);
}
