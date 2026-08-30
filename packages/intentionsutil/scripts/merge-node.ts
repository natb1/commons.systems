// CLI wrapper around the pure `mergeIntentionNodes` primitive. Reads three
// raw node files (base / ours / theirs), runs the three-way field-level merge,
// and either writes the auto-resolved node to --out (mirroring store.ts's exact
// writeNode serialization) or reports the unresolved conflicts. The fs/argv I/O
// lives here so node-merge.ts stays pure and fs-free.
//
// Usage (the ESM loader form, never `npx tsx` — the tsx CLI opens an IPC unix
// socket at start-up that a sandboxed caller cannot open, EPERM):
//   node --import tsx/esm packages/intentionsutil/scripts/merge-node.ts \
//     --base <path-or-empty> --ours <path> --theirs <path-or-empty> --out <path>
//
// Output contract — THREE outcomes, given three distinct exit statuses so a
// bash caller can tell a content outcome from a broken environment:
//
//   exit 0, one line of JSON on stdout — this tool RAN and reached a verdict:
//     resolved==true  → {"resolved":true,"conflicts":[]}    (--out written)
//     resolved==false → {"resolved":false,"conflicts":[...]} (--out NOT written)
//
//   exit 3, an error on stderr and NO JSON on stdout — this tool RAN and failed
//     ON ITS INPUTS (unparseable frontmatter, a missing required arg, an
//     unreadable path). stderr carries why. This is a content-shaped failure:
//     the caller may fail closed and park the node.
//
//   ANY OTHER exit status — this tool NEVER RAN (module resolution failure,
//     missing interpreter, a sandbox denial). Nothing here produced it and this
//     contract says nothing about it. It is an environment failure the caller
//     must surface as an error — never as a merge outcome, and never as a park.
//
// 3 rather than 1, because 1 is not claimable: a loader that cannot resolve
// `tsx` also exits 1 with ERR_MODULE_NOT_FOUND on stderr and zero bytes on
// stdout — byte-for-byte indistinguishable from this tool's own caught failure.
// 3 is emitted only by the catch below, which is reachable only once main() has
// started, so no start-up failure can forge it.

import { readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";
import { pathToFileURL } from "node:url";
import { extractFrontmatter, extractBody } from "../src/frontmatter.js";
import { validateNode, type IntentionNode } from "../src/schema.js";
import { mergeIntentionNodes, type FieldConflict } from "../src/node-merge.js";

/** Read a raw node file into a validated { node, body } pair. */
function readNodeFile(path: string): { node: IntentionNode; body: string } {
  const raw = readFileSync(path, "utf8");
  // The id is only used for fence-error messages here; derive it from the path.
  const id = path.replace(/^.*\//, "").replace(/\.md$/, "");
  const node = validateNode(parse(extractFrontmatter(raw, id)));
  const body = extractBody(raw, id);
  return { node, body };
}

/** Extract a required `--flag value` from argv, or throw. */
function requireFlag(args: string[], flag: string): string {
  const idx = args.indexOf(flag);
  if (idx === -1 || args[idx + 1] === undefined) {
    throw new Error(`merge-node: ${flag} requires a value argument`);
  }
  return args[idx + 1];
}

// --- Core helper (exported for tests) --------------------------------------

/**
 * Read the three sides, run the three-way merge, and write the resolved node to
 * `outPath` — returning the verdict instead of printing it. `main()` keeps argv
 * parsing, the single JSON stdout line, and the exit code, so this file's
 * documented output contract is unchanged.
 *
 * `--out` is written only when the merge resolved cleanly. An unresolved merge
 * leaves `outPath` untouched so the caller parks on stale content rather than
 * on a half-merged node.
 *
 * An empty `basePath` or `theirsPath` means the id was absent on that side; see
 * the delete/modify note inline below.
 */
export function mergeNodeFiles(
  basePath: string,
  oursPath: string,
  theirsPath: string,
  outPath: string,
): { resolved: boolean; conflicts: FieldConflict[] } {
  const ours = readNodeFile(oursPath);

  // An empty --base means the id did not exist on the base side → no base to
  // three-way against.
  const base = basePath === "" ? null : readNodeFile(basePath);

  // An empty --theirs means the id did not exist on the already-landed side.
  // Its meaning depends on whether a base existed:
  //
  //   - empty --base AND empty --theirs → genuine add/add. The id never existed
  //     for this node on either the base or the already-landed side, so ours is
  //     the only content that ever existed and wins outright — synthesize a
  //     theirs equal to ours with a null base so the merge is a clean
  //     pass-through.
  //
  //   - non-empty --base AND empty --theirs → delete/modify divergence. The
  //     node existed at base and we edited it, but the other writer DELETED it
  //     on the already-landed side. Synthesizing theirs=ours here would
  //     silently re-create the node from our content and revert the other
  //     writer's already-landed deletion with no conflict and no park —
  //     defeating the guarantee that the already-landed edit is never
  //     overwritten automatically. Report it as an unresolved conflict and do
  //     NOT write --out so the caller parks.
  if (theirsPath === "" && base !== null) {
    return { resolved: false, conflicts: [{ field: "<node>", ours: ours.node.id, theirs: null }] };
  }

  const theirs = theirsPath === "" ? { node: ours.node, body: ours.body } : readNodeFile(theirsPath);
  const effectiveBase = theirsPath === "" ? null : base;

  const { merged, body, conflicts } = mergeIntentionNodes(effectiveBase, ours, theirs);

  if (conflicts.length === 0) {
    // Mirror store.ts writeNode's exact serialization: validate (defaults +
    // ordering), then `---\n${stringify}---\n${body}`. `stringify` ends with a
    // newline, so the closing fence lands on its own line.
    const content = `---\n${stringify(validateNode(merged))}---\n${body}`;
    writeFileSync(outPath, content);
    return { resolved: true, conflicts: [] };
  }

  // Unresolved: do NOT write --out. This is an expected outcome, not a crash.
  return { resolved: false, conflicts };
}

// --- Main ------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  const basePath = requireFlag(args, "--base");
  const oursPath = requireFlag(args, "--ours");
  const theirsPath = requireFlag(args, "--theirs");
  const outPath = requireFlag(args, "--out");

  const result = mergeNodeFiles(basePath, oursPath, theirsPath, outPath);
  // `process.exitCode`, never `process.exit()`. When stdout is a PIPE — which
  // is exactly how graph-commit invokes this script — write() is asynchronous
  // once the payload exceeds the pipe buffer (F_GETPIPE_SZ = 65536 on this
  // host). `process.exit()` terminates immediately and DISCARDS whatever is
  // still queued, so a large merge result reaches the caller truncated.
  //
  // The caller then fails `jq -e .` on invalid JSON and reports a broken
  // environment, so a perfectly ordinary large-node merge is misdiagnosed and
  // graph-commit DIES WITH NO PARK WRITTEN. Setting exitCode instead lets the
  // event loop drain the write before the process ends.
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exitCode = 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    // A genuine failure of this tool ON ITS INPUTS: the reserved exit code 3,
    // an error on stderr, no JSON on stdout. See the output contract at the top
    // of this file for why the code is 3 and not 1.
    process.stderr.write(`merge-node: ${err instanceof Error ? err.message : String(err)}\n`);
    // Same reason as the success path above: exitCode, not exit(), so the
    // diagnostic is not truncated on its way to the caller.
    process.exitCode = 3;
  }
}
