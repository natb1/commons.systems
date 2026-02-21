import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuth = vi.fn();
const mockConnectAuthEmulator = vi.fn();
const mockSignInWithRedirect = vi.fn();
const mockGetRedirectResult = vi.fn();
const mockFirebaseSignOut = vi.fn();
const mockSignInWithCustomToken = vi.fn();
const mockOnAuthStateChanged = vi.fn();

class MockGithubAuthProvider {}

vi.mock("firebase/auth", () => ({
  getAuth: (...args: unknown[]) => mockGetAuth(...args),
  connectAuthEmulator: (...args: unknown[]) =>
    mockConnectAuthEmulator(...args),
  GithubAuthProvider: MockGithubAuthProvider,
  signInWithRedirect: (...args: unknown[]) =>
    mockSignInWithRedirect(...args),
  signInWithCustomToken: (...args: unknown[]) =>
    mockSignInWithCustomToken(...args),
  getRedirectResult: (...args: unknown[]) =>
    mockGetRedirectResult(...args),
  signOut: (...args: unknown[]) => mockFirebaseSignOut(...args),
  onAuthStateChanged: (...args: unknown[]) =>
    mockOnAuthStateChanged(...args),
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

    it("calls connectAuthEmulator", async () => {
      await import("../src/auth");

      expect(mockConnectAuthEmulator).toHaveBeenCalledWith(
        { type: "mock-auth" },
        "http://localhost:9099",
        { disableWarnings: true },
      );
    });
  });

  describe("when VITE_AUTH_EMULATOR_HOST is not set", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "");
    });

    it("does not call connectAuthEmulator", async () => {
      await import("../src/auth");

      expect(mockConnectAuthEmulator).not.toHaveBeenCalled();
    });
  });
});
