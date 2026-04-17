import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import { generateSitemapXml } from "@commons-systems/blog/sitemap";
import appSeed from "../seeds/firestore.js";
import { BLOG_ROLL_ENTRIES } from "../src/blog-roll/config.js";
import {
  NAV_LINKS,
  INFO_PANEL_LINK_SECTIONS,
  SITE_DEFAULTS,
  SITE_URL,
  ORGANIZATION,
  AUTHOR,
  REL_ME,
  APPS,
  DEPENDENCIES,
} from "../src/site-config.js";
import { renderShowcase } from "../src/showcase-render.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

await prerenderPosts({
  siteUrl: SITE_URL,
  titleSuffix: "commons.systems",
  distDir,
  seed: appSeed,
  postDir: join(distDir, "..", "post"),
  navLinks: NAV_LINKS,
  infoPanel: {
    linkSections: INFO_PANEL_LINK_SECTIONS,
    blogRoll: BLOG_ROLL_ENTRIES,
    rssFeedUrl: "/feed.xml",
    opmlUrl: "/blogroll.opml",
  },
  siteDefaults: SITE_DEFAULTS,
  organization: ORGANIZATION,
  author: AUTHOR,
  relMe: REL_ME,
  softwareApplications: APPS,
  homeExtraHtml: renderShowcase(APPS, DEPENDENCIES),
});

generateFeedXml({
  title: "commons.systems",
  siteUrl: SITE_URL,
  distDir,
  seed: appSeed,
});

generateSitemapXml({
  siteUrl: SITE_URL,
  distDir,
  seed: appSeed,
});
