// Ported from the legacy budget/test/main.test.ts. That suite dynamically
// imported ../src/main.ts and drove the load/FSA/crypto/initialize orchestration
// via mocks + simulated DOM. After Unit 2 that orchestration lives in
// use-app-state.ts + AuthControls, composed by <App/>, so this suite renders
// <App/> with React Testing Library and exercises the same scenarios. Every
// behavioral assertion from the legacy suite is preserved (handle persistence
// gating, plaintext clear-handle, encrypted re-arm, watermark advance on bad
// reload, denied/prompt/granted startup branches, password-cancel non-commit,
// write-back warning + clobber guard).
//
// Test-port mechanics (vs. legacy): the side effects now run on MOUNT, not at
// import. So there is no vi.resetModules() / per-test re-mock / focus-handler
// capture — top-level vi.mock is hoisted, render(<App/>) is per-test, and RTL's
// automatic cleanup isolates tests. The mount effect registers focus /
// visibilitychange listeners WITH a cleanup that removes them, so listeners no
// longer accumulate across tests (the bug the legacy captureModuleFocusHandler
// fought).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, fireEvent, act } from "@testing-library/react";

vi.mock("@commons-systems/ds", () => ({
  Nav: ({ end }: { end?: React.ReactNode }) => <nav>{end}</nav>,
}));
vi.mock("../src/pages/home.js", () => ({ renderHome: vi.fn().mockResolvedValue("<div>home</div>") }));
vi.mock("../src/pages/budgets.js", () => ({ renderBudgets: vi.fn().mockResolvedValue("<div>budgets</div>") }));
vi.mock("../src/pages/rules.js", () => ({ renderRules: vi.fn().mockResolvedValue("<div>rules</div>") }));
vi.mock("../src/pages/home-hydrate.js", () => ({ hydrateTransactionTable: vi.fn() }));
vi.mock("../src/pages/home-chart.js", () => ({ hydrateCategorySankey: vi.fn() }));
vi.mock("../src/pages/budgets-hydrate.js", () => ({
  hydrateBudgetTable: vi.fn(), hydrateBudgetChart: vi.fn(), hydrateOverridesTable: vi.fn(),
}));
vi.mock("../src/pages/rules-hydrate.js", () => ({ hydrateRulesTable: vi.fn() }));
vi.mock("../src/legacy-hydrate.js", () => ({ hydrateTable: vi.fn(), runHydrationSpecs: vi.fn() }));
vi.mock("../src/pages/hero.js", () => ({ renderHero: vi.fn().mockReturnValue("<div id='hero'>hero</div>") }));
vi.mock("@commons-systems/components/hero", () => ({ hydrateHero: vi.fn(), mountHero: vi.fn() }));
vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "app/test",
  trackPageView: vi.fn(),
  initAppCheck: vi.fn(() => Promise.resolve()),
}));

// Hoisted so the (hoisted) vi.mock factories below can reference them even
// though <App/> is imported statically — without vi.hoisted these consts would
// not yet be initialised when the eager factory runs.
const {
  mockGetMeta, mockStoreParsedData, mockClearAll, mockGetFileHandle, mockPutFileHandle, mockClearFileHandle,
  mockIsFsaSupported, mockPickBencFile, mockQueryReadWritePermission, mockRequestReadWritePermission, mockReadFileFromHandle,
  mockConfigureFileSync, mockFlushWriteBack, mockResetFileSync, mockGetSyncHandle, mockGetLastSyncedModified,
  mockSetWriteBackStatusListener, mockAdvanceSyncWatermark,
  mockIsEncrypted, mockDecrypt, mockEncrypt,
} = vi.hoisted(() => ({
  mockGetMeta: vi.fn(), mockStoreParsedData: vi.fn(), mockClearAll: vi.fn(),
  mockGetFileHandle: vi.fn(), mockPutFileHandle: vi.fn(), mockClearFileHandle: vi.fn(),
  mockIsFsaSupported: vi.fn(), mockPickBencFile: vi.fn(), mockQueryReadWritePermission: vi.fn(),
  mockRequestReadWritePermission: vi.fn(), mockReadFileFromHandle: vi.fn(),
  mockConfigureFileSync: vi.fn(), mockFlushWriteBack: vi.fn(), mockResetFileSync: vi.fn(),
  mockGetSyncHandle: vi.fn(), mockGetLastSyncedModified: vi.fn(),
  mockSetWriteBackStatusListener: vi.fn(), mockAdvanceSyncWatermark: vi.fn(),
  mockIsEncrypted: vi.fn(), mockDecrypt: vi.fn(), mockEncrypt: vi.fn(),
}));

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
  setWriteBackStatusListener: mockSetWriteBackStatusListener,
  advanceSyncWatermark: mockAdvanceSyncWatermark,
}));

vi.mock("../src/crypto.js", () => ({
  isEncrypted: mockIsEncrypted,
  decrypt: mockDecrypt,
  encrypt: mockEncrypt,
}));

vi.mock("../src/active-data-source.js", () => ({
  setActiveDataSource: vi.fn(),
}));

vi.mock("../src/export.js", () => ({ exportToJson: vi.fn().mockResolvedValue("{}") }));

import { App } from "../src/App.js";
import type { AppState } from "../src/use-app-state.js";

// Render the shell and let initialize() settle.
async function mountApp(): Promise<void> {
  await act(async () => {
    render(<App />);
  });
  // Let the async initialize() chain flush.
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}

// Submit the open password dialog (the imperative <dialog> appended to body).
async function submitPassword(pw: string): Promise<void> {
  const input = document.querySelector(".password-input") as HTMLInputElement;
  expect(input).not.toBeNull();
  input.value = pw;
  await act(async () => {
    (input.closest("form") as HTMLFormElement).requestSubmit();
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function flush(): Promise<void> {
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}

describe("budget app shell + orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockSetWriteBackStatusListener.mockReset();
    mockAdvanceSyncWatermark.mockReset();
    mockIsEncrypted.mockReset().mockReturnValue(false);
    mockDecrypt.mockReset();
    mockEncrypt.mockReset().mockResolvedValue(new ArrayBuffer(8));
  });

  afterEach(() => {
    cleanup();
    // Remove any leftover password dialog from a non-submitted test.
    document.querySelectorAll(".password-dialog").forEach((d) => d.remove());
  });

  it("exports AppState type (compile-time check)", () => {
    const seedState: AppState = { source: "seed" };
    const localState: AppState = { source: "local", groupName: "household" };
    expect(seedState.source).toBe("seed");
    expect(localState.source).toBe("local");
  });

  it("transitions to seed state when no local data exists — hero visible", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    await mountApp();

    expect(mockGetMeta).toHaveBeenCalled();
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(false);
  });

  it("does not call initAppCheck before user interaction", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    await mountApp();

    const { initAppCheck } = await import("../src/firebase.js");
    expect(initAppCheck).not.toHaveBeenCalled();
  });

  it("calls initAppCheck on first user interaction", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    await mountApp();

    const { initAppCheck } = await import("../src/firebase.js");
    const mock = initAppCheck as ReturnType<typeof vi.fn>;
    const callsBefore = mock.mock.calls.length;

    await act(async () => { window.dispatchEvent(new Event("click")); });
    await flush();
    const callsAfterFirst = mock.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(callsBefore);

    await act(async () => { window.dispatchEvent(new Event("click")); });
    await flush();
    expect(mock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("transitions to local state when meta exists — hero hidden", async () => {
    mockGetMeta.mockResolvedValue({
      key: "upload", groupName: "household", version: 1, exportedAt: "2025-06-15T10:30:00Z",
    });
    await mountApp();

    expect(mockGetMeta).toHaveBeenCalled();
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(true);
  });

  it("auto-loads from a persisted handle when permission is granted", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();
    await submitPassword("s3cret");

    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
    expect(mockStoreParsedData).toHaveBeenCalled();
  });

  it("shows a reload button (no auto-load) when permission is prompt, then loads on click", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("prompt");
    mockGetMeta.mockResolvedValue({
      key: "upload", groupName: "household", version: 1, exportedAt: "2025-06-15T10:30:00Z",
    });
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc"));

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();

    const button = await waitFor(() => {
      const b = document.querySelector(".reload-handle") as HTMLButtonElement;
      expect(b).not.toBeNull();
      return b;
    });
    expect(mockReadFileFromHandle).not.toHaveBeenCalled();

    mockRequestReadWritePermission.mockResolvedValue("granted");
    await act(async () => { fireEvent.click(button); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockRequestReadWritePermission).toHaveBeenCalledWith(handle);
    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
  });

  it("clears a stale handle and shows a re-link error when the file is gone", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockRejectedValue(new DOMException("missing", "NotFoundError"));

    await mountApp();
    await flush();

    expect(mockClearFileHandle).toHaveBeenCalled();
    const errorEl = await waitFor(() => {
      const e = document.querySelector(".nav-error") as HTMLElement;
      expect(e).not.toBeNull();
      return e;
    });
    expect(errorEl.textContent).toContain("no longer available");
  });

  it("clears the persisted handle when the linked file fails content validation", async () => {
    const handle = { name: "wrong.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "wrong.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");

    const { parseUploadedJson, UploadValidationError } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new UploadValidationError("Not a valid budget file.");
    });

    await mountApp();
    await flush();
    await submitPassword("s3cret");

    expect(mockClearFileHandle).toHaveBeenCalled();
    expect(mockStoreParsedData).not.toHaveBeenCalled();
    const errorEl = await waitFor(() => {
      const e = document.querySelector(".nav-error") as HTMLElement;
      expect(e).not.toBeNull();
      return e;
    });
    expect(errorEl.textContent).toContain("Not a valid budget file.");
  });

  it("clears a denied handle and shows an unlinked notice, falling through to cached data", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("denied");
    mockGetMeta.mockResolvedValue({
      key: "upload", groupName: "household", version: 1, exportedAt: "2025-06-15T10:30:00Z",
    });

    await mountApp();
    await flush();

    expect(mockClearFileHandle).toHaveBeenCalled();
    expect(mockReadFileFromHandle).not.toHaveBeenCalled();
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(true);
    const errorEl = await waitFor(() => {
      const e = document.querySelector(".nav-error") as HTMLElement;
      expect(e).not.toBeNull();
      return e;
    });
    expect(errorEl.textContent).toContain("denied");
  });

  it("reload button falls back to the picker when re-grant is still denied", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    const newHandle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("prompt");
    mockGetMeta.mockResolvedValue({
      key: "upload", groupName: "household", version: 1, exportedAt: "2025-06-15T10:30:00Z",
    });
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();

    const button = await waitFor(() => {
      const b = document.querySelector(".reload-handle") as HTMLButtonElement;
      expect(b).not.toBeNull();
      return b;
    });

    mockRequestReadWritePermission.mockResolvedValue("denied");
    mockPickBencFile.mockResolvedValue(newHandle);
    await act(async () => { fireEvent.click(button); await new Promise((r) => setTimeout(r, 0)); });
    await flush();
    await submitPassword("s3cret");

    expect(mockRequestReadWritePermission).toHaveBeenCalledWith(handle);
    expect(mockPickBencFile).toHaveBeenCalled();
    expect(mockPutFileHandle).toHaveBeenCalledWith(newHandle);
    expect(mockReadFileFromHandle).toHaveBeenCalledWith(newHandle);
  });

  it("transitions to cached local state when no handle but meta exists (unchanged path)", async () => {
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue({
      key: "upload", groupName: "household", version: 1, exportedAt: "2025-06-15T10:30:00Z",
    });

    await mountApp();

    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(true);
    expect(mockReadFileFromHandle).not.toHaveBeenCalled();
  });

  it("arms write-back (configureFileSync) after a granted encrypted handle load", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();
    await submitPassword("s3cret");

    expect(mockStoreParsedData).toHaveBeenCalled();
    expect(mockConfigureFileSync).toHaveBeenCalledWith(handle, "s3cret", expect.any(Number));
    expect(mockPutFileHandle).toHaveBeenCalledWith(handle);
  });

  it("flushes a pending write-back on visibilitychange -> hidden", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    await mountApp();

    expect(mockFlushWriteBack).not.toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(mockFlushWriteBack).toHaveBeenCalled();
  });

  it("does not flush on visibilitychange when the tab is visible", async () => {
    mockGetMeta.mockResolvedValue(undefined);
    await mountApp();

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(mockFlushWriteBack).not.toHaveBeenCalled();
  });

  it("disarms write-back (resetFileSync) when the clear-data button is clicked", async () => {
    mockGetMeta.mockResolvedValue({
      key: "upload", groupName: "household", version: 1, exportedAt: "2025-06-15T10:30:00Z",
    });
    mockClearAll.mockResolvedValue(undefined);

    await mountApp();

    const clearButton = await waitFor(() => {
      const b = document.querySelector(".clear-data") as HTMLButtonElement;
      expect(b).not.toBeNull();
      return b;
    });
    await act(async () => { fireEvent.click(clearButton); await new Promise((r) => setTimeout(r, 0)); });

    expect(mockClearAll).toHaveBeenCalled();
    expect(mockResetFileSync).toHaveBeenCalled();
  });

  it("requests readwrite permission on the freshly picked handle in pickAndLoad", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue(undefined);
    mockIsFsaSupported.mockReturnValue(true);
    mockPickBencFile.mockResolvedValue(handle);
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();

    const label = document.querySelector(".upload-label") as HTMLLabelElement;
    await act(async () => { fireEvent.click(label); await new Promise((r) => setTimeout(r, 0)); });
    await flush();
    await submitPassword("s3cret");

    expect(mockPutFileHandle).toHaveBeenCalledWith(handle);
    expect(mockRequestReadWritePermission).toHaveBeenCalledWith(handle);
    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
  });

  it("reloads when the on-disk file is newer than the watermark", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(1000);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 9000 }));

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();

    const storeCallsBefore = mockStoreParsedData.mock.calls.length;
    mockReadFileFromHandle.mockClear();

    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockReadFileFromHandle).toHaveBeenCalledWith(handle);
    expect(mockStoreParsedData.mock.calls.length).toBeGreaterThan(storeCallsBefore);
  });

  it("does not reload when the on-disk file is not newer than the watermark", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(9000);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 1000 }));

    await mountApp();
    await flush();

    mockStoreParsedData.mockClear();
    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockStoreParsedData).not.toHaveBeenCalled();
  });

  it("does not reload when the watermark is null (handle armed, no watermark)", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(null);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 9000 }));

    await mountApp();
    await flush();

    mockStoreParsedData.mockClear();
    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockStoreParsedData).not.toHaveBeenCalled();
  });

  it("is a no-op on focus in a seed/non-FSA session (no armed handle)", async () => {
    mockGetSyncHandle.mockReturnValue(null);

    await mountApp();
    await flush();

    mockReadFileFromHandle.mockClear();
    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockReadFileFromHandle).not.toHaveBeenCalled();
  });

  it("external-change reload uses the cached session password (no re-prompt)", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(1000);
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc", { lastModified: 9000 }));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();

    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    // importPassword is null at start, so cachedPw is undefined → a dialog appears
    // for the encrypted file. Submit it to complete the reload.
    const dialog = document.querySelector(".password-dialog");
    if (dialog) {
      await submitPassword("s3cret");
    }
    expect(mockDecrypt).toHaveBeenCalled();
    expect(mockStoreParsedData).toHaveBeenCalled();
  });

  it("does not clear the FSA handle when an external reload produces invalid content", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetSyncHandle.mockReturnValue(handle);
    mockGetLastSyncedModified.mockReturnValue(1000);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 9000 }));

    const { parseUploadedJson, UploadValidationError } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new UploadValidationError("Bad content from external write");
    });

    await mountApp();
    await flush();

    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockClearFileHandle).not.toHaveBeenCalled();
  });

  it("rejects a plaintext external file when session is encrypted and advances the watermark", async () => {
    const handleA = { name: "a.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handleA);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-a"], "a.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");
    mockIsFsaSupported.mockReturnValue(true);

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();
    await submitPassword("pw-A");

    expect(mockConfigureFileSync).toHaveBeenCalledWith(handleA, "pw-A", expect.any(Number));

    // External file swapped for a NEWER *plaintext* file: reject (mode-downgrade).
    mockGetSyncHandle.mockReturnValue(handleA);
    mockGetLastSyncedModified.mockReturnValue(1000);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.benc", { lastModified: 9000 }));
    mockIsEncrypted.mockReturnValue(false);
    mockStoreParsedData.mockClear();
    mockClearFileHandle.mockClear();

    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockStoreParsedData).not.toHaveBeenCalled();
    expect(mockClearFileHandle).not.toHaveBeenCalled();
    expect(mockAdvanceSyncWatermark).toHaveBeenCalledWith(9000);
  });

  it("advances the watermark after a wrong-password reload to break the focus retry loop", async () => {
    const handleA = { name: "a.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handleA);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-a"], "a.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");
    mockIsFsaSupported.mockReturnValue(true);

    const { parseUploadedJson, toParsedData, UploadValidationError } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();
    await submitPassword("pw-A");

    expect(mockConfigureFileSync).toHaveBeenCalledWith(handleA, "pw-A", expect.any(Number));

    mockGetSyncHandle.mockReturnValue(handleA);
    mockGetLastSyncedModified.mockReturnValue(1000);
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc", { lastModified: 9000 }));
    mockIsEncrypted.mockReturnValue(true);
    mockAdvanceSyncWatermark.mockImplementation((ms: number) => {
      mockGetLastSyncedModified.mockReturnValue(ms);
    });
    mockDecrypt.mockReset();
    mockDecrypt.mockRejectedValue(new UploadValidationError("Wrong password or corrupted file."));
    mockDecrypt.mockClear();

    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();
    await flush();

    await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((r) => setTimeout(r, 0)); });
    await flush();
    await flush();

    expect(mockDecrypt).toHaveBeenCalledTimes(1);
    expect(mockAdvanceSyncWatermark).toHaveBeenCalledWith(9000);
  });

  it("AC1: committed plaintext upload calls resetFileSync and leaves sync disarmed", async () => {
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue(undefined);

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();

    const uploadInput = document.querySelector(".upload-input") as HTMLInputElement;
    expect(uploadInput).not.toBeNull();

    const file = new File(['{"groupName":"household"}'], "budget.json");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    Object.defineProperty(uploadInput, "files", { value: dataTransfer.files, configurable: true });

    await act(async () => { fireEvent.change(uploadInput); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockResetFileSync).toHaveBeenCalled();
    expect(mockConfigureFileSync).not.toHaveBeenCalled();
  });

  // Parity lock for legacy's trailing router.navigate(): a data transition on
  // the SAME path must re-resolve the route body against the new data source.
  // The real <LegacyRoute> injects the renderBudgets() string into #app; making
  // the mock vary by `authorized` proves the body refreshes seed → local after
  // an upload (the legacy `transition() → router.navigate() → innerHTML = html`
  // behavior). Without the navEpoch re-key the body would stay on seed data.
  it("re-resolves the route body against the new data source after an upload (same path)", async () => {
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue(undefined);

    const { renderBudgets } = await import("../src/pages/budgets.js");
    (renderBudgets as ReturnType<typeof vi.fn>).mockImplementation((o: { authorized: boolean }) =>
      Promise.resolve(o.authorized ? "<div>LOCAL</div>" : "<div>SEED</div>"),
    );

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();

    // Seed state: the body shows example data.
    await waitFor(() => {
      expect(document.querySelector("#app")!.textContent).toContain("SEED");
    });

    const uploadInput = document.querySelector(".upload-input") as HTMLInputElement;
    const file = new File(['{"groupName":"household"}'], "budget.json");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    Object.defineProperty(uploadInput, "files", { value: dataTransfer.files, configurable: true });

    await act(async () => { fireEvent.change(uploadInput); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    // After the committed upload (same path), the body re-resolves to local data.
    await waitFor(() => {
      expect(document.querySelector("#app")!.textContent).toContain("LOCAL");
    });
  });

  it("AC2: cancelling the password prompt for encrypted file B does not arm B with the prior password", async () => {
    const handleA = { name: "a.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handleA);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-a"], "a.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");
    mockIsFsaSupported.mockReturnValue(true);

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();
    await submitPassword("pw-A");

    expect(mockConfigureFileSync).toHaveBeenCalledWith(handleA, "pw-A", expect.any(Number));
    mockConfigureFileSync.mockClear();
    mockResetFileSync.mockClear();

    const handleB = { name: "b.benc" } as unknown as FileSystemFileHandle;
    mockPickBencFile.mockResolvedValue(handleB);
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-b"], "b.benc"));

    const label = document.querySelector(".upload-label") as HTMLLabelElement;
    await act(async () => { fireEvent.click(label); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    const cancelBtn = await waitFor(() => {
      const b = document.querySelector(".password-cancel") as HTMLButtonElement;
      expect(b).not.toBeNull();
      return b;
    });
    await act(async () => { fireEvent.click(cancelBtn); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockConfigureFileSync).not.toHaveBeenCalled();
    expect(mockResetFileSync).not.toHaveBeenCalled();
  });

  it("AC3: switching from encrypted A to encrypted B disarms A and arms B only", async () => {
    const handleA = { name: "a.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handleA);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-a"], "a.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");
    mockIsFsaSupported.mockReturnValue(true);

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();
    await flush();
    await submitPassword("pw-A");

    expect(mockConfigureFileSync).toHaveBeenCalledWith(handleA, "pw-A", expect.any(Number));
    mockConfigureFileSync.mockClear();
    mockResetFileSync.mockClear();

    const handleB = { name: "b.benc" } as unknown as FileSystemFileHandle;
    mockPickBencFile.mockResolvedValue(handleB);
    mockReadFileFromHandle.mockResolvedValue(new File(["enc-b"], "b.benc"));
    mockPutFileHandle.mockResolvedValue(undefined);

    const label = document.querySelector(".upload-label") as HTMLLabelElement;
    await act(async () => { fireEvent.click(label); await new Promise((r) => setTimeout(r, 0)); });
    await flush();
    await submitPassword("pw-B");

    expect(mockResetFileSync).toHaveBeenCalled();
    expect(mockConfigureFileSync).toHaveBeenCalledWith(handleB, "pw-B", expect.any(Number));
    const postSwitchCalls = mockConfigureFileSync.mock.calls;
    const armedHandleA = postSwitchCalls.some(([h]) => h === handleA);
    expect(armedHandleA).toBe(false);
  });

  it("does not persist the handle or arm write-back for a freshly picked plaintext file", async () => {
    const handle = { name: "budget.json" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue(undefined);
    mockIsFsaSupported.mockReturnValue(true);
    mockPickBencFile.mockResolvedValue(handle);
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.json"));

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();

    const label = document.querySelector(".upload-label") as HTMLLabelElement;
    await act(async () => { fireEvent.click(label); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockStoreParsedData).toHaveBeenCalled();
    expect(mockPutFileHandle).not.toHaveBeenCalled();
    expect(mockClearFileHandle).toHaveBeenCalled();
    expect(mockConfigureFileSync).not.toHaveBeenCalled();
    const errorEl = await waitFor(() => {
      const e = document.querySelector(".nav-error") as HTMLElement;
      expect(e).not.toBeNull();
      return e;
    });
    expect(errorEl.textContent).toContain("auto-loaded next session");
  });

  it("unlinks a granted plaintext handle and shows cached data without clobbering", async () => {
    const handle = { name: "budget.json" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(handle);
    mockQueryReadWritePermission.mockResolvedValue("granted");
    mockReadFileFromHandle.mockResolvedValue(new File(["{}"], "budget.json"));
    mockGetMeta.mockResolvedValue({
      key: "upload", groupName: "household", version: 1, exportedAt: "2025-06-15T10:30:00Z",
    });

    await mountApp();
    await flush();

    expect(mockClearFileHandle).toHaveBeenCalled();
    expect(mockStoreParsedData).not.toHaveBeenCalled();
    expect(mockGetMeta).toHaveBeenCalled();
    const heroContainer = document.getElementById("hero-container")!;
    expect(heroContainer.hidden).toBe(true);
    const errorEl = await waitFor(() => {
      const e = document.querySelector(".nav-error") as HTMLElement;
      expect(e).not.toBeNull();
      return e;
    });
    expect(errorEl.textContent).toContain("unencrypted");
  });

  it("does not persist a freshly picked encrypted handle when the password prompt is cancelled", async () => {
    const handle = { name: "budget.benc" } as unknown as FileSystemFileHandle;
    mockGetFileHandle.mockResolvedValue(undefined);
    mockGetMeta.mockResolvedValue(undefined);
    mockIsFsaSupported.mockReturnValue(true);
    mockPickBencFile.mockResolvedValue(handle);
    mockReadFileFromHandle.mockResolvedValue(new File(["enc"], "budget.benc"));
    mockIsEncrypted.mockReturnValue(true);
    mockDecrypt.mockResolvedValue("{}");

    const { parseUploadedJson, toParsedData } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockReturnValue({ groupName: "household" });
    (toParsedData as ReturnType<typeof vi.fn>).mockReturnValue({ meta: { groupName: "household" } });
    mockStoreParsedData.mockResolvedValue(undefined);

    await mountApp();

    const label = document.querySelector(".upload-label") as HTMLLabelElement;
    await act(async () => { fireEvent.click(label); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    const cancelBtn = await waitFor(() => {
      const b = document.querySelector(".password-cancel") as HTMLButtonElement;
      expect(b).not.toBeNull();
      return b;
    });
    await act(async () => { fireEvent.click(cancelBtn); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    expect(mockPutFileHandle).not.toHaveBeenCalled();
  });

  // Ported at the state level (the legacy test imperatively set .textContent /
  // .hidden then re-checked, but React owns those nodes now): capture the
  // write-back status callback and drive it, asserting the rendered nav-error.
  it("write-back status listener shows and clears the nav warning, with clobber guard", async () => {
    const FILE_SYNC_WARNING = "Changes could not be saved to disk — an error occurred.";

    mockGetMeta.mockResolvedValue(undefined);
    await mountApp();

    expect(mockSetWriteBackStatusListener).toHaveBeenCalled();
    const cb = mockSetWriteBackStatusListener.mock.calls[0][0] as (ok: boolean) => void;

    // ok=false: warning is shown.
    await act(async () => { cb(false); });
    let errorEl = await waitFor(() => {
      const e = document.querySelector(".nav-error") as HTMLElement;
      expect(e).not.toBeNull();
      return e;
    });
    expect(errorEl.textContent).toContain(FILE_SYNC_WARNING);

    // ok=true: warning is cleared.
    await act(async () => { cb(true); });
    await waitFor(() => {
      expect(document.querySelector(".nav-error")).toBeNull();
    });

    // Clobber guard: an UNRELATED nav error must not be cleared by ok=true.
    // Surface a real non-FILE_SYNC error through the pipeline — a failed upload
    // sets "Upload failed. Please try again." — then drive cb(true) and assert
    // the unrelated error survives (the guard only clears the exact warning).
    const { parseUploadedJson } = await import("../src/upload.js");
    (parseUploadedJson as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new Error("boom"); });
    mockStoreParsedData.mockResolvedValue(undefined);
    const uploadInput = document.querySelector(".upload-input") as HTMLInputElement;
    const file = new File(['{}'], "budget.json");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    Object.defineProperty(uploadInput, "files", { value: dataTransfer.files, configurable: true });
    await act(async () => { fireEvent.change(uploadInput); await new Promise((r) => setTimeout(r, 0)); });
    await flush();

    errorEl = await waitFor(() => {
      const e = document.querySelector(".nav-error") as HTMLElement;
      expect(e).not.toBeNull();
      return e;
    });
    const unrelated = errorEl.textContent;
    expect(unrelated).toContain("Upload failed");

    await act(async () => { cb(true); });
    await flush();
    const after = document.querySelector(".nav-error") as HTMLElement;
    expect(after).not.toBeNull();
    expect(after.textContent).toBe(unrelated);
  });
});
