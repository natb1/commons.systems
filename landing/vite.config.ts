import { resolve } from "node:path";
import { createAppConfig } from "@commons-systems/config/vite";
import { feedXmlPlugin } from "@commons-systems/blog/vite-plugin-feed-xml";
import { blogPostsPlugin } from "@commons-systems/blog/vite-plugin-blog-posts";
import { buildFeedXml } from "@commons-systems/blog/feed";
import appSeed from "./seeds/firestore.js";

export default createAppConfig({
  plugins: [
    blogPostsPlugin({ seed: appSeed, postDir: resolve(__dirname, "post") }),
    feedXmlPlugin(() =>
      buildFeedXml({
        title: "commons.systems",
        siteUrl: "https://commons.systems",
        seed: appSeed,
      }),
    ),
  ],
});
