/** Sets or updates the <link rel="canonical"> in the document head. */
export function updateCanonical(siteUrl: string, slug?: string): void {
  const href = slug ? `${siteUrl}/post/${encodeURIComponent(slug)}` : `${siteUrl}/`;
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
