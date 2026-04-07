import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderSearchSection, initSearch } from "../../src/viewer/search";
import type { ContentRenderer, SearchResult } from "../../src/viewer/types";
import { makeMockRenderer } from "./mock-renderer";

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

/** Renderer with search/goToResult/clearSearch wired up. Pass `search` override to control results. */
function makeSearchableRenderer(overrides: Partial<ContentRenderer> = {}) {
  return makeMockRenderer({
    search: vi.fn().mockResolvedValue([]),
    goToResult: vi.fn().mockResolvedValue(undefined),
    clearSearch: vi.fn(),
    ...overrides,
  });
}

function createContainer(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = renderSearchSection();
  return el;
}

describe("renderSearchSection", () => {
  it("returns HTML with .viewer-search element", () => {
    const html = renderSearchSection();
    expect(html).toContain('class="viewer-search');
  });

  it("includes search-hidden class by default", () => {
    const html = renderSearchSection();
    expect(html).toContain("search-hidden");
  });

  it("contains a search input", () => {
    const html = renderSearchSection();
    expect(html).toContain('type="search"');
    expect(html).toContain('class="viewer-search-input"');
  });

  it("contains a results list", () => {
    const html = renderSearchSection();
    expect(html).toContain('class="viewer-search-results"');
  });
});

describe("initSearch", () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = createContainer();
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(globalThis.reportError).mockRestore();
  });

  it("returns null when renderer lacks search method", () => {
    const renderer = makeMockRenderer();
    const result = initSearch(container, renderer, vi.fn());
    expect(result).toBeNull();
  });

  it("returns null when renderer has search but lacks goToResult", () => {
    const renderer = makeMockRenderer({
      search: vi.fn().mockResolvedValue([]),
    });
    const result = initSearch(container, renderer, vi.fn());
    expect(result).toBeNull();
  });

  it("returns a cleanup function when renderer has search", () => {
    const renderer = makeSearchableRenderer();
    const result = initSearch(container, renderer, vi.fn());
    expect(typeof result).toBe("function");
  });

  it("removes search-hidden class when renderer has search", () => {
    const renderer = makeSearchableRenderer();
    initSearch(container, renderer, vi.fn());

    const section = container.querySelector(".viewer-search") as HTMLElement;
    expect(section.classList.contains("search-hidden")).toBe(false);
  });

  it("search-hidden class remains when renderer lacks search", () => {
    const renderer = makeMockRenderer();
    initSearch(container, renderer, vi.fn());

    const section = container.querySelector(".viewer-search") as HTMLElement;
    expect(section.classList.contains("search-hidden")).toBe(true);
  });

  it("calls renderer.search after 300ms debounce on input", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const renderer = makeSearchableRenderer({ search: searchFn });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    input.value = "fox";
    input.dispatchEvent(new Event("input"));

    // Not called immediately
    expect(searchFn).not.toHaveBeenCalled();

    // Called after 300ms
    await vi.advanceTimersByTimeAsync(300);

    expect(searchFn).toHaveBeenCalledWith("fox");
  });

  it("empty input calls renderer.clearSearch and clears results", async () => {
    const clearSearch = vi.fn();
    const renderer = makeSearchableRenderer({
      search: vi.fn().mockResolvedValue([makeSearchResult()]),
      clearSearch,
    });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    const resultsList = container.querySelector(".viewer-search-results") as HTMLUListElement;
    const countEl = container.querySelector(".viewer-search-count") as HTMLElement;

    // First, perform a search to populate results
    input.value = "fox";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);

    expect(resultsList.children.length).toBe(1);

    // Now clear
    input.value = "";
    input.dispatchEvent(new Event("input"));

    expect(clearSearch).toHaveBeenCalled();
    expect(resultsList.children.length).toBe(0);
    expect(countEl.textContent).toBe("");
  });

  it("clicking a result calls renderer.goToResult with correct SearchResult", async () => {
    const result1 = makeSearchResult({ location: "3", label: "Page 3" });
    const result2 = makeSearchResult({ location: "7", label: "Page 7" });
    const goToResult = vi.fn().mockResolvedValue(undefined);
    const renderer = makeSearchableRenderer({
      search: vi.fn().mockResolvedValue([result1, result2]),
      goToResult,
    });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    input.value = "fox";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);

    const resultsList = container.querySelector(".viewer-search-results") as HTMLUListElement;
    const secondItem = resultsList.children[1] as HTMLElement;
    secondItem.click();

    expect(goToResult).toHaveBeenCalledWith(result2);
  });

  it("clicking a result calls the onNavigate callback", async () => {
    const onNavigate = vi.fn();
    const renderer = makeSearchableRenderer({
      search: vi.fn().mockResolvedValue([makeSearchResult()]),
    });
    initSearch(container, renderer, onNavigate);

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    input.value = "fox";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);

    const resultsList = container.querySelector(".viewer-search-results") as HTMLUListElement;
    (resultsList.children[0] as HTMLElement).click();

    // onNavigate is called in the .then() of goToResult, so flush microtasks
    await vi.advanceTimersByTimeAsync(0);

    expect(onNavigate).toHaveBeenCalled();
  });

  it("count text shows correct singular and plural forms", async () => {
    const renderer = makeSearchableRenderer({
      search: vi.fn()
        .mockResolvedValueOnce([makeSearchResult()])
        .mockResolvedValueOnce([makeSearchResult(), makeSearchResult(), makeSearchResult()]),
    });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    const countEl = container.querySelector(".viewer-search-count") as HTMLElement;

    // Single result
    input.value = "one";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);
    expect(countEl.textContent).toBe("1 result");

    // Multiple results -- need a different query to bypass the currentQuery dedup
    input.value = "three";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);
    expect(countEl.textContent).toBe("3 results");
  });

  it("HTML-escapes snippets to prevent XSS", async () => {
    const xssResult = makeSearchResult({
      snippet: '<script>alert("xss")</script>',
      matchStart: 0,
      matchLength: 8,
    });
    const renderer = makeSearchableRenderer({
      search: vi.fn().mockResolvedValue([xssResult]),
    });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    input.value = "script";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);

    const resultsList = container.querySelector(".viewer-search-results") as HTMLUListElement;
    const snippetEl = resultsList.querySelector(".viewer-search-result-snippet") as HTMLElement;

    // The raw snippet text should be escaped -- no actual script element created
    expect(snippetEl.querySelector("script")).toBeNull();
    // The match portion should be inside a <mark> tag
    expect(snippetEl.querySelector("mark")).not.toBeNull();
  });

  it("HTML-escapes labels to prevent XSS", async () => {
    const xssResult = makeSearchResult({
      label: '<img onerror="alert(1)">',
    });
    const renderer = makeSearchableRenderer({
      search: vi.fn().mockResolvedValue([xssResult]),
    });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    input.value = "test";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);

    const labelEl = container.querySelector(".viewer-search-result-label") as HTMLElement;
    expect(labelEl.querySelector("img")).toBeNull();
  });

  it("cleanup function removes event listeners and clears timers", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const renderer = makeSearchableRenderer({ search: searchFn });
    const cleanup = initSearch(container, renderer, vi.fn())!;

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;

    // Start a debounce timer
    input.value = "fox";
    input.dispatchEvent(new Event("input"));

    // Cleanup before timer fires
    cleanup();

    await vi.advanceTimersByTimeAsync(300);

    // The search should not have been called because cleanup cancelled the timer
    // and set destroyed = true
    expect(searchFn).not.toHaveBeenCalled();
  });

  it("discards stale search results when query changes during await", async () => {
    let resolveFirst!: (value: SearchResult[]) => void;
    const staleResults = [makeSearchResult({ label: "Stale" })];
    const freshResults = [makeSearchResult({ label: "Fresh" })];
    const searchFn = vi.fn()
      .mockImplementationOnce(() => new Promise<SearchResult[]>((r) => { resolveFirst = r; }))
      .mockImplementationOnce(() => Promise.resolve(freshResults));
    const renderer = makeSearchableRenderer({ search: searchFn });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    const countEl = container.querySelector(".viewer-search-count") as HTMLElement;

    // Type first query and trigger debounce
    input.value = "first";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);
    expect(searchFn).toHaveBeenCalledWith("first");

    // Type second query before first resolves
    input.value = "second";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);
    expect(searchFn).toHaveBeenCalledWith("second");

    // Resolve the first (stale) search — results should be discarded
    resolveFirst(staleResults);
    await vi.advanceTimersByTimeAsync(0);

    // Only fresh results should be displayed
    expect(countEl.textContent).toBe("1 result");
    const labelEl = container.querySelector(".viewer-search-result-label") as HTMLElement;
    expect(labelEl.textContent).toBe("Fresh");
  });

  it("search event (Enter key) triggers search immediately without debounce", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const renderer = makeSearchableRenderer({ search: searchFn });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    input.value = "immediate";
    input.dispatchEvent(new Event("search"));

    // Should be called immediately (after microtask), not after 300ms
    await vi.advanceTimersByTimeAsync(0);

    expect(searchFn).toHaveBeenCalledWith("immediate");
  });

  it("search event cancels pending debounce timer", async () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const renderer = makeSearchableRenderer({ search: searchFn });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;

    // Start debounce via input event
    input.value = "debounced";
    input.dispatchEvent(new Event("input"));

    // Before 300ms elapses, fire search event (Enter)
    input.dispatchEvent(new Event("search"));
    await vi.advanceTimersByTimeAsync(0);

    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith("debounced");

    // Advance past debounce -- should not fire again (same query dedup)
    await vi.advanceTimersByTimeAsync(300);
    expect(searchFn).toHaveBeenCalledTimes(1);
  });

  it("clicking a result sets aria-selected on the clicked item", async () => {
    const results = [
      makeSearchResult({ location: "1", label: "Page 1" }),
      makeSearchResult({ location: "2", label: "Page 2" }),
    ];
    const renderer = makeSearchableRenderer({
      search: vi.fn().mockResolvedValue(results),
    });
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    input.value = "fox";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);

    const resultsList = container.querySelector(".viewer-search-results") as HTMLUListElement;
    (resultsList.children[1] as HTMLElement).click();

    expect(resultsList.children[1]!.getAttribute("aria-selected")).toBe("true");
    expect(resultsList.children[0]!.hasAttribute("aria-selected")).toBe(false);
  });

  it("zero results shows '0 results' count", async () => {
    const renderer = makeSearchableRenderer();
    initSearch(container, renderer, vi.fn());

    const input = container.querySelector(".viewer-search-input") as HTMLInputElement;
    const countEl = container.querySelector(".viewer-search-count") as HTMLElement;

    input.value = "nonexistent";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(300);

    expect(countEl.textContent).toBe("0 results");
  });
});
