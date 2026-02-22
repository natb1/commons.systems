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
    const hash = location.hash.slice(1) || "/";
    const route = routes.find((r) => r.path === hash) ?? routes[0];
    const html = await route.render();
    if (id === navigationId) {
      outlet.innerHTML = html;
    }
  }

  window.addEventListener("hashchange", () => void navigate());
  void navigate();

  return () => void navigate();
}
