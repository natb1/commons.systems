import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import appSeed from "../seeds/firestore.js";
import { BLOG_ROLL_ENTRIES } from "../src/blog-roll/config.js";
import { NAV_LINKS, INFO_PANEL_LINK_SECTIONS } from "../src/site-config.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

await prerenderPosts({
  siteUrl: "https://commons.systems",
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
});

generateFeedXml({
  title: "commons.systems",
  siteUrl: "https://commons.systems",
  distDir,
  seed: appSeed,
});
