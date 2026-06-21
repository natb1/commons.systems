import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { act } from "react";
import { createElement } from "react";
import { OutlinePanel } from "../../src/viewer/OutlinePanel";
import type { UseViewerControllerResult } from "../../src/viewer/useViewerController";
import type { ContentRenderer, OutlineEntry } from "../../src/viewer/types";
import { makeMockRenderer } from "./mock-renderer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(title: string, children: OutlineEntry[] = []): OutlineEntry {
  return { title, children };
}

function makeOutlineRenderer(overrides: Partial<ContentRenderer> = {}): ContentRenderer {
  return makeMockRenderer({
    getOutline: vi.fn().mockResolvedValue([]),
    goToOutlineEntry: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

function makeMockController(overrides: Partial<UseViewerControllerResult> = {}): UseViewerControllerResult {
  const renderer = makeOutlineRenderer();
  return {
    getRenderer: () => renderer,
    onPanelNavigate: vi.fn(),
    navSignal: 1,
    // --- unused fields required by the type ---
    canvasWrapRef: { current: null } as React.RefObject<HTMLDivElement>,
    gotoInputRef: { current: null } as React.RefObject<HTMLInputElement>,
    gotoStatusRef: { current: null } as React.RefObject<HTMLSpanElement>, // type-safety-ok: test mock-ref fixture; matches the same as-cast pattern used by all sibling ref fields in this object
    spreadToggleRef: { current: null } as React.RefObject<HTMLButtonElement>,
    viewerRef: { current: null } as React.RefObject<HTMLElement>,
    positionLabel: "Page 1 / 10",
    canGoPrev: false,
    canGoNext: true,
    zoomOutDisabled: true,
    zoomResetDisabled: true,
    spreadEnabled: false,
    gotoMode: null,
    searchable: false,
    hasZoom: false,
    hasSpread: false,
    panelCollapsed: false,
    orientation: "landscape",
    loadError: null,
    goPrev: vi.fn(),
    goNext: vi.fn(),
    goToPage: vi.fn(),
    submitGoto: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    zoomReset: vi.fn(),
    toggleSpread: vi.fn(),
    togglePanel: vi.fn(),
    onSearchNavigate: vi.fn(),
    readFailed: false,
    mediaId: "item-1",
    uid: null,
    ...overrides,
  } as unknown as UseViewerControllerResult;
}

async function flushInit(): Promise<void> {
  await act(async () => {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("OutlinePanel", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
    vi.mocked(globalThis.reportError).mockRestore();
  });

  function render(controller: UseViewerControllerResult): void {
    root = createRoot(container);
    flushSync(() => {
      root.render(createElement(OutlinePanel, { controller }));
    });
  }

  // -------------------------------------------------------------------------
  // Capability gating
  // -------------------------------------------------------------------------

  it("renders nothing when renderer lacks getOutline", async () => {
    const renderer = makeMockRenderer();
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();
    expect(container.querySelector(".viewer-outline")).toBeNull();
  });

  it("renders nothing when renderer has getOutline but lacks goToOutlineEntry", async () => {
    const renderer = makeMockRenderer({
      getOutline: vi.fn().mockResolvedValue([makeEntry("Chapter 1")]),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();
    expect(container.querySelector(".viewer-outline")).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Empty / non-empty outline
  // -------------------------------------------------------------------------

  it("renders nothing when entries empty", async () => {
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([]),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();
    expect(container.querySelector(".viewer-outline")).toBeNull();
  });

  it("renders .viewer-outline when entries present", async () => {
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([makeEntry("Chapter 1")]),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();
    const outline = container.querySelector(".viewer-outline");
    expect(outline).not.toBeNull();
    expect(outline!.classList.contains("outline-hidden")).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Flat entries
  // -------------------------------------------------------------------------

  it("renders flat TOC entries as list items with correct titles", async () => {
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([makeEntry("Introduction"), makeEntry("Conclusion")]),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();

    const items = container.querySelectorAll(".viewer-outline-item");
    expect(items.length).toBe(2);

    const anchors = container.querySelectorAll(".viewer-outline-entry");
    expect((anchors[0] as HTMLElement).textContent).toBe("Introduction");
    expect((anchors[1] as HTMLElement).textContent).toBe("Conclusion");
  });

  // -------------------------------------------------------------------------
  // Nested entries with toggle
  // -------------------------------------------------------------------------

  it("renders nested TOC entries with toggle button (collapsed by default, correct child count)", async () => {
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([
        makeEntry("Part 1", [makeEntry("Chapter 1"), makeEntry("Chapter 2")]),
      ]),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();

    const topItem = container.querySelector(".viewer-outline-item") as HTMLElement;
    const toggle = topItem.querySelector(".viewer-outline-toggle") as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    // Default: collapsed (▶)
    expect(toggle.textContent).toBe("▶");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    const children = topItem.querySelector(".viewer-outline-children") as HTMLElement;
    expect(children).not.toBeNull();
    expect(children.classList.contains("outline-collapsed")).toBe(true);
    const childItems = children.querySelectorAll(":scope > .viewer-outline-item");
    expect(childItems.length).toBe(2);
  });

  // -------------------------------------------------------------------------
  // Entry click
  // -------------------------------------------------------------------------

  it("click on entry calls goToOutlineEntry with the correct entry and then onPanelNavigate", async () => {
    const entry1 = makeEntry("Chapter 1");
    const entry2 = makeEntry("Chapter 2");
    const goToOutlineEntry = vi.fn().mockResolvedValue(undefined);
    const onPanelNavigate = vi.fn();
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([entry1, entry2]),
      goToOutlineEntry,
    });
    const controller = makeMockController({
      getRenderer: () => renderer,
      onPanelNavigate,
    });
    render(controller);
    await flushInit();

    const anchors = container.querySelectorAll(".viewer-outline-entry");
    await act(async () => {
      (anchors[1] as HTMLElement).click();
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });

    expect(goToOutlineEntry).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Chapter 2" }),
    );
    expect(onPanelNavigate).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Toggle expand / collapse
  // -------------------------------------------------------------------------

  it("click toggle expands children (loses outline-collapsed, button shows ▼)", async () => {
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([
        makeEntry("Part 1", [makeEntry("Chapter 1")]),
      ]),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();

    const toggle = container.querySelector(".viewer-outline-toggle") as HTMLButtonElement;
    const children = container.querySelector(".viewer-outline-children") as HTMLElement;

    // Initially collapsed
    expect(children.classList.contains("outline-collapsed")).toBe(true);
    expect(toggle.textContent).toBe("▶");

    await act(async () => {
      toggle.click();
    });

    expect(children.classList.contains("outline-collapsed")).toBe(false);
    expect(toggle.textContent).toBe("▼");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Collapse");
  });

  it("click toggle again collapses children (regains outline-collapsed, button shows ▶)", async () => {
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([
        makeEntry("Part 1", [makeEntry("Chapter 1")]),
      ]),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();

    const toggle = container.querySelector(".viewer-outline-toggle") as HTMLButtonElement;
    const children = container.querySelector(".viewer-outline-children") as HTMLElement;

    // Expand
    await act(async () => { toggle.click(); });
    expect(children.classList.contains("outline-collapsed")).toBe(false);
    expect(toggle.textContent).toBe("▼");

    // Collapse again
    await act(async () => { toggle.click(); });
    expect(children.classList.contains("outline-collapsed")).toBe(true);
    expect(toggle.textContent).toBe("▶");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("Expand");
  });

  // -------------------------------------------------------------------------
  // Unmount safety + destroyed guard
  // -------------------------------------------------------------------------

  it("unmount does not throw", async () => {
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([makeEntry("Chapter 1")]),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);
    await flushInit();

    await expect(
      act(async () => { root.unmount(); }),
    ).resolves.not.toThrow();
  });

  it("late getOutline resolve after unmount does not trigger setState warning (destroyed guard)", async () => {
    let resolveOutline!: (entries: OutlineEntry[]) => void;
    const pendingPromise = new Promise<OutlineEntry[]>((resolve) => {
      resolveOutline = resolve;
    });
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockReturnValue(pendingPromise),
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    render(controller);

    // Unmount before the outline promise resolves
    await act(async () => { root.unmount(); });

    // Now resolve — should not warn about setState on unmounted component
    await act(async () => {
      resolveOutline([makeEntry("Chapter 1")]);
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });

    // No assertion needed — if destroyedRef guard works, vitest logs no
    // "Warning: Can't perform a React state update on an unmounted component"
    expect(globalThis.reportError).not.toHaveBeenCalled();
  });
});
