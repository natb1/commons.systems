/**
 * A pLimit-style incremental scheduler that caps peak concurrency across an
 * open, unbounded stream of tasks arriving over time (e.g. rows scrolling into
 * a viewport). This is deliberately different from audio's `mapWithConcurrency`,
 * which is a sliding-window pool over a fixed array known up front: that helper
 * takes all items eagerly, spins up `limit` workers that race a shared cursor,
 * and waits for the full batch. Here tasks arrive one at a time via `schedule`,
 * the active count is shared instance state, and settling (resolve OR reject)
 * always frees a slot so the queue never wedges. The two primitives cannot
 * share an implementation, and the audio helper cannot cross the app boundary
 * without a shared package. See issue #2496.
 */

export interface Limiter {
  schedule<T>(fn: () => Promise<T>): Promise<T>;
}

export function createLimiter(limit: number): Limiter {
  if (limit <= 0) throw new Error('createLimiter: limit must be > 0');

  let active = 0;
  const queue: Array<() => void> = [];

  function next(): void {
    if (queue.length > 0 && active < limit) {
      const run = queue.shift()!; // type-safety-ok: queue.length > 0 checked on the preceding line
      run();
    }
  }

  function schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      function run(): void {
        active++;
        try {
          fn().then(
            (value) => {
              active--;
              next();
              resolve(value);
            },
            (err) => {
              active--;
              next();
              reject(err);
            },
          );
        } catch (err) {
          active--;
          next();
          reject(err);
        }
      }

      if (active < limit) {
        run();
      } else {
        queue.push(run);
      }
    });
  }

  return { schedule };
}
