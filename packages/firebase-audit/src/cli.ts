// CLI entry for the firebase-import reachability audit.
//
// Usage:
//   npm run audit:firebase            # report mode, always exits 0
//   npm run audit:firebase -- --strict  # exit 1 if any module has no live consumer
//
// The repo root is found by walking up from cwd to the first package.json that
// declares a `workspaces` array, so the CLI works regardless of the directory
// npm invokes it from.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { runAudit, formatReport } from "./audit.js";

function findRepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg: { workspaces?: unknown } = JSON.parse(
          readFileSync(pkgPath, "utf8"),
        );
        if (Array.isArray(pkg.workspaces)) return dir;
      } catch {
        // ignore malformed package.json and keep walking up
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        "firebase-audit: could not find a repo root (no package.json with a workspaces array above " +
          start +
          ")",
      );
    }
    dir = parent;
  }
}

const strict = process.argv.includes("--strict");
const repoRoot = findRepoRoot(process.cwd());
const result = runAudit(repoRoot);
process.stdout.write(formatReport(result));

if (strict && result.deadCount > 0) {
  process.stderr.write(
    `\nfirebase-audit --strict: ${result.deadCount} firebase-importing module(s) unreachable from a live consumer.\n`,
  );
  process.exit(1);
}
