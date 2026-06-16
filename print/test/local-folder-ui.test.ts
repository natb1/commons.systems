import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Importing local-folder-ui.ts transitively imports library.ts and
// pages/home.ts, both of which touch print/src/firebase.ts (initializeApp at
// module load). Mock the firebase-touching modules so the module under test
// imports cleanly with no real firebase init.
vi.mock("../src/firebase.js", () => ({ storage: {}, STORAGE_NAMESPACE: "media" }));
vi.mock("../src/media-cache.js", () => ({ blobCache: {} }));
vi.mock("../src/firestore.js", () => ({
  getPublicMedia: () => Promise.resolve([]),
  getAllAccessibleMedia: () => Promise.resolve([]),
  getMediaItem: () => Promise.resolve(null),
}));
vi.mock("../src/storage.js", () => ({
  getMediaDownloadUrl: () => Promise.resolve(""),
}));

// Stub the FSA handle store so initLocalFolder takes the granted ("list")
// auto-bind path without any real IndexedDB / picker. The fake handle is
// granted on query, so bindAndRender runs without a user click. Built via
// vi.hoisted so it exists before the hoisted vi.mock factory references it.
const { mockHandle, mockStore } = vi.hoisted(() => ({
  mockHandle: {} as FileSystemDirectoryHandle,
  mockStore: {
    isSupported: vi.fn(() => true),
    get: vi.fn(() => Promise.resolve(mockHandle)),
    queryPermission: vi.fn(() => Promise.resolve("granted")),
    requestPermission: vi.fn(() => Promise.resolve("granted")),
    put: vi.fn(() => Promise.resolve()),
  },
}));
vi.mock("@commons-systems/local-first/fsa-handle-store", () => ({
  createFsaHandleStore: () => mockStore,
}));

// Keep createLocalSource a no-op and listLocal empty so bindAndRender does no
// real FSA work (markLocalFolderReady stays as the real Promise-deferred).
vi.mock("../src/library.js", async () => {
  const actual = await vi.importActual<typeof import("../src/library.js")>(
    "../src/library.js",
  );
  return {
    ...actual,
    createLocalSource: vi.fn(),
    listLocal: vi.fn(() => Promise.resolve([])),
  };
});

import {
  decideFolderUiState,
  initLocalFolder,
  FOCUS_RESCAN_DEBOUNCE_MS,
} from "../src/local-folder-ui.js";
import { listLocal } from "../src/library.js";

describe("decideFolderUiState", () => {
  it("returns 'open' when no handle is persisted (null)", () => {
    expect(decideFolderUiState(null, "granted")).toBe("open");
  });

  it("returns 'open' when no handle is persisted (undefined)", () => {
    expect(decideFolderUiState(undefined, "granted")).toBe("open");
  });

  it("returns 'list' for a handle with granted permission", () => {
    expect(decideFolderUiState({}, "granted")).toBe("list");
  });

  it("returns 'grant' for a handle in the prompt state", () => {
    expect(decideFolderUiState({}, "prompt")).toBe("grant");
  });

  it("returns 'open' for a handle with denied permission", () => {
    expect(decideFolderUiState({}, "denied")).toBe("open");
  });

  it("returns 'open' for an unknown permission string", () => {
    expect(decideFolderUiState({}, "something-else")).toBe("open");
  });
});

describe("initLocalFolder", () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isSupported.mockReturnValue(true);
    mockStore.get.mockResolvedValue(mockHandle);
    mockStore.queryPermission.mockResolvedValue("granted");
  });

  afterEach(() => {
    // Remove the window focus listener registered by initLocalFolder so it
    // does not persist past this test into later describe blocks.
    cleanup?.();
    cleanup = null;
  });

  it("invokes onSourceBound after binding the source (granted/list path)", async () => {
    const section = document.createElement("span");
    const container = document.createElement("div");
    const onSourceBound = vi.fn();

    cleanup = await initLocalFolder(section, container, onSourceBound);

    expect(onSourceBound).toHaveBeenCalledTimes(1);
  });

  it("invokes onSourceBound after the grant-click binds the source (prompt/grant path)", async () => {
    mockStore.queryPermission.mockResolvedValue("prompt");
    mockStore.requestPermission.mockResolvedValue("granted");

    const section = document.createElement("span");
    const container = document.createElement("div");
    const onSourceBound = vi.fn();

    cleanup = await initLocalFolder(section, container, onSourceBound);

    // The grant path defers the callback until after the user clicks the button.
    expect(onSourceBound).not.toHaveBeenCalled();

    const button = section.querySelector<HTMLButtonElement>("#local-folder-grant");
    expect(button).not.toBeNull();
    button!.click();

    // The click handler is async; wait for it to resolve before asserting.
    await vi.waitFor(() => expect(onSourceBound).toHaveBeenCalledTimes(1));
  });
});

describe("initLocalFolder — focus-rescan debounce", () => {
  let pendingCleanup: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isSupported.mockReturnValue(true);
    mockStore.get.mockResolvedValue(mockHandle);
    mockStore.queryPermission.mockResolvedValue("granted");
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Remove the window focus listener (and clear any pending timer) so it does
    // not survive the test, independent of the order or skipping of any case.
    pendingCleanup?.();
    pendingCleanup = null;
    vi.useRealTimers();
  });

  it("debounces a burst of focus events into one rescan", async () => {
    const section = document.createElement("span");
    const container = document.createElement("div");

    pendingCleanup = await initLocalFolder(section, container);

    // Clear the initial bind render so we count only focus-triggered rescans.
    vi.mocked(listLocal).mockClear();

    // Dispatch several rapid focus events.
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("focus"));

    // Advance past the debounce — the burst should produce exactly one rescan.
    await vi.advanceTimersByTimeAsync(FOCUS_RESCAN_DEBOUNCE_MS);

    expect(listLocal).toHaveBeenCalledTimes(1);
  });

  it("does not rescan before the debounce elapses", async () => {
    const section = document.createElement("span");
    const container = document.createElement("div");

    pendingCleanup = await initLocalFolder(section, container);

    vi.mocked(listLocal).mockClear();

    window.dispatchEvent(new Event("focus"));

    // Advance less than the debounce window — no rescan should have fired.
    await vi.advanceTimersByTimeAsync(FOCUS_RESCAN_DEBOUNCE_MS - 1);

    expect(listLocal).not.toHaveBeenCalled();
  });

  it("cleanup clears a pending timer so no stale rescan fires after teardown", async () => {
    const section = document.createElement("span");
    const container = document.createElement("div");

    const cleanup = await initLocalFolder(section, container);

    vi.mocked(listLocal).mockClear();

    // Schedule a pending rescan.
    window.dispatchEvent(new Event("focus"));

    // Tear down before the timer fires.
    cleanup?.();

    // Advancing past the debounce must NOT fire a rescan.
    await vi.advanceTimersByTimeAsync(FOCUS_RESCAN_DEBOUNCE_MS);

    expect(listLocal).not.toHaveBeenCalled();
  });
});
