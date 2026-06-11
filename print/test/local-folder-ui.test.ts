import { describe, it, expect, vi, beforeEach } from "vitest";

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
    get: vi.fn(() => Promise.resolve({} as FileSystemDirectoryHandle)),
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

import { decideFolderUiState, initLocalFolder } from "../src/local-folder-ui.js";

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isSupported.mockReturnValue(true);
    mockStore.get.mockResolvedValue(mockHandle);
    mockStore.queryPermission.mockResolvedValue("granted");
  });

  it("invokes onSourceBound after binding the source (granted/list path)", async () => {
    const section = document.createElement("span");
    const container = document.createElement("div");
    const onSourceBound = vi.fn();

    await initLocalFolder(section, container, onSourceBound);

    expect(onSourceBound).toHaveBeenCalledTimes(1);
  });
});
