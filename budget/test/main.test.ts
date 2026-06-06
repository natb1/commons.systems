import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@commons-systems/router", () => ({
  createHistoryRouter: () => ({ navigate: vi.fn(), destroy: vi.fn(), showTerminalError: vi.fn() }),
  parsePath: () => ({ path: "/", params: new URLSearchParams() }),
}));
vi.mock("../src/pages/home.js", () => ({ renderHome: vi.fn().mockResolvedValue("<div>home</div>") }));
vi.mock("@commons-systems/components/nav", () => ({}));
vi.mock("@commons-systems/htmlutil", () => ({ escapeHtml: (s: string) => s }));
vi.mock("../src/pages/home-hydrate.js", () => ({ hydrateTransactionTable: vi.fn() }));
vi.mock("../src/pages/home-chart.js", () => ({ hydrateCategorySankey: vi.fn() }));
vi.mock("../src/pages/budgets.js", () => ({ renderBudgets: vi.fn().mockResolvedValue("<div>budgets</div>") }));
vi.mock("../src/pages/budgets-hydrate.js", () => ({ hydrateBudgetTable: vi.fn(), hydrateBudgetChart: vi.fn() }));
vi.mock("../src/pages/rules.js", () => ({ renderRules: vi.fn().mockResolvedValue("<div>rules</div>") }));
vi.mock("../src/pages/rules-hydrate.js", () => ({ hydrateRulesTable: vi.fn() }));
vi.mock("../src/pages/hero.js", () => ({ renderHero: vi.fn().mockReturnValue("<div>hero</div>") }));
vi.mock("@commons-systems/components/hero", () => ({ hydrateHero: vi.fn(), mountHero: vi.fn() }));
vi.mock("@commons-systems/components/autocomplete", () => ({
  showDropdown: vi.fn(),
  removeDropdown: vi.fn(),
  registerAutocompleteListeners: vi.fn(),
  _resetForTest: vi.fn(),
}));
vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "app/test",
  trackPageView: vi.fn(),
  initAppCheck: vi.fn(() => Promise.resolve()),
}));

const mockGetMeta = vi.fn();
const mockStoreParsedData = vi.fn();
const mockClearAll = vi.fn();
const mockGetFileHandle = vi.fn();
const mockPutFileHandle = vi.fn();
const mockClearFileHandle = vi.fn();

const mockIsFsaSupported = vi.fn();
const mockPickBencFile = vi.fn();
const mockQueryReadWritePermission = vi.fn();
const mockRequestReadWritePermission = vi.fn();
const mockReadFileFromHandle = vi.fn();

const mockConfigureFileSync = vi.fn();
const mockFlushWriteBack = vi.fn();
const mockResetFileSync = vi.fn();
const mockGetSyncHandle = vi.fn();
const mockGetLastSyncedModified = vi.fn();

const mockIsEncrypted = vi.fn();
const mockDecrypt = vi.fn();
const mockEncrypt = vi.fn();

vi.mock("../src/idb.js", () => ({
  getMeta: mockGetMeta,
  storeParsedData: mockStoreParsedData,
  clearAll: mockClearAll,
  getFileHandle: mockGetFileHandle,
  putFileHandle: mockPutFileHandle,
  clearFileHandle: mockClearFileHandle,
}));

vi.mock("../src/local-file.js", () => ({
  isFsaSupported: mockIsFsaSupported,
  pickBencFile: mockPickBencFile,
  queryReadWritePermission: mockQueryReadWritePermission,
  requestReadWritePermission: mockRequestReadWritePermission,
  readFileFromHandle: mockReadFileFromHandle,
}));

vi.mock("../src/upload.js", () => ({
  parseUploadedJson: vi.fn(),
  toParsedData: vi.fn(),
  UploadValidationError: class extends Error {
    constructor(msg: string) { super(msg); this.name = "UploadValidationError"; }
  },
}));

vi.mock("../src/data-source.js", () => ({
  SeedDataSource: class { getTransactions() { return []; } },
  IdbDataSource: class { getTransactions() { return []; } },
  FileSyncingDataSource: class { constructor(public inner: unknown) {} getTransactions() { return []; } },
}));

vi.mock("../src/file-sync.js", () => ({
  configureFileSync: mockConfigureFileSync,
  flushWriteBack: mockFlushWriteBack,
  resetFileSync: mockResetFileSync,
  getSyncHandle: mockGetSyncHandle,
  getLastSyncedModified: mockGetLastSyncedModified,
}));

vi.mock("../src/crypto.js", () => ({
  isEncrypted: mockIsEncrypted,
  decrypt: mockDecrypt,
  encrypt: mockEncrypt,
}));

vi.mock("../src/active-data-source.js", () => ({
  setActiveDataSource: vi.fn(),
}));

function resetAndMockAll(): void {
  vi.resetModules();
  document.body.innerHTML = '<div id="nav"><span class="nav-auth"></span></div><div id="hero-container"></div><div id="app"></div>';

  vi.mock("@commons-systems/router", () => ({
    createHistoryRouter: () => ({ navigate: vi.fn(), destroy: vi.fn(), showTerminalError: vi.fn() }),
    parsePath: () => ({ path: "/", params: new URLSearchParams() }),
  }));
  vi.mock("../src/pages/home.js", () => ({ renderHome: vi.fn().mockResolvedValue("<div>home</div>") }));
  vi.mock("@commons-systems/components/nav", () => ({}));
  vi.mock("@commons-systems/htmlutil", () => ({ escapeHtml: (s: string) => s }));
  vi.mock("../src/pages/home-hydrate.js", () => ({ hydrateTransactionTable: vi.fn() }));
  vi.mock("../src/pages/budgets.js", () => ({ renderBudgets: vi.fn().mockResolvedValue("<div>budgets</div>") }));
  vi.mock("../src/pages/budgets-hydrate.js", () => ({ hydrateBudgetTable: vi.fn(), hydrateBudgetChart: vi.fn() }));
  vi.mock("../src/pages/rules.js", () => ({ renderRules: vi.fn().mockResolvedValue("<div>rules</div>") }));
  vi.mock("../src/pages/rules-hydrate.js", () => ({ hydrateRulesTable: vi.fn() }));
  vi.mock("@commons-systems/components/autocomplete", () => ({
    showDropdown: vi.fn(), removeDropdown: vi.fn(), registerAutocompleteListeners: vi.fn(), _resetForTest: vi.fn(),
  }));
  vi.mock("../src/firebase.js", () => ({
    db: { type: "mock-firestore" }, NAMESPACE: "app/test", trackPageView: vi.fn(),
    initAppCheck: vi.fn(() => Promise.resolve()),
  }));
  vi.mock("../src/idb.js", () => ({
    getMeta: mockGetMeta, storeParsedData: mockStoreParsedData, clearAll: mockClearAll,
    getFileHandle: mockGetFileHandle, putFileHandle: mockPutFileHandle, clearFileHandle: mockClearFileHandle,
  }));
  vi.mock("../src/local-file.js", () => ({
    isFsaSupported: mockIsFsaSupported,
    pickBencFile: mockPickBencFile,
    queryReadWritePermission: mockQueryReadWritePermission,
    requestReadWritePermission: mockRequestReadWritePermission,
    readFileFromHandle: mockReadFileFromHandle,
  }));
  vi.mock("../src/upload.js", () => ({
    parseUploadedJson: vi.fn(), toParsedData: vi.fn(),
    UploadValidationError: class extends Error { constructor(msg: string) { super(msg); this.name = "UploadValidationError"; } },
  }));
  vi.mock("../src/data-source.js", () => ({
    SeedDataSource: class { getTransactions() { return []; } },
    IdbDataSource: class { getTransactions() { return []; } },
    FileSyncingDataSource: class { constructor(public inner: unknown) {} getTransactions() { return []; } },
  }));
  vi.mock("../src/file-sync.js", () => ({
    configureFileSync: mockConfigureFileSync,
    flushWriteBack: mockFlushWriteBack,
    resetFileSync: mockResetFileSync,
    getSyncHandle: mockGetSyncHandle,
    getLastSyncedModified: mockGetLastSyncedModified,
  }));
  vi.mock("../src/crypto.js", () => ({
    isEncrypted: mockIsEncrypted,
    decrypt: mockDecrypt,
    encrypt: mockEncrypt,
  }));
  vi.mock("../src/active-data-source.js", () => ({
    setActiveDataSource: vi.fn(),
  }));
}

// Set up DOM elements before dynamic import
document.body.innerHTML = '<div id="nav"><span class="nav-auth"></span></div><div id="hero-container"></div><div id="app"></div>';

type AppState = import("../src/main").AppState;

describe("main module", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Defaults: no persisted handle, FSA unsupported -> existing upload behavior.
    mockGetMeta.mockReset();
    mockStoreParsedData.mockReset();
    mockGetFileHandle.mockReset().mockResolvedValue(undefined);
    mockPutFileHandle.mockReset().mockResolvedValue(undefined);
    mockClearFileHandle.mockReset().mockResolvedValue(undefined);
    mockIsFsaSupported.mockReset().mockReturnValue(false);
    mockPickBencFile.mockReset().mockResolvedValue(null);
    mockQueryReadWritePermission.mockReset();
    mockRequestReadWritePermission.mockReset().mockResolvedValue("granted");
    mockReadFileFromHandle.mockReset();
    mockConfigureFileSync.mockReset();
    mockFlushWriteBack.mockReset().mockResolvedValue(undefined);
    mockResetFileSync.mockReset();
    mockGetSyncHandle.mockReset().mockReturnValue(null);
    mockGetLastSyncedModified.mockReset().mockReturnValue(null);
    // Default: plaintext files (no BENC header) — preserves the existing
    // upload/auto-load tests that pass a bare `{}` file.
    mockIsEncrypted.mockReset().mockReturnValue(false);
    mockDecrypt.mockReset();
    mockEncrypt.mockReset().mockResolvedValue(new ArrayBuffer(8));
  });

  it("exports AppState type (compile-time check)", () => {
    // TypeScript compile-time: verify AppState type can be used
    const seedState: AppState = { source: "seed" };
    const localState: AppState = { source: "local", groupName: "household" };
    expect(seedState.source).toBe("seed");
    expect(localState.source).toBe("local");
  });

  it("transitions to seed state when no local data exists — hero visible", async () => {
    mockGetMeta.mockResolvedValue(undefined);

    resetAndMockAll();

    await import("../src/main");

    // Wait for initialization to complete
    await new Promise(r => setTimeout(r, 0));

    expect(mockGetMeta).toHaveBeenCalled();
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(false);
  }, 15000);

  it("does not call initAppCheck before user interaction", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    const { initAppCheck } = await import("../src/firebase.js");
    expect(initAppCheck).not.toHaveBeenCalled();
  });

  it("calls initAppCheck on first user interaction", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    const { initAppCheck } = await import("../src/firebase.js");
    const mock = initAppCheck as ReturnType<typeof vi.fn>;
    const callsBefore = mock.mock.calls.length;

    window.dispatchEvent(new Event("click"));
    await new Promise(r => setTimeout(r, 0));
    const callsAfterFirst = mock.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(callsBefore);

    // Second interaction should not add more calls (listener removed)
    window.dispatchEvent(new Event("click"));
    await new Promise(r => setTimeout(r, 0));
    expect(mock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("transitions to local state when meta exists — hero hidden", async () => {
    mockGetMeta.mockResolvedValue({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });

    resetAndMockAll();

    await import("../src/main");

    // Wait for initialization to complete
    await new Promise(r => setTimeout(r, 0));

    expect(mockGetMeta).toHaveBeenCalled();
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(true);
  });

  it("auto-loads from a persisted handle when permission is granted", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc"));

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
    expect(mockStoreParsedData).toHaveBeenCalled();
  });

  it("shows a reload button (no auto-load) when permission is prompt, then loads on click", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("prompt");
    mockGetMeta.mockResolvedValue({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc"));

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    const button = document.querySelector(".reload-handle") as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(mockReadFileFromHandle).not.toHaveBeenCalled();

    mockRequestReadWritePermission.mockResolvedValue("granted");
    button.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockRequestReadWritePermission).toHaveBeenCalledWith(handle);
    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
  });

  it("clears a stale handle and shows a re-link error when the file is gone", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockRejectedValue(new DOMException("missing", "NotFoundError"));

    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockClearFileHandle).toHaveBeenCalled();
    const errorEl = document.querySelector(".nav-error") as HTMLElement;
    expect(errorEl.hidden).toBe(false);
    expect(errorEl.textContent).toContain("no longer available");
  });

  it("clears the persisted handle when the linked file fails content validation", async () => {
    const handle = { name: "wrong.json" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "wrong.json"));

    resetAndMockAll();

    const { parseUploadedJson, UploadValidationError } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new UploadValidationError("Not a valid budget file.");
    });

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // A bad file would otherwise be re-auto-loaded every startup; the handle is
    // dropped so the next session falls through to cached/seed instead.
    expect(mockClearFileHandle).toHaveBeenCalled();
    expect(mockStoreParsedData).not.toHaveBeenCalled();
    const errorEl = document.querySelector(".nav-error") as HTMLElement;
    expect(errorEl.hidden).toBe(false);
    expect(errorEl.textContent).toContain("Not a valid budget file.");
  });

  it("clears a denied handle and shows an unlinked notice, falling through to cached data", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("denied");
    mockGetMeta.mockResolvedValue({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });

    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockClearFileHandle).toHaveBeenCalled();
    expect(mockReadFileFromHandle).not.toHaveBeenCalled();
    // Cached data is still shown (local state -> hero hidden).
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(true);
    const errorEl = document.querySelector(".nav-error") as HTMLElement;
    expect(errorEl.hidden).toBe(false);
    expect(errorEl.textContent).toContain("denied");
  });

  it("reload button falls back to the picker when re-grant is still denied", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    const newHandle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("prompt");
    mockGetMeta.mockResolvedValue({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc"));

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    const button = document.querySelector(".reload-handle") as HTMLButtonElement;
    expect(button).not.toBeNull();

    // Re-grant is refused, so the click falls back to the FSA picker.
    mockRequestReadWritePermission.mockResolvedValue("denied");
    mockPickBencFile.mockResolvedValue(newHandle);
    button.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockRequestReadWritePermission).toHaveBeenCalledWith(handle);
    expect(mockPickBencFile).toHaveBeenCalled();
    expect(mockPutFileHandle).toHaveBeenCalledWith(newHandle);
    expect(mockReadFileFromHandle).toHaveBeenCalledWith(newHandle);
  });

  it("transitions to cached local state when no handle but meta exists (unchanged path)", async () => {
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });

    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(true);
    expect(mockReadFileFromHandle).not.toHaveBeenCalled();
  });

  it("arms write-back (configureFileSync) after a granted encrypted handle load", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc"));
    // Encrypted file: loadFromFile prompts for a password and sets importPassword.
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // The password dialog is open and awaiting input; enter a password and submit.
    const input = document.querySelector(".password-input") as HTMLInputElement;
    expect(input).not.toBeNull();
    input.value = "s3cret";
    const form = input.closest("form") as HTMLFormElement;
    form.requestSubmit();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockStoreParsedData).toHaveBeenCalled();
    expect(mockConfigureFileSync).toHaveBeenCalledWith(handle, "s3cret", expect.any(Number));
  });

  it("flushes a pending write-back on visibilitychange -> hidden", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    expect(mockFlushWriteBack).not.toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(mockFlushWriteBack).toHaveBeenCalled();
  });

  it("does not flush on visibilitychange when the tab is visible", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(mockFlushWriteBack).not.toHaveBeenCalled();
  });

  it("disarms write-back (resetFileSync) when the clear-data button is clicked", async () => {
    mockGetMeta.mockResolvedValue({
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    });
    mockClearAll.mockResolvedValue(undefined);

    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    const clearButton = document.querySelector(".clear-data") as HTMLButtonElement;
    expect(clearButton).not.toBeNull();
    clearButton.click();
    await new Promise(r => setTimeout(r, 0));

    expect(mockClearAll).toHaveBeenCalled();
    expect(mockResetFileSync).toHaveBeenCalled();
  });

  it("requests readwrite permission on the freshly picked handle in pickAndLoad", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue(undefined);
    mockIsFsaSupported.mockReturnValue(true);
    mockPickBencFile.mockResolvedValue(handle);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc"));

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));

    const label = document.querySelector(".upload-label") as HTMLLabelElement;
    label.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockPutFileHandle).toHaveBeenCalledWith(handle);
    expect(mockRequestReadWritePermission).toHaveBeenCalledWith(handle);
    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
  });

  it("reloads when the on-disk file is newer than the watermark", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(1000);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 9000 }));

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // initialize() does not load (default handle undefined), so no store yet.
    const storeCallsBefore = mockStoreParsedData.mock.calls.length;
    mockReadFileFromHandle.mockClear();

    window.dispatchEvent(new Event("focus"));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // The focus watcher re-read the file and reloaded it through the pipeline.
    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
    expect(mockStoreParsedData.mock.calls.length).toBeGreaterThan(storeCallsBefore);
  });

  it("does not reload when the on-disk file is not newer than the watermark", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(9000);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 1000 }));

    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    mockStoreParsedData.mockClear();

    window.dispatchEvent(new Event("focus"));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // File is older-or-equal to the watermark: no reload.
    expect(mockStoreParsedData).not.toHaveBeenCalled();
  });

  it("is a no-op on focus in a seed/non-FSA session (no armed handle)", async () => {
    mockGetSyncHandle.mockReturnValue(null);

    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    mockReadFileFromHandle.mockClear();

    window.dispatchEvent(new Event("focus"));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockReadFileFromHandle).not.toHaveBeenCalled();
  });
});
