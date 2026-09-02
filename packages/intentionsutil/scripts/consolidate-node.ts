// The consolidation CLI: plans (and, off --dry-run, writes) one node's
// restatement via `planRestatement` / `writeRestatedNode`
// (packages/intentionsutil/src/restate.ts), and prints the exact
// `graph-commit` command the operator runs to land it. This CLI NEVER invokes
// graph-commit itself — see "THE LANDING DISCIPLINE" below for why.
//
// Usage (the ESM loader form, never `npx tsx` — the tsx CLI opens an IPC unix
// socket at start-up that a sandboxed caller cannot open, EPERM):
//   node --import tsx/esm packages/intentionsutil/scripts/consolidate-node.ts \
//     --dir <abs intentions path> --id <node-id> --file <restatement JSON> [--dry-run]
//
// `--dir` is REQUIRED and never inferred from this script's own location — a
// worktree-isolated session refuses `git -C` to any path but its own worktree,
// and every store-reading CLI in this plan takes the store path explicitly for
// the same reason (.claude/rules/sandbox.md, "git -C is auto-approved for
// worktrees").
//
// `--dry-run` prints the plan and the citation and writes nothing. This is the
// default posture for a reviewer: run without it only once the printed plan
// has been read and accepted.
//
// --- `--corpus rules` MODE ---------------------------------------------------
//
//   node --import tsx/esm packages/intentionsutil/scripts/consolidate-node.ts \
//     --corpus rules --rules-dir <abs .claude/rules path>
//
// A SECOND, UNRELATED entry point sharing this CLI rather than a second binary
// — the TRIGGER signal (`tactic-consolidation-operation` Unit 7) applied to
// `.claude/rules/` source instead of the graph. It feeds
// `consolidationCandidates` (`../src/consolidation.js`) `SizeRecord`s built
// from every `.claude/rules/*.md` file: `bytes` the file's own byte length,
// `units` its `^## ` heading count, `latestDate` always `null` (the rules
// corpus carries no date signal). Same ranking implementation `digest.ts`'s
// `[CONSOLIDATION-DEBT]` table calls, over a different corpus — see
// `consolidation.ts`'s "THE TRIGGER SIGNAL" module-header paragraph for why
// one function serves both.
//
// READ-ONLY. This mode takes `--rules-dir` in place of `--dir`/`--id`/--file`
// (which it neither requires nor accepts — a mixed invocation naming both is a
// usage error) and NEVER WRITES ANYTHING: it lists a shortlist, exactly like
// `deferred-queue.ts`'s report mode. Shipping the signal is this unit's job;
// consolidating any rules file is a separate, later application claim this
// mode does not make.
//
// `--rules-dir` is REQUIRED and, like `--dir` above, never inferred from this
// script's own location, for the identical sandbox reason.
//
// --- THE `--file` JSON SHAPE -------------------------------------------------
//
// The file is a direct serialization of what `RestatementInput`
// (`packages/intentionsutil/src/restate.ts`) needs, MINUS the two fields this
// CLI supplies itself by reading the store (`node`, `body`) and MINUS the
// `dispositions` field, which this CLI resolves rather than asking the caller
// to hand-author `DispositionRecord` objects (their `key`/`excerpt` are
// parser output, not something a caller should retype by hand):
//
//   {
//     "dispositionKeys": ["<node-id>#<ordinal>", ...],
//     "foldedClarifications": [<1-based index>, ...],
//     "restatedBody": "<prose, WITHOUT the citation block>",
//     "restatedClarifications": [{"question": "...", "answer": "..."}, ...],
//     "foldDate": "YYYY-MM-DD",
//     "foldDelegatee": "<delegatee mount id>" | null,
//     "allowGrowth": "<reason>" | null   // optional; omit or null for the normal shrink case
//   }
//
// `dispositionKeys` names which of the NODE'S OWN existing `(decision: ...)`
// stamps this fold is covered by. This CLI re-derives the full stamp list for
// the node via `parseStampGrammar` (over clarifications-then-body, the same
// per-node join `deferredQueue` uses) and resolves each requested key against
// it — a key naming a stamp that is not on the node is a caller input error
// (exit 3), not a silent no-op. An EMPTY `dispositionKeys` array is a
// legitimate input (not an error): it reaches `consolidationVerdict`'s own
// empty-input row and refuses, per
// `.claude/rules/measurement-and-provenance.md` (unrecoverable provenance is
// treated as binding, never dropped) — the same rule `RestatementInput`'s own
// doc comment states.
//
// UNLIKE `deferred-queue.ts`'s store-wide deriver, this CLI parses the target
// node's stamps with the STRICT `parseStampGrammar` directly, not the
// per-stamp-tolerant `parseTolerant` path `deferredQueue` uses internally.
// `deferredQueue` must tolerate a malformed stamp elsewhere in a large corpus
// so one bad node never hides every well-formed queue item store-wide,
// measured necessary at consolidation.ts's module header ("TOLERANT
// DERIVATION, STRICT PARSER"). This CLI instead operates on exactly one node
// at a time, so a malformed stamp ANYWHERE on that node is exactly the
// condition that should block consolidating it until the stamp is fixed —
// surfacing that loudly as an exit-3 input failure is more useful here than
// silently working around it.
//
// --- THE LANDING DISCIPLINE (read before running this CLI off --dry-run) ---
//
// A consolidation is landed with:
//
//   packages/intentionsutil/scripts/graph-commit -C <abs repo root> \
//     -m 'graph: consolidate <id>' --base <id>=<pre-edit-blobsha> <id>
//
// `--base` is MANDATORY for a consolidation, never optional — this CLI prints
// the command with it filled in for exactly that reason. Rationale: the
// graph's layer-2 three-way merge is measured to drop a field removal and to
// duplicate an element rewrite (packages/intentionsutil/src/node-merge.ts,
// packages/intentionsutil/scripts/merge-node.ts), and a consolidation is BY
// CONSTRUCTION a removal plus an element rewrite — every fold is exactly the
// shape that merge silently resurrects. `--base` is the guard against that:
// its compare-and-swap REFUSES BEFORE ANY LOCAL COMMIT IS MADE when the named
// blob has moved on origin/main since it was read
// (packages/intentionsutil/scripts/graph-commit:49-52). A concurrent
// divergence on this node must PARK, never merge — landing a consolidation
// through the ordinary merge path is the one failure mode this whole
// operation exists to prevent, so this CLI never offers that path at all.
//
// This CLI NEVER INVOKES graph-commit itself. It prepares the edit and prints
// the exact command; the operator runs it. A tool that both rewrites and
// lands in one step removes the reviewer's stopping point, and the whole
// consolidation operation is authority-gated on that stopping point existing.
//
// Two sandbox facts a clean session needs before running the printed command:
//
//   1. `graph-commit` requires an EXPLICIT `-C <abs repo root>`. It resolves
//      the repo root from `-C`/`--repo`, else **cwd** — NEVER from its own
//      on-disk location (`.claude/rules/sandbox.md`, "git -C is auto-approved
//      for worktrees"). This CLI computes that root as the parent directory
//      of `--dir` (the fixed `<repo-root>/intentions` layout every CLI in
//      this plan assumes) and fills it into the printed command; if `--dir`
//      does not follow that layout, correct the `-C` value before running.
//
//   2. `graph-commit` MUST run with `dangerouslyDisableSandbox: true` on the
//      FIRST attempt, not on retry. Its internal landing rebase is a
//      tree-updating git operation against the same read-only carve-outs
//      every other such operation hits; on a SANDBOXED failure that rebase
//      REVERTS THE UNCOMMITTED NODE EDIT IN THE WORKING TREE, and there is
//      nothing left to retry on — the edit a second attempt would land no
//      longer exists (`.claude/rules/sandbox.md`, "graph-commit"). This is
//      the same criterion `git worktree remove` meets: the first sandboxed
//      attempt has already done the damage, so pre-empting the override (not
//      waiting for a failure to retry against) is the only safe order.
//
// --- THE PRE-EDIT BLOB SHA ---------------------------------------------------
//
// On a permitted, non-dry-run plan this CLI prints the blob sha of the node
// file AS IT STOOD BEFORE THIS CLI'S OWN WRITE — `git hash-object` semantics
// — so it can be passed straight to `graph-commit --base`. Computed IN-PROCESS
// via `node:crypto`, not by shelling out to `git hash-object`: `git`'s blob
// object id is `sha1("blob " + <byte length> + "\0" + <raw bytes>)` for a
// repository in the default SHA-1 object format, which this function
// reproduces exactly over the same bytes `readFileSync` already has in hand
// (no process spawn, and no dependency on a `git` binary being reachable from
// wherever this CLI runs). The sha is captured BEFORE `writeRestatedNode` is
// called, since that call is what changes the bytes it describes.
//
// --- THE THREE-WAY EXIT-CODE CONTRACT ---------------------------------------
//
// The SAME contract merge-node.ts documents
// (packages/intentionsutil/scripts/merge-node.ts:12-33), verbatim:
//
//   exit 0 — this tool RAN and reached a verdict, INCLUDING A REFUSAL. A
//     refusal (a ratified stamp among the folded content, or no stamp
//     covering it at all) is an outcome of the authority gate, not a failure
//     of the tool — merge-node.ts's own `resolved: false` precedent, restated
//     by `planRestatement`'s doc comment. One human-readable report is
//     written to stdout either way.
//
//   exit 3 — this tool RAN and failed ON ITS INPUTS: a missing --dir/--id/
//     --file, an unreadable store or node, malformed JSON in --file, a
//     --file field of the wrong shape, a dispositionKeys entry naming a stamp
//     absent from the node, or a `planRestatement`/`writeRestatedNode` guard
//     throwing (an out-of-range foldedClarifications index, an empty restated
//     body, a body that already carries a citation heading, a restated body
//     that grows the node without an `allowGrowth` reason). stderr carries
//     why. No stdout report is written on this path. `--corpus rules` mode
//     shares this same exit-3 treatment for a missing/unreadable
//     `--rules-dir` or a `--dir`/`--id`/`--file` supplied alongside `--corpus`.
//
//   ANY OTHER exit status — this tool NEVER RAN (module resolution failure,
//     missing interpreter, a sandbox denial). Nothing here produced it.
//
// `process.exitCode` is used throughout, never `process.exit()` — same reason
// as merge-node.ts:151-163: `exit()` discards whatever is still queued on a
// PIPE once the payload exceeds the pipe buffer, truncating a large report on
// its way to a caller.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readNode, readNodeBody } from "../src/store.js";
import {
  consolidationCandidates,
  parseStampGrammar,
  type DispositionRecord,
  type SizeRecord,
} from "../src/consolidation.js";
import { planRestatement, writeRestatedNode } from "../src/restate.js";
import { isPlainObject, type Clarification } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";

/** Extract a required `--flag value` from argv, or throw. */
function requireFlag(args: string[], flag: string): string {
  const idx = args.indexOf(flag);
  const value = idx === -1 ? undefined : args[idx + 1];
  if (value === undefined) {
    throw new Error(`consolidate-node: ${flag} requires a value argument`);
  }
  return value;
}

/** What `parseRestatementFile` produces: the caller-supplied half of `RestatementInput`. */
interface ConsolidateFileInput {
  dispositionKeys: string[];
  foldedClarifications: number[];
  restatedBody: string;
  restatedClarifications: Clarification[];
  foldDate: string;
  foldDelegatee: string | null;
  allowGrowth: string | null;
}

function requireStringField(obj: Record<string, unknown>, field: string): string {
  const value = obj[field];
  if (typeof value !== "string") {
    throw new IntentionSchemaError(
      `consolidate-node: --file field "${field}" must be a string, got ${typeof value}`,
    );
  }
  return value;
}

function optionalStringField(obj: Record<string, unknown>, field: string): string | null {
  const value = obj[field];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new IntentionSchemaError(
      `consolidate-node: --file field "${field}" must be a string or null, got ${typeof value}`,
    );
  }
  return value;
}

function requireStringArrayField(obj: Record<string, unknown>, field: string): string[] {
  const value = obj[field];
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(
      `consolidate-node: --file field "${field}" must be an array, got ${typeof value}`,
    );
  }
  return value.map((item, i) => {
    if (typeof item !== "string") {
      throw new IntentionSchemaError(
        `consolidate-node: --file field "${field}[${i}]" must be a string, got ${typeof item}`,
      );
    }
    return item;
  });
}

function requireNumberArrayField(obj: Record<string, unknown>, field: string): number[] {
  const value = obj[field];
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(
      `consolidate-node: --file field "${field}" must be an array, got ${typeof value}`,
    );
  }
  return value.map((item, i) => {
    if (typeof item !== "number") {
      throw new IntentionSchemaError(
        `consolidate-node: --file field "${field}[${i}]" must be a number, got ${typeof item}`,
      );
    }
    return item;
  });
}

function requireClarificationsField(obj: Record<string, unknown>, field: string): Clarification[] {
  const value = obj[field];
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(
      `consolidate-node: --file field "${field}" must be an array, got ${typeof value}`,
    );
  }
  return value.map((item, i) => {
    if (!isPlainObject(item)) {
      throw new IntentionSchemaError(`consolidate-node: --file field "${field}[${i}]" must be an object`);
    }
    const question = item.question;
    const answer = item.answer;
    if (typeof question !== "string" || typeof answer !== "string") {
      throw new IntentionSchemaError(
        `consolidate-node: --file field "${field}[${i}]" must have a string "question" and a string "answer"`,
      );
    }
    return { question, answer };
  });
}

/**
 * Parse and validate `raw` (the `--file` contents) into a `ConsolidateFileInput`.
 * Throws `IntentionSchemaError` on malformed JSON or a field of the wrong
 * shape — a content-shaped failure this CLI's caller can fail closed on,
 * exactly like a malformed frontmatter fence.
 */
export function parseRestatementFile(raw: string): ConsolidateFileInput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new IntentionSchemaError(
      `consolidate-node: --file is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!isPlainObject(parsed)) {
    throw new IntentionSchemaError("consolidate-node: --file JSON must be an object");
  }
  return {
    dispositionKeys: requireStringArrayField(parsed, "dispositionKeys"),
    foldedClarifications: requireNumberArrayField(parsed, "foldedClarifications"),
    restatedBody: requireStringField(parsed, "restatedBody"),
    restatedClarifications: requireClarificationsField(parsed, "restatedClarifications"),
    foldDate: requireStringField(parsed, "foldDate"),
    foldDelegatee: optionalStringField(parsed, "foldDelegatee"),
    allowGrowth: optionalStringField(parsed, "allowGrowth"),
  };
}

/**
 * Resolve `keys` (each a `<nodeId>#<ordinal>` disposition key) against the
 * node's own stamps, parsed strictly — see the module header for why this CLI
 * uses the strict parser rather than `deferredQueue`'s tolerant one. Throws
 * naming any key not found, listing the keys that ARE present so the caller
 * can correct the `--file` input without re-running a separate lookup.
 */
export function resolveDispositions(
  nodeId: string,
  kind: string,
  corpus: string,
  keys: readonly string[],
): DispositionRecord[] {
  const all = parseStampGrammar(nodeId, kind, corpus);
  const byKey = new Map(all.map((record) => [record.key, record]));
  return keys.map((key) => {
    const record = byKey.get(key);
    if (record === undefined) {
      const available = all.map((r) => r.key).join(", ") || "(none)";
      throw new IntentionSchemaError(
        `consolidate-node: dispositionKeys entry "${key}" is not a stamp found on ${nodeId} — available keys: ${available}`,
      );
    }
    return record;
  });
}

/**
 * `git hash-object` semantics, computed in-process — see the module header's
 * "THE PRE-EDIT BLOB SHA" section for why this is not a `git` subprocess call.
 */
export function gitBlobSha1(bytes: Buffer): string {
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return createHash("sha1").update(Buffer.concat([header, bytes])).digest("hex");
}

/**
 * Run one consolidation plan (and, off `dryRun`, the write) and return the
 * report text. Exported so tests can exercise the core logic without spawning
 * the CLI, matching `mergeNodeFiles` / `deriveDeferredQueue`'s precedent.
 */
export function runConsolidation(dir: string, id: string, fileRaw: string, dryRun: boolean): string {
  const node = readNode(dir, id);
  const body = readNodeBody(dir, id);
  const input = parseRestatementFile(fileRaw);

  const corpus = [...node.clarifications.map((c) => c.answer), body].join("\n\n");
  const dispositions = resolveDispositions(node.id, node.kind, corpus, input.dispositionKeys);

  const plan = planRestatement({
    node,
    body,
    dispositions,
    restatedBody: input.restatedBody,
    restatedClarifications: input.restatedClarifications,
    foldedClarifications: input.foldedClarifications,
    foldDate: input.foldDate,
    foldDelegatee: input.foldDelegatee,
    allowGrowth: input.allowGrowth,
  });

  const lines: string[] = [`consolidate-node: ${node.id}`];

  if (!plan.permitted) {
    lines.push("verdict: refused");
    lines.push(`reason: ${plan.refusal ?? "(no reason reported — a planRestatement defect)"}`);
    return lines.join("\n") + "\n";
  }

  // A permitted plan's other fields are non-null by `planRestatement`'s own
  // contract; guard explicitly rather than asserting, so a defect there is a
  // loud exit-3 failure instead of a silent `null` reaching disk.
  if (plan.restatedBody === null || plan.restatedClarifications === null || plan.citation === null || plan.resultState === null) {
    throw new IntentionSchemaError(
      "consolidate-node: planRestatement reported permitted but returned a null plan field — this is a planRestatement defect, not a caller input error",
    );
  }

  lines.push("verdict: permitted");
  lines.push(`result-state: ${plan.resultState}`);

  if (dryRun) {
    lines.push("mode: dry-run (nothing written)");
    lines.push("");
    lines.push(plan.citation);
    return lines.join("\n") + "\n";
  }

  // Capture the PRE-EDIT blob sha before writeRestatedNode changes the bytes
  // it describes.
  const filePath = join(dir, `${node.id}.md`);
  const preEditSha = gitBlobSha1(readFileSync(filePath));

  writeRestatedNode(dir, { ...node, clarifications: plan.restatedClarifications }, plan.restatedBody, {
    allowGrowth: input.allowGrowth,
  });

  const repoRoot = dirname(resolve(dir));
  const landingCommand =
    `packages/intentionsutil/scripts/graph-commit -C ${repoRoot} ` +
    `-m 'graph: consolidate ${node.id}' --base ${node.id}=${preEditSha} ${node.id}`;

  lines.push("mode: write (node file rewritten — nothing landed)");
  lines.push("");
  lines.push(plan.citation);
  lines.push(`pre-edit blob sha: ${preEditSha}`);
  lines.push("");
  lines.push("landing command (this CLI never runs it — the operator reviews and lands separately):");
  lines.push(landingCommand);
  return lines.join("\n") + "\n";
}

// --- `--corpus rules` mode: the TRIGGER signal over `.claude/rules/*.md` ---
// See the module header's "`--corpus rules` MODE" section for what this is
// and why it lives in this CLI rather than a second binary.

/** `^## ` heading count — the `units` half of one rules file's `SizeRecord`. */
function headingCount(text: string): number {
  return text.split("\n").filter((line) => line.startsWith("## ")).length;
}

/**
 * Build one `SizeRecord` per `*.md` file directly inside `rulesDir` (no
 * recursion — the rules corpus is a flat directory), `bytes` the file's own
 * byte length and `units` its `^## ` heading count, `latestDate` always
 * `null` (the rules corpus carries no date signal). Exported so a test can
 * exercise the record-building step independent of `consolidationCandidates`
 * itself, matching this file's `resolveDispositions`/`parseRestatementFile`
 * precedent of exporting each pure step.
 */
export function rulesSizeRecords(rulesDir: string): SizeRecord[] {
  const files = readdirSync(rulesDir).filter((name) => name.endsWith(".md"));
  return files.map((name) => {
    const text = readFileSync(join(rulesDir, name), "utf8");
    return {
      id: name,
      bytes: Buffer.byteLength(text, "utf8"),
      units: headingCount(text),
      latestDate: null,
    };
  });
}

/**
 * Render the `--corpus rules` report: the same shortlist shape
 * `[CONSOLIDATION-DEBT]` prints in `digest.ts`, over the rules corpus instead
 * of the graph. READ-ONLY — this function only reads `rulesDir` and returns
 * text; nothing here writes.
 */
export function runRulesCorpus(rulesDir: string): string {
  const records = rulesSizeRecords(rulesDir);
  const candidates = consolidationCandidates(records);
  const totalBytes = candidates.reduce((sum, c) => sum + c.bytes, 0);
  const lines: string[] = [
    `consolidate-node --corpus rules: ${rulesDir}`,
    `${totalBytes} bytes total across ${candidates.length} files`,
    "",
  ];
  for (const c of candidates) {
    lines.push(`  ${String(c.bytes).padStart(8)}b  ${c.units} headings  ${c.id}`);
  }
  return lines.join("\n") + "\n";
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--corpus")) {
    const corpus = requireFlag(args, "--corpus");
    if (corpus !== "rules") {
      throw new IntentionSchemaError(
        `consolidate-node: unrecognized --corpus value "${corpus}" — the only supported value is "rules"`,
      );
    }
    if (args.includes("--dir") || args.includes("--id") || args.includes("--file")) {
      throw new IntentionSchemaError(
        "consolidate-node: --corpus rules is a read-only listing mode and does not take --dir/--id/--file — use --rules-dir instead",
      );
    }
    const rulesDir = requireFlag(args, "--rules-dir");
    const report = runRulesCorpus(rulesDir);
    process.stdout.write(report);
    process.exitCode = 0;
    return;
  }

  const dir = requireFlag(args, "--dir");
  const id = requireFlag(args, "--id");
  const filePath = requireFlag(args, "--file");
  const dryRun = args.includes("--dry-run");

  const fileRaw = readFileSync(filePath, "utf8");
  const report = runConsolidation(dir, id, fileRaw, dryRun);
  process.stdout.write(report);
  process.exitCode = 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    // A genuine failure of this tool ON ITS INPUTS: reserved exit code 3, an
    // error on stderr, no report on stdout. See the output contract at the
    // top of this file for why the code is 3 and not 1 (merge-node.ts:29-33
    // states the same reasoning).
    process.stderr.write(`consolidate-node: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 3;
  }
}
