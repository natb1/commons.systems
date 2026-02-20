export interface Route {
  path: string;
  render: () => string | Promise<string>;
}

export function createRouter(
  outlet: HTMLElement,
  routes: Route[],
): () => void {
  async function navigate(): Promise<void> {
    const hash = location.hash.slice(1) || "/";
    const route = routes.find((r) => r.path === hash) ?? routes[0];
    const html = await route.render();
    outlet.innerHTML = html;
  }

  window.addEventListener("hashchange", () => void navigate());
  void navigate();

  return () => void navigate();
}
