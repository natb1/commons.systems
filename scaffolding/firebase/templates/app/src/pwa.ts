// PWA install + persisted File System Access (FSA) handle auto-load helper.
//
// This module is intentionally standalone: it depends only on a structural
// FSA permission contract (`FsaPermissionHandle` below), never on the
// `@commons-systems/local-first` package. Any handle exposing `queryPermission`
// / `requestPermission` (e.g. a persisted FileSystemHandle from F1) satisfies it.

/**
 * Structural contract for an FSA handle's permission surface. Matches the
 * `queryPermission` / `requestPermission` methods of `FileSystemHandle`, kept
 * as a local interface so this module does not import `@commons-systems/local-first`.
 */
export interface FsaPermissionHandle {
  queryPermission(descriptor?: {
    mode?: "read" | "readwrite";
  }): Promise<PermissionState>;
  requestPermission(descriptor?: {
    mode?: "read" | "readwrite";
  }): Promise<PermissionState>;
}

/**
 * True when the app is running as an installed PWA (standalone display mode, or
 * iOS Safari's non-standard `navigator.standalone`). Guards `matchMedia` for
 * environments (tests, older runtimes) where it may be undefined.
 */
export function isInstalled(): boolean {
  const standaloneDisplay =
    typeof matchMedia === "function" &&
    matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return standaloneDisplay || iosStandalone;
}

/**
 * The non-standard `beforeinstallprompt` event (Chromium-only). Typed locally
 * because lib DOM does not declare it.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

/** Imperative handle returned by {@link setupInstallPrompt}. */
export interface InstallController {
  /** True when a captured install prompt is available to show. */
  canInstall(): boolean;
  /**
   * Show the captured install prompt. Resolves with the user's choice, or
   * `"unavailable"` when no prompt has been captured.
   */
  promptInstall(): Promise<"accepted" | "dismissed" | "unavailable">;
  /** Remove the event listeners installed by {@link setupInstallPrompt}. */
  dispose(): void;
}

/**
 * Capture the browser's deferred install prompt and track install state.
 *
 * Listens for `beforeinstallprompt` (preventing the default mini-infobar and
 * stashing the event so the app can trigger the prompt on its own affordance)
 * and `appinstalled`. `onChange` fires on every state transition with the
 * current `{ canInstall, installed }`.
 */
export function setupInstallPrompt(
  onChange?: (state: { canInstall: boolean; installed: boolean }) => void,
): InstallController {
  let deferred: BeforeInstallPromptEvent | null = null;
  let installed = isInstalled();

  const emit = (): void => {
    onChange?.({ canInstall: deferred !== null, installed });
  };

  const onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  };

  const onAppInstalled = (): void => {
    deferred = null;
    installed = true;
    emit();
  };

  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);

  return {
    canInstall(): boolean {
      return deferred !== null;
    },
    async promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
      if (deferred === null) return "unavailable";
      const event = deferred;
      await event.prompt();
      const { outcome } = await event.userChoice;
      // A deferred prompt can only be used once.
      deferred = null;
      emit();
      return outcome;
    },
    dispose(): void {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    },
  };
}

/** Outcome of {@link autoLoadPersistedHandle}. */
export type AutoLoadResult =
  | { status: "loaded" }
  | { status: "needs-permission"; request: () => Promise<boolean> }
  | { status: "denied" }
  | { status: "unsupported" };

/**
 * Re-establish access to a persisted FSA handle at startup.
 *
 * AC3 (zero-prompt guarantee): when {@link FsaPermissionHandle.queryPermission}
 * reports `"granted"` — the state an installed PWA yields for a handle it
 * persisted with a prior grant — this returns `{ status: "loaded" }` WITHOUT
 * calling `requestPermission`. An installed app therefore auto-loads its file
 * handle with no per-session permission click.
 *
 * - `null` handle (FSA unsupported / nothing persisted) → `"unsupported"`.
 * - `"granted"` → `"loaded"` (no `requestPermission` call).
 * - `"prompt"` → `"needs-permission"`; the returned `request()` performs the
 *   one-click re-grant and resolves true when it becomes `"granted"`.
 * - `"denied"` → `"denied"`.
 */
export async function autoLoadPersistedHandle(
  handle: FsaPermissionHandle | null,
  mode: "read" | "readwrite" = "read",
): Promise<AutoLoadResult> {
  if (handle == null) return { status: "unsupported" };

  const state = await handle.queryPermission({ mode });

  if (state === "granted") {
    // Installed-PWA path: already granted, so never prompt (AC3).
    return { status: "loaded" };
  }

  if (state === "prompt") {
    return {
      status: "needs-permission",
      request: async () =>
        (await handle.requestPermission({ mode })) === "granted",
    };
  }

  return { status: "denied" };
}
