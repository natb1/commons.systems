import { createLibConfig } from "@commons-systems/config/vite";

export default createLibConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  // The shared config's glob is "test/**/*.test.ts", which does not match the
  // React region tests (*.test.tsx). mergeConfig concatenates the include
  // arrays, so this adds .tsx collection without dropping the inherited .ts
  // glob. (The shared config matching .test.{ts,tsx} repo-wide is the greenfield
  // fix; this local override is the in-scope step.)
  test: { environment: "happy-dom", include: ["test/**/*.test.tsx"] },
});
