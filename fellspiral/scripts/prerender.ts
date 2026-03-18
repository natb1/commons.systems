import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import { generateFeedXml } from "@commons-systems/blog/feed";
import appSeed from "../seeds/firestore.js";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

prerenderPosts({
  siteUrl: "https://fellspiral.commons.systems",
  titleSuffix: "fellspiral",
  distDir,
  seed: appSeed,
});

generateFeedXml({
  title: "fellspiral",
  siteUrl: "https://fellspiral.commons.systems",
  distDir,
  seed: appSeed,
});
