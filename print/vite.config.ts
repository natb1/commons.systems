import { createAppConfig } from "@commons-systems/config/vite";

export default createAppConfig({
  resolve: {
    dedupe: ["firebase/storage", "pdfjs-dist", "epubjs"],
  },
});
