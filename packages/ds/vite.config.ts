import { createLibConfig } from "@commons-systems/config/vite";

export default createLibConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
