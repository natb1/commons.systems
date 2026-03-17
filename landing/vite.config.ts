import { createAppConfig } from "@commons-systems/config/vite";

const FUNCTIONS_PORT = process.env.VITE_FUNCTIONS_EMULATOR_PORT ?? "5001";
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

export default createAppConfig({
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
});
