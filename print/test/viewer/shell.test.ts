import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("../../src/bookmarks.js", () => ({
  getBookmarks: vi.fn().mockResolvedValue([]),
  saveBookmarks: vi.fn().mockResolvedValue(undefined),
}));

import { renderViewerShell, initViewer } from "../../src/viewer/shell";
import type { PositionStore } from "../../src/sidecar";
import type { MediaItem } from "../../src/types";
import type { ContentRenderer, SearchResult } from "../../src/viewer/types";
import { makeMockRenderer } from "./mock-renderer";

/**
 * A mock PositionStore for exercising initViewer's persistence contract. shell.ts
 * no longer knows about Firestore/localStorage — it talks only to this interface.
 */
function fakeStore(
  initial: string | null = null,
  overrides: Partial<PositionStore> = {},
): PositionStore & { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> } {
  return {
    load: vi.fn().mockResolvedValue(initial),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as PositionStore & { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
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
    markdownPath: null,
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

  it("contains .viewer-search with search-hidden class", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-search search-hidden"');
  });

  it("contains .viewer-outline with outline-hidden class", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-outline outline-hidden"');
  });

  it("contains the bookmark toggle button", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-bookmark-toggle"');
  });

  it("contains the bookmarks section, hidden by default", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html).toContain('class="viewer-bookmarks bookmarks-hidden"');
  });

  it("renders the bookmarks section above the outline section", () => {
    const html = renderViewerShell(makeMediaItem());

    expect(html.indexOf("viewer-bookmarks")).toBeLessThan(html.indexOf("viewer-outline"));
  });

  it("renders .viewer-md-actions with both buttons when markdownPath is non-null", () => {
    const html = renderViewerShell(makeMediaItem({ markdownPath: "media/test.md" }));

    expect(html).toContain('class="viewer-md-actions"');
    expect(html).toContain('class="media-md-download"');
    expect(html).toContain('class="media-md-copy"');
    expect(html).toContain('data-md-path="media/test.md"');
  });

  it("does not render .viewer-md-actions when markdownPath is null", () => {
    const html = renderViewerShell(makeMediaItem({ markdownPath: null }));

    expect(html).not.toContain("viewer-md-actions");
    expect(html).not.toContain("media-md-download");
    expect(html).not.toContain("media-md-copy");
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
    // (store.load -> renderer.init -> updateNav), but extra margin avoids
    // intermittent failures if another await is added to the init path.
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  it("disables prev and enables next based on canGoPrev/canGoNext", async () => {
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const prevBtn = outlet.querySelector(".viewer-prev") as HTMLButtonElement;
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);
  });

  it("loads position from the store and passes to renderer.init", async () => {
    const store = fakeStore("5");
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", store, null);
    await flushInit();

    expect(store.load).toHaveBeenCalled();
    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "https://example.com/doc.pdf",
      "5",
    );
  });

  it("no saved position: init called with undefined", async () => {
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(null), null);
    await flushInit();

    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "https://example.com/doc.pdf",
      undefined,
    );
  });

  it("scheduleSave writes to the store after navigation", async () => {
    const store = fakeStore();
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", store, null);
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();
    await vi.runAllTimersAsync();

    // After next(), currentPage=2, position="2", which differs from lastSavedPosition="1"
    expect(store.save).toHaveBeenCalledWith("2");
  });

  it("scheduleSave deduplicates — same position not saved twice", async () => {
    const store = fakeStore();
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", store, null);
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();
    await vi.runAllTimersAsync();

    // Timer fires again without navigation — position unchanged
    await vi.runAllTimersAsync();

    // store.save was called once for page 2; no second call for same position
    expect(store.save).toHaveBeenCalledTimes(1);
  });

  it("still initializes renderer when store.load rejects", async () => {
    const store = fakeStore(null, { load: vi.fn().mockRejectedValue(new Error("backend down")) });
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", store, null);
    await flushInit();

    expect(renderer.init).toHaveBeenCalled();
  });

  it("cleanup flushes pending save timer", async () => {
    const store = fakeStore(null);
    const renderer = makeMockRenderer();

    const cleanup = initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", store, null);
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    // Flush synchronously before the 500ms timer fires
    cleanup();

    // store.save should have been called with the pending position
    // without advancing timers — the flush is synchronous
    expect(store.save).toHaveBeenCalledWith("2");
  });

  it("cleanup flushes pending save timer (unauthenticated)", async () => {
    const store = fakeStore(null);
    const renderer = makeMockRenderer();

    const cleanup = initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", store, null);
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    // Flush synchronously before the 500ms timer fires
    cleanup();

    // store.save should have been called with the pending position
    // without advancing timers — the flush is synchronous
    expect(store.save).toHaveBeenCalledWith("2");
  });

  it("cleanup calls renderer.destroy", async () => {
    const renderer = makeMockRenderer();

    const cleanup = initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    cleanup();

    expect(renderer.destroy).toHaveBeenCalled();
  });

  it("renderer.init rejection shows 'Failed to load' and calls reportError", async () => {
    const renderer = makeMockRenderer();
    vi.mocked(renderer.init).mockRejectedValue(new Error("init error"));

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const pos = outlet.querySelector(".viewer-position") as HTMLElement;
    expect(pos.textContent).toBe("Failed to load");
    expect(globalThis.reportError).toHaveBeenCalled();
  });

  it("store.save failure calls reportError and does not throw", async () => {
    const store = fakeStore(null, { save: vi.fn().mockRejectedValue(new Error("write error")) });
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", store, null);
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
      () => Promise.resolve("https://example.com/doc.pdf"),
      "m1",
      fakeStore(),
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

  it("arrow keys do not trigger page navigation when search input is focused", async () => {
    const renderer = makeMockRenderer({
      search: vi.fn().mockResolvedValue([]),
      goToResult: vi.fn().mockResolvedValue(undefined),
      renderResult: vi.fn().mockResolvedValue(undefined),
      clearSearch: vi.fn(),
    });

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Focus the search input
    const searchInput = outlet.querySelector(".viewer-search-input") as HTMLInputElement;
    searchInput.focus();

    // Dispatch arrow key events with the search input as target
    const rightEvent = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
    Object.defineProperty(rightEvent, "target", { value: searchInput });
    document.dispatchEvent(rightEvent);
    await flushInit();

    const leftEvent = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true });
    Object.defineProperty(leftEvent, "target", { value: searchInput });
    document.dispatchEvent(leftEvent);
    await flushInit();

    // renderer.next and renderer.prev should not have been called
    expect(renderer.next).not.toHaveBeenCalled();
    expect(renderer.prev).not.toHaveBeenCalled();
  });

  it("store read failure suppresses the first save (no blind clobber)", async () => {
    // With a single store there is no other backend to redirect to: a failed
    // read can only SUPPRESS the save, protecting the unknown backend state.
    const store = fakeStore(null, { load: vi.fn().mockRejectedValue(new Error("read error")) });
    const renderer = makeMockRenderer();

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", store, null);
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();
    await vi.runAllTimersAsync();

    // Should NOT write — the read failed, so the saved state is unknown.
    expect(store.save).not.toHaveBeenCalled();
  });

  it("non-searchable renderer (missing renderResult) keeps search-hidden — isSearchable gate skips initSearch", async () => {
    // A renderer with search/goToResult/clearSearch but NO renderResult does not
    // satisfy isSearchable(), so shell.ts must not wire search. The .viewer-search
    // panel must remain hidden.
    const renderer = makeMockRenderer({
      search: vi.fn().mockResolvedValue([]),
      goToResult: vi.fn().mockResolvedValue(undefined),
      clearSearch: vi.fn(),
      // renderResult intentionally absent — this is the non-searchable case
    });

    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const searchSection = outlet.querySelector(".viewer-search") as HTMLElement;
    expect(searchSection.classList.contains("search-hidden")).toBe(true);
  });
});

describe("initViewer go-to input", () => {
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
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  function pressEnter(input: HTMLInputElement): void {
    const ev = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    Object.defineProperty(ev, "target", { value: input });
    input.dispatchEvent(ev);
  }

  it("page mode: input visible with 'Go to page' aria-label", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(null), null);
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    expect(input.classList.contains("goto-hidden")).toBe(false);
    expect(input.getAttribute("aria-label")).toBe("Go to page");
  });

  it("page mode: typing a valid page + Enter navigates and updates position", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(null), null);
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "5";
    pressEnter(input);
    await flushInit();

    expect(renderer.goToPage).toHaveBeenCalledWith(5);
    const pos = outlet.querySelector(".viewer-position") as HTMLElement;
    expect(pos.textContent).toBe("Page 5 / 10");
  });

  it("page mode: out-of-range page clamps to pageCount", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(null), null);
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "99";
    pressEnter(input);
    await flushInit();

    expect(renderer.goToPage).toHaveBeenCalledWith(10);
  });

  it("page mode: non-numeric input does not navigate", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(null), null);
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "abc";
    pressEnter(input);
    await flushInit();

    expect(renderer.goToPage).not.toHaveBeenCalled();
  });

  it("page mode: updateNav syncs input value to current page after next()", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(null), null);
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    expect(input.value).toBe("2");
  });

  it("percent mode: input visible with 'Go to location percent' aria-label", async () => {
    const renderer = makeMockRenderer({
      goToFraction: vi.fn().mockResolvedValue(undefined),
    });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.epub"), "m1", fakeStore(null), null);
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    expect(input.classList.contains("goto-hidden")).toBe(false);
    expect(input.getAttribute("aria-label")).toBe("Go to location percent");
  });

  it("percent mode: typing a percent + Enter calls goToFraction with the fraction", async () => {
    const renderer = makeMockRenderer({
      goToFraction: vi.fn().mockResolvedValue(undefined),
    });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.epub"), "m1", fakeStore(null), null);
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "50";
    pressEnter(input);
    await flushInit();

    expect(renderer.goToFraction).toHaveBeenCalledWith(0.5);
  });

  it("percent mode: input readOnly + aria-busy + aria-live status while pending, restored + focus returned after resolve", async () => {
    let resolveFraction!: () => void;
    const pending = new Promise<void>((resolve) => { resolveFraction = resolve; });
    const renderer = makeMockRenderer({
      goToFraction: vi.fn().mockReturnValue(pending),
    });
    // Attach outlet to document so focus() is observable.
    document.body.appendChild(outlet);
    try {
      initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.epub"), "m1", fakeStore(null), null);
      await flushInit();

      const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
      const statusEl = outlet.querySelector(".viewer-goto-status") as HTMLElement;
      input.value = "50";
      pressEnter(input);
      await flushInit();

      // While pending: readOnly, aria-busy, status text — never disabled.
      expect(input.readOnly).toBe(true);
      expect(input.getAttribute("aria-busy")).toBe("true");
      expect(input.placeholder).toBe("Calculating…");
      expect(statusEl.textContent).toBe("Calculating location…");
      expect(input.disabled).toBe(false);

      resolveFraction();
      await flushInit();

      // After resolve: restored, focus returned, never disabled.
      expect(input.readOnly).toBe(false);
      expect(input.hasAttribute("aria-busy")).toBe(false);
      expect(input.placeholder).toBe("%");
      expect(statusEl.textContent).toBe("");
      expect(input.disabled).toBe(false);
      expect(document.activeElement).toBe(input);
    } finally {
      document.body.removeChild(outlet);
    }
  });

  it("hidden: pageCount <= 1 and no goToFraction keeps input hidden", async () => {
    const renderer = makeMockRenderer({
      get pageCount() { return 1; },
      get canGoNext() { return false; },
    });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(null), null);
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    expect(input.classList.contains("goto-hidden")).toBe(true);
  });
});

describe("initViewer spread mode", () => {
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
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  function makeMockSpreadRenderer(overrides: Partial<ContentRenderer> = {}): ContentRenderer {
    return makeMockRenderer({
      renderPageInto: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    });
  }

  it("spread toggle button shown for renderers with renderPageInto, hidden otherwise", async () => {
    // With renderPageInto: button should not have spread-hidden
    const spreadRenderer = makeMockSpreadRenderer();
    initViewer(outlet, () => spreadRenderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLElement;
    expect(spreadBtn.classList.contains("spread-hidden")).toBe(false);

    // Without renderPageInto: button should keep spread-hidden
    const outlet2 = document.createElement("div");
    outlet2.innerHTML = renderViewerShell(makeMediaItem());
    const plainRenderer = makeMockRenderer();
    initViewer(outlet2, () => plainRenderer, () => Promise.resolve("https://example.com/doc.pdf"), "m2", fakeStore(), null);
    await flushInit();

    const spreadBtn2 = outlet2.querySelector(".viewer-spread-toggle") as HTMLElement;
    expect(spreadBtn2.classList.contains("spread-hidden")).toBe(true);
  });

  it("spread navigation advances by spread and calls renderPageInto with correct pages", async () => {
    const renderer = makeMockSpreadRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Enter spread mode
    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    // Spread 0 is page 1 (solo). Click next to go to spread 1 (pages 2-3).
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    const renderPageInto = vi.mocked(renderer.renderPageInto!);
    // renderPageInto should have been called with page 2 (left) and page 3 (right)
    const calls = renderPageInto.mock.calls;
    // Find calls for the last spread render (pages 2 and 3)
    const lastCalls = calls.slice(-2);
    expect(lastCalls[0]![0]).toBe(2);
    expect(lastCalls[1]![0]).toBe(3);
  });

  it("spread position label shows 'Pages X\u2013Y / Z' format", async () => {
    const renderer = makeMockSpreadRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Enter spread mode
    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    // Spread 0 is solo page 1 -> "Page 1 / 10"
    const pos = outlet.querySelector(".viewer-position") as HTMLElement;
    expect(pos.textContent).toBe("Page 1 / 10");

    // Navigate to spread 1 (pages 2-3) -> "Pages 2\u20133 / 10"
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    expect(pos.textContent).toBe("Pages 2\u20133 / 10");
  });

  it("spread preference persisted to localStorage", async () => {
    const renderer = makeMockSpreadRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Enter spread mode
    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    expect(localStorage.getItem("spread-mode:m1")).toBe("true");

    // Leave spread mode
    spreadBtn.click();
    await flushInit();

    expect(localStorage.getItem("spread-mode:m1")).toBe("false");
  });

  it("mode switching syncs position — toggle spread on at page 3 maps to correct spread index", async () => {
    const renderer = makeMockSpreadRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Navigate to page 3 in single mode
    await renderer.goToPage(3);
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    // We need to trigger updateNav, so click next then prev to land on page 3
    // Or just go to page 3 and toggle spread. The shell reads renderer.currentPage.
    // goToPage sets _currentPage=3, then toggle spread reads it.

    // Enter spread mode — shell reads renderer.currentPage (3)
    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    // Page 3 is in spread index 1 (pages 2-3). Position label should reflect that.
    const pos = outlet.querySelector(".viewer-position") as HTMLElement;
    expect(pos.textContent).toBe("Pages 2\u20133 / 10");
  });

  it("zoom in spread mode applies CSS transform on canvasWrap", async () => {
    const renderer = makeMockSpreadRenderer({
      renderPageInto: vi.fn().mockResolvedValue(undefined),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      resetZoom: vi.fn(),
      isZoomed: false,
    });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Enter spread mode
    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    const canvasWrap = outlet.querySelector(".viewer-canvas-wrap") as HTMLElement;
    const zoomInBtn = outlet.querySelector(".viewer-zoom-in") as HTMLButtonElement;

    // Zoom in once
    zoomInBtn.click();
    await flushInit();

    expect(canvasWrap.style.transform).toBe("scale(1.2)");
    expect(canvasWrap.classList.contains("zoomed")).toBe(true);

    // Zoom in again
    zoomInBtn.click();
    await flushInit();

    // 1.2^2 = 1.44
    expect(canvasWrap.style.transform).toBe(`scale(${1.2 ** 2})`);
  });

  it("search result click in spread mode: routes via controller.goToPage (renderPageInto), not renderResult", async () => {
    const renderResult = vi.fn().mockResolvedValue(undefined);
    const searchResult = {
      location: "1:0:3",
      label: "Page 1",
      snippet: "the cat sat",
      matchStart: 0,
      matchLength: 3,
    };
    const renderer = makeMockSpreadRenderer({
      renderPageInto: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue([searchResult]),
      goToResult: vi.fn().mockResolvedValue(undefined),
      clearSearch: vi.fn(),
      renderResult,
    });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Enter spread mode
    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    // Run a search: set input value and dispatch the search event for immediate (no-debounce) execution
    const searchInput = outlet.querySelector(".viewer-search-input") as HTMLInputElement;
    searchInput.value = "the";
    searchInput.dispatchEvent(new Event("search"));
    await vi.advanceTimersByTimeAsync(0);

    // Clear mock call history accumulated during spread entry so only the click render counts
    vi.mocked(renderer.renderPageInto!).mockClear();

    // Click the first search result
    const resultsList = outlet.querySelector(".viewer-search-results") as HTMLUListElement;
    (resultsList.children[0] as HTMLElement).click();

    // Flush: goToResult resolves → onNavigate → controller.goToPage → render() → renderPageInto
    await vi.advanceTimersByTimeAsync(0);
    await flushInit();

    // Spread path: controller.goToPage called renderPageInto
    expect(renderer.renderPageInto).toHaveBeenCalled();
    // renderResult must NOT be called in spread mode
    expect(renderResult).not.toHaveBeenCalled();
  });

  it("search result click in single mode: routes via renderResult, not renderPageInto", async () => {
    const renderResult = vi.fn().mockResolvedValue(undefined);
    const searchResult = {
      location: "1:0:3",
      label: "Page 1",
      snippet: "the cat sat",
      matchStart: 0,
      matchLength: 3,
    };
    const renderer = makeMockSpreadRenderer({
      renderPageInto: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue([searchResult]),
      goToResult: vi.fn().mockResolvedValue(undefined),
      clearSearch: vi.fn(),
      renderResult,
    });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Do NOT enter spread mode — stay in single mode

    // Run a search
    const searchInput = outlet.querySelector(".viewer-search-input") as HTMLInputElement;
    searchInput.value = "the";
    searchInput.dispatchEvent(new Event("search"));
    await vi.advanceTimersByTimeAsync(0);

    vi.mocked(renderer.renderPageInto!).mockClear();

    // Click the first search result
    const resultsList = outlet.querySelector(".viewer-search-results") as HTMLUListElement;
    (resultsList.children[0] as HTMLElement).click();

    // Flush: goToResult resolves → onNavigate → renderer.renderResult
    await vi.advanceTimersByTimeAsync(0);
    await flushInit();

    // Single mode path: renderResult must be called
    expect(renderResult).toHaveBeenCalled();
    // renderPageInto must NOT be called via the search click
    expect(renderer.renderPageInto).not.toHaveBeenCalled();
  });

  // Criterion 3: user-initiated navigation in spread mode clears any stale
  // search highlight before re-rendering, so it never reappears on a spread
  // that contains the previously highlighted page.
  it("spread mode: clicking next clears the search highlight", async () => {
    const renderer = makeMockSpreadRenderer({ clearSearch: vi.fn() });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    expect(renderer.clearSearch).toHaveBeenCalled();
  });

  it("spread mode: clicking prev clears the search highlight", async () => {
    const renderer = makeMockSpreadRenderer({ clearSearch: vi.fn() });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    // Advance off spread 0 first; jsdom won't dispatch click on a disabled
    // prev button, which would make the assertion a silent no-op.
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    vi.mocked(renderer.clearSearch!).mockClear();

    const prevBtn = outlet.querySelector(".viewer-prev") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(false);
    prevBtn.click();
    await flushInit();

    expect(renderer.clearSearch).toHaveBeenCalled();
  });

  it("spread mode: submitting 'go to page' clears the search highlight", async () => {
    const renderer = makeMockSpreadRenderer({ clearSearch: vi.fn() });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    const input = outlet.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "5";
    const ev = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    Object.defineProperty(ev, "target", { value: input });
    input.dispatchEvent(ev);
    await flushInit();

    expect(renderer.clearSearch).toHaveBeenCalled();
  });

  // Criterion 1 guard: navigating via a clicked search result (the onNavigate
  // path) must NOT clear the highlight — the clicked result must stay
  // highlighted on the spread it lands on.
  it("spread mode: search-result navigation does NOT clear the highlight", async () => {
    const result: SearchResult = {
      location: "4",
      label: "Page 4",
      snippet: "the matched text here",
      matchStart: 4,
      matchLength: 7,
    };
    const renderer = makeMockSpreadRenderer({
      search: vi.fn().mockResolvedValue([result]),
      goToResult: vi.fn().mockImplementation(async () => { await renderer.goToPage(4); }),
      renderResult: vi.fn().mockResolvedValue(undefined),
      clearSearch: vi.fn(),
    });
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const spreadBtn = outlet.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    spreadBtn.click();
    await flushInit();

    // Run the search (dispatch "search" event to bypass the 300ms debounce).
    const searchInput = outlet.querySelector(".viewer-search-input") as HTMLInputElement;
    searchInput.value = "matched";
    searchInput.dispatchEvent(new Event("search", { bubbles: true }));
    await flushInit();

    // Click the rendered result, exercising goToResult -> onNavigate.
    const resultLi = outlet.querySelector(".viewer-search-result") as HTMLElement;
    expect(resultLi).not.toBeNull();
    resultLi.click();
    await flushInit();

    // Positive control: the result navigation actually fired.
    expect(renderer.goToResult).toHaveBeenCalledWith(result);
    // Guard: the onNavigate path preserved the highlight (no clearSearch).
    expect(renderer.clearSearch).not.toHaveBeenCalled();
  });
});

describe("initViewer fullscreen and tap zones", () => {
  let outlet: HTMLElement;
  let mockRequestFullscreen: ReturnType<typeof vi.fn>;
  let mockExitFullscreen: ReturnType<typeof vi.fn>;

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

    mockRequestFullscreen = vi.fn().mockResolvedValue(undefined);
    mockExitFullscreen = vi.fn().mockResolvedValue(undefined);
    HTMLElement.prototype.requestFullscreen = mockRequestFullscreen;
    document.exitFullscreen = mockExitFullscreen;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(globalThis.reportError).mockRestore();
    // Reset fullscreenElement to null
    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  async function flushInit(): Promise<void> {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  it("calls requestFullscreen when panel is collapsed", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const toggleBtn = outlet.querySelector(".viewer-panel-toggle") as HTMLButtonElement;
    toggleBtn.click();

    expect(mockRequestFullscreen).toHaveBeenCalled();
  });

  it("calls exitFullscreen when panel is expanded from collapsed state", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const toggleBtn = outlet.querySelector(".viewer-panel-toggle") as HTMLButtonElement;

    // Collapse
    toggleBtn.click();

    // Simulate browser entering fullscreen
    Object.defineProperty(document, "fullscreenElement", {
      value: outlet.querySelector(".viewer"),
      writable: true,
      configurable: true,
    });

    // Expand
    toggleBtn.click();

    expect(mockExitFullscreen).toHaveBeenCalled();
  });

  it("syncs panel to expanded when user exits fullscreen externally", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const toggleBtn = outlet.querySelector(".viewer-panel-toggle") as HTMLButtonElement;
    const panel = outlet.querySelector(".viewer-panel") as HTMLElement;

    // Collapse panel
    toggleBtn.click();
    expect(panel.classList.contains("collapsed")).toBe(true);

    // Simulate user pressing Esc to exit fullscreen
    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("fullscreenchange"));

    expect(panel.classList.contains("collapsed")).toBe(false);
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
  });

  it("creates tap zones when panel is collapsed", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const toggleBtn = outlet.querySelector(".viewer-panel-toggle") as HTMLButtonElement;
    toggleBtn.click();

    const prevZone = outlet.querySelector(".tap-zone-prev");
    const nextZone = outlet.querySelector(".tap-zone-next");
    expect(prevZone).not.toBeNull();
    expect(nextZone).not.toBeNull();
  });

  it("removes tap zones when panel is expanded", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const toggleBtn = outlet.querySelector(".viewer-panel-toggle") as HTMLButtonElement;

    // Collapse
    toggleBtn.click();
    expect(outlet.querySelector(".tap-zone-prev")).not.toBeNull();

    // Expand
    toggleBtn.click();

    expect(outlet.querySelector(".tap-zone-prev")).toBeNull();
    expect(outlet.querySelector(".tap-zone-next")).toBeNull();
  });

  it("removes tap zones when user exits fullscreen externally", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const toggleBtn = outlet.querySelector(".viewer-panel-toggle") as HTMLButtonElement;

    // Collapse to create tap zones
    toggleBtn.click();
    expect(outlet.querySelector(".tap-zone-prev")).not.toBeNull();

    // Exit fullscreen externally
    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("fullscreenchange"));

    expect(outlet.querySelector(".tap-zone-prev")).toBeNull();
    expect(outlet.querySelector(".tap-zone-next")).toBeNull();
  });

  it("tap zone click on next advances the page", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    const toggleBtn = outlet.querySelector(".viewer-panel-toggle") as HTMLButtonElement;
    toggleBtn.click();

    const nextZone = outlet.querySelector(".tap-zone-next") as HTMLElement;
    nextZone.click();
    await flushInit();

    expect(renderer.next).toHaveBeenCalled();
  });

  it("tap zone click on prev goes to previous page", async () => {
    const renderer = makeMockRenderer();
    initViewer(outlet, () => renderer, () => Promise.resolve("https://example.com/doc.pdf"), "m1", fakeStore(), null);
    await flushInit();

    // Navigate forward first so prev is possible
    const nextBtn = outlet.querySelector(".viewer-next") as HTMLButtonElement;
    nextBtn.click();
    await flushInit();

    const toggleBtn = outlet.querySelector(".viewer-panel-toggle") as HTMLButtonElement;
    toggleBtn.click();

    const prevZone = outlet.querySelector(".tap-zone-prev") as HTMLElement;
    prevZone.click();
    await flushInit();

    expect(renderer.prev).toHaveBeenCalled();
  });
});
