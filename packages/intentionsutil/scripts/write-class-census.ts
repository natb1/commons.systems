// write-class-census — the observe-mode read-only report for the write-class
// migration frontier (tactic-intent-orchestration-layer-schema, unit 5).
//
// This is brownfield step 3 of the four-step migration contract the owning
// node's plan lays out: record the classification (unit 1, unit 3), open a
// read-tolerance window at the `writeNode` seam (unit 4 — `opts.writes` is
// OPTIONAL), then let this census surface every call site that has not yet
// declared its class. The drain is declaring them, one at a time; the ratchet
// that turns the declaration mandatory is a DIFFERENT node's surface
// (tactic-migration-frontier-projection) — this script produces the reading,
// never a gate. It exits 0 unconditionally, however many undeclared sites it
// finds.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/write-class-census.ts
//
// `npx tsx` is not an alternative spelling here — its CLI wrapper opens an IPC
// socket at startup that the sandbox's network-namespace isolation denies, so
// it dies with `listen EPERM` before the script runs at all
// (.claude/rules/sandbox.md, "npx tsx"). `node --import tsx/esm` loads the same
// loader in-process and opens no socket.
//
// No flags, no arguments: the script locates the repo it lives in from its own
// `import.meta.url` (packages/intentionsutil/scripts/.. -> packages/intentionsutil,
// then ../.. -> the repo root), so it works the same from any cwd. It is
// read-only — reads TypeScript/shell source under packages/intentionsutil and
// node frontmatter under intentions/, and never writes a byte anywhere.
//
// WHAT IT REPORTS
//
//  Part 1 — the write-site census. Every `writeNode(` call site under
//  packages/intentionsutil/src/ and packages/intentionsutil/scripts/
//  (test/ is out of scope: those exercise the API as a caller under test, they
//  are not one of the ~21 production writers the migration is draining),
//  bucketed by whether the call declares a class and which:
//    - declared (orchestration) / declared (intent) — the `writes:` value is a
//      literal `"orchestration"` or `"intent"` string this scan can read.
//    - declared (dynamic value) — a `writes:` key is present but its value is
//      not a string literal (e.g. a variable), so this scan cannot say which
//      class was declared without evaluating the program.
//    - undeclared — no `writes:` key found in the call at all; the write goes
//      through today's unfenced path (`opts` absent), which is exactly what
//      unit 4 defined as unchanged behaviour.
//
//  Part 2 — kind-node coverage (best-effort, NOT authoritative). Two checks:
//    (a) every first-class `IntentionNode` field (from `FIRST_CLASS_FIELD_NAMES`,
//        `attributes` itself excluded — it is classified per key, not as a
//        whole) has an entry in kind-kind.md's `attributes.field_write_class`
//        map. `validateGraph` rule 27 (`checkWriteClassDeclaration`,
//        schema.ts) is the actual gate for this; this section only surfaces
//        the same fact in the same report as the write-site census, for a
//        reader who wants one place to look.
//    (b) which kind-*.md node files under intentions/ carry NO
//        `attributes.field_write_class` block at all — i.e. have never
//        recorded a kind-scoped write-class declaration. This is coarser than
//        "which attribute KEY is undeclared": a genuinely per-key attributes
//        audit needs to know which `attributes.<key>` names each kind treats
//        as first-class content, and that is not mechanically recoverable
//        from a text scan without false positives — see LIMITATIONS below.
//
// LIMITATIONS (read before trusting a negative result as "nothing to drain")
//
//  - Call-site detection is a regex-anchored, balanced-paren text scan over
//    `writeNode(`, not an AST parse. It will miss a call built through
//    indirection (`const fn = writeNode; fn(...)`), a call spread across a
//    macro/codegen step, or one inside a template string. Every call site
//    checked against this scan as of this writing is a direct
//    `writeNode(dir, node, ...)` expression, so the scan is adequate today;
//    it is not a structural guarantee against a future indirect call.
//  - "Declared" means the literal text `writes:` appears inside the balanced
//    parens of that ONE call. It does not typecheck the value against
//    `WriteClass`, and a call that merely CONTAINS the substring `writes:` in
//    an adjacent comment on the same physical span could misclassify — no
//    such case exists in the scanned tree today.
//  - Scripts under packages/intentionsutil/scripts/ are a mix of `.ts` files
//    and extensionless bash wrappers that embed a TypeScript program in a
//    heredoc (e.g. `park-node`, `clear-park`, `resolve-park`, `graph-commit`).
//    The scan reads every regular file under `scripts/` regardless of
//    extension for this reason — a `.ts`-only filter would silently miss those
//    call sites.
//  - Part 2(a)/(b) are a straight grep over `attributes\.[A-Za-z_][\w]*` in
//    places, and comment PROSE mentioning an attribute name (e.g. schema.ts's
//    own doc comments narrating a RETIRED shadow-banned name like
//    `attributes.phase`) reads identically to a live reference to this scan —
//    a known sensor hazard (see the "sensor scans comment prose" precedent).
//    Part 2 therefore does NOT attempt a per-attribute-key undeclared report;
//    it reports only the two checks above, which are free of that hazard
//    (field_write_class keys are YAML-parsed frontmatter data, never prose).
//
// Pure read + exit 0, always. No graph writes, no git, no gh, no network.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { extractFrontmatter } from "../src/frontmatter.js";
import { FIRST_CLASS_FIELD_NAMES } from "../src/schema.js";

// --- Path resolution (from this script's own location, not cwd) ------------

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(SCRIPT_DIR, "..");
const REPO_ROOT = join(PACKAGE_ROOT, "..", "..");
const INTENTIONS_DIR = join(REPO_ROOT, "intentions");

// --- Part 1: write-site census ----------------------------------------------

type Declaration = "orchestration" | "intent" | "dynamic" | "undeclared";

export interface WriteSite {
  /** Path relative to the repo root, for a stable, portable report. */
  path: string;
  /** 1-based line number of the `writeNode(` token. */
  line: number;
  declaration: Declaration;
}

/** Every regular file under `dir`, recursing into subdirectories, sorted. */
function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === "dist" || name === ".git") continue;
      out.push(...listFilesRecursive(full));
    } else if (stat.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/**
 * The balanced-paren text of the call starting at the `(` found at
 * `openParenIndex` in `text`, INCLUDING both parens. Assumes `text[openParenIndex]`
 * is `"("` — the caller guarantees this from the `writeNode(` match.
 */
function extractBalancedCall(text: string, openParenIndex: number): string {
  let depth = 0;
  let i = openParenIndex;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  return text.slice(openParenIndex, i);
}

/** 1-based line number of `index` within `text`. */
function lineNumberAt(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}

/**
 * Every `writeNode(` CALL site in `text` — the function's own declaration
 * (`function writeNode(` / `export function writeNode(`) is excluded, since
 * that is the seam being called, not a call to it.
 *
 * This is a plain regex-and-balanced-paren scan with NO comment or string
 * awareness: measured against every file this scan actually reads
 * (`packages/intentionsutil/src/` and `scripts/`, this script's own file
 * excluded — see `censusWriteSites`), no production file mentions the literal
 * text `writeNode(` anywhere except in a real call, so a comment/string
 * parser would add complexity for zero payoff here — and a parser that tried
 * anyway proved actively wrong: several `scripts/` files are bash wrappers
 * with an embedded TypeScript heredoc (`park-node`, `clear-park`,
 * `resolve-park`, `graph-commit`), and bash prose is full of bare apostrophes
 * ("doesn't", "author's") that desync a naive quote-tracker across the whole
 * file, silently swallowing real call sites. See LIMITATIONS in the module
 * header for what a future comment-carrying call site would need instead.
 */
export function findWriteNodeCalls(text: string): Array<{ index: number; declaration: Declaration }> {
  const results: Array<{ index: number; declaration: Declaration }> = [];
  const re = /writeNode\(/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const matchIndex = match.index;
    // Exclude the definition: `function writeNode(` (with or without a
    // preceding `export `).
    const before = text.slice(Math.max(0, matchIndex - "export function ".length), matchIndex);
    if (/(^|\s)function\s*$/.test(before)) continue;
    const openParenIndex = matchIndex + "writeNode".length;
    const call = extractBalancedCall(text, openParenIndex);
    let declaration: Declaration = "undeclared";
    const writesMatch = call.match(/\bwrites\s*:\s*("([^"]*)"|'([^']*)')/);
    if (writesMatch) {
      const value = writesMatch[2] ?? writesMatch[3];
      declaration = value === "orchestration" || value === "intent" ? value : "dynamic";
    } else if (/\bwrites\s*:/.test(call)) {
      declaration = "dynamic";
    }
    results.push({ index: matchIndex, declaration });
  }
  return results;
}

// This script's own path, so its self-referential doc comments and the
// `"writeNode("` literal in its prefilter below don't masquerade as call sites.
const SELF_PATH = fileURLToPath(import.meta.url);

export function censusWriteSites(): WriteSite[] {
  const sites: WriteSite[] = [];
  for (const subdir of ["src", "scripts"]) {
    const dir = join(PACKAGE_ROOT, subdir);
    for (const file of listFilesRecursive(dir)) {
      if (file === SELF_PATH) continue;
      const rel = relative(REPO_ROOT, file);
      let text: string;
      try {
        text = readFileSync(file, "utf8");
      } catch {
        continue; // Not a regular readable file (e.g. a symlink to nowhere) — skip.
      }
      if (!text.includes("writeNode(")) continue;
      for (const call of findWriteNodeCalls(text)) {
        sites.push({ path: rel, line: lineNumberAt(text, call.index), declaration: call.declaration });
      }
    }
  }
  sites.sort((a, b) => (a.path === b.path ? a.line - b.line : a.path < b.path ? -1 : 1));
  return sites;
}

// --- Part 2: kind-node coverage (best-effort) -------------------------------

/** Parse `<id>.md`'s YAML frontmatter, or `null` if the file is missing. */
function readKindFrontmatter(id: string): Record<string, unknown> | null {
  const path = join(INTENTIONS_DIR, `${id}.md`);
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  const fm = extractFrontmatter(raw, id);
  return parseYaml(fm) as Record<string, unknown>; // type-safety-ok: yaml's parse() returns unknown; frontmatter is trusted repo content, not external input
}

/** Every `kind-*.md` node id present under `intentions/`, sorted. */
function listKindNodeIds(): string[] {
  return readdirSync(INTENTIONS_DIR)
    .filter((name) => name.startsWith("kind-") && name.endsWith(".md"))
    .map((name) => name.slice(0, -".md".length))
    .sort();
}

interface KindCoverage {
  /** First-class fields (minus `attributes`) with no entry on kind-kind.md's map. */
  missingFromKindKind: string[];
  /** kind-*.md node ids that carry no `attributes.field_write_class` block. */
  kindsWithNoDeclaration: string[];
}

export function censusKindCoverage(): KindCoverage {
  const kindKind = readKindFrontmatter("kind-kind");
  const kindKindAttrs = (kindKind?.attributes ?? {}) as Record<string, unknown>; // type-safety-ok: readKindFrontmatter's return is an untyped YAML parse at a system boundary
  const kindKindFieldClass = (kindKindAttrs.field_write_class ?? {}) as Record<string, unknown>; // type-safety-ok: same untyped-YAML boundary as above
  const declaredOnKindKind = new Set(Object.keys(kindKindFieldClass));
  const missingFromKindKind = FIRST_CLASS_FIELD_NAMES.filter(
    (field) => field !== "attributes" && !declaredOnKindKind.has(field),
  ).sort();

  const kindsWithNoDeclaration: string[] = [];
  for (const id of listKindNodeIds()) {
    const fm = readKindFrontmatter(id);
    const attrs = (fm?.attributes ?? {}) as Record<string, unknown>; // type-safety-ok: same untyped-YAML boundary as censusKindCoverage above
    if (attrs.field_write_class === undefined) {
      kindsWithNoDeclaration.push(id);
    }
  }
  return { missingFromKindKind, kindsWithNoDeclaration };
}

// --- Report rendering --------------------------------------------------------

function renderSiteList(sites: WriteSite[]): string {
  if (sites.length === 0) return "  (none)";
  return sites.map((s) => `  ${s.path}:${s.line}`).join("\n");
}

export function render(sites: WriteSite[], coverage: KindCoverage): string {
  const byDeclaration = (d: Declaration) => sites.filter((s) => s.declaration === d);
  const orchestration = byDeclaration("orchestration");
  const intent = byDeclaration("intent");
  const dynamic = byDeclaration("dynamic");
  const undeclared = byDeclaration("undeclared");

  const lines: string[] = [];
  lines.push("=== write-class-census ===");
  lines.push("(observe-tier report — read-only, always exits 0; see script header for scope/limits)");
  lines.push("");
  lines.push("-- Part 1: writeNode call-site declarations --");
  lines.push(`total call sites found: ${sites.length}`);
  lines.push(`  declared (orchestration): ${orchestration.length}`);
  lines.push(`  declared (intent):        ${intent.length}`);
  lines.push(`  declared (dynamic value): ${dynamic.length}`);
  lines.push(`  undeclared:               ${undeclared.length}`);
  lines.push("");
  lines.push("Undeclared sites (the migration frontier — each needs its own ruling, not a guess):");
  lines.push(renderSiteList(undeclared));
  lines.push("");
  lines.push("Declared (orchestration) sites:");
  lines.push(renderSiteList(orchestration));
  lines.push("");
  lines.push("Declared (intent) sites:");
  lines.push(renderSiteList(intent));
  lines.push("");
  lines.push("Declared (dynamic value) sites:");
  lines.push(renderSiteList(dynamic));
  lines.push("");
  lines.push("-- Part 2: kind-node coverage (best-effort; validateGraph rule 27 is authoritative) --");
  lines.push(
    `First-class fields with no kind-kind.md field_write_class entry: ${
      coverage.missingFromKindKind.length === 0 ? "none" : coverage.missingFromKindKind.join(", ")
    }`,
  );
  lines.push(
    `kind-*.md nodes with no field_write_class declaration at all: ${
      coverage.kindsWithNoDeclaration.length === 0 ? "none" : coverage.kindsWithNoDeclaration.join(", ")
    }`,
  );
  lines.push("");
  lines.push("=== end ===");
  return lines.join("\n");
}

// --- Main --------------------------------------------------------------------

function main(): void {
  const sites = censusWriteSites();
  const coverage = censusKindCoverage();
  process.stdout.write(render(sites, coverage) + "\n");
  process.exit(0);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
