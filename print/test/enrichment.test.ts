/**
 * Tests for the enrichment flow in local-folder-ui.ts (renderLocalIntoList /
 * enrichLocalItem). The sidecar module is real (not mocked) so we can observe
 * sidecar effects via getMetadata, cacheMetadata, readSidecar, etc.
 *
 * We use a fake FileSystemDirectoryHandle (same infrastructure as sidecar.test.ts)
 * to avoid any real FSA I/O.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock firebase-touching transitive deps (must come before importing source)
// ---------------------------------------------------------------------------
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

// Mock the FSA handle store so initLocalFolder doesn't hit IndexedDB
vi.mock("@commons-systems/local-first/fsa-handle-store", () => ({
  createFsaHandleStore: () => ({
    isSupported: () => true,
    get: vi.fn(),
    queryPermission: vi.fn(),
    requestPermission: vi.fn(),
    put: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Mock library.js: listLocal and resolveLocalBlob are overridable spies.
// createLocalSource is a no-op. Other exports are real.
// ---------------------------------------------------------------------------
const mockListLocal = vi.fn<[], Promise<import("../src/types.js").MediaItem[]>>();
const mockResolveLocalBlob = vi.fn<[import("../src/types.js").MediaItem], Promise<ArrayBuffer | null>>();

vi.mock("../src/library.js", async () => {
  const actual = await vi.importActual<typeof import("../src/library.js")>("../src/library.js");
  return {
    ...actual,
    createLocalSource: vi.fn(),
    listLocal: () => mockListLocal(),
    resolveLocalBlob: (item: import("../src/types.js").MediaItem) => mockResolveLocalBlob(item),
  };
});

// ---------------------------------------------------------------------------
// Mock local-metadata.js extractMetadata as a spy
// ---------------------------------------------------------------------------
const mockExtractMetadata = vi.fn<[ArrayBuffer, import("../src/types.js").MediaType], Promise<{ title?: string; pageCount?: number }>>();

vi.mock("../src/local-metadata.js", async () => {
  const actual = await vi.importActual<typeof import("../src/local-metadata.js")>("../src/local-metadata.js");
  return {
    ...actual,
    extractMetadata: (buf: ArrayBuffer, mt: import("../src/types.js").MediaType) => mockExtractMetadata(buf, mt),
  };
});

// Mock errorutil/log
vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import real modules AFTER mocks are declared
// ---------------------------------------------------------------------------
import { renderLocalIntoList, settleEnrichment } from "../src/local-folder-ui.js";
import {
  setLocalDirectory,
  flushWrites,
  getMetadata,
  readSidecar,
  serializeSidecar,
} from "../src/sidecar.js";
import type { MediaItem, SidecarData } from "../src/sidecar.js";
import type { MediaItem as LibMediaItem } from "../src/types.js";

// ---------------------------------------------------------------------------
// Fake FileSystemDirectoryHandle (same pattern as sidecar.test.ts)
// ---------------------------------------------------------------------------
interface FakeFileState {
  content: string | null;
}

function makeFakeFileHandle(state: FakeFileState) {
  const abortSpy = vi.fn().mockResolvedValue(undefined);
  const writtenValues: string[] = [];
  const createWritable = vi.fn().mockImplementation(() => {
    const buf = { value: state.content };
    return Promise.resolve({
      write: vi.fn().mockImplementation((data: string) => {
        buf.value = data;
        writtenValues.push(data);
        return Promise.resolve();
      }),
      close: vi.fn().mockImplementation(async () => {
        state.content = buf.value;
      }),
      abort: abortSpy,
    });
  });
  return {
    getFile: vi.fn().mockImplementation(() => {
      if (state.content === null) {
        return Promise.reject(new DOMException("File not found", "NotFoundError"));
      }
      return Promise.resolve({ text: () => Promise.resolve(state.content as string) });
    }),
    createWritable,
    _abortSpy: abortSpy,
    _state: state,
    _writtenValues: writtenValues,
  };
}

type FakeDirFiles = Record<string, ReturnType<typeof makeFakeFileHandle>>;

function makeFakeSubdir(files: FakeDirFiles) {
  return {
    getFileHandle: vi.fn().mockImplementation((name: string, opts?: { create?: boolean }) => {
      if (files[name]) return Promise.resolve(files[name]);
      if (!opts?.create) {
        return Promise.reject(new DOMException(`File not found: ${name}`, "NotFoundError"));
      }
      const state: FakeFileState = { content: null };
      const handle = makeFakeFileHandle(state);
      files[name] = handle;
      return Promise.resolve(handle);
    }),
    _files: files,
  };
}

type FakeSubdirs = Record<string, ReturnType<typeof makeFakeSubdir>>;

function makeFakeDir(subdirs: FakeSubdirs): FileSystemDirectoryHandle {
  return {
    getDirectoryHandle: vi.fn().mockImplementation((name: string, opts?: { create?: boolean }) => {
      if (subdirs[name]) return Promise.resolve(subdirs[name]);
      if (!opts?.create) {
        return Promise.reject(new DOMException(`Directory not found: ${name}`, "NotFoundError"));
      }
      const newSubdir = makeFakeSubdir({});
      subdirs[name] = newSubdir;
      return Promise.resolve(newSubdir);
    }),
    _subdirs: subdirs,
  } as unknown as FileSystemDirectoryHandle;
}

function makeEmptyDir(): FileSystemDirectoryHandle {
  return makeFakeDir({});
}

/** Build a fake directory with pre-loaded sidecar content. */
function makePreloadedDir(content: string): {
  dir: FileSystemDirectoryHandle;
} {
  const state: FakeFileState = { content };
  const fileHandle = makeFakeFileHandle(state);
  const subdir = makeFakeSubdir({ "index.json": fileHandle });
  const dir = makeFakeDir({ ".commons-print": subdir });
  return { dir };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLocalItem(overrides: Partial<LibMediaItem> = {}): LibMediaItem {
  return {
    id: "local:library/book.pdf",
    title: "book",
    mediaType: "pdf",
    storagePath: "book.pdf",
    tags: {},
    publicDomain: false,
    sourceNotes: "",
    groupId: null,
    memberEmails: [],
    addedAt: "2026-01-01T00:00:00Z",
    origin: "local",
    ...overrides,
  } as LibMediaItem;
}

/** Create a container div with `#media-list` so renderLocalIntoList doesn't early-return. */
function makeContainer(): HTMLElement {
  const container = document.createElement("div");
  const ul = document.createElement("ul");
  ul.id = "media-list";
  container.appendChild(ul);
  document.body.appendChild(container);
  return container;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("enrichment — cached item (zero IO, no write)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("applies cached metadata without calling extractMetadata or resolveLocalBlob", async () => {
    const item = makeLocalItem({ storagePath: "book.pdf", title: "book" });
    mockListLocal.mockResolvedValue([item]);

    // Pre-populate the sidecar with a cached metadata entry
    const existingData: SidecarData = {
      version: 1,
      metadata: { "book.pdf": { title: "Real Title", pageCount: 50 } },
      positions: {},
    };
    const { dir } = makePreloadedDir(serializeSidecar(existingData));
    setLocalDirectory(dir, true);

    const container = makeContainer();
    await renderLocalIntoList(container);
    await flushWrites();

    // Neither resolveLocalBlob nor extractMetadata should be called
    expect(mockResolveLocalBlob).not.toHaveBeenCalled();
    expect(mockExtractMetadata).not.toHaveBeenCalled();

    // Rendered item should show the enriched title
    expect(container.innerHTML).toContain("Real Title");
  });
});

describe("enrichment — uncached item (extracts and caches)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("calls resolveLocalBlob and extractMetadata for uncached items", async () => {
    const buf = new ArrayBuffer(8);
    const item = makeLocalItem({ storagePath: "book.pdf", title: "book" });
    mockListLocal.mockResolvedValue([item]);
    mockResolveLocalBlob.mockResolvedValue(buf);
    mockExtractMetadata.mockResolvedValue({ title: "Extracted Title", pageCount: 20 });

    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    const container = makeContainer();
    await renderLocalIntoList(container);
    await settleEnrichment();
    await flushWrites();

    expect(mockResolveLocalBlob).toHaveBeenCalledWith(item);
    expect(mockExtractMetadata).toHaveBeenCalledWith(buf, "pdf");

    // Rendered HTML should reflect extracted title
    expect(container.innerHTML).toContain("Extracted Title");

    // Metadata was cached in the sidecar
    const cached = await getMetadata("book.pdf");
    expect(cached).toEqual({ title: "Extracted Title", pageCount: 20 });
  });

  it("persists the cached metadata to disk (writable=true)", async () => {
    const buf = new ArrayBuffer(4);
    const item = makeLocalItem({ storagePath: "novel.epub", title: "novel" });
    mockListLocal.mockResolvedValue([item]);
    mockResolveLocalBlob.mockResolvedValue(buf);
    mockExtractMetadata.mockResolvedValue({ title: "Novel Title" });

    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    const container = makeContainer();
    await renderLocalIntoList(container);
    await settleEnrichment();
    await flushWrites();

    const readBack = await readSidecar(dir);
    expect(readBack.metadata["novel.epub"]).toEqual({ title: "Novel Title" });
  });
});

describe("enrichment — write suppression on focus-rescan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("does NOT write to sidecar when all items are already cached (rescan case)", async () => {
    const item = makeLocalItem({ storagePath: "book.pdf" });
    mockListLocal.mockResolvedValue([item]);

    // Pre-populate the sidecar with a cached entry for this item
    const existingData: SidecarData = {
      version: 1,
      metadata: { "book.pdf": { title: "Book Title", pageCount: 10 } },
      positions: {},
    };
    const { dir } = makePreloadedDir(serializeSidecar(existingData));
    setLocalDirectory(dir, true);

    // Capture createWritable calls on the sidecar dir's index.json file
    // to assert no write happens during rescan
    const commonsDir = (dir as any)._subdirs[".commons-print"];
    const indexHandle = commonsDir._files["index.json"];
    const createWritableBefore = indexHandle.createWritable.mock.calls.length;

    const container = makeContainer();
    await renderLocalIntoList(container);
    await flushWrites();

    // createWritable should NOT have been called (no new writes)
    expect(indexHandle.createWritable.mock.calls.length).toBe(createWritableBefore);
    expect(mockExtractMetadata).not.toHaveBeenCalled();
    expect(mockResolveLocalBlob).not.toHaveBeenCalled();
  });

  it("caches a present {} entry so a second render does NOT re-extract", async () => {
    const buf = new ArrayBuffer(4);
    const item = makeLocalItem({ storagePath: "unknown.pdf" });
    mockListLocal.mockResolvedValue([item]);
    mockResolveLocalBlob.mockResolvedValue(buf);
    // Extract returns empty (no title, no pageCount) — an {} entry IS cached
    mockExtractMetadata.mockResolvedValue({});

    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    const container = makeContainer();
    // First render: extracts and caches {}
    await renderLocalIntoList(container);
    await settleEnrichment();
    await flushWrites();
    expect(mockExtractMetadata).toHaveBeenCalledTimes(1);

    // Second render (simulates focus rescan): {} is a defined entry → no re-extract
    await renderLocalIntoList(container);
    await settleEnrichment();
    await flushWrites();
    expect(mockExtractMetadata).toHaveBeenCalledTimes(1); // still only once
  });
});

describe("enrichment — resolveLocalBlob returns null (file gone)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("does not cache {} when resolveLocalBlob returns null (so next render retries)", async () => {
    const item = makeLocalItem({ storagePath: "gone.pdf" });
    mockListLocal.mockResolvedValue([item]);
    mockResolveLocalBlob.mockResolvedValue(null);

    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    const container = makeContainer();
    await renderLocalIntoList(container);
    await settleEnrichment();
    await flushWrites();

    // extractMetadata should NOT be called (no buf)
    expect(mockExtractMetadata).not.toHaveBeenCalled();

    // No entry should be cached (so next render can retry)
    const cached = await getMetadata("gone.pdf");
    expect(cached).toBeUndefined();
  });
});

describe("enrichment — early return when no media list present", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("no-ops when container has neither #media-list nor #media-empty", async () => {
    const item = makeLocalItem();
    mockListLocal.mockResolvedValue([item]);

    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    // Container with neither element — should bail before enrichment
    const container = document.createElement("div");
    await renderLocalIntoList(container);
    await flushWrites();

    expect(mockExtractMetadata).not.toHaveBeenCalled();
    expect(mockResolveLocalBlob).not.toHaveBeenCalled();
  });
});
