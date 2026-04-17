/** Updates (or creates) the canonical link element. Slug is URI-encoded; omit for the homepage. Browser-only — relies on document.head. */
export function updateCanonical(siteUrl: string, slug?: string): void {
  if (!siteUrl) throw new Error("updateCanonical: siteUrl is required");
  const href = slug ? `${siteUrl}/post/${encodeURIComponent(slug)}` : `${siteUrl}/`;
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
