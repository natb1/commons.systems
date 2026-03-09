import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityError } from "../../src/errors";

const mockGetPublicMedia = vi.fn();
const mockGetAllAccessibleMedia = vi.fn();

vi.mock("../../src/firestore.js", () => ({
  getPublicMedia: (...args: unknown[]) => mockGetPublicMedia(...args),
  getAllAccessibleMedia: (...args: unknown[]) =>
    mockGetAllAccessibleMedia(...args),
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

import { renderHome } from "../../src/pages/home";
import type { MediaItem } from "../../src/types";

function makeMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: "item-1",
    title: "Test Book",
    mediaType: "pdf",
    tags: { genre: "fiction" },
    publicDomain: true,
    sourceNotes: "Public domain source",
    storagePath: "media/test-book.pdf",
    groupId: null,
    memberEmails: [],
    addedAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

describe("renderHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is null (signed out)", () => {
    it("calls getPublicMedia", async () => {
      mockGetPublicMedia.mockResolvedValue([]);

      await renderHome(null);

      expect(mockGetPublicMedia).toHaveBeenCalled();
      expect(mockGetAllAccessibleMedia).not.toHaveBeenCalled();
    });

    it("shows the public notice", async () => {
      mockGetPublicMedia.mockResolvedValue([]);

      const html = await renderHome(null);

      expect(html).toContain('id="public-notice"');
      expect(html).toContain("Sign in to see your full library");
    });
  });

  describe("when user is signed in", () => {
    const mockUser = { uid: "user-123", email: "user@example.com", displayName: "Test" } as {
      uid: string;
      email: string;
      displayName: string;
    };

    it("calls getAllAccessibleMedia with user email", async () => {
      mockGetAllAccessibleMedia.mockResolvedValue([]);

      await renderHome(mockUser);

      expect(mockGetAllAccessibleMedia).toHaveBeenCalledWith("user@example.com");
      expect(mockGetPublicMedia).not.toHaveBeenCalled();
    });

    it("does not show the public notice", async () => {
      mockGetAllAccessibleMedia.mockResolvedValue([]);

      const html = await renderHome(mockUser);

      expect(html).not.toContain('id="public-notice"');
    });
  });

  it("renders the Library heading", async () => {
    mockGetPublicMedia.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(html).toContain("<h2>Library</h2>");
  });

  it("renders empty state when no items are returned", async () => {
    mockGetPublicMedia.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(html).toContain('id="media-empty"');
    expect(html).toContain("No media items available.");
  });

  it("renders media list with items", async () => {
    mockGetPublicMedia.mockResolvedValue([
      makeMediaItem({ id: "book-1", title: "First Book" }),
      makeMediaItem({ id: "book-2", title: "Second Book", mediaType: "epub" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('id="media-list"');
    expect(html).toContain("First Book");
    expect(html).toContain("Second Book");
  });

  it("renders media-item elements with data-id attributes", async () => {
    mockGetPublicMedia.mockResolvedValue([
      makeMediaItem({ id: "book-1" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('class="media-item"');
    expect(html).toContain('data-id="book-1"');
  });

  it("renders a view link for each item", async () => {
    mockGetPublicMedia.mockResolvedValue([
      makeMediaItem({ id: "book-1" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('href="#/view/book-1"');
    expect(html).toContain('class="media-view"');
  });

  it("renders a download button for each item", async () => {
    mockGetPublicMedia.mockResolvedValue([
      makeMediaItem({ storagePath: "media/test.pdf" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('class="media-download"');
    expect(html).toContain('data-path="media/test.pdf"');
  });

  it("renders media type badge", async () => {
    mockGetPublicMedia.mockResolvedValue([
      makeMediaItem({ mediaType: "epub" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('class="media-badge"');
    expect(html).toContain("epub");
  });

  it("renders error fallback when Firestore fails", async () => {
    mockGetPublicMedia.mockRejectedValue(new Error("connection failed"));

    const html = await renderHome(null);

    expect(html).toContain('id="media-error"');
    expect(html).toContain("Could not load media library.");
  });

  it("re-throws DataIntegrityError", async () => {
    mockGetPublicMedia.mockRejectedValue(
      new DataIntegrityError("corrupt data"),
    );

    await expect(renderHome(null)).rejects.toThrow(DataIntegrityError);
  });
});
