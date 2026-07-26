// append-machinery-section — the ONLY supported way to append a machinery
// section to a tactic node's body (tactic-scope-fingerprint-plan-substance
// Unit 2).
//
// Unit 1 (body-substance.ts) drew the machinery boundary a tactic's scope
// fingerprint hashes above: `planSubstance(body)` excludes everything at or
// below the machinery sentinel (or a legacy `## needs-main…` heading), and
// `appendMachinerySection(body, section)` is the single function that inserts
// content below that boundary correctly (inserting the sentinel on first use,
// reusing it thereafter). This script is a thin CLI wrapper around that
// function plus file I/O, so machinery writers (e.g. /qa-fix) always append
// through the one path that keeps the fingerprint exclusion intact.
//
// Deliberately does NOT go through `writeNode`: writeNode's YAML
// stringify/parse round-trip has clobbered residue bodies before (see project
// history on write-node body clobbering). Instead this script reads the raw
// file, locates the body with `extractBody` (the single fence-boundary
// parser), and replaces only the trailing body slice — frontmatter bytes are
// preserved exactly because they are never touched.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/append-machinery-section.ts <id> \
//     [--dir <intentions-dir>] [--section-file <path>|-]
//
// `--section-file -` (or omitting `--section-file` entirely) reads the section
// markdown from stdin. The section text must start with `## ` after trimming
// — anything else exits 1 with a clear error, since a machinery section is
// always its own H2 subsection of the body.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { appendMachinerySection } from "../src/body-substance.js";
import { extractBody } from "../src/frontmatter.js";

// --- Paths -------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/append-machinery-section.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd — matching restamp-scope-fingerprint.ts.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = dirname(dirname(dirname(scriptDir)));

const USAGE =
  "usage: append-machinery-section.ts <id> [--dir <intentions-dir>] [--section-file <path>|-]\n" +
  "  Appends a machinery section (read from --section-file, or stdin when\n" +
  "  --section-file is '-' or omitted) to <dir>/<id>.md's body, below the\n" +
  "  machinery boundary. The section text must start with '## ' after\n" +
  "  trimming. Prints the rewritten file's path to stdout on success.\n";

function readStdin(): string {
  return readFileSync(0, "utf8");
}

function run(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE);
    return;
  }

  let dir = join(defaultRepoRoot, "intentions");
  const dirIdx = args.indexOf("--dir");
  if (dirIdx !== -1) {
    const v = args[dirIdx + 1];
    if (!v) {
      process.stderr.write("append-machinery-section: --dir requires a directory argument\n" + USAGE);
      process.exit(1);
    }
    dir = v;
  }

  let sectionFile = "-";
  const sectionFileIdx = args.indexOf("--section-file");
  if (sectionFileIdx !== -1) {
    const v = args[sectionFileIdx + 1];
    if (!v) {
      process.stderr.write("append-machinery-section: --section-file requires a path argument\n" + USAGE);
      process.exit(1);
    }
    sectionFile = v;
  }

  // Indices consumed by recognized flags and their values. Anything left that
  // begins with `-` is an unrecognized flag: reject it (mirroring
  // restamp-scope-fingerprint.ts) rather than silently dropping it as a
  // fallback.
  const consumed = new Set<number>();
  if (dirIdx !== -1) {
    consumed.add(dirIdx);
    consumed.add(dirIdx + 1);
  }
  if (sectionFileIdx !== -1) {
    consumed.add(sectionFileIdx);
    consumed.add(sectionFileIdx + 1);
  }
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (consumed.has(i)) continue;
    const a = args[i];
    if (a.startsWith("-") && a !== "-") {
      process.stderr.write(`append-machinery-section: unknown flag '${a}'\n` + USAGE);
      process.exit(1);
    }
    positional.push(a);
  }
  if (positional.length !== 1) {
    process.stderr.write("append-machinery-section: exactly one node id is required\n" + USAGE);
    process.exit(1);
  }
  const id = positional[0];

  try {
    const section = sectionFile === "-" ? readStdin() : readFileSync(sectionFile, "utf8");
    if (!section.trim().startsWith("## ")) {
      throw new Error("section text must start with '## ' (its own H2 heading) after trimming");
    }

    const filePath = join(dir, `${id}.md`);
    const raw = readFileSync(filePath, "utf8");
    const body = extractBody(raw, id);
    const rewritten = raw.slice(0, raw.length - body.length) + appendMachinerySection(body, section);
    writeFileSync(filePath, rewritten);

    process.stdout.write(`${filePath}\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`append-machinery-section: ${message}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
