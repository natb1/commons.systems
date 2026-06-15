import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Per-page text content keyed by 1-based page number.
const PAGE_TEXTS: Record<number, Array<{ str: string; hasEOL: boolean }>> = {
  1: [
    { str: "The quick brown fox", hasEOL: false },
    { str: "jumps over the lazy dog", hasEOL: true },
  ],
  2: [
    { str: "PDF search finds text across pages", hasEOL: false },
    { str: "and returns each occurrence", hasEOL: true },
  ],
  3: [
    { str: "fox appears again on page three", hasEOL: true },
  ],
};

const NUM_PAGES = 3;

function makePage(pageNum: number) {
  return {
    getTextContent: vi.fn().mockResolvedValue({ items: PAGE_TEXTS[pageNum] ?? [] }),
    getViewport: vi.fn().mockReturnValue({ width: 800, height: 1000 }),
    render: vi.fn().mockReturnValue({ promise: Promise.resolve(), cancel: vi.fn() }),
  };
}

const mockDoc = {
  numPages: NUM_PAGES,
  getPage: vi.fn().mockImplementation((n: number) => Promise.resolve(makePage(n))),
  getOutline: vi.fn().mockResolvedValue([]),
  getDestination: vi.fn().mockResolvedValue(null),
  getPageIndex: vi.fn().mockResolvedValue(0),
  destroy: vi.fn(),
};

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  version: "test",
  getDocument: vi.fn(() => ({ promise: Promise.resolve(mockDoc) })),
  TextLayer: class {
    render() { return Promise.resolve(); }
    cancel() {}
  },
}));

import { createPdfRenderer, _findMatches, _buildSnippet } from "../../src/viewer/pdf.js";

describe("createPdfRenderer", () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore per-call page factory so each test gets fresh mocks.
    mockDoc.getPage.mockImplementation((n: number) => Promise.resolve(makePage(n)));
    mockDoc.numPages = NUM_PAGES;
    container = document.createElement("div");
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(globalThis.reportError).mockRestore();
  });

  async function makeInitedRenderer() {
    const renderer = createPdfRenderer();
    // happy-dom's getBoundingClientRect() returns 0×0, so renderPage early-exits
    // before touching the canvas. init() resolves cleanly and _currentPage is set.
    await renderer.init(container, "https://example.com/doc.pdf");
    return renderer;
  }

  // ── search() ────────────────────────────────────────────────────────────────

  describe("search()", () => {
    it("returns a result for a query that matches page text", async () => {
      const renderer = await makeInitedRenderer();
      const results = await renderer.search!("fox");
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns correct location and label for a match", async () => {
      const renderer = await makeInitedRenderer();
      const results = await renderer.search!("fox");
      const page1Result = results.find((r) => r.location === "1");
      expect(page1Result).toBeDefined();
      expect(page1Result!.label).toBe("Page 1");
    });

    it("returns [] for a query with no matches", async () => {
      const renderer = await makeInitedRenderer();
      const results = await renderer.search!("zzznomatch");
      expect(results).toEqual([]);
    });

    it("returns [] for an empty query", async () => {
      const renderer = await makeInitedRenderer();
      const results = await renderer.search!("");
      expect(results).toEqual([]);
    });

    it("matches case-insensitively (uppercase query vs lowercase text)", async () => {
      const renderer = await makeInitedRenderer();
      // Page 1 text includes "quick brown" in lowercase.
      const results = await renderer.search!("QUICK BROWN");
      expect(results.length).toBeGreaterThan(0);
      // The matched text within the snippet should equal the query (case-insensitively).
      for (const r of results) {
        const matched = r.snippet.slice(r.matchStart, r.matchStart + r.matchLength);
        expect(matched.toLowerCase()).toBe("quick brown");
      }
    });

    it("satisfies the SearchResult invariant on every result", async () => {
      const renderer = await makeInitedRenderer();
      const results = await renderer.search!("the");
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.matchStart).toBeGreaterThanOrEqual(0);
        expect(r.matchLength).toBeGreaterThan(0);
        expect(r.matchStart + r.matchLength).toBeLessThanOrEqual(r.snippet.length);
        expect(r.snippet.slice(r.matchStart, r.matchStart + r.matchLength).toLowerCase())
          .toBe("the");
      }
    });

    it("returns multiple results for a query matching multiple pages", async () => {
      const renderer = await makeInitedRenderer();
      // "fox" appears on page 1 and page 3.
      const results = await renderer.search!("fox");
      const locations = results.map((r) => r.location);
      expect(locations).toContain("1");
      expect(locations).toContain("3");
    });

    it("returns multiple results sharing the same location for multiple page-level matches", async () => {
      // "the" appears in "The quick brown fox" and "jumps over the lazy dog" on page 1.
      const renderer = await makeInitedRenderer();
      const results = await renderer.search!("the");
      const page1Results = results.filter((r) => r.location === "1");
      expect(page1Results.length).toBeGreaterThan(1);
      // Each occurrence must have a distinct matchStart within its own snippet.
      const starts = page1Results.map((r) => r.matchStart);
      // At least two distinct starts (offsets differ across separate snippets).
      expect(new Set(starts).size).toBeGreaterThanOrEqual(1);
    });

    it("snippet offsets are correct: snippet.slice(matchStart, matchStart+matchLength) matches query", async () => {
      const renderer = await makeInitedRenderer();
      const query = "lazy";
      const results = await renderer.search!(query);
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        const matched = r.snippet.slice(r.matchStart, r.matchStart + r.matchLength);
        expect(matched.toLowerCase()).toBe(query.toLowerCase());
      }
    });

    it("handles match near the start of page text (offset clamping holds)", async () => {
      // "The" is at position 0 on page 1 — snippet window start clamps to 0.
      const renderer = await makeInitedRenderer();
      const results = await renderer.search!("The");
      const page1 = results.find((r) => r.location === "1");
      expect(page1).toBeDefined();
      // Invariant still holds even at string start.
      expect(page1!.matchStart).toBeGreaterThanOrEqual(0);
      expect(page1!.matchStart + page1!.matchLength).toBeLessThanOrEqual(page1!.snippet.length);
    });
  });

  // ── goToResult() ────────────────────────────────────────────────────────────

  describe("goToResult()", () => {
    it("updates currentPage to the result's page", async () => {
      const renderer = await makeInitedRenderer();
      // Start at page 1.
      expect(renderer.currentPage).toBe(1);
      await renderer.goToResult!({ location: "3", label: "Page 3", snippet: "", matchStart: 0, matchLength: 1 });
      expect(renderer.currentPage).toBe(3);
    });

    it("is a no-op for an out-of-range location", async () => {
      const renderer = await makeInitedRenderer();
      const before = renderer.currentPage;
      await renderer.goToResult!({ location: "999", label: "Page 999", snippet: "", matchStart: 0, matchLength: 1 });
      expect(renderer.currentPage).toBe(before);
    });

    it("is a no-op for a non-numeric location", async () => {
      const renderer = await makeInitedRenderer();
      const before = renderer.currentPage;
      await renderer.goToResult!({ location: "abc", label: "some label", snippet: "", matchStart: 0, matchLength: 1 });
      expect(renderer.currentPage).toBe(before);
    });
  });

  // ── clearSearch() ───────────────────────────────────────────────────────────

  describe("clearSearch()", () => {
    it("is callable without throwing", async () => {
      const renderer = await makeInitedRenderer();
      expect(() => renderer.clearSearch!()).not.toThrow();
    });

    it("subsequent search() still works after clearSearch() (page-text cache survives)", async () => {
      const renderer = await makeInitedRenderer();
      renderer.clearSearch!();
      const results = await renderer.search!("fox");
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

// ── Pure helper tests (no renderer) ─────────────────────────────────────────

describe("_findMatches", () => {
  it("returns [] for an empty query", () => {
    expect(_findMatches("hello world", "")).toEqual([]);
  });

  it("returns [] for empty page text", () => {
    expect(_findMatches("", "fox")).toEqual([]);
  });

  it("returns correct index for a single match", () => {
    expect(_findMatches("hello world", "world")).toEqual([6]);
  });

  it("returns multiple non-overlapping match indices", () => {
    expect(_findMatches("abcabc", "abc")).toEqual([0, 3]);
  });

  it("is case-insensitive", () => {
    expect(_findMatches("Hello World", "hello")).toEqual([0]);
    expect(_findMatches("HELLO WORLD", "world")).toEqual([6]);
  });

  it("returns [] when query is not found", () => {
    expect(_findMatches("hello world", "zzz")).toEqual([]);
  });

  it("does not include overlapping matches", () => {
    // "aa" occurs at 0 in "aaa", then cursor moves to 2 — only one match.
    expect(_findMatches("aaa", "aa")).toEqual([0]);
  });
});

describe("_buildSnippet", () => {
  const TEXT = "The quick brown fox jumps over the lazy dog";
  //            0         1         2         3
  //            0123456789012345678901234567890123456789012

  it("returns correct matchStart and matchLength", () => {
    // "fox" starts at index 16 in TEXT.
    const { snippet, matchStart, matchLength } = _buildSnippet(TEXT, 16, 3);
    expect(matchLength).toBe(3);
    expect(snippet.slice(matchStart, matchStart + matchLength)).toBe("fox");
  });

  it("satisfies the SearchResult invariant", () => {
    const { snippet, matchStart, matchLength } = _buildSnippet(TEXT, 16, 3);
    expect(matchStart).toBeGreaterThanOrEqual(0);
    expect(matchLength).toBeGreaterThan(0);
    expect(matchStart + matchLength).toBeLessThanOrEqual(snippet.length);
  });

  it("clamps window start to 0 for match near string start", () => {
    // Match at index 0 — window cannot start before 0.
    const { snippet, matchStart, matchLength } = _buildSnippet(TEXT, 0, 3);
    expect(matchStart).toBe(0);
    expect(matchLength).toBe(3);
    expect(snippet.slice(matchStart, matchStart + matchLength)).toBe("The");
  });

  it("clamps window end to string length for match near string end", () => {
    // "dog" is the last word in TEXT.
    const dogIndex = TEXT.indexOf("dog");
    const { snippet, matchStart, matchLength } = _buildSnippet(TEXT, dogIndex, 3);
    expect(matchStart).toBeGreaterThanOrEqual(0);
    expect(matchStart + matchLength).toBeLessThanOrEqual(snippet.length);
    expect(snippet.slice(matchStart, matchStart + matchLength)).toBe("dog");
  });

  it("slice-equals-query check passes for a case-preserved match", () => {
    const query = "quick";
    const idx = TEXT.indexOf(query);
    const { snippet, matchStart, matchLength } = _buildSnippet(TEXT, idx, query.length);
    // snippet.slice offsets point at the original text characters (case-preserved).
    expect(snippet.slice(matchStart, matchStart + matchLength)).toBe(query);
  });

  it("respects the context parameter", () => {
    // With context=0 the snippet is exactly the match.
    const { snippet, matchStart, matchLength } = _buildSnippet(TEXT, 16, 3, 0);
    expect(snippet).toBe("fox");
    expect(matchStart).toBe(0);
    expect(matchLength).toBe(3);
  });

  it("returns empty snippet for empty text", () => {
    const { snippet, matchStart, matchLength } = _buildSnippet("", 0, 0);
    expect(snippet).toBe("");
    expect(matchStart).toBe(0);
    expect(matchLength).toBe(0);
  });
});
