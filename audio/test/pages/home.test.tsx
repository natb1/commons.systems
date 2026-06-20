import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { LibraryItem } from "../../src/types";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

// React 18 act() environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockListLibrary = vi.fn();

vi.mock("../../src/library.js", () => ({
  listLibrary: (...args: unknown[]) => mockListLibrary(...args),
}));

vi.mock("../../src/local-source.js", () => ({}));

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
  destroy: ReturnType<typeof vi.fn>;
} {
  return {
    add: vi.fn(),
    remove: vi.fn(),
    isQueued: vi.fn().mockReturnValue(false),
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
    mockGetCacheStats.mockResolvedValue({ trackCount: 0, totalBytes: 0 });
    mockClearCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Ensure no lingering DOM nodes
    document.body.innerHTML = "";
  });

  it("calls listLibrary with null and shows public-notice when signed out", async () => {
    const { container, root } = await render(
      <Home user={null} player={null} refreshKey={0} />,
    );

    expect(mockListLibrary).toHaveBeenCalledWith(null);
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

    expect(mockListLibrary).toHaveBeenCalledWith(user);
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
      // defaultChecked=true; click toggles unchecked
      await act(async () => {
        input.click();
      });

      expect(player.remove).toHaveBeenCalledWith("x1");

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

    it("renders checkbox checked when player.isQueued returns true", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      player.isQueued.mockReturnValue(true);
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      const input = container.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      )!;
      expect(input.checked).toBe(true);
      expect(player.isQueued).toHaveBeenCalledWith("x1");

      await cleanup(container, root);
    });
  });

  describe("interactive: window focus rescan", () => {
    it("rescans the library on window focus and adds new rows", async () => {
      mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
      const player = makeMockPlayer();
      const { container, root } = await render(
        <Home user={null} player={player} refreshKey={0} />,
      );

      // Update listLibrary to return an extra local item
      mockListLibrary.mockResolvedValue([
        makeLibraryItem({ id: "x1" }),
        makeLocalItem({ id: "local:new.mp3", localName: "new.mp3" }),
      ]);

      await act(async () => {
        window.dispatchEvent(new Event("focus"));
      });

      expect(container.querySelector('[data-id="local:new.mp3"]')).not.toBeNull();

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
});
