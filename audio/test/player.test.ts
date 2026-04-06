import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResolveAudioSource = vi.fn();

vi.mock("../src/storage.js", () => ({
  resolveAudioSource: (...args: unknown[]) => mockResolveAudioSource(...args),
}));

const mockLogError = vi.fn();

vi.mock("@commons-systems/errorutil/log", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

import { formatDuration, initPlayer } from "../src/player";
import type { PlayRequest } from "../src/player";

describe("formatDuration", () => {
  it("formats 0 seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("formats 90 seconds", () => {
    expect(formatDuration(90)).toBe("1:30");
  });

  it("formats 900 seconds", () => {
    expect(formatDuration(900)).toBe("15:00");
  });

  it("formats 3661 seconds", () => {
    expect(formatDuration(3661)).toBe("61:01");
  });
});

describe("initPlayer", () => {
  let audioEl: HTMLAudioElement;
  let playlistEl: HTMLElement;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  const track1: PlayRequest = {
    id: "t1",
    title: "Song One",
    artist: "Artist A",
    album: "Album A",
    storagePath: "media/t1.mp3",
  };

  const track2: PlayRequest = {
    id: "t2",
    title: "Song Two",
    artist: "Artist B",
    album: "Album B",
    storagePath: "media/t2.mp3",
  };

  const track3: PlayRequest = {
    id: "t3",
    title: "Song Three",
    artist: "Artist C",
    album: "Album C",
    storagePath: "media/t3.mp3",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    audioEl = document.createElement("audio");
    playlistEl = document.createElement("div");
    vi.spyOn(audioEl, "play").mockResolvedValue();
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    mockResolveAudioSource.mockResolvedValue("blob:http://localhost/track-blob");
  });

  it("renders empty state on init", () => {
    initPlayer(audioEl, playlistEl);
    expect(playlistEl.querySelector(".playlist-empty")).not.toBeNull();
    expect(playlistEl.textContent).toContain("Add tracks to queue");
  });

  describe("add", () => {
    it("adds track to queue and starts playback when idle", async () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);

      expect(playlistEl.querySelector("#playlist-queue")).not.toBeNull();
      expect(playlistEl.textContent).toContain("Song One");
      expect(playlistEl.querySelector(".playlist-active")).not.toBeNull();

      await vi.waitFor(() => {
        expect(audioEl.src).toContain("blob:");
      });
      expect(audioEl.play).toHaveBeenCalled();
    });

    it("adds to queue without restarting playback when already playing", async () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(1);
      });

      player.add(track2);

      expect(playlistEl.querySelectorAll("#playlist-queue li")).toHaveLength(2);
      expect(playlistEl.textContent).toContain("Song Two");
      expect(audioEl.play).toHaveBeenCalledTimes(1);
    });

    it("ignores duplicate add", () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.add(track1);

      expect(playlistEl.querySelectorAll("#playlist-queue li")).toHaveLength(1);
    });
  });

  describe("remove", () => {
    it("removes track from queue", () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.add(track2);
      player.remove(track2.id);

      expect(playlistEl.querySelectorAll("#playlist-queue li")).toHaveLength(1);
      expect(playlistEl.textContent).not.toContain("Song Two");
    });

    it("advances to next track when removing current", async () => {
      mockResolveAudioSource
        .mockResolvedValueOnce("blob:http://localhost/t1-blob")
        .mockResolvedValueOnce("blob:http://localhost/t2-blob");

      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.add(track2);

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(1);
      });

      player.remove(track1.id);

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(2);
      });
      expect(playlistEl.querySelector(".playlist-active")?.textContent).toContain("Song Two");
    });

    it("stops playback when removing only track", () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.remove(track1.id);

      expect(playlistEl.querySelector(".playlist-empty")).not.toBeNull();
      expect(audioEl.getAttribute("src")).toBeNull();
    });
  });

  describe("isQueued", () => {
    it("returns true for queued track", () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      expect(player.isQueued(track1.id)).toBe(true);
    });

    it("returns false for non-queued track", () => {
      const player = initPlayer(audioEl, playlistEl);
      expect(player.isQueued(track1.id)).toBe(false);
    });

    it("returns false after removal", () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.remove(track1.id);
      expect(player.isQueued(track1.id)).toBe(false);
    });
  });

  describe("ended event", () => {
    it("advances to next track on ended", async () => {
      mockResolveAudioSource
        .mockResolvedValueOnce("blob:http://localhost/t1-blob")
        .mockResolvedValueOnce("blob:http://localhost/t2-blob");

      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.add(track2);

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(1);
      });

      audioEl.dispatchEvent(new Event("ended"));

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(2);
      });
      expect(mockResolveAudioSource).toHaveBeenCalledWith("media/t2.mp3");
    });

    it("stops after last track ends", async () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(1);
      });

      const pauseSpy = vi.spyOn(audioEl, "pause");
      audioEl.dispatchEvent(new Event("ended"));

      expect(pauseSpy).toHaveBeenCalled();
      expect(playlistEl.querySelector(".playlist-active")).toBeNull();
    });
  });

  describe("object URL revocation", () => {
    it("revokes object URL when changing tracks", async () => {
      mockResolveAudioSource
        .mockResolvedValueOnce("blob:http://localhost/t1-blob")
        .mockResolvedValueOnce("blob:http://localhost/t2-blob");

      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.add(track2);

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(1);
      });

      audioEl.dispatchEvent(new Event("ended"));

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(2);
      });

      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:http://localhost/t1-blob");
    });

    it("revokes object URL on stop", async () => {
      mockResolveAudioSource.mockResolvedValueOnce("blob:http://localhost/t1-blob");

      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(1);
      });

      player.remove(track1.id);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:http://localhost/t1-blob");
    });

    it("revokes object URL on destroy", async () => {
      mockResolveAudioSource.mockResolvedValueOnce("blob:http://localhost/t1-blob");

      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);

      await vi.waitFor(() => {
        expect(audioEl.play).toHaveBeenCalledTimes(1);
      });

      player.destroy();

      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:http://localhost/t1-blob");
    });
  });

  describe("destroy", () => {
    it("clears queue and resets audio", () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.add(track2);

      const pauseSpy = vi.spyOn(audioEl, "pause");
      const loadSpy = vi.spyOn(audioEl, "load");
      player.destroy();

      expect(pauseSpy).toHaveBeenCalled();
      expect(audioEl.getAttribute("src")).toBeNull();
      expect(loadSpy).toHaveBeenCalled();
      expect(playlistEl.querySelector(".playlist-empty")).not.toBeNull();
      expect(player.isQueued(track1.id)).toBe(false);
    });

    it("removes ended event listener", () => {
      const player = initPlayer(audioEl, playlistEl);
      player.add(track1);
      player.destroy();

      // Dispatching ended after destroy should not cause errors or state changes
      audioEl.dispatchEvent(new Event("ended"));
      expect(playlistEl.querySelector(".playlist-empty")).not.toBeNull();
    });
  });
});
