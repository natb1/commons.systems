import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AudioItem } from "../../src/types";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

const mockGetPublicMedia = vi.fn();
const mockGetAllAccessibleMedia = vi.fn();

vi.mock("../../src/firestore.js", () => ({
  getPublicMedia: (...args: unknown[]) => mockGetPublicMedia(...args),
  getAllAccessibleMedia: (...args: unknown[]) =>
    mockGetAllAccessibleMedia(...args),
}));

vi.mock("../../src/storage.js", () => ({
  getMediaDownloadUrl: vi.fn(),
}));

const mockLogError = vi.fn();

vi.mock("@commons-systems/errorutil/log", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

import { renderHome, afterRenderHome } from "../../src/pages/home";
import type { PlayerHandle } from "../../src/player";

function makeAudioItem(overrides: Partial<AudioItem> = {}): AudioItem {
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
    ...overrides,
  };
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
  });

  it("calls getPublicMedia when signed out", async () => {
    mockGetPublicMedia.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(mockGetPublicMedia).toHaveBeenCalledOnce();
    expect(mockGetAllAccessibleMedia).not.toHaveBeenCalled();
    expect(html).toContain("public-notice");
  });

  it("shows public notice when signed out", async () => {
    mockGetPublicMedia.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(html).toContain('id="public-notice"');
    expect(html).toContain("Sign in to see your full library");
  });

  it("renders Library heading", async () => {
    mockGetPublicMedia.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(html).toContain("<h2>Library</h2>");
  });

  it("calls getAllAccessibleMedia when signed in", async () => {
    mockGetAllAccessibleMedia.mockResolvedValue([]);

    const html = await renderHome({
      uid: "u1",
      email: "alice@example.com",
    });

    expect(mockGetAllAccessibleMedia).toHaveBeenCalledWith("alice@example.com");
    expect(mockGetPublicMedia).not.toHaveBeenCalled();
    expect(html).not.toContain("public-notice");
  });

  it("shows #media-empty for empty list", async () => {
    mockGetPublicMedia.mockResolvedValue([]);

    const html = await renderHome(null);

    expect(html).toContain('id="media-empty"');
    expect(html).toContain("No audio items available.");
  });

  it("renders media list with items", async () => {
    const items = [
      makeAudioItem({ id: "a1", title: "Song A", artist: "Artist A", album: "Album A" }),
      makeAudioItem({ id: "a2", title: "Song B", artist: "Artist B", album: "Album B" }),
    ];
    mockGetPublicMedia.mockResolvedValue(items);

    const html = await renderHome(null);

    expect(html).toContain('id="media-list"');
    expect(html).toContain('data-id="a1"');
    expect(html).toContain('data-id="a2"');
    expect(html).toContain('data-storage-path="media/item-1.mp3"');
    expect(html).toContain('data-title="Song A"');
    expect(html).toContain('data-artist="Artist A"');
    expect(html).toContain('data-album="Album A"');
  });

  it("renders checkbox in each row", async () => {
    mockGetPublicMedia.mockResolvedValue([makeAudioItem()]);

    const html = await renderHome(null);

    expect(html).toContain('data-queue-toggle');
    expect(html).toContain('class="queue-checkbox"');
    expect(html).toContain('aria-label="Add Test Title to queue"');
  });

  it("renders expanded details with genre, year, duration, format, source", async () => {
    const item = makeAudioItem({
      genre: "Jazz",
      year: 1959,
      duration: 90,
      format: "flac",
      sourceNotes: "Vinyl rip",
    });
    mockGetPublicMedia.mockResolvedValue([item]);

    const html = await renderHome(null);

    expect(html).toContain("Jazz");
    expect(html).toContain("1959");
    expect(html).toContain("1:30");
    expect(html).toContain("flac");
    expect(html).toContain("Vinyl rip");
  });

  it("shows #media-error when query fails", async () => {
    mockGetPublicMedia.mockRejectedValue(new Error("network failure"));

    const html = await renderHome(null);

    expect(html).toContain('id="media-error"');
    expect(html).toContain("Could not load audio library.");
    expect(mockLogError).toHaveBeenCalledWith(expect.any(Error), {
      operation: "load-media",
    });
  });

  it("re-throws DataIntegrityError", async () => {
    mockGetPublicMedia.mockRejectedValue(
      new DataIntegrityError("corrupt data"),
    );

    await expect(renderHome(null)).rejects.toThrow(DataIntegrityError);
    expect(mockLogError).not.toHaveBeenCalled();
  });
});

describe("afterRenderHome", () => {
  it("calls player.add when checkbox is checked", () => {
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
    afterRenderHome(outlet, player);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    // .click() toggles checked state in happy-dom: false → true
    checkbox.click();

    expect(player.add).toHaveBeenCalledWith({
      id: "x1",
      title: "Track",
      artist: "Art",
      album: "Alb",
      storagePath: "media/x1.mp3",
    });
  });

  it("calls player.remove when checkbox is unchecked", () => {
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
    player.isQueued.mockReturnValue(true);
    afterRenderHome(outlet, player);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    // afterRenderHome set checked=true via isQueued mock; .click() toggles false in happy-dom
    checkbox.click();

    expect(player.remove).toHaveBeenCalledWith("x1");
  });

  it("does not call player methods when clicking summary outside checkbox", () => {
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
    afterRenderHome(outlet, player);

    const title = outlet.querySelector(".title")!;
    (title as HTMLElement).click();

    expect(player.add).not.toHaveBeenCalled();
    expect(player.remove).not.toHaveBeenCalled();
  });

  it("does not call player when clicking outside a row", () => {
    const outlet = document.createElement("div");
    outlet.innerHTML = '<p>Not a row</p>';

    const player = makeMockPlayer();
    afterRenderHome(outlet, player);

    outlet.querySelector("p")!.click();

    expect(player.add).not.toHaveBeenCalled();
    expect(player.remove).not.toHaveBeenCalled();
  });

  it("does not duplicate click listener on repeated afterRenderHome calls", () => {
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
    afterRenderHome(outlet, player);
    afterRenderHome(outlet, player);
    afterRenderHome(outlet, player);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    checkbox.click();

    expect(player.add).toHaveBeenCalledTimes(1);
  });

  it("syncs checkbox state on render for queued tracks", () => {
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
    player.isQueued.mockReturnValue(true);
    afterRenderHome(outlet, player);

    const checkbox = outlet.querySelector<HTMLInputElement>("input[data-queue-toggle]")!;
    expect(checkbox.checked).toBe(true);
    expect(player.isQueued).toHaveBeenCalledWith("x1");
  });
});
