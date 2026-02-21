import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedAuthUser, AuthUser } from "../src/seed";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("seedAuthUser", () => {
  const emulatorHost = "localhost:9099";
  const user: AuthUser = {
    localId: "test-user-id",
    email: "test@example.com",
    displayName: "Test User",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates user via admin API then links GitHub provider", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await seedAuthUser(emulatorHost, user);

    expect(mockFetch).toHaveBeenCalledTimes(2);

    // First call: create user
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/projects/commons-systems/accounts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer owner",
        },
        body: JSON.stringify({
          localId: user.localId,
          email: user.email,
          displayName: user.displayName,
        }),
      },
    );

    // Second call: link GitHub provider
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/projects/commons-systems/accounts:update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer owner",
        },
        body: JSON.stringify({
          localId: user.localId,
          linkProviderUserInfo: {
            providerId: "github.com",
            rawId: user.localId,
            email: user.email,
            displayName: user.displayName,
          },
        }),
      },
    );
  });

  it("silently ignores DUPLICATE_LOCAL_ID errors (idempotent)", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "DUPLICATE_LOCAL_ID" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    await expect(seedAuthUser(emulatorHost, user)).resolves.toBeUndefined();
  });

  it("throws a descriptive error for create failures", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "INVALID_EMAIL" } }),
    });

    await expect(seedAuthUser(emulatorHost, user)).rejects.toThrow(
      "Failed to create auth user",
    );
  });

  it("throws a descriptive error for link provider failures", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "USER_NOT_FOUND" } }),
      });

    await expect(seedAuthUser(emulatorHost, user)).rejects.toThrow(
      "Failed to link GitHub provider",
    );
  });
});
