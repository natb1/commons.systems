// Audit the workspace's third-party runtime dependencies against their recorded
// justifications.
//
// This is the sensor computation behind strategy-owned-web-platform's success
// signal: "every third-party runtime dependency of the apps and shared packages
// carries a recorded justification, and the dependency count stays flat or
// falling". A later unit registers `computeDependencyAudit` as that strategy's
// sensor; this unit builds the audit and its stdout summary.
//
// WHAT IT MEASURES. It walks the root `package.json` `workspaces` array and
// unions every member's runtime dependency declarations — `dependencies`,
// `optionalDependencies`, `peerDependencies`, and the array-form
// `bundleDependencies` / `bundledDependencies`. Optional and peer deps install
// and execute at runtime (and optional deps run install-time lifecycle
// scripts), so reading only `dependencies` would let a manifest edit move a
// package out of the audit while it still ships.
//
// It then classifies each declared name:
//
//   - INTERNAL (dropped): the name is a workspace member's `name` AND every
//     declaration of it demonstrably resolves to that member — either the
//     workspace-local range form (`"*"`, or the `workspace:` protocol), or a
//     `file:`/`link:` path that resolves to the member's own directory (the
//     form the apps use, e.g. `"@commons-systems/ds": "file:../packages/ds"`).
//     The name alone is not enough — several members use short, publicly
//     claimable names at version `0.0.0` (`print`, `audio`, `budget`,
//     `landing`, `fellspiral`, `office-hours`), and npm links a member only
//     when the declared range is satisfied by its local version. So
//     `"budget": "^1.0.0"` installs the REGISTRY package; that declaration is
//     third-party and is audited as such. So is a `file:` path aimed anywhere
//     other than the member it names.
//   - THIRD-PARTY (audited): everything else, plus every package named in the
//     root `overrides` map. An override substitutes code for a package the
//     manifest walk never enumerates, so it must carry a justification too.
//
// Each audited dependency is looked up in `dependency-justifications.ts` using
// an own-property check — a bare `map[name]` lookup walks `Object.prototype`,
// so a dependency named `constructor` or `toString` (both valid npm names)
// would resolve to an inherited value and pass as justified. Missing entry →
// UNJUSTIFIED. A present entry is still UNJUSTIFIED when some declared
// specifier chooses code by something other than a registry range for the
// dependency's own name (an `npm:` alias, or a git/github/http/file/link
// target) and the entry does not record that exact specifier in `specifiers`:
// the audit certifies what executes, not merely a name. Independently, any
// justified entry whose `upstream` is `"archived"` or `"stale"` is flagged
// dead-upstream.
//
// DELIBERATE EXCLUSIONS. `devDependencies` (the build/test toolchain and the
// Firebase client SDK build surface are out of scope per the strategy's
// clarification 2), and transitive dependencies that are neither declared by a
// workspace member nor named in `overrides` — this audit reads manifests, not
// `package-lock.json`.
//
// Run from anywhere (the repo root is resolved relative to this file, not cwd):
//   node --import tsx/esm packages/intentionsutil/scripts/dependency-audit.ts
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
import { dirname, join, resolve } from "node:path";
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

/** One unjustified finding: the dependency and why the audit does not accept it. */
export interface Unjustified {
  name: string;
  /**
   * Why it is unjustified — a missing entry, a name-collision with a workspace
   * member declared at a registry range, or a declared specifier that
   * substitutes code the justification does not record.
   */
  reason: string;
}

/** Result of one audit pass — a reading, never a thrown error for a nonzero count. */
export interface DependencyAuditResult {
  /** Stable, parseable one-line summary (see `formatSummaryLine`). */
  summaryLine: string;
  /** Total third-party runtime dependencies counted (declared + overridden). */
  total: number;
  /** Third-party deps the recorded justifications do not cover, with the reason. */
  unjustified: Unjustified[];
  /** Justified deps whose upstream is `"archived"` or `"stale"`. */
  deadUpstream: DeadUpstream[];
}

/**
 * Manifest fields whose value is a `{ name: specifier }` map of packages that
 * install and can execute at runtime. `devDependencies` is deliberately absent
 * (see DELIBERATE EXCLUSIONS in the header comment).
 */
const SPECIFIER_DEP_FIELDS = [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
] as const;

/** Manifest fields whose value is an ARRAY of bundled package names (npm spec). */
const BUNDLED_DEP_FIELDS = ["bundleDependencies", "bundledDependencies"] as const;

/**
 * Range forms that resolve to the workspace-local member rather than to the
 * public registry. npm links a member only when the declared range is satisfied
 * by the member's local version; every member here is `0.0.0`, so only these
 * forms are guaranteed local. Anything else — `"^1.0.0"` against a member named
 * `budget` — installs the registry package of that name. (The `file:`/`link:`
 * path form is also local, but only when it points AT the member; that is
 * checked by `resolvesToMember`, not here.)
 */
const WORKSPACE_LOCAL_SPECIFIERS = new Set([
  "*",
  "workspace:*",
  "workspace:^",
  "workspace:~",
]);

/** One declaration of a dependency by one workspace member. */
interface Declaration {
  /** Repo-relative directory of the declaring workspace member. */
  ws: string;
  /** The declared specifier, or `undefined` for a bundled-dependency name. */
  specifier: string | undefined;
}

/**
 * True when this declaration provably installs the workspace member at
 * `memberDir` rather than a registry package of the same name: a workspace-local
 * range, or a `file:`/`link:` path that resolves to the member's own directory.
 */
function resolvesToMember(decl: Declaration, memberDir: string, repoDir: string): boolean {
  const { specifier } = decl;
  if (specifier === undefined) {
    return false;
  }
  if (WORKSPACE_LOCAL_SPECIFIERS.has(specifier)) {
    return true;
  }
  const pathPrefix = /^(file:|link:)/.exec(specifier);
  if (pathPrefix === null) {
    return false;
  }
  const target = resolve(repoDir, decl.ws, specifier.slice(pathPrefix[0].length));
  return target === resolve(repoDir, memberDir);
}

/**
 * True when a declared specifier picks code by something other than a registry
 * version range for the dependency's own name: an `npm:` alias (`"react":
 * "npm:react-fork-evil@1.0.0"`), a git/github/http target, or a file/link
 * target. The name in the justification map certifies nothing about such a
 * declaration, so the audit refuses it unless the entry records the exact
 * specifier.
 */
function isSubstitutingSpecifier(specifier: string): boolean {
  if (/^(npm|git|git\+[a-z]+|github|gitlab|bitbucket|file|link|portal|https?):/i.test(specifier)) {
    return true;
  }
  // GitHub shorthand: `user/repo` or `user/repo#ref`.
  return /^[^./@\s][^\s/]*\/[^\s/]+$/.test(specifier);
}

/** Record one declaration of `name` by the member at `ws`. */
function addDeclared(
  declared: Map<string, Declaration[]>,
  name: string,
  ws: string,
  specifier: string | undefined,
): void {
  const decls = declared.get(name);
  if (decls === undefined) {
    declared.set(name, [{ ws, specifier }]);
    return;
  }
  decls.push({ ws, specifier });
}

/** The distinct, sorted specifier strings a dependency was declared at. */
function distinctSpecifiers(decls: readonly Declaration[]): string[] {
  const specifiers = new Set<string>();
  for (const { specifier } of decls) {
    if (specifier !== undefined) {
      specifiers.add(specifier);
    }
  }
  return [...specifiers].sort();
}

/**
 * Strip the optional version selector from an `overrides` key: `"foo@1.2.3"` →
 * `"foo"`, `"@scope/pkg@1"` → `"@scope/pkg"`, `"@scope/pkg"` → unchanged.
 */
function overrideKeyToName(key: string): string {
  const at = key.lastIndexOf("@");
  return at > 0 ? key.slice(0, at) : key;
}

/**
 * Collect every package name the root `overrides` map substitutes, including
 * the nested per-parent form (`{ "a": { "b": "1.0.0" } }`). The `"."` key names
 * the parent itself, which is already collected from its own key.
 */
function collectOverrideNames(overrides: unknown, into = new Set<string>()): Set<string> {
  if (overrides === undefined) {
    return into;
  }
  if (typeof overrides !== "object" || overrides === null || Array.isArray(overrides)) {
    throw new Error(`dependency-audit: root package.json "overrides" is not an object`);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (key !== ".") {
      into.add(overrideKeyToName(key));
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      collectOverrideNames(value, into);
    }
  }
  return into;
}

/**
 * Read and JSON-parse the `package.json` at `relPath`, resolved under `repoDir`.
 * Throws a clear, contextual error on a missing or malformed manifest — this is
 * a genuine read error (a misconfigured environment), not a normal reading, so
 * it must not be swallowed.
 *
 * The thrown message names the REPO-RELATIVE path (`relPath`) and, for a
 * filesystem failure, the errno code rather than the raw error — the absolute
 * path `repoDir` is resolved from `import.meta.url`, so it embeds the local
 * home-directory and worktree layout. Repo-relative is just as clear for
 * diagnosis and does not disclose the machine's filesystem layout wherever this
 * message is surfaced.
 */
function readManifest(repoDir: string, relPath: string): Record<string, unknown> {
  let raw: string;
  try {
    raw = readFileSync(join(repoDir, relPath), "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code; // type-safety-ok: fs throws ErrnoException; `code` is read defensively and only used when it is a string
    throw new Error(
      `dependency-audit: cannot read manifest ${relPath}: ${typeof code === "string" ? code : "read failed"}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`dependency-audit: malformed manifest ${relPath}: ${String(err)}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`dependency-audit: manifest ${relPath} is not a JSON object`);
  }
  return parsed as Record<string, unknown>; // type-safety-ok: narrowed to a non-null non-array object by the checks above; TS cannot infer string keys from typeof alone
}

/**
 * Compute the third-party runtime dependency audit over the workspace rooted at
 * `repoDir`. Total function for a nonzero count (the returned result IS the
 * reading); throws only on a genuine manifest read error. Exported so a later
 * unit's sensor can call it directly.
 */
export function computeDependencyAudit(repoDir: string): DependencyAuditResult {
  const rootManifest = readManifest(repoDir, "package.json");
  const workspaces = rootManifest.workspaces;
  if (!Array.isArray(workspaces)) {
    throw new Error(
      `dependency-audit: root package.json has no "workspaces" array`,
    );
  }

  // Pass 1: collect every declared runtime dependency WITH each declaration's
  // specifier and declaring member (classification below needs both — the
  // specifier decides registry-vs-local, and a relative `file:` path only
  // resolves against the directory that declared it), plus each workspace
  // member's name → its repo-relative directory.
  const declared = new Map<string, Declaration[]>();
  const memberDirs = new Map<string, string>();
  for (const ws of workspaces) {
    if (typeof ws !== "string") {
      throw new Error(`dependency-audit: non-string workspace entry: ${String(ws)}`);
    }
    const manifest = readManifest(repoDir, join(ws, "package.json"));
    if (typeof manifest.name === "string") {
      memberDirs.set(manifest.name, ws);
    }
    for (const field of SPECIFIER_DEP_FIELDS) {
      const deps = manifest[field];
      if (deps === undefined) {
        continue;
      }
      if (typeof deps !== "object" || deps === null || Array.isArray(deps)) {
        throw new Error(
          `dependency-audit: ${ws}/package.json "${field}" is not an object`,
        );
      }
      for (const [name, specifier] of Object.entries(deps)) {
        if (typeof specifier !== "string") {
          throw new Error(
            `dependency-audit: ${ws}/package.json "${field}"."${name}" is not a string specifier`,
          );
        }
        addDeclared(declared, name, ws, specifier);
      }
    }
    // Bundled deps are an array of names (npm spec) — no specifier to record.
    for (const field of BUNDLED_DEP_FIELDS) {
      const bundled = manifest[field];
      if (bundled === undefined) {
        continue;
      }
      if (!Array.isArray(bundled)) {
        throw new Error(
          `dependency-audit: ${ws}/package.json "${field}" is not an array of names`,
        );
      }
      for (const name of bundled) {
        if (typeof name !== "string") {
          throw new Error(
            `dependency-audit: ${ws}/package.json "${field}" has a non-string entry: ${String(name)}`,
          );
        }
        addDeclared(declared, name, ws, undefined);
      }
    }
  }

  // Pass 2: classify. A dep is internal ONLY when a workspace member shares its
  // name AND every declaration of it provably resolves to that member. Matching
  // by name alone would let `"budget": "^1.0.0"` install the registry package
  // while the audit silently dropped it as internal. Overridden packages join
  // the audited set: an override substitutes code for a package no manifest
  // walk enumerates, so it needs a justification just the same.
  const thirdParty = [...declared.keys()].filter((name) => {
    const memberDir = memberDirs.get(name);
    if (memberDir === undefined) {
      return true;
    }
    const decls = declared.get(name) ?? [];
    const allLocal =
      decls.length > 0 && decls.every((decl) => resolvesToMember(decl, memberDir, repoDir));
    return !allLocal;
  });
  const overridden = collectOverrideNames(rootManifest.overrides);
  const audited = [...new Set([...thirdParty, ...overridden])].sort();

  // Pass 3: cross-check each against the justifications data file. The lookup
  // uses an own-property check: a plain `map[name]` walks `Object.prototype`, so
  // a dep named `constructor` would resolve to an inherited value and pass as
  // justified while reporting no upstream.
  const unjustified: Unjustified[] = [];
  const deadUpstream: DeadUpstream[] = [];
  for (const name of audited) {
    const specifiers = distinctSpecifiers(declared.get(name) ?? []);
    const entry = Object.hasOwn(dependencyJustifications, name)
      ? dependencyJustifications[name]
      : undefined;

    if (entry === undefined) {
      unjustified.push({
        name,
        reason: missingEntryReason(name, specifiers, memberDirs, overridden),
      });
      continue;
    }

    // A recorded name does not certify substituted code: an `npm:` alias or a
    // git/file target under a justified name executes something else entirely.
    const recorded = new Set(entry.specifiers ?? []);
    const substituting = specifiers.filter(
      (specifier) => isSubstitutingSpecifier(specifier) && !recorded.has(specifier),
    );
    if (substituting.length > 0) {
      unjustified.push({
        name,
        reason:
          `declared at ${substituting.join(", ")}, which substitutes code the ` +
          `justification does not record (add it to the entry's "specifiers")`,
      });
    }

    if (entry.upstream === "archived" || entry.upstream === "stale") {
      deadUpstream.push({ name, upstream: entry.upstream });
    }
  }

  const summaryLine = formatSummaryLine(audited.length, unjustified.length, deadUpstream.length);
  return { summaryLine, total: audited.length, unjustified, deadUpstream };
}

/** The reason text for an audited dependency with no justification entry. */
function missingEntryReason(
  name: string,
  specifiers: string[],
  memberDirs: Map<string, string>,
  overridden: Set<string>,
): string {
  if (memberDirs.has(name)) {
    return (
      `no justification entry; a workspace member shares this name but it is ` +
      `declared at ${specifiers.join(", ") || "(no specifier)"}, which does not ` +
      `resolve to that member — npm installs the registry package instead`
    );
  }
  if (specifiers.length === 0 && overridden.has(name)) {
    return `no justification entry; substituted by the root package.json "overrides" map`;
  }
  return "no justification entry";
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
    for (const { name, reason } of result.unjustified) {
      lines.push(`  ${name} — ${reason}`);
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
