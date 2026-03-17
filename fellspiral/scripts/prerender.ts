import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import appSeed from "../seeds/firestore.js";

prerenderPosts({
  siteUrl: "https://fellspiral.commons.systems",
  titleSuffix: "fellspiral",
  distDir: join(dirname(new URL(import.meta.url).pathname), "..", "dist"),
  seed: appSeed,
});
