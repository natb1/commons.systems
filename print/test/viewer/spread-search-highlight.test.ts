import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Integration coverage for issue #1728: a search-result highlight must land on
// the spread that contains the result page (criterion 1), and a subsequent
// user-initiated spread navigation (after clearSearch) must NOT show a stale
// highlight (criterion 3). Drives the REAL SpreadController against the REAL
// pdf renderer with a mocked pdfjs-dist, mirroring pdf.test.ts.
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

// pdfjs-dist mock — same shape as pdf.test.ts. Page 2 carries "the dog ran",
// so searching "dog" yields a single result on page 2 (spread index 1: 2-3).
vi.mock("pdfjs-dist", () => {
  const PAGE_ITEMS: Record<number, { str: string }[]> = {
    1: [{ str: "the cat sat" }],
    2: [{ str: "the dog ran" }],
    3: [{ str: "a fish swims" }],
  };

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

// Import after the mock is registered.
import { createPdfRenderer } from "../../src/viewer/pdf";
import { SpreadController } from "../../src/viewer/spread-controller";

describe("spread search highlight (real SpreadController + pdf renderer)", () => {
  let canvasWrap: HTMLElement;
  let spreadToggleBtn: HTMLButtonElement;
  let rectSpy: ReturnType<typeof vi.spyOn>;
  let getContextSpy: ReturnType<typeof vi.spyOn>;
  let scrollSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resizeObserverCallbacks = [];
    vi.clearAllMocks();

    canvasWrap = document.createElement("div");
    spreadToggleBtn = document.createElement("button");

    // renderPageInto / renderPage bail when the target rect is 0×0. Stub every
    // element's rect non-zero so both the single-page container and the spread
    // sub-containers render.
    rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() { return {}; },
    } as DOMRect);

    // happy-dom returns null for getContext; pdf.ts throws on null.
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as CanvasRenderingContext2D,
    );

    // scrollIntoView is unimplemented in happy-dom; applyHighlight calls it.
    scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});

    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    rectSpy.mockRestore();
    getContextSpy.mockRestore();
    scrollSpy.mockRestore();
    vi.mocked(globalThis.reportError).mockRestore();
  });

  function makeController(renderer: ReturnType<typeof createPdfRenderer>): SpreadController {
    return new SpreadController({
      renderer,
      canvasWrap,
      spreadToggleBtn,
      storageKey: "spread-mode:test",
      onRenderError: () => {},
    });
  }

  it("criterion 1: search-result highlight lands on the spread containing the result page", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(canvasWrap, "fake://source.pdf");

    const controller = makeController(renderer);
    controller.enter(renderer.currentPage);
    await controller.render();

    // Search "dog" → single result on page 2.
    const { results } = await renderer.search!("dog");
    const page2Result = results.find((r) => r.label === "Page 2");
    expect(page2Result).toBeDefined();

    // goToResult arms pendingHighlight + sets currentPage to 2.
    await renderer.goToResult!(page2Result!);
    expect(renderer.currentPage).toBe(2);

    // The shell's onNavigate callback re-renders the spread containing the
    // current page; goToPage(2) lands on spread index 1 (pages 2-3).
    await controller.goToPage(renderer.currentPage);

    // The highlight must appear inside a spread sub-container (page 2 = left).
    const leftEl = canvasWrap.querySelector(".spread-left") as HTMLElement;
    const highlight = leftEl.querySelector(".search-highlight.active");
    expect(highlight).not.toBeNull();
    expect(highlight!.textContent).toBe("dog");
  });

  it("criterion 3: after clearSearch, manual spread navigation shows no stale highlight", async () => {
    const renderer = createPdfRenderer();
    await renderer.init(canvasWrap, "fake://source.pdf");

    const controller = makeController(renderer);
    controller.enter(renderer.currentPage);
    await controller.render();

    const { results } = await renderer.search!("dog");
    const page2Result = results.find((r) => r.label === "Page 2");
    await renderer.goToResult!(page2Result!);
    await controller.goToPage(renderer.currentPage);

    // Highlight is present on the spread.
    expect(canvasWrap.querySelector(".search-highlight.active")).not.toBeNull();

    // Mirror the shell's spread-branch navigation: clearSearch BEFORE the
    // controller navigation.
    renderer.clearSearch!();
    await controller.goPrev();

    // Spread 0 (page 1) — no highlight.
    expect(canvasWrap.querySelector(".search-highlight.active")).toBeNull();

    // Navigating forward back onto the result's spread must also be clean,
    // because clearSearch disarmed pendingHighlight.
    await controller.goNext();
    expect(canvasWrap.querySelector(".search-highlight.active")).toBeNull();
  });
});
