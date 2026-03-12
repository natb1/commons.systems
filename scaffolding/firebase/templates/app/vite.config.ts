import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    dedupe: ["firebase", "firebase/app", "firebase/analytics", "firebase/auth", "firebase/firestore"],
  },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
  },
});
