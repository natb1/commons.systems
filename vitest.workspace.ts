import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineWorkspace } from "vitest/config";

const pkg = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "package.json"), "utf-8"),
);
export const workspaceDirs: string[] = pkg.workspaces.filter(
  (w: string) => w !== "rules-test",
);

export default defineWorkspace(
  workspaceDirs.map((dir) => {
    const configPath = resolve(import.meta.dirname, dir, "vite.config.ts");
    return {
      ...(existsSync(configPath) ? { extends: `./${dir}/vite.config.ts` } : {}),
      test: { name: dir, root: `./${dir}` },
    };
  }),
);
