import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetMediaDownloadUrl = vi.fn();

vi.mock("../src/storage.js", () => ({
  getMediaDownloadUrl: (...args: unknown[]) => mockGetMediaDownloadUrl(...args),
}));

vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
}));

import { handleMarkdownDownload, handleMarkdownCopy } from "../src/markdown-actions";

describe("handleMarkdownDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an anchor element with correct href and download attribute, then clicks it", async () => {
    mockGetMediaDownloadUrl.mockResolvedValue("https://storage.example.com/media/test.md");

    const appendedChildren: Node[] = [];
    const removedChildren: Node[] = [];
    let clicked = false;

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === "a") {
        vi.spyOn(el, "click").mockImplementation(() => { clicked = true; });
      }
      return el;
    });
    vi.spyOn(document.body, "appendChild").mockImplementation((node: Node) => {
      appendedChildren.push(node);
      return node;
    });
    vi.spyOn(document.body, "removeChild").mockImplementation((node: Node) => {
      removedChildren.push(node);
      return node;
    });

    await handleMarkdownDownload("media/test.md", "Test Title");

    expect(mockGetMediaDownloadUrl).toHaveBeenCalledWith("media/test.md");
    expect(appendedChildren).toHaveLength(1);
    const anchor = appendedChildren[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("test-title.md");
    expect(anchor.href).toContain("https://storage.example.com/media/test.md");
    expect(anchor.style.display).toBe("none");
    expect(clicked).toBe(true);
    expect(removedChildren).toHaveLength(1);
    expect(removedChildren[0]).toBe(anchor);

    vi.restoreAllMocks();
  });
});

describe("handleMarkdownCopy", () => {
  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches markdown content and copies it to clipboard", async () => {
    mockGetMediaDownloadUrl.mockResolvedValue("https://storage.example.com/media/test.md");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("# Hello World", { status: 200 }),
    );

    const button = document.createElement("button");
    button.textContent = "Copy";
    const container = document.createElement("div");
    container.className = "media-actions";
    container.appendChild(button);

    await handleMarkdownCopy("media/test.md", button);

    expect(mockGetMediaDownloadUrl).toHaveBeenCalledWith("media/test.md");
    expect(mockWriteText).toHaveBeenCalledWith("# Hello World");
    expect(button.textContent).toBe("Copied!");
    expect(button.disabled).toBe(false);
  });

  it("appends error message on fetch failure", async () => {
    mockGetMediaDownloadUrl.mockResolvedValue("https://storage.example.com/media/test.md");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500 }),
    );

    const button = document.createElement("button");
    button.textContent = "Copy";
    const container = document.createElement("div");
    container.className = "media-actions";
    container.appendChild(button);

    await handleMarkdownCopy("media/test.md", button);

    const errorEl = container.querySelector(".copy-error");
    expect(errorEl).not.toBeNull();
    expect(errorEl!.textContent).toBe("Copy failed. Please try again.");
    expect(button.disabled).toBe(false);
  });

  it("does not add duplicate error messages", async () => {
    mockGetMediaDownloadUrl.mockResolvedValue("https://storage.example.com/media/test.md");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500 }),
    );

    const button = document.createElement("button");
    button.textContent = "Copy";
    const container = document.createElement("div");
    container.className = "viewer-md-actions";
    container.appendChild(button);

    await handleMarkdownCopy("media/test.md", button);

    // Re-mock fetch since Response body is consumed
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response("", { status: 500 }),
    );
    await handleMarkdownCopy("media/test.md", button);

    const errors = container.querySelectorAll(".copy-error");
    expect(errors).toHaveLength(1);
  });

  it("re-enables button after clipboard write failure", async () => {
    mockGetMediaDownloadUrl.mockResolvedValue("https://storage.example.com/media/test.md");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("# content", { status: 200 }),
    );
    mockWriteText.mockRejectedValue(new Error("clipboard denied"));

    const button = document.createElement("button");
    button.textContent = "Copy";
    const container = document.createElement("div");
    container.className = "media-actions";
    container.appendChild(button);

    await handleMarkdownCopy("media/test.md", button);

    expect(button.disabled).toBe(false);
  });
});
