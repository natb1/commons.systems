export interface Route {
  path: string;
  render: () => string;
}

export function createRouter(outlet: HTMLElement, routes: Route[]): void {
  function navigate(): void {
    const hash = location.hash.slice(1) || "/";
    const route = routes.find((r) => r.path === hash) ?? routes[0];
    outlet.innerHTML = route.render();
  }

  window.addEventListener("hashchange", navigate);
  navigate();
}
