import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

import { renderViewerShell } from "../../src/viewer/shell";
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
    memberEmails: ["user@example.com"],
    addedAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

describe("renderViewerShell", () => {
  it("contains .viewer container with data-orientation='landscape'", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer"');
    expect(html).toContain('data-orientation="landscape"');
  });

  it("contains .viewer-content with .viewer-canvas-wrap (no embedded canvas)", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-content"');
    expect(html).toContain('class="viewer-canvas-wrap"');
    expect(html).not.toContain('id="viewer-canvas"');
  });

  it("contains .viewer-panel aside element", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-panel"');
    expect(html).toContain("<aside");
  });

  it("contains .viewer-back link with href='/' and 'Back to Library' text", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('href="/"');
    expect(html).toContain('class="viewer-back"');
    expect(html).toContain("Back to Library");
  });

  it("contains .viewer-nav with .viewer-prev and .viewer-next buttons (both disabled)", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-nav"');
    expect(html).toContain('class="viewer-prev" disabled');
    expect(html).toContain('class="viewer-next" disabled');
  });

  it("contains .viewer-position with 'Loading...' text", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-position"');
    expect(html).toContain("Loading...");
  });

  it("contains .viewer-meta with .viewer-title", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-meta"');
    expect(html).toContain('class="viewer-title"');
  });

  it("contains .viewer-panel-toggle button with aria-expanded='true'", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-panel-toggle"');
    expect(html).toContain('aria-expanded="true"');
  });

  it("renders title in .viewer-title", () => {
    const html = renderViewerShell(makeMediaItem({ title: "My Great Book" }));

    expect(html).toContain("My Great Book");
  });

  it("renders media type badge", () => {
    const html = renderViewerShell(makeMediaItem({ mediaType: "epub" }));

    expect(html).toContain('class="media-badge"');
    expect(html).toContain("epub");
  });

  it("renders 'Public Domain' text when publicDomain is true", () => {
    const html = renderViewerShell(makeMediaItem({ publicDomain: true }));

    expect(html).toContain("Public Domain");
  });

  it("does not render 'Public Domain' text when publicDomain is false", () => {
    const html = renderViewerShell(makeMediaItem({ publicDomain: false }));

    expect(html).not.toContain("Public Domain");
  });

  it("renders source notes", () => {
    const html = renderViewerShell(
      makeMediaItem({ sourceNotes: "From Project Gutenberg" }),
    );

    expect(html).toContain("From Project Gutenberg");
  });

  it("renders tags as .viewer-tag spans with 'key: value' format", () => {
    const html = renderViewerShell(
      makeMediaItem({ tags: { genre: "fiction", language: "English" } }),
    );

    expect(html).toContain('class="viewer-tag"');
    expect(html).toContain("genre: fiction");
    expect(html).toContain("language: English");
  });

  it("renders no .viewer-tag elements when tags are empty", () => {
    const html = renderViewerShell(makeMediaItem({ tags: {} }));

    expect(html).not.toContain('class="viewer-tag"');
  });

  it("escapes HTML in title", () => {
    const html = renderViewerShell(
      makeMediaItem({ title: "<script>alert(1)</script>" }),
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
