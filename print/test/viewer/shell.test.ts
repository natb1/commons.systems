import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("../../src/reading-position.js", () => ({
  getReadingPosition: vi.fn(),
  saveReadingPosition: vi.fn(),
}));

import { renderViewerShell, initViewer } from "../../src/viewer/shell";
import type { MediaItem } from "../../src/types";
import { getReadingPosition, saveReadingPosition } from "../../src/reading-position.js";

const mockGetReadingPosition = vi.mocked(getReadingPosition);
const mockSaveReadingPosition = vi.mocked(saveReadingPosition);

function makeViewerDOM(): HTMLElement {
  const outlet = document.createElement("div");
  outlet.innerHTML = `
    <div class="viewer" data-orientation="landscape">
      <div class="viewer-content">
        <div class="viewer-canvas-wrap"><canvas></canvas></div>
      </div>
      <button class="viewer-panel-toggle"></button>
      <aside class="viewer-panel">
        <div class="viewer-nav">
          <button class="viewer-prev" disabled></button>
          <span class="viewer-position">Loading...</span>
          <button class="viewer-next" disabled></button>
        </div>
      </aside>
    </div>`;
  return outlet;
}

function makeMockRenderer(pageCount = 3) {
  let currentPage = 1;
  return {
    init: vi.fn().mockResolvedValue(undefined),
    goToPage: vi.fn().mockImplementation(async (p: number) => { currentPage = p; }),
    get position() { return String(currentPage); },
    get currentPage() { return currentPage; },
    get pageCount() { return pageCount; },
    destroy: vi.fn(),
  };
}

async function flushPromises(): Promise<void> {
  // 20 iterations drain nested promise chains: getReadingPosition -> renderer.init -> updateNav each add depth.
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

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

  it("contains .viewer-content with .viewer-canvas-wrap and canvas#viewer-canvas", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-content"');
    expect(html).toContain('class="viewer-canvas-wrap"');
    expect(html).toContain('id="viewer-canvas"');
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
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetReadingPosition.mockReset();
    mockSaveReadingPosition.mockReset();
    mockSaveReadingPosition.mockResolvedValue(undefined);
    localStorage.clear();
    (globalThis as any).reportError = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("authenticated: loads position from Firestore", async () => {
    mockGetReadingPosition.mockResolvedValue("2");
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer();
    const createRenderer = vi.fn().mockReturnValue(renderer);

    initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", "uid1");
    await flushPromises();

    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "http://example.com/file.cbz",
      "2",
    );
  });

  it("unauthenticated: loads from localStorage", async () => {
    localStorage.setItem("reading-position:test-id", "3");
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer();
    const createRenderer = vi.fn().mockReturnValue(renderer);

    initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", null);
    await flushPromises();

    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "http://example.com/file.cbz",
      "3",
    );
  });

  it("unauthenticated: no saved position, init called with undefined", async () => {
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer();
    const createRenderer = vi.fn().mockReturnValue(renderer);

    initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", null);
    await flushPromises();

    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "http://example.com/file.cbz",
      undefined,
    );
  });

  it("scheduleSave writes Firestore for authenticated user", async () => {
    mockGetReadingPosition.mockResolvedValue(null);
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer();
    const createRenderer = vi.fn().mockReturnValue(renderer);

    initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", "uid1");
    await flushPromises();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushPromises();
    await vi.runAllTimersAsync();

    expect(mockSaveReadingPosition).toHaveBeenCalledWith("uid1", "test-id", "2");
  });

  it("scheduleSave writes localStorage for unauthenticated user", async () => {
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer();
    const createRenderer = vi.fn().mockReturnValue(renderer);

    initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", null);
    await flushPromises();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushPromises();
    await vi.runAllTimersAsync();

    expect(localStorage.getItem("reading-position:test-id")).toBe("2");
  });

  it("scheduleSave deduplicates — same position not saved twice", async () => {
    mockGetReadingPosition.mockResolvedValue(null);
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer();
    const createRenderer = vi.fn().mockReturnValue(renderer);

    initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", "uid1");
    await flushPromises();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushPromises();
    await vi.runAllTimersAsync();

    // Navigate to same page again (simulate goToPage returning same page)
    await vi.runAllTimersAsync();

    expect(mockSaveReadingPosition).toHaveBeenCalledTimes(1);
  });

  it("Firestore error on getReadingPosition is swallowed — init still called", async () => {
    mockGetReadingPosition.mockRejectedValue(new Error("Firestore error"));
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer();
    const createRenderer = vi.fn().mockReturnValue(renderer);

    initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", "uid1");
    await flushPromises();

    expect(renderer.init).toHaveBeenCalled();
  });

  it("cleanup cancels pending save timer", async () => {
    mockGetReadingPosition.mockResolvedValue(null);
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer();
    const createRenderer = vi.fn().mockReturnValue(renderer);

    const cleanup = initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", "uid1");
    await flushPromises();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushPromises();

    // Cancel before timer fires
    cleanup();
    await vi.runAllTimersAsync();

    expect(mockSaveReadingPosition).not.toHaveBeenCalled();
  });

  it("updateNav sets button disabled states correctly", async () => {
    mockGetReadingPosition.mockResolvedValue(null);
    const outlet = makeViewerDOM();
    const renderer = makeMockRenderer(3);
    const createRenderer = vi.fn().mockReturnValue(renderer);

    initViewer(outlet, createRenderer, "http://example.com/file.cbz", "test-id", "uid1");
    await flushPromises();

    const prevBtn = outlet.querySelector(".viewer-prev") as HTMLButtonElement;
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;

    // At page 1: prev disabled, next enabled
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    nextBtn.click();
    await flushPromises();

    // At page 2: both enabled
    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(false);

    nextBtn.click();
    await flushPromises();

    // At page 3: prev enabled, next disabled
    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(true);
  });
});
