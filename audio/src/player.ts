import { escapeHtml } from "@commons-systems/htmlutil";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { removeFile, resolveAudioSource } from "./storage.js";
import { resolveLocalAudioSource } from "./local-source.js";
import { savePlayerState } from "./sidecar.js";
import type { PlayerState } from "./sidecar.js";
import type { AudioOrigin, LibraryItem } from "./types.js";

export interface PlayRequest {
  id: string;
  title: string;
  artist: string;
  album: string;
  origin: AudioOrigin;
  storagePath?: string;
  localName?: string;
}

export interface PlayerHandle {
  add(item: PlayRequest): void;
  remove(id: string): void;
  isQueued(id: string): boolean;
  restore(state: PlayerState, items: LibraryItem[]): void;
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
  let currentObjectUrl: string | null = null;
  let playGeneration = 0;

  // Snapshot the LOCAL-only subsequence of the queue plus the current track's
  // localName and position into the sidecar. Cloud queue items stay session-only
  // (never written). When the current track is a cloud item, currentLocalName is
  // undefined. savePlayerState no-ops on disk when the folder is read-only and is
  // a cheap in-memory update otherwise — safe to call freely.
  function persistState(positionSeconds: number): void {
    const localQueue = queue
      .filter((q) => q.origin === "local" && q.localName)
      .map((q) => q.localName as string);
    const current = queue[currentIndex];
    const currentLocalName =
      current && current.origin === "local" ? current.localName : undefined;
    savePlayerState({ queue: localQueue, currentLocalName, positionSeconds }).catch((err) =>
      logError(err, { operation: "persist-player-state" }),
    );
  }

  // Throttle (NOT debounce) the live-position save: `timeupdate` fires
  // continuously during playback, so a debounce would never fire; a throttle
  // persists at most once per POSITION_PERSIST_MS while playing.
  const POSITION_PERSIST_MS = 3000;
  let positionThrottle: ReturnType<typeof setTimeout> | null = null;
  function onTimeUpdate(): void {
    if (positionThrottle) return;
    positionThrottle = setTimeout(() => {
      positionThrottle = null;
      persistState(audioEl.currentTime || 0);
    }, POSITION_PERSIST_MS);
  }

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

  function revokeCurrentObjectUrl(): void {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  function playTrack(index: number): void {
    const item = queue[index];
    if (!item) throw new Error(`playTrack: index ${index} out of range (queue length ${queue.length})`);
    const generation = ++playGeneration;
    currentIndex = index;
    // A track change starts at 0; audioEl.currentTime still holds the OLD track's
    // time here (src is set asynchronously after resolve), so persist position 0.
    persistState(0);
    renderPlaylist();
    revokeCurrentObjectUrl();
    const resolve =
      item.origin === "local"
        ? resolveLocalAudioSource(item.localName!)
        : resolveAudioSource(item.storagePath!);
    resolve
      .then((url) => {
        if (generation !== playGeneration) {
          URL.revokeObjectURL(url);
          return;
        }
        currentObjectUrl = url;
        audioEl.src = url;
        audioEl.play().catch((err) => {
          if (deferProgrammerError(err)) return;
          logError(err, { operation: "audio-play" });
        });
      })
      .catch((err) => {
        if (deferProgrammerError(err)) return;
        logError(err, { operation: "audio-source-resolve", id: item.id });
        if (generation !== playGeneration) return;
        advanceOrStop(currentIndex);
      });
  }

  function stop(): void {
    playGeneration++;
    currentIndex = -1;
    revokeCurrentObjectUrl();
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
    renderPlaylist();
  }

  function onEnded(): void {
    if (currentIndex < 0) return;
    advanceOrStop(currentIndex);
  }

  function onError(): void {
    if (currentIndex < 0) return;
    const item = queue[currentIndex];
    logError(audioEl.error ?? new Error("audio element error"), {
      operation: "audio-element-error",
      id: item.id,
      code: audioEl.error?.code,
    });
    // Only cloud tracks live in the storage cache; a local file has no cache
    // entry to evict (it streams from disk on each play).
    if (item.storagePath) {
      const storagePath = item.storagePath;
      removeFile(storagePath).catch((err) =>
        logError(err, { operation: "audio-cache-evict", storagePath }),
      );
    }
    advanceOrStop(currentIndex);
  }

  // Restore the current track PAUSED and seeked — a variant of playTrack that
  // does everything EXCEPT audioEl.play(). Browser autoplay is blocked and the
  // native <audio> controls let the user resume from the restored position.
  function loadPausedAt(index: number, positionSeconds: number): void {
    const item = queue[index];
    if (!item) return;
    const generation = ++playGeneration;
    currentIndex = index;
    renderPlaylist();
    revokeCurrentObjectUrl();
    // Local-only restore: every restored request has origin "local".
    resolveLocalAudioSource(item.localName!)
      .then((url) => {
        if (generation !== playGeneration) {
          URL.revokeObjectURL(url);
          return;
        }
        currentObjectUrl = url;
        audioEl.src = url;
        if (positionSeconds > 0) {
          // currentTime can only be set reliably once metadata (duration) is known.
          const seek = () => {
            if (generation !== playGeneration) return;
            try {
              audioEl.currentTime = positionSeconds;
            } catch (err) {
              if (deferProgrammerError(err)) return;
              logError(err, { operation: "restore-seek", id: item.id });
            }
          };
          audioEl.addEventListener("loadedmetadata", seek, { once: true });
        }
        // Intentionally NO audioEl.play() — restore leaves the track paused.
      })
      .catch((err) => {
        if (deferProgrammerError(err)) return;
        logError(err, { operation: "restore-resolve", id: item.id });
      });
  }

  audioEl.addEventListener("ended", onEnded);
  audioEl.addEventListener("error", onError);
  audioEl.addEventListener("timeupdate", onTimeUpdate);
  renderPlaylist();

  return {
    add(item: PlayRequest): void {
      if (queue.some((q) => q.id === item.id)) return;
      queue.push(item);
      if (currentIndex < 0) {
        playTrack(queue.length - 1);
      } else {
        renderPlaylist();
        // The autoplay branch's playTrack already persisted; here the queue
        // changed but the current track/position did not.
        persistState(audioEl.currentTime || 0);
      }
    },

    remove(id: string): void {
      const idx = queue.findIndex((q) => q.id === id);
      if (idx < 0) return;
      const wasPlaying = idx === currentIndex;
      queue.splice(idx, 1);
      if (queue.length === 0) {
        stop();
        persistState(0);
      } else if (wasPlaying) {
        // playTrack persists the new current track/position.
        const nextIndex = idx < queue.length ? idx : 0;
        playTrack(nextIndex);
      } else {
        if (idx < currentIndex) currentIndex--;
        renderPlaylist();
        persistState(audioEl.currentTime || 0);
      }
    },

    isQueued(id: string): boolean {
      return queue.some((q) => q.id === id);
    },

    restore(state: PlayerState, items: LibraryItem[]): void {
      if (state.queue.length === 0) return;
      // Guard against a double-restore: restore runs once at startup on an empty
      // queue.
      if (queue.length > 0) return;
      const byName = new Map<string, LibraryItem>();
      for (const item of items) {
        if (item.localName) byName.set(item.localName, item);
      }
      const rebuilt: PlayRequest[] = [];
      for (const localName of state.queue) {
        const item = byName.get(localName);
        // SKIP names with no matching item (file removed since last session).
        if (!item) continue;
        rebuilt.push({
          id: item.id,
          title: item.title,
          artist: item.artist,
          album: item.album,
          origin: "local",
          localName,
        });
      }
      if (rebuilt.length === 0) return;
      queue.push(...rebuilt);
      const currentIdx =
        state.currentLocalName !== undefined
          ? queue.findIndex((q) => q.localName === state.currentLocalName)
          : -1;
      const index = currentIdx >= 0 ? currentIdx : 0;
      // restore MUST NOT persist — it replays already-persisted state.
      loadPausedAt(index, state.positionSeconds ?? 0);
      renderPlaylist();
    },

    destroy(): void {
      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("error", onError);
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
      if (positionThrottle) clearTimeout(positionThrottle);
      queue.length = 0;
      stop();
    },
  };
}
