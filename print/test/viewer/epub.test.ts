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

const mockRendition = {
  on: vi.fn(),
  once: vi.fn(),
  display: vi.fn().mockResolvedValue(undefined),
  next: vi.fn().mockResolvedValue(undefined),
  prev: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
};

const mockSpine = {
  length: 5,
  get: vi.fn().mockImplementation((index: number) => ({ href: `chapter-${index}.xhtml` })),
};

const mockBook = {
  ready: Promise.resolve(),
  loaded: { spine: Promise.resolve() },
  renderTo: vi.fn().mockReturnValue(mockRendition),
  spine: mockSpine,
  destroy: vi.fn(),
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
    mockSpine.length = 5;
    mockSpine.get.mockImplementation((index: number) => ({ href: `chapter-${index}.xhtml` }));
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

  describe("onError", () => {
    it("registers onError on rendition displayError event", async () => {
      const errorHandler = vi.fn();
      const renderer = createEpubRenderer(errorHandler);
      await renderer.init(container, "https://example.com/book.epub");

      const displayErrorCall = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "displayError",
      );
      expect(displayErrorCall).toBeDefined();
      expect(displayErrorCall![1]).toBe(errorHandler);
    });

    it("does not register displayError when onError is not provided", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      const displayErrorCall = mockRendition.on.mock.calls.find(
        (c: unknown[]) => c[0] === "displayError",
      );
      expect(displayErrorCall).toBeUndefined();
    });
  });
});
