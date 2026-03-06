import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetMediaItem = vi.fn();

vi.mock("../../src/firestore.js", () => ({
  getMediaItem: (...args: unknown[]) => mockGetMediaItem(...args),
}));

vi.mock("../../src/storage.js", () => ({
  getMediaDownloadUrl: vi.fn(),
}));

vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

import { renderView } from "../../src/pages/view";
import type { MediaItem } from "../../src/types";

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
    memberUids: ["user-1"],
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

      expect(html).toContain('href="#/"');
      expect(html).toContain('class="back-link"');
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

      expect(html).toContain('href="#/"');
      expect(html).toContain('class="back-link"');
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

      expect(html).toContain('href="#/"');
      expect(html).toContain('class="back-link"');
    });
  });

  describe("when item is found", () => {
    it("renders the item title as a heading", async () => {
      mockGetMediaItem.mockResolvedValue(makeMediaItem({ title: "My Book" }));

      const html = await renderView("item-1", null);

      expect(html).toContain("<h2>My Book</h2>");
    });

    it("renders a back link to the library", async () => {
      mockGetMediaItem.mockResolvedValue(makeMediaItem());

      const html = await renderView("item-1", null);

      expect(html).toContain('href="#/"');
      expect(html).toContain('class="back-link"');
      expect(html).toContain("Back to Library");
    });

    it("renders the media type badge", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ mediaType: "epub" }),
      );

      const html = await renderView("item-1", null);

      expect(html).toContain('class="media-badge"');
      expect(html).toContain("epub");
    });

    it("renders public domain status as Yes", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ publicDomain: true }),
      );

      const html = await renderView("item-1", null);

      expect(html).toContain("Public Domain");
      expect(html).toContain("Yes");
    });

    it("renders public domain status as No", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ publicDomain: false }),
      );

      const html = await renderView("item-1", null);

      expect(html).toContain("Public Domain");
      expect(html).toContain("No");
    });

    it("renders source notes", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ sourceNotes: "From Project Gutenberg" }),
      );

      const html = await renderView("item-1", null);

      expect(html).toContain("Source Notes");
      expect(html).toContain("From Project Gutenberg");
    });

    it("renders storage path", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ storagePath: "media/archive.zip" }),
      );

      const html = await renderView("item-1", null);

      expect(html).toContain("Storage Path");
      expect(html).toContain("media/archive.zip");
    });

    it("renders the addedAt date", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ addedAt: "2026-01-15T00:00:00Z" }),
      );

      const html = await renderView("item-1", null);

      expect(html).toContain('datetime="2026-01-15T00:00:00Z"');
    });

    it("renders tags as a table", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ tags: { genre: "fiction", language: "English" } }),
      );

      const html = await renderView("item-1", null);

      expect(html).toContain('class="tags-table"');
      expect(html).toContain("genre");
      expect(html).toContain("fiction");
      expect(html).toContain("language");
      expect(html).toContain("English");
    });

    it("renders 'No tags.' when tags are empty", async () => {
      mockGetMediaItem.mockResolvedValue(makeMediaItem({ tags: {} }));

      const html = await renderView("item-1", null);

      expect(html).toContain("No tags.");
    });

    it("escapes HTML in title", async () => {
      mockGetMediaItem.mockResolvedValue(
        makeMediaItem({ title: "<script>alert(1)</script>" }),
      );

      const html = await renderView("item-1", null);

      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });
});
