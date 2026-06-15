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

// Factory for mock spine sections. Each section has load/find/unload methods plus href.
// Individual tests can override find for specific indices by re-calling mockSpine.get.mockImplementation.
function makeMockSection(index: number, findResults: Array<{ cfi: string; excerpt: string }> = []) {
  return {
    href: `chapter-${index}.xhtml`,
    load: vi.fn().mockResolvedValue(undefined),
    find: vi.fn().mockReturnValue(findResults),
    unload: vi.fn(),
  };
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
};

const mockSpine = {
  length: 5,
  get: vi.fn().mockImplementation((index: number) => makeMockSection(index)),
};

const mockBook = {
  ready: Promise.resolve(),
  loaded: { spine: Promise.resolve(), navigation: Promise.resolve() },
  renderTo: vi.fn().mockReturnValue(mockRendition),
  spine: mockSpine,
  destroy: vi.fn(),
  load: vi.fn(),
  navigation: {
    get: vi.fn().mockImplementation((href: string) => {
      // Return a NavItem label for chapter-0.xhtml; undefined for others
      if (href === "chapter-0.xhtml") return { label: "Custom Chapter" };
      return undefined;
    }),
  },
  locations: {
    generate: vi.fn().mockResolvedValue([]),
    cfiFromPercentage: vi.fn().mockReturnValue("epubcfi(/6/4!/4/2)"),
  },
};

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
    mockSpine.get.mockImplementation((index: number) => makeMockSection(index));
    mockBook.load.mockReset();
    mockBook.loaded.navigation = Promise.resolve();
    mockBook.navigation.get.mockImplementation((href: string) => {
      if (href === "chapter-0.xhtml") return { label: "Custom Chapter" };
      return undefined;
    });
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
      vi.advanceTimersByTime(5000);
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
    it("returns results spanning multiple spine sections", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Sections 0 and 2 return matches; others return none
      mockSpine.get.mockImplementation((index: number) => {
        if (index === 0) {
          return makeMockSection(index, [{ cfi: "epubcfi(/6/2!/4/1)", excerpt: "the quick fox" }]);
        }
        if (index === 2) {
          return makeMockSection(index, [{ cfi: "epubcfi(/6/6!/4/1)", excerpt: "a quick search" }]);
        }
        return makeMockSection(index, []);
      });

      const results = await renderer.search!("quick");

      const locations = results.map((r) => r.location);
      expect(locations).toContain("epubcfi(/6/2!/4/1)");
      expect(locations).toContain("epubcfi(/6/6!/4/1)");
      expect(results.length).toBe(2);
    });

    it("every result satisfies the SearchResult invariant", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockSpine.get.mockImplementation((index: number) => {
        return makeMockSection(index, [
          { cfi: `epubcfi(/6/${index * 2 + 2}!/4/1)`, excerpt: "the quick brown fox" },
        ]);
      });

      const results = await renderer.search!("quick");

      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.matchStart).toBeGreaterThanOrEqual(0);
        expect(r.matchLength).toBeGreaterThan(0);
        expect(r.matchStart + r.matchLength).toBeLessThanOrEqual(r.snippet.length);
      }
    });

    it("matchStart equals indexOf(query) in the excerpt", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Only section 0 returns a match; excerpt has "quick" at position 4
      mockSpine.get.mockImplementation((index: number) => {
        if (index === 0) {
          return makeMockSection(index, [{ cfi: "epubcfi(/6/2!/4/1)", excerpt: "the quick fox" }]);
        }
        return makeMockSection(index, []);
      });

      const results = await renderer.search!("quick");

      expect(results.length).toBe(1);
      expect(results[0].matchStart).toBe(4);
      expect(results[0].matchLength).toBe(5);
      expect(results[0].snippet).toBe("the quick fox");
    });

    it("skips find hits whose excerpt does not contain the query", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Section 0: one hit whose excerpt lacks the query, one valid hit
      mockSpine.get.mockImplementation((index: number) => {
        if (index === 0) {
          return makeMockSection(index, [
            { cfi: "epubcfi(/6/2!/4/1)", excerpt: "irrelevant text here" }, // no "quick"
            { cfi: "epubcfi(/6/2!/4/2)", excerpt: "a quick result" },        // contains "quick"
          ]);
        }
        return makeMockSection(index, []);
      });

      const results = await renderer.search!("quick");

      // Only the second hit should be included
      expect(results.length).toBe(1);
      expect(results[0].location).toBe("epubcfi(/6/2!/4/2)");
    });

    it("caps results at MAX_RESULTS (100)", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Section 0 returns 150 matches, all containing the query
      const manyMatches = Array.from({ length: 150 }, (_, i) => ({
        cfi: `epubcfi(/6/2!/4/${i + 1})`,
        excerpt: "the quick fox",
      }));
      mockSpine.get.mockImplementation((index: number) => {
        if (index === 0) return makeMockSection(index, manyMatches);
        return makeMockSection(index, []);
      });

      const results = await renderer.search!("quick");

      expect(results.length).toBe(100);
    });

    it("returns [] for empty query and never calls section.load", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const sections: ReturnType<typeof makeMockSection>[] = [];
      mockSpine.get.mockImplementation((index: number) => {
        const sec = makeMockSection(index, []);
        sections[index] = sec;
        return sec;
      });

      const results = await renderer.search!("");

      expect(results).toEqual([]);
      // load should never have been called on any section
      for (const sec of sections) {
        expect(sec.load).not.toHaveBeenCalled();
      }
    });

    it("returns [] for whitespace-only query and never calls section.load", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const sections: ReturnType<typeof makeMockSection>[] = [];
      mockSpine.get.mockImplementation((index: number) => {
        const sec = makeMockSection(index, []);
        sections[index] = sec;
        return sec;
      });

      const results = await renderer.search!("   ");

      expect(results).toEqual([]);
      for (const sec of sections) {
        expect(sec.load).not.toHaveBeenCalled();
      }
    });

    it("calls load, find, and unload on each section, with no unload leak", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const sections: ReturnType<typeof makeMockSection>[] = [];
      mockSpine.get.mockImplementation((index: number) => {
        const sec = makeMockSection(index, [{ cfi: `epubcfi(/6/${index * 2 + 2}!/4/1)`, excerpt: "a quick test" }]);
        sections[index] = sec;
        return sec;
      });

      await renderer.search!("quick");

      let totalLoads = 0;
      let totalUnloads = 0;
      for (const sec of sections) {
        expect(sec.load).toHaveBeenCalledTimes(1);
        expect(sec.find).toHaveBeenCalledTimes(1);
        expect(sec.unload).toHaveBeenCalledTimes(1);
        totalLoads += sec.load.mock.calls.length;
        totalUnloads += sec.unload.mock.calls.length;
      }
      expect(totalLoads).toBe(totalUnloads);
    });

    it("clearSearch aborts an in-flight search", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Control when the first section's load resolves
      let resolveFirstLoad!: () => void;
      const firstLoadPromise = new Promise<undefined>((res) => {
        resolveFirstLoad = () => res(undefined);
      });

      mockSpine.get.mockImplementation((index: number) => {
        const sec = makeMockSection(index, [{ cfi: `epubcfi(/6/${index * 2 + 2}!/4/1)`, excerpt: "a quick test" }]);
        if (index === 0) {
          sec.load.mockReturnValue(firstLoadPromise);
        }
        return sec;
      });

      // Start search but don't await it yet
      const searchPromise = renderer.search!("quick");

      // Abort by calling clearSearch before the first load resolves
      renderer.clearSearch!();

      // Now let the first load resolve
      resolveFirstLoad();

      // The search should return [] due to cancellation
      const results = await searchPromise;
      expect(results).toEqual([]);
    });

    it("uses TOC label for sections with navigation entry, Ch. N fallback otherwise", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // chapter-0.xhtml -> "Custom Chapter" (from mockBook.navigation.get)
      // chapter-1.xhtml -> undefined -> "Ch. 2" fallback
      mockSpine.get.mockImplementation((index: number) => {
        if (index === 0) {
          return makeMockSection(index, [{ cfi: "epubcfi(/6/2!/4/1)", excerpt: "a quick match" }]);
        }
        if (index === 1) {
          return makeMockSection(index, [{ cfi: "epubcfi(/6/4!/4/1)", excerpt: "another quick match" }]);
        }
        return makeMockSection(index, []);
      });

      const results = await renderer.search!("quick");

      expect(results.length).toBe(2);
      const ch0Result = results.find((r) => r.location === "epubcfi(/6/2!/4/1)");
      const ch1Result = results.find((r) => r.location === "epubcfi(/6/4!/4/1)");
      expect(ch0Result?.label).toBe("Custom Chapter");
      expect(ch1Result?.label).toBe("Ch. 2");
    });
  });

  describe("goToResult", () => {
    it("calls rendition.display with the result location", async () => {
      mockRendition.once.mockImplementation((_event: string, cb: () => void) => { cb(); });

      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.display.mockClear();

      await renderer.goToResult!({
        location: "epubcfi(/6/4!/4/10)",
        label: "Ch. 1",
        snippet: "x",
        matchStart: 0,
        matchLength: 1,
      });

      expect(mockRendition.display).toHaveBeenCalledWith("epubcfi(/6/4!/4/10)");
    });

    it("updates position after goToResult via the relocated event", async () => {
      let relocatedCb: RelocatedCallback | null = null;
      mockRendition.on.mockImplementation((event: string, cb: RelocatedCallback) => {
        if (event === "relocated") relocatedCb = cb;
      });

      mockRendition.once.mockImplementation((_event: string, cb: () => void) => {
        // Fire the relocated callback with a known CFI before resolving
        if (relocatedCb) relocatedCb(makeLocation(0, 1, 5, false, false, "epubcfi(/6/4!/4/10)"));
        cb();
      });

      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      await renderer.goToResult!({
        location: "epubcfi(/6/4!/4/10)",
        label: "Ch. 1",
        snippet: "x",
        matchStart: 0,
        matchLength: 1,
      });

      expect(renderer.position).toBe("epubcfi(/6/4!/4/10)");
    });

    it("aborts an in-flight search before navigating", async () => {
      mockRendition.once.mockImplementation((_event: string, cb: () => void) => { cb(); });

      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      // Control when the first section's load resolves so the search stays in flight.
      let resolveFirstLoad!: () => void;
      const firstLoadPromise = new Promise<undefined>((res) => {
        resolveFirstLoad = () => res(undefined);
      });
      mockSpine.get.mockImplementation((index: number) => {
        const sec = makeMockSection(index, [{ cfi: `epubcfi(/6/${index * 2 + 2}!/4/1)`, excerpt: "a quick test" }]);
        if (index === 0) sec.load.mockReturnValue(firstLoadPromise);
        return sec;
      });

      // Start a search but don't await it; it is paused on the first section's load.
      const searchPromise = renderer.search!("quick");

      // Navigating to a result must abort the in-flight search (bumps the generation)
      // so no concurrent section.load() can consume the relocated listener.
      await renderer.goToResult!({
        location: "epubcfi(/6/4!/4/10)",
        label: "Ch. 1",
        snippet: "x",
        matchStart: 0,
        matchLength: 1,
      });

      // Let the stranded search resume; it must observe the bumped generation and bail.
      resolveFirstLoad();
      const results = await searchPromise;
      expect(results).toEqual([]);
    });
  });
});
