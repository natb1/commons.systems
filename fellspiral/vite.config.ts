import { createAppConfig } from "@commons-systems/config/vite";
import { feedFetchPlugin } from "@commons-systems/blog/blog-roll/vite-plugin-feed-fetch";
import { feedXmlPlugin } from "@commons-systems/blog/vite-plugin-feed-xml";
import { buildFeedXml } from "@commons-systems/blog/feed";
import { FEED_REGISTRY } from "@commons-systems/blog/blog-roll/feed-registry";
import appSeed from "./seeds/firestore.js";

const FUNCTIONS_PORT = process.env.VITE_FUNCTIONS_EMULATOR_PORT ?? "5001";
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

export default createAppConfig({
  plugins: [
    feedFetchPlugin(FEED_REGISTRY.map((f) => ({ id: f.id, url: f.feedUrl }))),
    feedXmlPlugin(() =>
      buildFeedXml({
        title: "fellspiral",
        siteUrl: "https://fellspiral.commons.systems",
        seed: appSeed,
      }),
    ),
  ],
  server: {
    proxy: {
      "/api/feed-proxy": {
        target: `http://localhost:${FUNCTIONS_PORT}`,
        rewrite: FIREBASE_PROJECT_ID
          ? (path: string) =>
              path.replace(
                "/api/feed-proxy",
                `/${FIREBASE_PROJECT_ID}/us-central1/feedProxy`,
              )
          : undefined,
      },
    },
  },
});
