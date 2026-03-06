export function parseHash(): { path: string; params: URLSearchParams } {
  const hash = location.hash.slice(1) || "/";
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) {
    return { path: hash, params: new URLSearchParams() };
  }
  return {
    path: hash.slice(0, qIndex),
    params: new URLSearchParams(hash.slice(qIndex + 1)),
  };
}

export interface Route {
  readonly path: string | RegExp;
  readonly render: (hash: string) => string | Promise<string>;
  readonly afterRender?: (outlet: HTMLElement, hash: string) => void;
}

export interface RouterOptions {
  onNavigate?: () => void;
  /** Map an error to a user-facing message. Return undefined for the default. */
  formatError?: (error: unknown) => string | undefined;
}

export interface Router {
  navigate(): void;
  destroy(): void;
  showTerminalError(html: string): void;
}

export function createRouter(
  outlet: HTMLElement,
  routes: [Route, ...Route[]],
  options?: RouterOptions,
): Router {
  let navigationId = 0;
  let destroyed = false;

  async function navigate(): Promise<void> {
    if (destroyed) return;
    options?.onNavigate?.();
    const id = ++navigationId;
    const { path } = parseHash();
    const route =
      routes.find((r) =>
        typeof r.path === "string" ? r.path === path : r.path.test(path),
      ) ?? routes[0];
    try {
      const html = await route.render(path);
      if (id === navigationId) {
        outlet.innerHTML = html;
        try {
          route.afterRender?.(outlet, path);
        } catch (afterError) {
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

  const onHashChange = () => void navigate();
  window.addEventListener("hashchange", onHashChange);
  void navigate();

  return {
    navigate: onHashChange,
    destroy() {
      destroyed = true;
      window.removeEventListener("hashchange", onHashChange);
    },
    showTerminalError(html: string) {
      this.destroy();
      outlet.innerHTML = html;
    },
  };
}
