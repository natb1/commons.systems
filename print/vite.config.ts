import { createAppConfig } from "@commons-systems/config/vite";

export default createAppConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  optimizeDeps: { esbuildOptions: { target: "es2022" } },
  resolve: {
    dedupe: ["react", "react-dom", "firebase/storage", "pdfjs-dist", "epubjs"],
  },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
