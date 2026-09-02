/**
 * The restatement writer: the pure fold planner, and the one narrow node writer
 * that is allowed to replace a body.
 *
 * WHY THIS MODULE EXISTS AT ALL — the fact a clean session must not have to
 * rediscover: `writeNode` CANNOT CHANGE A BODY. It accepts frontmatter only
 * (`packages/intentionsutil/src/store.ts:84`), re-reads the existing file's body
 * from disk (`readExistingBody`, `:357`), and `assertNoBodyLoss` (`:320`) throws
 * if a rewrite would replace an authored body with regenerated content. The
 * dump-node → edit-JSON → write-node round trip therefore can never restate a
 * body, by construction. That guard is correct and it stays: it is what makes
 * every ordinary write body-safe across its ~21 call sites, and it is
 * deliberately UNCONDITIONAL — no opt-out flag was added to `writeNode` for this
 * unit, because a flag any caller could reach for is not a guard.
 *
 * Consolidation is the one sanctioned exception, so it gets its own narrow
 * writer BESIDE `writeNode` rather than a hole inside it. `writeRestatedNode`
 * mirrors `writeNode`'s serialization exactly, following the one existing
 * precedent for writing a node file with a caller-supplied body
 * (`packages/intentionsutil/scripts/merge-node.ts:114-120`): validate first, then
 * `---\n${stringify(validateNode(node))}---\n${body}`, published through the same
 * temp-file-then-rename discipline `writeFileAtomic` (`store.ts:286`) uses. The
 * fence format is not reinvented here and the atomic publisher is imported, not
 * copied — two spellings of a node file are two chances to drift.
 *
 * THE PLANNER IS PURE. `planRestatement` reads no file, runs no clock, and calls
 * no process. The fold date arrives as an argument, exactly as `digest.ts` and
 * `consolidation.ts` take their inputs, so two runs over the same input produce
 * byte-identical output — the determinism contract `digest.ts:13-15` states.
 *
 * A REFUSAL IS A RESULT, NOT A THROW. The authority gate lives in
 * `consolidationVerdict` (`consolidation.ts`) and is consulted here rather than
 * re-derived; when it refuses, `planRestatement` returns a plan carrying
 * `permitted: false` and the gate's reason, with no restated content at all.
 * That mirrors merge-node.ts's `resolved: false` precedent: the CLI renders the
 * refusal and exits 0 with a verdict, because "the author must do this in
 * interview" is an OUTCOME of the operation, not a failure of the tool. Throws
 * are reserved for caller errors — a fold index out of range, a missing
 * delegatee, a body that would be written without a citation.
 *
 * NOTHING IS DELETED WITHOUT A CITATION. This is the common-law-restatement
 * tradition applied literally: a restatement of accreted precedent cites what it
 * consolidates. Every plan carries a `## Consolidation record` block naming the
 * disposition stamps folded, the clarification indices folded, the before/after
 * byte counts, and the fold's own stamp from `renderStamp`. Git is the deep
 * history; the citation is the pointer into it. The writer REFUSES a body with
 * no citation block, so the citation cannot be dropped on the way to disk.
 *
 * NO WRITE CLASS IS DECLARED, DELIBERATELY. `writeNode`'s optional `writes`
 * fence unions the durable-kind fence, which refuses every field outside
 * `STATE_FIELDS` on a durable-layer kind whatever the writer's class
 * (`schema.ts:822-836`). `clarifications` is not a state field and `strategy` is
 * a durable kind, so declaring a class here would refuse every strategy
 * consolidation outright — i.e. exactly the folds this operation exists to
 * perform. What fences this path instead is the authority gate above it (a
 * ratified stamp refuses), the citation guard below it, and the landing
 * discipline beside it: a consolidation lands with
 * `graph-commit --base <id>=<blobsha>`, never through the layer-2 three-way
 * merge, which is measured to drop a field removal and duplicate an element
 * rewrite — and a consolidation is by construction both. That landing rule is
 * Unit 4's to state in the CLI header; it is named here so this module is not
 * read as an unfenced writer.
 *
 * OFF THE PUBLIC BARREL. `planRestatement` is exported from
 * `packages/intentionsutil/src/index.ts` like every other pure surface in this
 * package; `writeRestatedNode` deliberately is NOT, so it is not reached for
 * casually beside `writeNode`. `packages/intentionsutil/test/restate.test.ts`
 * asserts that absence.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import { validateNode, type Clarification, type IntentionNode, type IntentionNodeInput } from "./schema.js";
import { assertPathSafeId, writeFileAtomic } from "./store.js";
import { extractBody } from "./frontmatter.js";
import { IntentionSchemaError } from "./errors.js";
import {
  consolidationVerdict,
  renderStamp,
  type DispositionRecord,
  type DispositionState,
} from "./consolidation.js";

/**
 * The fixed heading the citation block lives under. Fixed, and not a caller
 * option, so a reader of any restated node — and the writer's own guard — can
 * always find what was folded by looking for one exact string.
 */
export const CITATION_HEADING = "## Consolidation record";

/** The citation heading as its own markdown line, which is how the guard tests for it. */
const CITATION_HEADING_LINE = /^## Consolidation record$/m;

/** What a caller hands the planner. Plain data; nothing here is read from disk. */
export interface RestatementInput {
  /** The node being restated. Its frontmatter is what the writer serializes. */
  node: IntentionNode;
  /** The pre-fold body, verbatim from disk — the bytes the restatement replaces. */
  body: string;
  /**
   * Every disposition covering the content being folded. Their states are what
   * the authority gate rules on; their keys are what the citation names. An
   * EMPTY list refuses (unrecoverable provenance is treated as binding,
   * `.claude/rules/measurement-and-provenance.md`), which is the gate's own
   * empty-input row and not a second rule invented here.
   */
  dispositions: readonly DispositionRecord[];
  /**
   * The restated prose, WITHOUT the citation block. The planner appends the
   * citation; a caller that pastes its own is writing an unverifiable record.
   */
  restatedBody: string;
  /** The restated clarification list that replaces `node.clarifications`. */
  restatedClarifications: readonly Clarification[];
  /**
   * 1-based indices into `node.clarifications` naming which source
   * clarifications this fold consolidated. Empty means a body-only fold. Out of
   * range throws — a citation that names a clarification that does not exist is
   * worse than no citation.
   */
  foldedClarifications: readonly number[];
  /** `YYYY-MM-DD`, supplied by the caller so this planner stays clock-free. */
  foldDate: string;
  /** The delegatee mount id the fold's own stamp names. Required when permitted. */
  foldDelegatee: string | null;
  /**
   * A reason string when this restatement deliberately GROWS the node. Recorded
   * verbatim in the citation, and the writer's growth guard looks for it there.
   * `null`/absent is the normal case: a consolidation shrinks.
   */
  allowGrowth?: string | null;
}

/** What the planner returns. A refusal is one of its two ordinary shapes. */
export interface RestatementPlan {
  /** Whether the authority gate sanctions this fold. */
  permitted: boolean;
  /** The state the fold's own stamp carries, or `null` when refused. */
  resultState: DispositionState | null;
  /** The restated body WITH the citation appended, or `null` when refused. */
  restatedBody: string | null;
  /** The restated clarification list, or `null` when refused. */
  restatedClarifications: Clarification[] | null;
  /** The `## Consolidation record` block, or `null` when refused. */
  citation: string | null;
  /** The gate's reason when refused, `null` when permitted. */
  refusal: string | null;
}

/**
 * Order dispositions for the citation independently of the order the caller
 * happened to collect them in: by node id, then by the numeric ordinal in the
 * `<nodeId>#<ordinal>` key, then by the whole key. Comparing ordinals as numbers
 * rather than as text is what keeps `#10` after `#2`.
 *
 * Caller-order independence is a stronger determinism than the byte-identity
 * contract strictly needs, and it is deliberate: two sessions that gather the
 * same stamps by different routes must produce the same citation, or the
 * citation cannot be diffed across cycles.
 */
function compareRecords(a: DispositionRecord, b: DispositionRecord): number {
  if (a.nodeId !== b.nodeId) return a.nodeId < b.nodeId ? -1 : 1;
  const ordinalA = keyOrdinal(a.key);
  const ordinalB = keyOrdinal(b.key);
  if (ordinalA !== ordinalB) return ordinalA - ordinalB;
  if (a.key !== b.key) return a.key < b.key ? -1 : 1;
  return 0;
}

/** The ordinal suffix of a `<nodeId>#<ordinal>` key, or 0 for any other shape. */
function keyOrdinal(key: string): number {
  const hash = key.lastIndexOf("#");
  if (hash === -1) return 0;
  const parsed = Number.parseInt(key.slice(hash + 1), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** UTF-8 byte length — the unit a read-cost claim is made in, not code points. */
function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

/**
 * Build the `## Consolidation record` block.
 *
 * Deterministic by construction: every line is derived from the arguments, with
 * no clock, no environment, and no caller-order dependence (see
 * `compareRecords`). The byte counts describe the PROSE fold — the body before,
 * and the restated body before this record is appended to it — because a count
 * that included the record would have to describe its own length. The writer's
 * growth guard measures the real file body instead, so the two are not the same
 * measurement wearing one name.
 */
function renderCitation(
  input: RestatementInput,
  resultState: DispositionState,
): string {
  const stamp = renderStamp(resultState, input.foldDelegatee, input.foldDate);
  const records = [...input.dispositions].sort(compareRecords);
  const sourceCount = input.node.clarifications.length;
  const folded = [...input.foldedClarifications].sort((a, b) => a - b);
  const lines: string[] = [];
  lines.push(CITATION_HEADING);
  lines.push("");
  lines.push(
    "A restatement cites what it consolidated. The folded text is not lost — it is",
  );
  lines.push(
    "in git, at the commit preceding this one. This record is the pointer into it.",
  );
  lines.push("");
  lines.push(`- fold stamp: ${stamp}`);
  lines.push(`- dispositions folded: ${records.length}`);
  for (const record of records) {
    lines.push(`  - ${record.key} ${record.state} ${record.date}`);
  }
  lines.push(
    folded.length === 0
      ? `- clarifications: none folded; ${sourceCount} → ${input.restatedClarifications.length}`
      : `- clarifications: folded ${folded.length} of ${sourceCount} (indices ${folded.join(", ")}); ${sourceCount} → ${input.restatedClarifications.length}`,
  );
  lines.push(
    `- body bytes (prose, excluding this record): ${byteLength(input.body)} → ${byteLength(input.restatedBody)}`,
  );
  const growth = input.allowGrowth ?? null;
  if (growth !== null && growth.trim() !== "") {
    lines.push(`- growth allowed: ${growth.trim()}`);
  }
  return lines.join("\n") + "\n";
}

/**
 * Join restated prose and citation into the body that goes to disk: prose,
 * exactly one blank line, citation. Normalizing the seam here means two callers
 * whose prose differs only in trailing newlines still produce the same file.
 */
function joinBody(prose: string, citation: string): string {
  return `${prose.replace(/\n+$/, "")}\n\n${citation}`;
}

/**
 * Plan one restatement: consult the authority gate, and either refuse or return
 * the restated body, clarifications and citation.
 *
 * PURE — no fs, no clock, no process. `foldDate` is the caller's.
 *
 * Refuses (as data, per the module header) whenever `consolidationVerdict`
 * refuses — when a `ratified` stamp sits among the folded content, or when no
 * stamp covers it at all.
 * A refusal carries the gate's own reason verbatim, so the rule that decided it
 * can be checked against `intentions/strategy-explicit-intent.md` without
 * reading this file.
 *
 * Throws `IntentionSchemaError` on a caller error, which is a different thing
 * from a refusal: a `foldedClarifications` index outside `node.clarifications`,
 * a restated body that is empty, or a restated body that already contains a
 * citation heading (the planner writes that block; a caller supplying one has
 * hand-authored an unverifiable record). A permitted plan with no delegatee
 * throws through `renderStamp`, which owns that rule.
 */
export function planRestatement(input: RestatementInput): RestatementPlan {
  const sourceCount = input.node.clarifications.length;
  for (const index of input.foldedClarifications) {
    if (!Number.isInteger(index) || index < 1 || index > sourceCount) {
      throw new IntentionSchemaError(
        `planRestatement: folded clarification index ${index} is outside 1..${sourceCount} on "${input.node.id}" — a citation must not name a clarification that does not exist`,
      );
    }
  }
  if (input.restatedBody.trim() === "") {
    throw new IntentionSchemaError(
      `planRestatement: the restated body for "${input.node.id}" is empty — a restatement replaces a body, it does not delete one`,
    );
  }
  if (CITATION_HEADING_LINE.test(input.restatedBody)) {
    throw new IntentionSchemaError(
      `planRestatement: the restated body for "${input.node.id}" already carries a "${CITATION_HEADING}" heading — the citation is generated here, never hand-authored`,
    );
  }

  const verdict = consolidationVerdict(input.dispositions.map((record) => record.state));
  if (!verdict.permitted || verdict.resultState === null) {
    return {
      permitted: false,
      resultState: null,
      restatedBody: null,
      restatedClarifications: null,
      citation: null,
      refusal: verdict.reason,
    };
  }

  const citation = renderCitation(input, verdict.resultState);
  return {
    permitted: true,
    resultState: verdict.resultState,
    restatedBody: joinBody(input.restatedBody, citation),
    restatedClarifications: [...input.restatedClarifications],
    citation,
    refusal: null,
  };
}

/** Options for `writeRestatedNode`. */
export interface WriteRestatedNodeOptions {
  /**
   * The explicit reason this restatement is allowed to grow the node. Required
   * whenever the restated body is not STRICTLY smaller than the body it
   * replaces, and it must appear in the body's citation block — a growth reason
   * that lives only in an argv string is a reason no future reader can find.
   */
  allowGrowth?: string | null;
}

/**
 * THE ONLY SANCTIONED BODY-REWRITING NODE WRITER. Serializes `node` and `body`
 * to `<dir>/<id>.md`, mirroring `writeNode`'s serialization exactly (see the
 * module header for why this is a sibling of `writeNode` and not a flag on it).
 *
 * Two guards, both throwing `IntentionSchemaError` before any bytes reach disk:
 *
 *  1. CITATION. The body must be non-empty and must carry the
 *     `## Consolidation record` block on its own line. A fold with no citation
 *     is not a restatement — it is an untraceable deletion.
 *  2. SIZE. The body must be STRICTLY smaller than the body it replaces, or the
 *     caller must pass `allowGrowth` with a non-empty reason that also appears
 *     in the body's citation. Equal size counts as growth: a "consolidation"
 *     that saves nothing is either a mistake or a deliberate restructure, and
 *     either way it owes an explanation. The guard measures the WHOLE body, the
 *     citation included, because that is what every future reader pays.
 *
 * The node file must already exist. A restatement rewrites an accreted node; it
 * never creates one, and a missing file means the caller is pointed at the wrong
 * directory — a clear error rather than a silent creation
 * (`.claude/rules/code-style.md`).
 */
export function writeRestatedNode(
  dir: string,
  node: IntentionNodeInput,
  body: string,
  opts?: WriteRestatedNodeOptions,
): void {
  const validated = validateNode(node);
  assertPathSafeId(validated.id);
  const filePath = join(dir, `${validated.id}.md`);
  if (!existsSync(filePath)) {
    throw new IntentionSchemaError(
      `Refusing to restate "${validated.id}": no node file at ${filePath}. A restatement rewrites an existing node's body; it never creates a node.`,
    );
  }
  // ONE read of the prior file, shared by the size guard below — the same
  // single-read discipline `writeNode` states at store.ts:89-92.
  const existingRaw = readFileSync(filePath, "utf8");
  const priorBody = extractBody(existingRaw, validated.id);

  if (body.trim() === "") {
    throw new IntentionSchemaError(
      `Refusing to restate "${validated.id}": the restated body is empty. A consolidation replaces a body with a shorter one; it never empties it.`,
    );
  }
  if (!CITATION_HEADING_LINE.test(body)) {
    throw new IntentionSchemaError(
      `Refusing to restate "${validated.id}": the restated body carries no "${CITATION_HEADING}" block. Nothing is deleted without a citation — the record naming the folded stamps and pointing at git is what makes this a restatement rather than a deletion.`,
    );
  }

  const priorBytes = byteLength(priorBody);
  const restatedBytes = byteLength(body);
  if (restatedBytes >= priorBytes) {
    const reason = opts?.allowGrowth ?? null;
    if (reason === null || reason.trim() === "") {
      throw new IntentionSchemaError(
        `Refusing to restate "${validated.id}": the restated body is ${restatedBytes} bytes against the prior ${priorBytes} — a consolidation must be strictly smaller. Pass an explicit allowGrowth reason, recorded in the citation, if this restructure genuinely grows the node.`,
      );
    }
    if (!body.includes(reason.trim())) {
      throw new IntentionSchemaError(
        `Refusing to restate "${validated.id}": the allowGrowth reason "${reason.trim()}" does not appear in the restated body's citation. A growth reason that is not recorded on the node is a reason no future reader can find.`,
      );
    }
  }

  // Mirror store.ts writeNode's exact serialization, following the precedent at
  // packages/intentionsutil/scripts/merge-node.ts:114-120: validate (defaults +
  // field ordering), then `---\n${stringify}---\n${body}`. `stringify` ends its
  // output with a newline, so the closing fence lands on its own line.
  const content = `---\n${stringify(validated)}---\n${body}`;
  writeFileAtomic(filePath, content);
}
