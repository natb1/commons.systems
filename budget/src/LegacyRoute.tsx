// The bridge: string-renders a legacy route body and hydrates it imperatively,
// exactly as the legacy router did. App keys this by `path` so each route gets a
// fresh instance; the HTML is set EXACTLY ONCE after the await and the
// dangerouslySetInnerHTML subtree is NEVER reconciled by React afterward —
// re-rendering it would wipe the imperatively-attached listeners.
import { useEffect, useRef, useState } from "react";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { runHydrationSpecs, type HydrationSpec } from "./legacy-hydrate.js";

export interface LegacyRouteProps {
  // Bound by App to renderOptions(), e.g. () => renderHome(renderOptions()).
  render: () => Promise<string | null>;
  specs: HydrationSpec[];
}

// Mirror the legacy router's formatError (main.ts:140-145): data-integrity /
// range errors become a generic support message; everything else falls through
// to the router's default terminal message.
function formatRouteError(error: unknown): string {
  const kind = classifyError(error);
  if (kind === "data-integrity" || kind === "range")
    return "A data error occurred. Please contact support.";
  return "Something went wrong. Please try again.";
}

export function LegacyRoute({ render, specs }: LegacyRouteProps) {
  const containerRef = useRef<HTMLElement>(null);
  // null until the (single) render resolves; once set it never changes for this
  // instance, so the dangerouslySetInnerHTML subtree is written exactly once.
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    render()
      .then((result) => {
        if (cancelled) return;
        // A null result means "preserve existing DOM"; there is none here, so
        // render to empty (matches the router's `if (html !== null)` guard
        // semantics — a null render leaves the outlet untouched, i.e. empty).
        setHtml(result ?? "");
      })
      .catch((error) => {
        if (cancelled) return;
        if (!deferProgrammerError(error)) logError(error, { operation: "router-render" });
        setHtml(`<p>${formatRouteError(error)}</p>`);
      });
    return () => {
      cancelled = true;
    };
    // Each route gets a fresh instance (App passes key={path}); render is bound
    // to the current renderOptions() at mount. Intentionally mount-once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After the HTML is injected, hydrate once. Runs only when `html` transitions
  // from null to a string (its single change), so hydration fires exactly once.
  useEffect(() => {
    if (html === null) return;
    const root = containerRef.current;
    if (!root) return;
    runHydrationSpecs(root, specs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  return (
    <main id="app" ref={containerRef} dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
