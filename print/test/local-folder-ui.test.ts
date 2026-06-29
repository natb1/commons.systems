import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Importing local-folder-ui.ts transitively imports library.ts, which touches
// print/src/firebase.ts (initializeApp at module load). Mock the
// firebase-touching modules so the module under test imports cleanly with no
// real firebase init.
vi.mock("../src/firebase.js", () => ({ storage: {}, STORAGE_NAMESPACE: "media" }));
vi.mock("../src/media-cache.js", () => ({ blobCache: {} }));
vi.mock("../src/firestore.js", () => ({
  getPublicMedia: () => Promise.resolve([]),
  getAllAccessibleMedia: () => Promise.resolve([]),
  getMediaItem: () => Promise.resolve(null),
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
    remove: vi.fn(() => Promise.resolve()),
  },
}));
vi.mock("@commons-systems/local-first/fsa-handle-store", () => ({
  createFsaHandleStore: () => mockStore,
}));

// Keep createLocalSource a no-op and listLocal empty so bindAndRender does no
// real FSA work (markLocalFolderReady stays as the real Promise-deferred).
//
// listLocal returns [] here, so renderLocalIntoList produces no uncached rows
// and constructs no IntersectionObserver — no IO stub is needed; add one only
// if a future change makes this render produce uncached rows.
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

vi.mock("../src/sidecar.js", () => ({
  ensureLoaded: vi.fn(() => Promise.resolve()),
  cacheMetadataBatch: vi.fn(() => Promise.resolve()),
  getMetadata: vi.fn(() => Promise.resolve(undefined)),
  setLocalDirectory: vi.fn(() => Promise.resolve()),
}));

import {
  decideFolderUiState,
  initLocalFolder,
  renderLocalIntoList,
  FOCUS_RESCAN_DEBOUNCE_MS,
} from "../src/local-folder-ui.js";
import { createLocalSource, listLocal } from "../src/library.js";
import type { MediaItem } from "../src/types.js";

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

  it("change-folder: re-picks via showDirectoryPicker and re-binds the source", async () => {
    const section = document.createElement("span");
    const container = document.createElement("div");
    cleanup = await initLocalFolder(section, container, vi.fn());

    const changeBtn = section.querySelector<HTMLButtonElement>("#local-folder-change");
    expect(changeBtn).not.toBeNull();

    const newHandle = {} as FileSystemDirectoryHandle; // type-safety-ok: test mock only needs the reference, not real FSA methods
    const origPicker = (window as unknown as Record<string, unknown>)["showDirectoryPicker"]; // type-safety-ok: test mock accesses non-standard window property
    (window as unknown as Record<string, unknown>)["showDirectoryPicker"] = vi.fn( // type-safety-ok: test mock sets non-standard window property
      () => Promise.resolve(newHandle),
    );

    changeBtn!.click(); // type-safety-ok: expect(changeBtn).not.toBeNull() asserts non-null above

    await vi.waitFor(() => {
      expect(mockStore.put).toHaveBeenCalledWith("library-folder", newHandle);
    });
    expect(vi.mocked(createLocalSource)).toHaveBeenCalledWith(newHandle);

    (window as unknown as Record<string, unknown>)["showDirectoryPicker"] = origPicker; // type-safety-ok: test mock restores non-standard window property
  });

  it("forget-folder: removes the persisted handle and reverts nav to the open-folder button", async () => {
    const section = document.createElement("span");
    const container = document.createElement("div");
    cleanup = await initLocalFolder(section, container, vi.fn());

    const forgetBtn = section.querySelector<HTMLButtonElement>("#local-folder-forget");
    expect(forgetBtn).not.toBeNull();

    forgetBtn!.click(); // type-safety-ok: expect(forgetBtn).not.toBeNull() asserts non-null above

    // Wait for the terminal state: the async handler runs remove → resetLocalSource
    // → renderLocalIntoList → renderSection("open"). Poll for the nav revert.
    await vi.waitFor(() => {
      expect(section.querySelector("#local-folder-open")).not.toBeNull();
    });
    expect(mockStore.remove).toHaveBeenCalledWith("library-folder");
    expect(section.querySelector("#local-folder-change")).toBeNull();
    expect(section.querySelector("#local-folder-forget")).toBeNull();
  });

  it("stranded-recovery: change/forget controls render even when the initial scan fails", async () => {
    vi.mocked(listLocal).mockRejectedValueOnce(new Error("scan failed"));

    const section = document.createElement("span");
    const container = document.createElement("div");
    container.innerHTML = '<ul id="media-list"></ul>';

    cleanup = await initLocalFolder(section, container, vi.fn());

    expect(section.querySelector("#local-folder-change")).not.toBeNull();
    expect(section.querySelector("#local-folder-forget")).not.toBeNull();
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

describe("renderLocalIntoList — scan failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listLocal).mockReset();
    vi.mocked(listLocal).mockResolvedValue([]);
  });

  it("(a) REJECT → NOTICE: renders error notice with retry button on scan rejection", async () => {
    vi.mocked(listLocal).mockRejectedValueOnce(new Error("scan failed"));
    const container = document.createElement("div");
    container.innerHTML = '<ul id="media-list"></ul>';

    await renderLocalIntoList(container);

    expect(container.querySelector("#local-folder-error")).not.toBeNull();
    expect(container.querySelector("#local-folder-retry")).not.toBeNull();
  });

  it("(b) RECOVERY BUTTON: clicking retry removes the error notice and rescans", async () => {
    vi.mocked(listLocal)
      .mockRejectedValueOnce(new Error("scan failed"))
      .mockResolvedValue([]);
    const container = document.createElement("div");
    container.innerHTML = '<ul id="media-list"></ul>';

    await renderLocalIntoList(container);

    const retryButton = container.querySelector<HTMLButtonElement>("#local-folder-retry");
    expect(retryButton).not.toBeNull();
    if (!retryButton) throw new Error('retryButton not found');
    retryButton.click();

    await vi.waitFor(() =>
      expect(container.querySelector("#local-folder-error")).toBeNull(),
    );
    expect(vi.mocked(listLocal).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("(c) NO-STACK IDEMPOTENCY: repeated failures do not stack duplicate error notices", async () => {
    vi.mocked(listLocal).mockRejectedValue(new Error("scan failed"));
    const container = document.createElement("div");
    container.innerHTML = '<ul id="media-list"></ul>';

    await renderLocalIntoList(container);
    await renderLocalIntoList(container);

    expect(container.querySelectorAll("#local-folder-error").length).toBe(1);
  });

  it("(d) DISCRIMINATOR: a successful scan shows items and no error notice", async () => {
    const oneItem: MediaItem = {
      id: "local:f/a.pdf",
      title: "a",
      mediaType: "pdf",
      tags: {},
      publicDomain: false,
      sourceNotes: "",
      storagePath: "local:f/a.pdf",
      markdownPath: null,
      groupId: null,
      memberEmails: [],
      addedAt: "2024-01-01T00:00:00Z",
      origin: "local",
    };
    vi.mocked(listLocal).mockResolvedValue([oneItem]);
    const container = document.createElement("div");
    container.innerHTML = '<ul id="media-list"></ul>';

    await renderLocalIntoList(container);

    expect(container.querySelector(".media-item-local")).not.toBeNull();
    expect(container.querySelector("#local-folder-error")).toBeNull();
  });

  it("(e) EMPTY-ANCHOR FALLBACK: renders the notice before #media-empty when the cloud library is empty", async () => {
    vi.mocked(listLocal).mockRejectedValueOnce(new Error("scan failed"));
    const container = document.createElement("div");
    container.innerHTML = '<p id="media-empty">No media items available.</p>';

    await renderLocalIntoList(container);

    const notice = container.querySelector("#local-folder-error");
    expect(notice).not.toBeNull();
    expect(container.querySelector("#local-folder-retry")).not.toBeNull();
    // The notice is anchored before the empty-state placeholder.
    const empty = container.querySelector("#media-empty");
    if (!notice) throw new Error("#local-folder-error not found");
    expect(notice.nextElementSibling).toBe(empty);
  });
});
