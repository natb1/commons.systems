/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuth = vi.fn();
const mockSignInWithRedirect = vi.fn();
const mockGetRedirectResult = vi.fn();
const mockFirebaseSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockSetupAuthEmulator = vi.fn();

vi.mock("firebase/auth", () => {
  class GithubAuthProvider {}
  return {
    getAuth: (...args: unknown[]) => mockGetAuth(...args),
    GithubAuthProvider,
    signInWithRedirect: (...args: unknown[]) => mockSignInWithRedirect(...args),
    getRedirectResult: (...args: unknown[]) => mockGetRedirectResult(...args),
    signOut: (...args: unknown[]) => mockFirebaseSignOut(...args),
    onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  };
});

vi.mock("../src/emulator-auth.js", () => ({
  setupAuthEmulator: (...args: unknown[]) => mockSetupAuthEmulator(...args),
}));

import { createFirebaseAuth } from "../src/firebase-auth";
import { GithubAuthProvider } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";

const mockApp = { type: "mock-app" } as unknown as FirebaseApp;

describe("createFirebaseAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockReturnValue({ type: "mock-auth" });
    mockGetRedirectResult.mockResolvedValue(null);
    mockSignInWithRedirect.mockResolvedValue(undefined);
    mockFirebaseSignOut.mockResolvedValue(undefined);
  });

  it("calls getAuth(app) and returns auth", () => {
    const result = createFirebaseAuth(mockApp);
    expect(result.auth).toEqual({ type: "mock-auth" });
    expect(mockGetAuth).toHaveBeenCalledWith(mockApp);
  });

  it("returns signIn, signOut, and onAuthStateChanged", () => {
    const result = createFirebaseAuth(mockApp);
    expect(typeof result.signIn).toBe("function");
    expect(typeof result.signOut).toBe("function");
    expect(typeof result.onAuthStateChanged).toBe("function");
  });

  it("calls getRedirectResult on factory invocation", () => {
    createFirebaseAuth(mockApp);
    expect(mockGetRedirectResult).toHaveBeenCalledWith({ type: "mock-auth" });
  });

  it("calls setupAuthEmulator when emulatorHost option provided", () => {
    createFirebaseAuth(mockApp, { emulatorHost: "localhost:9099" });
    expect(mockSetupAuthEmulator).toHaveBeenCalledWith({ type: "mock-auth" }, "localhost:9099");
  });

  it("does not call setupAuthEmulator when no option", () => {
    createFirebaseAuth(mockApp);
    expect(mockSetupAuthEmulator).not.toHaveBeenCalled();
  });

  it("signIn calls signInWithRedirect with GithubAuthProvider", () => {
    const { signIn } = createFirebaseAuth(mockApp);
    signIn();
    expect(mockSignInWithRedirect).toHaveBeenCalledWith(
      { type: "mock-auth" },
      expect.any(GithubAuthProvider),
    );
  });

  it("signOut calls firebaseSignOut", async () => {
    const { signOut } = createFirebaseAuth(mockApp);
    await signOut();
    expect(mockFirebaseSignOut).toHaveBeenCalledWith({ type: "mock-auth" });
  });

  it("shows toast on redirect error", async () => {
    const redirectError = Object.assign(new Error("redirect failed"), {
      code: "auth/network-request-failed",
    });
    let rejectFn!: (error: unknown) => void;
    mockGetRedirectResult.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectFn = reject;
      }),
    );

    createFirebaseAuth(mockApp);
    rejectFn(redirectError);
    await new Promise((r) => setTimeout(r, 0));

    const toast = document.querySelector(".auth-toast");
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain("Network error");
    toast?.remove();
  });

  it("shows toast on signOut failure and re-throws", async () => {
    mockFirebaseSignOut.mockRejectedValue(new Error("sign-out failed"));
    const { signOut } = createFirebaseAuth(mockApp);
    await expect(signOut()).rejects.toThrow("sign-out failed");

    const toast = document.querySelector(".auth-toast");
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain("Sign-out failed");
    toast?.remove();
  });
});
