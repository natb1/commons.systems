// OG and description meta tag entries for both client-side SPA navigation
// (updateOgMeta) and build-time prerendering (prerender.ts). Client-side
// functions manipulate the live DOM; entry builders produce data consumed
// by both paths.
import type { PostMeta } from "./post-types.ts";
import { formatPageTitle } from "./page-title.ts";

export interface SiteDefaults {
  title: string;
  description: string;
  /** Absolute path from site root (e.g. "/tile10-armadillo-crag.webp"). Prepended with siteUrl for og:image. */
  image: string;
}

export type OgTagEntry = { attr: "property" | "name"; key: string; content: string };

const OG_PROPERTIES = ["og:title", "og:description", "og:image", "og:type", "og:url"] as const;
const TWITTER_NAMES = ["twitter:card", "twitter:title", "twitter:description", "twitter:image"] as const;

export function siteDefaultOgEntries(siteUrl: string, defaults: SiteDefaults): OgTagEntry[] {
  const imageUrl = `${siteUrl}${defaults.image}`;
  return [
    { attr: "name", key: "description", content: defaults.description },
    { attr: "property", key: "og:title", content: defaults.title },
    { attr: "property", key: "og:description", content: defaults.description },
    { attr: "property", key: "og:image", content: imageUrl },
    { attr: "property", key: "og:type", content: "website" },
    { attr: "property", key: "og:url", content: siteUrl },
    { attr: "name", key: "twitter:card", content: "summary_large_image" },
    { attr: "name", key: "twitter:title", content: defaults.title },
    { attr: "name", key: "twitter:description", content: defaults.description },
    { attr: "name", key: "twitter:image", content: imageUrl },
  ];
}

// Base twitter:card and twitter:title are emitted unconditionally here. Prerender reaches them for
// every post; on the client updateOgMeta path they only apply when previewDescription is present.
export function postOgEntries(siteUrl: string, post: PostMeta): OgTagEntry[] {
  const entries: OgTagEntry[] = [
    { attr: "property", key: "og:title", content: post.title },
    { attr: "property", key: "og:url", content: `${siteUrl}/post/${encodeURIComponent(post.id)}` },
    { attr: "property", key: "og:type", content: "article" },
    { attr: "name", key: "twitter:card", content: "summary_large_image" },
    { attr: "name", key: "twitter:title", content: post.title },
  ];
  if (post.previewDescription) {
    entries.push({ attr: "property", key: "og:description", content: post.previewDescription });
    entries.push({ attr: "name", key: "description", content: post.previewDescription });
    entries.push({ attr: "name", key: "twitter:description", content: post.previewDescription });
  }
  if (post.previewImage) {
    const imageUrl = `${siteUrl}${post.previewImage}`;
    entries.push({ attr: "property", key: "og:image", content: imageUrl });
    entries.push({ attr: "name", key: "twitter:image", content: imageUrl });
  }
  return entries;
}

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
  for (const name of TWITTER_NAMES) {
    document.querySelector(`meta[name="${name}"]`)?.remove();
  }
}

export function staticPageOgEntries(
  siteUrl: string,
  page: { url: string; title: string; description: string; image?: string; type?: "website" | "profile" },
): OgTagEntry[] {
  const entries: OgTagEntry[] = [
    { attr: "name", key: "description", content: page.description },
    { attr: "property", key: "og:title", content: page.title },
    { attr: "property", key: "og:description", content: page.description },
    { attr: "property", key: "og:type", content: page.type ?? "website" },
    { attr: "property", key: "og:url", content: `${siteUrl}${page.url}` },
    { attr: "name", key: "twitter:card", content: "summary_large_image" },
    { attr: "name", key: "twitter:title", content: page.title },
    { attr: "name", key: "twitter:description", content: page.description },
  ];
  if (page.image !== undefined) {
    const imageUrl = `${siteUrl}${page.image}`;
    entries.push({ attr: "property", key: "og:image", content: imageUrl });
    entries.push({ attr: "name", key: "twitter:image", content: imageUrl });
  }
  return entries;
}

export function updateStaticPageMeta(
  siteUrl: string,
  page: { url: string; title: string; description: string; image?: string; type?: "website" | "profile" },
  titleSuffix?: string,
): void {
  document.title = titleSuffix ? formatPageTitle(titleSuffix, page.title) : page.title;
  staticPageOgEntries(siteUrl, page).forEach((e) => setMetaTag(e.attr, e.key, e.content));
  if (page.image === undefined) {
    document.querySelector('meta[property="og:image"]')?.remove();
    document.querySelector('meta[name="twitter:image"]')?.remove();
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
    document.querySelector('meta[name="twitter:image"]')?.remove();
  }
}
