import { resolve } from "node:path";
import { createAppConfig } from "@commons-systems/config/vite";
import { feedXmlPlugin } from "@commons-systems/blog/vite-plugin-feed-xml";
import { blogPostsPlugin } from "@commons-systems/blog/vite-plugin-blog-posts";
import { buildFeedXml } from "@commons-systems/blog/feed";
import appSeed from "./seeds/firestore.js";

export default createAppConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  // Pin dev prebundling to es2022 — matching the production build.target in
  // shared config/vite.js — so esbuild 0.28.x leaves rest-destructuring in
  // @firebase/analytics untouched instead of crashing the dev server.
  optimizeDeps: { esbuildOptions: { target: "es2022" } },
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
