import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FirebaseApp } from "firebase/app";
import type { User } from "firebase/auth";

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockCreateAppAuth = vi.fn();
const mockGetAuth = vi.fn();

vi.mock("../src/app-auth.js", () => ({
  createAppAuth: (...args: unknown[]) => mockCreateAppAuth(...args),
}));

vi.mock("firebase/auth", () => ({
  getAuth: (...args: unknown[]) => mockGetAuth(...args),
}));

const mockApp = { type: "mock-app" } as unknown as FirebaseApp;

describe("createDeferredAppAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCreateAppAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      onAuthStateChanged: mockOnAuthStateChanged,
    });
  });

  async function setup(currentUser: Partial<User> | null = null) {
    const mockAuthInstance = { currentUser } as unknown as import("firebase/auth").Auth;
    mockGetAuth.mockReturnValue(mockAuthInstance);

    const { createDeferredAppAuth } = await import("../src/deferred-app-auth");
    const deferred = createDeferredAppAuth(mockApp);
    return deferred;
  }

  it("getCurrentUser returns null before the load promise resolves", async () => {
    // Create a deferred that never resolves during this check
    let resolveLoad!: () => void;
    const blockingPromise = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });

    // Intercept the module imports to delay resolution
    const mockAppAuthModule = { createAppAuth: mockCreateAppAuth };
    const mockFirebaseAuthModule = { getAuth: mockGetAuth };

    vi.doMock("../src/app-auth.js", () =>
      blockingPromise.then(() => mockAppAuthModule),
    );
    vi.doMock("firebase/auth", () =>
      blockingPromise.then(() => mockFirebaseAuthModule),
    );

    const { createDeferredAppAuth } = await import("../src/deferred-app-auth");
    const deferred = createDeferredAppAuth(mockApp);

    // Before load resolves, getCurrentUser must return null
    expect(deferred.getCurrentUser()).toBeNull();

    resolveLoad();
  });

  it("getCurrentUser returns { uid, email } after load when a user is signed in", async () => {
    const deferred = await setup({ uid: "user-123", email: "test@example.com" });

    // Trigger load by awaiting any async method
    mockSignIn.mockResolvedValue(undefined);
    await deferred.signIn();

    expect(deferred.getCurrentUser()).toEqual({ uid: "user-123", email: "test@example.com" });
  });

  it("getCurrentUser returns null after load when no user is signed in", async () => {
    const deferred = await setup(null);

    mockSignIn.mockResolvedValue(undefined);
    await deferred.signIn();

    expect(deferred.getCurrentUser()).toBeNull();
  });

  it("signIn awaits load then proxies to the loaded AppAuth", async () => {
    const deferred = await setup();
    mockSignIn.mockResolvedValue(undefined);

    await deferred.signIn();

    expect(mockCreateAppAuth).toHaveBeenCalledWith(mockApp);
    expect(mockSignIn).toHaveBeenCalledOnce();
  });

  it("signOut awaits load then proxies to the loaded AppAuth", async () => {
    const deferred = await setup();
    mockSignOut.mockResolvedValue(undefined);

    await deferred.signOut();

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("onAuthStateChanged awaits load then proxies to the loaded AppAuth", async () => {
    const deferred = await setup();
    const mockUnsubscribe = vi.fn();
    const callback = vi.fn();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

    const unsubscribe = await deferred.onAuthStateChanged(callback);

    expect(mockOnAuthStateChanged).toHaveBeenCalledWith(callback);
    expect(unsubscribe).toBe(mockUnsubscribe);
  });
});
