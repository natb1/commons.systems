import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import { escapeHtml } from "@commons-systems/htmlutil";
import { validatePublishedPosts } from "./post-types.ts";

export interface SitemapConfig {
  siteUrl: string;
  seed: Pick<SeedSpec, "collections">;
  /** Paths to include in addition to posts — always includes "/" unless overridden. */
  staticPaths?: string[];
  postLinkPrefix?: string;
}

export interface SitemapFileConfig extends SitemapConfig {
  distDir: string;
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
}

function urlEntry(entry: UrlEntry): string {
  const lastmod = entry.lastmod ? `\n    <lastmod>${escapeHtml(entry.lastmod)}</lastmod>` : "";
  return `  <url>
    <loc>${escapeHtml(entry.loc)}</loc>${lastmod}
  </url>`;
}

/** Returns sitemap XML string from seed data. Pure function used by the Vite dev plugin and prerender script. */
export function buildSitemapXml(config: SitemapConfig): string {
  const { siteUrl, seed, staticPaths = ["/"], postLinkPrefix = "/post/" } = config;

  const published = validatePublishedPosts(seed);
  published.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const mostRecent = published[0]?.publishedAt;

  const entries: UrlEntry[] = staticPaths.map((path) => ({
    loc: `${siteUrl}${path}`,
    lastmod: path === "/" ? mostRecent : undefined,
  }));

  for (const post of published) {
    entries.push({
      loc: `${siteUrl}${postLinkPrefix}${encodeURIComponent(post.id)}`,
      lastmod: post.publishedAt,
    });
  }

  const urls = entries.map(urlEntry).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/** Builds sitemap XML and writes sitemap.xml to distDir. Called by prerender scripts. */
export function generateSitemapXml(config: SitemapFileConfig): void {
  const xml = buildSitemapXml(config);
  writeFileSync(join(config.distDir, "sitemap.xml"), xml);
  console.log("Generated: /sitemap.xml");
}
