import { defineConfig } from "vite";

const FUNCTIONS_PORT = process.env.VITE_FUNCTIONS_EMULATOR_PORT ?? "5001";
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

export default defineConfig({
  server: {
    proxy: {
      "/feed.xml": {
        target: `http://localhost:${FUNCTIONS_PORT}`,
        rewrite: FIREBASE_PROJECT_ID
          ? () => `/${FIREBASE_PROJECT_ID}/us-central1/rssFeed`
          : undefined,
      },
    },
  },
  resolve: {
    dedupe: ["firebase", "firebase/app", "firebase/analytics", "firebase/auth", "firebase/firestore"],
  },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
  },
});
