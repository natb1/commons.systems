import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Browser global stubs — must run before the module under test is imported.
// ResizeObserver stores callbacks so tests can trigger resize events; init()
// constructs one even when the render no-ops due to a 0×0 container.
// ---------------------------------------------------------------------------

let resizeObserverCallbacks: Array<() => void> = [];

function stubBrowserGlobals() {
  vi.stubGlobal("ResizeObserver", class {
    constructor(cb: () => void) { resizeObserverCallbacks.push(cb); }
    observe() {}
    disconnect() {}
  });
  if (typeof globalThis.reportError !== "function") {
    vi.stubGlobal("reportError", vi.fn());
  }
}

stubBrowserGlobals();

// ---------------------------------------------------------------------------
// pdfjs-dist mock — all state is local to the factory so vitest hoisting
// cannot cause "Cannot access before initialization" errors.
// ---------------------------------------------------------------------------

vi.mock("pdfjs-dist", () => {
  // Per-page canned text items for B and C tests.
  const PAGE_ITEMS: Record<number, { str: string }[]> = {
    1: [{ str: "the cat sat" }],
    2: [{ str: "the dog ran" }],
    3: [{ str: "a fish swims" }],
  };

  // TextLayer mock: builds index-aligned textDivs and textContentItemsStr so
  // applyHighlight can operate on them without a real rendering pipeline.
  class MockTextLayer {
    textDivs: HTMLElement[];
    textContentItemsStr: string[];
    private _container: HTMLElement;

    constructor(opts: { textContentSource: { items: { str?: string }[] }; container: HTMLElement; viewport: unknown }) {
      this._container = opts.container;
      this.textContentItemsStr = opts.textContentSource.items.map((i) =>
        "str" in i ? (i.str ?? "") : "",
      );
      this.textDivs = [];
    }

    render(): Promise<void> {
      for (const text of this.textContentItemsStr) {
        const span = document.createElement("span");
        span.textContent = text;
        this._container.appendChild(span);
        this.textDivs.push(span);
      }
      return Promise.resolve();
    }

    cancel(): void {}
  }

  const fakeDoc = {
    numPages: 3,
    destroy() {},
    getPage: (i: number) =>
      Promise.resolve({
        getTextContent: () => Promise.resolve({ items: PAGE_ITEMS[i] ?? [] }),
        getViewport: (_opts: unknown) => ({ width: 100, height: 100 }),
        render: (_opts: unknown) => ({ promise: Promise.resolve(), cancel() {} }),
      }),
    getOutline: () => Promise.resolve(null),
    getDestination: (_dest: string) => Promise.resolve(null),
    getPageIndex: (_ref: unknown) => Promise.resolve(0),
  };

  return {
    GlobalWorkerOptions: { workerSrc: "" },
    version: "4.10.38",
    getDocument: (_source: unknown) => ({ promise: Promise.resolve(fakeDoc) }),
    TextLayer: MockTextLayer,
  };
});

// Import after mocks are in place.
import {
  buildPageText,
  findMatches,
  buildSnippet,
  encodeLocation,
  decodeLocation,
  offsetToDivRanges,
  createPdfRenderer,
} from "../../src/viewer/pdf";

// ---------------------------------------------------------------------------
// A. Pure helper tests — no mock dependencies needed.
// ---------------------------------------------------------------------------

describe("buildPageText", () => {
  it("joins str values with empty separator", () => {
    expect(buildPageText([{ str: "foo" }, { str: "bar" }])).toBe("foobar");
  });

  it("marked-content items (no str key) contribute empty string", () => {
    // {} has no `str` property; should not throw and contributes ""
    expect(buildPageText([{ str: "a" }, {}, { str: "b" }])).toBe("ab");
  });

  it("empty array returns empty string", () => {
    expect(buildPageText([])).toBe("");
  });
});

describe("findMatches", () => {
  it("finds multiple non-overlapping matches", () => {
    const matches = findMatches("ababab", "ab");
    expect(matches).toEqual([
      { offset: 0, length: 2 },
      { offset: 2, length: 2 },
      { offset: 4, length: 2 },
    ]);
  });

  it("is case-insensitive", () => {
    const matches = findMatches("foo FOO fOo", "FOO");
    expect(matches.length).toBe(3);
    expect(matches[0]).toEqual({ offset: 0, length: 3 });
    expect(matches[1]).toEqual({ offset: 4, length: 3 });
    expect(matches[2]).toEqual({ offset: 8, length: 3 });
  });

  it("returns [] when no match", () => {
    expect(findMatches("hello world", "xyz")).toEqual([]);
  });

  it("length equals query length", () => {
    const query = "needle";
    const matches = findMatches("needle in a needlestack", query);
    for (const m of matches) {
      expect(m.length).toBe(query.length);
    }
  });

  it("does not overlap matches", () => {
    // "aaa" has overlapping potential at 0 and 1, but non-overlapping returns only 0
    const matches = findMatches("aaa", "aa");
    expect(matches).toEqual([{ offset: 0, length: 2 }]);
  });
});

describe("buildSnippet", () => {
  it("clips both ends with ellipses for a match in the middle of a long string", () => {
    // 50 'x' chars, then "needle", then 44 'y' chars → total 100 chars
    const text = "x".repeat(50) + "needle" + "y".repeat(44);
    const offset = 50;
    const length = 6;
    const { snippet, matchStart, matchLength } = buildSnippet(text, offset, length);

    // Both ends clipped
    expect(snippet.startsWith("…")).toBe(true);
    expect(snippet.endsWith("…")).toBe(true);

    // matchStart accounts for the leading ellipsis (+1)
    expect(matchStart).toBeGreaterThan(0);
    expect(matchLength).toBe(length);

    // Core invariant: the match actually appears at the reported position
    expect(snippet.slice(matchStart, matchStart + matchLength)).toBe("needle");

    // SearchResult invariant
    expect(matchStart).toBeGreaterThanOrEqual(0);
    expect(matchStart + matchLength).toBeLessThanOrEqual(snippet.length);
  });

  it("no leading ellipsis and matchStart=0 for a match at offset 0 of a short string", () => {
    const text = "short text";
    const { snippet, matchStart, matchLength } = buildSnippet(text, 0, 5);

    expect(snippet.startsWith("…")).toBe(false);
    expect(matchStart).toBe(0);
    expect(matchLength).toBe(5);
    expect(snippet.slice(matchStart, matchStart + matchLength)).toBe("short");

    // SearchResult invariant
    expect(matchStart + matchLength).toBeLessThanOrEqual(snippet.length);
  });

  it("appends trailing ellipsis when match is near start of long string", () => {
    const text = "needle" + "z".repeat(80);
    const { snippet, matchStart, matchLength } = buildSnippet(text, 0, 6);

    expect(snippet.startsWith("…")).toBe(false);
    expect(snippet.endsWith("…")).toBe(true);
    expect(matchStart).toBe(0);
    expect(matchLength).toBe(6);
    expect(snippet.slice(matchStart, matchStart + matchLength)).toBe("needle");
    expect(matchStart + matchLength).toBeLessThanOrEqual(snippet.length);
  });
});

describe("encodeLocation / decodeLocation", () => {
  it("round-trips correctly", () => {
    const encoded = encodeLocation(3, 10, 4);
    expect(decodeLocation(encoded)).toEqual({ page: 3, offset: 10, length: 4 });
  });

  it("returns null for wrong part count (2 parts)", () => {
    expect(decodeLocation("3:10")).toBeNull();
  });

  it("returns null for NaN parts", () => {
    expect(decodeLocation("a:b:c")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(decodeLocation("")).toBeNull();
  });

  it("returns null for 4-part string", () => {
    expect(decodeLocation("1:2:3:4")).toBeNull();
  });
});

describe("offsetToDivRanges", () => {
  it("single-div case: maps range entirely within one item", () => {
    const result = offsetToDivRanges(["hello world"], 6, 5);
    expect(result).toEqual([{ divIndex: 0, localStart: 6, localEnd: 11 }]);
  });

  it("spanning-div case: maps range across two items", () => {
    // "foo"(0-2) + "bar"(3-5) + "baz"(6-8) → concatenation "foobarbaz"
    // offset 2, length 3: covers "o" from "foo" [2,3) + "ba" from "bar" [0,2)
    const result = offsetToDivRanges(["foo", "bar", "baz"], 2, 3);
    expect(result).toEqual([
      { divIndex: 0, localStart: 2, localEnd: 3 },
      { divIndex: 1, localStart: 0, localEnd: 2 },
    ]);
  });

  it("empty-string item contributes zero width and is skipped", () => {
    // "ab"(0-1) + ""(empty) + "cd"(2-3) → concatenation "abcd"
    // offset 1, length 2: covers "b" from "ab" [1,2) + "c" from "cd" [0,1)
    const result = offsetToDivRanges(["ab", "", "cd"], 1, 2);
    expect(result).toEqual([
      { divIndex: 0, localStart: 1, localEnd: 2 },
      { divIndex: 2, localStart: 0, localEnd: 1 },
    ]);
  });

  it("range entirely within second item", () => {
    const result = offsetToDivRanges(["abc", "defgh"], 3, 3);
    expect(result).toEqual([{ divIndex: 1, localStart: 0, localEnd: 3 }]);
  });
});

// ---------------------------------------------------------------------------
// B. search() — uses the mocked pdfjs-dist, 0×0 container so renderPage
// no-ops at the early return (line 363 of pdf.ts), pdfDoc/_pageCount still set.
// ---------------------------------------------------------------------------

describe("search()", () => {
  let container: HTMLElement;

  beforeEach(() => {
    resizeObserverCallbacks = [];
    vi.clearAllMocks();
    container = document.createElement("div");
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(globalThis.reportError).mockRestore();
  });

  it("returns matches from multiple pages for query 'the'", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const results = await renderer.search!("the");

    const labels = results.map((r) => r.label);
    expect(labels).toContain("Page 1");
    expect(labels).toContain("Page 2");
    // Page 3 has no "the"
    expect(labels).not.toContain("Page 3");
  });

  it("each result has correct label, decodable location, and consistent snippet", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const results = await renderer.search!("the");
    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      // Label is "Page N"
      expect(result.label).toMatch(/^Page \d+$/);

      // Location decodes back to the correct page and length
      const decoded = decodeLocation(result.location);
      expect(decoded).not.toBeNull();
      expect(decoded!.length).toBe(3); // "the".length

      const pageNum = parseInt(result.label.replace("Page ", ""), 10);
      expect(decoded!.page).toBe(pageNum);

      // Snippet/matchStart/matchLength invariant
      expect(result.matchStart).toBeGreaterThanOrEqual(0);
      expect(result.matchLength).toBeGreaterThan(0);
      expect(result.matchStart + result.matchLength).toBeLessThanOrEqual(result.snippet.length);

      // The match text in the snippet is actually "the"
      expect(
        result.snippet.slice(result.matchStart, result.matchStart + result.matchLength).toLowerCase(),
      ).toBe("the");
    }
  });

  it("returns [] for empty query", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    expect(await renderer.search!("")).toEqual([]);
  });

  it("returns [] for whitespace-only query", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    expect(await renderer.search!("   ")).toEqual([]);
  });

  it("returns [] when query matches no page", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const results = await renderer.search!("xyzzy");
    expect(results).toEqual([]);
  });

  it("page 1 result location decodes to {page:1, offset:0, length:3}", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const results = await renderer.search!("the");
    const page1 = results.find((r) => r.label === "Page 1");
    expect(page1).toBeDefined();

    const decoded = decodeLocation(page1!.location);
    expect(decoded).toEqual({ page: 1, offset: 0, length: 3 });
  });

  it("page 2 result location decodes to {page:2, offset:0, length:3}", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const results = await renderer.search!("the");
    const page2 = results.find((r) => r.label === "Page 2");
    expect(page2).toBeDefined();

    const decoded = decodeLocation(page2!.location);
    expect(decoded).toEqual({ page: 2, offset: 0, length: 3 });
  });

  it("returns [] without throwing when destroy() ran before search()", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");
    renderer.destroy(); // sets destroyed = true and pdfDoc = null
    // Old code: `await pdfDoc!.getPage(1)` dereferences null → TypeError.
    await expect(renderer.search!("the")).resolves.toEqual([]);
  });

  it("resolves (does not reject) when destroy() fires during the page loop", async () => {
    const pdfjs = await import("pdfjs-dist");
    let renderer: ReturnType<typeof createPdfRenderer>;
    const racingDoc = {
      numPages: 3,
      destroy() {},
      getPage: (i: number) => {
        if (i === 2) renderer.destroy(); // teardown races mid-loop
        return Promise.resolve({
          getTextContent: () => Promise.resolve({ items: [{ str: "the cat" }] }),
          getViewport: () => ({ width: 100, height: 100 }),
          render: () => ({ promise: Promise.resolve(), cancel() {} }),
        });
      },
      getOutline: () => Promise.resolve(null),
      getDestination: () => Promise.resolve(null),
      getPageIndex: () => Promise.resolve(0),
    };
    const spy = vi
      .spyOn(pdfjs, "getDocument")
      .mockReturnValue({ promise: Promise.resolve(racingDoc) } as never);
    try {
      renderer = createPdfRenderer();
      await renderer.init(container, "fake://source.pdf");
      // Must resolve to a partial/empty result, never reject.
      await expect(renderer.search!("the")).resolves.toBeInstanceOf(Array);
    } finally {
      spy.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// C. clearSearch() — full simulation using goToResult() to trigger applyHighlight.
//
// Approach: drive via public API: init() → search() → goToResult(result).
// For renderPage to proceed past the 0×0 guard we stub getBoundingClientRect
// on the container. We also stub HTMLCanvasElement.prototype.getContext to
// return a minimal fake 2D context (pdf.ts line 260 throws if ctx is null),
// and stub Element.prototype.scrollIntoView (called by applyHighlight line 329,
// unimplemented in happy-dom). The mocked TextLayer appends index-aligned spans
// to the textLayerDiv, so applyHighlight can wrap the matched segment.
// ---------------------------------------------------------------------------

describe("clearSearch()", () => {
  let container: HTMLElement;
  let getContextSpy: ReturnType<typeof vi.spyOn>;
  let scrollSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resizeObserverCallbacks = [];
    vi.clearAllMocks();

    container = document.createElement("div");

    // Make container appear non-zero so renderPage proceeds past the early return.
    container.getBoundingClientRect = () => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() { return {}; },
    });

    // Stub canvas.getContext("2d") — happy-dom returns null; pdf.ts throws on null.
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as CanvasRenderingContext2D,
    );

    // Stub scrollIntoView — not implemented in happy-dom.
    scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});

    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    scrollSpy.mockRestore();
    vi.mocked(globalThis.reportError).mockRestore();
  });

  it("clearSearch() is callable and idempotent before any goToResult (no active highlight)", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    // Should not throw; no highlight to restore
    expect(() => renderer.clearSearch!()).not.toThrow();
    expect(() => renderer.clearSearch!()).not.toThrow();
  });

  it("goToResult() wraps a .search-highlight.active span, clearSearch() removes it and restores text", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    // Search for "the" and navigate to the first result (Page 1: "the cat sat")
    const results = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    expect(page1Result).toBeDefined();

    await renderer.goToResult!(page1Result!);

    // After goToResult, a .search-highlight.active span should exist in the container
    const highlight = container.querySelector(".search-highlight.active");
    expect(highlight).not.toBeNull();
    expect(highlight!.textContent).toBe("the");

    // After clearSearch, the span is gone and the div text is restored
    renderer.clearSearch!();

    expect(container.querySelector(".search-highlight.active")).toBeNull();
    expect(container.querySelector(".search-highlight")).toBeNull();

    // The text layer div should have its original text restored
    // The textDiv that was mutated should now have the plain text back
    const spans = container.querySelectorAll("span");
    // Find the span whose text includes the original content (restored to textContent)
    const restored = Array.from(spans).find((s) => s.textContent === "the cat sat");
    expect(restored).toBeDefined();
  });

  it("clearSearch() disarms pendingHighlight so re-render does not reapply", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const results = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    await renderer.goToResult!(page1Result!);

    renderer.clearSearch!();

    // Navigate to page 1 again via goToPage — should NOT reapply the highlight
    await renderer.goToPage(1);

    expect(container.querySelector(".search-highlight.active")).toBeNull();
  });
});
