import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AudioItem, LibraryItem } from "../src/types";

vi.mock("../src/firebase.js", () => ({
  storage: {},
  STORAGE_NAMESPACE: "audio",
}));

vi.mock("../src/firestore.js", () => ({
  getPublicMedia: vi.fn(),
  getAllAccessibleMedia: vi.fn(),
  getMediaItem: vi.fn(),
}));

vi.mock("../src/audio-cache.js", () => ({
  mediaCache: {},
}));

const mockCloudList = vi.fn();
const mockCreateFirebaseMediaSource = vi.fn(() => ({ list: mockCloudList }));
vi.mock("@commons-systems/mediautil/firebase", () => ({
  createFirebaseMediaSource: (...args: unknown[]) => mockCreateFirebaseMediaSource(...args),
}));

const mockListLocalTracks = vi.fn();
vi.mock("../src/local-source.js", () => ({
  listLocalTracks: (...args: unknown[]) => mockListLocalTracks(...args),
}));

import { listLibrary } from "../src/library";

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
    memberEmails: [],
    addedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeLocalItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    id: "local:track.mp3",
    title: "Local Track",
    artist: "Unknown artist",
    album: "Unknown album",
    trackNumber: null,
    genre: "",
    year: null,
    duration: 0,
    format: "mp3",
    publicDomain: false,
    sourceNotes: "Local file",
    storagePath: "",
    groupId: null,
    memberEmails: [],
    addedAt: "2026-02-01T00:00:00Z",
    origin: "local",
    localName: "track.mp3",
    ...overrides,
  };
}

describe("listLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListLocalTracks.mockResolvedValue([]);
  });

  it("unions cloud and local items, tagging each with origin", async () => {
    const cloudA = makeAudioItem({ id: "a1", addedAt: "2026-03-01T00:00:00Z" });
    const cloudB = makeAudioItem({ id: "a2", addedAt: "2026-01-01T00:00:00Z" });
    const localItem = makeLocalItem({ id: "local:track.mp3", addedAt: "2026-02-01T00:00:00Z" });

    mockCloudList.mockResolvedValue([cloudA, cloudB]);
    mockListLocalTracks.mockResolvedValue([localItem]);

    const result = await listLibrary(null);

    expect(result).toHaveLength(3);

    const resultA1 = result.find((r) => r.id === "a1");
    const resultA2 = result.find((r) => r.id === "a2");
    const resultLocal = result.find((r) => r.id === "local:track.mp3");

    expect(resultA1?.origin).toBe("cloud");
    expect(resultA2?.origin).toBe("cloud");
    expect(resultLocal?.origin).toBe("local");
  });

  it("sorts all items newest-first across the union", async () => {
    const cloudMarch = makeAudioItem({ id: "cloud-march", addedAt: "2026-03-01T00:00:00Z" });
    const cloudJan = makeAudioItem({ id: "cloud-jan", addedAt: "2026-01-01T00:00:00Z" });
    const localFeb = makeLocalItem({ id: "local:feb.mp3", addedAt: "2026-02-01T00:00:00Z" });

    mockCloudList.mockResolvedValue([cloudMarch, cloudJan]);
    mockListLocalTracks.mockResolvedValue([localFeb]);

    const result = await listLibrary(null);

    expect(result.map((r) => r.id)).toEqual(["cloud-march", "local:feb.mp3", "cloud-jan"]);
  });

  it("passes viewerEmail returning the user email when signed in", async () => {
    mockCloudList.mockResolvedValue([]);

    await listLibrary({ uid: "u1", email: "alice@example.com" });

    const config = mockCreateFirebaseMediaSource.mock.calls[0][0];
    expect(config.viewerEmail()).toBe("alice@example.com");
  });

  it("passes viewerEmail returning null when user is null", async () => {
    mockCloudList.mockResolvedValue([]);

    await listLibrary(null);

    const config = mockCreateFirebaseMediaSource.mock.calls[0][0];
    expect(config.viewerEmail()).toBeNull();
  });

  it("returns only local items when cloud is empty", async () => {
    const localItem = makeLocalItem();
    mockCloudList.mockResolvedValue([]);
    mockListLocalTracks.mockResolvedValue([localItem]);

    const result = await listLibrary(null);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("local:track.mp3");
    expect(result[0].origin).toBe("local");
  });
});
