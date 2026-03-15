import type { PostMeta } from "./post-types.js";

const OG_PROPERTIES = ["og:title", "og:description", "og:image", "og:type"] as const;

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

export function updateOgMeta(siteUrl: string, post: PostMeta | undefined): void {
  if (!post?.previewDescription) {
    removeOgTags();
    return;
  }
  setOgTag("og:title", post.title);
  setOgTag("og:description", post.previewDescription);
  setOgTag("og:type", "article");
  if (post.previewImage) {
    setOgTag("og:image", `${siteUrl}${post.previewImage}`);
  }
}
