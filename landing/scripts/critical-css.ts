import { dirname, join } from "node:path";
import { inlineCriticalCss } from "@commons-systems/criticalcssutil";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
await inlineCriticalCss(distDir);
