export function getHashPath(): string {
  return location.hash.slice(1) || "/";
}

export interface Route {
  path: string | RegExp;
  render: (hash: string) => string | Promise<string>;
  afterRender?: (outlet: HTMLElement, hash: string) => void;
}

export function createRouter(
  outlet: HTMLElement,
  routes: Route[],
  options?: { onNavigate?: () => void },
): () => void {
  if (routes.length === 0) {
    throw new Error("createRouter requires at least one route");
  }
  let navigationId = 0;

  async function navigate(): Promise<void> {
    options?.onNavigate?.();
    const id = ++navigationId;
    const hash = getHashPath();
    const route = routes.find((r) =>
      typeof r.path === "string" ? r.path === hash : r.path.test(hash),
    );
    if (!route) {
      console.warn(`No route matched hash "${hash}", falling back to default route`);
    }
    const matched = route ?? routes[0];
    try {
      const html = await matched.render(hash);
      if (id === navigationId) {
        outlet.innerHTML = html;
        try {
          matched.afterRender?.(outlet, hash);
        } catch (afterError) {
          console.error("afterRender error:", afterError);
          outlet.insertAdjacentHTML("beforeend", "<p>Some content failed to load. Try refreshing.</p>");
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
      if (id === navigationId) {
        outlet.innerHTML = "<p>Something went wrong. Try refreshing the page.</p>";
      }
    }
  }

  window.addEventListener("hashchange", () => void navigate());
  void navigate();

  return () => void navigate();
}
