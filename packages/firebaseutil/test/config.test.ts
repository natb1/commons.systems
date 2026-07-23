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

describe("getRecaptchaSiteKey", () => {
  it("reads from VITE_RECAPTCHA_SITE_KEY on call", async () => {
    import.meta.env.VITE_RECAPTCHA_SITE_KEY = "my-recaptcha-key";
    const { getRecaptchaSiteKey } = await import("../src/config");
    expect(getRecaptchaSiteKey()).toBe("my-recaptcha-key");
  });

  it("does NOT throw at import when VITE_RECAPTCHA_SITE_KEY is missing", async () => {
    delete import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    // Importing the config must succeed for apps that never enable App Check;
    // the requirement is deferred to the getter.
    await expect(import("../src/config")).resolves.toHaveProperty(
      "getRecaptchaSiteKey",
    );
  });

  it("throws when called and VITE_RECAPTCHA_SITE_KEY is missing", async () => {
    delete import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    const { getRecaptchaSiteKey } = await import("../src/config");
    expect(() => getRecaptchaSiteKey()).toThrow("VITE_RECAPTCHA_SITE_KEY is required");
  });
});
