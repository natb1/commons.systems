import { escapeHtml } from "@commons-systems/htmlutil";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";
import { getMediaDownloadUrl } from "./storage.js";
import type { AudioItem } from "./types.js";

export type PlayRequest = Pick<AudioItem, "id" | "title" | "artist" | "album" | "storagePath">;

export interface PlayerHandle {
  add(item: PlayRequest): void;
  remove(id: string): void;
  isQueued(id: string): boolean;
  destroy(): void;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const EMPTY_QUEUE_HTML = '<p class="playlist-empty">Add tracks to queue</p>';

export function initPlayer(
  audioEl: HTMLAudioElement,
  playlistEl: HTMLElement,
): PlayerHandle {
  const queue: PlayRequest[] = [];
  let currentIndex = -1;

  function renderPlaylist(): void {
    if (queue.length === 0) {
      playlistEl.innerHTML = EMPTY_QUEUE_HTML;
      return;
    }
    const items = queue
      .map(
        (item, i) =>
          `<li${i === currentIndex ? ' aria-current="true" class="playlist-active"' : ""}>${escapeHtml(item.title)} — ${escapeHtml(item.artist)}</li>`,
      )
      .join("");
    playlistEl.innerHTML = `<ol id="playlist-queue">${items}</ol>`;
  }

  function advanceOrStop(fromIndex: number): void {
    const nextIndex = fromIndex + 1;
    if (nextIndex < queue.length) {
      playTrack(nextIndex);
    } else {
      stop();
    }
  }

  function playTrack(index: number): void {
    const item = queue[index];
    if (!item) throw new Error(`playTrack: index ${index} out of range (queue length ${queue.length})`);
    currentIndex = index;
    renderPlaylist();
    getMediaDownloadUrl(item.storagePath)
      .then((url) => {
        audioEl.src = url;
        audioEl.play().catch((err) => {
          if (classifyError(err) === "programmer") throw err;
          logError(err, { operation: "audio-play" });
        });
      })
      .catch((err) => {
        if (classifyError(err) === "programmer") throw err;
        logError(err, { operation: "audio-download-url", storagePath: item.storagePath });
        advanceOrStop(index);
      });
  }

  function stop(): void {
    currentIndex = -1;
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
    renderPlaylist();
  }

  function onEnded(): void {
    if (currentIndex < 0) return;
    advanceOrStop(currentIndex);
  }

  audioEl.addEventListener("ended", onEnded);
  renderPlaylist();

  return {
    add(item: PlayRequest): void {
      if (queue.some((q) => q.id === item.id)) return;
      queue.push(item);
      if (currentIndex < 0) {
        playTrack(queue.length - 1);
      } else {
        renderPlaylist();
      }
    },

    remove(id: string): void {
      const idx = queue.findIndex((q) => q.id === id);
      if (idx < 0) return;
      const wasPlaying = idx === currentIndex;
      queue.splice(idx, 1);
      if (queue.length === 0) {
        stop();
      } else if (wasPlaying) {
        const nextIndex = idx < queue.length ? idx : 0;
        playTrack(nextIndex);
      } else if (idx < currentIndex) {
        currentIndex--;
        renderPlaylist();
      } else {
        renderPlaylist();
      }
    },

    isQueued(id: string): boolean {
      return queue.some((q) => q.id === id);
    },

    destroy(): void {
      audioEl.removeEventListener("ended", onEnded);
      queue.length = 0;
      stop();
    },
  };
}
