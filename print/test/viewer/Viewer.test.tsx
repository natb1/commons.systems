import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

// <Viewer> pulls in view.ts-adjacent module graph only via types; but the auth
// and bookmarks modules need Firebase env at load. Stub them defensively in case
// a transitive import reaches them.
vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("../../src/bookmarks.js", () => ({
  getBookmarks: vi.fn().mockResolvedValue([]),
  saveBookmarks: vi.fn().mockResolvedValue(undefined),
}));

import { Viewer } from "../../src/viewer/Viewer";
import type { PositionStore } from "../../src/sidecar";
import type { MediaItem } from "../../src/types";
import type { ContentRenderer } from "../../src/viewer/types";
import { makeMockRenderer } from "./mock-renderer";

function fakeStore(
  initial: string | null = null,
  overrides: Partial<PositionStore> = {},
): PositionStore {
  return {
    load: vi.fn().mockResolvedValue(initial),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: "item-1",
    title: "Test Book",
    mediaType: "pdf",
    tags: { genre: "fiction", author: "Test Author" },
    publicDomain: true,
    sourceNotes: "Sourced from archive.org",
    storagePath: "media/test-book.pdf",
    markdownPath: null,
    groupId: null,
    memberEmails: ["user@example.com"],
    addedAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

describe("Viewer", () => {
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
    renderer: ContentRenderer,
    item: MediaItem = makeMediaItem(),
    store: PositionStore = fakeStore(),
  ): Promise<void> {
    root = createRoot(container);
    await act(async () => {
      root.render(
        <Viewer
          item={item}
          createRenderer={() => renderer}
          resolveSource={() => Promise.resolve("https://example.com/doc.pdf")}
          store={store}
          uid={null}
        />,
      );
    });
  }

  // The controller hook's init runs in a microtask chain (store.load ->
  // resolveSource -> renderer.init -> syncNav). Drain it inside act() so the
  // React state updates from those async callbacks commit to the DOM.
  async function flushInit(): Promise<void> {
    await act(async () => {
      for (let i = 0; i < 20; i++) {
        await Promise.resolve();
      }
    });
  }

  // Click inside act() so the resulting hook-state updates flush to the DOM.
  async function clickAct(el: HTMLElement): Promise<void> {
    await act(async () => {
      el.click();
      for (let i = 0; i < 20; i++) {
        await Promise.resolve();
      }
    });
  }

  it("mount-survival: an imperatively injected canvas-wrap child survives a chrome re-render", async () => {
    const renderer = makeMockRenderer();
    await mount(renderer);
    await flushInit();

    const canvasWrap = container.querySelector(".viewer-canvas-wrap") as HTMLElement;
    // Engine-owned: inject a child node directly into the DOM, outside React.
    const injected = document.createElement("canvas");
    injected.id = "engine-canvas";
    canvasWrap.appendChild(injected);

    // Trigger a chrome re-render: clicking next changes hook state (position, nav).
    const nextBtn = container.querySelector(".viewer-next") as HTMLButtonElement;
    await clickAct(nextBtn);

    // The injected child must still be present — React did not reconcile the
    // canvas-wrap subtree away.
    expect(container.querySelector(".viewer-canvas-wrap #engine-canvas")).not.toBeNull();
  });

  it("toolbar nav: prev disabled + next enabled at page 1; clicking next advances", async () => {
    const renderer = makeMockRenderer();
    await mount(renderer);
    await flushInit();

    const prevBtn = container.querySelector(".viewer-prev") as HTMLButtonElement;
    const nextBtn = container.querySelector(".viewer-next") as HTMLButtonElement;
    const position = container.querySelector(".viewer-position") as HTMLElement;

    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);
    expect(position.textContent).toBe("Page 1 / 10");

    await clickAct(nextBtn);

    expect(renderer.next).toHaveBeenCalled();
    expect(position.textContent).toBe("Page 2 / 10");
    expect(prevBtn.disabled).toBe(false);
  });

  it("goto: page mode visible with 'Go to page' aria-label; Enter navigates", async () => {
    const renderer = makeMockRenderer();
    await mount(renderer);
    await flushInit();

    const input = container.querySelector(".viewer-goto-input") as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.classList.contains("goto-hidden")).toBe(false);
    expect(input.getAttribute("aria-label")).toBe("Go to page");

    input.value = "5";
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });

    expect(renderer.goToPage).toHaveBeenCalledWith(5);
    const position = container.querySelector(".viewer-position") as HTMLElement;
    expect(position.textContent).toBe("Page 5 / 10");
  });

  it("zoom gating: zoom-in is hidden without zoomIn, shown with it", async () => {
    const plain = makeMockRenderer();
    await mount(plain);
    await flushInit();
    let zoomIn = container.querySelector(".viewer-zoom-in") as HTMLElement;
    expect(zoomIn.classList.contains("zoom-hidden")).toBe(true);

    act(() => root.unmount());

    const zoomable = makeMockRenderer({
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      resetZoom: vi.fn(),
      isZoomed: false,
    });
    await mount(zoomable);
    await flushInit();
    zoomIn = container.querySelector(".viewer-zoom-in") as HTMLElement;
    expect(zoomIn.classList.contains("zoom-hidden")).toBe(false);
  });

  it("spread: toggle always mounted; spread-hidden gated on renderPageInto; click flips aria-pressed", async () => {
    const plain = makeMockRenderer();
    await mount(plain);
    await flushInit();
    let spreadBtn = container.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    // Always mounted, even without spread support.
    expect(spreadBtn).not.toBeNull();
    expect(spreadBtn.classList.contains("spread-hidden")).toBe(true);

    act(() => root.unmount());

    const spreadRenderer = makeMockRenderer({
      renderPageInto: vi.fn().mockResolvedValue(undefined),
    });
    await mount(spreadRenderer);
    await flushInit();
    spreadBtn = container.querySelector(".viewer-spread-toggle") as HTMLButtonElement;
    expect(spreadBtn.classList.contains("spread-hidden")).toBe(false);
    expect(spreadBtn.getAttribute("aria-pressed")).toBe("false");

    await clickAct(spreadBtn);

    expect(spreadBtn.getAttribute("aria-pressed")).toBe("true");
  });
});
