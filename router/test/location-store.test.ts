import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  navigate,
} from "../src/location-store";
import { ReadonlyURLSearchParams } from "../src/readonly-url-search-params";

describe("location-store", () => {
  // The store is a module singleton, so a leaked subscriber leaves a leaked
  // popstate listener that would bleed into later tests. Each test pushes its
  // own unsubscribe fns here; the afterEach net flushes any that leaked.
  let cleanups: Array<() => void>;

  beforeEach(() => {
    history.pushState({}, "", "/");
    cleanups = [];
  });

  afterEach(() => {
    for (const unsubscribe of cleanups) unsubscribe();
    cleanups = [];
  });

  function track(unsubscribe: () => void): () => void {
    cleanups.push(unsubscribe);
    return unsubscribe;
  }

  it("popstate updates the snapshot", () => {
    // Subscribe first so the popstate listener is attached.
    track(subscribe(() => {}));

    history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(getSnapshot().path).toBe("/about");
  });

  it("navigate changes location and push grows history while replace does not", () => {
    navigate("/x");
    expect(location.pathname).toBe("/x");

    const beforePush = history.length;
    navigate("/push-target");
    const afterPush = history.length;
    // Observed delta: pushState grows the history stack.
    expect(afterPush).toBeGreaterThan(beforePush);
    expect(location.pathname).toBe("/push-target");

    const beforeReplace = history.length;
    navigate("/y", { replace: true });
    const afterReplace = history.length;
    // Observed delta: replaceState leaves the history length unchanged.
    expect(afterReplace).toBe(beforeReplace);
    expect(location.pathname).toBe("/y");
  });

  it("snapshot is referentially stable when location is unchanged", () => {
    const first = getSnapshot();
    const second = getSnapshot();
    expect(Object.is(first, second)).toBe(true);
  });

  it("navigate to a different path yields a new snapshot reference", () => {
    const before = getSnapshot();
    navigate("/new-path");
    const after = getSnapshot();
    expect(Object.is(before, after)).toBe(false);
    expect(after.path).toBe("/new-path");
  });

  it("getServerSnapshot returns a stable default snapshot", () => {
    const server = getServerSnapshot();
    expect(server.path).toBe("/");
    expect([...server.params]).toEqual([]);
    expect(Object.is(getServerSnapshot(), getServerSnapshot())).toBe(true);
  });

  it("getSnapshot params are read-only and survive mutation attempts", () => {
    history.pushState({}, "", "/page?a=1&b=2");
    const snap = getSnapshot();
    const baseline = [...snap.params];
    expect(baseline).toEqual([
      ["a", "1"],
      ["b", "2"],
    ]);

    // Every mutator throws rather than corrupting the shared cached snapshot.
    expect(() => snap.params.set("a", "9")).toThrow(TypeError);
    expect(() => snap.params.append("c", "3")).toThrow(TypeError);
    expect(() => snap.params.delete("a")).toThrow(TypeError);
    expect(() => snap.params.sort()).toThrow(TypeError);

    // The same URL still yields the same, unmodified, referentially-stable snapshot.
    const snap2 = getSnapshot();
    expect(Object.is(snap, snap2)).toBe(true);
    expect([...snap2.params]).toEqual(baseline);
  });

  it("getServerSnapshot params are read-only and survive mutation attempts", () => {
    const server = getServerSnapshot();
    expect(() => server.params.set("k", "v")).toThrow(TypeError);
    expect(() => server.params.append("k", "v")).toThrow(TypeError);
    expect(() => server.params.delete("k")).toThrow(TypeError);
    expect(() => server.params.sort()).toThrow(TypeError);

    const server2 = getServerSnapshot();
    expect(Object.is(server, server2)).toBe(true);
    expect([...server2.params]).toEqual([]);
  });

  it("ReadonlyURLSearchParams reads work while mutators throw", () => {
    const params = new ReadonlyURLSearchParams("x=1&x=2&y=3");
    expect(params.get("x")).toBe("1");
    expect(params.getAll("x")).toEqual(["1", "2"]);
    expect(params.has("y")).toBe(true);
    expect([...params]).toEqual([
      ["x", "1"],
      ["x", "2"],
      ["y", "3"],
    ]);
    expect(params.toString()).toBe("x=1&x=2&y=3");

    expect(() => params.set("x", "9")).toThrow(TypeError);
    expect(() => params.append("z", "4")).toThrow(TypeError);
    expect(() => params.delete("y")).toThrow(TypeError);
    expect(() => params.sort()).toThrow(TypeError);
  });

  it("subscribed callback fires on navigate and stops after unsubscribe", () => {
    const callback = vi.fn();
    const unsubscribe = track(subscribe(callback));

    navigate("/a");
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    navigate("/b");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("subscribed callback fires on popstate (real listener coverage)", () => {
    const callback = vi.fn();
    track(subscribe(callback));

    history.pushState({}, "", "/c");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("removes the popstate listener when the last subscriber leaves", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    try {
      const unsubscribe = subscribe(() => {});
      unsubscribe();
      expect(removeSpy).toHaveBeenCalledWith("popstate", expect.any(Function));
    } finally {
      removeSpy.mockRestore();
    }
  });

  it("popstate after full unsubscribe does not refire the callback", () => {
    const callback = vi.fn();
    const unsubscribe = subscribe(callback);
    unsubscribe();

    history.pushState({}, "", "/d");
    expect(() =>
      window.dispatchEvent(new PopStateEvent("popstate")),
    ).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });

  it("attaches a single popstate listener regardless of subscriber count", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    try {
      const unsubA = track(subscribe(() => {}));
      const unsubB = track(subscribe(() => {}));
      const popstateAdds = addSpy.mock.calls.filter((c) => c[0] === "popstate");
      expect(popstateAdds).toHaveLength(1);
      unsubA();
      unsubB();
    } finally {
      addSpy.mockRestore();
    }
  });
});
