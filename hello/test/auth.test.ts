import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuth = vi.fn();
const mockSignInWithRedirect = vi.fn();
const mockGetRedirectResult = vi.fn();
const mockFirebaseSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockSetupAuthEmulator = vi.fn();

class MockGithubAuthProvider {}

vi.mock("firebase/auth", () => ({
  getAuth: (...args: unknown[]) => mockGetAuth(...args),
  GithubAuthProvider: MockGithubAuthProvider,
  signInWithRedirect: (...args: unknown[]) =>
    mockSignInWithRedirect(...args),
  getRedirectResult: (...args: unknown[]) =>
    mockGetRedirectResult(...args),
  signOut: (...args: unknown[]) => mockFirebaseSignOut(...args),
  onAuthStateChanged: (...args: unknown[]) =>
    mockOnAuthStateChanged(...args),
}));

vi.mock("@commons-systems/authutil/emulator-auth", () => ({
  setupAuthEmulator: (...args: unknown[]) =>
    mockSetupAuthEmulator(...args),
}));

vi.mock("../src/firebase.js", () => ({
  app: { type: "mock-app" },
}));

describe("auth module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGetAuth.mockReturnValue({ type: "mock-auth" });
    mockGetRedirectResult.mockResolvedValue(null);
  });

  it("calls getRedirectResult on module load", async () => {
    await import("../src/auth");

    expect(mockGetRedirectResult).toHaveBeenCalledWith({ type: "mock-auth" });
  });

  it("exports auth from getAuth", async () => {
    const { auth } = await import("../src/auth");

    expect(auth).toEqual({ type: "mock-auth" });
    expect(mockGetAuth).toHaveBeenCalledWith({ type: "mock-app" });
  });

  it("calls signInWithRedirect with a GithubAuthProvider on signIn", async () => {
    const { signIn } = await import("../src/auth");

    signIn();

    expect(mockSignInWithRedirect).toHaveBeenCalledWith(
      { type: "mock-auth" },
      expect.any(MockGithubAuthProvider),
    );
  });

  it("calls firebaseSignOut on signOut", async () => {
    mockFirebaseSignOut.mockResolvedValue(undefined);
    const { signOut } = await import("../src/auth");

    await signOut();

    expect(mockFirebaseSignOut).toHaveBeenCalledWith({ type: "mock-auth" });
  });

  describe("when VITE_AUTH_EMULATOR_HOST is set", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "localhost:9099");
    });

    it("calls setupAuthEmulator", async () => {
      await import("../src/auth");

      expect(mockSetupAuthEmulator).toHaveBeenCalledWith(
        { type: "mock-auth" },
        "localhost:9099",
      );
    });
  });

  describe("when VITE_AUTH_EMULATOR_HOST is not set", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "");
    });

    it("does not call setupAuthEmulator", async () => {
      await import("../src/auth");

      expect(mockSetupAuthEmulator).not.toHaveBeenCalled();
    });
  });
});
