import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  renderBookmarksToggle,
  renderBookmarksSection,
  initBookmarks,
  type BookmarksStore,
} from "../../src/viewer/bookmarks";
import type { Bookmark } from "../../src/bookmarks";
import { makeMockRenderer } from "./mock-renderer";

function createContainer(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = renderBookmarksToggle() + renderBookmarksSection();
  return el;
}

async function flushInit(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

describe("renderBookmarksToggle", () => {
  it("renders a toggle button, aria-pressed=false, disabled", () => {
    const html = renderBookmarksToggle();
    expect(html).toContain('class="viewer-bookmark-toggle"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("disabled");
  });
});

describe("renderBookmarksSection", () => {
  it("renders the section hidden with a list", () => {
    const html = renderBookmarksSection();
    expect(html).toContain('class="viewer-bookmarks bookmarks-hidden"');
    expect(html).toContain('class="viewer-bookmarks-list"');
    expect(html).toContain("Bookmarks");
  });
});

describe("initBookmarks", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = createContainer();
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(globalThis.reportError).mockRestore();
  });

  function inMemoryStore(initial: Bookmark[] = []) {
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

  it("empty set: section hidden, toggle aria-pressed=false, toggle enabled after init", async () => {
    const { store } = inMemoryStore([]);
    const renderer = makeMockRenderer();
    initBookmarks(container, renderer, store, vi.fn());
    await flushInit();

    const section = container.querySelector(".viewer-bookmarks") as HTMLElement;
    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    expect(section.classList.contains("bookmarks-hidden")).toBe(true);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.disabled).toBe(false);
  });

  it("clicking toggle on a non-bookmarked page adds the current position", async () => {
    const { store, state } = inMemoryStore([]);
    const renderer = makeMockRenderer({
      get position() { return "4"; },
      get positionLabel() { return "Page 4 / 10"; },
    });
    initBookmarks(container, renderer, store, vi.fn());
    await flushInit();

    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    toggle.click();
    await flushInit();

    expect(state.saveCalls.length).toBe(1);
    expect(state.saveCalls[0]).toEqual([{ position: "4", label: "Page 4 / 10" }]);

    const section = container.querySelector(".viewer-bookmarks") as HTMLElement;
    expect(section.classList.contains("bookmarks-hidden")).toBe(false);
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
    initBookmarks(container, renderer, store, vi.fn());
    await flushInit();

    const section = container.querySelector(".viewer-bookmarks") as HTMLElement;
    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    // Loaded with the current position bookmarked
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(section.classList.contains("bookmarks-hidden")).toBe(false);

    toggle.click();
    await flushInit();

    expect(section.classList.contains("bookmarks-hidden")).toBe(true);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking a bookmark entry navigates via goToPosition and calls onNavigate", async () => {
    const goToPosition = vi.fn().mockResolvedValue(undefined);
    const onNavigate = vi.fn();
    const { store } = inMemoryStore([{ position: "7", label: "Page 7 / 10" }]);
    const renderer = makeMockRenderer({ goToPosition });
    initBookmarks(container, renderer, store, onNavigate);
    await flushInit();

    const entry = container.querySelector(".viewer-bookmark-entry") as HTMLElement;
    entry.click();

    expect(goToPosition).toHaveBeenCalledWith("7");

    await flushInit();
    expect(onNavigate).toHaveBeenCalled();
  });

  it("sync() sets aria-pressed based on whether renderer.position is bookmarked", async () => {
    const { store } = inMemoryStore([{ position: "3", label: "Page 3 / 10" }]);
    let pos = "3";
    const renderer = makeMockRenderer();
    // Spread copies a getter's value, so override position imperatively to track `pos`.
    Object.defineProperty(renderer, "position", { get: () => pos, configurable: true });
    const handle = initBookmarks(container, renderer, store, vi.fn());
    await flushInit();

    const toggle = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    // Move to a non-bookmarked position and resync
    pos = "5";
    handle.sync();
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    // Back to a bookmarked position
    pos = "3";
    handle.sync();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("cleanup removes listeners", async () => {
    const goToPosition = vi.fn().mockResolvedValue(undefined);
    const { store } = inMemoryStore([{ position: "2", label: "Page 2 / 10" }]);
    const renderer = makeMockRenderer({ goToPosition });
    const handle = initBookmarks(container, renderer, store, vi.fn());
    await flushInit();

    handle.cleanup();

    const entry = container.querySelector(".viewer-bookmark-entry") as HTMLElement;
    entry.click();
    await flushInit();

    expect(goToPosition).not.toHaveBeenCalled();
  });
});
