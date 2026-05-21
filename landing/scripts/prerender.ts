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

// prerenderStaticPage must run before prerenderPosts. prerenderPosts rewrites
// dist/index.html (the shared template) into the finished home page, injecting
// the home's own og/canonical/JSON-LD tags into <head>. prerenderStaticPage
// reads dist/index.html as its template and injectBeforeHead only *prepends*
// its <head> tags — it never strips pre-existing ones — so running it second
// would leave /about with the home page's SEO tags duplicated alongside its own.
prerenderStaticPage({
  siteUrl: SITE_URL,
  titleSuffix,
  distDir,
  page: ABOUT_PAGE_META,
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
