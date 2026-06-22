import { describe, it, expect, vi } from "vitest";
import { mapWithConcurrency } from "../src/concurrency.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("mapWithConcurrency", () => {
  it("caps peak concurrency at exactly limit and preserves input order", async () => {
    const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const limit = 3;
    let inFlight = 0;
    let maxInFlight = 0;
    const release: Array<() => void> = [];

    const fn = async (x: number) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>((res) => release.push(res));
      inFlight--;
      return x * 2;
    };

    const call = mapWithConcurrency(items, limit, fn);

    // Let the pool launch its initial window.
    await tick();
    expect(inFlight).toBe(3);

    // Drain: as each in-flight item resolves, a worker pulls the next item and
    // pushes a fresh release resolver — so keep going while any are pending.
    while (release.length > 0) {
      release.shift()?.();
      await tick();
    }

    const result = await call;
    expect(result).toEqual(items.map((x) => x * 2));
    expect(maxInFlight).toBe(3);
  });

  it("returns [] and never calls fn for empty input", async () => {
    const fn = vi.fn(async (x: number) => x);
    const result = await mapWithConcurrency([], 4, fn);
    expect(result).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it("handles limit >= length, preserving order", async () => {
    const items = [1, 2, 3];
    const result = await mapWithConcurrency(items, 10, async (x) => x * 2);
    expect(result).toEqual([2, 4, 6]);
  });
});
