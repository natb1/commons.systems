import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface RelocatedLocation {
  start: { index: number; cfi: string; displayed: { page: number; total: number } };
  atStart: boolean;
  atEnd: boolean;
}
type RelocatedCallback = (location: RelocatedLocation) => void;

function makeLocation(
  index: number,
  page: number,
  total: number,
  atStart = false,
  atEnd = false,
  cfi = "",
): RelocatedLocation {
  return {
    start: { index, cfi, displayed: { page, total } },
    atStart,
    atEnd,
  };
}

interface FakeSection {
  href: string;
  load: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
}

const mockRendition = {
  on: vi.fn(),
  once: vi.fn(),
  display: vi.fn().mockResolvedValue(undefined),
  next: vi.fn().mockResolvedValue(undefined),
  prev: vi.fn().mockResolvedValue(undefined),
  currentLocation: vi.fn(),
  destroy: vi.fn(),
  hooks: { content: { register: vi.fn() } },
  annotations: { highlight: vi.fn(), remove: vi.fn() },
};

const mockSpine = {
  length: 5,
  get: vi.fn().mockImplementation((index: number) => ({ href: `chapter-${index}.xhtml` })),
  // `search` reads spine.spineItems while `init` reads spine.length — both must
  // coexist on this same object. Replaced per-test in `beforeEach` (see below).
  spineItems: [] as FakeSection[],
};

const mockBook = {
  ready: Promise.resolve(),
  // `loaded.navigation` is a Promise `search` awaits; `navigation.get` is the
  // label lookup. Two distinct "navigation" members.
  loaded: { spine: Promise.resolve(), navigation: Promise.resolve() },
  navigation: { get: vi.fn() as ReturnType<typeof vi.fn> },
  load: vi.fn(),
  renderTo: vi.fn().mockReturnValue(mockRendition),
  spine: mockSpine,
  destroy: vi.fn(),
  locations: {
    generate: vi.fn().mockResolvedValue([]),
    cfiFromPercentage: vi.fn().mockReturnValue("epubcfi(/6/4!/4/2)"),
  },
};

/** Build a fresh fake spine section with the find/load/unload members search() uses. */
function makeSection(
  href: string,
  matches: { cfi: string; excerpt: string }[] = [],
): FakeSection {
  return {
    href,
    load: vi.fn().mockResolvedValue(undefined),
    unload: vi.fn(),
    find: vi.fn().mockReturnValue(matches),
  };
}

vi.mock("epubjs", () => ({
  default: vi.fn().mockImplementation(() => mockBook),
}));

import { createEpubRenderer } from "../../src/viewer/epub";

describe("createEpubRenderer", () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRendition.on.mockReset();
    mockRendition.once.mockReset();
    mockRendition.display.mockResolvedValue(undefined);
    mockRendition.next.mockResolvedValue(undefined);
    mockRendition.prev.mockResolvedValue(undefined);
    mockRendition.currentLocation.mockReset();
    mockSpine.length = 5;
    mockSpine.get.mockImplementation((index: number) => ({ href: `chapter-${index}.xhtml` }));
    // vi.clearAllMocks() only clears call history, not mockReturnValue/
    // mockImplementation, so per-test find/navigation.get/load implementations
    // would otherwise leak. Rebuild the section list and re-set implementations
    // each test for isolation.
    mockSpine.spineItems = [];
    mockBook.navigation.get.mockReset();
    mockBook.load.mockReset();
    mockRendition.annotations.highlight.mockReset();
    mockRendition.annotations.remove.mockReset();
    mockBook.locations.generate.mockResolvedValue([]);
    mockBook.locations.cfiFromPercentage.mockReturnValue("epubcfi(/6/4!/4/2)");
    container = document.createElement("div");
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(globalThis.reportError).mockRestore();
  });

  describe("init", () => {
    it("creates .viewer-epub-container div and appends to container", async () => {
      const renderer = createEpubRenderer();

      await renderer.init(container, "https://example.com/book.epub");

      const epubDiv = container.querySelector(".viewer-epub-container");
      expect(epubDiv).not.toBeNull();
      expect(epubDiv?.tagName).toBe("DIV");
    });

    it("throws if init is called twice", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      await expect(renderer.init(container, "https://example.com/book.epub")).rejects.toThrow(
        "EPUB renderer already initialized",
      );
    });

    it("sets currentPage to 1 after init (chapter index 0)", async () => {
      const renderer = createEpubRenderer();

      await renderer.init(container, "https://example.com/book.epub");

      expect(renderer.currentPage).toBe(1);
    });
  });

  describe("positionLabel", () => {
    it("returns 'Ch. X/Y — p. A/B' format", async () => {
      mockSpine.length = 5;
      const renderer = createEpubRenderer();

      await renderer.init(container, "https://example.com/book.epub");

      expect(renderer.positionLabel).toBe("Ch. 1/5 — p. 1/1");
    });
  });

  describe("next", () => {
    it("calls rendition.next when not at end", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Simulate relocated firing to move away from atStart
      const relocatedCb = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "relocated",
      )?.[1] as RelocatedCallback;
      relocatedCb(makeLocation(0, 1, 3, true, false));

      mockRendition.once.mockImplementation((_event: string, cb: () => void) => {
        cb();
      });

      await renderer.next();

      expect(mockRendition.next).toHaveBeenCalled();
    });

    it("does nothing when atEnd", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Simulate being at end
      const relocatedCb = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "relocated",
      )?.[1] as RelocatedCallback;
      relocatedCb(makeLocation(4, 3, 3, false, true));

      await renderer.next();

      expect(mockRendition.next).not.toHaveBeenCalled();
    });
  });

  describe("prev", () => {
    it("does nothing when atStart", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // atStart is true by default after init
      await renderer.prev();

      expect(mockRendition.prev).not.toHaveBeenCalled();
    });

    it("calls rendition.prev when not at start", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Simulate relocated to move away from start
      const relocatedCb = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "relocated",
      )?.[1] as RelocatedCallback;
      relocatedCb(makeLocation(1, 1, 3, false, false));

      mockRendition.once.mockImplementation((_event: string, cb: () => void) => {
        cb();
      });

      await renderer.prev();

      expect(mockRendition.prev).toHaveBeenCalled();
    });
  });

  describe("goToPage", () => {
    it("navigates to correct spine item", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      await renderer.goToPage(3);

      expect(mockSpine.get).toHaveBeenCalledWith(2);
      expect(mockRendition.display).toHaveBeenCalledWith("chapter-2.xhtml");
    });

    it("does nothing for out-of-range page numbers", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.display.mockClear();

      await renderer.goToPage(0);
      await renderer.goToPage(99);

      expect(mockRendition.display).not.toHaveBeenCalled();
    });
  });

  describe("goToPosition", () => {
    it("displays the given CFI and syncs position from currentLocation", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.display.mockClear();

      // epub.js does not reliably emit 'relocated' for display(cfi), so the
      // fix reads rendition.currentLocation() after display() resolves. The
      // returned CFI is intentionally different from the display argument so
      // the assertion proves the state came from currentLocation(), not from
      // the argument we passed in. once() is a no-op here (relocated never
      // fires) — currentLocation() is the sole source of the updated state.
      mockRendition.once.mockImplementation(() => {});
      const resolvedCfi = "epubcfi(/6/8!/4/10/3)";
      mockRendition.currentLocation.mockReturnValue(
        makeLocation(3, 2, 7, false, false, resolvedCfi),
      );

      const requestedCfi = "epubcfi(/6/14!/4/2/2)";
      await renderer.goToPosition(requestedCfi);

      expect(mockRendition.display).toHaveBeenCalledWith(requestedCfi);
      expect(renderer.position).toBe(resolvedCfi);
    });

    it("handles a currentLocation that returns a Promise", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.once.mockImplementation(() => {});
      const resolvedCfi = "epubcfi(/6/12!/4/6/1)";
      mockRendition.currentLocation.mockReturnValue(
        Promise.resolve(makeLocation(2, 1, 4, false, false, resolvedCfi)),
      );

      await renderer.goToPosition("epubcfi(/6/14!/4/2/2)");

      expect(renderer.position).toBe(resolvedCfi);
    });

    it("does nothing when rendition is not initialized", async () => {
      const renderer = createEpubRenderer();

      await renderer.goToPosition("epubcfi(/6/14!/4/2/2)");

      expect(mockRendition.display).not.toHaveBeenCalled();
    });
  });

  describe("goToFraction", () => {
    it("generates locations, maps the fraction to a CFI, and displays it", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.once.mockImplementation((_event: string, cb: () => void) => { cb(); });
      mockRendition.display.mockClear();

      await renderer.goToFraction!(0.5);

      expect(mockBook.locations.generate).toHaveBeenCalledTimes(1);
      expect(mockBook.locations.cfiFromPercentage).toHaveBeenCalledWith(0.5);
      expect(mockRendition.display).toHaveBeenCalledWith("epubcfi(/6/4!/4/2)");
    });

    it("generates locations lazily and memoizes across calls", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.once.mockImplementation((_event: string, cb: () => void) => { cb(); });

      // Not generated at init time.
      expect(mockBook.locations.generate).not.toHaveBeenCalled();

      await renderer.goToFraction!(0.25);
      expect(mockBook.locations.generate).toHaveBeenCalledTimes(1);

      // Second call reuses the memoized locations index.
      await renderer.goToFraction!(0.75);
      expect(mockBook.locations.generate).toHaveBeenCalledTimes(1);
    });

    it("clamps fractions above 1 down to 1", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.once.mockImplementation((_event: string, cb: () => void) => { cb(); });

      await renderer.goToFraction!(1.5);

      expect(mockBook.locations.cfiFromPercentage).toHaveBeenCalledWith(1);
    });

    it("clamps fractions below 0 up to 0", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.once.mockImplementation((_event: string, cb: () => void) => { cb(); });

      await renderer.goToFraction!(-0.2);

      expect(mockBook.locations.cfiFromPercentage).toHaveBeenCalledWith(0);
    });
  });

  describe("destroy", () => {
    it("calls rendition.destroy, book.destroy, and removes container div", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const epubDiv = container.querySelector(".viewer-epub-container");
      expect(epubDiv).not.toBeNull();

      renderer.destroy();

      expect(mockRendition.destroy).toHaveBeenCalled();
      expect(mockBook.destroy).toHaveBeenCalled();
      expect(container.querySelector(".viewer-epub-container")).toBeNull();
    });
  });

  describe("relocated event", () => {
    it("updates positionLabel when relocated fires", async () => {
      let relocatedCb: RelocatedCallback | null = null;
      mockRendition.on.mockImplementation((event: string, cb: RelocatedCallback) => {
        if (event === "relocated") relocatedCb = cb;
      });

      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      expect(relocatedCb).not.toBeNull();
      relocatedCb!(makeLocation(2, 4, 10, false, false));
      expect(renderer.positionLabel).toBe("Ch. 3/5 — p. 4/10");
    });
  });

  describe("position", () => {
    it("returns empty string before any relocation", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      expect(renderer.position).toBe("");
    });

    it("returns current CFI after relocated fires", async () => {
      let relocatedCb: RelocatedCallback | null = null;
      mockRendition.on.mockImplementation((event: string, cb: RelocatedCallback) => {
        if (event === "relocated") relocatedCb = cb;
      });

      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      relocatedCb!(makeLocation(1, 2, 5, false, false, "epubcfi(/6/4!/4/2)"));
      expect(renderer.position).toBe("epubcfi(/6/4!/4/2)");
    });
  });

  describe("initialPosition", () => {
    it("passes initialPosition to rendition.display", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub", "epubcfi(/6/4!/4/2)");

      expect(mockRendition.display).toHaveBeenCalledWith("epubcfi(/6/4!/4/2)");
    });

    it("passes undefined to rendition.display when no initialPosition", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      expect(mockRendition.display).toHaveBeenCalledWith(undefined);
    });
  });

  describe("canGoNext / canGoPrev", () => {
    it("canGoPrev is false and canGoNext is true at start", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      expect(renderer.canGoPrev).toBe(false);
      expect(renderer.canGoNext).toBe(true);
    });

    it("both are true in middle of book", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const relocatedCb = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "relocated",
      )?.[1] as RelocatedCallback;
      relocatedCb(makeLocation(2, 1, 3, false, false));

      expect(renderer.canGoPrev).toBe(true);
      expect(renderer.canGoNext).toBe(true);
    });

    it("canGoNext is false and canGoPrev is true at end", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const relocatedCb = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "relocated",
      )?.[1] as RelocatedCallback;
      relocatedCb(makeLocation(4, 3, 3, false, true));

      expect(renderer.canGoPrev).toBe(true);
      expect(renderer.canGoNext).toBe(false);
    });
  });

  describe("waitForRelocated timeout", () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it("resolves after timeout when relocated never fires", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Move away from atStart so next() proceeds
      const relocatedCb = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "relocated",
      )?.[1] as RelocatedCallback;
      relocatedCb(makeLocation(1, 1, 3, false, false));

      // once() captures the callback but never invokes it
      mockRendition.once.mockImplementation(() => {});

      const nextPromise = renderer.next();
      vi.advanceTimersByTime(30000);
      await nextPromise;

      expect(mockRendition.next).toHaveBeenCalled();
    });
  });

  describe("content hook", () => {
    let originalFetch: typeof globalThis.fetch;
    let revokeStub: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      revokeStub = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      revokeStub.mockRestore();
    });

    async function initAndGetHook(): Promise<(contents: { document: Document }) => Promise<void>> {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const hookCb = mockRendition.hooks.content.register.mock.calls[0][0] as
        (contents: { document: Document }) => Promise<void>;
      expect(hookCb).toBeTypeOf("function");
      return hookCb;
    }

    function makeMockDoc(links: { rel: string; href: string }[]): Document {
      const doc = document.implementation.createHTMLDocument("test");
      for (const { rel, href } of links) {
        const link = doc.createElement("link");
        link.setAttribute("rel", rel);
        doc.head.appendChild(link);
        // Set href after appending to avoid happy-dom fetching blob URLs
        link.setAttribute("href", href);
      }
      return doc;
    }

    it("replaces blob stylesheet links with inline styles", async () => {
      const hookCb = await initAndGetHook();
      const doc = makeMockDoc([{ rel: "stylesheet", href: "blob:http://localhost/abc-123" }]);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("body { color: red; }"),
      });

      await hookCb({ document: doc });

      const style = doc.head.querySelector("style");
      expect(style).not.toBeNull();
      expect(style!.textContent).toBe("body { color: red; }");
      expect(doc.head.querySelector('link[rel="stylesheet"]')).toBeNull();
    });

    it("leaves non-blob stylesheet links unchanged", async () => {
      const hookCb = await initAndGetHook();
      const doc = makeMockDoc([{ rel: "stylesheet", href: "https://example.com/style.css" }]);

      globalThis.fetch = vi.fn();

      await hookCb({ document: doc });

      expect(doc.head.querySelector('link[rel="stylesheet"]')).not.toBeNull();
      expect(doc.head.querySelector("style")).toBeNull();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("does not revoke blob URLs after replacement", async () => {
      const hookCb = await initAndGetHook();
      const doc = makeMockDoc([{ rel: "stylesheet", href: "blob:http://localhost/xyz-789" }]);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("h1 { font-size: 2em; }"),
      });

      await hookCb({ document: doc });

      expect(revokeStub).not.toHaveBeenCalled();
    });

    it("styles every chapter when multiple chapters share one blob URL", async () => {
      const hookCb = await initAndGetHook();
      const sharedHref = "blob:http://localhost/shared-1";
      const revokedUrls = new Set<string>();
      revokeStub.mockImplementation((url: string) => { revokedUrls.add(url); });

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (revokedUrls.has(url)) {
          return Promise.reject(new Error(`blob URL already revoked: ${url}`));
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("body { color: red; }"),
        });
      });

      const doc1 = makeMockDoc([{ rel: "stylesheet", href: sharedHref }]);
      const doc2 = makeMockDoc([{ rel: "stylesheet", href: sharedHref }]);

      await hookCb({ document: doc1 });
      await hookCb({ document: doc2 });

      for (const doc of [doc1, doc2]) {
        const style = doc.head.querySelector("style");
        expect(style).not.toBeNull();
        expect(style!.textContent).toBe("body { color: red; }");
        expect(doc.head.querySelector('link[rel="stylesheet"]')).toBeNull();
      }
    });

    it("propagates fetch failure and calls reportError", async () => {
      const hookCb = await initAndGetHook();
      const doc = makeMockDoc([{ rel: "stylesheet", href: "blob:http://localhost/fail-000" }]);

      globalThis.fetch = vi.fn().mockRejectedValue(new Error("network error"));

      await expect(hookCb({ document: doc })).rejects.toThrow("network error");
      expect(reportError).toHaveBeenCalled();
    });

    it("throws on non-ok fetch response and calls reportError", async () => {
      const hookCb = await initAndGetHook();
      const doc = makeMockDoc([{ rel: "stylesheet", href: "blob:http://localhost/bad-status" }]);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      await expect(hookCb({ document: doc })).rejects.toThrow("Failed to fetch EPUB blob stylesheet: 404 Not Found");
      expect(reportError).toHaveBeenCalled();
    });

    it("throws when contents.document is missing and calls reportError", async () => {
      const hookCb = await initAndGetHook();

      await expect(hookCb({ document: undefined as unknown as Document })).rejects.toThrow(
        "epub.js content hook received contents without a document",
      );
      expect(reportError).toHaveBeenCalled();
    });
  });

  describe("onError", () => {
    it("registers onError on rendition displayerror event", async () => {
      const errorHandler = vi.fn();
      const renderer = createEpubRenderer(errorHandler);
      await renderer.init(container, "https://example.com/book.epub");

      const displayErrorCall = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "displayerror",
      );
      expect(displayErrorCall).toBeDefined();
      expect(displayErrorCall![1]).toBe(errorHandler);
    });

    it("registers reportError fallback when onError is not provided", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const displayErrorCall = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "displayerror",
      );
      expect(displayErrorCall).toBeDefined();
      expect(typeof displayErrorCall![1]).toBe("function");
    });
  });

  describe("search", () => {
    const BASE_STYLES = { fill: "#fde68a" };
    const ACTIVE_STYLES = { fill: "#f59e0b", "fill-opacity": "0.5" };

    async function initRenderer() {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");
      return renderer;
    }

    it("returns matches from every spine section", async () => {
      const s0 = makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "alpha fox beta" }]);
      const s1 = makeSection("ch1.xhtml", [{ cfi: "cfi-1", excerpt: "gamma fox delta" }]);
      const s2 = makeSection("ch2.xhtml", [{ cfi: "cfi-2", excerpt: "epsilon fox" }]);
      mockSpine.spineItems = [s0, s1, s2];
      mockBook.navigation.get.mockImplementation((href: string) => ({ label: `Label ${href}` }));

      const renderer = await initRenderer();
      const results = await renderer.search!("fox");

      // load + find called on every section (matches across chapter boundaries).
      for (const s of [s0, s1, s2]) {
        expect(s.load).toHaveBeenCalledTimes(1);
        expect(s.find).toHaveBeenCalledWith("fox");
        expect(s.unload).toHaveBeenCalledTimes(1);
      }
      expect(results.map((r) => r.location)).toEqual(["cfi-0", "cfi-1", "cfi-2"]);
      expect(results.map((r) => r.label)).toEqual([
        "Label ch0.xhtml",
        "Label ch1.xhtml",
        "Label ch2.xhtml",
      ]);
    });

    it("derives snippet/matchStart/matchLength satisfying the SearchResult invariant", async () => {
      mockSpine.spineItems = [
        makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "the   quick brown\nfox jumps" }]),
      ];
      mockBook.navigation.get.mockReturnValue({ label: "Chapter One" });

      const renderer = await initRenderer();
      const [result] = await renderer.search!("brown");

      // Whitespace collapsed to single spaces and trimmed.
      expect(result!.snippet).toBe("the quick brown fox jumps");
      expect(result!.matchStart).toBe(result!.snippet.indexOf("brown"));
      expect(result!.matchLength).toBe(5);
      // Invariant.
      expect(result!.matchStart).toBeGreaterThanOrEqual(0);
      expect(result!.matchLength).toBeGreaterThan(0);
      expect(result!.matchStart + result!.matchLength).toBeLessThanOrEqual(result!.snippet.length);
    });

    it("handles '...'-padded excerpts and collapses internal whitespace", async () => {
      mockSpine.spineItems = [
        makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "...lots of   text fox more text..." }]),
      ];
      mockBook.navigation.get.mockReturnValue({ label: "Padded" });

      const renderer = await initRenderer();
      const [result] = await renderer.search!("fox");

      expect(result!.snippet).toBe("...lots of text fox more text...");
      expect(result!.matchStart).toBe(result!.snippet.indexOf("fox"));
      expect(result!.matchLength).toBe(3);
      expect(result!.matchStart + result!.matchLength).toBeLessThanOrEqual(result!.snippet.length);
    });

    it("matches case-insensitively", async () => {
      mockSpine.spineItems = [
        makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "A FOX in the henhouse" }]),
      ];
      mockBook.navigation.get.mockReturnValue({ label: "Caps" });

      const renderer = await initRenderer();
      const [result] = await renderer.search!("fox");

      expect(result!.snippet).toBe("A FOX in the henhouse");
      expect(result!.matchStart).toBe(2); // index of "FOX"
      expect(result!.matchLength).toBe(3);
    });

    it("falls back to 'Ch. N' label when navigation.get returns undefined", async () => {
      const s0 = makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "fox" }]);
      const s1 = makeSection("ch1.xhtml", [{ cfi: "cfi-1", excerpt: "fox" }]);
      mockSpine.spineItems = [s0, s1];
      mockBook.navigation.get.mockReturnValue(undefined);

      const renderer = await initRenderer();
      const results = await renderer.search!("fox");

      expect(results.map((r) => r.label)).toEqual(["Ch. 1", "Ch. 2"]);
    });

    it("base-highlights each match cfi after the iteration completes", async () => {
      mockSpine.spineItems = [
        makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "fox" }]),
        makeSection("ch1.xhtml", [{ cfi: "cfi-1", excerpt: "fox" }]),
      ];
      mockBook.navigation.get.mockReturnValue({ label: "X" });

      const renderer = await initRenderer();
      await renderer.search!("fox");

      expect(mockRendition.annotations.highlight).toHaveBeenCalledWith(
        "cfi-0", {}, undefined, "viewer-search-hl", BASE_STYLES,
      );
      expect(mockRendition.annotations.highlight).toHaveBeenCalledWith(
        "cfi-1", {}, undefined, "viewer-search-hl", BASE_STYLES,
      );
      // First search has no prior highlights, so remove is never called.
      expect(mockRendition.annotations.remove).not.toHaveBeenCalled();
    });

    it("returns [] without loading any section for an empty/whitespace query", async () => {
      const s0 = makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "fox" }]);
      mockSpine.spineItems = [s0];

      const renderer = await initRenderer();
      const results = await renderer.search!("   ");

      expect(results).toEqual([]);
      expect(s0.load).not.toHaveBeenCalled();
      expect(s0.find).not.toHaveBeenCalled();
      expect(mockRendition.annotations.highlight).not.toHaveBeenCalled();
    });

    it("only the latest of two overlapping searches performs its highlight burst", async () => {
      // One section, find keyed by query so the two bursts are distinguishable.
      const section: FakeSection = {
        href: "ch0.xhtml",
        unload: vi.fn(),
        find: vi.fn().mockImplementation((q: string) =>
          q === "first" ? [{ cfi: "cfi-A", excerpt: "first fox" }]
                         : [{ cfi: "cfi-B", excerpt: "second fox" }],
        ),
        // Gate ONLY the first call's load so call-1 parks while call-2 finishes.
        load: vi.fn() as ReturnType<typeof vi.fn>,
      };
      let releaseFirst!: () => void;
      const gate = new Promise<void>((resolve) => { releaseFirst = resolve; });
      section.load
        .mockImplementationOnce(() => gate)
        .mockImplementation(() => Promise.resolve());
      mockSpine.spineItems = [section];
      mockBook.navigation.get.mockReturnValue({ label: "X" });

      const renderer = await initRenderer();

      const p1 = renderer.search!("first");
      const p2 = renderer.search!("second");

      // call-2 runs to completion (its load resolves immediately).
      await p2;
      expect(mockRendition.annotations.highlight).toHaveBeenCalledWith(
        "cfi-B", {}, undefined, "viewer-search-hl", BASE_STYLES,
      );

      // Release the superseded call-1; it must touch no highlight state.
      releaseFirst();
      await p1;

      const highlightCfis = mockRendition.annotations.highlight.mock.calls.map((c) => c[0]);
      expect(highlightCfis).not.toContain("cfi-A");
      const removeCfis = mockRendition.annotations.remove.mock.calls.map((c) => c[0]);
      expect(removeCfis).not.toContain("cfi-A");
    });

    it("skips a section whose load() rejects, surfaces via reportError, and returns matches from remaining sections", async () => {
      const s0 = makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "alpha fox beta" }]);
      const s1 = makeSection("ch1.xhtml", [{ cfi: "cfi-1", excerpt: "gamma fox delta" }]);
      const s2 = makeSection("ch2.xhtml", [{ cfi: "cfi-2", excerpt: "epsilon fox" }]);
      s1.load.mockRejectedValue(new Error("boom"));
      mockSpine.spineItems = [s0, s1, s2];
      mockBook.navigation.get.mockImplementation((href: string) => ({ label: `Label ${href}` }));

      const renderer = await initRenderer();
      const results = await renderer.search!("fox");

      // Every section's unload() must still be called (finally block runs
      // for each section regardless of whether a sibling fails).
      expect(s0.unload).toHaveBeenCalledTimes(1);
      expect(s1.unload).toHaveBeenCalledTimes(1);
      expect(s2.unload).toHaveBeenCalledTimes(1);
      // Results contain only s0 and s2 matches — s1 is skipped.
      expect(results.map((r) => r.location)).toEqual(["cfi-0", "cfi-2"]);
      // The specific error from the failing section was surfaced via reportError.
      expect(globalThis.reportError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "boom" }),
      );
    });

    describe("goToResult", () => {
      function driveRelocated() {
        // goToResult awaits waitForRelocated(), which resolves on the captured
        // "relocated" once-callback. Mirror the next()/prev() pattern.
        mockRendition.once.mockImplementation((_event: string, cb: () => void) => cb());
      }

      it("displays the result location and adds an active highlight", async () => {
        const renderer = await initRenderer();
        driveRelocated();

        await renderer.goToResult!({
          location: "cfi-0", label: "L", snippet: "fox", matchStart: 0, matchLength: 3,
        });

        expect(mockRendition.display).toHaveBeenCalledWith("cfi-0");
        expect(mockRendition.annotations.highlight).toHaveBeenCalledWith(
          "cfi-0", {}, undefined, "viewer-search-active", ACTIVE_STYLES,
        );
      });

      it("demotes the prior active match to base style when re-navigating", async () => {
        const renderer = await initRenderer();
        driveRelocated();

        const r0 = { location: "cfi-0", label: "L0", snippet: "fox", matchStart: 0, matchLength: 3 };
        const r1 = { location: "cfi-1", label: "L1", snippet: "fox", matchStart: 0, matchLength: 3 };

        await renderer.goToResult!(r0);
        mockRendition.annotations.highlight.mockClear();
        mockRendition.annotations.remove.mockClear();

        await renderer.goToResult!(r1);

        // Prior active cfi-0 is removed and re-added as a base highlight.
        expect(mockRendition.annotations.remove).toHaveBeenCalledWith("cfi-0", "highlight");
        expect(mockRendition.annotations.highlight).toHaveBeenCalledWith(
          "cfi-0", {}, undefined, "viewer-search-hl", BASE_STYLES,
        );
        // The new match becomes active.
        expect(mockRendition.annotations.highlight).toHaveBeenCalledWith(
          "cfi-1", {}, undefined, "viewer-search-active", ACTIVE_STYLES,
        );
      });
    });

    describe("clearSearch", () => {
      it("removes every previously added match highlight then becomes a no-op", async () => {
        mockSpine.spineItems = [
          makeSection("ch0.xhtml", [{ cfi: "cfi-0", excerpt: "fox" }]),
          makeSection("ch1.xhtml", [{ cfi: "cfi-1", excerpt: "fox" }]),
        ];
        mockBook.navigation.get.mockReturnValue({ label: "X" });

        const renderer = await initRenderer();
        await renderer.search!("fox");

        renderer.clearSearch!();
        expect(mockRendition.annotations.remove).toHaveBeenCalledWith("cfi-0", "highlight");
        expect(mockRendition.annotations.remove).toHaveBeenCalledWith("cfi-1", "highlight");

        // State reset — a second clearSearch removes nothing.
        mockRendition.annotations.remove.mockClear();
        renderer.clearSearch!();
        expect(mockRendition.annotations.remove).not.toHaveBeenCalled();
      });

      it("aborts an in-flight search so its highlights never appear after clearSearch", async () => {
        // One section whose load parks on a gate; find returns a match.
        const section: FakeSection = {
          href: "ch0.xhtml",
          unload: vi.fn(),
          find: vi.fn().mockReturnValue([{ cfi: "cfi-A", excerpt: "fox" }]),
          load: vi.fn() as ReturnType<typeof vi.fn>,
        };
        let releaseFirst!: () => void;
        const gate = new Promise<void>((resolve) => { releaseFirst = resolve; });
        section.load.mockImplementationOnce(() => gate);
        mockSpine.spineItems = [section];
        mockBook.navigation.get.mockReturnValue({ label: "X" });

        const renderer = await initRenderer();

        // Start the search — it parks on the gated section.load().
        const p = renderer.search!("fox");

        // Clear the search while parked.
        renderer.clearSearch!();

        // Release the gate so the in-flight search resumes and hits the epoch guard.
        releaseFirst();
        await p;

        // The aborted search must not have painted any highlights.
        const highlightCfis = mockRendition.annotations.highlight.mock.calls.map((c) => c[0]);
        expect(highlightCfis).not.toContain("cfi-A");
      });
    });

    describe("renderResult", () => {
      it("is exposed as a method on the renderer", async () => {
        const renderer = await initRenderer();
        expect(typeof renderer.renderResult).toBe("function");
      });

      it("is a harmless no-op: resolves without throwing and does not call rendition.display", async () => {
        const renderer = await initRenderer();

        // Record display call count before renderResult — it may already have
        // been called during init (initial display). Only new calls would matter.
        const displayCallsBefore = mockRendition.display.mock.calls.length;

        await expect(renderer.renderResult()).resolves.toBeUndefined();

        // renderResult must not trigger an additional rendition.display call.
        expect(mockRendition.display.mock.calls.length).toBe(displayCallsBefore);
      });

      it("is still a no-op when _activeCfi is armed: does not call rendition.display beyond goToResult", async () => {
        const renderer = await initRenderer();

        // Arm _activeCfi by driving a goToResult(). goToResult() awaits
        // waitForRelocated(), which resolves on the rendition.once "relocated"
        // callback — fire it synchronously by inlining the mock.
        mockRendition.once.mockImplementation((_event: string, cb: () => void) => cb());
        await renderer.goToResult!({
          location: "cfi-0", label: "L", snippet: "fox", matchStart: 0, matchLength: 3,
        });

        // Baseline includes the display("cfi-0") call made by goToResult().
        const displayCallsBefore = mockRendition.display.mock.calls.length;

        await expect(renderer.renderResult()).resolves.toBeUndefined();

        // renderResult must not trigger any additional rendition.display call.
        expect(mockRendition.display.mock.calls.length).toBe(displayCallsBefore);
      });
    });
  });
});
