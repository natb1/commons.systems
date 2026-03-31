import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import { FEED_REGISTRY } from "@commons-systems/blog/blog-roll/feed-registry";
import appSeed from "../seeds/firestore.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

prerenderPosts({
  siteUrl: "https://fellspiral.commons.systems",
  titleSuffix: "fellspiral",
  distDir,
  seed: appSeed,
  postDir: join(distDir, "..", "post"),
  navLinks: [{ href: "/", label: "Home" }],
  infoPanel: {
    linkSections: [
      {
        links: [
          { label: "itch.io", url: "https://natethenoob.itch.io" },
          { label: "No Land Beyond", subtitle: "Find a Local Game in Baltimore", url: "https://discord.gg/MxXHfyY3" },
        ],
      },
      {
        heading: "Games I'm Playing",
        links: [
          { label: "Mythic Bastionland", url: "https://chrismcdee.itch.io/mythic-bastionland" },
          { label: "ALIEN", url: "https://freeleaguepublishing.com/games/alien/" },
          { label: "Cairn", url: "https://cairnrpg.com/" },
        ],
      },
    ],
    blogRoll: FEED_REGISTRY.map((f) => ({ id: f.id, name: f.name, url: f.homeUrl })),
    rssFeedUrl: "/feed.xml",
    opmlUrl: "/blogroll.opml",
  },
});

generateFeedXml({
  title: "fellspiral",
  siteUrl: "https://fellspiral.commons.systems",
  distDir,
  seed: appSeed,
});
