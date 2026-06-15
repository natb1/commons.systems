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

vi.mock("../../src/viewer/shell.js", () => ({
  renderViewerShell: vi.fn().mockReturnValue('<div class="viewer">mock viewer</div>'),
  initViewer: vi.fn().mockReturnValue(() => {}),
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
  afterRenderView,
  cleanupView,
  pickPositionStore,
  makeLocalStoragePositionStore,
} from "../../src/pages/view";
import type { MediaItem } from "../../src/types";
import { getMediaDownloadUrl } from "../../src/storage";
import { renderViewerShell, initViewer } from "../../src/viewer/shell";
import { createImageArchiveRenderer } from "../../src/viewer/image-archive";
import { createEpubRenderer } from "../../src/viewer/epub";

function makeMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: "item-1",
    title: "Test Book",
    mediaType: "pdf",
    tags: { genre: "fiction", author: "Test Author" },
    publicDomain: true,
    sourceNotes: "Sourced from archive.org",
    storagePath: "media/test-book.pdf",
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

describe("local-folder view path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhenLocalFolderReady.mockResolvedValue(undefined);
    cleanupView();
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
  });

  it("renders the viewer shell and uses the sidecar store for a found local item", async () => {
    const item = makeMediaItem({
      id: "local:book.pdf",
      storagePath: "book.pdf",
      mediaType: "pdf",
      origin: "local",
    });
    mockGetLocalItem.mockResolvedValue(item);

    await renderView("local:book.pdf", mockUser);
    expect(renderViewerShell).toHaveBeenCalledWith(item);
    // The cloud download path is never touched for a local item.
    expect(getMediaDownloadUrl).not.toHaveBeenCalled();

    const outlet = document.createElement("div");
    afterRenderView(outlet, mockUser);

    // Signed-in user viewing a LOCAL item still routes to the sidecar — never Firestore.
    expect(mockMakeSidecarPositionStore).toHaveBeenCalledWith("book.pdf");
    expect(mockMakeFirestorePositionStore).not.toHaveBeenCalled();
    expect(initViewer).toHaveBeenCalledWith(
      outlet,
      expect.any(Function),
      expect.any(Function),
      "local:book.pdf",
      sidecarStore,
      null,
    );
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
    const html = await pending;

    expect(html).toContain('class="viewer"');
    expect(renderViewerShell).toHaveBeenCalledWith(item);
  });

  it("resolve closure surfaces the #view-error UI when the file is gone", async () => {
    const item = makeMediaItem({ id: "local:book.pdf", origin: "local" });
    mockGetLocalItem.mockResolvedValue(item);
    mockResolveLocalBlob.mockResolvedValue(null);

    await renderView("local:book.pdf", null);
    const outlet = document.createElement("div");
    afterRenderView(outlet, null);

    const resolveSource = vi.mocked(initViewer).mock.calls[0][2];
    // The closure fully handles the failure (reportError + #view-error UI) and
    // returns a never-settling promise so initViewer does not re-enter its own
    // catch for the same error — so assert the side effects, not a rejection.
    resolveSource();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(outlet.innerHTML).toContain('id="view-error"');
    expect(globalThis.reportError).toHaveBeenCalledTimes(1);
  });
});

describe("afterRenderView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupView();
  });

  it("initializes image archive renderer when mediaType is image-archive", async () => {
    const item = makeMediaItem({ mediaType: "image-archive", storagePath: "media/archive.cbz" });
    mockGetMediaItem.mockResolvedValue(item);

    const outlet = document.createElement("div");
    outlet.innerHTML = '<div class="viewer"></div>';

    await renderView("item-1", null);
    afterRenderView(outlet, null);

    expect(initViewer).toHaveBeenCalled();
    // Verify the factory passed to initViewer creates an image archive renderer
    const factory = vi.mocked(initViewer).mock.calls[0][1];
    factory(vi.fn());
    expect(createImageArchiveRenderer).toHaveBeenCalled();
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

      const html = await renderView("missing-id", mockUser);

      expect(html).toContain('id="view-not-found"');
      expect(html).toContain("Media item not found.");
    });

    it("calls getMediaItem with the provided id", async () => {
      mockGetMediaItem.mockResolvedValue(null);

      await renderView("missing-id", mockUser);

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
    it("renders viewer shell", async () => {
      const item = makeMediaItem();
      mockGetMediaItem.mockResolvedValue(item);

      const html = await renderView("item-1", null);

      expect(renderViewerShell).toHaveBeenCalledWith(item);
      expect(html).toContain('class="viewer"');
    });

    it("calls getMediaDownloadUrl with item storage path", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ storagePath: "media/archive.zip" }),
      );

      await renderView("item-1", null);

      expect(getMediaDownloadUrl).toHaveBeenCalledWith("media/archive.zip");
    });

    it("escapes HTML in title via renderViewerShell", async () => {
      const item = makeMediaItem({ title: "<script>alert(1)</script>" });
      mockGetMediaItem.mockResolvedValue(item);

      await renderView("item-1", null);

      expect(renderViewerShell).toHaveBeenCalledWith(item);
    });
  });

  describe("afterRenderView", () => {
    beforeEach(() => {
      cleanupView();
    });

    it("dispatches epub media type to createEpubRenderer", async () => {
      const item = makeMediaItem({ mediaType: "epub", storagePath: "media/book.epub" });
      mockGetMediaItem.mockResolvedValue(item);

      await renderView("item-1", mockUser);

      const outlet = document.createElement("div");
      afterRenderView(outlet, mockUser);

      expect(mockMakeFirestorePositionStore).toHaveBeenCalledWith("user-123", "item-1");
      expect(initViewer).toHaveBeenCalledWith(
        outlet,
        expect.any(Function),
        expect.any(Function),
        "item-1",
        firestoreStore,
        "user-123",
      );

      const factory = (initViewer as ReturnType<typeof vi.fn>).mock.calls[0][1] as (onError: (err: unknown) => void) => unknown;
      factory(() => {});

      expect(createEpubRenderer).toHaveBeenCalled();
    });
  });
});
