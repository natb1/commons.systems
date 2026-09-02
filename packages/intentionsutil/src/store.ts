import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { parse, stringify } from "yaml";
import {
  FIRST_CLASS_FIELD_NAMES,
  fieldWriteClass,
  isPlainObject,
  refusedCrossClassFields,
  refusedDurableFields,
  refusedFields,
  validateNode,
  type IntentionNode,
  type IntentionNodeInput,
  type WriteClass,
} from "./schema.js";
import { eq, type FieldConflict } from "./node-merge.js";
import { IntentionSchemaError } from "./errors.js";
import { extractFrontmatter, extractBody } from "./frontmatter.js";

/**
 * Serialize a node to its on-disk form and write it to `<dir>/<id>.md`.
 *
 * The node is validated FIRST (defaults applied) so the written frontmatter is
 * complete and deterministic. For every kind, an existing file's markdown body
 * is preserved verbatim across rewrites (via `readExistingBody`) — bodies are
 * authoritative, durable content, not a cosmetic render of `statement` (see the
 * durable-body contract, tactic-nontactic-body-durability). Only a brand-new
 * file with no prior file on disk gets the generated `# ${statement}`
 * placeholder body.
 */
// Mirrors graph-commit's id validation exactly (packages/intentionsutil/scripts/graph-commit,
// the `case "$id" in` block): reject path separators, and `.`/`..` as EXACT ids
// only. `..` as a substring cannot traverse once `/` and `\` are banned (the id
// is only ever used as the single path component `<dir>/<id>.md`), so ids like
// `v1..v2-migration` are legal — rejecting them here would silently defeat
// graph-commit's relaxed check, since every id passes through this gate first
// via write-node.ts before graph-commit ever sees it.
// Exported so every consumer that turns an id into a path component — not just
// the `readNode`/`writeNode` disk paths in this module — can apply the SAME
// check. `restamp-scope-fingerprint.ts` calls it at its single stamp-write seam
// (`writeScopeStamp`), which is reachable from a content source that never
// touches `readNode`.
export function assertPathSafeId(id: string): void {
  if (id.includes("/") || id.includes("\\")) {
    throw new IntentionSchemaError(
      `Node id contains path separators: "${id}"`
    );
  }
  if (id === "." || id === "..") {
    throw new IntentionSchemaError(
      `Node id is a reserved path name: "${id}"`
    );
  }
}

/** Options for `writeNode`. */
export interface WriteNodeOptions {
  /**
   * The WRITER's write class — `intent` or `orchestration`, never `shared`
   * (`shared` classifies a field two classes genuinely write; a writer that
   * declared it would refuse nothing, a fence that fails open).
   *
   * When present, `writeNode` diffs the prior on-disk node against the
   * candidate and refuses the write if it changes any field this class has no
   * authority over — see `assertWriteClassBoundary`.
   *
   * When ABSENT the write is unfenced and `writeNode` behaves exactly as it did
   * before the class fence existed. That is the read-tolerance window of the
   * migration, not the target state: the greenfield design makes the
   * declaration mandatory, and a later unit closes the window once the census
   * of undeclared writers is drained (tactic-intent-orchestration-layer-schema).
   */
  writes?: WriteClass;
}

export function writeNode(dir: string, node: IntentionNodeInput, opts?: WriteNodeOptions): void {
  const validated = validateNode(node);
  assertPathSafeId(validated.id);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${validated.id}.md`);
  // ONE read of the prior file, shared by every pre-write guard below. The body
  // preservation, the body-loss assertion and the write-class diff all need the
  // same bytes; reading them three times would be three chances to see three
  // different files.
  const existingRaw = existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
  const body = readExistingBody(existingRaw, validated) ?? `# ${validated.statement}\n`;
  if (opts?.writes !== undefined) {
    assertWriteClassBoundary(priorNodeForBoundary(existingRaw, validated.id), validated, opts.writes);
  }
  assertNoBodyLoss(filePath, validated, body, existingRaw);
  // `stringify` already ends its output with a newline, so the closing fence
  // lands on its own line.
  const content = `---\n${stringify(validated)}---\n${body}`;
  writeFileAtomic(filePath, content);
}

/**
 * The prior on-disk node the write-class fence diffs against, or `null` when
 * the file does not exist yet.
 *
 * Parsed through the SAME `parseNodeRaw` a reader would use, so both sides of
 * the diff carry `validateNode`'s defaults and a field the author simply
 * omitted from the frontmatter does not read as a change.
 *
 * A prior that does not parse is a clear error, never a skipped fence
 * (`.claude/rules/code-style.md`): the fence's whole job is to compare against
 * what is on disk, and a writer that declared a class is asking for that
 * comparison. Falling back to "no prior" would silently grant the write
 * everything.
 */
function priorNodeForBoundary(raw: string | null, id: string): IntentionNode | null {
  if (raw === null) return null;
  try {
    return parseNodeRaw(raw, id);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new IntentionSchemaError(
      `Refusing to write "${id}" with a declared write class: the node already on ` +
        `disk does not parse, so the write-class boundary cannot be checked ` +
        `against it (${detail}). Repair the on-disk node first, or write it ` +
        `through an undeclared writer that takes responsibility for both classes.`
    );
  }
}

/**
 * Pre-write authority guard: refuse a write whose declared class has no
 * authority over the fields it changes.
 *
 * An exported sibling of `assertNoBodyLoss` and the same shape — a structural
 * check that runs before any bytes reach disk and refuses a write that would
 * silently clobber content it does not own. `assertNoBodyLoss` protects the
 * markdown body; this protects the frontmatter fields of the OTHER write class.
 *
 * The refusal is DIFF-DERIVED, never taken from a caller-declared field list:
 * "the writer that composed the candidate is exactly the party whose honesty is
 * in question" (`packages/intentionsutil/scripts/check-durable-write-fence.ts`).
 * The caller declares only what class it is; which fields it actually touched
 * is measured here, from `prior` against `candidate`.
 *
 * `prior === null` is a creation — there is no prior state for the write to
 * clobber, so only the writer's own declaration is validated. Creation is
 * fenced by the census and the ratchet, not by a diff that has no left side.
 *
 * Refusal unions both fences via `refusedFields`: the cross-class fence
 * (an orchestration writer may not author intent, and vice versa) and the
 * kind-scoped durable fence (no unattended writer may touch human-owned
 * doctrine on a durable-layer kind, whatever its class).
 */
export function assertWriteClassBoundary(
  prior: IntentionNode | null,
  candidate: IntentionNode,
  writes: WriteClass,
): void {
  // Validate the WRITER's declaration first, through the one exported function
  // that owns the rule — schema.ts's `assertWriterClass` is module-private, and
  // `refusedCrossClassFields` runs it on entry. An empty field list makes this
  // call a pure guard: `shared` throws, `intent`/`orchestration` return `[]`.
  // Checking it here rather than after the diff means an illegal declaration
  // fails on every write, not only on the ones whose diff happens to be
  // non-empty.
  refusedCrossClassFields(writes, []);
  if (prior === null) return;
  // Spread into string-keyed records so an arbitrary field name indexes both
  // sides without a cast. `eq` (node-merge.ts) is order-independent for object
  // keys and order-dependent for arrays, so a YAML key reordering is not a
  // change but a reordered list is.
  const priorFields: Record<string, unknown> = { ...prior };
  const candidateFields: Record<string, unknown> = { ...candidate };
  const changed = FIRST_CLASS_FIELD_NAMES.filter(
    (field) => !eq(priorFields[field], candidateFields[field]),
  );
  // The durable fence is judged under BOTH the prior kind and the candidate's.
  // A write that rewrites `kind` moves the node INTO (or out of) the durable
  // layer, and judging only the prior kind lets a promotion smuggle doctrine
  // onto a durable-layer node: an `intent`-class writer flipping a `tactic` to
  // `strategy` while authoring `rationale` passes the cross-class fence (both
  // fields are intent-class) and passes `refusedDurableFields("tactic", …)`
  // (a tactic is not durable), landing human-owned doctrine unattended.
  // `check-durable-write-fence.ts`'s `fenceVerdict` unions the same two kinds
  // for exactly this reason; this fence must not be the looser of the two.
  const refusedSet = new Set([
    ...refusedFields(writes, prior.kind, changed),
    ...refusedDurableFields(candidate.kind, changed),
  ]);
  // Filter `changed` rather than spreading the set, so the refused list keeps
  // `FIRST_CLASS_FIELD_NAMES` order.
  const refused = changed.filter((field) => refusedSet.has(field));
  if (refused.length === 0) return;
  const conflicts: FieldConflict[] = refused.map((field) => ({
    field,
    ours: priorFields[field],
    theirs: candidateFields[field],
  }));
  throw new IntentionSchemaError(
    writeClassRefusalMessage(candidate.id, prior.kind, candidate.kind, writes, changed, conflicts),
  );
}

/** Why one field is refused: cross-class, durable-kind, or both. */
function refusalReason(
  field: string,
  kind: string,
  candidateKind: string,
  writes: WriteClass,
): string {
  const reasons: string[] = [];
  if (refusedCrossClassFields(writes, [field]).length > 0) {
    const cls = fieldWriteClass(field);
    reasons.push(
      cls === null
        ? `not a first-class field name, and an unrecognized field refuses by default`
        : `an ${cls}-class field, and this writer declared ${writes}`,
    );
  }
  if (refusedDurableFields(kind, [field]).length > 0) {
    reasons.push(`not a state field on the durable-layer kind "${kind}"`);
  } else if (refusedDurableFields(candidateKind, [field]).length > 0) {
    // Only reachable on a kind-rewriting write: the refusal comes from the
    // layer the write moves the node TO, not the one it sits in now.
    reasons.push(
      `not a state field on the durable-layer kind "${candidateKind}" this write would rewrite the node as`,
    );
  }
  return reasons.join("; ");
}

/**
 * The refusal text, naming the node, the declared class, each refused field and
 * its class, and what the caller must do. Modeled on `refusalMessage`
 * (`packages/intentionsutil/scripts/check-durable-write-fence.ts`), and it
 * carries the per-field detail as a JSON line in the SAME
 * `{id, field, ours, theirs}` entry shape `graph-commit`'s existing
 * `CONFLICT_FIELDS_JSON` accumulator holds (`graph-commit:3011`, and
 * `graph-commit:3024`'s `jq -r '.[].id'` is why `id` is present on every
 * entry rather than only in the prose above), so that plumbing can consume it
 * without new diagnostics.
 */
function writeClassRefusalMessage(
  id: string,
  kind: string,
  candidateKind: string,
  writes: WriteClass,
  changed: readonly string[],
  conflicts: readonly FieldConflict[],
): string {
  const detail = conflicts
    .map((c) => `    ${c.field} — ${refusalReason(c.field, kind, candidateKind, writes)}`)
    .join("\n");
  const subject =
    kind === candidateKind
      ? `is a "${kind}" node`
      : `is a "${kind}" node this write would rewrite as a "${candidateKind}" one`;
  return (
    `writeNode: REFUSED — ${JSON.stringify(id)} ${subject} and this write ` +
    `declares write class "${writes}", which may not change ` +
    `${conflicts.map((c) => c.field).join(", ")}.\n` +
    `  changed fields: ${changed.join(", ")}\n` +
    `  refused fields:\n${detail}\n` +
    `  conflict fields (JSON): ${JSON.stringify(conflicts.map((c) => ({ id, ...c })))}\n` +
    `  Nothing was written. Do not loosen the declaration: either this writer ` +
    `should not be authoring those fields, or their classification is wrong — ` +
    `and reclassifying a field is an edit to the owning kind node's ` +
    `attributes.field_write_class and schema.ts's mirror, not to this call.\n`
  );
}

/**
 * Publish `content` at `finalPath` atomically: write a collision-safe temp
 * file in the SAME directory (rename(2) cannot cross filesystems), then
 * rename it over the final path. An interrupted write (SIGKILL, OOM, ENOSPC)
 * can then only ever leave the temp file behind — never a partial or 0-byte
 * `<id>.md` that `listNodes` would choke on. Mirrors the established
 * `> "$f.tmp" && mv "$f.tmp" "$f"` convention already used in bash at
 * dispatch-fleet-alarm's splice_body/refresh_stamp_write and in TypeScript at
 * office-hours-snapshot/src/persist.ts.
 *
 * Exported for `restate.ts`'s `writeRestatedNode`, the one sanctioned
 * body-rewriting node writer, which publishes through this same discipline
 * rather than spelling temp-file-then-rename a second time. It is NOT on the
 * package barrel: this is an internal publication primitive, not a public API.
 */
export function writeFileAtomic(finalPath: string, content: string): void {
  const dir = dirname(finalPath);
  const tmp = join(
    dir,
    `.${basename(finalPath)}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`,
  );
  try {
    writeFileSync(tmp, content);
    renameSync(tmp, finalPath);
  } catch (err) {
    try {
      rmSync(tmp, { force: true });
    } catch {
      // best-effort cleanup; the original error is rethrown below
    }
    throw err;
  }
}

/**
 * Durable-body invariant (tactic-nontactic-body-durability): every node body is
 * authoritative content `writeNode` preserves verbatim across rewrites via
 * `readExistingBody`, for every kind. This guard asserts that invariant held —
 * it throws if a rewrite is about to replace an existing file's non-placeholder
 * body with the regenerated `# ${statement}` placeholder, catching any
 * body-preservation regression before it silently discards authored content. An
 * existing body that is still the generated placeholder carries no authored
 * content, so it may be regenerated freely.
 *
 * `existingRaw` is an optimization for a caller that already holds the file's
 * text: pass it (or `null` for "the file does not exist") and no read happens
 * here. Omitting it keeps the original two-argument contract — this function
 * reads `filePath` itself.
 */
export function assertNoBodyLoss(
  filePath: string,
  node: IntentionNode,
  body: string,
  existingRaw?: string | null,
): void {
  const raw =
    existingRaw === undefined
      ? existsSync(filePath)
        ? readFileSync(filePath, "utf8")
        : null
      : existingRaw;
  if (raw === null) return;
  const existing: unknown = parse(extractFrontmatter(raw, node.id));
  if (!isPlainObject(existing)) return;
  const existingBody = extractBody(raw, node.id);
  if (existingBody === `# ${String(existing.statement)}\n`) return;
  if (body !== existingBody) {
    throw new IntentionSchemaError(
      `Refusing to write "${node.id}": the rewrite would replace the existing ` +
        `hand-authored body with regenerated content, discarding durable ` +
        `content. This is a body-preservation regression in writeNode.`
    );
  }
}

/**
 * For a node whose file already exists on disk, take that file's existing body
 * (everything after the closing frontmatter fence) verbatim so a rewrite doesn't
 * clobber durable content. Every node body is authoritative under the
 * durable-body contract (tactic-nontactic-body-durability), so this applies to
 * every kind. Returns `null` when no file exists yet (`raw === null`) — callers
 * fall back to the generated `# ${statement}` body.
 *
 * Takes the already-read file text rather than a path: `writeNode` reads the
 * prior file exactly once and shares those bytes with every pre-write guard.
 */
function readExistingBody(raw: string | null, node: IntentionNode): string | null {
  if (raw === null) return null;
  return extractBody(raw, node.id);
}

// `extractFrontmatter` / `extractBody` moved to the pure `frontmatter.ts`
// module (imported above) so the fs-free digest can share one implementation.

/**
 * Parse and validate already-read node text, fs-free. `readNode` delegates to
 * this after its path-safety check and file read; callers that already have
 * raw node text in hand (e.g. from `git show`) can parse it directly without
 * touching disk.
 */
export function parseNodeRaw(raw: string, id: string): IntentionNode {
  return validateNode(parse(extractFrontmatter(raw, id)));
}

/**
 * Read and validate the node stored at `<dir>/<id>.md`.
 *
 * Only the YAML frontmatter (between the first two `---` fences) is authoritative;
 * the markdown body is ignored.
 */
export function readNode(dir: string, id: string): IntentionNode {
  assertPathSafeId(id);
  const raw = readFileSync(join(dir, `${id}.md`), "utf8");
  return parseNodeRaw(raw, id);
}

/**
 * Read the markdown body (everything after the closing frontmatter fence) of
 * the node stored at `<dir>/<id>.md`, verbatim. `readNode` deliberately drops
 * the body (only frontmatter is authoritative on read), but the tactic scope
 * fingerprint (`tacticScopeFingerprint`) hashes the body, so its caller reads
 * it through this helper rather than re-parsing the fence boundary by hand.
 */
export function readNodeBody(dir: string, id: string): string {
  assertPathSafeId(id);
  const raw = readFileSync(join(dir, `${id}.md`), "utf8");
  return extractBody(raw, id);
}

/** One node file that could not be read or validated during enumeration. */
export interface NodeReadFailure {
  id: string;
  error: unknown;
}

/**
 * Enumerate every node, isolating per-file read failures. One malformed file
 * (a 0-byte or partially-written `<id>.md`) costs exactly one node, never the
 * whole directory — the fleet-wide blast radius observed on 2026-08-01.
 *
 * `README.md` is a non-node companion doc kept alongside the node files — it
 * has no frontmatter, so it is excluded from the scan entirely rather than
 * reported as a failure.
 */
export function listNodesResilient(dir: string): {
  nodes: IntentionNode[];
  failures: NodeReadFailure[];
} {
  const nodes: IntentionNode[] = [];
  const failures: NodeReadFailure[] = [];
  const ids = readdirSync(dir)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => name.slice(0, -".md".length))
    .sort();
  for (const id of ids) {
    try {
      nodes.push(readNode(dir, id));
    } catch (error) {
      failures.push({ id, error });
    }
  }
  return { nodes, failures };
}

function failureMessage(failure: NodeReadFailure): string {
  return failure.error instanceof Error ? failure.error.message : String(failure.error);
}

/**
 * Read every `*.md` node file in `dir`, validating each, sorted by id for a
 * stable result.
 *
 * Tolerant by contract: a file that cannot be read or validated is skipped
 * with a warning on stderr, so one corrupt node file costs exactly one node
 * rather than crashing every caller that enumerates the store.
 *
 * FOR REPORT AND TELEMETRY CONSUMERS ONLY — census, digest, sensor, view, and
 * render callers, where a missing node degrades a report rather than changing a
 * decision. Every gate, selection, and reconciliation caller MUST use
 * `listNodesStrict` instead: absence from the enumerated set is load-bearing
 * "pass" semantics in those paths (`blockersComplete` in `router.ts` reads an
 * absent `blocked_by` id to mean COMPLETE; `check-node-selection.ts`'s
 * soft-freeze gate `continue`s past a serving strategy missing from its
 * `byId` map), so a silently dropped file would weaken a gate instead of
 * being rejected.
 *
 * `README.md` is a non-node companion doc kept alongside the node files — it
 * has no frontmatter, so it is excluded here.
 */
export function listNodes(dir: string): IntentionNode[] {
  const { nodes, failures } = listNodesResilient(dir);
  for (const failure of failures) {
    process.stderr.write(
      `warning: skipping unreadable node file ${failure.id}.md: ${failureMessage(failure)}\n`
    );
  }
  return nodes;
}

/**
 * Strict enumeration: throw `IntentionSchemaError` naming EVERY unreadable
 * file. For integrity gates (validate-graph) where silently skipping a
 * corrupt tracked node would turn a required CI check into a false pass.
 * Every failing file is reported, so one run surfaces all corruption rather
 * than only the first file.
 */
export function listNodesStrict(dir: string): IntentionNode[] {
  const { nodes, failures } = listNodesResilient(dir);
  if (failures.length > 0) {
    const detail = failures.map((f) => `  ${f.id}.md: ${failureMessage(f)}`).join("\n");
    throw new IntentionSchemaError(
      `${failures.length} unreadable node file(s) in "${dir}":\n${detail}`
    );
  }
  return nodes;
}

