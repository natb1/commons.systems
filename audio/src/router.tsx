import { useCallback, useEffect, useState } from "react";
import { trackPageView } from "./firebase.js";

export interface Router {
  /** The current in-app path (window.location.pathname). */
  path: string;
  /** Push a new path and update state; fires trackPageView. */
  navigate: (path: string) => void;
}

/**
 * Minimal path-state router for the React audio app.
 *
 * Owns `window.location.pathname` as React state, subscribes to `popstate`, and
 * exposes a `navigate` that pushes history + tracks the page view. It does NOT
 * touch the DOM outlet — React renders the route. Replaces the vanilla
 * `createHistoryRouter`, which set `outlet.innerHTML` and would fight React.
 */
export function useRouter(): Router {
  const [path, setPath] = useState<string>(() => window.location.pathname);

  // Initial page view on mount (matches main.ts onNavigate firing for "/").
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  // Back/forward.
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    const controller = new AbortController();
    window.addEventListener("popstate", onPop, { signal: controller.signal });
    return () => controller.abort();
  }, []);

  const navigate = useCallback((to: string) => {
    if (to !== window.location.pathname) {
      history.pushState({}, "", to);
    }
    setPath(to);
    trackPageView(to);
  }, []);

  return { path, navigate };
}
