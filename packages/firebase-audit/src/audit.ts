// Firebase-import reachability audit engine.
//
// The sensor for strategy-firebase-demo-saas: it distinguishes firebase-importing
// modules that a live consumer (a production hosting surface or the demo app)
// reaches from dead code no live consumer touches. A module is "live" if some
// hosting-app entry or the Cloud Functions entry reaches it through the static
// import graph.
//
// The engine is deliberately self-contained (no dependency on a running
// `npm install`): it reads the root `package.json` workspaces, each workspace's
// `package.json` exports map, and `.firebaserc`, then walks imports by static
// resolution. Root discovery is mechanical, so the demo app is picked up
// automatically once it lands in `.firebaserc` + `workspaces`.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import ts from "typescript";

// --- Types -----------------------------------------------------------------

/** A workspace package: its declared name, absolute dir, and flattened exports map. */
export interface WorkspacePkg {
  name: string | null;
  dir: string;
  /** subpath key (e.g. "." or "./firebase") -> package-relative target file */
  exports: Record<string, string>;
}

/** Per-module reachability verdict. */
export interface ModuleVerdict {
  /** repo-relative path of the firebase-importing module */
  module: string;
  /** the firebase-touching specifiers this module imports, deduped and sorted */
  firebaseImports: string[];
  /** the live consumer (root app name) that reaches this module, or null if dead */
  nearestLiveConsumer: string | null;
}

export interface AuditResult {
  /** repo-relative live-consumer root entry files, sorted */
  roots: string[];
  /** one verdict per firebase-importing module, sorted by module path */
  verdicts: ModuleVerdict[];
  /** count of firebase-importing modules no live consumer reaches */
  deadCount: number;
  /** count of firebase-importing modules a live consumer reaches */
  liveCount: number;
}

// --- Firebase specifier classifier -----------------------------------------

/**
 * True when an import specifier is firebase-touching: the SDK packages, the
 * shared firebase wrapper packages, or the two named firebase subpaths. This is
 * a specifier-string test (a module counts as firebase-importing if it names any
 * of these directly), not a transitive graph property.
 */
export function isFirebaseSpecifier(spec: string): boolean {
  // firebase, firebase/*, firebase-admin[/**], firebase-functions[/**]
  if (/^firebase(-admin|-functions)?(\/|$)/.test(spec)) return true;
  // shared wrapper packages that themselves import firebase
  if (/^@commons-systems\/(firebaseutil|firestoreutil|authutil)(\/|$)/.test(spec))
    return true;
  // mediautil's firebase subpath only (the rest of mediautil is firebase-free)
  if (spec === "@commons-systems/mediautil/firebase") return true;
  // blog's firestore module
  if (spec === "@commons-systems/blog/firestore") return true;
  return false;
}

// --- Workspace loading -----------------------------------------------------

/** Recursively pick the first string leaf out of a conditional exports value. */
function pickExportLeaf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    const byKey = new Map<string, unknown>(entries);
    // Prefer common runtime conditions, then fall back to any string leaf.
    for (const key of ["import", "module", "default", "require"]) {
      if (byKey.has(key)) {
        const leaf = pickExportLeaf(byKey.get(key));
        if (leaf) return leaf;
      }
    }
    for (const [, v] of entries) {
      const leaf = pickExportLeaf(v);
      if (leaf) return leaf;
    }
  }
  return null;
}

export interface Workspaces {
  /** workspace dir strings from root package.json, in declared order */
  dirs: string[];
  /** package name -> WorkspacePkg (only workspaces that declare a name) */
  byName: Map<string, WorkspacePkg>;
}

export function loadWorkspaces(repoRoot: string): Workspaces {
  const rootPkgPath = join(repoRoot, "package.json");
  const rootPkg: { workspaces?: string[] } = JSON.parse(
    readFileSync(rootPkgPath, "utf8"),
  );
  const dirs = rootPkg.workspaces ?? [];
  const byName = new Map<string, WorkspacePkg>();
  for (const d of dirs) {
    const abs = join(repoRoot, d);
    const pkgPath = join(abs, "package.json");
    if (!existsSync(pkgPath)) continue;
    const pkg: { name?: string; exports?: Record<string, unknown> } =
      JSON.parse(readFileSync(pkgPath, "utf8"));
    const exportsMap: Record<string, string> = {};
    if (pkg.exports && typeof pkg.exports === "object") {
      for (const [key, value] of Object.entries(pkg.exports)) {
        const leaf = pickExportLeaf(value);
        if (leaf) exportsMap[key] = leaf;
      }
    }
    if (pkg.name) {
      byName.set(pkg.name, { name: pkg.name, dir: abs, exports: exportsMap });
    }
  }
  return { dirs, byName };
}

// --- Import extraction -----------------------------------------------------

/**
 * All module specifiers a source file imports/re-exports/dynamic-imports.
 * Uses the TypeScript scanner (already a dependency) so static, dynamic, and
 * re-export forms are all captured with one call.
 */
export function extractImports(content: string): string[] {
  const pre = ts.preProcessFile(content, /*readImportFiles*/ true, /*detectJavaScriptImports*/ true);
  return pre.importedFiles.map((f) => f.fileName);
}

// --- Module resolution -----------------------------------------------------

/** Resolve a candidate path to an existing .ts/.tsx file, honoring the repo's
 * `.js`-specifier-for-`.ts`-file convention and index files. Non-TS targets
 * (css/json/asset imports) resolve to null — they are graph leaves. */
function resolveFileCandidate(p: string): string | null {
  const jsExt = /\.(js|jsx|mjs|cjs)$/;
  const cands: string[] = [];
  if (jsExt.test(p)) {
    cands.push(p.replace(jsExt, ".ts"), p.replace(jsExt, ".tsx"));
  }
  cands.push(p, p + ".ts", p + ".tsx", join(p, "index.ts"), join(p, "index.tsx"));
  for (const c of cands) {
    if (/\.tsx?$/.test(c) && existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

/** Find the workspace whose package name matches the specifier at a path
 * boundary, choosing the longest such name. */
function matchWorkspace(spec: string, byName: Map<string, WorkspacePkg>): WorkspacePkg | null {
  let best: WorkspacePkg | null = null;
  let bestLen = -1;
  for (const [name, ws] of byName) {
    if (spec === name || spec.startsWith(name + "/")) {
      if (name.length > bestLen) {
        best = ws;
        bestLen = name.length;
      }
    }
  }
  return best;
}

/**
 * Resolve an intra-repo import (relative path or workspace package) to an
 * absolute source file, or null for external / non-TS / unresolvable targets.
 */
export function resolveIntra(
  spec: string,
  fromFile: string,
  byName: Map<string, WorkspacePkg>,
): string | null {
  if (spec.startsWith(".")) {
    return resolveFileCandidate(resolve(dirname(fromFile), spec));
  }
  const ws = matchWorkspace(spec, byName);
  if (ws && ws.name) {
    const rest = spec.slice(ws.name.length); // "" or "/subpath"
    const key = rest === "" ? "." : "." + rest;
    const target = ws.exports[key];
    if (target) return resolveFileCandidate(join(ws.dir, target));
    return null; // package matched but subpath not exported
  }
  return null; // external dependency — a graph leaf
}

// --- Root discovery --------------------------------------------------------

/** Resolve one hosting app's entry file from its index.html module script, with
 * a src/main.{tsx,ts} fallback. */
function resolveAppEntry(repoRoot: string, app: string): string | null {
  const appDir = join(repoRoot, app);
  const indexHtml = join(appDir, "index.html");
  if (existsSync(indexHtml)) {
    const html = readFileSync(indexHtml, "utf8");
    const m = html.match(
      /<script[^>]*type=["']module["'][^>]*\bsrc=["']([^"']+)["']/,
    );
    if (m) {
      const abs = join(appDir, m[1].replace(/^\//, ""));
      if (existsSync(abs)) return abs;
    }
  }
  for (const cand of ["src/main.tsx", "src/main.ts"]) {
    const abs = join(appDir, cand);
    if (existsSync(abs)) return abs;
  }
  return null;
}

/** Live-consumer roots: every `.firebaserc` hosting target's app entry plus the
 * Cloud Functions entry. */
export function discoverRoots(repoRoot: string): string[] {
  const roots: string[] = [];
  const firebaserc: {
    targets?: Record<string, { hosting?: Record<string, unknown> }>;
  } = JSON.parse(readFileSync(join(repoRoot, ".firebaserc"), "utf8"));
  const apps = new Set<string>();
  for (const project of Object.values(firebaserc.targets ?? {})) {
    for (const appKey of Object.keys(project.hosting ?? {})) apps.add(appKey);
  }
  for (const app of [...apps].sort()) {
    const entry = resolveAppEntry(repoRoot, app);
    if (entry) roots.push(entry);
  }
  const fnEntry = join(repoRoot, "functions", "src", "index.ts");
  if (existsSync(fnEntry)) roots.push(fnEntry);
  return roots;
}

// --- Source enumeration ----------------------------------------------------

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "lib",
  "coverage",
  ".storybook",
  "storybook-static",
  "test",
  "tests",
  "__tests__",
  "e2e",
  "scripts",
]);

/** True for a shipping TypeScript source (excludes declarations, tests, stories). */
function isShippingSource(path: string): boolean {
  const base = path.split("/").pop() ?? path;
  if (base.endsWith(".d.ts")) return false;
  if (/\.(test|spec|stories)\.tsx?$/.test(base)) return false;
  return /\.tsx?$/.test(base);
}

function walkSources(dir: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // dir absent (e.g. a workspace with no source tree yet)
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walkSources(full, out);
    } else if (e.isFile() && isShippingSource(e.name)) {
      out.push(full);
    }
  }
}

/** All shipping TypeScript sources across every workspace. */
export function collectSources(repoRoot: string, dirs: string[]): string[] {
  const out: string[] = [];
  for (const d of dirs) walkSources(join(repoRoot, d), out);
  return out;
}

// --- Reachability ----------------------------------------------------------

/** First path segment of a repo-relative path — the workspace/app it lives in. */
function firstSegment(relPath: string): string {
  return relPath.split("/")[0];
}

/**
 * BFS the static import graph from the roots. Returns a map of absolute source
 * file -> the live-consumer app name that first reached it.
 */
export function computeReachable(
  roots: string[],
  repoRoot: string,
  byName: Map<string, WorkspacePkg>,
): Map<string, string> {
  const reached = new Map<string, string>();
  const queue: string[] = [];
  for (const r of roots) {
    if (!reached.has(r)) {
      reached.set(r, firstSegment(relative(repoRoot, r)));
      queue.push(r);
    }
  }
  while (queue.length > 0) {
    const file = queue.shift();
    if (file === undefined) break;
    const consumer = reached.get(file);
    if (consumer === undefined) continue;
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const spec of extractImports(content)) {
      const target = resolveIntra(spec, file, byName);
      if (target && !reached.has(target)) {
        reached.set(target, consumer);
        queue.push(target);
      }
    }
  }
  return reached;
}

// --- Top-level engine ------------------------------------------------------

export function runAudit(repoRoot: string): AuditResult {
  const { dirs, byName } = loadWorkspaces(repoRoot);
  const roots = discoverRoots(repoRoot);
  const reached = computeReachable(roots, repoRoot, byName);
  const sources = collectSources(repoRoot, dirs);

  const verdicts: ModuleVerdict[] = [];
  for (const file of sources) {
    const content = readFileSync(file, "utf8");
    const fbImports = extractImports(content).filter(isFirebaseSpecifier);
    if (fbImports.length === 0) continue;
    verdicts.push({
      module: relative(repoRoot, file),
      firebaseImports: [...new Set(fbImports)].sort(),
      nearestLiveConsumer: reached.get(file) ?? null,
    });
  }
  verdicts.sort((a, b) => a.module.localeCompare(b.module));

  const deadCount = verdicts.filter((v) => v.nearestLiveConsumer === null).length;
  return {
    roots: roots.map((r) => relative(repoRoot, r)).sort(),
    verdicts,
    deadCount,
    liveCount: verdicts.length - deadCount,
  };
}

// --- Report formatting -----------------------------------------------------

/** Render an audit result as a human-readable table plus a summary line. */
export function formatReport(result: AuditResult): string {
  const lines: string[] = [];
  lines.push("Firebase-import reachability audit");
  lines.push("");
  lines.push(`Live-consumer roots (${result.roots.length}):`);
  for (const r of result.roots) lines.push(`  ${r}`);
  lines.push("");
  lines.push(`Firebase-importing modules (${result.verdicts.length}):`);
  const moduleWidth = Math.max(
    6,
    ...result.verdicts.map((v) => v.module.length),
  );
  for (const v of result.verdicts) {
    const status = v.nearestLiveConsumer
      ? `live <- ${v.nearestLiveConsumer}`
      : "DEAD (no live consumer)";
    lines.push(`  ${v.module.padEnd(moduleWidth)}  ${status}`);
  }
  lines.push("");
  lines.push(
    `Summary: ${result.liveCount} live, ${result.deadCount} dead, ${result.verdicts.length} firebase-importing total.`,
  );
  return lines.join("\n") + "\n";
}
