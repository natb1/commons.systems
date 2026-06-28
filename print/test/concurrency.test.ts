import { describe, it, expect } from "vitest";
import { createLimiter } from "../src/concurrency";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void; // type-safety-ok: assigned synchronously inside the Promise constructor below
  let reject!: (reason: unknown) => void; // type-safety-ok: assigned synchronously inside the Promise constructor below
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Flush the microtask queue by awaiting a chain of resolved promises. */
async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe("createLimiter", () => {
  describe("Test D (guard)", () => {
    it("throws when limit is 0", () => {
      expect(() => createLimiter(0)).toThrow("limit must be > 0");
    });

    it("throws when limit is negative", () => {
      expect(() => createLimiter(-1)).toThrow("limit must be > 0");
    });
  });

  describe("Test B (results propagate)", () => {
    it("resolves with the value returned by the scheduled fn", async () => {
      const limiter = createLimiter(2);
      const result = await limiter.schedule(() => Promise.resolve(42));
      expect(result).toBe(42);
    });

    it("resolves multiple tasks with their respective values", async () => {
      const limiter = createLimiter(2);
      const [a, b, c] = await Promise.all([
        limiter.schedule(() => Promise.resolve("x")),
        limiter.schedule(() => Promise.resolve("y")),
        limiter.schedule(() => Promise.resolve("z")),
      ]);
      expect(a).toBe("x");
      expect(b).toBe("y");
      expect(c).toBe("z");
    });
  });

  describe("Test C (rejection does not wedge the queue)", () => {
    it("rejects the schedule() promise when the fn rejects", async () => {
      const limiter = createLimiter(2);
      await expect(
        limiter.schedule(() => Promise.reject(new Error("boom"))),
      ).rejects.toThrow("boom");
    });

    it("a later task still runs after an earlier task rejects", async () => {
      const limiter = createLimiter(1);

      const firstDone = deferred<void>();
      const scheduleFirst = limiter.schedule(() =>
        Promise.reject(new Error("first fails")),
      );
      // second is queued behind first (limit=1)
      const scheduleSecond = limiter.schedule(() => Promise.resolve("second ok"));

      await expect(scheduleFirst).rejects.toThrow("first fails");
      const secondResult = await scheduleSecond;
      expect(secondResult).toBe("second ok");
      void firstDone;
    });
  });

  describe("Test A (bound holds — non-vacuous concurrency cap)", () => {
    it("does not exceed `limit` in-flight tasks at once", async () => {
      const LIMIT = 2;
      const TASK_COUNT = 5;
      const limiter = createLimiter(LIMIT);

      let active = 0;
      let maxSeen = 0;
      const deferreds: Array<Deferred<number>> = [];

      const schedulePromises = Array.from({ length: TASK_COUNT }, (_, i) => {
        const d = deferred<number>();
        deferreds.push(d);
        return limiter.schedule(async () => {
          active++;
          if (active > maxSeen) maxSeen = active;
          const result = await d.promise;
          active--;
          return result;
        });
      });

      // Allow the first `LIMIT` tasks to start (microtask scheduling).
      await flushMicrotasks();

      // Before releasing any deferred, the cap must hold.
      expect(maxSeen).toBeLessThanOrEqual(LIMIT);
      expect(active).toBe(LIMIT);

      // Resolve all deferreds one-by-one and verify all schedule() promises settle.
      for (let i = 0; i < TASK_COUNT; i++) {
        deferreds[i].resolve(i);
        await flushMicrotasks();
      }

      const results = await Promise.all(schedulePromises);
      expect(results).toEqual([0, 1, 2, 3, 4]);

      // All tasks ran; cap was never exceeded.
      expect(maxSeen).toBeLessThanOrEqual(LIMIT);
      expect(active).toBe(0);
    });
  });
});
