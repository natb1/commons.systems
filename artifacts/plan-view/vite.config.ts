import { createLibConfig } from "@commons-systems/config/vite";

// A lib config, not an app config: every test in this workspace exercises the
// BUILD-TIME half (payload derivation from the intention store), which is
// plain Node. The rendered page is verified by the from-disk render smoke
// (`scripts/render-smoke.mjs`), not by a jsdom/happy-dom suite — a
// self-contained artifact is testable as the real file it ships as.
export default createLibConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
});
