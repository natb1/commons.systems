import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LibraryItem } from "../../src/types";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const mockListLibrary = vi.fn();

vi.mock("../../src/library.js", () => ({
  listLibrary: (...args: unknown[]) => mockListLibrary(...args),
}));

vi.mock("../../src/local-source.js", () => ({ enrichLocalTracks: vi.fn() }));

// home.ts → player.js → storage.js → firebase.js (config requires env);
// mock storage.js to keep the page render unit isolated from Firebase config.
vi.mock("../../src/storage.js", () => ({
  resolveAudioSource: vi.fn(),
}));

vi.mock("../../src/audio-cache.js", () => ({
  getCacheStats: vi.fn().mockResolvedValue({ trackCount: 0, totalBytes: 0 }),
  clearCache: vi.fn().mockResolvedValue(undefined),
  CACHE_UPDATED_EVENT: "audio-cache-updated",
}));

const mockLogError = vi.fn();

vi.mock("@commons-systems/errorutil/log", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

import { renderHome, afterRenderHome } from "../../src/pages/home";
import { getCacheStats } from "../../src/audio-cache.js";
import type { PlayerHandle } from "../../src/player";

const mockGetCacheStats = vi.mocked(getCacheStats);

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

describe("renderHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListLibrary.mockResolvedValue([]);
  });

  it("calls listLibrary with the user when signed out", async () => {
    const html = await renderHome(null);

    expect(mockListLibrary).toHaveBeenCalledWith(null);
    expect(html).toContain("public-notice");
  });

  it("shows public notice when signed out", async () => {
    const html = await renderHome(null);

    expect(html).toContain('id="public-notice"');
    expect(html).toContain("Sign in to see your full library");
  });

  it("renders Library heading", async () => {
    const html = await renderHome(null);

    expect(html).toContain("<h2>Library</h2>");
  });

  it("calls listLibrary with the user when signed in and hides public notice", async () => {
    const user = { uid: "u1", email: "alice@example.com" };

    const html = await renderHome(user);

    expect(mockListLibrary).toHaveBeenCalledWith(user);
    expect(html).not.toContain("public-notice");
  });

  it("shows #media-empty for empty list", async () => {
    const html = await renderHome(null);

    expect(html).toContain('id="media-empty"');
    expect(html).toContain("No audio items available.");
  });

  it("renders media list with items", async () => {
    mockListLibrary.mockResolvedValue([
      makeLibraryItem({ id: "a1", title: "Song A", artist: "Artist A", album: "Album A" }),
      makeLibraryItem({ id: "a2", title: "Song B", artist: "Artist B", album: "Album B" }),
    ]);

    const html = await renderHome(null);

    expect(html).toContain('id="media-list"');
    expect(html).toContain('data-id="a1"');
    expect(html).toContain('data-id="a2"');
    expect(html).toContain('data-storage-path="media/item-1.mp3"');
    expect(html).toContain('data-title="Song A"');
    expect(html).toContain('data-artist="Artist A"');
    expect(html).toContain('data-album="Album A"');
  });

  it("wraps the region in #library-region", async () => {
    const html = await renderHome(null);
    expect(html).toContain('id="library-region"');
  });

  it("tags cloud rows with origin and storage-path", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "c1" })]);

    const html = await renderHome(null);

    expect(html).toContain('data-origin="cloud"');
    expect(html).toContain('data-storage-path="media/item-1.mp3"');
  });

  it("tags local rows with origin and local-name", async () => {
    mockListLibrary.mockResolvedValue([makeLocalItem()]);

    const html = await renderHome(null);

    expect(html).toContain('data-origin="local"');
    expect(html).toContain('data-local-name="song.mp3"');
  });

  it("renders checkbox in each row", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem()]);

    const html = await renderHome(null);

    expect(html).toContain("data-queue-toggle");
    expect(html).toContain('class="queue-checkbox"');
    expect(html).toContain('aria-label="Add Test Title to queue"');
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

    const html = await renderHome(null);

    expect(html).toContain("Jazz");
    expect(html).toContain("1959");
    expect(html).toContain("1:30");
    expect(html).toContain("flac");
    expect(html).toContain("Vinyl rip");
  });

  it("shows #media-error when listLibrary fails", async () => {
    mockListLibrary.mockRejectedValue(new Error("network failure"));

    const html = await renderHome(null);

    expect(html).toContain('id="media-error"');
    expect(html).toContain("Could not load audio library.");
    expect(mockLogError).toHaveBeenCalledWith(expect.any(Error), {
      operation: "load-media",
    });
  });

  it("re-throws DataIntegrityError", async () => {
    mockListLibrary.mockRejectedValue(new DataIntegrityError("corrupt data"));

    await expect(renderHome(null)).rejects.toThrow(DataIntegrityError);
    expect(mockLogError).not.toHaveBeenCalled();
  });
});

describe("afterRenderHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListLibrary.mockResolvedValue([]);
  });

  async function buildOutlet(user: Parameters<typeof renderHome>[0] = null): Promise<HTMLElement> {
    const outlet = document.createElement("div");
    outlet.innerHTML = await renderHome(user);
    return outlet;
  }

  it("calls player.add with a cloud PlayRequest when a cloud checkbox is checked", async () => {
    mockListLibrary.mockResolvedValue([
      makeLibraryItem({ id: "x1", title: "Track", artist: "Art", album: "Alb" }),
    ]);
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    afterRenderHome(outlet, player, null);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    checkbox.click();

    expect(player.add).toHaveBeenCalledWith({
      id: "x1",
      title: "Track",
      artist: "Art",
      album: "Alb",
      origin: "cloud",
      storagePath: "media/item-1.mp3",
    });
  });

  it("calls player.add with a local PlayRequest when a local checkbox is checked", async () => {
    mockListLibrary.mockResolvedValue([
      makeLocalItem({ id: "local:song.mp3", title: "song", artist: "Unknown artist", album: "Unknown album" }),
    ]);
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    afterRenderHome(outlet, player, null);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    checkbox.click();

    expect(player.add).toHaveBeenCalledWith({
      id: "local:song.mp3",
      title: "song",
      artist: "Unknown artist",
      album: "Unknown album",
      origin: "local",
      localName: "song.mp3",
    });
  });

  it("calls player.remove when checkbox is unchecked", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    player.isQueued.mockReturnValue(true);
    afterRenderHome(outlet, player, null);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    // afterRenderHome set checked=true via isQueued mock; .click() toggles false in happy-dom
    checkbox.click();

    expect(player.remove).toHaveBeenCalledWith("x1");
  });

  it("does not call player methods when clicking summary outside checkbox", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    afterRenderHome(outlet, player, null);

    const title = outlet.querySelector(".title")!;
    (title as HTMLElement).click();

    expect(player.add).not.toHaveBeenCalled();
    expect(player.remove).not.toHaveBeenCalled();
  });

  it("does not call player when clicking outside a row", async () => {
    const outlet = document.createElement("div");
    outlet.innerHTML = '<div id="library-region"><p>Not a row</p></div>';

    const player = makeMockPlayer();
    afterRenderHome(outlet, player, null);

    outlet.querySelector("p")!.click();

    expect(player.add).not.toHaveBeenCalled();
    expect(player.remove).not.toHaveBeenCalled();
  });

  it("does not duplicate click listener on repeated afterRenderHome calls", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    afterRenderHome(outlet, player, null);
    afterRenderHome(outlet, player, null);
    afterRenderHome(outlet, player, null);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    checkbox.click();

    expect(player.add).toHaveBeenCalledTimes(1);
  });

  it("syncs checkbox state on render for queued tracks", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    player.isQueued.mockReturnValue(true);
    afterRenderHome(outlet, player, null);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    expect(checkbox.checked).toBe(true);
    expect(player.isQueued).toHaveBeenCalledWith("x1");
  });

  it("rescans the library on window focus", async () => {
    mockListLibrary.mockResolvedValue([makeLibraryItem({ id: "x1" })]);
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    afterRenderHome(outlet, player, null);

    mockListLibrary.mockClear();
    mockListLibrary.mockResolvedValue([
      makeLibraryItem({ id: "x1" }),
      makeLocalItem({ id: "local:new.mp3", localName: "new.mp3" }),
    ]);

    window.dispatchEvent(new Event("focus"));

    await vi.waitFor(() => {
      expect(mockListLibrary).toHaveBeenCalled();
    });
    await vi.waitFor(() => {
      expect(outlet.querySelector('[data-id="local:new.mp3"]')).not.toBeNull();
    });
  });

  it("does not log cache-stats error when CACHE_UPDATED_EVENT fires after navigation away", async () => {
    const outlet = document.createElement("div");
    outlet.innerHTML = `
      <section id="cache-info"><p><span id="cache-stats"></span></p></section>
      <details class="expand-row audio-row" data-id="x1" data-storage-path="media/x1.mp3" data-title="Track" data-artist="Art" data-album="Alb">
        <summary><div class="expand-summary">
          <label class="queue-checkbox"><input type="checkbox" data-queue-toggle /></label>
          <span class="title">Track</span>
        </div></summary>
      </details>
    `;

    const player = makeMockPlayer();
    afterRenderHome(outlet, player, null);

    // Simulate navigation away: replace outlet content with non-Home markup,
    // detaching the original #cache-info element.
    outlet.innerHTML = "<p>About page content</p>";

    // Dispatch the cache event that would fire from a background cache write.
    document.dispatchEvent(new Event("audio-cache-updated"));

    // Flush microtasks so any async work triggered by the listener can settle.
    await Promise.resolve();

    // The staleness guard should have returned early without calling refreshCacheStats,
    // so the "#cache-stats element not found" error must not have been logged.
    const calls = mockLogError.mock.calls;
    const staleError = calls.find(
      (args) =>
        args[0] instanceof Error &&
        (args[0] as Error).message.includes("#cache-stats element not found"),
    );
    expect(staleError).toBeUndefined();
  });

  it("does not log a new cache-stats error when CACHE_UPDATED_EVENT fires for an outlet without #cache-info", async () => {
    const outlet = document.createElement("div");
    outlet.innerHTML = `
      <details class="expand-row audio-row" data-id="x1" data-storage-path="media/x1.mp3" data-title="Track" data-artist="Art" data-album="Alb">
        <summary><div class="expand-summary">
          <label class="queue-checkbox"><input type="checkbox" data-queue-toggle /></label>
          <span class="title">Track</span>
        </div></summary>
      </details>
    `;

    const player = makeMockPlayer();
    afterRenderHome(outlet, player, null);
    await Promise.resolve();

    // With no #cache-info (hence no #cache-stats), mount's refreshCacheStats logs
    // exactly one "#cache-stats element not found" error. Snapshot that baseline.
    const matchesStaleError = (args: unknown[]) =>
      args[0] instanceof Error &&
      (args[0] as Error).message.includes("#cache-stats element not found");
    const before = mockLogError.mock.calls.filter(matchesStaleError).length;

    // The cacheInfo anchor is null, so the document listener's guard
    // (`if (!cacheInfo ...) return;`) must short-circuit before refreshCacheStats.
    document.dispatchEvent(new Event("audio-cache-updated"));
    await Promise.resolve();

    const after = mockLogError.mock.calls.filter(matchesStaleError).length;
    // The null-anchor bypass must add no new error: a broken guard would call
    // refreshCacheStats again and log a second one.
    expect(after).toBe(before);
  });

  it("removes the old document listener on re-render so only one fires per event", async () => {
    const outlet = document.createElement("div");
    outlet.innerHTML = `
      <section id="cache-info"><p><span id="cache-stats"></span></p></section>
      <details class="expand-row audio-row" data-id="x1" data-storage-path="media/x1.mp3" data-title="Track" data-artist="Art" data-album="Alb">
        <summary><div class="expand-summary">
          <label class="queue-checkbox"><input type="checkbox" data-queue-toggle /></label>
          <span class="title">Track</span>
        </div></summary>
      </details>
    `;

    const player = makeMockPlayer();
    // Two afterRenderHome calls simulate a re-render. The second must abort the
    // first call's AbortController, removing the first document listener.
    afterRenderHome(outlet, player, null);
    afterRenderHome(outlet, player, null);
    await Promise.resolve();

    // refreshCacheStats runs at each mount (one getCacheStats call each).
    const before = mockGetCacheStats.mock.calls.length;

    document.dispatchEvent(new Event("audio-cache-updated"));
    await Promise.resolve();

    // Exactly one live listener should remain, so the single event triggers
    // exactly one additional getCacheStats call. A leaked old listener would add two.
    expect(mockGetCacheStats.mock.calls.length).toBe(before + 1);
  });
});
