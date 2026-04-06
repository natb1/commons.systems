// Client-side meta tag management for SPA navigation — sets document.title,
// <meta name="description">, and OG tags. Build-time counterpart
// (blog/src/prerender.ts) generates static equivalents for crawlers.
import type { PostMeta } from "./post-types.ts";
import { formatPageTitle } from "./page-title.ts";

export interface SiteDefaults {
  title: string;
  description: string;
  /** Absolute path from site root (e.g. "/tile10-armadillo-crag.webp"). Prepended with siteUrl for og:image. */
  image: string;
}

export type OgTagEntry = { attr: "property" | "name"; key: string; content: string };

export function siteDefaultOgEntries(siteUrl: string, defaults: SiteDefaults): OgTagEntry[] {
  return [
    { attr: "name", key: "description", content: defaults.description },
    { attr: "property", key: "og:title", content: defaults.title },
    { attr: "property", key: "og:description", content: defaults.description },
    { attr: "property", key: "og:image", content: `${siteUrl}${defaults.image}` },
    { attr: "property", key: "og:type", content: "website" },
    { attr: "property", key: "og:url", content: siteUrl },
  ];
}

export function postOgEntries(siteUrl: string, post: PostMeta): OgTagEntry[] {
  const entries: OgTagEntry[] = [
    { attr: "property", key: "og:title", content: post.title },
    { attr: "property", key: "og:url", content: `${siteUrl}/post/${encodeURIComponent(post.id)}` },
    { attr: "property", key: "og:type", content: "article" },
  ];
  if (post.previewDescription) {
    entries.push({ attr: "property", key: "og:description", content: post.previewDescription });
    entries.push({ attr: "name", key: "description", content: post.previewDescription });
  }
  if (post.previewImage) {
    entries.push({ attr: "property", key: "og:image", content: `${siteUrl}${post.previewImage}` });
  }
  return entries;
}

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

export function updateOgMeta(
  siteUrl: string,
  post: PostMeta | undefined,
  titleSuffix?: string,
  siteDefaults?: SiteDefaults,
): void {
  if (!post?.previewDescription) {
    if (siteDefaults) {
      if (titleSuffix) document.title = titleSuffix;
      siteDefaultOgEntries(siteUrl, siteDefaults).forEach((e) => setMetaTag(e.attr, e.key, e.content));
    } else {
      removeOgTags();
      document.querySelector('meta[name="description"]')?.remove();
      if (titleSuffix) document.title = titleSuffix;
    }
    return;
  }
  document.title = titleSuffix ? formatPageTitle(titleSuffix, post.title) : post.title;
  postOgEntries(siteUrl, post).forEach((e) => setMetaTag(e.attr, e.key, e.content));
  if (!post.previewImage) {
    document.querySelector('meta[property="og:image"]')?.remove();
  }
}
