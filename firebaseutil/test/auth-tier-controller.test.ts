import { describe, it, expect, vi } from "vitest";

import { createAuthTierController } from "../src/auth-tier-controller.js";

interface TestUser {
  uid: string;
}

interface OwnerData {
  value: string;
}

describe("createAuthTierController", () => {
  it("renders the demo tier synchronously on construction", () => {
    const render = vi.fn();
    const load = vi.fn<(user: TestUser) => Promise<OwnerData>>();

    createAuthTierController({ load, render });

    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith({ tier: "demo" });
    expect(load).not.toHaveBeenCalled();
  });

  it("renders the demo tier synchronously when user is null", () => {
    const render = vi.fn();
    const load = vi.fn<(user: TestUser) => Promise<OwnerData>>();

    const controller = createAuthTierController({ load, render });
    render.mockClear();

    controller.handleAuthChange(null);

    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith({ tier: "demo" });
    expect(load).not.toHaveBeenCalled();
  });

  it("renders the owner tier with loaded data when the load resolves", async () => {
    const render = vi.fn();
    const data: OwnerData = { value: "owner-payload" };
    const load = vi.fn<(user: TestUser) => Promise<OwnerData>>(() =>
      Promise.resolve(data),
    );

    const controller = createAuthTierController({ load, render });
    render.mockClear();

    controller.handleAuthChange({ uid: "u1" });
    await Promise.resolve();
    await Promise.resolve();

    expect(load).toHaveBeenCalledWith({ uid: "u1" });
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith({ tier: "owner", data });
  });

  it("renders the error tier when the load rejects", async () => {
    const render = vi.fn();
    const load = vi.fn<(user: TestUser) => Promise<OwnerData>>(() =>
      Promise.reject(new Error("permission-denied")),
    );

    const controller = createAuthTierController({ load, render });
    render.mockClear();

    controller.handleAuthChange({ uid: "u1" });
    await Promise.resolve();
    await Promise.resolve();

    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith({ tier: "error" });
  });

  it("does not render a stale result when the first load resolves after the second (guard direction A)", async () => {
    const render = vi.fn();

    // Manually-resolved deferred promises so we control resolution order.
    let resolveFirst!: (data: OwnerData) => void;
    let resolveSecond!: (data: OwnerData) => void;
    const firstPromise = new Promise<OwnerData>((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<OwnerData>((resolve) => {
      resolveSecond = resolve;
    });

    const load = vi
      .fn<(user: TestUser) => Promise<OwnerData>>()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const controller = createAuthTierController({ load, render });
    render.mockClear();

    // Two overlapping auth changes for the SAME user identity — the first load
    // is still in flight when the second begins. Using one identity is what
    // discriminates the generation guard from a (rejected) user-identity guard:
    // an identity guard would compare equal here and wrongly let the stale first
    // result render, so this case only passes with the generation counter.
    const user: TestUser = { uid: "u" };
    controller.handleAuthChange(user);
    controller.handleAuthChange(user);

    // Resolve the SECOND (newer) load first, then the FIRST (stale) load.
    resolveSecond({ value: "second" });
    await Promise.resolve();
    await Promise.resolve();

    resolveFirst({ value: "first" });
    await Promise.resolve();
    await Promise.resolve();

    // The stale (first) result must NOT render; only the newer second wins.
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith({ tier: "owner", data: { value: "second" } });
    expect(render).not.toHaveBeenCalledWith({ tier: "owner", data: { value: "first" } });
  });

  it("renders the newer load's result (guard direction B)", async () => {
    const render = vi.fn();

    let resolveFirst!: (data: OwnerData) => void;
    let resolveSecond!: (data: OwnerData) => void;
    const firstPromise = new Promise<OwnerData>((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<OwnerData>((resolve) => {
      resolveSecond = resolve;
    });

    const load = vi
      .fn<(user: TestUser) => Promise<OwnerData>>()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const controller = createAuthTierController({ load, render });
    render.mockClear();

    const user: TestUser = { uid: "u" };
    controller.handleAuthChange(user);
    controller.handleAuthChange(user);

    resolveSecond({ value: "second" });
    await Promise.resolve();
    await Promise.resolve();

    resolveFirst({ value: "first" });
    await Promise.resolve();
    await Promise.resolve();

    // The newer (second) load's result DOES render.
    expect(render).toHaveBeenCalledWith({ tier: "owner", data: { value: "second" } });
  });
});
