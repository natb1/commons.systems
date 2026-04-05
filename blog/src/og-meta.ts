// Client-side meta tag management for SPA navigation — sets document.title,
// <meta name="description">, and OG tags. Build-time counterpart
// (blog/src/prerender.ts) generates static equivalents for crawlers.
import type { PostMeta } from "./post-types.ts";
import { formatPageTitle } from "./page-title.ts";

const OG_PROPERTIES = ["og:title", "og:description", "og:image", "og:type", "og:url"] as const;

function setMetaTag(attr: "property" | "name", value: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeOgTags(): void {
  for (const property of OG_PROPERTIES) {
    document.querySelector(`meta[property="${property}"]`)?.remove();
  }
}

export function updateOgMeta(siteUrl: string, post: PostMeta | undefined, titleSuffix?: string): void {
  if (!post?.previewDescription) {
    removeOgTags();
    document.querySelector('meta[name="description"]')?.remove();
    if (titleSuffix) document.title = titleSuffix;
    return;
  }
  document.title = titleSuffix ? formatPageTitle(titleSuffix, post.title) : post.title;
  setMetaTag("name", "description", post.previewDescription);
  setMetaTag("property", "og:title", post.title);
  setMetaTag("property", "og:description", post.previewDescription);
  setMetaTag("property", "og:type", "article");
  setMetaTag("property", "og:url", `${siteUrl}/post/${encodeURIComponent(post.id)}`);
  if (post.previewImage) {
    setMetaTag("property", "og:image", `${siteUrl}${post.previewImage}`);
  } else {
    document.querySelector('meta[property="og:image"]')?.remove();
  }
}
