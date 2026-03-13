import { defineConfig } from "vite";
import { feedFetchPlugin } from "@commons-systems/blog/blog-roll/vite-plugin-feed-fetch";

const FUNCTIONS_PORT = process.env.VITE_FUNCTIONS_EMULATOR_PORT ?? "5001";
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

export default defineConfig({
  plugins: [
    feedFetchPlugin([
      { id: "bastionland", url: "https://www.bastionland.com/feeds/posts/default" },
      { id: "new-school-revolution", url: "https://newschoolrevolution.com/feed/" },
      { id: "half-a-worm", url: "https://halfawormandabittenapple.blogspot.com/feeds/posts/default" },
    ]),
  ],
  resolve: {
    dedupe: ["firebase", "firebase/app", "firebase/analytics", "firebase/auth", "firebase/firestore"],
  },
  server: {
    proxy: {
      "/api/feed-proxy": {
        target: `http://localhost:${FUNCTIONS_PORT}`,
        rewrite: FIREBASE_PROJECT_ID
          ? (path) => path.replace("/api/feed-proxy", `/${FIREBASE_PROJECT_ID}/us-central1/feedProxy`)
          : undefined,
      },
    },
  },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
  },
});
