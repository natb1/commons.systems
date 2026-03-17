import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DataIntegrityError } from "../../src/errors";

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

vi.mock("../../src/viewer/epub.js", () => ({
  createEpubRenderer: vi.fn().mockReturnValue({}),
}));

import { renderView, afterRenderView, cleanupView } from "../../src/pages/view";
import type { MediaItem } from "../../src/types";
import { getMediaDownloadUrl } from "../../src/storage";
import { renderViewerShell, initViewer } from "../../src/viewer/shell";
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

      expect(initViewer).toHaveBeenCalledWith(
        outlet,
        expect.any(Function),
        "https://example.com/download",
        "item-1",
        "user-123",
      );

      const factory = (initViewer as ReturnType<typeof vi.fn>).mock.calls.find(
        (call: unknown[]) => call[2] === "https://example.com/download",
      )![1] as (onError: (err: unknown) => void) => unknown;
      factory(() => {});

      expect(createEpubRenderer).toHaveBeenCalled();
    });
  });
});
