import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import appSeed from "../seeds/firestore.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

prerenderPosts({
  siteUrl: "https://commons.systems",
  titleSuffix: "commons.systems",
  distDir,
  seed: appSeed,
});

generateFeedXml({
  title: "commons.systems",
  siteUrl: "https://commons.systems",
  distDir,
  seed: appSeed,
});
