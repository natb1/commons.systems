import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { act } from "react";
import { createElement } from "react";
import { SearchPanel } from "../../src/viewer/SearchPanel";
import type { UseViewerControllerResult } from "../../src/viewer/useViewerController";
import type { SearchResult } from "../../src/viewer/types";
import { makeMockRenderer } from "./mock-renderer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    location: "5",
    label: "Page 5",
    snippet: "the quick brown fox jumps over",
    matchStart: 4,
    matchLength: 5,
    ...overrides,
  };
}

/** Build a mock controller stub with all search-related methods wired up. */
function makeMockController(overrides: Partial<UseViewerControllerResult> = {}): UseViewerControllerResult {
  const renderer = makeMockRenderer({
    search: vi.fn().mockResolvedValue([]),
    goToResult: vi.fn().mockResolvedValue(undefined),
    renderResult: vi.fn().mockResolvedValue(undefined),
    clearSearch: vi.fn(),
  });
  return {
    searchable: true,
    getRenderer: () => renderer,
    onSearchNavigate: vi.fn(),
    // --- unused fields required by the type ---
    canvasWrapRef: { current: null } as React.RefObject<HTMLDivElement>,
    gotoInputRef: { current: null } as React.RefObject<HTMLInputElement>,
    spreadToggleRef: { current: null } as React.RefObject<HTMLButtonElement>,
    viewerRef: { current: null } as React.RefObject<HTMLElement>,
    positionLabel: "Page 1 / 10",
    canGoPrev: false,
    canGoNext: true,
    zoomOutDisabled: true,
    zoomResetDisabled: true,
    spreadEnabled: false,
    gotoMode: null,
    hasZoom: false,
    hasSpread: false,
    panelCollapsed: false,
    orientation: "landscape",
    loadError: null,
    goPrev: vi.fn(),
    goNext: vi.fn(),
    goToPage: vi.fn(),
    submitGoto: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    zoomReset: vi.fn(),
    toggleSpread: vi.fn(),
    togglePanel: vi.fn(),
    onPanelNavigate: vi.fn(),
    readFailed: false,
    mediaId: "item-1",
    uid: null,
    navSignal: 0,
    ...overrides,
  } as unknown as UseViewerControllerResult;
}

/**
 * Set an input's value via the native prototype setter so React's value-tracker
 * sees the change, then dispatch a bubbling "input" event so React's onChange
 * synthetic handler fires.
 */
function setInputValue(input: HTMLInputElement, value: string) {
  const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  nativeSet.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("SearchPanel", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
    vi.useRealTimers();
    vi.mocked(globalThis.reportError).mockRestore();
  });

  function render(controller: UseViewerControllerResult) {
    root = createRoot(container);
    flushSync(() => {
      root.render(createElement(SearchPanel, { controller }));
    });
  }

  // -------------------------------------------------------------------------
  // Presence / absence
  // -------------------------------------------------------------------------

  it("renders nothing when !searchable", () => {
    const controller = makeMockController({ searchable: false });
    render(controller);
    expect(container.firstChild).toBeNull();
  });

  it("renders the .viewer-search section when searchable", () => {
    const controller = makeMockController();
    render(controller);
    expect(container.querySelector(".viewer-search")).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Debounce
  // -------------------------------------------------------------------------

  it("calls renderer.search after 300ms debounce on input", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const renderer = makeMockRenderer({ search: searchFn, goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    setInputValue(input, "fox");

    // Not called immediately
    expect(searchFn).not.toHaveBeenCalled();

    // Called after 300ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(searchFn).toHaveBeenCalledWith("fox");
  });

  // -------------------------------------------------------------------------
  // Immediate "search" event (Enter key)
  // -------------------------------------------------------------------------

  it("search event (Enter key) triggers search immediately without debounce", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const renderer = makeMockRenderer({ search: searchFn, goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    // For native "search" listener, direct .value assignment is fine (no tracker involved)
    input.value = "immediate";
    input.dispatchEvent(new Event("search"));

    // Should be called immediately (after microtasks), not after 300ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(searchFn).toHaveBeenCalledWith("immediate");
  });

  it("search event cancels pending debounce and deduplicates", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const renderer = makeMockRenderer({ search: searchFn, goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;

    // Start debounce via input event
    setInputValue(input, "debounced");

    // Before 300ms elapses, fire the native search event (Enter)
    input.value = "debounced";
    input.dispatchEvent(new Event("search"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith("debounced");

    // Advance past debounce — should not fire again (same query dedup)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchFn).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Empty input → clearSearch
  // -------------------------------------------------------------------------

  it("empty input calls renderer.clearSearch and clears results", async () => {
    const clearSearch = vi.fn();
    const searchFn = vi.fn().mockResolvedValue([makeSearchResult()]);
    const renderer = makeMockRenderer({ search: searchFn, goToResult: vi.fn(), renderResult: vi.fn(), clearSearch });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;

    // First, perform a search to populate results
    setInputValue(input, "fox");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(container.querySelectorAll(".viewer-search-result").length).toBe(1);

    // Now clear
    setInputValue(input, "");

    expect(clearSearch).toHaveBeenCalled();
    expect(container.querySelectorAll(".viewer-search-result").length).toBe(0);
    expect(container.querySelector(".viewer-search-count")!.textContent).toBe("");
  });

  // -------------------------------------------------------------------------
  // Result click → goToResult + onSearchNavigate
  // -------------------------------------------------------------------------

  it("clicking a result calls renderer.goToResult with correct SearchResult", async () => {
    const result1 = makeSearchResult({ location: "3", label: "Page 3" });
    const result2 = makeSearchResult({ location: "7", label: "Page 7" });
    const goToResult = vi.fn().mockResolvedValue(undefined);
    const renderer = makeMockRenderer({ search: vi.fn().mockResolvedValue([result1, result2]), goToResult, renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    setInputValue(input, "fox");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const items = container.querySelectorAll(".viewer-search-result");
    await act(async () => {
      (items[1] as HTMLElement).click();
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });

    expect(goToResult).toHaveBeenCalledWith(result2);
  });

  it("clicking a result calls the onSearchNavigate callback", async () => {
    const onSearchNavigate = vi.fn();
    const renderer = makeMockRenderer({ search: vi.fn().mockResolvedValue([makeSearchResult()]), goToResult: vi.fn().mockResolvedValue(undefined), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer, onSearchNavigate });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    setInputValue(input, "fox");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const item = container.querySelector(".viewer-search-result") as HTMLElement;
    await act(async () => {
      item.click();
      // flush microtasks so .then() runs
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });

    expect(onSearchNavigate).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Count text singular / plural / zero
  // -------------------------------------------------------------------------

  it("count text shows correct singular and plural forms", async () => {
    const searchFn = vi.fn()
      .mockResolvedValueOnce([makeSearchResult()])
      .mockResolvedValueOnce([makeSearchResult(), makeSearchResult(), makeSearchResult()]);
    const renderer = makeMockRenderer({ search: searchFn, goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    const countEl = container.querySelector(".viewer-search-count") as HTMLElement;

    // Single result
    setInputValue(input, "one");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(countEl.textContent).toBe("1 result");

    // Multiple results — different query to bypass dedup
    setInputValue(input, "three");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(countEl.textContent).toBe("3 results");
  });

  it("zero results shows '0 results' count", async () => {
    const renderer = makeMockRenderer({ search: vi.fn().mockResolvedValue([]), goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    const countEl = container.querySelector(".viewer-search-count") as HTMLElement;

    setInputValue(input, "nonexistent");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(countEl.textContent).toBe("0 results");
  });

  // -------------------------------------------------------------------------
  // XSS: React renders text nodes, no dangerouslySetInnerHTML
  // -------------------------------------------------------------------------

  it("XSS: snippet with <script> rendered safely — no real script element, match inside <mark>", async () => {
    const xssResult = makeSearchResult({
      snippet: '<script>alert("xss")</script>',
      matchStart: 0,
      matchLength: 8,
    });
    const renderer = makeMockRenderer({ search: vi.fn().mockResolvedValue([xssResult]), goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    setInputValue(input, "script");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const snippetEl = container.querySelector(".viewer-search-result-snippet") as HTMLElement;
    expect(snippetEl.querySelector("script")).toBeNull();
    expect(snippetEl.querySelector("mark")).not.toBeNull();
  });

  it("XSS: label with <img onerror=...> rendered safely — no real img element", async () => {
    const xssResult = makeSearchResult({
      label: '<img onerror="alert(1)">',
    });
    const renderer = makeMockRenderer({ search: vi.fn().mockResolvedValue([xssResult]), goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    setInputValue(input, "test");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const labelEl = container.querySelector(".viewer-search-result-label") as HTMLElement;
    expect(labelEl.querySelector("img")).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Cleanup cancels timer
  // -------------------------------------------------------------------------

  it("cleanup cancels timer (unmount before 300ms → search not called)", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const renderer = makeMockRenderer({ search: searchFn, goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;

    // Start a debounce timer
    setInputValue(input, "fox");

    // Unmount before timer fires
    await act(async () => {
      root.unmount();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Search should not have been called — cleanup cancelled the timer
    expect(searchFn).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Stale-result discard
  // -------------------------------------------------------------------------

  it("discards stale search results when query changes during await", async () => {
    let resolveFirst!: (value: SearchResult[]) => void;
    const staleResults = [makeSearchResult({ label: "Stale" })];
    const freshResults = [makeSearchResult({ label: "Fresh" })];
    const searchFn = vi.fn()
      .mockImplementationOnce(() => new Promise<SearchResult[]>((r) => { resolveFirst = r; }))
      .mockImplementationOnce(() => Promise.resolve(freshResults));
    const renderer = makeMockRenderer({ search: searchFn, goToResult: vi.fn(), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;

    // First query
    setInputValue(input, "first");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchFn).toHaveBeenCalledWith("first");

    // Second query before first resolves
    setInputValue(input, "second");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchFn).toHaveBeenCalledWith("second");

    // Resolve the first (stale) search — results should be discarded
    await act(async () => {
      resolveFirst(staleResults);
      await vi.advanceTimersByTimeAsync(0);
    });

    // Only fresh results should be displayed
    const countEl = container.querySelector(".viewer-search-count") as HTMLElement;
    expect(countEl.textContent).toBe("1 result");
    const labelEl = container.querySelector(".viewer-search-result-label") as HTMLElement;
    expect(labelEl.textContent).toBe("Fresh");
  });

  // -------------------------------------------------------------------------
  // aria-selected on clicked item
  // -------------------------------------------------------------------------

  it("clicking a result sets aria-selected on the clicked item, not on others", async () => {
    const results = [
      makeSearchResult({ location: "1", label: "Page 1" }),
      makeSearchResult({ location: "2", label: "Page 2" }),
    ];
    const renderer = makeMockRenderer({ search: vi.fn().mockResolvedValue(results), goToResult: vi.fn().mockResolvedValue(undefined), renderResult: vi.fn(), clearSearch: vi.fn() });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    setInputValue(input, "fox");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const items = container.querySelectorAll(".viewer-search-result");
    await act(async () => {
      (items[1] as HTMLElement).click();
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });

    expect(items[1]!.getAttribute("aria-selected")).toBe("true");
    expect(items[0]!.hasAttribute("aria-selected")).toBe(false);
  });
});
