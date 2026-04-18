import { escapeHtml } from "@commons-systems/htmlutil";
import type { PublishedPost } from "./post-types.ts";

export interface Organization {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
}

export interface Author {
  name: string;
  url?: string;
}

export interface SoftwareApplication {
  name: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  description?: string;
}

export function softwareApplicationJsonLd(app: SoftwareApplication): Record<string, unknown> {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    url: app.url,
    applicationCategory: app.applicationCategory,
    operatingSystem: app.operatingSystem,
  };
  if (app.description !== undefined) json.description = app.description;
  return json;
}

export function organizationJsonLd(org: Organization): Record<string, unknown> {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    logo: org.logo,
  };
  if (org.sameAs && org.sameAs.length > 0) json.sameAs = org.sameAs;
  return json;
}

export function blogPostingJsonLd(
  post: PublishedPost,
  siteUrl: string,
  author: Author,
): Record<string, unknown> {
  const postUrl = `${siteUrl}/post/${encodeURIComponent(post.id)}`;
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    author: author.url
      ? { "@type": "Person", name: author.name, url: author.url }
      : { "@type": "Person", name: author.name },
    url: postUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  };
  if (post.previewDescription) json.description = post.previewDescription;
  if (post.previewImage) json.image = `${siteUrl}${post.previewImage}`;
  return json;
}

// Embedding JSON inside <script> requires escaping </script> sequences and
// Unicode line separators that can break script parsing. Also escapes < > &
// for defense-in-depth in case the JSON ends up in an unexpected context.
export function jsonLdScriptTag(json: Record<string, unknown>): string {
  const safe = JSON.stringify(json)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `<script type="application/ld+json">${safe}</script>`;
}

export function canonicalLinkTag(url: string): string {
  return `<link rel="canonical" href="${escapeHtml(url)}">`;
}

export function relMeLinkTags(urls: string[]): string {
  return urls.map((u) => `<link rel="me" href="${escapeHtml(u)}">`).join("\n    ");
}
