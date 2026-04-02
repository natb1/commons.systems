import { deferProgrammerError } from "@commons-systems/errorutil/defer";

export interface Route {
  readonly path: `/${string}` | RegExp;
  readonly render: (path: string) => string | Promise<string>;
  /** See ./hydrate.ts for pattern selection guide (one-shot, observer-driven, async+staleness). */
  readonly afterRender?: (outlet: HTMLElement, path: string) => void;
}

export interface RouterOptions {
  /** Called with the parsed path and query params at the start of each navigation, before route matching. Exceptions do not prevent the route from rendering. Programmer errors are deferred as uncaught errors; other exceptions are caught and reported via reportError. */
  onNavigate?: (nav: { path: string; params: URLSearchParams }) => void;
  /** Map an error to a user-facing message. Return undefined to use "Something went wrong. Please try again." */
  formatError?: (error: unknown) => string | undefined;
}

export interface Router {
  navigate(): void;
  destroy(): void;
  showTerminalError(html: string): void;
}

function matchRoute(routes: [Route, ...Route[]], path: string): Route {
  return routes.find((r) =>
    typeof r.path === "string" ? r.path === path : r.path.test(path),
  ) ?? routes[0];
}

/**
 * Core navigation logic. Returns navigate, setDestroyed, and isDestroyed so
 * callers can wire up their own event listeners while reusing the rendering /
 * error-handling pipeline.
 */
function createNavigator(
  outlet: HTMLElement,
  routes: [Route, ...Route[]],
  resolvePath: () => { path: string; params: URLSearchParams },
  options?: RouterOptions,
): { navigate: () => Promise<void>; setDestroyed: () => void; isDestroyed: () => boolean } {
  let navigationId = 0;
  let destroyed = false;

  async function navigate(): Promise<void> {
    if (destroyed) return;
    const id = ++navigationId;
    const { path, params } = resolvePath();
    try {
      options?.onNavigate?.({ path, params });
    } catch (e) {
      if (!deferProgrammerError(e)) reportError(e);
    }
    const route = matchRoute(routes, path);
    try {
      const html = await route.render(path);
      if (id === navigationId) {
        outlet.innerHTML = html;
        try {
          route.afterRender?.(outlet, path);
        } catch (afterError) {
          if (deferProgrammerError(afterError)) return;
          reportError(afterError);
          outlet.insertAdjacentHTML(
            "beforeend",
            "<p>Some content failed to load. Try refreshing.</p>",
          );
        }
      }
    } catch (error) {
      if (!deferProgrammerError(error)) reportError(error);
      if (id === navigationId) {
        const message =
          options?.formatError?.(error) ??
          "Something went wrong. Please try again.";
        outlet.innerHTML = `<p>${message}</p>`;
      }
    }
  }

  return {
    navigate,
    setDestroyed: () => { destroyed = true; },
    isDestroyed: () => destroyed,
  };
}

export function parsePath(): { path: string; params: URLSearchParams } {
  return {
    path: location.pathname.replace(/\/$/, "") || "/",
    params: new URLSearchParams(location.search),
  };
}

/**
 * @param routes - Ordered route list. The first route serves as fallback when no path matches.
 */
export function createHistoryRouter(
  outlet: HTMLElement,
  routes: [Route, ...Route[]],
  options?: RouterOptions,
): Router {
  const nav = createNavigator(outlet, routes, parsePath, options);

  const onPopState = () => void nav.navigate();
  window.addEventListener("popstate", onPopState);

  const onClick = (e: MouseEvent) => {
    if (nav.isDestroyed()) return;
    if (e.button !== 0) return;
    const anchor = (e.target as Element).closest("a");
    if (!anchor) return;
    if (anchor.getAttribute("target") === "_blank") return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    e.preventDefault();
    history.pushState({}, "", href);
    void nav.navigate();
  };
  document.addEventListener("click", onClick);

  void nav.navigate();

  function teardown(): void {
    nav.setDestroyed();
    window.removeEventListener("popstate", onPopState);
    document.removeEventListener("click", onClick);
  }

  return {
    navigate: onPopState,
    destroy: teardown,
    showTerminalError(html: string) {
      teardown();
      outlet.innerHTML = html;
    },
  };
}
