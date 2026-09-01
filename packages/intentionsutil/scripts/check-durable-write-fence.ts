// The durable-layer write fence: a mechanical gate an unattended writer must
// clear before landing a node edit it composed itself.
//
// It replaces a prose guard. `/dispatch-conflict`'s Lane 2 used to hand an opus
// subagent the diverged fields plus doctrine telling it never to synthesize new
// substance on human-owned `statement` / `rationale` / clarification text, then
// substitute its own `.<field> = <value>` assignments into an unconstrained `jq`
// filter. The instruction WAS the guard: nothing downstream could tell a
// reordering of the same intent from a rewrite of it, and `write-node.ts` accepts
// any field the schema validates. This gate is the part a model cannot talk its
// way past.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/check-durable-write-fence.ts \
//     --base <base.json> --candidate <candidate.json> [--writer-class <intent|orchestration>]
//
// Both files are full-node JSON in the shape `dump-node.ts` writes and
// `write-node.ts` reads. The gate diffs them itself rather than trusting a
// caller-declared field list: the writer that composed the candidate is exactly
// the party whose honesty is in question, so "which fields did you change?" must
// be answered from the two documents, not from the writer.
//
// `--writer-class` is OPTIONAL and additive. When passed, the fence also unions
// in `refusedCrossClassFields` (schema.ts) — the intent/orchestration boundary —
// alongside the existing durable-kind union, so a declared orchestration writer
// touching an intent-only field (e.g. `statement` on a plain `tactic`) refuses
// even though that field carries no durable-layer doctrine at all. WITHOUT the
// flag, behavior is byte-identical to before this flag existed: `graph-commit`
// invokes this tool flagless and depends on that exactly, as does
// `.claude/skills/dispatch-conflict/SKILL.md` and
// `intentions/tactic-dispatch-conflict-substance-allowlist`.
//
// The check, per changed top-level field, is NEGATIVE (see
// `isDurableWriteRefused`): durable-layer kind AND field not in `STATE_FIELDS`
// means refuse. A field name nobody anticipated refuses by default. The
// positive form — permit when the field appears in some allowed set — fails
// OPEN and was corrected out on 2026-08-15 for exactly that reason.
//
// The node's layer is read from BOTH documents, and the refusal is their UNION.
// Reading the base alone catches the durable-to-anything direction (`kind` is
// not a `STATE_FIELDS` member, so demoting a `strategy` to a `tactic` is itself
// a refused field) but NOT the reverse: a base whose kind is `tactic` is not
// durable, so a candidate that PROMOTES it — `.kind = "strategy"` alongside a
// model-authored `statement` and `rationale` — would clear a base-only check
// and land a brand-new piece of durable-layer doctrine on main. `validateNode`
// does not gate kind-specific fields and `graph-commit` runs no graph
// validation, so nothing downstream would catch it either. Applying the fence
// under the candidate's kind as well closes that direction.
//
// Exit codes:
//   0  every changed field is permitted — the caller may land the write
//   1  usage or read error (missing flag, unreadable/unparseable JSON,
//      id mismatch between the two documents)
//   3  REFUSED — at least one changed field is durable-layer substance. The
//      caller must not land the write; it routes to a human instead.
//
// Pure read + exit code. No graph writes, no git, no gh, no network.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  isPlainObject,
  refusedCrossClassFields,
  refusedDurableFields,
  STATE_FIELDS,
  type WriteClass,
} from "../src/schema.js";

const USAGE =
  "usage: check-durable-write-fence.ts --base <base.json> --candidate <candidate.json> " +
  "[--writer-class <intent|orchestration>]\n" +
  "  Both are full-node JSON (the shape dump-node.ts writes).\n" +
  "  --writer-class is optional; omitting it preserves the original flagless\n" +
  "  behavior exactly. When passed, it must be \"intent\" or \"orchestration\"\n" +
  "  (never \"shared\" — that is a field classification, not a writer).\n" +
  "  Exit 0 = permitted, 1 = usage/read error, 3 = REFUSED.\n";

// --- Core helpers (exported for tests) -------------------------------------

/**
 * The top-level field names whose values differ between `base` and `candidate`,
 * sorted for a stable message. A key present in one document and absent from the
 * other counts as changed — an omitted `rationale` deletes it on write just as
 * surely as a rewritten one replaces it.
 *
 * Values compare by JSON serialization. That is exact for the shape flowing
 * through this gate: both documents come from `JSON.parse` of `dump-node.ts`
 * output, so key order is the writer's and a reordered-but-equal object would
 * read as changed. Refusing a write that only reordered keys is the safe
 * direction — it stops a land the caller can re-route to a human, rather than
 * passing substance through.
 */
export function changedFields(
  base: Record<string, unknown>,
  candidate: Record<string, unknown>,
): string[] {
  const names = new Set([...Object.keys(base), ...Object.keys(candidate)]);
  const changed: string[] = [];
  for (const name of names) {
    if (JSON.stringify(base[name]) !== JSON.stringify(candidate[name])) {
      changed.push(name);
    }
  }
  return changed.sort();
}

/** The verdict this gate returns: which changed fields the fence refuses. */
export interface FenceVerdict {
  /** The BASE document's kind — the layer the node sits in today. */
  kind: string;
  /**
   * The CANDIDATE document's kind — the layer the write would move it to.
   * Equal to `kind` for every ordinary write; different only when the write
   * rewrites `kind` itself, which the fence must judge under BOTH layers (see
   * `fenceVerdict`). Falls back to `kind` when the candidate carries no usable
   * kind at all — that write is already refused on the `kind` field itself when
   * the base is durable, and `validateNode` rejects it downstream regardless.
   */
  candidateKind: string;
  changed: string[];
  refused: string[];
}

/**
 * Apply the fence to a base/candidate pair. Throws `Error` (mapped to exit 1 by
 * the CLI) when either document is not a node the fence can reason about — a
 * missing `kind` or an id mismatch means the caller handed over the wrong pair,
 * which is a misconfigured invocation, not a permitted write
 * (`.claude/rules/code-style.md`: a clear error, never a fallback).
 *
 * `writerClass` is OPTIONAL. Omitted (the original, still-default call shape),
 * the verdict is exactly what this function has always returned — the union of
 * `refusedDurableFields` over both the base and candidate kind, nothing else.
 * Passed, the verdict additionally unions in `refusedCrossClassFields(writerClass,
 * changed)` — the intent/orchestration class fence — so a declared writer that
 * touches a field owned by the other class refuses even on a non-durable kind.
 * The two fences are independent checks at different scopes (see
 * `refusedFields` in schema.ts); this function unions their verdicts rather
 * than delegating to `refusedFields` directly because the durable check alone
 * must be judged under BOTH the base and candidate kind (the promotion case
 * below), while the class check has no analogous kind parameter to double up.
 */
export function fenceVerdict(
  base: unknown,
  candidate: unknown,
  writerClass?: WriteClass,
): FenceVerdict {
  if (!isPlainObject(base)) {
    throw new Error("base is not a JSON object");
  }
  if (!isPlainObject(candidate)) {
    throw new Error("candidate is not a JSON object");
  }
  const kind = base.kind;
  if (typeof kind !== "string" || kind === "") {
    throw new Error("base has no string `kind` — cannot tell which layer it sits in");
  }
  if (base.id !== candidate.id) {
    throw new Error(
      `id mismatch: base is ${JSON.stringify(base.id)}, candidate is ${JSON.stringify(candidate.id)}`,
    );
  }
  // The layer is judged from BOTH documents, and the refusal is their UNION.
  // The base alone only closes the durable-to-anything direction; a candidate
  // that PROMOTES a `tactic` into a `strategy` would otherwise be judged under
  // the base's non-durable kind and land model-authored doctrine. See the
  // header note above `--base`/`--candidate` for the full reasoning.
  const rawCandidateKind = candidate.kind;
  const candidateKind =
    typeof rawCandidateKind === "string" && rawCandidateKind !== "" ? rawCandidateKind : kind;
  const changed = changedFields(base, candidate);
  const refusedUnion = new Set([
    ...refusedDurableFields(kind, changed),
    ...refusedDurableFields(candidateKind, changed),
    // Only touched when writerClass is passed — this is what keeps the
    // flagless call shape byte-identical to before this parameter existed.
    ...(writerClass === undefined ? [] : refusedCrossClassFields(writerClass, changed)),
  ]);
  // Filter `changed` rather than spreading the set, so `refused` keeps the same
  // sorted order `changedFields` established.
  return { kind, candidateKind, changed, refused: changed.filter((f) => refusedUnion.has(f)) };
}

/**
 * The refusal text, naming the node, the fields, and what the caller must do.
 *
 * `writerClass` is OPTIONAL, matching `fenceVerdict`. Omitted, the message text
 * is byte-identical to before this parameter existed. Passed, the message also
 * names which fence(s) fired for each refused field, since with the class fence
 * active a field can be refused by the durable fence, the class fence, or both,
 * and a human resolving the park benefits from knowing which.
 */
export function refusalMessage(
  id: unknown,
  verdict: FenceVerdict,
  writerClass?: WriteClass,
): string {
  // Whether the DURABLE fence contributed to this refusal at all. Without
  // `writerClass`, `fenceVerdict` never adds the class fence, so a non-empty
  // `refused` can only ever come from the durable fence and this is always
  // true — preserving the original "durable-layer" wording byte-for-byte. With
  // `writerClass`, a refusal can now come purely from the class fence on a
  // node whose kind is NOT durable-layer at all (e.g. an orchestration writer
  // touching `statement` on a plain `tactic` — measured live: exit 3, "tactic"
  // is not in DURABLE_LAYER_KINDS). Calling that "a durable-layer node" would
  // be false, so the wording branches on whether the durable fence actually
  // fired for at least one of the refused fields.
  const durableTriggered = verdict.refused.some(
    (field) =>
      refusedDurableFields(verdict.kind, [field]).length > 0 ||
      refusedDurableFields(verdict.candidateKind, [field]).length > 0,
  );
  // Name the layer honestly: on a kind-rewriting candidate the refusal may come
  // from the layer the write moves the node TO, not the one it sits in now.
  const layer =
    verdict.kind === verdict.candidateKind
      ? durableTriggered
        ? `a durable-layer "${verdict.kind}" node`
        : `a "${verdict.kind}" node`
      : durableTriggered
        ? `a "${verdict.kind}" node this write would rewrite as a "${verdict.candidateKind}" ` +
          `one, and at least one of those two is a durable layer`
        : `a "${verdict.kind}" node this write would rewrite as a "${verdict.candidateKind}" one`;
  const fieldsText =
    writerClass === undefined
      ? verdict.refused.join(", ")
      : verdict.refused
          .map((field) => {
            const durable =
              refusedDurableFields(verdict.kind, [field]).length > 0 ||
              refusedDurableFields(verdict.candidateKind, [field]).length > 0;
            const crossClass = refusedCrossClassFields(writerClass, [field]).length > 0;
            const fences = [
              durable ? "durable-layer fence" : null,
              crossClass ? `"${writerClass}"-writer class fence` : null,
            ].filter((f): f is string => f !== null);
            return `${field} (${fences.join(" and ")})`;
          })
          .join(", ");
  return (
    `check-durable-write-fence: REFUSED — ${JSON.stringify(id)} is ${layer}` +
    `, and this write changes ${fieldsText}, ` +
    `which no unattended writer may set.\n` +
    `  changed fields: ${verdict.changed.join(", ")}\n` +
    `  an unattended writer may set only: ${STATE_FIELDS.join(", ")}\n` +
    `  Do not land this write. The divergence is human-owned doctrine: leave the ` +
    `node parked and report it for a human to resolve.\n`
  );
}

// --- Main ------------------------------------------------------------------

function flagValue(args: string[], flag: string): string {
  const idx = args.indexOf(flag);
  const value = idx === -1 ? undefined : args[idx + 1];
  if (value === undefined || value === "" || value.startsWith("-")) {
    process.stderr.write(`check-durable-write-fence: ${flag} <path> is required\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

/**
 * Like `flagValue`, but the flag itself is optional — `undefined` when absent
 * rather than a usage error. Still a usage error if the flag is present with no
 * value, or with a value not in `WRITE_CLASSES` (`"shared"` included: that is a
 * field classification, never a writer declaration — `assertWriterClass` in
 * schema.ts throws on it, which this rejects earlier with a clearer message).
 */
function optionalWriterClass(args: string[], flag: string): WriteClass | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  const value = args[idx + 1];
  if (value === undefined || value === "" || value.startsWith("-")) {
    process.stderr.write(`check-durable-write-fence: ${flag} <intent|orchestration> requires a value\n${USAGE}`);
    process.exit(1);
  }
  if (value === "intent" || value === "orchestration") {
    return value;
  }
  process.stderr.write(
    `check-durable-write-fence: ${flag} must be one of "intent", "orchestration" ` +
      `(got ${JSON.stringify(value)}; "shared" is a field classification, not a writer)\n${USAGE}`,
  );
  process.exit(1);
}

/** An error's message, narrowed rather than cast — a thrown non-Error stringifies. */
function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function readJson(path: string): unknown {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (err) {
    process.stderr.write(
      `check-durable-write-fence: cannot read ${path}: ${errorMessage(err)}\n`,
    );
    process.exit(1);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    process.stderr.write(
      `check-durable-write-fence: ${path} is not valid JSON: ${errorMessage(err)}\n`,
    );
    process.exit(1);
  }
}

function main(argv: string[]): void {
  const args = argv.slice(2);
  const basePath = flagValue(args, "--base");
  const candidatePath = flagValue(args, "--candidate");
  const writerClass = optionalWriterClass(args, "--writer-class");

  const base = readJson(basePath);
  const candidate = readJson(candidatePath);

  let verdict: FenceVerdict;
  try {
    verdict = fenceVerdict(base, candidate, writerClass);
  } catch (err) {
    process.stderr.write(`check-durable-write-fence: ${errorMessage(err)}\n`);
    process.exit(1);
  }

  if (verdict.refused.length > 0) {
    process.stderr.write(refusalMessage(isPlainObject(base) ? base.id : null, verdict, writerClass));
    process.exit(3);
  }

  process.exit(0);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv);
}
