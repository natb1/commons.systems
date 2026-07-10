import { useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark } from "../bookmarks.js";
import { getBookmarks, saveBookmarks } from "../bookmarks.js";
import type { UseViewerControllerResult } from "./useViewerController.js";

export interface BookmarksStore {
  load(): Promise<Bookmark[]>;
  save(bookmarks: Bookmark[]): Promise<void>;
}

export function loadLocalBookmarks(mediaId: string): Bookmark[] {
  const key = `bookmarks:${mediaId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(
      (e): e is Bookmark =>
        typeof (e as Bookmark)?.position === "string" &&
        typeof (e as Bookmark)?.label === "string",
    );
  } catch (err) {
    reportError(new Error("Failed to load local bookmarks", { cause: err }));
    return [];
  }
}

export function saveLocalBookmarks(mediaId: string, bookmarks: Bookmark[]): void {
  const key = `bookmarks:${mediaId}`;
  try {
    localStorage.setItem(key, JSON.stringify(bookmarks));
  } catch (err) {
    reportError(new Error("Failed to save local bookmarks", { cause: err }));
  }
}

export function pickBookmarksStore(
  uid: string | null,
  readFailed: boolean,
  mediaId: string,
): BookmarksStore {
  if (uid && !readFailed) {
    return {
      load: () => getBookmarks(uid, mediaId),
      save: (bookmarks) => saveBookmarks(uid, mediaId, bookmarks),
    };
  }
  return {
    load: async () => loadLocalBookmarks(mediaId),
    save: async (bookmarks) => saveLocalBookmarks(mediaId, bookmarks),
  };
}

export interface UseBookmarksResult {
  bookmarks: Bookmark[];
  currentBookmarked: boolean;
  toggleDisabled: boolean;
  toggleBookmark: () => void;
  goToBookmark: (position: string) => void;
}

export function useBookmarks(
  controller: UseViewerControllerResult,
  store: BookmarksStore,
): UseBookmarksResult {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loaded, setLoaded] = useState(false);
  const destroyed = useRef(false);

  // Load whenever the effective store changes. Viewer memoizes the store on
  // (uid, readFailed, mediaId), so a new store identity signals a store swap —
  // e.g. an initial cloud read failed (local store) and Firestore later recovered
  // (cloud store). Re-running the load reconciles the list rather than leaving it
  // forked from the now-effective store. The `destroyed` guard is reset here (the
  // cleanup of the prior run set it true) so a re-run's async result is applied.
  useEffect(() => {
    destroyed.current = false;
    store
      .load()
      .then((b) => {
        if (!destroyed.current) {
          setBookmarks(b);
          setLoaded(true);
        }
      })
      .catch((err) => {
        reportError(new Error("Failed to load bookmarks", { cause: err }));
      });
    return () => {
      destroyed.current = true;
    };
  }, [store]);

  const currentBookmarked = useMemo(() => {
    const pos = controller.getRenderer()?.position;
    return pos != null && bookmarks.some((b) => b.position === pos);
    // navSignal is the signal that renderer.position has changed.
  }, [controller.navSignal, bookmarks]);

  function toggleBookmark() {
    const r = controller.getRenderer();
    if (!r) return;
    const pos = r.position;
    const label = r.positionLabel;
    const next = bookmarks.some((b) => b.position === pos)
      ? bookmarks.filter((b) => b.position !== pos)
      : [...bookmarks, { position: pos, label }];
    setBookmarks(next);
    store.save(next).catch((err) => {
      reportError(new Error("Failed to save bookmarks", { cause: err }));
    });
  }

  function goToBookmark(position: string) {
    controller
      .getRenderer()
      ?.goToPosition(position)
      .then(() => controller.onPanelNavigate())
      .catch((err) => {
        reportError(new Error("Bookmark navigation failed", { cause: err }));
      });
  }

  return {
    bookmarks,
    currentBookmarked,
    toggleDisabled: !loaded,
    toggleBookmark,
    goToBookmark,
  };
}
