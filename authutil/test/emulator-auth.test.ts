import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConnectAuthEmulator = vi.fn();
const mockSignInWithCustomToken = vi.fn();

vi.mock("firebase/auth", () => ({
  connectAuthEmulator: (...args: unknown[]) =>
    mockConnectAuthEmulator(...args),
  signInWithCustomToken: (...args: unknown[]) =>
    mockSignInWithCustomToken(...args),
}));

import { fakeCustomToken, setupAuthEmulator } from "../src/emulator-auth";

describe("fakeCustomToken", () => {
  it("returns a three-part JWT string", () => {
    const token = fakeCustomToken("user-123");
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("has RS256 alg in header", () => {
    const token = fakeCustomToken("user-123");
    const header = JSON.parse(atob(token.split(".")[0]));
    expect(header.alg).toBe("RS256");
    expect(header.typ).toBe("JWT");
  });

  it("includes uid in payload", () => {
    const token = fakeCustomToken("my-uid");
    const payload = JSON.parse(atob(token.split(".")[1]));
    expect(payload.uid).toBe("my-uid");
  });

  it("uses base64url encoding (no +, /, or = characters)", () => {
    const token = fakeCustomToken("user-123");
    expect(token).not.toMatch(/[+/=]/);
  });

  it("has fakesig as the signature", () => {
    const token = fakeCustomToken("user-123");
    expect(token.split(".")[2]).toBe("fakesig");
  });
});

describe("setupAuthEmulator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls connectAuthEmulator with http:// prefix", () => {
    const mockAuth = { type: "mock-auth" };
    setupAuthEmulator(mockAuth as any, "localhost:9099");

    expect(mockConnectAuthEmulator).toHaveBeenCalledWith(
      mockAuth,
      "http://localhost:9099",
      { disableWarnings: true },
    );
  });

  it("exposes window.__signIn that calls signInWithCustomToken", () => {
    const mockAuth = { type: "mock-auth" };
    setupAuthEmulator(mockAuth as any, "localhost:9099");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signInFn = (globalThis as any).__signIn;
    expect(signInFn).toBeDefined();

    signInFn("test-uid");
    expect(mockSignInWithCustomToken).toHaveBeenCalledWith(
      mockAuth,
      expect.stringContaining("."),
    );
  });
});
