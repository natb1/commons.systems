/** Updates (or creates) the canonical link element. Slug is URI-encoded for post URLs; omit for the homepage. `explicitPath` overrides both branches with a literal path (must start with `/`) — use for static pages like `/about`. Browser-only — relies on document.head. */
export function updateCanonical(siteUrl: string, slug?: string, explicitPath?: string): void {
  if (!siteUrl) throw new Error("updateCanonical: siteUrl is required");
  let href: string;
  if (explicitPath !== undefined) {
    if (!explicitPath.startsWith("/")) throw new Error("updateCanonical: explicitPath must start with '/'");
    href = `${siteUrl}${explicitPath}`;
  } else if (slug) {
    href = `${siteUrl}/post/${encodeURIComponent(slug)}`;
  } else {
    href = `${siteUrl}/`;
  }
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
