export interface Route {
  path: string | RegExp;
  render: (hash: string) => string | Promise<string>;
}

export function createRouter(
  outlet: HTMLElement,
  routes: Route[],
): () => void {
  let navigationId = 0;

  async function navigate(): Promise<void> {
    const id = ++navigationId;
    const hash = location.hash.slice(1) || "/";
    const route =
      routes.find((r) =>
        typeof r.path === "string" ? r.path === hash : r.path.test(hash),
      ) ?? routes[0];
    try {
      const html = await route.render(hash);
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
