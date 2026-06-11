/**
 * Local-folder UI controller: lets the user pick a folder of PDFs / EPUBs and
 * shows its items in the library, unioned with the cloud list. The chosen
 * directory handle is persisted via the shared `FsaHandleStore`
 * (`@commons-systems/local-first`) so a returning session needs no picker when
 * permission is `granted`, or one click when in the `prompt` state.
 *
 * The folder button lives in the nav (next to Login), initialized once at app
 * startup. `renderLocalIntoList` is exported so the home page can repopulate
 * local items on each render. Non-Chromium browsers (no FSA) get nothing here
 * and stay on the cloud-only path.
 */
import { createFsaHandleStore } from "@commons-systems/local-first/fsa-handle-store";
import { logError } from "@commons-systems/errorutil/log";

import {
  createLocalSource,
  listLocal,
} from "./library.js";
import { renderLocalMediaItems } from "./pages/home.js";

const store = createFsaHandleStore({ app: "print" });
const PURPOSE = "library-folder";

export type FolderUiState = "open" | "grant" | "list";

/**
 * Decide which control to show, purely from the persisted handle and its
 * queried permission. No IO — unit-tested in isolation.
 */
export function decideFolderUiState(
  handle: unknown,
  permission: string,
): FolderUiState {
  if (handle === null || handle === undefined) return "open";
  if (permission === "granted") return "list";
  if (permission === "prompt") return "grant";
  return "open"; // denied / unknown
}

// Window-focus rescan listener cleanup — one at a time, replaced on rebind.
let focusCleanup: (() => void) | null = null;

export async function initLocalFolder(
  section: HTMLElement,
  mediaListContainer: HTMLElement,
): Promise<(() => void) | null> {
  if (!store.isSupported()) {
    // Non-Chromium: no FSA, stay on the cloud-only path. Render nothing.
    return null;
  }

  const handle = await store.get(PURPOSE);
  const permission = handle
    ? await store.queryPermission(handle, "read")
    : "denied";
  const state = decideFolderUiState(handle, permission);

  async function bindAndRender(dir: FileSystemDirectoryHandle): Promise<void> {
    createLocalSource(dir);
    await renderLocalIntoList(mediaListContainer);
    if (focusCleanup) focusCleanup();
    const onFocus = () => {
      renderLocalIntoList(mediaListContainer).catch((err) =>
        logError(err, { operation: "local-folder-rescan" }),
      );
    };
    window.addEventListener("focus", onFocus);
    focusCleanup = () => window.removeEventListener("focus", onFocus);
  }

  async function openFolder(): Promise<void> {
    try {
      const dir = await window.showDirectoryPicker!({ mode: "read" });
      await store.put(PURPOSE, dir);
      await bindAndRender(dir);
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
      throw e;
    }
  }

  if (state === "open") {
    section.innerHTML =
      '<button id="local-folder-open" class="local-folder-button" type="button">Open folder…</button>';
    section
      .querySelector<HTMLButtonElement>("#local-folder-open")!
      .addEventListener("click", () => {
        openFolder().catch((err) =>
          logError(err, { operation: "local-folder-open" }),
        );
      });
  } else if (state === "grant") {
    section.innerHTML =
      '<button id="local-folder-grant" class="local-folder-button" type="button">Grant access to your folder</button>';
    section
      .querySelector<HTMLButtonElement>("#local-folder-grant")!
      .addEventListener("click", () => {
        void (async () => {
          const res = await store.requestPermission(handle!, "read");
          if (res === "granted") {
            section.innerHTML = "";
            await bindAndRender(handle as FileSystemDirectoryHandle);
          }
        })().catch((err) =>
          logError(err, { operation: "local-folder-grant" }),
        );
      });
  } else {
    // "list" — permission already granted, bind and render.
    section.innerHTML = "";
    await bindAndRender(handle as FileSystemDirectoryHandle);
  }

  return () => {
    if (focusCleanup) {
      focusCleanup();
      focusCleanup = null;
    }
  };
}

/**
 * Render the current local items into the shared media list, idempotently:
 * find (or create) the `#media-list` <ul>, strip prior local rows, and prepend
 * freshly-rendered ones before the cloud rows. No-ops when no media list or
 * empty-state placeholder is present (e.g. viewer page).
 */
export async function renderLocalIntoList(container: HTMLElement): Promise<void> {
  const items = await listLocal();
  let ul = container.querySelector<HTMLUListElement>("#media-list");
  if (!ul) {
    // Empty cloud library renders a `#media-empty` <p> instead of a <ul>.
    const empty = container.querySelector("#media-empty");
    if (!empty) return; // not on a page that has a media list — skip
    ul = document.createElement("ul");
    ul.id = "media-list";
    empty.replaceWith(ul);
  }
  for (const li of Array.from(ul.querySelectorAll(".media-item-local"))) {
    li.remove();
  }
  ul.insertAdjacentHTML("afterbegin", renderLocalMediaItems(items));
}
