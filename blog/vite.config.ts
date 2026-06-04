import { createLibConfig } from "@commons-systems/config/vite";

export default createLibConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./test/setup-dompurify.ts"],
  },
});
