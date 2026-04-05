// Client-side OG tag management for SPA navigation. Build-time counterpart
// (blog/src/prerender.ts) generates static copies for crawlers.
import type { PostMeta } from "./post-types.ts";

const OG_PROPERTIES = ["og:title", "og:description", "og:image", "og:type", "og:url"] as const;

function setOgTag(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeOgTags(): void {
  for (const property of OG_PROPERTIES) {
    document.querySelector(`meta[property="${property}"]`)?.remove();
  }
}

function setDescriptionTag(content: string): void {
  let el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "description");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function updateOgMeta(siteUrl: string, post: PostMeta | undefined, titleSuffix?: string): void {
  if (!post?.previewDescription) {
    removeOgTags();
    if (titleSuffix) document.title = titleSuffix;
    return;
  }
  document.title = titleSuffix ? `${titleSuffix} - ${post.title}` : post.title;
  setDescriptionTag(post.previewDescription);
  setOgTag("og:title", post.title);
  setOgTag("og:description", post.previewDescription);
  setOgTag("og:type", "article");
  setOgTag("og:url", `${siteUrl}/post/${encodeURIComponent(post.id)}`);
  if (post.previewImage) {
    setOgTag("og:image", `${siteUrl}${post.previewImage}`);
  } else {
    document.querySelector('meta[property="og:image"]')?.remove();
  }
}
