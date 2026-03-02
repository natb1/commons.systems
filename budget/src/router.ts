import { DataIntegrityError } from "./errors.js";

export interface Route {
  readonly path: `/${string}`;
  readonly render: () => string | Promise<string>;
}

export interface Router {
  navigate(): void;
  destroy(): void;
}

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

export function createRouter(
  outlet: HTMLElement,
  routes: [Route, ...Route[]],
): Router {
  let navigationId = 0;

  async function navigate(): Promise<void> {
    const id = ++navigationId;
    const { path } = parseHash();
    const route = routes.find((r) => r.path === path) ?? routes[0];
    try {
      const html = await route.render();
      if (id === navigationId) {
        outlet.innerHTML = html;
      }
    } catch (error) {
      // Terminal error boundary — errors are displayed, not propagated.
      // DataIntegrityError and RangeError indicate corrupted data;
      // all other errors get a generic message.
      console.error("Navigation error:", error);
      if (id === navigationId) {
        const message = error instanceof RangeError || error instanceof DataIntegrityError
          ? "A data error occurred. Please contact support."
          : "Something went wrong. Please try again.";
        outlet.innerHTML = `<p>${message}</p>`;
      }
    }
  }

  const onHashChange = () => void navigate();
  window.addEventListener("hashchange", onHashChange);
  void navigate();

  return {
    navigate: onHashChange,
    destroy: () => window.removeEventListener("hashchange", onHashChange),
  };
}
