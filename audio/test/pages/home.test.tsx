import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { LibraryItem } from "../../src/types";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

// React 18 act() environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockListLibrary = vi.fn();
const mockEnrichLocalTracks = vi.fn();
const mockListLocalTracks = vi.fn();
const mockGetPlaylists = vi.fn();
const mockSavePlaylist = vi.fn();

vi.mock("../../src/library.js", () => ({
  // Normalize the legacy array-shaped mock returns into a MediaPage so tests that
  // don't care about pagination can keep resolving plain arrays, while tests that
  // exercise nextCursor return an explicit { items, nextCursor } page.
  listLibrary: async (...args: unknown[]) => {
    const result = await mockListLibrary(...args);
    return Array.isArray(result) ? { items: result, nextCursor: null } : result;
  },
}));

vi.mock("../../src/local-source.js", () => ({
  enrichLocalTracks: (...args: unknown[]) => mockEnrichLocalTracks(...args),
  listLocalTracks: (...args: unknown[]) => mockListLocalTracks(...args),
}));

vi.mock("../../src/sidecar.js", () => ({
  getPlaylists: (...args: unknown[]) => mockGetPlaylists(...args),
  savePlaylist: (...args: unknown[]) => mockSavePlaylist(...args),
}));

// Home.tsx → player.js → storage.js → firebase.js (config requires env);
// mock storage.js to keep the component render unit isolated from Firebase config.
vi.mock("../../src/storage.js", () => ({
  resolveAudioSource: vi.fn(),
}));

const mockGetCacheStats = vi.fn();
const mockClearCache = vi.fn();

vi.mock("../../src/audio-cache.js", () => ({
  getCacheStats: (...args: unknown[]) => mockGetCacheStats(...args),
  clearCache: (...args: unknown[]) => mockClearCache(...args),
  CACHE_UPDATED_EVENT: "audio-cache-updated",
}));

const mockLogError = vi.fn();

vi.mock("@commons-systems/errorutil/log", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

import { Home } from "../../src/pages/Home";
import { RouteErrorBoundary } from "../../src/components/RouteErrorBoundary";
import type { PlayerHandle } from "../../src/player";

function makeLibraryItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    id: "item-1",
    title: "Test Title",
    artist: "Test Artist",
    album: "Test Album",
    trackNumber: 3,
    genre: "Classical",
    year: 2024,
    duration: 245,
    format: "mp3",
    publicDomain: true,
    sourceNotes: "Public domain recording",
    storagePath: "media/item-1.mp3",
    groupId: null,
    memberEmails: ["user@example.com"],
    addedAt: "2026-01-01T00:00:00Z",
    origin: "cloud",
    ...overrides,
  };
}

function makeLocalItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return makeLibraryItem({
    id: "local:song.mp3",
    title: "song",
    artist: "Unknown artist",
    album: "Unknown album",
    sourceNotes: "Local file",
    storagePath: "",
    origin: "local",
    localName: "song.mp3",
    ...overrides,
  });
}

function makeMockPlayer(): PlayerHandle & {
  add: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  isQueued: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  getLocalQueueNames: ReturnType<typeof vi.fn>;
  loadPlaylist: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
} {
  return {
    add: vi.fn(),
    remove: vi.fn(),
    isQueued: vi.fn().mockReturnValue(false),
    restore: vi.fn(),
    getLocalQueueNames: vi.fn().mockReturnValue([]),
    loadPlaylist: vi.fn(),
    destroy: vi.fn(),
  };
}

async function render(
  node: React.ReactElement,
): Promise<{ container: HTMLElement; root: Root }> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return { container, root };
}

async function cleanup(container: HTMLElement, root: Root): Promise<void> {
  await act(async () => {
    root.unmount();
  });
  container.remove();
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListLibrary.mockResolvedValue([]);
    mockEnrichLocalTracks.mockResolvedValue(undefined);
    mockListLocalTracks.mockResolvedValue([]);
    mockGetPlaylists.mockResolvedValue({});
    mockSavePlaylist.mockResolvedValue(undefined);
    mockGetCacheStats.mockResolvedValue({ trackCount: 0, totalBytes: 0 });
    mockClearCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Ensure no lingering DOM nodes
    document.body.innerHTML = "";
    // Remove any window.prompt / window.alert stubs (happy-dom leaves them
    // undefined, so they must be stubbed, not spied).
    vi.unstubAllGlobals();
  });

  it("calls listLibrary with null and shows public-notice when signed out", async () => {
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    expect(mockListLibrary).toHaveBeenCalledWith(null, undefined);
    expect(container.querySelector("#public-notice")).not.toBeNull();
    expect(container.querySelector("#public-notice")!.textContent).toContain(
      "Sign in to see your full library",
    );
    expect(container.querySelector("h2")!.textContent).toBe("Library");

    await cleanup(container, root);
  });

  it("calls listLibrary with the user and hides public-notice when signed in", async () => {
    const user = { uid: "u1", email: "alice@example.com" };
    const { container, root } = await render(
      <Home user={user} player={null} refreshKey={0} />,
    );

    expect(mockListLibrary).toHaveBeenCalledWith(user, undefined);
    expect(container.querySelector("#public-notice")).toBeNull();

    await cleanup(container, root);
  });

  it("shows #media-empty for empty list", async () => {
    mockListLibrary.mockResolvedValue([]);
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    const empty = container.querySelector("#media-empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No audio items available.");

    await cleanup(container, root);
  });

  it("renders media list with items including data attributes", async () => {
    mockListLibrary.mockResolvedValue([
      makeLibraryItem({ id: "a1", title: "Song A", artist: "Artist A", album: "Album A" }),
      makeLibraryItem({ id: "a2", title: "Song B", artist: "Artist B", album: "Album B" }),
    ]);
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    expect(container.querySelector("#media-list")).not.toBeNull();

    const row1 = container.querySelector('[data-id="a1"]')!;
    const row2 = container.querySelector('[data-id="a2"]')!;
    expect(row1).not.toBeNull();
    expect(row2).not.toBeNull();

    expect(row1.getAttribute("data-title")).toBe("Song A");
    expect(row1.getAttribute("data-artist")).toBe("Artist A");
    expect(row1.getAttribute("data-album")).toBe("Album A");
    expect(row1.getAttribute("data-origin")).toBe("cloud");
    expect(row1.getAttribute("data-storage-path")).toBe("media/item-1.mp3");

    // title/artist/album text present in the DOM
    expect(row1.querySelector(".title")!.textContent).toBe("Song A");
    expect(row1.querySelector(".artist")!.textContent).toBe("Artist A");
    expect(row1.querySelector(".album")!.textContent).toBe("Album A");

    await cleanup(container, root);
  });

  it("tags cloud rows with origin=cloud and data-storage-path", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "c1" })]);
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    const row = container.querySelector('[data-id="c1"]')!;
    expect(row.getAttribute("data-origin")).toBe("cloud");
    expect(row.getAttribute("data-storage-path")).toBe("media/item-1.mp3");

    await cleanup(container, root);
  });

  it("tags local rows with origin=local and data-local-name", async () => {
    mockListLibrary.mockResolvedValue([makeLocalItem()]);
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    const row = container.querySelector('[data-id="local:song.mp3"]')!;
    expect(row.getAttribute("data-origin")).toBe("local");
    expect(row.getAttribute("data-local-name")).toBe("song.mp3");

    await cleanup(container, root);
  });

  it("renders checkbox (.queue-checkbox) with aria-label in each row", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem()]);
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    // DS Checkbox renders: <label class="cs-checkbox queue-checkbox"><input data-queue-toggle .../></label>
    expect(container.querySelector(".queue-checkbox")).not.toBeNull();
    const input = container.querySelector<HTMLInputElement>(
      "input[data-queue-toggle]",
    )!;
    expect(input).not.toBeNull();
    expect(input.getAttribute("aria-label")).toBe("Add Test Title to queue");

    await cleanup(container, root);
  });

  it("renders expanded details with genre, year, duration, format, source", async () => {
    mockListLibrary.mockResolvedValue([
      makeLibraryItem({
        genre: "Jazz",
        year: 1959,
        duration: 90,
        format: "flac",
        sourceNotes: "Vinyl rip",
      }),
    ]);
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    const details = container.querySelector(".expand-details")!;
    expect(details.textContent).toContain("Jazz");
    expect(details.textContent).toContain("1959");
    expect(details.textContent).toContain("1:30");
    expect(details.textContent).toContain("flac");
    expect(details.textContent).toContain("Vinyl rip");

    await cleanup(container, root);
  });

  it("shows #media-error and calls logError when listLibrary rejects", async () => {
    mockListLibrary.mockRejectedValue(new Error("network failure"));
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    expect(container.querySelector("#media-error")).not.toBeNull();
    expect(container.querySelector("#media-error")!.textContent).toBe(
      "Could not load audio library.",
    );
    expect(mockLogError).toHaveBeenCalledWith(expect.any(Error), {
      operation: "load-media",
    });

    await cleanup(container, root);
  });

  it("shows boundary fallback and skips logError on DataIntegrityError", async () => {
    mockListLibrary.mockRejectedValue(new DataIntegrityError("corrupt data"));
    const { container, root } = await render(
      <RouteErrorBoundary>
        <Home user={null} player={null} refreshKey={0} />
      </RouteErrorBoundary>,
    );

    expect(container.textContent).toContain(
      "A data error occurred. Please contact support.",
    );
    expect(mockLogError).not.toHaveBeenCalled();

    await cleanup(container, root);
  });

  describe("interactive: checkbox queue toggle", () => {
    it("calls player.add with exact cloud PlayRequest on checkbox check", async () => {
      mockListLibrary.mockResolvedValue([
        makeLibraryItem({ id: "x1", title: "Track", artist: "Art", album: "Alb" }),
      ]);
      const player = makeMockPlayer();
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!;
      await act(async () => {
        input.click();
      });

      expect(player.add).toHaveBeenCalledWith({
        id: "x1",
        title: "Track",
        artist: "Art",
        album: "Alb",
        origin: "cloud",
        storagePath: "media/item-1.mp3",
      });
      // no localName key
      expect(player.add.mock.calls[0][0]).not.toHaveProperty("localName");

      await cleanup(container, root);
    });

    it("calls player.add with exact local PlayRequest on checkbox check", async () => {
      mockListLibrary.mockResolvedValue([
        makeLocalItem({ id: "local:song.mp3", title: "song", artist: "Unknown artist", album: "Unknown album" }),
      ]);
      const player = makeMockPlayer();
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!;
      await act(async () => {
        input.click();
      });

      expect(player.add).toHaveBeenCalledWith({
        id: "local:song.mp3",
        title: "song",
        artist: "Unknown artist",
        album: "Unknown album",
        origin: "local",
        localName: "song.mp3",
      });
      // no storagePath key
      expect(player.add.mock.calls[0][0]).not.toHaveProperty("storagePath");

      await cleanup(container, root);
    });

    it("calls player.remove when checkbox is unchecked (already queued)", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      player.isQueued.mockReturnValue(true);
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!;
      // controlled checked=true; click toggles unchecked
      await act(async () => {
        input.click();
      });

      expect(player.remove).toHaveBeenCalledWith("x1");

      await cleanup(container, root);
    });

    it("keeps the checkbox checked after a successful add (controlled, no revert)", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      // Starts unqueued; add flips isQueued to true so the controlled checkbox
      // re-renders checked instead of reverting.
      player.isQueued.mockReturnValue(false);
      player.add.mockImplementation(() => player.isQueued.mockReturnValue(true));
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!; // type-safety-ok: querySelector in test, element guaranteed by rendered component
      expect(input.checked).toBe(false);

      await act(async () => {
        input.click();
      });

      expect(player.add).toHaveBeenCalled();
      const after = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!; // type-safety-ok: querySelector in test, element guaranteed by rendered component
      expect(after.checked).toBe(true);

      await cleanup(container, root);
    });

    it("unchecks the checkbox after a successful remove (controlled)", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      player.isQueued.mockReturnValue(true);
      player.remove.mockImplementation(() =>
        player.isQueued.mockReturnValue(false),
      );
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!; // type-safety-ok: querySelector in test, element guaranteed by rendered component
      expect(input.checked).toBe(true);

      await act(async () => {
        input.click();
      });

      expect(player.remove).toHaveBeenCalledWith("x1");
      const after = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!; // type-safety-ok: querySelector in test, element guaranteed by rendered component
      expect(after.checked).toBe(false);

      await cleanup(container, root);
    });

    it("resyncs the checkbox on a focus rescan when the queue changed externally", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      player.isQueued.mockReturnValue(true);
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!; // type-safety-ok: querySelector in test, element guaranteed by rendered component
      expect(input.checked).toBe(true);

      // External mutation: the queue is emptied behind the component's back.
      player.isQueued.mockReturnValue(false);

      // A focus-driven rescan re-renders Home (same items), reasserting the
      // controlled `checked` from the now-false isQueued.
      await act(async () => {
        window.dispatchEvent(new Event("focus"));
      });

      const after = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!; // type-safety-ok: querySelector in test, element guaranteed by rendered component
      expect(after.checked).toBe(false);

      await cleanup(container, root);
    });

    it("does not call player.add or player.remove when clicking the row title", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const title = container.querySelector<HTMLElement>(".title")!;
      await act(async () => {
        title.click();
      });

      expect(player.add).not.toHaveBeenCalled();
      expect(player.remove).not.toHaveBeenCalled();

      await cleanup(container, root);
    });

    it("renders the controlled checked state from player.isQueued", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      player.isQueued.mockReturnValue(true);
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!; // type-safety-ok: querySelector in test, element guaranteed by rendered component
      expect(input.checked).toBe(true);
      expect(player.isQueued).toHaveBeenCalledWith("x1");

      await cleanup(container, root);
    });

    it("renders the controlled unchecked state when player.isQueued is false", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      player.isQueued.mockReturnValue(false);
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!; // type-safety-ok: querySelector in test, element guaranteed by rendered component
      expect(input.checked).toBe(false);

      await cleanup(container, root);
    });
  });

  describe("interactive: window focus rescan", () => {
    it("patches enriched local tags in place on focus without re-fetching the library", async () => {
      mockListLibrary.mockResolvedValue([
        makeLocalItem({ id: "local:song.mp3", artist: "Unknown artist" }),
      ]);
      // The initial-load enrich patch sees the placeholder tag.
      mockListLocalTracks.mockResolvedValue([
        makeLocalItem({ id: "local:song.mp3", artist: "Unknown artist" }),
      ]);
      const player = makeMockPlayer();
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const libraryCallsBefore = mockListLibrary.mock.calls.length;

      // A folder edit while away re-tags the file; the focus re-enrich patch pulls
      // the fresh tag from listLocalTracks and updates the row in place.
      mockListLocalTracks.mockResolvedValue([
        makeLocalItem({ id: "local:song.mp3", artist: "Real Artist" }),
      ]);

      await act(async () => {
        window.dispatchEvent(new Event("focus"));
      });

      const row = container.querySelector('[data-id="local:song.mp3"]')!;
      expect(row.querySelector(".artist")!.textContent).toBe("Real Artist");
      // No extra library fetch — the page is patched in place, not reloaded.
      expect(mockListLibrary.mock.calls.length).toBe(libraryCallsBefore);

      await cleanup(container, root);
    });
  });

  describe("cache stats", () => {
    it("displays formatted cache stats from getCacheStats", async () => {
      mockGetCacheStats.mockResolvedValue({ trackCount: 2, totalBytes: 2048 });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      const statsEl = container.querySelector("#cache-stats")!;
      expect(statsEl.textContent).toBe("2 tracks cached (2.0 KB)");

      await cleanup(container, root);
    });

    it("uses singular 'track' when trackCount is 1", async () => {
      mockGetCacheStats.mockResolvedValue({ trackCount: 1, totalBytes: 512 });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      const statsEl = container.querySelector("#cache-stats")!;
      expect(statsEl.textContent).toBe("1 track cached (512 B)");

      await cleanup(container, root);
    });

    it("shows 'Cache stats unavailable' and calls logError when getCacheStats rejects", async () => {
      mockGetCacheStats.mockRejectedValue(new Error("idb failure"));
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      const statsEl = container.querySelector("#cache-stats")!;
      expect(statsEl.textContent).toBe("Cache stats unavailable");
      expect(mockLogError).toHaveBeenCalledWith(expect.any(Error), {
        operation: "cache-stats",
      });

      await cleanup(container, root);
    });

    it("refreshes cache stats on CACHE_UPDATED_EVENT", async () => {
      mockGetCacheStats.mockResolvedValue({ trackCount: 0, totalBytes: 0 });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      const callsBefore = mockGetCacheStats.mock.calls.length;

      mockGetCacheStats.mockResolvedValue({ trackCount: 5, totalBytes: 1024 });
      await act(async () => {
        document.dispatchEvent(new Event("audio-cache-updated"));
      });

      expect(mockGetCacheStats.mock.calls.length).toBeGreaterThan(callsBefore);
      const statsEl = container.querySelector("#cache-stats")!;
      expect(statsEl.textContent).toBe("5 tracks cached (1.0 KB)");

      await cleanup(container, root);
    });

    it("does not call getCacheStats after unmount when CACHE_UPDATED_EVENT fires", async () => {
      mockGetCacheStats.mockResolvedValue({ trackCount: 0, totalBytes: 0 });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      await cleanup(container, root);

      const callsAfterUnmount = mockGetCacheStats.mock.calls.length;

      // Fire the cache event — AbortController cleanup should have removed the listener
      await act(async () => {
        document.dispatchEvent(new Event("audio-cache-updated"));
      });

      expect(mockGetCacheStats.mock.calls.length).toBe(callsAfterUnmount);
      expect(mockLogError).not.toHaveBeenCalled();
    });
  });

  describe("clear-cache button", () => {
    it("calls clearCache and then refreshes cache stats on button click", async () => {
      mockGetCacheStats.mockResolvedValue({ trackCount: 3, totalBytes: 3072 });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      const callsBefore = mockGetCacheStats.mock.calls.length;
      mockGetCacheStats.mockResolvedValue({ trackCount: 0, totalBytes: 0 });

      const btn = container.querySelector<HTMLButtonElement>("#clear-cache-btn")!;
      await act(async () => {
        btn.click();
      });

      expect(mockClearCache).toHaveBeenCalled();
      expect(mockGetCacheStats.mock.calls.length).toBeGreaterThan(callsBefore);

      await cleanup(container, root);
    });

    it("shows 'Failed to clear cache. Try again.' and calls logError when clearCache rejects", async () => {
      mockClearCache.mockRejectedValue(new Error("clear failed"));
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      const btn = container.querySelector<HTMLButtonElement>("#clear-cache-btn")!;
      await act(async () => {
        btn.click();
      });

      const statsEl = container.querySelector("#cache-stats")!;
      expect(statsEl.textContent).toBe("Failed to clear cache. Try again.");
      expect(mockLogError).toHaveBeenCalledWith(expect.any(Error), {
        operation: "clear-cache",
      });

      await cleanup(container, root);
    });
  });

  describe("cache-first enrichment", () => {
    it("runs enrichLocalTracks and patches local rows in place after the initial load", async () => {
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      expect(mockEnrichLocalTracks).toHaveBeenCalledTimes(1);
      // Page 1 is fetched exactly once; enrichment now patches local rows in place
      // via listLocalTracks rather than re-fetching the whole library.
      expect(mockListLibrary.mock.calls.length).toBe(1);
      expect(mockListLocalTracks).toHaveBeenCalled();

      await cleanup(container, root);
    });

    it("patches enriched local tags in place after the enrichment pass", async () => {
      // Page 1 paints placeholder tags; after enrichment, the in-place patch pulls
      // the freshly-tagged local row from listLocalTracks (the now-populated cache)
      // WITHOUT a second library fetch.
      mockListLibrary.mockResolvedValue([
        makeLocalItem({ id: "local:song.mp3", artist: "Unknown artist" }),
      ]);
      mockListLocalTracks.mockResolvedValue([
        makeLocalItem({ id: "local:song.mp3", artist: "Real Artist" }),
      ]);

      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      const row = container.querySelector('[data-id="local:song.mp3"]')!; // type-safety-ok: DOM element asserted present after render in test
      expect(row.querySelector(".artist")!.textContent).toBe("Real Artist"); // type-safety-ok: DOM element asserted present after render in test
      expect(mockListLibrary.mock.calls.length).toBe(1);

      await cleanup(container, root);
    });

    it("does not enrich or re-list when the initial load fails", async () => {
      mockListLibrary.mockReset();
      mockListLibrary.mockRejectedValue(new Error("network failure"));

      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      expect(mockEnrichLocalTracks).not.toHaveBeenCalled();
      // Only the single failed load — no enrichment-triggered rescan.
      expect(mockListLibrary.mock.calls.length).toBe(1);

      await cleanup(container, root);
    });
  });

  describe("load more", () => {
    it("hides the load-more button when nextCursor is null", async () => {
      mockListLibrary.mockResolvedValue({
        items: [makeLibraryItem({ id: "a1" })],
        nextCursor: null,
      });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      expect(container.querySelector("#load-more-btn")).toBeNull();

      await cleanup(container, root);
    });

    it("shows the load-more button when nextCursor is non-null", async () => {
      mockListLibrary.mockResolvedValue({
        items: [makeLibraryItem({ id: "a1" })],
        nextCursor: "cursor-1",
      });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      expect(container.querySelector("#load-more-btn")).not.toBeNull();

      await cleanup(container, root);
    });

    it("appends the next page's items when load-more is clicked", async () => {
      mockListLibrary
        .mockResolvedValueOnce({
          items: [makeLibraryItem({ id: "a1" })],
          nextCursor: "cursor-1",
        })
        .mockResolvedValueOnce({
          items: [makeLibraryItem({ id: "a2" })],
          nextCursor: null,
        });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      expect(container.querySelector('[data-id="a1"]')).not.toBeNull();
      expect(container.querySelector('[data-id="a2"]')).toBeNull();

      const btn = container.querySelector<HTMLButtonElement>("#load-more-btn")!;
      await act(async () => {
        btn.click();
      });

      // Both pages now present; the button hides once nextCursor becomes null.
      expect(container.querySelector('[data-id="a1"]')).not.toBeNull();
      expect(container.querySelector('[data-id="a2"]')).not.toBeNull();
      expect(container.querySelector("#load-more-btn")).toBeNull();

      await cleanup(container, root);
    });

    it("keeps loaded page 2 when a focus enrich patch fires (no collapse to page 1)", async () => {
      mockListLibrary
        .mockResolvedValueOnce({
          items: [makeLibraryItem({ id: "a1" })],
          nextCursor: "cursor-1",
        })
        .mockResolvedValueOnce({
          items: [makeLocalItem({ id: "local:song.mp3", artist: "Unknown artist" })],
          nextCursor: null,
        });
      const { container, root } = await render(
        <Home user={null} player={null} refreshKey={0} />,
      );

      // Load page 2 (the local row).
      const btn = container.querySelector<HTMLButtonElement>("#load-more-btn")!;
      await act(async () => {
        btn.click();
      });
      expect(container.querySelector('[data-id="local:song.mp3"]')).not.toBeNull();

      // A focus enrich patch re-tags the local row in place; page-1 and page-2
      // items both remain (no reset to page 1).
      mockListLocalTracks.mockResolvedValue([
        makeLocalItem({ id: "local:song.mp3", artist: "Real Artist" }),
      ]);
      await act(async () => {
        window.dispatchEvent(new Event("focus"));
      });

      expect(container.querySelector('[data-id="a1"]')).not.toBeNull();
      const row = container.querySelector('[data-id="local:song.mp3"]')!;
      expect(row.querySelector(".artist")!.textContent).toBe("Real Artist");

      await cleanup(container, root);
    });
  });

  describe("playlists", () => {
    it("populates the load-playlist-select options from getPlaylists", async () => {
      mockGetPlaylists.mockResolvedValue({ Chill: ["a.mp3"], Focus: ["b.mp3"] });
      const { container, root } = await render(
        <Home user={null} player={makeMockPlayer()} refreshKey={0} />,
      );

      const select =
        container.querySelector<HTMLSelectElement>("#load-playlist-select")!; // type-safety-ok: DOM element asserted present after render in test
      const optionValues = Array.from(select.options).map((o) => o.value);
      expect(optionValues).toEqual(["", "Chill", "Focus"]);

      await cleanup(container, root);
    });

    it("saves the current local queue as a named playlist", async () => {
      const player = makeMockPlayer();
      player.getLocalQueueNames.mockReturnValue(["song.mp3", "two.mp3"]);
      vi.stubGlobal("prompt", vi.fn().mockReturnValue("  My List  "));

      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const btn =
        container.querySelector<HTMLButtonElement>("#save-playlist-btn")!; // type-safety-ok: DOM element asserted present after render in test
      await act(async () => {
        btn.click();
      });

      // Name is trimmed.
      expect(mockSavePlaylist).toHaveBeenCalledWith("My List", [
        "song.mp3",
        "two.mp3",
      ]);

      await cleanup(container, root);
    });

    it("alerts and does not save when the queue has no local tracks", async () => {
      const player = makeMockPlayer();
      player.getLocalQueueNames.mockReturnValue([]);
      vi.stubGlobal("prompt", vi.fn().mockReturnValue("Empty"));
      const alertMock = vi.fn();
      vi.stubGlobal("alert", alertMock);

      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const btn =
        container.querySelector<HTMLButtonElement>("#save-playlist-btn")!; // type-safety-ok: DOM element asserted present after render in test
      await act(async () => {
        btn.click();
      });

      expect(alertMock).toHaveBeenCalled();
      expect(mockSavePlaylist).not.toHaveBeenCalled();

      await cleanup(container, root);
    });

    it("does not save when the prompt is cancelled", async () => {
      const player = makeMockPlayer();
      player.getLocalQueueNames.mockReturnValue(["song.mp3"]);
      vi.stubGlobal("prompt", vi.fn().mockReturnValue(null));

      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const btn =
        container.querySelector<HTMLButtonElement>("#save-playlist-btn")!; // type-safety-ok: DOM element asserted present after render in test
      await act(async () => {
        btn.click();
      });

      expect(mockSavePlaylist).not.toHaveBeenCalled();

      await cleanup(container, root);
    });

    it("loads a playlist into the player on select change", async () => {
      mockGetPlaylists.mockResolvedValue({ Chill: ["a.mp3", "b.mp3"] });
      const localItems = [
        makeLocalItem({ id: "local:a.mp3", localName: "a.mp3" }),
        makeLocalItem({ id: "local:b.mp3", localName: "b.mp3" }),
      ];
      mockListLocalTracks.mockResolvedValue(localItems);
      const player = makeMockPlayer();

      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const select =
        container.querySelector<HTMLSelectElement>("#load-playlist-select")!; // type-safety-ok: DOM element asserted present after render in test
      await act(async () => {
        select.value = "Chill";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      expect(player.loadPlaylist).toHaveBeenCalledWith(
        ["a.mp3", "b.mp3"],
        localItems,
      );

      await cleanup(container, root);
    });
  });
});
