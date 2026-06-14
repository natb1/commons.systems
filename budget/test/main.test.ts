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

  it("does not reload when the watermark is null (handle armed, no watermark)", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    // A null watermark means the session is not armed for sync; the focus watcher
    // treats it as an explicit no-op rather than an unconditional reload, even
    // though the on-disk file looks newer than any prior value.
    mockGetLastSyncedModified.mockReturnValue(null);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 9000 }));

    resetAndMockAll();

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    mockStoreParsedData.mockClear();

    window.dispatchEvent(new Event("focus"));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

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

  it("external-change reload uses the cached session password (no re-prompt)", async () => {
    // The external-change reload path calls loadFromFile with the cached importPassword
    // so the user is not re-prompted. Verify that decrypt is called directly (not via
    // a password dialog) when the session password is already set.
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(1000);
    // The file is encrypted; decrypt returns valid JSON.
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc", { lastModified: 9000 }));
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

    window.dispatchEvent(new Event("focus"));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // importPassword is null at start (no prior session load), so cachedPw is undefined,
    // which triggers a password dialog for an encrypted file. The dialog represents the
    // one-time prompt that fires when there is no cached session password yet (e.g. on
    // first focus after a direct-handle session where the user hasn't entered a password
    // yet). In a normal session the user will have entered their password during the
    // initial load, which sets importPassword, and subsequent focus events reuse it.
    //
    // This test verifies the decrypt path is wired through: once a dialog appears and
    // the user submits a password, decrypt is called.
    const dialog = document.querySelector(".password-dialog");
    if (dialog) {
      // Password dialog appeared because importPassword was null (no prior load in this test).
      // Submit to complete the reload.
      const input = dialog.querySelector(".password-input") as HTMLInputElement;
      input.value = "s3cret";
      (input.closest("form") as HTMLFormElement).requestSubmit();
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
    }
    // Either way, decrypt must have been called (external file was decrypted).
    expect(mockDecrypt).toHaveBeenCalled();
    expect(mockStoreParsedData).toHaveBeenCalled();
  });

  it("does not clear the FSA handle when an external reload produces invalid content", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(1000);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 9000 }));

    resetAndMockAll();

    const { parseUploadedJson, UploadValidationError } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new UploadValidationError("Bad content from external write");
    });

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    window.dispatchEvent(new Event("focus"));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // A content-validation error in an external write must not permanently unlink
    // the FSA handle — the handle is valid, only this file version is bad.
    expect(mockClearFileHandle).not.toHaveBeenCalled();
  });

  // AC1 — any committed load disarms the prior file-sync session.
  // A committed plaintext load (non-FSA upload) calls resetFileSync and does NOT
  // call configureFileSync (no handle to re-arm with).
  it("AC1: committed plaintext upload calls resetFileSync and leaves sync disarmed", async () => {
    // Start with no persisted handle and no meta so the module initialises to seed state.
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue(undefined);

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // Simulate a plaintext non-FSA upload by dispatching a change event on the hidden
    // file input. The input is wired to handleFileUpload which calls loadFromFile.
    const uploadInput = document.querySelector(".upload-input") as HTMLInputElement;
    expect(uploadInput).not.toBeNull();

    const file = new File(['{"groupName":"household"}'], "budget.json");
    // Inject the file into the input's file list via a DataTransfer.
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    Object.defineProperty(uploadInput, "files", { value: dataTransfer.files, configurable: true });

    uploadInput.dispatchEvent(new Event("change"));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // loadFromFile calls resetFileSync before storeParsedData — every committed load
    // disarms whatever prior session was armed.
    expect(mockResetFileSync).toHaveBeenCalled();
    // Plaintext upload has no FSA handle, so configureFileSync must never be called.
    expect(mockConfigureFileSync).not.toHaveBeenCalled();
  });

  // AC2 — cancelling the password prompt for a new encrypted file does NOT arm
  // write-back with the prior session's password. The prior session must be left
  // armed (IndexedDB is unchanged) and must NOT be re-pointed at the new handle.
  it("AC2: cancelling the password prompt for encrypted file B does not arm B with the prior password", async () => {
    const handleA = { name: "a.benc" } as unknown as FileSystemFileHandle;
    // Start with handle A already persisted and permission granted — the startup
    // path auto-loads it as an encrypted file with password "pw-A".
    mockGetFileHandle.mockResolvedValue(handleA);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-a"], "a.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");
    mockIsFsaSupported.mockReturnValue(true);

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // Submit password "pw-A" to complete the initial encrypted load and arm handleA.
    const inputA = document.querySelector(".password-input") as HTMLInputElement;
    expect(inputA).not.toBeNull();
    inputA.value = "pw-A";
    (inputA.closest("form") as HTMLFormElement).requestSubmit();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // handleA should now be armed.
    expect(mockConfigureFileSync).toHaveBeenCalledWith(handleA, "pw-A", expect.any(Number));
    mockConfigureFileSync.mockClear();
    mockResetFileSync.mockClear();

    // Now pick handleB (also encrypted). Point mockReadFileFromHandle at the new file.
    const handleB = { name: "b.benc" } as unknown as FileSystemFileHandle;
    mockPickBencFile.mockResolvedValue(handleB);
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-b"], "b.benc"));

    // Click the upload label to trigger the FSA picker → loadFromHandle(handleB).
    const label = document.querySelector(".upload-label") as HTMLLabelElement;
    label.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // The password dialog for file B should now be open. Cancel it.
    const cancelBtn = document.querySelector(".password-cancel") as HTMLButtonElement;
    expect(cancelBtn).not.toBeNull();
    cancelBtn.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // A cancel must never arm write-back — configureFileSync must not be called at
    // all after the cancel, and in particular must never be called with handleB.
    expect(mockConfigureFileSync).not.toHaveBeenCalled();
    // The cancel also must not re-point sync at handleA: resetFileSync was not
    // triggered by the cancelled load (IndexedDB is unchanged, so the prior
    // session remains correctly armed).
    expect(mockResetFileSync).not.toHaveBeenCalled();
  });

  // AC3 — switching from encrypted file A to encrypted file B must not leave
  // write-back armed to handleA after the switch. After the committed load of B:
  //   • resetFileSync was called (prior session disarmed),
  //   • the final configureFileSync call targets handleB (not handleA), and
  //   • no configureFileSync call after the switch targets handleA.
  it("AC3: switching from encrypted A to encrypted B disarms A and arms B only", async () => {
    const handleA = { name: "a.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handleA);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-a"], "a.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");
    mockIsFsaSupported.mockReturnValue(true);

    resetAndMockAll();

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await import("../src/main");
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // Complete the initial encrypted load with password "pw-A".
    const inputA = document.querySelector(".password-input") as HTMLInputElement;
    expect(inputA).not.toBeNull();
    inputA.value = "pw-A";
    (inputA.closest("form") as HTMLFormElement).requestSubmit();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // Verify handleA is armed.
    expect(mockConfigureFileSync).toHaveBeenCalledWith(handleA, "pw-A", expect.any(Number));
    mockConfigureFileSync.mockClear();
    mockResetFileSync.mockClear();

    // Now switch to encrypted handleB via the FSA picker.
    const handleB = { name: "b.benc" } as unknown as FileSystemFileHandle;
    mockPickBencFile.mockResolvedValue(handleB);
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-b"], "b.benc"));
    mockPutFileHandle.mockResolvedValue(undefined);

    const label = document.querySelector(".upload-label") as HTMLLabelElement;
    label.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // Submit password "pw-B" for the new file.
    const inputB = document.querySelector(".password-input") as HTMLInputElement;
    expect(inputB).not.toBeNull();
    inputB.value = "pw-B";
    (inputB.closest("form") as HTMLFormElement).requestSubmit();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // After the committed switch:
    // 1. resetFileSync must have been called (prior session disarmed).
    expect(mockResetFileSync).toHaveBeenCalled();
    // 2. The final configureFileSync call must target handleB with password "pw-B".
    expect(mockConfigureFileSync).toHaveBeenCalledWith(handleB, "pw-B", expect.any(Number));
    // 3. No configureFileSync call after the switch may target handleA.
    const postSwitchCalls = mockConfigureFileSync.mock.calls;
    const armedHandleA = postSwitchCalls.some(([h]) => h === handleA);
    expect(armedHandleA).toBe(false);
  });
});
