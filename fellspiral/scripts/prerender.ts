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
import { readBlogRollFeedsArtifact } from "./blog-roll-feeds-artifact.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

// The build-time feed snapshot the vite `feedFetchPlugin` persisted, keyed by
// FEED_REGISTRY id (the same data the client's `virtual:blog-roll-feeds` bundle
// inlines). Passed below as `buildTimeFeeds` so the prerendered info-panel
// hydrates from identical input — closing the SSR/client mismatch on the panel
// root. Throws on a missing/drifted artifact (the build-time parity assertion).
const buildTimeFeeds = readBlogRollFeedsArtifact(FEED_REGISTRY.map((f) => f.id));

try {
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
      buildTimeFeeds,
    },
    siteDefaults: SITE_DEFAULTS,
    organization: ORGANIZATION,
    author: AUTHOR,
    relMe: REL_ME,
    // Single PageShell root. Must stay byte-identical to the `shell` config in
    // fellspiral/src/main.ts, or the client's hydrateRoot mismatches. The shell
    // renders the ds <Footer/> itself, so no footer markup is injected here (the
    // ds Footer is the same markup @commons-systems/components/footer re-exports).
    shell: {
      mount: "root",
      wordmark: "fellspiral",
      panelAriaLabel: "Info",
    },
    showHomeLink: true,
  });
} catch (err) {
  throw new Error(
    `Prerender failed in fellspiral/scripts/prerender.ts (prerenderPosts): ${
      err instanceof Error ? err.message : String(err)
    }`,
    { cause: err },
  );
}

try {
  generateFeedXml({
    title: "fellspiral",
    siteUrl: SITE_URL,
    distDir,
    seed: appSeed,
  });
} catch (err) {
  throw new Error(
    `Prerender failed in fellspiral/scripts/prerender.ts (generateFeedXml): ${
      err instanceof Error ? err.message : String(err)
    }`,
    { cause: err },
  );
}

try {
  generateSitemapXml({
    siteUrl: SITE_URL,
    distDir,
    seed: appSeed,
  });
} catch (err) {
  throw new Error(
    `Prerender failed in fellspiral/scripts/prerender.ts (generateSitemapXml): ${
      err instanceof Error ? err.message : String(err)
    }`,
    { cause: err },
  );
}
