export interface Route {
  path: string;
  render: () => string | Promise<string>;
}

export function createRouter(
  outlet: HTMLElement,
  routes: Route[],
): () => void {
  let navigationId = 0;

  async function navigate(): Promise<void> {
    const id = ++navigationId;
    const raw = location.hash.slice(1) || "/";
    const path = raw.split("?")[0];
    const route = routes.find((r) => r.path === path) ?? routes[0];
    try {
      const html = await route.render();
      if (id === navigationId) {
        outlet.innerHTML = html;
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
