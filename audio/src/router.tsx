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
    const onPop = () => {
      setPath(window.location.pathname);
      trackPageView(window.location.pathname);
    };
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

  // Intercept clicks on in-app nav links (literal same-origin href starting with
  // "/"). The home link (https://commons.systems/) and "#" auth links are
  // excluded by the href test. Respect modified / non-primary clicks and
  // download/target anchors so open-in-new-tab and downloads still work.
  // Replaces App's former header onClick; navigate() owns pushState + setPath +
  // trackPageView. No knownPaths allowlist — App maps unknown paths to "/".
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!(e.target instanceof Element)) return;
      const anchor = e.target.closest("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("target")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      const url = new URL(href, location.origin);
      if (url.origin !== location.origin) return;
      e.preventDefault();
      navigate(href);
    };
    const controller = new AbortController();
    document.addEventListener("click", onClick, { signal: controller.signal });
    return () => controller.abort();
  }, [navigate]);

  return { path, navigate };
}
