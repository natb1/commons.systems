import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { useViewerController, type UseViewerControllerArgs, type UseViewerControllerResult } from "../../src/viewer/useViewerController";
import type { PositionStore } from "../../src/sidecar";
import type { ContentRenderer, SearchResult } from "../../src/viewer/types";
import { makeMockRenderer } from "./mock-renderer";

/**
 * A mock PositionStore for exercising the hook's persistence contract — the same
 * helper shell.test.ts uses; the hook talks only to this interface.
 */
function fakeStore(
  initial: string | null = null,
  overrides: Partial<PositionStore> = {},
): PositionStore & { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> } {
  return {
    load: vi.fn().mockResolvedValue(initial),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as PositionStore & { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
}

// The latest hook result, captured each render so tests read state + handlers.
let captured: UseViewerControllerResult | null = null;

function Host(props: UseViewerControllerArgs): React.ReactElement {
  const r = useViewerController(props);
  captured = r;
  return (
    <div ref={r.viewerRef as React.RefObject<HTMLDivElement>} className="viewer">
      <div className="viewer-content">
        <div ref={r.canvasWrapRef} className="viewer-canvas-wrap" />
      </div>
      <input ref={r.gotoInputRef} className="viewer-goto-input" type="number" />
      <span ref={r.gotoStatusRef} className="viewer-goto-status" role="status" aria-live="polite" />
      <button ref={r.spreadToggleRef} className="viewer-spread-toggle" aria-pressed="false" />
    </div>
  );
}

let container: HTMLElement;
let root: Root;

async function mount(args: UseViewerControllerArgs): Promise<void> {
  await act(async () => {
    root.render(<Host {...args} />);
  });
}

// Flush the async init promise chain inside act() so passive effects settle.
async function flushInit(): Promise<void> {
  await act(async () => {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  });
}

function defaultArgs(
  overrides: Partial<UseViewerControllerArgs> = {},
): UseViewerControllerArgs {
  return {
    createRenderer: () => makeMockRenderer(),
    resolveSource: () => Promise.resolve("https://example.com/doc.pdf"),
    mediaId: "m1",
    store: fakeStore(),
    uid: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  captured = null;
  localStorage.clear();
  if (typeof globalThis.reportError !== "function") {
    globalThis.reportError = () => {};
  }
  vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root.unmount());
  document.body.removeChild(container);
  vi.useRealTimers();
  vi.mocked(globalThis.reportError).mockRestore();
});

describe("useViewerController init", () => {
  it("disables prev and enables next based on canGoPrev/canGoNext", async () => {
    await mount(defaultArgs());
    await flushInit();

    expect(captured!.canGoPrev).toBe(false);
    expect(captured!.canGoNext).toBe(true);
  });

  it("loads position from the store and passes to renderer.init", async () => {
    const store = fakeStore("5");
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer, store }));
    await flushInit();

    expect(store.load).toHaveBeenCalled();
    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "https://example.com/doc.pdf",
      "5",
    );
  });

  it("no saved position: init called with undefined", async () => {
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer, store: fakeStore(null) }));
    await flushInit();

    expect(renderer.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "https://example.com/doc.pdf",
      undefined,
    );
  });

  it("still initializes renderer when store.load rejects", async () => {
    const store = fakeStore(null, { load: vi.fn().mockRejectedValue(new Error("backend down")) });
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer, store }));
    await flushInit();

    expect(renderer.init).toHaveBeenCalled();
    expect(captured!.readFailed).toBe(true);
  });

  it("store read failure suppresses the first save (no blind clobber)", async () => {
    const store = fakeStore(null, { load: vi.fn().mockRejectedValue(new Error("read error")) });
    await mount(defaultArgs({ store }));
    await flushInit();

    await act(async () => { captured!.goNext(); });
    await flushInit();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(store.save).not.toHaveBeenCalled();
  });

  it("renderer.init rejection sets loadError to 'Failed to load'", async () => {
    const renderer = makeMockRenderer();
    vi.mocked(renderer.init).mockRejectedValue(new Error("init error"));
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    expect(captured!.loadError).toBe("Failed to load");
    expect(globalThis.reportError).toHaveBeenCalled();
  });

  it("render-error callback sets loadError and disables nav", async () => {
    let capturedOnError: ((err: unknown) => void) | null = null;
    const renderer = makeMockRenderer();
    await mount(defaultArgs({
      createRenderer: (onError) => { capturedOnError = onError; return renderer; },
    }));
    await flushInit();

    expect(captured!.canGoNext).toBe(true);

    await act(async () => { capturedOnError!(new Error("render failure")); });

    expect(captured!.loadError).toBe("Render failed. Try refreshing the page.");
    expect(captured!.canGoPrev).toBe(false);
    expect(captured!.canGoNext).toBe(false);
    expect(globalThis.reportError).toHaveBeenCalled();
  });
});

describe("useViewerController persistence", () => {
  it("scheduleSave writes after navigation (debounced 500ms)", async () => {
    const store = fakeStore();
    await mount(defaultArgs({ store }));
    await flushInit();

    await act(async () => { captured!.goNext(); });
    await flushInit();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(store.save).toHaveBeenCalledWith("2");
  });

  it("scheduleSave deduplicates — same position not saved twice", async () => {
    const store = fakeStore();
    await mount(defaultArgs({ store }));
    await flushInit();

    await act(async () => { captured!.goNext(); });
    await flushInit();
    await act(async () => { await vi.runAllTimersAsync(); });
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(store.save).toHaveBeenCalledTimes(1);
  });

  it("store.save failure calls reportError and does not throw", async () => {
    const store = fakeStore(null, { save: vi.fn().mockRejectedValue(new Error("write error")) });
    await mount(defaultArgs({ store }));
    await flushInit();

    await act(async () => { captured!.goNext(); });
    await flushInit();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(globalThis.reportError).toHaveBeenCalled();
  });

  it("cleanup flushes pending save synchronously and calls renderer.destroy", async () => {
    const store = fakeStore(null);
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer, store }));
    await flushInit();

    await act(async () => { captured!.goNext(); });
    await flushInit();

    // Unmount before the 500ms timer fires — flush is synchronous.
    act(() => root.unmount());

    expect(store.save).toHaveBeenCalledWith("2");
    expect(renderer.destroy).toHaveBeenCalled();
  });
});

describe("useViewerController nav state", () => {
  it("nav updates positionLabel/canGoPrev/canGoNext", async () => {
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    expect(captured!.positionLabel).toBe("Page 1 / 10");
    expect(captured!.canGoPrev).toBe(false);
    expect(captured!.canGoNext).toBe(true);

    await act(async () => { captured!.goNext(); });
    await flushInit();

    expect(captured!.positionLabel).toBe("Page 2 / 10");
    expect(captured!.canGoPrev).toBe(true);
  });
});

describe("useViewerController go-to input", () => {
  it("page mode: gotoMode is 'page'", async () => {
    await mount(defaultArgs({ store: fakeStore(null) }));
    await flushInit();

    expect(captured!.gotoMode).toBe("page");
    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    expect(input.getAttribute("aria-label")).toBe("Go to page");
  });

  it("page mode: valid page + submitGoto navigates and updates position", async () => {
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer, store: fakeStore(null) }));
    await flushInit();

    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "5";
    await act(async () => { captured!.submitGoto(); });
    await flushInit();

    expect(renderer.goToPage).toHaveBeenCalledWith(5);
    expect(captured!.positionLabel).toBe("Page 5 / 10");
  });

  it("page mode: out-of-range page clamps to pageCount", async () => {
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer, store: fakeStore(null) }));
    await flushInit();

    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "99";
    await act(async () => { captured!.submitGoto(); });
    await flushInit();

    expect(renderer.goToPage).toHaveBeenCalledWith(10);
  });

  it("page mode: non-numeric input does not navigate", async () => {
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer, store: fakeStore(null) }));
    await flushInit();

    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "abc";
    await act(async () => { captured!.submitGoto(); });
    await flushInit();

    expect(renderer.goToPage).not.toHaveBeenCalled();
  });

  it("page mode: nav syncs the gotoInput value to current page", async () => {
    await mount(defaultArgs({ store: fakeStore(null) }));
    await flushInit();

    await act(async () => { captured!.goNext(); });
    await flushInit();

    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    expect(input.value).toBe("2");
  });

  it("percent mode: gotoMode is 'percent' and submitGoto calls goToFraction(0.5)", async () => {
    const renderer = makeMockRenderer({ goToFraction: vi.fn().mockResolvedValue(undefined) });
    await mount(defaultArgs({
      createRenderer: () => renderer,
      resolveSource: () => Promise.resolve("https://example.com/doc.epub"),
      store: fakeStore(null),
    }));
    await flushInit();

    expect(captured!.gotoMode).toBe("percent");
    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    expect(input.getAttribute("aria-label")).toBe("Go to location percent");

    input.value = "50";
    await act(async () => { captured!.submitGoto(); });
    await flushInit();

    expect(renderer.goToFraction).toHaveBeenCalledWith(0.5);
  });

  it("percent mode: Calculating cycle uses readOnly+aria-busy+aria-live and returns focus, never disabled", async () => {
    let resolveFraction!: () => void;
    const pending = new Promise<void>((resolve) => { resolveFraction = resolve; });
    const renderer = makeMockRenderer({ goToFraction: vi.fn().mockReturnValue(pending) });
    await mount(defaultArgs({
      createRenderer: () => renderer,
      resolveSource: () => Promise.resolve("https://example.com/doc.epub"),
      store: fakeStore(null),
    }));
    await flushInit();

    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    const status = container.querySelector(".viewer-goto-status") as HTMLElement; // type-safety-ok: querySelector result narrowed by test setup guarantee
    input.value = "50";
    await act(async () => { captured!.submitGoto(); });
    await flushInit();

    // While pending: readOnly + aria-busy (never disabled), with the live status.
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute("aria-busy")).toBe("true");
    expect(input.placeholder).toBe("Calculating…");
    expect(status.textContent).toBe("Calculating location…");

    await act(async () => { resolveFraction(); });
    await flushInit();

    // After settle: attributes cleared, status emptied, focus returned to input.
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(false);
    expect(input.hasAttribute("aria-busy")).toBe(false);
    expect(input.placeholder).toBe("%");
    expect(status.textContent).toBe("");
    expect(document.activeElement).toBe(input);
  });

  it("percent mode: gotoInFlight lock prevents re-entrancy", async () => {
    let resolveFraction!: () => void;
    const pending = new Promise<void>((resolve) => { resolveFraction = resolve; });
    const goToFraction = vi.fn().mockReturnValue(pending);
    const renderer = makeMockRenderer({ goToFraction });
    await mount(defaultArgs({
      createRenderer: () => renderer,
      resolveSource: () => Promise.resolve("https://example.com/doc.epub"),
      store: fakeStore(null),
    }));
    await flushInit();

    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "50";
    await act(async () => { captured!.submitGoto(); });
    await flushInit();
    // Second submit while the first is pending must be ignored.
    await act(async () => { captured!.submitGoto(); });
    await flushInit();

    expect(goToFraction).toHaveBeenCalledTimes(1);

    await act(async () => { resolveFraction(); });
    await flushInit();
  });

  it("hidden: pageCount <= 1 and no goToFraction keeps gotoMode null", async () => {
    const renderer = makeMockRenderer({
      get pageCount() { return 1; },
      get canGoNext() { return false; },
    });
    await mount(defaultArgs({ createRenderer: () => renderer, store: fakeStore(null) }));
    await flushInit();

    expect(captured!.gotoMode).toBe(null);
  });
});

describe("useViewerController spread mode", () => {
  function makeSpreadRenderer(overrides: Partial<ContentRenderer> = {}): ContentRenderer {
    return makeMockRenderer({ renderPageInto: vi.fn().mockResolvedValue(undefined), ...overrides });
  }

  it("hasSpread true for renderers with renderPageInto, false otherwise", async () => {
    await mount(defaultArgs({ createRenderer: () => makeSpreadRenderer() }));
    await flushInit();
    expect(captured!.hasSpread).toBe(true);

    act(() => root.unmount());
    root = createRoot(container);
    await mount(defaultArgs({ createRenderer: () => makeMockRenderer() }));
    await flushInit();
    expect(captured!.hasSpread).toBe(false);
  });

  it("toggleSpread enters → spread position label; next advances by spread", async () => {
    const renderer = makeSpreadRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    await act(async () => { captured!.toggleSpread(); });
    await flushInit();

    expect(captured!.spreadEnabled).toBe(true);
    expect(captured!.positionLabel).toBe("Page 1 / 10");

    await act(async () => { captured!.goNext(); });
    await flushInit();

    expect(captured!.positionLabel).toBe("Pages 2–3 / 10");
    const renderPageInto = vi.mocked(renderer.renderPageInto!);
    const lastCalls = renderPageInto.mock.calls.slice(-2);
    expect(lastCalls[0]![0]).toBe(2);
    expect(lastCalls[1]![0]).toBe(3);
  });

  it("spread preference persisted to localStorage", async () => {
    const renderer = makeSpreadRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    await act(async () => { captured!.toggleSpread(); });
    await flushInit();
    expect(localStorage.getItem("spread-mode:m1")).toBe("true");

    await act(async () => { captured!.toggleSpread(); });
    await flushInit();
    expect(localStorage.getItem("spread-mode:m1")).toBe("false");
  });

  it("entering at page 3 maps to correct spread index", async () => {
    const renderer = makeSpreadRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    await renderer.goToPage(3);
    await act(async () => { captured!.toggleSpread(); });
    await flushInit();

    expect(captured!.positionLabel).toBe("Pages 2–3 / 10");
  });

  it("zoom in spread applies CSS transform on canvasWrap", async () => {
    const renderer = makeSpreadRenderer({
      zoomIn: vi.fn(), zoomOut: vi.fn(), resetZoom: vi.fn(), isZoomed: false,
    });
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    await act(async () => { captured!.toggleSpread(); });
    await flushInit();

    const canvasWrap = container.querySelector(".viewer-canvas-wrap") as HTMLElement;
    await act(async () => { captured!.zoomIn(); });
    await flushInit();

    expect(canvasWrap.style.transform).toBe("scale(1.2)");
    expect(canvasWrap.classList.contains("zoomed")).toBe(true);

    await act(async () => { captured!.zoomIn(); });
    await flushInit();
    expect(canvasWrap.style.transform).toBe(`scale(${1.2 ** 2})`);
  });

  it("spread mode: goNext/goPrev/submitGoto-page call renderer.clearSearch", async () => {
    const renderer = makeSpreadRenderer({ clearSearch: vi.fn() });
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    await act(async () => { captured!.toggleSpread(); });
    await flushInit();

    await act(async () => { captured!.goNext(); });
    await flushInit();
    expect(renderer.clearSearch).toHaveBeenCalled();

    vi.mocked(renderer.clearSearch!).mockClear();
    await act(async () => { captured!.goPrev(); });
    await flushInit();
    expect(renderer.clearSearch).toHaveBeenCalled();

    vi.mocked(renderer.clearSearch!).mockClear();
    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    input.value = "5";
    await act(async () => { captured!.submitGoto(); });
    await flushInit();
    expect(renderer.clearSearch).toHaveBeenCalled();
  });

  it("onSearchNavigate: spread → controller.goToPage (renderPageInto), single → renderResult; never clears", async () => {
    const result: SearchResult = {
      location: "4", label: "Page 4", snippet: "the matched text", matchStart: 4, matchLength: 7,
    };
    // Single mode: renderResult, not renderPageInto.
    const single = makeMockRenderer({
      search: vi.fn().mockResolvedValue([result]),
      goToResult: vi.fn().mockResolvedValue(undefined),
      renderResult: vi.fn().mockResolvedValue(undefined),
      clearSearch: vi.fn(),
    });
    await mount(defaultArgs({ createRenderer: () => single }));
    await flushInit();

    await act(async () => { captured!.onSearchNavigate(); });
    await flushInit();
    expect(single.renderResult).toHaveBeenCalled();
    expect(single.clearSearch).not.toHaveBeenCalled();

    // Spread mode: controller.goToPage → renderPageInto, not renderResult.
    act(() => root.unmount());
    root = createRoot(container);
    const renderResult = vi.fn().mockResolvedValue(undefined);
    const spread = makeSpreadRenderer({
      search: vi.fn().mockResolvedValue([result]),
      goToResult: vi.fn().mockResolvedValue(undefined),
      renderResult,
      clearSearch: vi.fn(),
    });
    await mount(defaultArgs({ createRenderer: () => spread }));
    await flushInit();
    await act(async () => { captured!.toggleSpread(); });
    await flushInit();

    vi.mocked(spread.renderPageInto!).mockClear();
    await act(async () => { captured!.onSearchNavigate(); });
    await flushInit();

    expect(spread.renderPageInto).toHaveBeenCalled();
    expect(renderResult).not.toHaveBeenCalled();
    expect(spread.clearSearch).not.toHaveBeenCalled();
  });
});

describe("useViewerController keyboard + panel", () => {
  it("arrow keys ignored when search/goto input is the event target", async () => {
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    const gotoInput = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    const rightEvent = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
    Object.defineProperty(rightEvent, "target", { value: gotoInput });
    await act(async () => { document.dispatchEvent(rightEvent); });
    await flushInit();

    const leftEvent = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true });
    Object.defineProperty(leftEvent, "target", { value: gotoInput });
    await act(async () => { document.dispatchEvent(leftEvent); });
    await flushInit();

    expect(renderer.next).not.toHaveBeenCalled();
    expect(renderer.prev).not.toHaveBeenCalled();
  });

  it("arrow keys navigate when target is not an input", async () => {
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    const rightEvent = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
    Object.defineProperty(rightEvent, "target", { value: document.body });
    await act(async () => { document.dispatchEvent(rightEvent); });
    await flushInit();

    expect(renderer.next).toHaveBeenCalled();
  });

  it("modified arrow keys (alt/ctrl/meta/shift) are ignored so browser/OS shortcuts still fire", async () => {
    const renderer = makeMockRenderer();
    await mount(defaultArgs({ createRenderer: () => renderer }));
    await flushInit();

    for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const) {
      const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, [modifier]: true });
      Object.defineProperty(event, "target", { value: document.body });
      await act(async () => { document.dispatchEvent(event); });
      await flushInit();
    }

    expect(renderer.prev).not.toHaveBeenCalled();
  });

  it("panelCollapsed toggles", async () => {
    const reqFs = vi.fn().mockResolvedValue(undefined);
    HTMLElement.prototype.requestFullscreen = reqFs;
    await mount(defaultArgs());
    await flushInit();

    expect(captured!.panelCollapsed).toBe(false);
    await act(async () => { captured!.togglePanel(); });
    await flushInit();
    expect(captured!.panelCollapsed).toBe(true);
    expect(reqFs).toHaveBeenCalled();
  });

  it("external fullscreen exit re-expands the panel", async () => {
    HTMLElement.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
    await mount(defaultArgs());
    await flushInit();

    await act(async () => { captured!.togglePanel(); });
    await flushInit();
    expect(captured!.panelCollapsed).toBe(true);

    Object.defineProperty(document, "fullscreenElement", {
      value: null, writable: true, configurable: true,
    });
    await act(async () => { document.dispatchEvent(new Event("fullscreenchange")); });
    await flushInit();

    expect(captured!.panelCollapsed).toBe(false);
  });
});
