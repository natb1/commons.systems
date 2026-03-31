/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetAuth = vi.fn();
const mockSignInWithRedirect = vi.fn();
const mockGetRedirectResult = vi.fn();
const mockFirebaseSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockSetupAuthEmulator = vi.fn();

vi.mock("firebase/auth", () => {
  class GithubAuthProvider {
    addScope() {}
  }
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

  afterEach(() => {
    document.querySelectorAll(".auth-toast").forEach((el) => el.remove());
  });

  it("calls getAuth(app)", () => {
    createFirebaseAuth(mockApp);
    expect(mockGetAuth).toHaveBeenCalledWith(mockApp);
  });

  it("returns signIn, signOut, and onAuthStateChanged", () => {
    const result = createFirebaseAuth(mockApp);
    expect(typeof result.signIn).toBe("function");
    expect(typeof result.signOut).toBe("function");
    expect(typeof result.onAuthStateChanged).toBe("function");
  });

  it("onAuthStateChanged passes callback to firebase with bound auth", () => {
    const result = createFirebaseAuth(mockApp);
    const callback = vi.fn();
    result.onAuthStateChanged(callback);
    expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
      { type: "mock-auth" },
      callback,
    );
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

  it("shows toast on signIn redirect failure", async () => {
    const signInError = Object.assign(new Error("redirect failed"), {
      code: "auth/network-request-failed",
    });
    mockSignInWithRedirect.mockRejectedValue(signInError);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { signIn } = createFirebaseAuth(mockApp);
    signIn();
    await new Promise((r) => setTimeout(r, 0));

    const toast = document.querySelector(".auth-toast");
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain("Network error");
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
    vi.spyOn(console, "error").mockImplementation(() => {});

    createFirebaseAuth(mockApp);
    rejectFn(redirectError);
    await new Promise((r) => setTimeout(r, 0));

    const toast = document.querySelector(".auth-toast");
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain("Network error");
  });

  it("dismisses popup-closed-by-user without showing toast", async () => {
    const popupError = Object.assign(new Error("popup closed"), {
      code: "auth/popup-closed-by-user",
    });
    let rejectFn!: (error: unknown) => void;
    mockGetRedirectResult.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectFn = reject;
      }),
    );
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    createFirebaseAuth(mockApp);
    rejectFn(popupError);
    await new Promise((r) => setTimeout(r, 0));

    expect(debugSpy).toHaveBeenCalledWith("Auth redirect cancelled by user");
    expect(document.querySelector(".auth-toast")).toBeNull();
    debugSpy.mockRestore();
  });

  it("shows toast on signOut failure without re-throwing", async () => {
    mockFirebaseSignOut.mockRejectedValue(new Error("sign-out failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { signOut } = createFirebaseAuth(mockApp);
    await signOut();

    const toast = document.querySelector(".auth-toast");
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain("Sign-out failed");
  });

  it("deduplicates error toasts", async () => {
    const signInError = Object.assign(new Error("redirect failed"), {
      code: "auth/network-request-failed",
    });
    mockSignInWithRedirect.mockRejectedValue(signInError);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { signIn } = createFirebaseAuth(mockApp);
    signIn();
    await new Promise((r) => setTimeout(r, 0));
    signIn();
    await new Promise((r) => setTimeout(r, 0));

    const toasts = document.querySelectorAll(".auth-toast");
    expect(toasts).toHaveLength(1);
  });
});
