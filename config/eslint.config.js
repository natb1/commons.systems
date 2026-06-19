import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// The config file lives at <root>/config/eslint.config.js, so its dir is
// <root>/config and the parent is the repo root. Resolve cwd-independently so
// the layering rule works regardless of which workspace eslint runs from.
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

// Derive the top-level app package list dynamically from the workspace
// manifests. Apps are the dependency-graph roots: unscoped workspace names
// (e.g. `landing`, `print`). Scoped `@commons-systems/*` names are leaf libs
// and must NOT be restricted — they are the layers apps are allowed to import.
const { workspaces } = JSON.parse(
  readFileSync(join(rootDir, "package.json"), "utf8"),
);
const appPackages = workspaces
  .map((ws) => {
    const { name } = JSON.parse(
      readFileSync(join(rootDir, ws, "package.json"), "utf8"),
    );
    return name;
  })
  .filter((name) => name && !name.startsWith("@commons-systems/"));

const appImportPatterns = appPackages.map((app) => ({
  group: [app, `${app}/*`, `${app}/**`],
  message:
    `Layering violation: '${app}' is a top-level app package and must not be ` +
    "imported by libraries, utils, or @commons-systems/ds. Apps are " +
    "dependency-graph roots — move shared code into a @commons-systems/* leaf " +
    "package instead.",
}));

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Turn off the core rule to avoid double-reporting; the
      // typescript-eslint variant below handles the layering patterns.
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        { patterns: appImportPatterns },
      ],
    },
  },
  {
    ignores: ["dist/"],
  },
);
