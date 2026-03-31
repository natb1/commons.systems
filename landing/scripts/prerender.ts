import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import appSeed from "../seeds/firestore.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

await prerenderPosts({
  siteUrl: "https://commons.systems",
  titleSuffix: "commons.systems",
  distDir,
  seed: appSeed,
  postDir: join(distDir, "..", "post"),
  navLinks: [{ href: "/", label: "Home" }],
  infoPanel: {
    linkSections: [
      {
        heading: "Links",
        links: [
          { label: "Source", url: "https://github.com/natb1/commons.systems" },
        ],
      },
    ],
    blogRoll: [
      { id: "anthropic-engineering", name: "Anthropic Engineering", url: "https://www.anthropic.com/engineering" },
      { id: "claude-code-blog", name: "Claude Code Blog", url: "https://claude.com/blog/category/claude-code" },
    ],
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
