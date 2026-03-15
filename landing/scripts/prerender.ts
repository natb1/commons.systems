import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import appSeed from "../seeds/firestore.js";

prerenderPosts({
  siteUrl: "https://commons.systems",
  titleSuffix: "commons.systems",
  distDir: join(dirname(new URL(import.meta.url).pathname), "..", "dist"),
  seed: appSeed,
});
