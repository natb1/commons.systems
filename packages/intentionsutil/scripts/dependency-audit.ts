// Audit the workspace's third-party runtime dependencies against their recorded
// justifications.
//
// This is the sensor computation behind strategy-owned-web-platform's success
// signal: "every third-party runtime dependency of the apps and shared packages
// carries a recorded justification, and the dependency count stays flat or
// falling". A later unit registers `computeDependencyAudit` as that strategy's
// sensor; this unit builds the audit and its stdout summary.
//
// WHAT IT MEASURES. It walks the root `package.json` `workspaces` array, unions
// every member's `dependencies` keys (NOT `devDependencies` — the build/test
// toolchain and the Firebase client SDK build surface are out of scope per the
// strategy's clarification 2), then drops any name that is itself the `name` of
// one of the workspace members (those are internal `@commons-systems/*`-style
// workspace-local deps, declared as version `"*"` — not third-party). What
// remains is the third-party runtime surface. Each such dependency is looked up
// in `dependency-justifications.ts`: present → justified; absent → UNJUSTIFIED.
// Independently, any justified entry whose `upstream` is `"archived"` or
// `"stale"` is flagged dead-upstream.
//
// Run from anywhere (the repo root is resolved relative to this file, not cwd):
//   npx tsx packages/intentionsutil/scripts/dependency-audit.ts
//
// TOTAL-FUNCTION CONTRACT. `computeDependencyAudit` returns a result describing
// the reading; a nonzero unjustified/dead-upstream count is a normal reading,
// NOT a failure — the function never throws for that. It DOES throw on a genuine
// read error (root or member `package.json` missing/malformed): those are a
// misconfigured environment, and per `.claude/rules/code-style.md` we surface a
// clear error rather than a defensive fallback. `main()` lets such a throw crash
// with a non-zero exit and a Node stack trace; it adds no try/catch that would
// hide the underlying problem. A later sensor wrapping this decides for itself
// whether to catch.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dependencyJustifications } from "./dependency-justifications.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/dependency-audit.ts`, the
// same depth as `read-sensors.ts`, so the repo root is three directories up.
// Resolve from this file's own location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

/** One dead-upstream finding: the dependency and its recorded upstream note. */
export interface DeadUpstream {
  name: string;
  upstream: string;
}

/** Result of one audit pass — a reading, never a thrown error for a nonzero count. */
export interface DependencyAuditResult {
  /** Stable, parseable one-line summary (see `formatSummaryLine`). */
  summaryLine: string;
  /** Total third-party runtime dependencies counted. */
  total: number;
  /** Third-party deps with no entry in `dependency-justifications.ts`. */
  unjustified: string[];
  /** Justified deps whose upstream is `"archived"` or `"stale"`. */
  deadUpstream: DeadUpstream[];
}

/**
 * Read and JSON-parse a `package.json` at `path`. Throws a clear, contextual
 * error on a missing or malformed manifest — this is a genuine read error (a
 * misconfigured environment), not a normal reading, so it must not be swallowed.
 */
function readManifest(path: string): Record<string, unknown> {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(`dependency-audit: cannot read manifest ${path}: ${String(err)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`dependency-audit: malformed manifest ${path}: ${String(err)}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`dependency-audit: manifest ${path} is not a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

/**
 * Compute the third-party runtime dependency audit over the workspace rooted at
 * `repoDir`. Total function for a nonzero count (the returned result IS the
 * reading); throws only on a genuine manifest read error. Exported so a later
 * unit's sensor can call it directly.
 */
export function computeDependencyAudit(repoDir: string): DependencyAuditResult {
  const rootManifest = readManifest(join(repoDir, "package.json"));
  const workspaces = rootManifest.workspaces;
  if (!Array.isArray(workspaces)) {
    throw new Error(
      `dependency-audit: root package.json has no "workspaces" array`,
    );
  }

  // Pass 1: collect the union of runtime dependency names, and the set of all
  // workspace member `name` fields (the internal/workspace-local membership set).
  const runtimeDeps = new Set<string>();
  const workspaceNames = new Set<string>();
  for (const ws of workspaces) {
    if (typeof ws !== "string") {
      throw new Error(`dependency-audit: non-string workspace entry: ${String(ws)}`);
    }
    const manifest = readManifest(join(repoDir, ws, "package.json"));
    if (typeof manifest.name === "string") {
      workspaceNames.add(manifest.name);
    }
    const deps = manifest.dependencies;
    if (deps !== undefined) {
      if (typeof deps !== "object" || deps === null || Array.isArray(deps)) {
        throw new Error(
          `dependency-audit: ${ws}/package.json "dependencies" is not an object`,
        );
      }
      for (const name of Object.keys(deps)) {
        runtimeDeps.add(name);
      }
    }
  }

  // Pass 2: filter to third-party — drop any dep that is itself a workspace
  // member name (internal workspace-local dep, not third-party).
  const thirdParty = [...runtimeDeps].filter((name) => !workspaceNames.has(name)).sort();

  // Pass 3: cross-check each against the justifications data file.
  const unjustified: string[] = [];
  const deadUpstream: DeadUpstream[] = [];
  for (const name of thirdParty) {
    const entry = dependencyJustifications[name];
    if (entry === undefined) {
      unjustified.push(name);
      continue;
    }
    if (entry.upstream === "archived" || entry.upstream === "stale") {
      deadUpstream.push({ name, upstream: entry.upstream });
    }
  }

  const summaryLine = formatSummaryLine(thirdParty.length, unjustified.length, deadUpstream.length);
  return { summaryLine, total: thirdParty.length, unjustified, deadUpstream };
}

/**
 * The single stable, parseable summary line. Kept separate so both `main()` and
 * a later sensor produce byte-identical output.
 */
export function formatSummaryLine(total: number, unjustified: number, deadUpstream: number): string {
  return `dependency-audit: ${total} runtime deps, ${unjustified} unjustified, ${deadUpstream} dead-upstream`;
}

// --- Main ------------------------------------------------------------------

function main(): void {
  // No try/catch: a manifest read error crashes with a clear message and a
  // non-zero exit (Node's default for an uncaught throw), per code-style.md.
  const result = computeDependencyAudit(repoRoot);

  const lines: string[] = [result.summaryLine];

  if (result.unjustified.length > 0) {
    lines.push("", "UNJUSTIFIED:");
    for (const name of result.unjustified) {
      lines.push(`  ${name}`);
    }
  }

  if (result.deadUpstream.length > 0) {
    lines.push("", "DEAD-UPSTREAM:");
    for (const { name, upstream } of result.deadUpstream) {
      lines.push(`  ${name} (${upstream})`);
    }
  }

  process.stdout.write(lines.join("\n") + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
