import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApp = { name: "test-app" };
const mockDb = { type: "firestore" };
const mockStorage = { type: "storage" };
const mockAppCheck = { type: "app-check" };
const mockTrackPageView = vi.fn();

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => mockApp),
}));

const mockLocalCache = { type: "persistent-local-cache" };

vi.mock("firebase/firestore", () => ({
  initializeFirestore: vi.fn(() => mockDb),
  persistentLocalCache: vi.fn(() => mockLocalCache),
  connectFirestoreEmulator: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve()),
  Timestamp: { now: vi.fn() },
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => mockStorage),
  connectStorageEmulator: vi.fn(),
}));

vi.mock("firebase/app-check", () => ({
  initializeAppCheck: vi.fn(() => mockAppCheck),
  ReCaptchaEnterpriseProvider: vi.fn(),
  getToken: vi.fn(() => Promise.resolve({ token: "test-token" })),
}));

vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  validateNamespace: vi.fn((ns: string) => ns),
  nsCollectionPath: vi.fn((ns: string, col: string) => `${ns}/${col}`),
}));

vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
  registerErrorSink: vi.fn(),
}));

vi.mock("@commons-systems/analyticsutil", () => ({
  initAnalyticsSafe: vi.fn(() => mockTrackPageView),
}));

vi.mock("../src/config.js", () => ({
  firebaseConfig: { projectId: "test-project", apiKey: "test-key" },
}));

async function loadModule() {
  const mod = await import("../src/app-context.js");
  return { createAppContext: mod.createAppContext };
}

async function loadMocks() {
  const { initializeApp } = await import("firebase/app");
  const { initializeFirestore, persistentLocalCache, connectFirestoreEmulator } = await import("firebase/firestore");
  const { connectStorageEmulator } = await import("firebase/storage");
  const { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } = await import("firebase/app-check");
  const { validateNamespace } = await import(
    "@commons-systems/firestoreutil/namespace"
  );
  return {
    initializeApp: initializeApp as ReturnType<typeof vi.fn>,
    initializeFirestore: initializeFirestore as ReturnType<typeof vi.fn>,
    persistentLocalCache: persistentLocalCache as ReturnType<typeof vi.fn>,
    connectFirestoreEmulator:
      connectFirestoreEmulator as ReturnType<typeof vi.fn>,
    connectStorageEmulator: connectStorageEmulator as ReturnType<typeof vi.fn>,
    initializeAppCheck: initializeAppCheck as ReturnType<typeof vi.fn>,
    ReCaptchaEnterpriseProvider: ReCaptchaEnterpriseProvider as ReturnType<typeof vi.fn>,
    getToken: getToken as ReturnType<typeof vi.fn>,
    validateNamespace: validateNamespace as ReturnType<typeof vi.fn>,
  };
}

describe("createAppContext", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.stubEnv("MODE", "production");
  });

  it("returns correct shape without storage option", async () => {
    const { createAppContext } = await loadModule();
    const ctx = createAppContext("myapp", "app-id-123");

    expect(ctx).toHaveProperty("app", mockApp);
    expect(ctx).toHaveProperty("db", mockDb);
    expect(ctx).toHaveProperty("NAMESPACE");
    expect(ctx).toHaveProperty("trackPageView", mockTrackPageView);
    expect(ctx).not.toHaveProperty("storage");
    expect(ctx).not.toHaveProperty("STORAGE_NAMESPACE");
  });

  it("initializes Firestore with persistentLocalCache when no emulator", async () => {
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123");

    expect(mocks.persistentLocalCache).toHaveBeenCalledWith({});
    expect(mocks.initializeFirestore).toHaveBeenCalledWith(mockApp, {
      localCache: mockLocalCache,
    });
  });

  it("skips persistentLocalCache when emulator host is set", async () => {
    vi.stubEnv("VITE_FIRESTORE_EMULATOR_HOST", "localhost:8080");
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123");

    expect(mocks.persistentLocalCache).not.toHaveBeenCalled();
    expect(mocks.initializeFirestore).toHaveBeenCalledWith(mockApp, {});
  });

  it("returns correct shape with storage module", async () => {
    const { createAppContext } = await loadModule();
    const { getStorage, connectStorageEmulator } = await import(
      "firebase/storage"
    );
    const ctx = createAppContext("myapp", "app-id-123", {
      recaptchaSiteKey: "test-key",
      storageModule: { getStorage, connectStorageEmulator },
    });

    expect(ctx).toHaveProperty("app", mockApp);
    expect(ctx).toHaveProperty("db", mockDb);
    expect(ctx).toHaveProperty("NAMESPACE");
    expect(ctx).toHaveProperty("trackPageView", mockTrackPageView);
    expect(ctx).toHaveProperty("storage", mockStorage);
    expect(ctx).toHaveProperty("STORAGE_NAMESPACE", "myapp/prod");
  });

  it("throws in non-production mode when VITE_FIRESTORE_NAMESPACE is missing", async () => {
    vi.stubEnv("MODE", "development");
    const { createAppContext } = await loadModule();

    expect(() => createAppContext("myapp", "app-id-123")).toThrow(
      "VITE_FIRESTORE_NAMESPACE is required in dev/preview mode",
    );
  });

  it("defaults namespace to {appName}/prod in production mode when env var not set", async () => {
    const { createAppContext } = await loadModule();
    const ctx = createAppContext("myapp", "app-id-123");

    expect(ctx.NAMESPACE).toBe("myapp/prod");
  });

  it("uses VITE_FIRESTORE_NAMESPACE when set", async () => {
    vi.stubEnv("VITE_FIRESTORE_NAMESPACE", "myapp/preview-pr-42");
    const { createAppContext } = await loadModule();
    const ctx = createAppContext("myapp", "app-id-123");

    expect(ctx.NAMESPACE).toBe("myapp/preview-pr-42");
  });

  it("connects Firestore emulator when VITE_FIRESTORE_EMULATOR_HOST is set", async () => {
    vi.stubEnv("VITE_FIRESTORE_EMULATOR_HOST", "localhost:8080");
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123");

    expect(mocks.connectFirestoreEmulator).toHaveBeenCalledWith(
      mockDb,
      "localhost",
      8080,
    );
  });

  it("connects Storage emulator when VITE_STORAGE_EMULATOR_HOST is set and storage module provided", async () => {
    vi.stubEnv("VITE_STORAGE_EMULATOR_HOST", "localhost:9199");
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();
    const { getStorage, connectStorageEmulator } = await import(
      "firebase/storage"
    );

    createAppContext("myapp", "app-id-123", {
      recaptchaSiteKey: "test-key",
      storageModule: { getStorage, connectStorageEmulator },
    });

    expect(mocks.connectStorageEmulator).toHaveBeenCalledWith(
      mockStorage,
      "localhost",
      9199,
    );
  });

  it("throws on invalid emulator port", async () => {
    vi.stubEnv("VITE_FIRESTORE_EMULATOR_HOST", "localhost");
    const { createAppContext } = await loadModule();

    expect(() => createAppContext("myapp", "app-id-123")).toThrow(
      'Invalid emulator port in VITE_FIRESTORE_EMULATOR_HOST: "localhost"',
    );
  });

  it("passes measurementId when VITE_GA_MEASUREMENT_ID is set", async () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TESTID");
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123");

    expect(mocks.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ measurementId: "G-TESTID" }),
    );
  });

  it("calls validateNamespace with the resolved namespace", async () => {
    vi.stubEnv("VITE_FIRESTORE_NAMESPACE", "myapp/staging");
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123");

    expect(mocks.validateNamespace).toHaveBeenCalledWith("myapp/staging");
  });

  it("initializes AppCheck with ReCaptchaEnterpriseProvider when recaptchaSiteKey provided", async () => {
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123", { recaptchaSiteKey: "test-site-key" });

    expect(mocks.ReCaptchaEnterpriseProvider).toHaveBeenCalledWith("test-site-key");
    expect(mocks.initializeAppCheck).toHaveBeenCalledWith(
      mockApp,
      expect.objectContaining({
        provider: expect.any(Object),
        isTokenAutoRefreshEnabled: true,
      }),
    );
  });

  it("sets FIREBASE_APPCHECK_DEBUG_TOKEN when VITE_APP_CHECK_DEBUG_TOKEN is set", async () => {
    vi.stubEnv("VITE_APP_CHECK_DEBUG_TOKEN", "debug-token-123");
    vi.stubGlobal("self", globalThis);
    const { createAppContext } = await loadModule();

    createAppContext("myapp", "app-id-123", { recaptchaSiteKey: "test-key" });

    expect((globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN).toBe("debug-token-123");
    delete (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN;
  });

  it("skips AppCheck when emulator host is set", async () => {
    vi.stubEnv("VITE_FIRESTORE_EMULATOR_HOST", "localhost:8080");
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123", { recaptchaSiteKey: "test-key" });

    expect(mocks.initializeAppCheck).not.toHaveBeenCalled();
  });

  it("skips AppCheck when no options provided", async () => {
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123");

    expect(mocks.initializeAppCheck).not.toHaveBeenCalled();
  });

  it("getAppCheckHeaders is undefined when AppCheck not initialized", async () => {
    const { createAppContext } = await loadModule();

    const ctx = createAppContext("myapp", "app-id-123");

    expect(ctx.getAppCheckHeaders).toBeUndefined();
  });

  it("getAppCheckHeaders returns header function when AppCheck initialized", async () => {
    const { createAppContext } = await loadModule();

    const ctx = createAppContext("myapp", "app-id-123", { recaptchaSiteKey: "test-key" });

    expect(ctx.getAppCheckHeaders).toBeTypeOf("function");
    const headers = await ctx.getAppCheckHeaders!();
    expect(headers).toEqual({ "X-Firebase-AppCheck": "test-token" });
  });

  it("throws when recaptchaSiteKey is empty string", async () => {
    const { createAppContext } = await loadModule();

    expect(() =>
      createAppContext("myapp", "app-id-123", { recaptchaSiteKey: "" }),
    ).toThrow("recaptchaSiteKey must not be empty");
  });

  it("catches initializeAppCheck failure and returns undefined getAppCheckHeaders", async () => {
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();
    mocks.initializeAppCheck.mockImplementation(() => {
      throw new Error("blocked by ad blocker");
    });
    const { logError } = await import("@commons-systems/errorutil/log");

    const ctx = createAppContext("myapp", "app-id-123", { recaptchaSiteKey: "test-key" });

    expect(ctx.getAppCheckHeaders).toBeUndefined();
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      { operation: "appcheck-init" },
    );
  });

  it("getAppCheckHeaders returns empty object when getToken fails", async () => {
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();
    mocks.initializeAppCheck.mockReturnValue(mockAppCheck);
    mocks.getToken.mockRejectedValue(new Error("reCAPTCHA challenge failed"));
    const { logError } = await import("@commons-systems/errorutil/log");

    const ctx = createAppContext("myapp", "app-id-123", { recaptchaSiteKey: "test-key" });

    expect(ctx.getAppCheckHeaders).toBeTypeOf("function");
    const headers = await ctx.getAppCheckHeaders!();
    expect(headers).toEqual({});
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      { operation: "appcheck-token" },
    );
  });

  describe("deferAppCheck", () => {
    it("getAppCheckHeaders is a function that returns {} before initAppCheck is called", async () => {
      const { createAppContext } = await loadModule();

      const ctx = createAppContext("myapp", "app-id-123", {
        recaptchaSiteKey: "test-key",
        deferAppCheck: true,
      });

      expect(ctx.getAppCheckHeaders).toBeTypeOf("function");
      expect(ctx.initAppCheck).toBeTypeOf("function");
      const headers = await ctx.getAppCheckHeaders!();
      expect(headers).toEqual({});
    });

    it("getAppCheckHeaders returns token header after initAppCheck resolves", async () => {
      const { createAppContext } = await loadModule();
      const mocks = await loadMocks();
      mocks.initializeAppCheck.mockReturnValue(mockAppCheck);
      mocks.getToken.mockResolvedValue({ token: "test-token" });

      const ctx = createAppContext("myapp", "app-id-123", {
        recaptchaSiteKey: "test-key",
        deferAppCheck: true,
      });

      expect(mocks.initializeAppCheck).not.toHaveBeenCalled();

      await ctx.initAppCheck!();

      expect(mocks.initializeAppCheck).toHaveBeenCalledTimes(1);
      const headers = await ctx.getAppCheckHeaders!();
      expect(headers).toEqual({ "X-Firebase-AppCheck": "test-token" });
    });

    it("initAppCheck is idempotent — second call does not re-initialize", async () => {
      const { createAppContext } = await loadModule();
      const mocks = await loadMocks();
      mocks.initializeAppCheck.mockReturnValue(mockAppCheck);

      const ctx = createAppContext("myapp", "app-id-123", {
        recaptchaSiteKey: "test-key",
        deferAppCheck: true,
      });

      await ctx.initAppCheck!();
      await ctx.initAppCheck!();

      expect(mocks.initializeAppCheck).toHaveBeenCalledTimes(1);
    });

    it("initAppCheck is undefined when deferAppCheck is not set", async () => {
      const { createAppContext } = await loadModule();

      const ctx = createAppContext("myapp", "app-id-123", {
        recaptchaSiteKey: "test-key",
      });

      expect(ctx.initAppCheck).toBeUndefined();
    });

    it("initAppCheck is undefined when deferAppCheck is true but no recaptchaSiteKey", async () => {
      const { createAppContext } = await loadModule();

      const ctx = createAppContext("myapp", "app-id-123", {
        deferAppCheck: true,
      });

      expect(ctx.initAppCheck).toBeUndefined();
      // getAppCheckHeaders is still a function (returns {} always) so callers
      // that capture the reference at module init time get a safe no-op.
      expect(ctx.getAppCheckHeaders).toBeTypeOf("function");
      const headers = await ctx.getAppCheckHeaders!();
      expect(headers).toEqual({});
    });

    it("deduplicates concurrent getAppCheckHeaders calls into single getToken call", async () => {
      const { createAppContext } = await loadModule();
      const mocks = await loadMocks();
      mocks.initializeAppCheck.mockReturnValue(mockAppCheck);
      mocks.getToken.mockResolvedValue({ token: "test-token" });

      const ctx = createAppContext("myapp", "app-id-123", {
        recaptchaSiteKey: "test-key",
        deferAppCheck: true,
      });

      await ctx.initAppCheck!();

      const [h1, h2, h3] = await Promise.all([
        ctx.getAppCheckHeaders!(),
        ctx.getAppCheckHeaders!(),
        ctx.getAppCheckHeaders!(),
      ]);

      expect(mocks.getToken).toHaveBeenCalledTimes(1);
      expect(h1).toEqual({ "X-Firebase-AppCheck": "test-token" });
      expect(h2).toEqual({ "X-Firebase-AppCheck": "test-token" });
      expect(h3).toEqual({ "X-Firebase-AppCheck": "test-token" });
    });

    it("caches getToken failure and skips retry within cooldown", async () => {
      const { createAppContext } = await loadModule();
      const mocks = await loadMocks();
      mocks.initializeAppCheck.mockReturnValue(mockAppCheck);
      mocks.getToken.mockRejectedValue(new Error("reCAPTCHA challenge failed"));

      const ctx = createAppContext("myapp", "app-id-123", {
        recaptchaSiteKey: "test-key",
        deferAppCheck: true,
      });

      await ctx.initAppCheck!();

      const headers1 = await ctx.getAppCheckHeaders!();
      expect(headers1).toEqual({});

      const headers2 = await ctx.getAppCheckHeaders!();
      expect(headers2).toEqual({});

      expect(mocks.getToken).toHaveBeenCalledTimes(1);
    });

    it("retries getToken after cooldown expires", async () => {
      vi.useFakeTimers();
      try {
        const { createAppContext } = await loadModule();
        const mocks = await loadMocks();
        mocks.initializeAppCheck.mockReturnValue(mockAppCheck);
        mocks.getToken
          .mockRejectedValueOnce(new Error("reCAPTCHA challenge failed"))
          .mockResolvedValueOnce({ token: "retry-token" });

        const ctx = createAppContext("myapp", "app-id-123", {
          recaptchaSiteKey: "test-key",
          deferAppCheck: true,
        });

        await ctx.initAppCheck!();

        const headers1 = await ctx.getAppCheckHeaders!();
        expect(headers1).toEqual({});

        vi.advanceTimersByTime(5 * 60 * 1000 + 1);

        const headers2 = await ctx.getAppCheckHeaders!();
        expect(headers2).toEqual({ "X-Firebase-AppCheck": "retry-token" });

        expect(mocks.getToken).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it("includes getAppCheckHeaders in storage context", async () => {
    const { createAppContext } = await loadModule();
    const mocks = await loadMocks();
    mocks.initializeAppCheck.mockReturnValue(mockAppCheck);
    const { getStorage, connectStorageEmulator } = await import(
      "firebase/storage"
    );

    const ctx = createAppContext("myapp", "app-id-123", {
      recaptchaSiteKey: "test-key",
      storageModule: { getStorage, connectStorageEmulator },
    });

    expect(ctx.getAppCheckHeaders).toBeTypeOf("function");
  });
});
