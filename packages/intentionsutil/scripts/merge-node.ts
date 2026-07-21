// CLI wrapper around the pure `mergeIntentionNodes` primitive. Reads three
// raw node files (base / ours / theirs), runs the three-way field-level merge,
// and either writes the auto-resolved node to --out (mirroring store.ts's exact
// writeNode serialization) or reports the unresolved conflicts. The fs/argv I/O
// lives here so node-merge.ts stays pure and fs-free.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/merge-node.ts \
//     --base <path-or-empty> --ours <path> --theirs <path-or-empty> --out <path>
//
// Output contract (stdout, single line of JSON):
//   resolved==true  → {"resolved":true,"conflicts":[]}   (--out written), exit 0
//   resolved==false → {"resolved":false,"conflicts":[...]} (--out NOT written), exit 0
// A tool crash (unparseable frontmatter, missing required arg, etc.) exits
// non-zero with an error on stderr and NO JSON on stdout, so a bash caller can
// distinguish "attempted, unresolved" from "could not even attempt".

import { readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";
import { pathToFileURL } from "node:url";
import { extractFrontmatter, extractBody } from "../src/frontmatter.js";
import { validateNode, type IntentionNode } from "../src/schema.js";
import { mergeIntentionNodes } from "../src/node-merge.js";

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

function main(): void {
  const args = process.argv.slice(2);
  const basePath = requireFlag(args, "--base");
  const oursPath = requireFlag(args, "--ours");
  const theirsPath = requireFlag(args, "--theirs");
  const outPath = requireFlag(args, "--out");

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
    const conflicts = [{ field: "<node>", ours: ours.node.id, theirs: null }];
    process.stdout.write(JSON.stringify({ resolved: false, conflicts }) + "\n");
    process.exit(0);
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
    process.stdout.write(JSON.stringify({ resolved: true, conflicts: [] }) + "\n");
    process.exit(0);
  }

  // Unresolved: do NOT write --out. This is an expected outcome, not a crash.
  process.stdout.write(JSON.stringify({ resolved: false, conflicts }) + "\n");
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    // A genuine tool failure: non-zero exit, error on stderr, no JSON on stdout.
    process.stderr.write(`merge-node: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
