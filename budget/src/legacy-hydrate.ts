// Preserved per-table hydration error wrapper, lifted verbatim from the legacy
// main.ts `hydrateTable` (main.ts:161-180). It wraps `hydrateOnce` from
// @commons-systems/router/hydrate with a disable-inputs + message-append error
// UI. LegacyRoute (and Unit 3's React /transactions page) reuse it per route.
import { hydrateOnce } from "@commons-systems/router/hydrate";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";

export interface HydrationSpec {
  selector: string;
  hydrate: (el: HTMLElement) => void;
  errorLabel?: string;
}

// Hydrate one interactive container within `root`. Behavior is byte-for-byte the
// legacy `hydrateTable`: on a hydration error, disable inputs/selects in the
// container and append a user-facing message classified by error kind.
export function hydrateTable(
  root: HTMLElement,
  selector: string,
  hydrate: (el: HTMLElement) => void,
  errorLabel?: string,
): void {
  hydrateOnce(root, selector, hydrate, (error, el) => {
    const kind = classifyError(error);
    logError(error, { operation: "hydration" });
    el.querySelectorAll("input, select").forEach((input) => {
      (input as HTMLInputElement | HTMLSelectElement).disabled = true;
    });
    const msg = document.createElement("p");
    msg.textContent = kind === "data-integrity"
      ? "A data error occurred. Please contact support."
      : errorLabel
        ? `${errorLabel} is temporarily unavailable. Try refreshing the page.`
        : "Editing is temporarily unavailable. Try refreshing the page.";
    el.appendChild(msg);
  });
}

// Run a list of hydration specs against a container. Used by LegacyRoute after
// it injects a route's HTML string.
export function runHydrationSpecs(root: HTMLElement, specs: HydrationSpec[]): void {
  for (const spec of specs) {
    hydrateTable(root, spec.selector, spec.hydrate, spec.errorLabel);
  }
}
