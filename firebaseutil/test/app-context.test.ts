import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApp = { name: "test-app" };
const mockDb = { type: "firestore" };
const mockStorage = { type: "storage" };
const mockTrackPageView = vi.fn();

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => mockApp),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => mockDb),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => mockStorage),
  connectStorageEmulator: vi.fn(),
}));

vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  validateNamespace: vi.fn((ns: string) => ns),
}));

vi.mock("@commons-systems/analyticsutil", () => ({
  initAnalyticsSafe: vi.fn(() => mockTrackPageView),
}));

vi.mock("../src/config.js", () => ({
  firebaseConfig: { projectId: "test-project", apiKey: "test-key" },
}));

async function loadModule() {
  const mod = await import("../src/app-context.js");
  return mod.createAppContext;
}

async function loadMocks() {
  const { initializeApp } = await import("firebase/app");
  const { connectFirestoreEmulator } = await import("firebase/firestore");
  const { connectStorageEmulator } = await import("firebase/storage");
  const { validateNamespace } = await import(
    "@commons-systems/firestoreutil/namespace"
  );
  return {
    initializeApp: initializeApp as ReturnType<typeof vi.fn>,
    connectFirestoreEmulator:
      connectFirestoreEmulator as ReturnType<typeof vi.fn>,
    connectStorageEmulator: connectStorageEmulator as ReturnType<typeof vi.fn>,
    validateNamespace: validateNamespace as ReturnType<typeof vi.fn>,
  };
}

describe("createAppContext", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("MODE", "production");
  });

  it("returns correct shape without storage option", async () => {
    const createAppContext = await loadModule();
    const ctx = createAppContext("myapp", "app-id-123");

    expect(ctx).toHaveProperty("app", mockApp);
    expect(ctx).toHaveProperty("db", mockDb);
    expect(ctx).toHaveProperty("NAMESPACE");
    expect(ctx).toHaveProperty("trackPageView", mockTrackPageView);
    expect(ctx).not.toHaveProperty("storage");
    expect(ctx).not.toHaveProperty("STORAGE_NAMESPACE");
  });

  it("returns correct shape with storage module", async () => {
    const createAppContext = await loadModule();
    const { getStorage, connectStorageEmulator } = await import(
      "firebase/storage"
    );
    const ctx = createAppContext("myapp", "app-id-123", {
      getStorage,
      connectStorageEmulator,
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
    const createAppContext = await loadModule();

    expect(() => createAppContext("myapp", "app-id-123")).toThrow(
      "VITE_FIRESTORE_NAMESPACE is required in dev/preview mode",
    );
  });

  it("defaults namespace to {appName}/prod in production mode when env var not set", async () => {
    const createAppContext = await loadModule();
    const ctx = createAppContext("myapp", "app-id-123");

    expect(ctx.NAMESPACE).toBe("myapp/prod");
  });

  it("uses VITE_FIRESTORE_NAMESPACE when set", async () => {
    vi.stubEnv("VITE_FIRESTORE_NAMESPACE", "myapp/preview-pr-42");
    const createAppContext = await loadModule();
    const ctx = createAppContext("myapp", "app-id-123");

    expect(ctx.NAMESPACE).toBe("myapp/preview-pr-42");
  });

  it("connects Firestore emulator when VITE_FIRESTORE_EMULATOR_HOST is set", async () => {
    vi.stubEnv("VITE_FIRESTORE_EMULATOR_HOST", "localhost:8080");
    const createAppContext = await loadModule();
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
    const createAppContext = await loadModule();
    const mocks = await loadMocks();
    const { getStorage, connectStorageEmulator } = await import(
      "firebase/storage"
    );

    createAppContext("myapp", "app-id-123", {
      getStorage,
      connectStorageEmulator,
    });

    expect(mocks.connectStorageEmulator).toHaveBeenCalledWith(
      mockStorage,
      "localhost",
      9199,
    );
  });

  it("throws on invalid emulator port", async () => {
    vi.stubEnv("VITE_FIRESTORE_EMULATOR_HOST", "localhost");
    const createAppContext = await loadModule();

    expect(() => createAppContext("myapp", "app-id-123")).toThrow(
      'Invalid emulator port in VITE_FIRESTORE_EMULATOR_HOST: "localhost"',
    );
  });

  it("passes measurementId when VITE_GA_MEASUREMENT_ID is set", async () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TESTID");
    const createAppContext = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123");

    expect(mocks.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ measurementId: "G-TESTID" }),
    );
  });

  it("calls validateNamespace with the resolved namespace", async () => {
    vi.stubEnv("VITE_FIRESTORE_NAMESPACE", "myapp/staging");
    const createAppContext = await loadModule();
    const mocks = await loadMocks();

    createAppContext("myapp", "app-id-123");

    expect(mocks.validateNamespace).toHaveBeenCalledWith("myapp/staging");
  });
});
