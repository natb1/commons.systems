/**
 * Run `fn` over `items` with at most `limit` invocations in flight at once,
 * returning results in input order. A sliding-window worker pool: `limit`
 * workers share a cursor, so a slow item never stalls the others and peak
 * concurrency is capped at exactly `limit` (the point — it bounds peak
 * memory when `fn` allocates per item, e.g. reading a file into an
 * ArrayBuffer). Order is preserved by indexed assignment, independent of
 * completion order. Rejection semantics match `Promise.all`: the first
 * rejection propagates and in-flight workers are not cancelled.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workerCount = Math.max(0, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
