import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const mockListCloud = vi.fn();

// loadMediaHtml routes its cloud fetch through library.ts's listCloud(); the
// per-viewer dispatch (public vs. accessible) now lives in library.ts and is
// covered by library.test.ts. Mock the library seam here so loadMediaHtml's
// media rendering is tested without real firebase init.
vi.mock("../../src/library.js", () => ({
  listCloud: (...args: unknown[]) => mockListCloud(...args),
}));

// local-folder-ui.ts transitively imports firebase via library.ts; stub it
// so loadMediaHtml and afterRenderHome tests don't need real firebase init.
vi.mock("../../src/local-folder-ui.js", () => ({
  renderLocalIntoList: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/storage.js", () => ({
  getMediaDownloadUrl: vi.fn(),
}));

vi.mock("../../src/auth.js", () => ({
  auth: { type: "mock-auth" },
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

import { loadMediaHtml, afterRenderHome, wireDownloadActions, wireLoadMore } from "../../src/pages/home";
import { Home } from "../../src/pages/Home.js";
import { wireMarkdownActions } from "../../src/markdown-actions";
import { getMediaDownloadUrl } from "../../src/storage.js";
import { createHistoryRouter, type Router } from "@commons-systems/router";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import type { User } from "../../src/auth.js";
import type { MediaItem } from "../../src/types";
import type { MediaPage } from "@commons-systems/firestoreutil/paged-merge";

function makeMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: "item-1",
    title: "Test Book",
    mediaType: "pdf",
    tags: { genre: "fiction" },
    publicDomain: true,
    sourceNotes: "Public domain source",
    storagePath: "media/test-book.pdf",
    markdownPath: null,
    groupId: null,
    memberEmails: [],
    addedAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

function makeCloudPage(
  items: MediaItem[],
  nextCursor: string | null = null,
): MediaPage<MediaItem> {
  return { items, nextCursor };
}

describe("loadMediaHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the cloud library via listCloud", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([]));

    await loadMediaHtml();

    expect(mockListCloud).toHaveBeenCalled();
  });

  it("renders empty state when no items are returned", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([]));

    const html = await loadMediaHtml();

    expect(html).toContain('id="media-empty"');
    expect(html).toContain("No media items available.");
  });

  it("renders media list with items", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ id: "book-1", title: "First Book" }),
      makeMediaItem({ id: "book-2", title: "Second Book", mediaType: "epub" }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('id="media-list"');
    expect(html).toContain("First Book");
    expect(html).toContain("Second Book");
  });

  it("renders media-item elements with data-id attributes", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ id: "book-1" }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('class="media-item"');
    expect(html).toContain('data-id="book-1"');
  });

  it("renders a view link for each item", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ id: "book-1" }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('href="/view/book-1"');
    expect(html).toContain('class="media-view"');
  });

  it("renders a download button for each item", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ storagePath: "media/test.pdf" }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('class="media-download"');
    expect(html).toContain('data-path="media/test.pdf"');
  });

  it("renders media type badge", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ mediaType: "epub" }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('class="media-badge"');
    expect(html).toContain("epub");
  });

  it("renders error fallback when Firestore fails", async () => {
    mockListCloud.mockRejectedValue(new Error("connection failed"));

    const html = await loadMediaHtml();

    expect(html).toContain('id="media-error"');
    expect(html).toContain("Could not load media library.");
  });

  it("renders markdown buttons when markdownPath is non-null", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ markdownPath: "media/test.md" }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('class="media-md-download"');
    expect(html).toContain('class="media-md-copy"');
    expect(html).toContain('data-md-path="media/test.md"');
  });

  it("does not render markdown buttons when markdownPath is null", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem(),
    ]));

    const html = await loadMediaHtml();

    expect(html).not.toContain("media-md-download");
    expect(html).not.toContain("media-md-copy");
  });

  it("re-throws DataIntegrityError", async () => {
    mockListCloud.mockRejectedValue(
      new DataIntegrityError("corrupt data"),
    );

    await expect(loadMediaHtml()).rejects.toThrow(DataIntegrityError);
  });

  it("renders an aria-label on the view link", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([makeMediaItem({ title: "My Book" })]));

    const html = await loadMediaHtml();

    expect(html).toContain('aria-label="View My Book"');
  });

  it("renders an aria-label on the download button", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([makeMediaItem({ title: "My Book" })]));

    const html = await loadMediaHtml();

    expect(html).toContain('aria-label="Download My Book"');
  });

  it("escapes HTML special characters in item titles", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ title: "<script>xss</script>" }),
    ]));

    const html = await loadMediaHtml();

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML special characters in item IDs", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([makeMediaItem({ id: "a&b" })]));

    const html = await loadMediaHtml();

    expect(html).toContain('data-id="a&amp;b"');
  });

  it("escapes HTML special characters in storagePath", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ storagePath: 'media/"<x>.pdf' }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('data-path="media/&quot;&lt;x&gt;.pdf"');
    expect(html).not.toContain('data-path="media/"');
  });

  it("escapes HTML special characters in markdownPath", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ markdownPath: 'media/"<x>.md' }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('data-md-path="media/&quot;&lt;x&gt;.md"');
    expect(html).not.toContain('data-md-path="media/"');
  });

  it("renders items in the order returned by listCloud", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ id: "first", title: "First" }),
      makeMediaItem({ id: "second", title: "Second" }),
      makeMediaItem({ id: "third", title: "Third" }),
    ]));

    const html = await loadMediaHtml();

    expect(html.indexOf("First")).toBeLessThan(html.indexOf("Second"));
    expect(html.indexOf("Second")).toBeLessThan(html.indexOf("Third"));
  });

  it("renders aria-labels on markdown buttons", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([
      makeMediaItem({ title: "My Book", markdownPath: "media/test.md" }),
    ]));

    const html = await loadMediaHtml();

    expect(html).toContain('aria-label="Download Markdown for My Book"');
    expect(html).toContain('aria-label="Copy Markdown for My Book"');
  });

  it("omits the Load more button when nextCursor is null", async () => {
    mockListCloud.mockResolvedValue(
      makeCloudPage([makeMediaItem({ id: "book-1" })], null),
    );

    const html = await loadMediaHtml();

    expect(html).not.toContain('id="load-more-btn"');
  });

  it("renders the Load more button carrying the cursor when nextCursor is non-null", async () => {
    mockListCloud.mockResolvedValue(
      makeCloudPage([makeMediaItem({ id: "book-1" })], "cursor-1"),
    );

    const html = await loadMediaHtml();

    expect(html).toContain('id="load-more-btn"');
    expect(html).toContain('data-cursor="cursor-1"');
    // Sibling AFTER the list, not nested inside it.
    expect(html.indexOf("</ul>")).toBeLessThan(html.indexOf("load-more-btn"));
  });

  it("does not render a Load more button on the empty state", async () => {
    mockListCloud.mockResolvedValue(makeCloudPage([], null));

    const html = await loadMediaHtml();

    expect(html).toContain('id="media-empty"');
    expect(html).not.toContain('id="load-more-btn"');
  });
});

describe("wireLoadMore", () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  async function renderInto(nextCursor: string | null): Promise<void> {
    mockListCloud.mockResolvedValue(
      makeCloudPage([makeMediaItem({ id: "book-1" })], nextCursor),
    );
    container.innerHTML = await loadMediaHtml();
    wireLoadMore(container);
  }

  it("appends the next page rows to #media-list and updates the cursor when more remain", async () => {
    await renderInto("cursor-1");

    mockListCloud.mockResolvedValue(
      makeCloudPage([makeMediaItem({ id: "book-2", title: "Second" })], "cursor-2"),
    );

    const btn = container.querySelector<HTMLButtonElement>("#load-more-btn")!;
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    // Let the async handler settle.
    await vi.waitFor(() => {
      expect(container.querySelector('[data-id="book-2"]')).not.toBeNull();
    });

    expect(mockListCloud).toHaveBeenLastCalledWith({ cursor: "cursor-1" });
    const ids = Array.from(container.querySelectorAll(".media-item")).map(
      (li) => li.getAttribute("data-id"),
    );
    // Appended at the END, after the first page's row.
    expect(ids).toEqual(["book-1", "book-2"]);
    const stillThere = container.querySelector<HTMLButtonElement>("#load-more-btn")!;
    expect(stillThere.dataset.cursor).toBe("cursor-2");
    expect(stillThere.disabled).toBe(false);
  });

  it("removes the Load more button on the terminal page (nextCursor null)", async () => {
    await renderInto("cursor-1");

    mockListCloud.mockResolvedValue(
      makeCloudPage([makeMediaItem({ id: "book-2" })], null),
    );

    const btn = container.querySelector<HTMLButtonElement>("#load-more-btn")!;
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => {
      expect(container.querySelector('[data-id="book-2"]')).not.toBeNull();
    });

    expect(container.querySelector("#load-more-btn")).toBeNull();
  });

  it("re-enables the button and leaves the list intact when the fetch fails", async () => {
    await renderInto("cursor-1");

    mockListCloud.mockRejectedValue(new Error("network"));

    const btn = container.querySelector<HTMLButtonElement>("#load-more-btn")!;
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => {
      expect(btn.disabled).toBe(false);
    });

    // The first page's row is untouched; no button removed.
    expect(container.querySelectorAll(".media-item")).toHaveLength(1);
    expect(container.querySelector("#load-more-btn")).not.toBeNull();
  });
});

describe("download wiring (regression #1280)", () => {
  let router: Router | undefined;
  let outlet: HTMLElement | undefined;
  // Mirror main.tsx's router→React page lifecycle: render() stashes the home
  // state and returns an empty #page-root placeholder; afterRender mounts the
  // <Home> React root into it. The prior page root is unmounted in onNavigate
  // (before the router wipes the outlet) and again in teardown.
  let currentPageRoot: Root | null = null;
  let homeState: { mediaHtml: string; user: User | null } | null = null;

  afterEach(() => {
    currentPageRoot?.unmount();
    currentPageRoot = null;
    homeState = null;
    router?.destroy();
    router = undefined;
    if (outlet) {
      document.body.removeChild(outlet);
      outlet = undefined;
    }
  });

  it("fires exactly one download per click after N home navigations", async () => {
    vi.clearAllMocks();
    vi.mocked(getMediaDownloadUrl).mockResolvedValue("https://example.com/x.pdf");
    mockListCloud.mockResolvedValue(makeCloudPage([makeMediaItem({ storagePath: "media/x.pdf" })]));

    // Mirror main.tsx: wire the persistent outlet's click delegation ONCE,
    // before the router's first navigation.
    const el = document.createElement("div");
    outlet = el;
    document.body.appendChild(el);
    wireDownloadActions(el);
    wireMarkdownActions(el);

    router = createHistoryRouter(
      outlet,
      [
        {
          path: "/",
          render: async () => {
            homeState = { mediaHtml: await loadMediaHtml(), user: null };
            return '<div id="page-root"></div>';
          },
          afterRender: (out) => {
            const mount = out.querySelector("#page-root");
            if (!(mount instanceof HTMLElement) || !homeState) return;
            const state = homeState;
            const root = createRoot(mount);
            currentPageRoot = root;
            flushSync(() => root.render(<Home mediaHtml={state.mediaHtml} user={state.user} />));
            afterRenderHome(out);
          },
        },
      ],
      {
        onNavigate: () => {
          // Tear down the prior page root before the router wipes the outlet,
          // so each navigation leaves exactly one live React root.
          currentPageRoot?.unmount();
          currentPageRoot = null;
        },
      },
    );

    // Navigate home N times; the router reuses the one persistent outlet and
    // runs afterRender on every navigation. Pre-fix this rebound the listener
    // each time, so N navigations meant N handlers for one click.
    const N = 5;
    for (let i = 0; i < N; i++) {
      router.navigate();
      await vi.waitFor(() => {
        expect(el.querySelector(".media-download")).not.toBeNull();
      });
    }

    const button = outlet.querySelector(".media-download") as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    // Flush the microtask queue so the async handleDownload runs to its first await.
    await Promise.resolve();

    expect(vi.mocked(getMediaDownloadUrl)).toHaveBeenCalledTimes(1);
  });
});
