import { createLibConfig } from "@commons-systems/config/vite";

export default createLibConfig({
  test: {
    // Tests share a single Firebase emulator — parallel files cause data races
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
