import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import { generateSitemapXml } from "@commons-systems/blog/sitemap";
import { FEED_REGISTRY } from "@commons-systems/blog/blog-roll/feed-registry";
import appSeed from "../seeds/firestore.js";
import {
  NAV_LINKS,
  INFO_PANEL_LINK_SECTIONS,
  SITE_DEFAULTS,
  SITE_URL,
  ORGANIZATION,
  AUTHOR,
  REL_ME,
} from "../src/site-config.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

await prerenderPosts({
  siteUrl: SITE_URL,
  titleSuffix: "Fellspiral",
  distDir,
  seed: appSeed,
  postDir: join(distDir, "..", "post"),
  navLinks: NAV_LINKS,
  infoPanel: {
    linkSections: INFO_PANEL_LINK_SECTIONS,
    blogRoll: FEED_REGISTRY.map((f) => ({ id: f.id, name: f.name, url: f.homeUrl })),
    rssFeedUrl: "/feed.xml",
    opmlUrl: "/blogroll.opml",
  },
  siteDefaults: SITE_DEFAULTS,
  organization: ORGANIZATION,
  author: AUTHOR,
  relMe: REL_ME,
});

generateFeedXml({
  title: "fellspiral",
  siteUrl: SITE_URL,
  distDir,
  seed: appSeed,
});

generateSitemapXml({
  siteUrl: SITE_URL,
  distDir,
  seed: appSeed,
});
