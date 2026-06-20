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

import { loadMediaHtml, afterRenderHome, wireDownloadActions } from "../../src/pages/home";
import { Home } from "../../src/pages/Home.js";
import { wireMarkdownActions } from "../../src/markdown-actions";
import { getMediaDownloadUrl } from "../../src/storage.js";
import { createHistoryRouter, type Router } from "@commons-systems/router";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import type { User } from "../../src/auth.js";
import type { MediaItem } from "../../src/types";

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

describe("loadMediaHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the cloud library via listCloud", async () => {
    mockListCloud.mockResolvedValue([]);

    await loadMediaHtml();

    expect(mockListCloud).toHaveBeenCalled();
  });

  it("renders empty state when no items are returned", async () => {
    mockListCloud.mockResolvedValue([]);

    const html = await loadMediaHtml();

    expect(html).toContain('id="media-empty"');
    expect(html).toContain("No media items available.");
  });

  it("renders media list with items", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ id: "book-1", title: "First Book" }),
      makeMediaItem({ id: "book-2", title: "Second Book", mediaType: "epub" }),
    ]);

    const html = await loadMediaHtml();

    expect(html).toContain('id="media-list"');
    expect(html).toContain("First Book");
    expect(html).toContain("Second Book");
  });

  it("renders media-item elements with data-id attributes", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ id: "book-1" }),
    ]);

    const html = await loadMediaHtml();

    expect(html).toContain('class="media-item"');
    expect(html).toContain('data-id="book-1"');
  });

  it("renders a view link for each item", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ id: "book-1" }),
    ]);

    const html = await loadMediaHtml();

    expect(html).toContain('href="/view/book-1"');
    expect(html).toContain('class="media-view"');
  });

  it("renders a download button for each item", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ storagePath: "media/test.pdf" }),
    ]);

    const html = await loadMediaHtml();

    expect(html).toContain('class="media-download"');
    expect(html).toContain('data-path="media/test.pdf"');
  });

  it("renders media type badge", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem({ mediaType: "epub" }),
    ]);

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
    mockListCloud.mockResolvedValue([
      makeMediaItem({ markdownPath: "media/test.md" }),
    ]);

    const html = await loadMediaHtml();

    expect(html).toContain('class="media-md-download"');
    expect(html).toContain('class="media-md-copy"');
    expect(html).toContain('data-md-path="media/test.md"');
  });

  it("does not render markdown buttons when markdownPath is null", async () => {
    mockListCloud.mockResolvedValue([
      makeMediaItem(),
    ]);

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
    mockListCloud.mockResolvedValue([makeMediaItem({ storagePath: "media/x.pdf" })]);

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
