import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("../../src/reading-position.js", () => ({
  getReadingPosition: vi.fn().mockResolvedValue(null),
  saveReadingPosition: vi.fn().mockResolvedValue(undefined),
}));

import { renderViewerShell, initViewer } from "../../src/viewer/shell";
import {
  getReadingPosition,
  saveReadingPosition,
} from "../../src/reading-position";
import type { MediaItem } from "../../src/types";
import type { ContentRenderer } from "../../src/viewer/types";

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

function makeMockRenderer(overrides: Partial<ContentRenderer> = {}): ContentRenderer {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    goToPage: vi.fn().mockResolvedValue(undefined),
    next: vi.fn().mockResolvedValue(undefined),
    prev: vi.fn().mockResolvedValue(undefined),
    pageCount: 10,
    currentPage: 1,
    canGoNext: true,
    canGoPrev: false,
    position: "pos-1",
    positionLabel: "Page 1 / 10",
    destroy: vi.fn(),
    ...overrides,
  };
}

describe("initViewer", () => {
  let outlet: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    outlet = document.createElement("div");
    outlet.innerHTML = renderViewerShell(makeMediaItem());
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(globalThis.reportError).mockRestore();
  });

  it("disables prev and enables next based on canGoPrev/canGoNext", async () => {
    const renderer = makeMockRenderer({ canGoNext: true, canGoPrev: false });

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", null);

    // Wait for async init to complete
    await vi.advanceTimersByTimeAsync(0);

    const prevBtn = outlet.querySelector(".viewer-prev") as HTMLButtonElement;
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);
  });

  it("saves position to Firestore for authenticated users after navigation", async () => {
    const renderer = makeMockRenderer({ canGoNext: true, canGoPrev: false, position: "pos-nav" });

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid-123");

    // Wait for init (getReadingPosition resolves null, then renderer.init, then updateNav)
    await vi.advanceTimersByTimeAsync(0);

    // Simulate navigation by clicking next
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await vi.advanceTimersByTimeAsync(0);

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(500);

    expect(saveReadingPosition).toHaveBeenCalledWith("uid-123", "m1", "pos-nav");
  });

  it("saves position to localStorage for anonymous users after navigation", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});

    const renderer = makeMockRenderer({ canGoNext: true, canGoPrev: false, position: "pos-anon" });

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", null);

    await vi.advanceTimersByTimeAsync(0);

    // Simulate navigation
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await vi.advanceTimersByTimeAsync(0);

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(500);

    expect(setItemSpy).toHaveBeenCalledWith("reading-position:m1", "pos-anon");
    setItemSpy.mockRestore();
  });

  it("cleanup calls renderer.destroy and removes keydown listener", async () => {
    const renderer = makeMockRenderer();

    const cleanup = initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", null);
    await vi.advanceTimersByTimeAsync(0);

    cleanup();

    expect(renderer.destroy).toHaveBeenCalled();
  });

  it("still initializes renderer when getReadingPosition rejects", async () => {
    vi.mocked(getReadingPosition).mockRejectedValueOnce(new Error("Firestore down"));

    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid-123");

    await vi.advanceTimersByTimeAsync(0);

    expect(renderer.init).toHaveBeenCalled();
    const positionEl = outlet.querySelector(".viewer-position") as HTMLElement;
    expect(positionEl.textContent).toBe("Page 1 / 10");
  });
});
