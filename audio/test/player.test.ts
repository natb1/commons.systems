import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetMediaDownloadUrl = vi.fn();

vi.mock("../src/storage.js", () => ({
  getMediaDownloadUrl: (...args: unknown[]) => mockGetMediaDownloadUrl(...args),
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
  let nowPlayingEl: HTMLElement;

  const sampleItem: PlayRequest = {
    title: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    storagePath: "media/test.mp3",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    audioEl = document.createElement("audio");
    nowPlayingEl = document.createElement("div");
    // Stub audioEl.play to return a resolved promise
    vi.spyOn(audioEl, "play").mockResolvedValue();
  });

  it("updates now-playing HTML and sets audio src on play", async () => {
    mockGetMediaDownloadUrl.mockResolvedValue(
      "https://storage.example.com/test.mp3",
    );

    const player = initPlayer(audioEl, nowPlayingEl);
    player.play(sampleItem);

    // now-playing is updated synchronously
    expect(nowPlayingEl.innerHTML).toContain("Test Song");
    expect(nowPlayingEl.innerHTML).toContain("Test Artist");
    expect(nowPlayingEl.innerHTML).toContain("Test Album");
    expect(nowPlayingEl.querySelector(".now-playing-title")).not.toBeNull();
    expect(nowPlayingEl.querySelector(".now-playing-artist")).not.toBeNull();
    expect(nowPlayingEl.querySelector(".now-playing-album")).not.toBeNull();

    // Wait for the download URL promise to resolve
    await vi.waitFor(() => {
      expect(audioEl.src).toContain("https://storage.example.com/test.mp3");
    });
    expect(audioEl.play).toHaveBeenCalled();
  });

  it("shows error message when download URL fails", async () => {
    mockGetMediaDownloadUrl.mockRejectedValue(new Error("download failed"));

    const player = initPlayer(audioEl, nowPlayingEl);
    player.play(sampleItem);

    // Wait for the error handling to complete
    await vi.waitFor(() => {
      expect(nowPlayingEl.querySelector(".now-playing-error")).not.toBeNull();
    });

    expect(nowPlayingEl.innerHTML).toContain("Could not load track.");
    expect(mockLogError).toHaveBeenCalledWith(expect.any(Error), {
      operation: "audio-download-url",
    });
  });

  it("resets state on destroy", () => {
    const player = initPlayer(audioEl, nowPlayingEl);
    const pauseSpy = vi.spyOn(audioEl, "pause");
    const loadSpy = vi.spyOn(audioEl, "load");

    player.destroy();

    expect(pauseSpy).toHaveBeenCalled();
    expect(audioEl.getAttribute("src")).toBeNull();
    expect(loadSpy).toHaveBeenCalled();
    expect(nowPlayingEl.innerHTML).toContain("now-playing-empty");
    expect(nowPlayingEl.innerHTML).toContain("Select a track to play");
  });
});
