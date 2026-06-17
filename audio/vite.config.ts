import { createAppConfig } from "@commons-systems/config/vite";

export default createAppConfig({
  optimizeDeps: { esbuildOptions: { target: "esnext" } },
});
