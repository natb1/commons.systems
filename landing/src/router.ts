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
): () => void {
  if (routes.length === 0) {
    throw new Error("createRouter requires at least one route");
  }
  let navigationId = 0;

  async function navigate(): Promise<void> {
    const id = ++navigationId;
    const hash = getHashPath();
    const route =
      routes.find((r) =>
        typeof r.path === "string" ? r.path === hash : r.path.test(hash),
      ) ?? routes[0];
    try {
      const html = await route.render(hash);
      if (id === navigationId) {
        outlet.innerHTML = html;
        try {
          route.afterRender?.(outlet, hash);
        } catch (afterError) {
          console.error("afterRender error:", afterError);
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
      if (id === navigationId) {
        outlet.innerHTML = "<p>Something went wrong. Please try again.</p>";
      }
    }
  }

  window.addEventListener("hashchange", () => void navigate());
  void navigate();

  return () => void navigate();
}
