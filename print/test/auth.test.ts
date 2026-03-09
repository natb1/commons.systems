import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateFirebaseAuth = vi.fn();

vi.mock("@commons-systems/authutil/firebase-auth", () => ({
  createFirebaseAuth: (...args: unknown[]) => mockCreateFirebaseAuth(...args),
}));

vi.mock("../src/firebase.js", () => ({
  app: { type: "mock-app" },
}));

describe("auth module", () => {
  const mockResult = {
    auth: { type: "mock-auth" },
    signIn: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCreateFirebaseAuth.mockReturnValue(mockResult);
  });

  it("calls createFirebaseAuth with app", async () => {
    await import("../src/auth");

    expect(mockCreateFirebaseAuth).toHaveBeenCalledWith(
      { type: "mock-app" },
      undefined,
    );
  });

  it("re-exports auth, signIn, signOut, onAuthStateChanged", async () => {
    const mod = await import("../src/auth");

    expect(mod.auth).toBe(mockResult.auth);
    expect(mod.signIn).toBe(mockResult.signIn);
    expect(mod.signOut).toBe(mockResult.signOut);
    expect(mod.onAuthStateChanged).toBe(mockResult.onAuthStateChanged);
  });

  describe("when VITE_AUTH_EMULATOR_HOST is set", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "localhost:9099");
    });

    it("passes emulatorHost option", async () => {
      await import("../src/auth");

      expect(mockCreateFirebaseAuth).toHaveBeenCalledWith(
        { type: "mock-app" },
        { emulatorHost: "localhost:9099" },
      );
    });
  });

  describe("when VITE_AUTH_EMULATOR_HOST is not set", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "");
    });

    it("passes undefined options", async () => {
      await import("../src/auth");

      expect(mockCreateFirebaseAuth).toHaveBeenCalledWith(
        { type: "mock-app" },
        undefined,
      );
    });
  });
});
