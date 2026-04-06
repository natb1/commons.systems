import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import { FEED_REGISTRY } from "@commons-systems/blog/blog-roll/feed-registry";
import appSeed from "../seeds/firestore.js";
import { NAV_LINKS, INFO_PANEL_LINK_SECTIONS, SITE_DEFAULTS } from "../src/site-config.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

await prerenderPosts({
  siteUrl: "https://fellspiral.commons.systems",
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
});

generateFeedXml({
  title: "fellspiral",
  siteUrl: "https://fellspiral.commons.systems",
  distDir,
  seed: appSeed,
});
