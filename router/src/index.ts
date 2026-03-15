export interface Route {
  readonly path: `/${string}` | RegExp;
  readonly render: (path: string) => string | Promise<string>;
  readonly afterRender?: (outlet: HTMLElement, path: string) => void;
}

export interface RouterOptions {
  /** Called with the parsed path and query params at the start of each navigation, before route matching. Exceptions do not prevent the route from rendering. TypeError and ReferenceError are deferred as uncaught errors; other exceptions are caught and logged. */
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
 * Core navigation loop. Returns navigate, setDestroyed, and isDestroyed so
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
      if (e instanceof TypeError || e instanceof ReferenceError) {
        // Defer programming errors so they surface as uncaught in devtools
        setTimeout(() => { throw e; }, 0);
      } else {
        console.error("onNavigate error:", e);
      }
    }
    const route = matchRoute(routes, path);
    try {
      const html = await route.render(path);
      if (id === navigationId) {
        outlet.innerHTML = html;
        try {
          route.afterRender?.(outlet, path);
        } catch (afterError) {
          if (afterError instanceof TypeError || afterError instanceof ReferenceError) {
            // Return early so the outer catch doesn't replace rendered
            // content with a generic error message. Defer via setTimeout
            // so it surfaces as uncaught in devtools (rethrowing here
            // would only reject the navigate() promise, which is void-discarded).
            setTimeout(() => { throw afterError; }, 0);
            return;
          }
          console.error("afterRender error:", afterError);
          outlet.insertAdjacentHTML(
            "beforeend",
            "<p>Some content failed to load. Try refreshing.</p>",
          );
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
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
    path: location.pathname,
    params: new URLSearchParams(location.search),
  };
}

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
    const anchor = (e.target as Element).closest("a");
    if (!anchor) return;
    if (anchor.getAttribute("target") === "_blank") return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    try {
      const url = new URL(href, location.origin);
      if (url.origin !== location.origin) return;
    } catch (e) {
      console.warn("Failed to parse href for history routing:", href, e);
      return;
    }
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
