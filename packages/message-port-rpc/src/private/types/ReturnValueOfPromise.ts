export type ReturnValueOfPromise<T> = T extends Promise<infer R> ? R : never;
