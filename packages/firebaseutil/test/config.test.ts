import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  // Set valid env vars by default
  import.meta.env.VITE_FIREBASE_API_KEY = "test-api-key";
  import.meta.env.VITE_RECAPTCHA_SITE_KEY = "test-recaptcha-key";
});

describe("firebaseConfig", () => {
  it("reads apiKey from VITE_FIREBASE_API_KEY", async () => {
    import.meta.env.VITE_FIREBASE_API_KEY = "my-api-key";
    const { firebaseConfig } = await import("../src/config");
    expect(firebaseConfig.apiKey).toBe("my-api-key");
  });

  it("has projectId", async () => {
    const { firebaseConfig } = await import("../src/config");
    expect(firebaseConfig.projectId).toBe("commons-systems");
  });

  it("has authDomain fallback in Node.js", async () => {
    const { firebaseConfig } = await import("../src/config");
    expect(firebaseConfig.authDomain).toBe(
      "commons-systems.firebaseapp.com",
    );
  });

  it("has storageBucket", async () => {
    const { firebaseConfig } = await import("../src/config");
    expect(firebaseConfig.storageBucket).toBe(
      "commons-systems.firebasestorage.app",
    );
  });

  it("throws when VITE_FIREBASE_API_KEY is missing", async () => {
    delete import.meta.env.VITE_FIREBASE_API_KEY;
    await expect(() => import("../src/config")).rejects.toThrow(
      "VITE_FIREBASE_API_KEY is required",
    );
  });
});

describe("RECAPTCHA_SITE_KEY", () => {
  it("reads from VITE_RECAPTCHA_SITE_KEY", async () => {
    import.meta.env.VITE_RECAPTCHA_SITE_KEY = "my-recaptcha-key";
    const { RECAPTCHA_SITE_KEY } = await import("../src/config");
    expect(RECAPTCHA_SITE_KEY).toBe("my-recaptcha-key");
  });

  it("throws when VITE_RECAPTCHA_SITE_KEY is missing", async () => {
    delete import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    await expect(() => import("../src/config")).rejects.toThrow(
      "VITE_RECAPTCHA_SITE_KEY is required",
    );
  });
});
