import { createAppConfig } from "@commons-systems/config/vite";
import { feedFetchPlugin } from "@commons-systems/blog/blog-roll/vite-plugin-feed-fetch";
import { FEED_REGISTRY } from "@commons-systems/blog/blog-roll/feed-registry";

const FUNCTIONS_PORT = process.env.VITE_FUNCTIONS_EMULATOR_PORT ?? "5001";
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

export default createAppConfig({
  plugins: [
    feedFetchPlugin(FEED_REGISTRY.map((f) => ({ id: f.id, url: f.feedUrl }))),
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
