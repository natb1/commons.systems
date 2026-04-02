import { escapeHtml } from "@commons-systems/htmlutil";
import { logError } from "@commons-systems/errorutil/log";
import { getMediaDownloadUrl } from "./storage.js";

export interface PlayRequest {
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly storagePath: string;
}

export interface PlayerHandle {
  play(item: PlayRequest): void;
  destroy(): void;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function initPlayer(
  audioEl: HTMLAudioElement,
  nowPlayingEl: HTMLElement,
): PlayerHandle {
  function renderNowPlaying(item: PlayRequest): void {
    nowPlayingEl.innerHTML = `
      <p class="now-playing-title">${escapeHtml(item.title)}</p>
      <p class="now-playing-artist">${escapeHtml(item.artist)}</p>
      <p class="now-playing-album">${escapeHtml(item.album)}</p>
    `;
  }

  function showError(): void {
    nowPlayingEl.innerHTML =
      '<p class="now-playing-error">Could not load track.</p>';
  }

  return {
    play(item: PlayRequest): void {
      renderNowPlaying(item);
      getMediaDownloadUrl(item.storagePath)
        .then((url) => {
          audioEl.src = url;
          audioEl.play().catch((err) =>
            logError(err, { operation: "audio-play" }),
          );
        })
        .catch((err) => {
          logError(err, { operation: "audio-download-url" });
          showError();
        });
    },

    destroy(): void {
      audioEl.pause();
      audioEl.removeAttribute("src");
      audioEl.load();
      nowPlayingEl.innerHTML =
        '<p class="now-playing-empty">Select a track to play</p>';
    },
  };
}
