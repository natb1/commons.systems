export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

/**
 * A manually-resolvable promise. Used to gate async work so a test can hold
 * operations in-flight and assert behavior deterministically — never a real
 * timer.
 */
export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void; // type-safety-ok: assigned synchronously inside the Promise constructor below
  let reject!: (reason?: unknown) => void; // type-safety-ok: assigned synchronously inside the Promise constructor below
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
