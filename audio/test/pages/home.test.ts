import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LibraryItem } from "../../src/types";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const mockListLibrary = vi.fn();

vi.mock("../../src/library.js", () => ({
  listLibrary: (...args: unknown[]) => mockListLibrary(...args),
}));

const mockEnsureRestored = vi.fn().mockResolvedValue(undefined);
const mockGetState = vi.fn();
const mockConnect = vi.fn();
const mockRegrant = vi.fn();

vi.mock("../../src/local-source.js", () => ({
  ensureLocalFolderRestored: (...a: unknown[]) => mockEnsureRestored(...a),
  getLocalFolderState: (...a: unknown[]) => mockGetState(...a),
  connectLocalFolder: (...a: unknown[]) => mockConnect(...a),
  regrantLocalFolder: (...a: unknown[]) => mockRegrant(...a),
}));

// home.ts → player.js → storage.js → firebase.js (config requires env);
// mock storage.js to keep the page render unit isolated from Firebase config.
vi.mock("../../src/storage.js", () => ({
  resolveAudioSource: vi.fn(),
}));

const mockLogError = vi.fn();

vi.mock("@commons-systems/errorutil/log", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

import { renderHome, afterRenderHome } from "../../src/pages/home";
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

describe("renderHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnsureRestored.mockResolvedValue(undefined);
    mockGetState.mockReturnValue("none");
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

  it("restores the local folder before listing", async () => {
    await renderHome(null);
    expect(mockEnsureRestored).toHaveBeenCalledOnce();
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

  describe("folder controls", () => {
    it("shows #choose-folder-btn in 'none' state", async () => {
      mockGetState.mockReturnValue("none");
      const html = await renderHome(null);
      expect(html).toContain('id="choose-folder-btn"');
    });

    it("shows #reconnect-folder-btn in 'prompt' state", async () => {
      mockGetState.mockReturnValue("prompt");
      const html = await renderHome(null);
      expect(html).toContain('id="reconnect-folder-btn"');
    });

    it("shows #folder-connected in 'granted' state", async () => {
      mockGetState.mockReturnValue("granted");
      const html = await renderHome(null);
      expect(html).toContain('id="folder-connected"');
      expect(html).toContain('id="choose-folder-btn"');
    });

    it("shows #folder-note in 'unsupported' state", async () => {
      mockGetState.mockReturnValue("unsupported");
      const html = await renderHome(null);
      expect(html).toContain('id="folder-note"');
    });

    it("shows #choose-folder-btn in 'denied' state", async () => {
      mockGetState.mockReturnValue("denied");
      const html = await renderHome(null);
      expect(html).toContain('id="choose-folder-btn"');
    });
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
    mockEnsureRestored.mockResolvedValue(undefined);
    mockGetState.mockReturnValue("none");
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
    mockGetState.mockReturnValue("granted");
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

  it("calls connectLocalFolder when #choose-folder-btn is clicked", async () => {
    mockGetState.mockReturnValue("none");
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    mockConnect.mockResolvedValue(undefined);
    afterRenderHome(outlet, player, null);

    const btn = outlet.querySelector<HTMLButtonElement>("#choose-folder-btn")!;
    btn.click();

    await vi.waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it("calls regrantLocalFolder when #reconnect-folder-btn is clicked", async () => {
    mockGetState.mockReturnValue("prompt");
    const outlet = await buildOutlet(null);

    const player = makeMockPlayer();
    mockRegrant.mockResolvedValue(false);
    afterRenderHome(outlet, player, null);

    const btn = outlet.querySelector<HTMLButtonElement>("#reconnect-folder-btn")!;
    btn.click();

    await vi.waitFor(() => {
      expect(mockRegrant).toHaveBeenCalled();
    });
  });
});
