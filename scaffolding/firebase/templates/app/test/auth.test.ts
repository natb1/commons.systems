import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateAppAuth = vi.fn();

vi.mock("@commons-systems/authutil/app-auth", () => ({
  createAppAuth: (...args: unknown[]) => mockCreateAppAuth(...args),
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
    mockCreateAppAuth.mockReturnValue(mockResult);
  });

  it("calls createAppAuth with app", async () => {
    await import("../src/auth");

    expect(mockCreateAppAuth).toHaveBeenCalledWith({ type: "mock-app" });
  });

  it("re-exports signIn, signOut, onAuthStateChanged", async () => {
    const mod = await import("../src/auth");

    expect(mod.signIn).toBe(mockResult.signIn);
    expect(mod.signOut).toBe(mockResult.signOut);
    expect(mod.onAuthStateChanged).toBe(mockResult.onAuthStateChanged);
  });
});
