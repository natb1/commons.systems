import { dirname, join } from "node:path";
import { prerenderPosts } from "@commons-systems/blog/prerender";
import appSeed from "../seeds/firestore.js";

prerenderPosts({
  siteUrl: "https://cs-fellspiral-4e12.web.app",
  titleSuffix: "fellspiral",
  distDir: join(dirname(new URL(import.meta.url).pathname), "..", "dist"),
  seed: appSeed,
});
