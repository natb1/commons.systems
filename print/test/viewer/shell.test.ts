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

function makeMockRenderer(overrides: Partial<ContentRenderer> = {}): ContentRenderer {
  let _currentPage = 1;
  const _pageCount = 10;
  return {
    init: vi.fn().mockResolvedValue(undefined),
    goToPage: vi.fn().mockImplementation(async (p: number) => { _currentPage = p; }),
    next: vi.fn().mockImplementation(async () => { if (_currentPage < _pageCount) _currentPage++; }),
    prev: vi.fn().mockImplementation(async () => { if (_currentPage > 1) _currentPage--; }),
    get pageCount() { return _pageCount; },
    get currentPage() { return _currentPage; },
    get canGoNext() { return _currentPage < _pageCount; },
    get canGoPrev() { return _currentPage > 1; },
    get position() { return String(_currentPage); },
    get positionLabel() { return `Page ${_currentPage} / ${_pageCount}`; },
    destroy: vi.fn(),
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

describe("initViewer", () => {
  let outlet: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    outlet = document.createElement("div");
    outlet.innerHTML = renderViewerShell(makeMediaItem());
    localStorage.clear();
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(globalThis.reportError).mockRestore();
  });

  async function flushInit(): Promise<void> {
    // 20 is a conservative ceiling — 6-8 ticks would suffice for the current chain
    // (getReadingPosition -> renderer.init -> updateNav), but extra margin avoids
    // intermittent failures if another await is added to the init path.
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  it("disables prev and enables next based on canGoPrev/canGoNext", async () => {
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", null);
    await flushInit();

    const prevBtn = outlet.querySelector(".viewer-prev") as HTMLButtonElement;
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);
  });

  it("authenticated: loads position from Firestore and passes to renderer.init", async () => {
    vi.mocked(getReadingPosition).mockResolvedValue("5");
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid1");
    await flushInit();

    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "https://example.com/doc.pdf",
      "5",
    );
  });

  it("unauthenticated: loads from localStorage and passes to renderer.init", async () => {
    localStorage.setItem("reading-position:m1", "3");
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", null);
    await flushInit();

    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "https://example.com/doc.pdf",
      "3",
    );
  });

  it("unauthenticated: no saved position, init called with undefined", async () => {
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", null);
    await flushInit();

    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "https://example.com/doc.pdf",
      undefined,
    );
  });

  it("scheduleSave writes Firestore for authenticated user after navigation", async () => {
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid1");
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();
    await vi.runAllTimersAsync();

    // After next(), currentPage=2, position="2", which differs from lastSavedPosition="1"
    expect(saveReadingPosition).toHaveBeenCalledWith("uid1", "m1", "2");
  });

  it("scheduleSave writes localStorage for unauthenticated user", async () => {
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", null);
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();
    await vi.runAllTimersAsync();

    expect(localStorage.getItem("reading-position:m1")).toBe("2");
  });

  it("scheduleSave deduplicates — same position not saved twice", async () => {
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid1");
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();
    await vi.runAllTimersAsync();

    // Timer fires again without navigation — position unchanged
    await vi.runAllTimersAsync();

    // saveReadingPosition was called once for page 2; no second call for same position
    expect(saveReadingPosition).toHaveBeenCalledTimes(1);
  });

  it("still initializes renderer when getReadingPosition rejects", async () => {
    vi.mocked(getReadingPosition).mockRejectedValue(new Error("Firestore down"));
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid1");
    await flushInit();

    expect(renderer.init).toHaveBeenCalled();
  });

  it("cleanup cancels pending save timer", async () => {
    const renderer = makeMockRenderer();

    const cleanup = initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid1");
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    // Cancel before timer fires
    cleanup();
    await vi.runAllTimersAsync();

    expect(saveReadingPosition).not.toHaveBeenCalled();
  });

  it("cleanup calls renderer.destroy", async () => {
    const renderer = makeMockRenderer();

    const cleanup = initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", null);
    await flushInit();

    cleanup();

    expect(renderer.destroy).toHaveBeenCalled();
  });

  it("renderer.init rejection shows 'Failed to load' and calls reportError", async () => {
    const renderer = makeMockRenderer();
    vi.mocked(renderer.init).mockRejectedValue(new Error("init error"));

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid1");
    await flushInit();

    const pos = outlet.querySelector(".viewer-position") as HTMLElement;
    expect(pos.textContent).toBe("Failed to load");
    expect(globalThis.reportError).toHaveBeenCalled();
  });

  it("Firestore save failure calls reportError and does not throw", async () => {
    vi.mocked(saveReadingPosition).mockRejectedValue(new Error("Firestore write error"));
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid1");
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();
    await vi.runAllTimersAsync();

    expect(globalThis.reportError).toHaveBeenCalled();
  });

  it("onError callback disables nav buttons and shows render error message", async () => {
    let capturedOnError: ((err: unknown) => void) | null = null;
    const renderer = makeMockRenderer();

    initViewer(
      outlet,
      (onError) => { capturedOnError = onError; return renderer; },
      "https://example.com/doc.pdf",
      "m1",
      null,
    );
    await flushInit();

    // Buttons enabled after successful init
    const prevBtn = outlet.querySelector(".viewer-prev") as HTMLButtonElement;
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);

    // Simulate a background render error (e.g., PDF re-render failure)
    capturedOnError!(new Error("render failure"));

    const pos = outlet.querySelector(".viewer-position") as HTMLElement;
    expect(pos.textContent).toBe("Render failed. Try refreshing the page.");
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(true);
    expect(globalThis.reportError).toHaveBeenCalled();
  });

  it("Firestore read failure falls back to localStorage for saves", async () => {
    vi.mocked(getReadingPosition).mockRejectedValue(new Error("Firestore read error"));
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, "https://example.com/doc.pdf", "m1", "uid1");
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();
    await vi.runAllTimersAsync();

    // Should NOT write to Firestore (would overwrite unknown saved state)
    expect(saveReadingPosition).not.toHaveBeenCalled();
    // Falls back to localStorage
    expect(localStorage.getItem("reading-position:m1")).toBe("2");
  });
});
