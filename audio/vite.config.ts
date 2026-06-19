import { createAppConfig } from "@commons-systems/config/vite";

export default createAppConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
