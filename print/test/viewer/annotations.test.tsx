import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import React from "react";

import {
  useAnnotations,
  type UseAnnotationsResult,
} from "../../src/viewer/useAnnotations";
import { AnnotationsPanel } from "../../src/viewer/AnnotationsPanel";
import { AnnotationCapture } from "../../src/viewer/AnnotationCapture";
import type { Annotation, AnnotationsStore } from "../../src/annotations";
import type { SelectionAnchor } from "../../src/viewer/types";
import { makeMockRenderer } from "./mock-renderer";
import type { UseViewerControllerResult } from "../../src/viewer/useViewerController";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inMemoryStore(initial: Annotation[] = []): {
  store: AnnotationsStore;
  state: { current: Annotation[]; saveCalls: Annotation[][] };
} {
  const state = { current: initial.slice(), saveCalls: [] as Annotation[][] }; // type-safety-ok: idiomatic test mock/DOM-fixture access
  const store: AnnotationsStore = {
    load: async () => state.current.slice(),
    save: async (a: Annotation[]) => {
      state.current = a.slice();
      state.saveCalls.push(a.slice());
    },
  };
  return { store, state };
}

const ANCHOR: SelectionAnchor = {
  position: "4",
  quote: "the selected text",
  page: 4,
  offset: 12,
  length: 17,
};

function makeMockController(
  overrides: Partial<UseViewerControllerResult> = {},
  navSignal = 1,
): UseViewerControllerResult {
  const renderer = makeMockRenderer();
  return {
    getRenderer: () => renderer,
    onPanelNavigate: vi.fn(),
    navSignal,
    canvasWrapRef: { current: null } as React.RefObject<HTMLDivElement>, // type-safety-ok: idiomatic test mock/DOM-fixture access
    gotoInputRef: { current: null } as React.RefObject<HTMLInputElement>, // type-safety-ok: idiomatic test mock/DOM-fixture access
    gotoStatusRef: { current: null } as React.RefObject<HTMLSpanElement>, // type-safety-ok: idiomatic test mock/DOM-fixture access
    spreadToggleRef: { current: null } as React.RefObject<HTMLButtonElement>, // type-safety-ok: idiomatic test mock/DOM-fixture access
    viewerRef: { current: null } as React.RefObject<HTMLElement>, // type-safety-ok: idiomatic test mock/DOM-fixture access
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
    mediaId: "media-1",
    uid: null,
    ...overrides,
  } as UseViewerControllerResult; // type-safety-ok: idiomatic test mock/DOM-fixture access
}

// Host component: exposes the hook result to the test and renders the two
// presentational pieces (capture control + panel).
let latest: UseAnnotationsResult | null = null;
function HostComponent({
  controller,
  store,
}: {
  controller: UseViewerControllerResult;
  store: AnnotationsStore;
}) {
  const a = useAnnotations(controller, store);
  latest = a;
  return React.createElement(
    "div",
    null,
    React.createElement(AnnotationCapture, { annotations: a }),
    React.createElement(AnnotationsPanel, { annotations: a }),
  );
}

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}
async function flushAct(): Promise<void> {
  await act(async () => {
    await flushMicrotasks();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAnnotations + AnnotationsPanel + AnnotationCapture", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    localStorage.clear();
    latest = null;
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    vi.mocked(globalThis.reportError).mockRestore();
  });

  async function mount(
    controller: UseViewerControllerResult,
    store: AnnotationsStore,
  ): Promise<void> {
    root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(HostComponent, { controller, store }));
    });
    await flushAct();
  }

  it("empty set: no panel, no capture control", async () => {
    const { store } = inMemoryStore([]);
    await mount(makeMockController(), store);
    expect(container.querySelector(".viewer-annotations")).toBeNull();
    expect(container.querySelector(".viewer-annotation-capture")).toBeNull();
  });

  it("loads existing annotations and pushes them into the renderer", async () => {
    const existing: Annotation = {
      id: "x1",
      position: "2",
      quote: "hello",
      note: "a note",
      created: "2026-07-06T00:00:00Z",
      page: 2,
      offset: 0,
      length: 5,
    };
    const setAnnotations = vi.fn();
    const renderer = makeMockRenderer({ setAnnotations }); // type-safety-ok: idiomatic test mock/DOM-fixture access
    const controller = makeMockController({ getRenderer: () => renderer });
    const { store } = inMemoryStore([existing]);
    await mount(controller, store);

    // Panel shows the loaded annotation.
    const entry = container.querySelector(".viewer-annotation-entry") as HTMLElement; // type-safety-ok: idiomatic test mock/DOM-fixture access
    expect(entry.dataset.position).toBe("2");
    expect(container.querySelector(".viewer-annotation-quote")?.textContent).toBe("hello");
    expect(container.querySelector(".viewer-annotation-note")?.textContent).toBe("a note");
    // Renderer received the list.
    expect(setAnnotations).toHaveBeenCalledWith([existing]);
  });

  it("a text selection surfaces the capture control", async () => {
    const renderer = makeMockRenderer({
      getSelectionAnchor: () => ANCHOR,
    }); // type-safety-ok: idiomatic test mock/DOM-fixture access
    const controller = makeMockController({ getRenderer: () => renderer });
    const { store } = inMemoryStore([]);
    await mount(controller, store);

    expect(container.querySelector(".viewer-annotation-capture")).toBeNull();
    await act(async () => {
      document.dispatchEvent(new Event("selectionchange"));
      await flushMicrotasks();
    });
    expect(container.querySelector(".viewer-annotation-capture")).not.toBeNull();
    expect(container.querySelector(".viewer-annotation-highlight-btn")).not.toBeNull();
    expect(container.querySelector(".viewer-annotation-note-btn")).not.toBeNull();
  });

  it("Highlight adds a bare annotation, persists it, and pushes to the renderer", async () => {
    const setAnnotations = vi.fn();
    const renderer = makeMockRenderer({
      getSelectionAnchor: () => ANCHOR,
      setAnnotations,
    }); // type-safety-ok: idiomatic test mock/DOM-fixture access
    const controller = makeMockController({ getRenderer: () => renderer });
    const { store, state } = inMemoryStore([]);
    await mount(controller, store);

    await act(async () => {
      document.dispatchEvent(new Event("selectionchange"));
      await flushMicrotasks();
    });
    const btn = container.querySelector(".viewer-annotation-highlight-btn") as HTMLButtonElement; // type-safety-ok: idiomatic test mock/DOM-fixture access
    await act(async () => {
      btn.click();
      await flushMicrotasks();
    });

    expect(state.saveCalls.length).toBe(1);
    const saved = state.saveCalls[0];
    expect(saved.length).toBe(1);
    expect(saved[0]).toMatchObject({
      position: "4",
      quote: "the selected text",
      note: "",
      page: 4,
      offset: 12,
      length: 17,
    });
    expect(typeof saved[0].id).toBe("string");
    expect(typeof saved[0].created).toBe("string");
    // Control dismissed; annotation now in the panel; renderer received the list.
    expect(container.querySelector(".viewer-annotation-capture")).toBeNull();
    expect(container.querySelector(".viewer-annotation-quote")?.textContent).toBe("the selected text");
    expect(setAnnotations).toHaveBeenLastCalledWith(saved);
  });

  it("Note opens an input and saves an annotation carrying the note text", async () => {
    const renderer = makeMockRenderer({
      getSelectionAnchor: () => ANCHOR,
    }); // type-safety-ok: idiomatic test mock/DOM-fixture access
    const controller = makeMockController({ getRenderer: () => renderer });
    const { store, state } = inMemoryStore([]);
    await mount(controller, store);

    await act(async () => {
      document.dispatchEvent(new Event("selectionchange"));
      await flushMicrotasks();
    });
    const noteBtn = container.querySelector(".viewer-annotation-note-btn") as HTMLButtonElement; // type-safety-ok: idiomatic test mock/DOM-fixture access
    await act(async () => {
      noteBtn.click();
      await flushMicrotasks();
    });
    const input = container.querySelector(".viewer-annotation-note-input") as HTMLInputElement; // type-safety-ok: idiomatic test mock/DOM-fixture access
    expect(input).not.toBeNull();
    // Uncontrolled input: the value is read from the DOM node at save time.
    input.value = "my thought";
    const saveBtn = container.querySelector(".viewer-annotation-note-save") as HTMLButtonElement; // type-safety-ok: idiomatic test mock/DOM-fixture access
    await act(async () => {
      saveBtn.click();
      await flushMicrotasks();
    });

    expect(state.saveCalls.length).toBe(1);
    expect(state.saveCalls[0][0]).toMatchObject({ note: "my thought", quote: "the selected text" });
    expect(container.querySelector(".viewer-annotation-note")?.textContent).toBe("my thought");
  });

  it("delete removes an annotation and persists the shorter list", async () => {
    const existing: Annotation = {
      id: "x1",
      position: "2",
      quote: "hello",
      note: "",
      created: "2026-07-06T00:00:00Z",
    };
    const controller = makeMockController();
    const { store, state } = inMemoryStore([existing]);
    await mount(controller, store);

    const del = container.querySelector(".viewer-annotation-delete") as HTMLButtonElement; // type-safety-ok: idiomatic test mock/DOM-fixture access
    await act(async () => {
      del.click();
      await flushMicrotasks();
    });
    expect(state.saveCalls.length).toBe(1);
    expect(state.saveCalls[0]).toEqual([]);
    expect(container.querySelector(".viewer-annotations")).toBeNull();
  });

  it("clicking an entry navigates via goToPosition and calls onPanelNavigate", async () => {
    const existing: Annotation = {
      id: "x1",
      position: "7",
      quote: "hello",
      note: "",
      created: "2026-07-06T00:00:00Z",
    };
    const goToPosition = vi.fn().mockResolvedValue(undefined);
    const onPanelNavigate = vi.fn();
    const renderer = makeMockRenderer({ goToPosition });
    const controller = makeMockController({ getRenderer: () => renderer, onPanelNavigate });
    const { store } = inMemoryStore([existing]);
    await mount(controller, store);

    const entry = container.querySelector(".viewer-annotation-entry") as HTMLElement; // type-safety-ok: idiomatic test mock/DOM-fixture access
    await act(async () => {
      entry.click();
      await flushMicrotasks();
    });
    expect(goToPosition).toHaveBeenCalledWith("7");
    expect(onPanelNavigate).toHaveBeenCalledTimes(1);
  });
});
