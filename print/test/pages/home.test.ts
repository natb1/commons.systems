import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const mockListCloud = vi.fn();

// renderHome routes its cloud fetch through library.ts's listCloud(); the
// per-viewer dispatch (public vs. accessible) now lives in library.ts and is
// covered by library.test.ts. Mock the library seam here so renderHome's
// rendering is tested without real firebase init.
vi.mock("../../src/library.js", () => ({
  listCloud: (...args: unknown[]) => mockListCloud(...args),
}));

// local-folder-ui.ts transitively imports firebase via library.ts; only
// afterRenderHome uses it, so stub it for the render-only tests.
vi.mock("../../src/local-folder-ui.js", () => ({
  initLocalFolder: vi.fn().mockResolvedValue(null),
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
    markdownPath: null,
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
    it("fetches the cloud library via listCloud", async () => {
      mockListCloud.mockResolvedValue([]);

      await renderHome(null);

      expect(mockListCloud).toHaveBeenCalled();
    });

    it("shows the public notice", async () => {
      mockListCloud.mockResolvedValue([]);

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

    it("fetches the cloud library via listCloud", async () => {
      mockListCloud.mockResolvedValue([]);

      await renderHome(mockUser);

      expect(mockListCloud).toHaveBeenCalled();
    });

    it("does not show the public notice", async () => {
      mockListCloud.mockResolvedValue([]);

      const html = await renderHome(mockUser);

      expect(html).not.toContain('id="public-notice"');
    });
  });

  it("renders the Library heading", async () => {
    mockListCloud.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(html).toContain("<h2>Library</h2>");
  });

  it("renders the local-folder section", async () => {
    mockListCloud.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(html).toContain('id="local-folder"');
  });

  it("renders empty state when no items are returned", async () => {
    mockListCloud.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(html).toContain('id="media-empty"');
    expect(html).toContain("No media items available.");
  });

  it("renders media list with items", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ id: "book-1", title: "First Book" }),
      makeMediaItem({ id: "book-2", title: "Second Book", mediaType: "epub" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('id="media-list"');
    expect(html).toContain("First Book");
    expect(html).toContain("Second Book");
  });

  it("renders media-item elements with data-id attributes", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ id: "book-1" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('class="media-item"');
    expect(html).toContain('data-id="book-1"');
  });

  it("renders a view link for each item", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ id: "book-1" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('href="/view/book-1"');
    expect(html).toContain('class="media-view"');
  });

  it("renders a download button for each item", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ storagePath: "media/test.pdf" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('class="media-download"');
    expect(html).toContain('data-path="media/test.pdf"');
  });

  it("renders media type badge", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ mediaType: "epub" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('class="media-badge"');
    expect(html).toContain("epub");
  });

  it("renders error fallback when Firestore fails", async () => {
    mockListCloud.mockRejectedValue(new Error("connection failed"));

    const html = await renderHome(null);

    expect(html).toContain('id="media-error"');
    expect(html).toContain("Could not load media library.");
  });

  it("renders markdown buttons when markdownPath is non-null", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ markdownPath: "media/test.md" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('class="media-md-download"');
    expect(html).toContain('class="media-md-copy"');
    expect(html).toContain('data-md-path="media/test.md"');
  });

  it("does not render markdown buttons when markdownPath is null", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem(),
    ]);

    const html = await renderHome(null);

    expect(html).not.toContain("media-md-download");
    expect(html).not.toContain("media-md-copy");
  });

  it("re-throws DataIntegrityError", async () => {
    mockListCloud.mockRejectedValue(
      new DataIntegrityError("corrupt data"),
    );

    await expect(renderHome(null)).rejects.toThrow(DataIntegrityError);
  });
});
