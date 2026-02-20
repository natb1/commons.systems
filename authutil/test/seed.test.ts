import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedAuthUser, AuthUser } from "../src/seed";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("seedAuthUser", () => {
  const emulatorHost = "localhost:9099";
  const user: AuthUser = {
    email: "test@example.com",
    password: "secret123",
    displayName: "Test User",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POSTs user data to the emulator signUp endpoint", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await seedAuthUser(emulatorHost, user);

    expect(mockFetch).toHaveBeenCalledWith(
      `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      },
    );
  });

  it("silently ignores EMAIL_EXISTS errors (idempotent)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "EMAIL_EXISTS" } }),
    });

    await expect(seedAuthUser(emulatorHost, user)).resolves.toBeUndefined();
  });

  it("throws a descriptive error for other failures", async () => {
    const errorBody = { error: { message: "INVALID_EMAIL" } };
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => errorBody,
    });

    await expect(seedAuthUser(emulatorHost, user)).rejects.toThrow(
      "Failed to seed auth user",
    );
    await expect(seedAuthUser(emulatorHost, user)).rejects.toThrow(
      "INVALID_EMAIL",
    );
  });
});
