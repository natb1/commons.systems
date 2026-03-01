import { DataIntegrityError } from "./errors.js";

export interface Route {
  path: string;
  render: () => string | Promise<string>;
}

export interface Router {
  navigate(): void;
  destroy(): void;
}

export function parseHash(): { path: string; params: URLSearchParams } {
  const hash = location.hash.slice(1) || "/";
  const qIndex = hash.indexOf("?");
  return qIndex === -1
    ? { path: hash, params: new URLSearchParams() }
    : { path: hash.slice(0, qIndex), params: new URLSearchParams(hash.slice(qIndex + 1)) };
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
    navigate: () => void navigate(),
    destroy: () => window.removeEventListener("hashchange", onHashChange),
  };
}
