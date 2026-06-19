import { createAppConfig } from "@commons-systems/config/vite";

export default createAppConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  resolve: {
    dedupe: ["react", "react-dom", "firebase/storage", "pdfjs-dist", "epubjs"],
  },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
