import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderOutlineSection, initOutline } from "../../src/viewer/outline";
import type { ContentRenderer, OutlineEntry } from "../../src/viewer/types";
import { makeMockRenderer } from "./mock-renderer";

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

function createContainer(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = renderOutlineSection();
  return el;
}

async function flushInit(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

describe("renderOutlineSection", () => {
  it("contains .viewer-outline with outline-hidden class", () => {
    const html = renderOutlineSection();
    expect(html).toContain('class="viewer-outline outline-hidden"');
  });

  it("contains .viewer-outline-list with role='tree'", () => {
    const html = renderOutlineSection();
    expect(html).toContain('class="viewer-outline-list"');
    expect(html).toContain('role="tree"');
  });
});

describe("initOutline", () => {
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

  it("returns null when renderer lacks getOutline", () => {
    const renderer = makeMockRenderer();
    const result = initOutline(container, renderer, vi.fn());
    expect(result).toBeNull();
  });

  it("returns null when renderer has getOutline but lacks goToOutlineEntry", () => {
    const renderer = makeMockRenderer({
      getOutline: vi.fn().mockResolvedValue([]),
    });
    const result = initOutline(container, renderer, vi.fn());
    expect(result).toBeNull();
  });

  it("stays hidden when outline is empty", async () => {
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([]),
    });
    initOutline(container, renderer, vi.fn());
    await flushInit();

    const section = container.querySelector(".viewer-outline") as HTMLElement;
    expect(section.classList.contains("outline-hidden")).toBe(true);
  });

  it("removes outline-hidden when outline has entries", async () => {
    const entries = [makeEntry("Chapter 1"), makeEntry("Chapter 2")];
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue(entries),
    });
    initOutline(container, renderer, vi.fn());
    await flushInit();

    const section = container.querySelector(".viewer-outline") as HTMLElement;
    expect(section.classList.contains("outline-hidden")).toBe(false);
  });

  it("renders flat TOC entries as list items with correct titles", async () => {
    const entries = [makeEntry("Introduction"), makeEntry("Conclusion")];
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue(entries),
    });
    initOutline(container, renderer, vi.fn());
    await flushInit();

    const list = container.querySelector(".viewer-outline-list") as HTMLUListElement;
    const items = list.querySelectorAll(":scope > .viewer-outline-item");
    expect(items.length).toBe(2);

    const firstAnchor = items[0]!.querySelector(".viewer-outline-entry") as HTMLElement;
    const secondAnchor = items[1]!.querySelector(".viewer-outline-entry") as HTMLElement;
    expect(firstAnchor.textContent).toBe("Introduction");
    expect(secondAnchor.textContent).toBe("Conclusion");
  });

  it("renders nested TOC entries with toggle buttons", async () => {
    const entries = [
      makeEntry("Part 1", [makeEntry("Chapter 1"), makeEntry("Chapter 2")]),
    ];
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue(entries),
    });
    initOutline(container, renderer, vi.fn());
    await flushInit();

    const list = container.querySelector(".viewer-outline-list") as HTMLUListElement;
    const topItem = list.querySelector(".viewer-outline-item") as HTMLElement;
    const toggle = topItem.querySelector(".viewer-outline-toggle") as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    expect(toggle.textContent).toBe("\u25b6");

    const children = topItem.querySelector(".viewer-outline-children") as HTMLElement;
    expect(children).not.toBeNull();
    const childItems = children.querySelectorAll(":scope > .viewer-outline-item");
    expect(childItems.length).toBe(2);
  });

  it("click on entry calls goToOutlineEntry with correct entry and then onNavigate", async () => {
    const entry1 = makeEntry("Chapter 1");
    const entry2 = makeEntry("Chapter 2");
    const goToOutlineEntry = vi.fn().mockResolvedValue(undefined);
    const onNavigate = vi.fn();
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue([entry1, entry2]),
      goToOutlineEntry,
    });
    initOutline(container, renderer, onNavigate);
    await flushInit();

    const list = container.querySelector(".viewer-outline-list") as HTMLUListElement;
    const secondEntry = list.querySelectorAll(".viewer-outline-entry")[1] as HTMLElement;
    secondEntry.click();

    // goToOutlineEntry called with the matching entry
    expect(goToOutlineEntry).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Chapter 2" }),
    );

    // onNavigate called in the .then() -- flush microtasks
    await flushInit();
    expect(onNavigate).toHaveBeenCalled();
  });

  it("click on toggle expands nested list", async () => {
    const entries = [
      makeEntry("Part 1", [makeEntry("Chapter 1")]),
    ];
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue(entries),
    });
    initOutline(container, renderer, vi.fn());
    await flushInit();

    const toggle = container.querySelector(".viewer-outline-toggle") as HTMLButtonElement;
    const children = container.querySelector(".viewer-outline-children") as HTMLElement;

    // Initially collapsed
    expect(children.classList.contains("outline-collapsed")).toBe(true);
    expect(toggle.textContent).toBe("\u25b6");

    // Click to expand
    toggle.click();

    expect(children.classList.contains("outline-collapsed")).toBe(false);
    expect(toggle.textContent).toBe("\u25bc");
  });

  it("click toggle again collapses nested list", async () => {
    const entries = [
      makeEntry("Part 1", [makeEntry("Chapter 1")]),
    ];
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue(entries),
    });
    initOutline(container, renderer, vi.fn());
    await flushInit();

    const toggle = container.querySelector(".viewer-outline-toggle") as HTMLButtonElement;
    const children = container.querySelector(".viewer-outline-children") as HTMLElement;

    // Expand
    toggle.click();
    expect(children.classList.contains("outline-collapsed")).toBe(false);
    expect(toggle.textContent).toBe("\u25bc");

    // Collapse again
    toggle.click();
    expect(children.classList.contains("outline-collapsed")).toBe(true);
    expect(toggle.textContent).toBe("\u25b6");
  });

  it("cleanup function removes event listeners", async () => {
    const goToOutlineEntry = vi.fn().mockResolvedValue(undefined);
    const entries = [makeEntry("Chapter 1")];
    const renderer = makeOutlineRenderer({
      getOutline: vi.fn().mockResolvedValue(entries),
      goToOutlineEntry,
    });
    const cleanup = initOutline(container, renderer, vi.fn())!;
    await flushInit();

    cleanup();

    // Click after cleanup should not call goToOutlineEntry
    const entry = container.querySelector(".viewer-outline-entry") as HTMLElement;
    entry.click();
    await flushInit();

    expect(goToOutlineEntry).not.toHaveBeenCalled();
  });
});
