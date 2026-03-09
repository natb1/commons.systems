import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    dedupe: [
      "firebase",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/storage",
    ],
  },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
  },
});
