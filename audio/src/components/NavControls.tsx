import { useEffect, useState } from "react";
import { logError } from "@commons-systems/errorutil/log";
import { signIn, signOut } from "../auth.js";
import type { User } from "../auth.js";
import {
  ensureLocalFolderRestored,
  getLocalFolderState,
  isLocalFolderSupported,
  connectLocalFolder,
  regrantLocalFolder,
} from "../local-source.js";

const HOME_HREF = "https://commons.systems/";
const HOME_LABEL = "commons.systems";

export interface NavControlsProps {
  /** The signed-in user, or null. Owned by App. */
  user: User | null;
  /**
   * Called after the local folder is successfully connected / regranted, so the
   * App can trigger a library refetch (local tracks appear). Ports main.ts:65.
   */
  onFolderConnected?: () => void;
}

/**
 * The DS Nav `end` slot for the audio app: the commons.systems home link, the
 * auth control (Login / user-display + Logout), and the local-folder button.
 *
 * Reproduces the exact DOM the old `<app-nav>` custom element emitted — e2e
 * specs query `#sign-in`, `#sign-out`, `#user-display`, and `#nav-folder-btn`.
 *
 * Folder state lives in the local-source.ts module singleton, so it is mirrored
 * into React state here and refreshed after restore and after each connect /
 * regrant click resolves.
 */
export function NavControls(props: NavControlsProps) {
  const { user, onFolderConnected } = props;
  const [folderState, setFolderState] = useState(() => getLocalFolderState());

  useEffect(() => {
    let cancelled = false;
    void ensureLocalFolderRestored().then(() => {
      if (!cancelled) setFolderState(getLocalFolderState());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The folder permission can change while the tab was blurred (ports main.ts's
  // focus behavior), so re-read the module-singleton state on window focus.
  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      "focus",
      () => {
        setFolderState(getLocalFolderState());
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, []);

  const onFolderClick = () => {
    const action =
      folderState === "prompt" ? regrantLocalFolder() : connectLocalFolder();
    action
      .then(() => {
        setFolderState(getLocalFolderState());
        onFolderConnected?.();
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        logError(err, { operation: "nav-folder-btn" });
      });
  };

  let folderLabel: string;
  switch (folderState) {
    case "granted":
      folderLabel = "Change folder";
      break;
    case "prompt":
      folderLabel = "Reconnect folder";
      break;
    default:
      folderLabel = "Choose folder";
      break;
  }

  return (
    <>
      <span className="nav-home">
        <a href={HOME_HREF}>{HOME_LABEL}</a>
      </span>
      <span className="nav-auth">
        {user ? (
          <>
            <span id="user-display">
              {user.displayName || user.email || "User"}
            </span>
            <a
              href="#"
              id="sign-out"
              onClick={(e) => {
                e.preventDefault();
                void signOut();
              }}
            >
              Logout
            </a>
          </>
        ) : (
          <a
            href="#"
            id="sign-in"
            onClick={(e) => {
              e.preventDefault();
              signIn();
            }}
          >
            Login
          </a>
        )}
      </span>
      {isLocalFolderSupported() && (
        <span className="nav-folder-slot">
          <button id="nav-folder-btn" type="button" onClick={onFolderClick}>
            {folderLabel}
          </button>
        </span>
      )}
    </>
  );
}
