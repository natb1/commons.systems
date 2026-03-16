import { describe, it, expect, vi, beforeEach } from "vitest";

type RelocatedCallback = (location: { start: { index: number } }) => void;

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
  });

  describe("init", () => {
    it("creates .viewer-epub-container div and appends to container", async () => {
      const renderer = createEpubRenderer();

      await renderer.init(container, "https://example.com/book.epub");

      const epubDiv = container.querySelector(".viewer-epub-container");
      expect(epubDiv).not.toBeNull();
      expect(epubDiv?.tagName).toBe("DIV");
    });

    it("sets pageCount from spine length and currentPage to 1", async () => {
      mockSpine.length = 8;
      const renderer = createEpubRenderer();

      await renderer.init(container, "https://example.com/book.epub");

      expect(renderer.pageCount).toBe(8);
      expect(renderer.currentPage).toBe(1);
    });
  });

  describe("positionLabel", () => {
    it("returns 'Chapter X / Y'", async () => {
      mockSpine.length = 5;
      const renderer = createEpubRenderer();

      await renderer.init(container, "https://example.com/book.epub");

      expect(renderer.positionLabel).toBe("Chapter 1 / 5");
    });
  });

  describe("next", () => {
    it("calls rendition.next and updates currentPage via relocated event", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      mockRendition.once.mockImplementation((_event: string, cb: () => void) => {
        cb();
      });

      await renderer.next();

      expect(mockRendition.next).toHaveBeenCalled();
    });
  });

  describe("prev", () => {
    it("calls rendition.prev and updates currentPage via relocated event", async () => {
      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

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
    it("updates currentPage when relocated fires", async () => {
      let relocatedCb: RelocatedCallback | null = null;
      mockRendition.on.mockImplementation((event: string, cb: RelocatedCallback) => {
        if (event === "relocated") relocatedCb = cb;
      });

      const renderer = createEpubRenderer();
      await renderer.init(container, "https://example.com/book.epub");

      expect(relocatedCb).not.toBeNull();
      relocatedCb!({ start: { index: 3 } });
      expect(renderer.currentPage).toBe(4);
    });
  });
});
