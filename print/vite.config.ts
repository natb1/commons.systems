import { createAppConfig } from "@commons-systems/config/vite";

export default createAppConfig({
  build: {
    target: "esnext",
  },
  resolve: {
    dedupe: ["firebase/storage", "pdfjs-dist", "epubjs"],
  },
});
