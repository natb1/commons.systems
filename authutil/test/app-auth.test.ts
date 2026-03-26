import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FirebaseApp } from "firebase/app";

const mockCreateFirebaseAuth = vi.fn();

vi.mock("../src/firebase-auth.js", () => ({
  createFirebaseAuth: (...args: unknown[]) => mockCreateFirebaseAuth(...args),
}));

const mockApp = { type: "mock-app" } as unknown as FirebaseApp;

describe("createAppAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    mockCreateFirebaseAuth.mockReturnValue({ type: "mock-auth-result" });
  });

  it("passes emulatorHost option when VITE_AUTH_EMULATOR_HOST is set", async () => {
    vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "localhost:9099");
    const { createAppAuth } = await import("../src/app-auth");
    createAppAuth(mockApp);
    expect(mockCreateFirebaseAuth).toHaveBeenCalledWith(mockApp, {
      emulatorHost: "localhost:9099",
    });
  });

  it("passes undefined options when VITE_AUTH_EMULATOR_HOST is not set", async () => {
    vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "");
    const { createAppAuth } = await import("../src/app-auth");
    createAppAuth(mockApp);
    expect(mockCreateFirebaseAuth).toHaveBeenCalledWith(mockApp, undefined);
  });

  it("returns the result from createFirebaseAuth", async () => {
    vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "");
    const { createAppAuth } = await import("../src/app-auth");
    const result = createAppAuth(mockApp);
    expect(result).toEqual({ type: "mock-auth-result" });
  });

  it("exposes signIn, signOut, and onAuthStateChanged as the app-facing API", async () => {
    const mockSignIn = vi.fn();
    const mockSignOut = vi.fn();
    const mockOnAuthStateChanged = vi.fn();
    mockCreateFirebaseAuth.mockReturnValue({
      signIn: mockSignIn,
      signOut: mockSignOut,
      onAuthStateChanged: mockOnAuthStateChanged,
    });
    vi.stubEnv("VITE_AUTH_EMULATOR_HOST", "");
    const { createAppAuth } = await import("../src/app-auth");
    const result = createAppAuth(mockApp);

    expect(result).toHaveProperty("signIn", mockSignIn);
    expect(result).toHaveProperty("signOut", mockSignOut);
    expect(result).toHaveProperty("onAuthStateChanged", mockOnAuthStateChanged);
  });
});
