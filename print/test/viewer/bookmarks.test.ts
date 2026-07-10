import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import React from "react";

// useBookmarks transitively imports src/bookmarks.ts → firebase/firestore → firebase.js.
// Stub that module so the test environment does not need a Firebase project.
vi.mock("../../src/bookmarks.js", () => ({
  getBookmarks: vi.fn().mockResolvedValue([]),
  saveBookmarks: vi.fn().mockResolvedValue(undefined),
}));

import {
  useBookmarks,
  pickBookmarksStore,
  loadLocalBookmarks,
  saveLocalBookmarks,
  type BookmarksStore,
} from "../../src/viewer/useBookmarks";
import { BookmarksPanel } from "../../src/viewer/BookmarksPanel";
import type { Bookmark } from "../../src/bookmarks";
import { makeMockRenderer } from "./mock-renderer";
import type { UseViewerControllerResult } from "../../src/viewer/useViewerController";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inMemoryStore(initial: Bookmark[] = []): {
  store: BookmarksStore;
  state: { current: Bookmark[]; saveCalls: Bookmark[][] };
} {
  const state: { current: Bookmark[]; saveCalls: Bookmark[][] } = {
    current: initial.slice(),
    saveCalls: [],
  };
  const store: BookmarksStore = {
    load: async () => state.current.slice(),
    save: async (b: Bookmark[]) => {
      state.current = b.slice();
      state.saveCalls.push(b.slice());
    },
  };
  return { store, state };
}

/**
 * Build a minimal UseViewerControllerResult that satisfies useBookmarks.
 * navSignal is a prop so re-renders can bump it to trigger memo recomputation.
 */
function makeMockController(
  overrides: Partial<UseViewerControllerResult> = {},
  navSignal = 0,
): UseViewerControllerResult {
  const renderer = makeMockRenderer();
  const result = {
    getRenderer: () => renderer,
    onPanelNavigate: vi.fn(),
    navSignal,
    // The rest are unused by useBookmarks; fill with stubs.
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
    mediaId: "media-1",
    uid: null,
    ...overrides,
  } as UseViewerControllerResult;
  // Default getPosition mirrors single-page mode by delegating to the current
  // (possibly overridden) renderer; spread-mode tests override it directly.
  if (overrides.getPosition === undefined) {
    result.getPosition = () => {
      const r = result.getRenderer();
      return r ? { position: r.position, label: r.positionLabel } : null;
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Host component: calls useBookmarks and renders toggle + panel
// ---------------------------------------------------------------------------

function HostComponent({
  controller,
  store,
}: {
  controller: UseViewerControllerResult;
  store: BookmarksStore;
}) {
  const bm = useBookmarks(controller, store);
  return React.createElement(
    "div",
    null,
    React.createElement(
      "button",
      {
        className: "viewer-bookmark-toggle",
        "aria-pressed": bm.currentBookmarked,
        disabled: bm.toggleDisabled,
        onClick: bm.toggleBookmark,
        "aria-label": "Bookmark this page",
      },
      "\u{1F516}",
    ),
    React.createElement(BookmarksPanel, { bookmarks: bm }),
  );
}

// ---------------------------------------------------------------------------
// Flush helpers
// ---------------------------------------------------------------------------

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

async function flushAct(): Promise<void> {
  await act(async () => {
    await flushMicrotasks();
  });
}

// ---------------------------------------------------------------------------
// Tests: useBookmarks + BookmarksPanel
// ---------------------------------------------------------------------------

describe("useBookmarks + BookmarksPanel", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    localStorage.clear();
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
    store: BookmarksStore,
  ): Promise<void> {
    root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(HostComponent, { controller, store }));
    });
    await flushAct();
  }

  it("empty set: no .viewer-bookmarks, toggle aria-pressed=false, toggle enabled after load", async () => {
    const { store } = inMemoryStore([]);
    const controller = makeMockController();
    await mount(controller, store);

    const section = container.querySelector(".viewer-bookmarks");
    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    expect(section).toBeNull();
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.disabled).toBe(false);
  });

  it("clicking toggle on a non-bookmarked page adds the current position", async () => {
    const { store, state } = inMemoryStore([]);
    const renderer = makeMockRenderer({
      get position() { return "4"; },
      get positionLabel() { return "Page 4 / 10"; },
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    await mount(controller, store);

    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    await act(async () => {
      toggle.click();
      await flushMicrotasks();
    });

    expect(state.saveCalls.length).toBe(1);
    expect(state.saveCalls[0]).toEqual([{ position: "4", label: "Page 4 / 10" }]);

    const section = container.querySelector(".viewer-bookmarks");
    expect(section).not.toBeNull();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    const entry = container.querySelector(".viewer-bookmark-entry") as HTMLElement;
    expect(entry.textContent).toBe("Page 4 / 10");
    expect(entry.dataset.position).toBe("4");
  });

  it("clicking toggle again removes the bookmark", async () => {
    const { store } = inMemoryStore([{ position: "4", label: "Page 4 / 10" }]);
    const renderer = makeMockRenderer({
      get position() { return "4"; },
      get positionLabel() { return "Page 4 / 10"; },
    });
    const controller = makeMockController({ getRenderer: () => renderer });
    await mount(controller, store);

    // Section should appear since we loaded with a bookmark.
    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector(".viewer-bookmarks")).not.toBeNull();

    await act(async () => {
      toggle.click();
      await flushMicrotasks();
    });

    expect(container.querySelector(".viewer-bookmarks")).toBeNull();
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking a bookmark entry navigates via goToPosition and calls onPanelNavigate", async () => {
    const goToPosition = vi.fn().mockResolvedValue(undefined);
    const onPanelNavigate = vi.fn();
    const { store } = inMemoryStore([{ position: "7", label: "Page 7 / 10" }]);
    const renderer = makeMockRenderer({ goToPosition });
    const controller = makeMockController({ getRenderer: () => renderer, onPanelNavigate });
    await mount(controller, store);

    const entry = container.querySelector(".viewer-bookmark-entry") as HTMLElement;
    await act(async () => {
      entry.click();
      await flushMicrotasks();
    });

    expect(goToPosition).toHaveBeenCalledWith("7");
    expect(onPanelNavigate).toHaveBeenCalled();
  });

  it("sync: re-render with new position + bumped navSignal flips aria-pressed", async () => {
    // Start at position "1" (not bookmarked); have "3" bookmarked.
    let pos = "1";
    const renderer = makeMockRenderer();
    Object.defineProperty(renderer, "position", { get: () => pos, configurable: true });
    const { store } = inMemoryStore([{ position: "3", label: "Page 3 / 10" }]);
    let navSignal = 0;
    const controller = makeMockController({ getRenderer: () => renderer }, navSignal);

    // Initial mount: position="1", not bookmarked.
    root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(HostComponent, { controller, store }));
    });
    await flushAct();

    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    // Move to bookmarked position "3" and bump navSignal.
    pos = "3";
    navSignal = 1;
    const controller2 = makeMockController({ getRenderer: () => renderer }, navSignal);
    await act(async () => {
      root.render(React.createElement(HostComponent, { controller: controller2, store }));
      await flushMicrotasks();
    });

    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    // Move back to non-bookmarked position "1".
    pos = "1";
    navSignal = 2;
    const controller3 = makeMockController({ getRenderer: () => renderer }, navSignal);
    await act(async () => {
      root.render(React.createElement(HostComponent, { controller: controller3, store }));
      await flushMicrotasks();
    });

    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("spread mode: toggle records the controller's live spread page, not the stale renderer page", async () => {
    const { store, state } = inMemoryStore([]);
    // The single-page renderer position is stale in spread mode (spread nav
    // never advances it); getPosition reports the live spread page instead.
    const renderer = makeMockRenderer({
      get position() { return "2"; },
      get positionLabel() { return "Page 2 / 10"; },
    });
    const controller = makeMockController({
      getRenderer: () => renderer,
      getPosition: () => ({ position: "4", label: "Pages 4–5 / 10" }),
    });
    await mount(controller, store);

    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    await act(async () => {
      toggle.click();
      await flushMicrotasks();
    });

    expect(state.saveCalls[0]).toEqual([{ position: "4", label: "Pages 4–5 / 10" }]);
    const entry = container.querySelector(".viewer-bookmark-entry") as HTMLElement;
    expect(entry.dataset.position).toBe("4");
    expect(entry.textContent).toBe("Pages 4–5 / 10");
  });

  it("spread mode: aria-pressed reflects the controller's live spread page", async () => {
    // Bookmark stored for the live spread page "4"; renderer.position is a stale "2".
    const { store } = inMemoryStore([{ position: "4", label: "Pages 4–5 / 10" }]);
    const renderer = makeMockRenderer({
      get position() { return "2"; },
      get positionLabel() { return "Page 2 / 10"; },
    });
    const controller = makeMockController({
      getRenderer: () => renderer,
      getPosition: () => ({ position: "4", label: "Pages 4–5 / 10" }),
    });
    await mount(controller, store);

    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("unmount does not throw", async () => {
    const { store } = inMemoryStore([]);
    const controller = makeMockController();
    await mount(controller, store);
    expect(() => act(() => root.unmount())).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: pickBookmarksStore local path
// ---------------------------------------------------------------------------

describe("pickBookmarksStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uid=null → local store; round-trip load/save persists to localStorage", async () => {
    const store = pickBookmarksStore(null, false, "media-abc");
    await store.save([{ position: "5", label: "Page 5" }]);
    const loaded = await store.load();
    expect(loaded).toEqual([{ position: "5", label: "Page 5" }]);
  });

  it("readFailed=true → local store even with uid present", async () => {
    const store = pickBookmarksStore("user-1", true, "media-abc");
    await store.save([{ position: "2", label: "Page 2" }]);
    const loaded = await store.load();
    expect(loaded).toEqual([{ position: "2", label: "Page 2" }]);
  });
});

// ---------------------------------------------------------------------------
// Tests: loadLocalBookmarks / saveLocalBookmarks
// ---------------------------------------------------------------------------

describe("loadLocalBookmarks / saveLocalBookmarks", () => {
  beforeEach(() => {
    localStorage.clear();
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(globalThis.reportError).mockRestore();
  });

  it("round-trip: save then load returns the same bookmarks", () => {
    const bm: Bookmark[] = [{ position: "3", label: "Chapter 3" }];
    saveLocalBookmarks("media-1", bm);
    expect(loadLocalBookmarks("media-1")).toEqual(bm);
  });

  it("returns [] for missing key", () => {
    expect(loadLocalBookmarks("no-such-media")).toEqual([]);
  });

  it("returns [] and calls reportError for malformed JSON", () => {
    localStorage.setItem("bookmarks:media-bad", "NOT_JSON{{{{");
    const result = loadLocalBookmarks("media-bad");
    expect(result).toEqual([]);
    expect(globalThis.reportError).toHaveBeenCalled();
  });

  it("returns [] for non-array JSON", () => {
    localStorage.setItem("bookmarks:media-obj", JSON.stringify({ position: "1", label: "x" }));
    expect(loadLocalBookmarks("media-obj")).toEqual([]);
  });

  it("filters out entries missing position or label", () => {
    localStorage.setItem(
      "bookmarks:media-partial",
      JSON.stringify([
        { position: "1", label: "good" },
        { position: "2" },
        { label: "no-pos" },
        42,
      ]),
    );
    expect(loadLocalBookmarks("media-partial")).toEqual([{ position: "1", label: "good" }]);
  });
});
