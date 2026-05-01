import { dirname, join } from "node:path";
import {
  prerenderPosts,
  prerenderStaticPage,
} from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import { generateSitemapXml } from "@commons-systems/blog/sitemap";
import { personJsonLd } from "@commons-systems/blog/seo";
import appSeed from "../seeds/firestore.js";
import { BLOG_ROLL_ENTRIES } from "../src/blog-roll/config.js";
import {
  ABOUT_PAGE_META,
  APPS,
  AUTHOR,
  INFO_PANEL_LINK_SECTIONS,
  NAV_LINKS,
  ORGANIZATION,
  PERSON,
  REL_ME,
  SITE_DEFAULTS,
  SITE_URL,
} from "../src/site-config.js";
import { renderAboutHtml, renderAboutPanelHtml } from "../src/pages/about.js";
import { renderShowcase } from "../src/showcase-render.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
const postDir = join(distDir, "..", "post");
const titleSuffix = "commons.systems";
const infoPanel = {
  linkSections: INFO_PANEL_LINK_SECTIONS,
  blogRoll: BLOG_ROLL_ENTRIES,
  rssFeedUrl: "/feed.xml",
  opmlUrl: "/blogroll.opml",
};

// Static pages must run before prerenderPosts: prerenderPosts overwrites
// dist/index.html (the shared template source) with home content, after which
// prerenderStaticPage's marker-based injectors find the slots already filled.
prerenderStaticPage({
  siteUrl: SITE_URL,
  titleSuffix,
  distDir,
  path: "/about",
  pageTitle: ABOUT_PAGE_META.title,
  pageDescription: ABOUT_PAGE_META.description,
  pageType: ABOUT_PAGE_META.type,
  bodyHtml: renderAboutHtml(),
  navLinks: NAV_LINKS,
  panelHtml: renderAboutPanelHtml(),
  jsonLdBlocks: [personJsonLd(PERSON)],
  relMe: REL_ME,
});

await prerenderPosts({
  siteUrl: SITE_URL,
  titleSuffix,
  distDir,
  seed: appSeed,
  postDir,
  navLinks: NAV_LINKS,
  infoPanel,
  siteDefaults: SITE_DEFAULTS,
  organization: ORGANIZATION,
  author: AUTHOR,
  relMe: REL_ME,
  softwareApplications: APPS,
  homeExtraHtml: renderShowcase(APPS),
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
  staticPaths: ["/", "/about"],
});
