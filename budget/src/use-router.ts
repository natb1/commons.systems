// Minimal client router, replacing the legacy createHistoryRouter call. Mirrors
// router/src/index.ts semantics: path state from location.pathname, a popstate
// listener, and a document click interceptor for internal same-origin links that
// match a known route. trackPageView fires on the initial mount and each path
// change (mirrors main.ts:139 onNavigate). The route bodies themselves are
// rendered by <LegacyRoute>, not here.
import { useEffect, useState } from "react";
import { trackPageView } from "./firebase.js";

function currentPath(): string {
  return location.pathname.replace(/\/$/, "") || "/";
}

export function useRouter(knownPaths: readonly string[]): string {
  const [path, setPath] = useState<string>(() => currentPath());

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("target")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      const url = new URL(href, location.origin);
      if (url.origin !== location.origin) return;
      const target = url.pathname.replace(/\/$/, "") || "/";
      if (!knownPaths.includes(target)) return;
      e.preventDefault();
      history.pushState({}, "", href);
      setPath(target);
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick);
    };
  }, [knownPaths]);

  // onNavigate: fire trackPageView on initial mount and every path change.
  useEffect(() => {
    trackPageView(path);
  }, [path]);

  return path;
}
