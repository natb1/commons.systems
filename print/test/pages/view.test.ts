import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const mockGetMediaItem = vi.fn();

vi.mock("../../src/firestore.js", () => ({
  getMediaItem: (...args: unknown[]) => mockGetMediaItem(...args),
}));

vi.mock("../../src/storage.js", () => ({
  getMediaDownloadUrl: vi.fn().mockResolvedValue("https://example.com/download"),
}));

vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("../../src/viewer/pdf.js", () => ({
  createPdfRenderer: vi.fn().mockReturnValue({}),
}));

vi.mock("../../src/viewer/image-archive.js", () => ({
  createImageArchiveRenderer: vi.fn().mockReturnValue({}),
}));

vi.mock("../../src/viewer/epub.js", () => ({
  createEpubRenderer: vi.fn().mockReturnValue({}),
}));

vi.mock("../../src/media-cache.js", () => ({
  getFile: vi.fn().mockResolvedValue(null),
  putFile: vi.fn().mockResolvedValue(undefined),
}));

const mockGetLocalItem = vi.fn();
const mockResolveLocalBlob = vi.fn();
const mockWhenLocalFolderReady = vi.fn().mockResolvedValue(undefined);

vi.mock("../../src/library.js", () => ({
  isLocalId: (id: string) => id.startsWith("local:"),
  getLocalItem: (...args: unknown[]) => mockGetLocalItem(...args),
  resolveLocalBlob: (...args: unknown[]) => mockResolveLocalBlob(...args),
  whenLocalFolderReady: (...args: unknown[]) => mockWhenLocalFolderReady(...args),
}));

const sidecarStore = { kind: "sidecar" };
const firestoreStore = { kind: "firestore" };
const mockMakeSidecarPositionStore = vi.fn(() => sidecarStore);
const mockMakeFirestorePositionStore = vi.fn(() => firestoreStore);

vi.mock("../../src/sidecar.js", () => ({
  makeSidecarPositionStore: (...args: unknown[]) => mockMakeSidecarPositionStore(...args),
}));

vi.mock("../../src/reading-position.js", () => ({
  makeFirestorePositionStore: (...args: unknown[]) => mockMakeFirestorePositionStore(...args),
}));

import {
  renderView,
  resolveViewerProps,
  pickPositionStore,
  makeLocalStoragePositionStore,
  getViewFrame,
} from "../../src/pages/view";
import type { ViewFrame } from "../../src/pages/view";
import type { MediaItem } from "../../src/types";
import { getMediaDownloadUrl } from "../../src/storage";
import { createImageArchiveRenderer } from "../../src/viewer/image-archive";
import { createEpubRenderer } from "../../src/viewer/epub";
import { getFile } from "../../src/media-cache";

function makeMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: "item-1",
    title: "Test Book",
    mediaType: "pdf",
    tags: { genre: "fiction", author: "Test Author" },
    publicDomain: true,
    sourceNotes: "Sourced from archive.org",
    storagePath: "media/test-book.pdf",
    markdownPath: null,
    groupId: null,
    memberEmails: ["user@example.com"],
    addedAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

const mockUser = { uid: "user-123", displayName: "Test" } as {
  uid: string;
  displayName: string;
};

/** Narrow getViewFrame() to the "ready" frame's props, failing loudly otherwise. */
function readyProps(frame: ViewFrame) {
  if (frame.kind !== "ready") throw new Error(`expected ready frame, got ${frame.kind}`);
  return frame.props;
}

describe("pickPositionStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("local item, signed in: returns the sidecar store, NEVER Firestore", () => {
    // The local-never-Firestore invariant: routing keys on isLocal, not auth.
    const item = makeMediaItem({ id: "local:book.pdf", storagePath: "book.pdf" });

    const store = pickPositionStore(item, true, "user-123");

    expect(store).toBe(sidecarStore);
    expect(mockMakeSidecarPositionStore).toHaveBeenCalledWith("book.pdf");
    expect(mockMakeFirestorePositionStore).not.toHaveBeenCalled();
  });

  it("local item, anonymous: returns the sidecar store keyed on the bare filename", () => {
    const item = makeMediaItem({ id: "local:book.pdf", storagePath: "book.pdf" });

    const store = pickPositionStore(item, true, null);

    expect(store).toBe(sidecarStore);
    expect(mockMakeSidecarPositionStore).toHaveBeenCalledWith("book.pdf");
  });

  it("cloud item, signed in: returns the Firestore store keyed on uid + mediaId", () => {
    const item = makeMediaItem({ id: "item-1" });

    const store = pickPositionStore(item, false, "user-123");

    expect(store).toBe(firestoreStore);
    expect(mockMakeFirestorePositionStore).toHaveBeenCalledWith("user-123", "item-1");
  });

  it("cloud item, anonymous: returns a localStorage-backed store", async () => {
    const item = makeMediaItem({ id: "item-1" });

    const store = pickPositionStore(item, false, null);

    expect(mockMakeFirestorePositionStore).not.toHaveBeenCalled();
    // localStorage store reproduces the prior inline key.
    await store.save("9");
    expect(localStorage.getItem("reading-position:item-1")).toBe("9");
  });
});

describe("makeLocalStoragePositionStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a position under the reading-position:<mediaId> key", async () => {
    const store = makeLocalStoragePositionStore("m1");

    expect(await store.load()).toBeNull();
    await store.save("12");
    expect(localStorage.getItem("reading-position:m1")).toBe("12");
    expect(await store.load()).toBe("12");
  });
});

describe("resolveViewerProps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(globalThis.reportError).mockRestore();
  });

  it("local item, signed-in user: routes to the sidecar store with uid null (never Firestore)", () => {
    const item = makeMediaItem({ id: "local:book.pdf", storagePath: "book.pdf", origin: "local" });

    const props = resolveViewerProps(item, true, null, mockUser as never);

    expect(props.store).toBe(sidecarStore);
    expect(props.uid).toBeNull();
    expect(mockMakeSidecarPositionStore).toHaveBeenCalledWith("book.pdf");
    expect(mockMakeFirestorePositionStore).not.toHaveBeenCalled();
    expect(props.item).toBe(item);
  });

  it("cloud epub, signed in: Firestore store + uid + epub renderer factory", () => {
    const item = makeMediaItem({ mediaType: "epub", storagePath: "media/book.epub" });

    const props = resolveViewerProps(item, false, "https://example.com/book.epub", mockUser as never);

    expect(props.store).toBe(firestoreStore);
    expect(props.uid).toBe("user-123");
    expect(mockMakeFirestorePositionStore).toHaveBeenCalledWith("user-123", "item-1");

    props.createRenderer(() => {});
    expect(createEpubRenderer).toHaveBeenCalled();
  });

  it("cloud image-archive: routes resolveSource through resolveFileSource (cache-first)", async () => {
    const item = makeMediaItem({ mediaType: "image-archive", storagePath: "media/archive.cbz" });
    const cached = new ArrayBuffer(16);
    vi.mocked(getFile).mockResolvedValueOnce(cached);

    const props = resolveViewerProps(item, false, "https://example.com/archive", null);

    props.createRenderer(() => {});
    expect(createImageArchiveRenderer).toHaveBeenCalledWith(expect.any(Function));
    // image-archive routes through resolveFileSource: cache-first whole-file load.
    await expect(props.resolveSource()).resolves.toBe(cached);
    expect(getFile).toHaveBeenCalledWith("media/archive.cbz");
  });

  it("local resolveSource: rejects and reports once when the file is gone", async () => {
    const item = makeMediaItem({ id: "local:book.pdf", origin: "local" });
    mockResolveLocalBlob.mockResolvedValue(null);

    const props = resolveViewerProps(item, true, null, null);

    await expect(props.resolveSource()).rejects.toThrow("Local file no longer present");
    expect(globalThis.reportError).toHaveBeenCalledTimes(1);
  });

  it("local resolveSource: resolves to the blob buffer when present", async () => {
    const item = makeMediaItem({ id: "local:book.pdf", origin: "local" });
    const buf = new ArrayBuffer(8);
    mockResolveLocalBlob.mockResolvedValue(buf);

    const props = resolveViewerProps(item, true, null, null);

    await expect(props.resolveSource()).resolves.toBe(buf);
  });
});

describe("local-folder view path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhenLocalFolderReady.mockResolvedValue(undefined);
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(globalThis.reportError).mockRestore();
  });

  it("shows not-found when the local item is missing", async () => {
    mockGetLocalItem.mockResolvedValue(null);

    const html = await renderView("local:gone.pdf", null);

    expect(mockGetLocalItem).toHaveBeenCalledWith("local:gone.pdf");
    expect(mockGetMediaItem).not.toHaveBeenCalled();
    expect(html).toContain('id="view-not-found"');
    expect(getViewFrame()).toEqual({ kind: "notFound" });
  });

  it("builds a ready frame with the sidecar store for a found local item (signed-in)", async () => {
    const item = makeMediaItem({
      id: "local:book.pdf",
      storagePath: "book.pdf",
      mediaType: "pdf",
      origin: "local",
    });
    mockGetLocalItem.mockResolvedValue(item);

    await renderView("local:book.pdf", mockUser as never);

    // The cloud download path is never touched for a local item.
    expect(getMediaDownloadUrl).not.toHaveBeenCalled();

    const props = readyProps(getViewFrame());
    // Signed-in user viewing a LOCAL item still routes to the sidecar — never Firestore.
    expect(mockMakeSidecarPositionStore).toHaveBeenCalledWith("book.pdf");
    expect(mockMakeFirestorePositionStore).not.toHaveBeenCalled();
    expect(props.item).toBe(item);
    expect(props.store).toBe(sidecarStore);
    expect(props.uid).toBeNull();
  });

  it("awaits local-folder readiness, then resolves once binding completes", async () => {
    let bound = false;
    let resolveReady!: () => void;
    mockWhenLocalFolderReady.mockReturnValue(
      new Promise<void>((r) => {
        resolveReady = r;
      }),
    );
    const item = makeMediaItem({ id: "local:book.pdf", origin: "local" });
    mockGetLocalItem.mockImplementation(async () => (bound ? item : null));

    // Start the render before readiness settles; it must not resolve to
    // Not Found while the local source is still unbound.
    const pending = renderView("local:book.pdf", null);
    bound = true;
    resolveReady();
    await pending;

    expect(readyProps(getViewFrame()).item).toBe(item);
  });
});

describe("renderView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(globalThis.reportError).mockRestore();
  });

  describe("when id is empty", () => {
    it("shows not-found message", async () => {
      const html = await renderView("", null);

      expect(html).toContain('id="view-not-found"');
      expect(html).toContain("No media item specified.");
    });

    it("does not call getMediaItem", async () => {
      await renderView("", null);

      expect(mockGetMediaItem).not.toHaveBeenCalled();
    });

    it("includes a back link to the library", async () => {
      const html = await renderView("", null);

      expect(html).toContain('href="/"');
      expect(html).toContain('class="viewer-back"');
    });
  });

  describe("when item is not found", () => {
    it("shows not-found message", async () => {
      mockGetMediaItem.mockResolvedValue(null);

      const html = await renderView("missing-id", mockUser as never);

      expect(html).toContain('id="view-not-found"');
      expect(html).toContain("Media item not found.");
    });

    it("calls getMediaItem with the provided id", async () => {
      mockGetMediaItem.mockResolvedValue(null);

      await renderView("missing-id", mockUser as never);

      expect(mockGetMediaItem).toHaveBeenCalledWith("missing-id");
    });

    it("includes a back link", async () => {
      mockGetMediaItem.mockResolvedValue(null);

      const html = await renderView("missing-id", null);

      expect(html).toContain('href="/"');
      expect(html).toContain('class="viewer-back"');
    });
  });

  describe("when getMediaItem throws", () => {
    it("shows error message", async () => {
      mockGetMediaItem.mockRejectedValue(new Error("network error"));

      const html = await renderView("item-1", null);

      expect(html).toContain('id="view-error"');
      expect(html).toContain("Could not load this media item.");
    });

    it("includes a back link", async () => {
      mockGetMediaItem.mockRejectedValue(new Error("network error"));

      const html = await renderView("item-1", null);

      expect(html).toContain('href="/"');
      expect(html).toContain('class="viewer-back"');
    });

    it("re-throws DataIntegrityError", async () => {
      mockGetMediaItem.mockRejectedValue(
        new DataIntegrityError("corrupt data"),
      );

      await expect(renderView("item-1", null)).rejects.toThrow(
        DataIntegrityError,
      );
    });
  });

  describe("when item is found", () => {
    it("builds a ready frame and fetches the download URL", async () => {
      const item = makeMediaItem();
      mockGetMediaItem.mockResolvedValue(item);

      await renderView("item-1", null);

      expect(readyProps(getViewFrame()).item).toBe(item);
    });

    it("calls getMediaDownloadUrl with item storage path", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ storagePath: "media/archive.zip", mediaType: "image-archive" }),
      );

      await renderView("item-1", null);

      expect(getMediaDownloadUrl).toHaveBeenCalledWith("media/archive.zip");
    });

    it("dispatches epub media type to createEpubRenderer via the ready props", async () => {
      const item = makeMediaItem({ mediaType: "epub", storagePath: "media/book.epub" });
      mockGetMediaItem.mockResolvedValue(item);

      await renderView("item-1", mockUser as never);

      const props = readyProps(getViewFrame());
      expect(mockMakeFirestorePositionStore).toHaveBeenCalledWith("user-123", "item-1");
      expect(props.uid).toBe("user-123");
      expect(props.store).toBe(firestoreStore);

      props.createRenderer(() => {});
      expect(createEpubRenderer).toHaveBeenCalled();
    });

    it("dispatches image-archive media type to createImageArchiveRenderer via the ready props", async () => {
      const item = makeMediaItem({ mediaType: "image-archive", storagePath: "media/archive.cbz" });
      mockGetMediaItem.mockResolvedValue(item);

      await renderView("item-1", null);

      const props = readyProps(getViewFrame());
      props.createRenderer(() => {});
      expect(createImageArchiveRenderer).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
