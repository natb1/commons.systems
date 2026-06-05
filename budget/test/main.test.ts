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
const mockQueryReadPermission = vi.fn();
const mockRequestReadPermission = vi.fn();
const mockReadFileFromHandle = vi.fn();

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
  queryReadPermission: mockQueryReadPermission,
  requestReadPermission: mockRequestReadPermission,
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
    queryReadPermission: mockQueryReadPermission,
    requestReadPermission: mockRequestReadPermission,
    readFileFromHandle: mockReadFileFromHandle,
  }));
  vi.mock("../src/upload.js", () => ({
    parseUploadedJson: vi.fn(), toParsedData: vi.fn(),
    UploadValidationError: class extends Error { constructor(msg: string) { super(msg); this.name = "UploadValidationError"; } },
  }));
  vi.mock("../src/data-source.js", () => ({
    FirestoreSeedDataSource: class {}, IdbDataSource: class {},
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
    mockQueryReadPermission.mockReset();
    mockRequestReadPermission.mockReset();
    mockReadFileFromHandle.mockReset();
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
    mockQueryReadPermission.mockResolvedValue("granted");
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
    mockQueryReadPermission.mockResolvedValue("prompt");
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

    mockRequestReadPermission.mockResolvedValue("granted");
    button.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockRequestReadPermission).toHaveBeenCalledWith(handle);
    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
  });

  it("clears a stale handle and shows a re-link error when the file is gone", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadPermission.mockResolvedValue("granted");
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
    mockQueryReadPermission.mockResolvedValue("granted");
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
    mockQueryReadPermission.mockResolvedValue("denied");
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
    mockQueryReadPermission.mockResolvedValue("prompt");
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
    mockRequestReadPermission.mockResolvedValue("denied");
    mockPickBencFile.mockResolvedValue(newHandle);
    button.click();
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(mockRequestReadPermission).toHaveBeenCalledWith(handle);
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
});
