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
  // Per-page canned text items for B and C tests. hasEOL is optional so the
  // renderer's reconstructPage(textContent.items) sees it; existing items leave
  // it undefined (no separator), preserving current behavior.
  const PAGE_ITEMS: Record<number, { str: string; hasEOL?: boolean }[]> = {
    1: [{ str: "the cat sat" }],
    2: [{ str: "the dog ran" }],
    3: [{ str: "a fish swims" }],
    // Page 4: cross-line match test. Reconstructs to "alpha the quick"
    // (space after each hasEOL item). Items: [{0,5},{6,3},{10,5}].
    4: [{ str: "alpha", hasEOL: true }, { str: "the", hasEOL: true }, { str: "quick" }],
    // Page 5: intra-word same-line regression. No hasEOL → no separator.
    // Reconstructs to "world". Items: [{0,3},{3,2}].
    5: [{ str: "wor" }, { str: "ld" }],
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
    numPages: 5,
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
    __fakeDoc: fakeDoc,
  };
});

// Import after mocks are in place.
import {
  reconstructPage,
  findMatches,
  buildSnippet,
  encodeLocation,
  decodeLocation,
  offsetToItemRanges,
  createPdfRenderer,
} from "../../src/viewer/pdf";
import { MAX_SEARCH_RESULTS } from "../../src/viewer/types";

// ---------------------------------------------------------------------------
// A. Pure helper tests — no mock dependencies needed.
// ---------------------------------------------------------------------------

describe("reconstructPage", () => {
  it("joins str values with empty separator (no hasEOL) and records item ranges", () => {
    const layout = reconstructPage([{ str: "foo" }, { str: "bar" }]);
    expect(layout.text).toBe("foobar");
    expect(layout.items).toEqual([
      { start: 0, length: 3 },
      { start: 3, length: 3 },
    ]);
  });

  it("inserts a space separator after a hasEOL item, excluded from item ranges", () => {
    const layout = reconstructPage([{ str: "foo", hasEOL: true }, { str: "bar" }]);
    expect(layout.text).toBe("foo bar");
    expect(layout.items).toEqual([
      { start: 0, length: 3 },
      { start: 4, length: 3 },
    ]);
  });

  it("marked-content items (no str key) contribute empty string", () => {
    // {} has no `str` property; should not throw and contributes ""
    const layout = reconstructPage([{ str: "a" }, {}, { str: "b" }]);
    expect(layout.text).toBe("ab");
    expect(layout.items).toEqual([
      { start: 0, length: 1 },
      { start: 1, length: 0 },
      { start: 1, length: 1 },
    ]);
  });

  it("empty array returns empty string and no items", () => {
    const layout = reconstructPage([]);
    expect(layout.text).toBe("");
    expect(layout.items).toEqual([]);
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

  it("length equals needle (lowercased query) length", () => {
    const query = "needle";
    const needle = query.toLowerCase();
    const matches = findMatches("needle in a needlestack", query);
    for (const m of matches) {
      expect(m.length).toBe(needle.length);
    }
  });

  it("does not overlap matches", () => {
    // "aaa" has overlapping potential at 0 and 1, but non-overlapping returns only 0
    const matches = findMatches("aaa", "aa");
    expect(matches).toEqual([{ offset: 0, length: 2 }]);
  });

  it("uses needle (lowercased) length, not query length, for expanding-case queries", () => {
    // "İ" (U+0130) lowercases to "i" + U+0307 (combining dot above): length 1 → 2.
    const query = "İ";
    const needle = query.toLowerCase(); // "i̇", length 2
    const pageText = "a" + needle + "b";
    const matches = findMatches(pageText, query);
    // Match spans needle.length (2) at offset 1, not query.length (1).
    expect(matches).toEqual([{ offset: 1, length: 2 }]);
  });

  it("advances by needle (lowercased) length between adjacent expanding-case matches", () => {
    // "İ" (U+0130) lowercases to "i" + U+0307 (combining dot above): length 1 → 2.
    const query = "İ";
    const needle = query.toLowerCase(); // "i̇", length 2
    const matches = findMatches(needle + needle, query);
    // Two adjacent matches: the next search must resume at needle.length (2),
    // not query.length (1), or it would start inside the consumed needle.
    expect(matches).toEqual([
      { offset: 0, length: needle.length },
      { offset: needle.length, length: needle.length },
    ]);
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

describe("offsetToItemRanges", () => {
  // Inputs are built via reconstructPage(...).items so the layout offsets match
  // exactly what the production search path produces (and exercise it for free).
  const layoutItems = (strs: string[]) =>
    reconstructPage(strs.map((str) => ({ str }))).items;

  it("single-div case: maps range entirely within one item", () => {
    const result = offsetToItemRanges(layoutItems(["hello world"]), 6, 5);
    expect(result).toEqual([{ divIndex: 0, localStart: 6, localEnd: 11 }]);
  });

  it("spanning-div case: maps range across two items", () => {
    // "foo"(0-2) + "bar"(3-5) + "baz"(6-8) → concatenation "foobarbaz"
    // offset 2, length 3: covers "o" from "foo" [2,3) + "ba" from "bar" [0,2)
    const result = offsetToItemRanges(layoutItems(["foo", "bar", "baz"]), 2, 3);
    expect(result).toEqual([
      { divIndex: 0, localStart: 2, localEnd: 3 },
      { divIndex: 1, localStart: 0, localEnd: 2 },
    ]);
  });

  it("empty-string item contributes zero width and is skipped", () => {
    // "ab"(0-1) + ""(empty) + "cd"(2-3) → concatenation "abcd"
    // offset 1, length 2: covers "b" from "ab" [1,2) + "c" from "cd" [0,1)
    const result = offsetToItemRanges(layoutItems(["ab", "", "cd"]), 1, 2);
    expect(result).toEqual([
      { divIndex: 0, localStart: 1, localEnd: 2 },
      { divIndex: 2, localStart: 0, localEnd: 1 },
    ]);
  });

  it("range entirely within second item", () => {
    const result = offsetToItemRanges(layoutItems(["abc", "defgh"]), 3, 3);
    expect(result).toEqual([{ divIndex: 1, localStart: 0, localEnd: 3 }]);
  });

  it("maps a corrected expanding-case match onto its item", () => {
    const ci = "İ".toLowerCase(); // "i̇", length 2 — built, not a fragile literal
    const result = offsetToItemRanges(layoutItems(["a", ci, "b"]), 1, 2);
    expect(result).toEqual([{ divIndex: 1, localStart: 0, localEnd: 2 }]);
  });

  it("gap-boundary: hasEOL separator produces no segment for the gap; correct segments either side", () => {
    // reconstructPage([{str:"foo",hasEOL:true},{str:"bar"}]) → text:"foo bar"
    // Items: [{start:0,length:3},{start:4,length:3}]. Offset 3 is the separator
    // gap (a plain space in text, not part of any item range).
    // Range [1,7) = offset:1, length:6 covers "oo bar":
    //   - "oo" from "foo": div0 localStart:1, localEnd:3
    //   - (gap at text[3]: no segment produced)
    //   - "bar" from "bar": div1 localStart:0, localEnd:3
    const { items } = reconstructPage([{ str: "foo", hasEOL: true }, { str: "bar" }]);
    const result = offsetToItemRanges(items, 1, 6);
    expect(result).toEqual([
      { divIndex: 0, localStart: 1, localEnd: 3 },
      { divIndex: 1, localStart: 0, localEnd: 3 },
    ]);
    // Confirm: length is 2, not 3 — no gap segment present.
    expect(result.length).toBe(2);
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

    const { results } = await renderer.search!("the");

    const labels = results.map((r) => r.label);
    expect(labels).toContain("Page 1");
    expect(labels).toContain("Page 2");
    // Page 3 has no "the"
    expect(labels).not.toContain("Page 3");
  });

  it("each result has correct label, decodable location, and consistent snippet", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
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

    expect(await renderer.search!("")).toEqual({ results: [], truncated: false });
  });

  it("returns [] for whitespace-only query", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    expect(await renderer.search!("   ")).toEqual({ results: [], truncated: false });
  });

  it("returns [] when query matches no page", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("xyzzy");
    expect(results).toEqual([]);
  });

  it("page 1 result location decodes to {page:1, offset:0, length:3}", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const page1 = results.find((r) => r.label === "Page 1");
    expect(page1).toBeDefined();

    const decoded = decodeLocation(page1!.location);
    expect(decoded).toEqual({ page: 1, offset: 0, length: 3 });
  });

  it("page 2 result location decodes to {page:2, offset:0, length:3}", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const page2 = results.find((r) => r.label === "Page 2");
    expect(page2).toBeDefined();

    const decoded = decodeLocation(page2!.location);
    expect(decoded).toEqual({ page: 2, offset: 0, length: 3 });
  });

  it("returns [] without throwing when called before init() resolves", async () => {
    const renderer = createPdfRenderer();

    await expect(renderer.search!("the")).resolves.toEqual({ results: [], truncated: false });
  });

  it("returns [] without throwing when destroy() ran before search()", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");
    renderer.destroy(); // sets destroyed = true and pdfDoc = null
    // Old code: `await pdfDoc!.getPage(1)` dereferences null → TypeError.
    await expect(renderer.search!("the")).resolves.toEqual({ results: [], truncated: false });
  });

  // ---------------------------------------------------------------------------
  // Criterion 2: Cross-line match — page 4 has items
  //   [{str:"alpha",hasEOL:true},{str:"the",hasEOL:true},{str:"quick"}]
  // reconstructPage produces "alpha the quick" with items
  //   [{start:0,length:5},{start:6,length:3},{start:10,length:5}].
  // Old empty-join code would build "alphathequick" and find nothing for
  // "the quick". New code with hasEOL separator finds one match at offset 6, length 9.
  // ---------------------------------------------------------------------------

  it("cross-line: search('the quick') returns exactly one result on page 4 (criterion 2)", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the quick");
    const page4Results = results.filter((r) => r.label === "Page 4");
    expect(page4Results.length).toBe(1);
    expect(page4Results[0].label).toBe("Page 4");

    const decoded = decodeLocation(page4Results[0].location);
    expect(decoded).not.toBeNull();
    expect(decoded!.offset).toBe(6);
    expect(decoded!.length).toBe(9);
  });

  // Criterion 4: snippet offset invariant for each result of the cross-line search.
  it("cross-line: every result has matchStart/matchLength within snippet and slice equals query (criterion 4)", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the quick");
    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      const { snippet, matchStart, matchLength } = result;
      expect(matchStart).toBeGreaterThanOrEqual(0);
      expect(matchLength).toBeGreaterThan(0);
      expect(matchStart + matchLength).toBeLessThanOrEqual(snippet.length);
      expect(snippet.slice(matchStart, matchStart + matchLength).toLowerCase()).toBe("the quick");
    }
  });

  // Criterion 5 (search half): intra-word same-line regression.
  // Page 5: [{str:"wor"},{str:"ld"}] → no hasEOL → reconstructs to "world".
  // search("world") must find one match at offset:0, length:5.
  it("intra-word same-line: search('world') finds match at offset:0,length:5 on page 5 (criterion 5)", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("world");
    const page5Results = results.filter((r) => r.label === "Page 5");
    expect(page5Results.length).toBe(1);

    const decoded = decodeLocation(page5Results[0].location);
    expect(decoded).not.toBeNull();
    expect(decoded!.offset).toBe(0);
    expect(decoded!.length).toBe(5);
  });

  it("caps results at MAX_SEARCH_RESULTS and sets truncated=true when matches exceed the limit", async () => {
    // Build a fake doc with MAX_SEARCH_RESULTS + 1 pages, each with one match,
    // so the total across pages exceeds the cap.
    const pdfjs = await import("pdfjs-dist");
    const overPageCount = MAX_SEARCH_RESULTS + 1;
    const overDoc = {
      numPages: overPageCount,
      destroy() {},
      getPage: (_i: number) =>
        Promise.resolve({
          getTextContent: () => Promise.resolve({ items: [{ str: "fox jumps" }] }),
          getViewport: () => ({ width: 100, height: 100 }),
          render: () => ({ promise: Promise.resolve(), cancel() {} }),
        }),
      getOutline: () => Promise.resolve(null),
      getDestination: () => Promise.resolve(null),
      getPageIndex: () => Promise.resolve(0),
    };
    const spy = vi
      .spyOn(pdfjs, "getDocument")
      .mockReturnValue({ promise: Promise.resolve(overDoc) } as never);
    try {
      const renderer = createPdfRenderer();
      await renderer.init(container, "fake://over.pdf");
      const result = await renderer.search!("fox");
      expect(result.results.length).toBe(MAX_SEARCH_RESULTS);
      expect(result.truncated).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it("does not truncate and sets truncated=false when matches are within the limit", async () => {
    // The default mock doc has 5 pages; search("the") yields 2 matches (pages 1 and 2).
    // That is well below MAX_SEARCH_RESULTS, so truncated must be false.
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");
    const result = await renderer.search!("the");
    expect(result.results.length).toBeLessThanOrEqual(MAX_SEARCH_RESULTS);
    expect(result.truncated).toBe(false);
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
      // Must resolve to a partial/empty result envelope, never reject.
      await expect(renderer.search!("the")).resolves.toEqual(
        expect.objectContaining({ results: expect.any(Array), truncated: expect.any(Boolean) }),
      );
    } finally {
      spy.mockRestore();
    }
  });
});

describe("getOutline()", () => {
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

  it("getOutline() resolves cleanly with no reportError when destroy() races getDestination()", async () => {
    // Load-bearing: getDestination returns a NON-EMPTY array so the pre-fix code
    // would reach pdfDoc!.getPageIndex() — which throws TypeError because destroy()
    // nulled pdfDoc between the getOutline() guard and the getPageIndex await.
    // With an empty or null getDestination the page-index branch is skipped and
    // the test would pass even against unfixed code (not discriminating).
    const pdfjs = await import("pdfjs-dist");
    let renderer: ReturnType<typeof createPdfRenderer>;
    const racingDoc = {
      numPages: 3,
      destroy() {},
      getPage: (_i: number) =>
        Promise.resolve({
          getTextContent: () => Promise.resolve({ items: [{ str: "text" }] }),
          getViewport: () => ({ width: 100, height: 100 }),
          render: () => ({ promise: Promise.resolve(), cancel() {} }),
        }),
      getOutline: () =>
        Promise.resolve([{ title: "Ch 1", dest: "ch1", items: [] }]),
      getDestination: (_dest: string) => {
        // destroy() races between the getOutline() guard and getPageIndex.
        renderer.destroy();
        // Non-empty array: on unfixed code getPageIndex is reached next and throws
        // TypeError because pdfDoc is now null.
        return Promise.resolve([{ num: 1, gen: 0 }]);
      },
      getPageIndex: () => Promise.resolve(0),
    };
    const spy = vi
      .spyOn(pdfjs, "getDocument")
      .mockReturnValue({ promise: Promise.resolve(racingDoc) } as never); // type-safety-ok: vitest mock for pdfjs-dist getDocument complex return type
    try {
      renderer = createPdfRenderer();
      await renderer.init(container, "fake://source.pdf");
      const outline = await renderer.getOutline!(); // type-safety-ok: createPdfRenderer always defines getOutline
      // Must resolve to an array (clean return), never call reportError.
      expect(outline).toBeInstanceOf(Array);
      expect(globalThis.reportError).not.toHaveBeenCalled();
      // The entry resolves with no page (page stayed null) so goToOutlineEntry
      // is a no-op — the outline entry exists but maps to no page.
      expect(outline.length).toBe(1);
      expect(outline[0].title).toBe("Ch 1");
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
    vi.useFakeTimers();
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
    vi.useRealTimers();
  });

  // A non-zero rect so renderPageInto proceeds past the 0×0 guard. Mirrors the
  // container stub set up in beforeEach, factored out so the spread/exception
  // target tests share one stub shape.
  const makeTargetRect = (): DOMRect => ({
    width: 400,
    height: 600,
    top: 0,
    left: 0,
    right: 400,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON() { return {}; },
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
    const { results } = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    expect(page1Result).toBeDefined();

    // goToResult is ARM-ONLY — no highlight appears until renderResult() runs.
    await renderer.goToResult!(page1Result!);
    await renderer.renderResult!();

    // After renderResult, a .search-highlight.active span should exist in the container
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

  it("re-rendering a page with the highlight still armed restores the detached div (idempotent applyHighlight)", async () => {
    vi.useFakeTimers();
    try {
      const renderer = createPdfRenderer();
      await renderer.init(container, "fake://source.pdf");
      const { results } = await renderer.search!("the");
      const page1Result = results.find((r) => r.label === "Page 1");
      // Arm then render so the highlight is live before the resize re-render
      // (goToResult is arm-only).
      await renderer.goToResult!(page1Result!);
      await renderer.renderResult!();

      const firstSpan = container.querySelector(".search-highlight");
      expect(firstSpan).not.toBeNull();
      const firstDiv = firstSpan!.parentElement!; // the textDiv from render 1
      expect(firstDiv.querySelector(".search-highlight")).not.toBeNull();

      // Debounced resize re-render with pendingHighlight still armed.
      resizeObserverCallbacks[resizeObserverCallbacks.length - 1]();
      await vi.advanceTimersByTimeAsync(200);
      await Promise.resolve();

      // firstDiv is now detached; without the fix it stays wrapped.
      expect(firstDiv.querySelector(".search-highlight")).toBeNull();
      expect(firstDiv.textContent).toBe("the cat sat");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clearSearch() disarms pendingHighlight so re-render does not reapply", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    await renderer.goToResult!(page1Result!);
    // Apply the highlight so clearSearch has something real to clear.
    await renderer.renderResult!();

    renderer.clearSearch!();

    // Navigate to page 1 again via goToPage — should NOT reapply the highlight
    await renderer.goToPage(1);

    expect(container.querySelector(".search-highlight.active")).toBeNull();
  });

  it("goToResult alone (arm-only) produces no highlight span; renderResult() applies it", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    expect(page1Result).toBeDefined();

    // ARM step only — no render triggered, so no highlight span in the DOM.
    await renderer.goToResult!(page1Result!);
    expect(container.querySelector(".search-highlight")).toBeNull();

    // RENDER step — highlight should now appear with the matched text.
    await renderer.renderResult!();
    const highlight = container.querySelector(".search-highlight.active");
    expect(highlight).not.toBeNull();
    expect(highlight!.textContent).toBe("the");
  });

  it("goToOutlineEntry() drains stale highlight and disarms pendingHighlight", async () => {
    // Outline entry resolves to page 1 — the SAME page as the search result.
    // A different page would make the resize assertion pass even on unfixed code,
    // since applyHighlight is gated on pendingHighlight.page === pageNum.
    // Same-page is the only configuration where the discriminating assertion is observable.
    const pdfjs = (await import("pdfjs-dist")) as unknown as { __fakeDoc: { getOutline: () => Promise<unknown> } };
    pdfjs.__fakeDoc.getOutline = () =>
      Promise.resolve([{ title: "Chapter 1", dest: [{ num: 1, gen: 0 }], items: [] }]);

    try {
      const renderer = createPdfRenderer();
      await renderer.init(container, "fake://source.pdf");

      const { results } = await renderer.search!("the");
      const page1Result = results.find((r) => r.label === "Page 1");
      await renderer.goToResult!(page1Result!);
      // goToResult is arm-only now (#1719); renderResult() applies the highlight.
      await renderer.renderResult!();
      expect(container.querySelector(".search-highlight.active")).not.toBeNull();

      const outline = await renderer.getOutline!();
      await renderer.goToOutlineEntry!(outline[0]);
      // Discriminating assertion: on unfixed code, the armed pendingHighlight would
      // be re-applied during goToOutlineEntry's own renderPage call (same page 1),
      // leaving a .search-highlight span in the DOM.
      expect(container.querySelector(".search-highlight")).toBeNull();

      resizeObserverCallbacks.forEach((cb) => cb());
      vi.advanceTimersByTime(150);
      await Promise.resolve();
      expect(container.querySelector(".search-highlight")).toBeNull();
    } finally {
      // Restore getOutline so this mutation does not affect subsequent tests.
      pdfjs.__fakeDoc.getOutline = () => Promise.resolve(null);
    }
  });

  // -------------------------------------------------------------------------
  // Double-highlight regression (#1726): applyHighlight() restores any divs
  // mutated by a prior call before reading them, so re-rendering a page that
  // already carries a highlight never leaves the previous render's detached
  // div still wrapped in a stale .search-highlight span.
  // -------------------------------------------------------------------------

  it("double goToResult() on the same page leaves no stale highlighted div", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    expect(page1Result).toBeDefined();

    // Render #1: arm then render so the first textLayer span carries the
    // render-#1 node (which renderPage's up-front replaceChildren will detach
    // on the next render). goToResult is arm-only, so renderResult() drives
    // the visible render.
    await renderer.goToResult!(page1Result!);
    await renderer.renderResult!();
    const firstDiv = container.querySelector(".textLayer span") as HTMLElement;
    expect(firstDiv).not.toBeNull();
    expect(firstDiv.querySelector(".search-highlight")).not.toBeNull();

    // Render #2: same page. renderTextLayer detaches firstDiv and builds a
    // fresh layer; applyHighlight's leading unwrapHighlights() must restore the
    // now-detached firstDiv, collapsing its stale highlight span. On unfixed
    // code firstDiv stays wrapped and this assertion fails.
    await renderer.goToResult!(page1Result!);
    await renderer.renderResult!();
    expect(firstDiv.querySelector(".search-highlight")).toBeNull();

    // The live layer should still show exactly one highlighted "the".
    const liveHighlights = container.querySelectorAll(".textLayer .search-highlight");
    expect(liveHighlights.length).toBe(1);
    expect(liveHighlights[0].textContent).toBe("the");

    renderer.clearSearch!();

    expect(container.querySelector(".search-highlight")).toBeNull();
    const liveSpans = container.querySelectorAll(".textLayer span");
    expect(liveSpans.length).toBe(1);
    expect(liveSpans[0].textContent).toBe("the cat sat");
  });

  it("ResizeObserver re-render while pendingHighlight is set restores the detached div", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    expect(page1Result).toBeDefined();

    // Arm then render so the first highlight is live before the resize
    // re-render fires (goToResult is arm-only).
    await renderer.goToResult!(page1Result!);
    await renderer.renderResult!();
    const firstDiv = container.querySelector(".textLayer span") as HTMLElement;
    expect(firstDiv).not.toBeNull();
    expect(firstDiv.querySelector(".search-highlight")).not.toBeNull();

    // Fire the stored resize callbacks and let the 150ms debounce elapse so the
    // ResizeObserver re-render (renderPage(_currentPage)) runs while
    // pendingHighlight is still armed.
    resizeObserverCallbacks.forEach((cb) => cb());
    await vi.advanceTimersByTimeAsync(220);

    // The re-render detaches firstDiv; applyHighlight's unwrapHighlights()
    // restores it so it is no longer highlighted.
    expect(firstDiv.querySelector(".search-highlight")).toBeNull();

    renderer.clearSearch!();

    expect(container.querySelector(".search-highlight")).toBeNull();
    const liveSpans = container.querySelectorAll(".textLayer span");
    expect(liveSpans.length).toBe(1);
    expect(liveSpans[0].textContent).toBe("the cat sat");
  });

  it("every live text-layer span returns to its original text after clearSearch (acceptance #3 guard)", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    // Arm then render so clearSearch has a real highlight to clean up
    // (goToResult is arm-only).
    await renderer.goToResult!(page1Result!);
    await renderer.renderResult!();

    renderer.clearSearch!();

    const liveSpans = Array.from(container.querySelectorAll(".textLayer span"));
    expect(liveSpans.length).toBe(1);
    for (const span of liveSpans) {
      expect(span.querySelector(".search-highlight")).toBeNull();
    }
    expect(liveSpans[0].textContent).toBe("the cat sat");
  });

  it("goToResult() drains the previous result's highlight before arming the next", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const r1 = results.find((r) => r.label === "Page 1")!;
    const r2 = results.find((r) => r.label === "Page 2")!;

    // Arm then render the first result so its highlight is live in the DOM.
    await renderer.goToResult!(r1);
    await renderer.renderResult!();
    // Capture the text-layer div that holds the first result's highlight span.
    const div1 = container.querySelector(".search-highlight")!.parentElement!;
    expect(div1.querySelector(".search-highlight")).not.toBeNull();

    // Arming the second result must drain the first entry (unwrapHighlights),
    // restoring div1 instead of leaking it in highlightRestores. The drain
    // lives inside goToResult, so it happens without a render.
    await renderer.goToResult!(r2);
    expect(div1.querySelector(".search-highlight")).toBeNull();

    // Render the second result so exactly one highlight is live in the DOM.
    await renderer.renderResult!();
    expect(container.querySelectorAll(".search-highlight.active").length).toBe(1);
  });

  it("concurrent renderPageInto() for the same page keeps one wrapper (spreadGen guard)", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    // Arm then render pendingHighlight for page 1 so the highlight is live in the DOM.
    const { results } = await renderer.search!("the");
    const page1Result = results.find((r) => r.label === "Page 1");
    expect(page1Result).toBeDefined();
    await renderer.goToResult!(page1Result!);
    await renderer.renderResult!();
    expect(container.querySelector(".search-highlight.active")).not.toBeNull();

    // A fresh spread target with a non-zero rect so renderPageInto proceeds past
    // the 0×0 guard.
    const target = document.createElement("div");
    target.getBoundingClientRect = makeTargetRect;

    // Two concurrent renders of the SAME page into the SAME target. The public
    // renderPageInto runs cancelSpreadRenderTasks() (bumps spreadGen) synchronously
    // before its first await, so the first call captures the older gen and, after
    // its canvas render, loses the gen race and removes its orphaned wrapper; only
    // the second call's wrapper survives.
    const p1 = renderer.renderPageInto!(1, target);
    const p2 = renderer.renderPageInto!(1, target);
    await Promise.all([p1, p2]);

    // Load-bearing: the spreadGen guard makes the superseded render remove its
    // wrapper. Without the guard both renders keep their wrapper → 2.
    expect(target.querySelectorAll(".pdf-page-wrapper").length).toBe(1);

    // The surviving render applied the armed highlight exactly once.
    const highlights = target.querySelectorAll(".search-highlight.active");
    expect(highlights.length).toBe(1);
    expect(highlights[0].textContent).toBe("the");

    // applyHighlight() unwraps first, so the main container's highlight from
    // goToResult was restored when the spread render re-applied the highlight.
    expect(container.querySelector(".search-highlight.active")).toBeNull();

    // Exact-restore: the surviving wrapper reconstructs the original page text,
    // and clearSearch() returns it to plain "the cat sat" with no highlight.
    const wrapper = target.querySelector(".pdf-page-wrapper")!;
    expect(wrapper.textContent).toBe("the cat sat");
    renderer.clearSearch!();
    expect(target.querySelector(".search-highlight")).toBeNull();
    const restored = Array.from(target.querySelectorAll("span")).find(
      (s) => s.textContent === "the cat sat",
    );
    expect(restored).toBeDefined();
  });

  // SEQUENTIAL (two awaited renderPageInto calls, not concurrent). Exercises a
  // DIFFERENT invariant than the adjacent "concurrent renderPageInto" test above:
  // that test uses Promise.all to verify the spreadGen cancellation guard (one
  // wrapper survives); this test verifies that applyHighlight's leading
  // unwrapHighlights() restores the first wrapper's stale highlight span on the
  // spread path — the regression that #1726 fixed for the single-page path but
  // did not cover on the spread path.
  it("sequential double renderPageInto() on the same page leaves no stale highlight in the first wrapper", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the"); // type-safety-ok: optional renderer API method, present in this test harness
    const page1Result = results.find((r) => r.label === "Page 1");
    expect(page1Result).toBeDefined();

    // Arm pendingHighlight for page 1 (goToResult is arm-only — no render yet).
    await renderer.goToResult!(page1Result!); // type-safety-ok: optional method; page1Result is non-null per the toBeDefined assertion above

    // A fresh spread target with a non-zero rect so renderPageInto proceeds past
    // the 0×0 guard.
    const target = document.createElement("div");
    target.getBoundingClientRect = makeTargetRect;

    // Call #1: renders page 1 into target, applying the highlight.
    await renderer.renderPageInto!(1, target); // type-safety-ok: optional renderer API method, present in this test harness
    const firstWrapper = target.querySelector(".pdf-page-wrapper") as HTMLElement; // type-safety-ok: querySelector result narrowed to the page wrapper element
    expect(firstWrapper).not.toBeNull();
    expect(firstWrapper.querySelector(".search-highlight")).not.toBeNull();

    // Call #2 (same page, same target): renderPageInto appends a second wrapper
    // alongside the first (no innerHTML="" here — that step lives in
    // SpreadController.render()). applyHighlight's leading unwrapHighlights()
    // must restore firstWrapper's stale highlight span even though firstWrapper
    // is still attached. On unfixed code the firstWrapper retains its
    // .search-highlight span and the assertion below fails.
    await renderer.renderPageInto!(1, target); // type-safety-ok: optional renderer API method, present in this test harness

    // THE discriminating assertion: firstWrapper's highlight is gone because
    // unwrapHighlights() ran before the second applyHighlight wrote the new one.
    expect(firstWrapper.querySelector(".search-highlight")).toBeNull();

    // Only the live (second) wrapper carries a highlight.
    expect(target.querySelectorAll(".search-highlight").length).toBe(1);
    expect(target.querySelectorAll(".search-highlight")[0].textContent).toBe("the");
  });

  it("goToPosition() drains the active highlight and disarms pendingHighlight", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("the");
    const r1 = results.find((r) => r.label === "Page 1")!;
    // Arm then render so the highlight is live before navigating away.
    await renderer.goToResult!(r1);
    await renderer.renderResult!();

    // Capture the text-layer div holding the highlight before navigation.
    const div1 = container.querySelector(".search-highlight")!.parentElement!;
    expect(div1.querySelector(".search-highlight")).not.toBeNull();

    // goToPosition must unwrap the highlight and disarm pendingHighlight
    // (goToPosition itself renders and drains).
    await renderer.goToPosition("2");

    // The highlight span is removed from the previously-live text div.
    expect(div1.querySelector(".search-highlight")).toBeNull();
    // No highlight exists anywhere in the container.
    expect(container.querySelectorAll(".search-highlight").length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Exception-path wrapper leak (#1816): a throw inside renderPageInto() must
  // not leave a stray .pdf-page-wrapper attached to target. The try/finally
  // keyed on `committed` covers all non-committed exit paths.
  // -------------------------------------------------------------------------

  it("renderPageInto() throwing on canvas context leaves no wrapper", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const target = document.createElement("div");
    target.getBoundingClientRect = makeTargetRect;

    // null context makes renderPageToCanvas throw "Could not acquire 2D canvas context".
    getContextSpy.mockReturnValue(null);

    await expect(renderer.renderPageInto!(1, target)).rejects.toThrow(/Could not acquire 2D canvas context/);
    expect(target.querySelectorAll(".pdf-page-wrapper").length).toBe(0);
  });

  it("renderPageInto() throwing on text layer leaves no wrapper", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const target = document.createElement("div");
    target.getBoundingClientRect = makeTargetRect;

    // Import the mocked TextLayer (MockTextLayer) and make render() reject with a
    // non-AbortException error so renderTextLayer rethrows it.
    const { TextLayer } = await import("pdfjs-dist");
    const renderSpy = vi.spyOn(TextLayer.prototype, "render").mockRejectedValue(new Error("boom"));
    try {
      await expect(renderer.renderPageInto!(1, target)).rejects.toThrow();
      expect(target.querySelectorAll(".pdf-page-wrapper").length).toBe(0);
    } finally {
      renderSpy.mockRestore();
    }
  });

  // ---------------------------------------------------------------------------
  // Criterion 3: Spanning-div highlight, EXACT coverage (DISCRIMINATING test).
  //
  // Page 4 items: [{str:"alpha",hasEOL:true},{str:"the",hasEOL:true},{str:"quick"}]
  // reconstructPage produces text "alpha the quick" with items:
  //   [{start:0,length:5},{start:6,length:3},{start:10,length:5}]
  //
  // "the quick" matches at offset:6, length:9. offsetToItemRanges(items,6,9):
  //   - item1 {start:6,length:3}: inter=[6,9) → localStart:0,localEnd:3 → "the"
  //   - item2 {start:10,length:5}: inter=[10,15) → localStart:0,localEnd:5 → "quick"
  //   → exactly two spans reading "the" and "quick".
  //
  // DISCRIMINATION REASONING: The leading {str:"alpha",hasEOL:true} item places a
  // separator at text offset 5, shifting item1 from start:5 (old empty-join) to
  // start:6 (new hasEOL code). An old/unmirrored mapper without the separator
  // would compute items [{0,5},{5,3},{8,5}], yielding localStart:1 for item1 →
  // "he" instead of "the". The exact-"the" assertion FAILS against that mapper.
  // A match at offset 0 (no leading item) would pass on BOTH old and new code
  // and would NOT be discriminating — this is why the leading "alpha" item is
  // load-bearing and must be kept.
  // ---------------------------------------------------------------------------

  it("spanning-div highlight: search('the quick') on page 4 produces exactly two spans 'the'+'quick' (criterion 3)", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    // Search to populate the pageLayoutCache for page 4.
    const { results } = await renderer.search!("the quick");
    const page4Result = results.find((r) => r.label === "Page 4");
    expect(page4Result).toBeDefined();

    // Arm then render: goToResult arms pendingHighlight; renderResult renders page 4
    // with the text layer and applies the highlight via applyHighlight.
    await renderer.goToResult!(page4Result!);
    await renderer.renderResult!();

    // EXACT coverage: must be exactly two .search-highlight.active spans.
    // If the separator is not mirrored, the first span reads "he" (localStart:1)
    // and this assertion fails — making this test genuinely discriminating.
    const highlights = container.querySelectorAll(".search-highlight.active");
    expect(highlights.length).toBe(2);
    expect(highlights[0].textContent).toBe("the");
    expect(highlights[1].textContent).toBe("quick");

    renderer.clearSearch!();
    expect(container.querySelector(".search-highlight")).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Criterion 5 (highlight half): intra-word same-line regression.
  //
  // Page 5 items: [{str:"wor"},{str:"ld"}] — NO hasEOL anywhere.
  // reconstructPage → text:"world", items:[{start:0,length:3},{start:3,length:2}].
  // No separator inserted. offsetToItemRanges(items,0,5):
  //   - item0 {0,3}: inter=[0,3) → localStart:0,localEnd:3 → "wor"
  //   - item1 {3,2}: inter=[3,5) → localStart:0,localEnd:2 → "ld"
  //   → two spans "wor"+"ld"; concatenation equals "world".
  // This proves no separator is inserted at same-line item boundaries.
  // ---------------------------------------------------------------------------

  it("intra-word same-line: highlight on page 5 covers exactly 'world' across two divs, no separator (criterion 5)", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(container, "fake://source.pdf");

    const { results } = await renderer.search!("world");
    const page5Result = results.find((r) => r.label === "Page 5");
    expect(page5Result).toBeDefined();

    await renderer.goToResult!(page5Result!);
    await renderer.renderResult!();

    // Two spans: "wor" + "ld" — the highlight crosses the item boundary without
    // any inserted separator, confirming no hasEOL spacing on same-line items.
    const highlights = container.querySelectorAll(".search-highlight.active");
    expect(highlights.length).toBe(2);
    expect(highlights[0].textContent).toBe("wor");
    expect(highlights[1].textContent).toBe("ld");
    // Concatenation equals the full matched word.
    const combined = Array.from(highlights).map((h) => h.textContent).join("");
    expect(combined).toBe("world");

    renderer.clearSearch!();
    expect(container.querySelector(".search-highlight")).toBeNull();
  });
});
