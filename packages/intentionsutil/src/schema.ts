import { IntentionSchemaError } from "./errors.js";

// --- Enums -----------------------------------------------------------------

/** Who is accountable for a node's intention. */
export type Owner = "human" | "ai" | "procedure";

export const OWNERS: readonly Owner[] = ["human", "ai", "procedure"];

/**
 * Lifecycle stage of a node as it moves from raw intention to codified work.
 * Widened to `string`: the set of valid statuses is per-kind data (each kind
 * node's `attributes.status_vocabulary`), not a central enum in code —
 * enforced by `validateGraph`, not `validateNode` (which has no graph
 * context). `STATUSES` is kept as the legacy default vocabulary values for
 * callers that still reference it.
 */
export type Status = string;

export const STATUSES: readonly string[] = ["raw", "refining", "delegated", "codified"];

/** What kind of tooling a goal codifies. */
export type ToolingKind = "actuator" | "sensor";

export const TOOLING_KINDS: readonly ToolingKind[] = ["actuator", "sensor"];

/**
 * Persisted dispatch phase a tactic sits in. A future graph-native router
 * transitions this; the schema only validates the value is one of the enum.
 */
export type Phase =
  | "draft"
  | "align-tactics"
  | "implement"
  | "fix"
  | "qa"
  | "review"
  | "main-qa"
  | "done";

export const PHASES: readonly Phase[] = [
  "draft",
  "align-tactics",
  "implement",
  "fix",
  "qa",
  "review",
  "main-qa",
  "done",
];

// --- Structured optional fields --------------------------------------------

/** A measurable signal that a node's intention is being met. */
export interface SuccessSignal {
  observable: string;
  sensor: string;
  threshold: string;
  is_proxy: boolean;
}

/** A question raised during the dialectic and its resolved answer. */
export interface Clarification {
  question: string;
  answer: string;
}

/** A tooling goal a node aims to produce or change. */
export interface ToolingGoal {
  kind: ToolingKind;
  statement: string;
}

/**
 * A user-authored attention injection. Exactly one of `boost` / `override` is
 * non-null (authored YAML supplies one key); the other is `null`.
 *
 *  - `boost` adds `(self, boost)` to this node's outgoing source set — a
 *    RELATIVE claim that survives upstream re-weighting. Must be finite and
 *    `> 0` (a zero boost is meaningless; use `override: 0` to explicitly zero a
 *    branch).
 *  - `override` REPLACES this node's outgoing set with `{(self, override)}` —
 *    an ABSOLUTE cap on this node's own branch. Must be finite and `>= 0`.
 *
 * Valid only on goal-layer kinds (those whose kind node sets
 * `attributes.goal_layer: true`) — enforced by `validateGraph`, not here. The
 * rank this seeds is derived on read by `resolveAttention` and is NEVER stored
 * in frontmatter.
 */
export interface Attention {
  boost: number | null; // finite, > 0 when present
  override: number | null; // finite, >= 0 when present
  rationale: string; // required, non-empty
}

// --- Node ------------------------------------------------------------------

/**
 * A single intention node. Every node — a virtue at a root, a strategy below
 * it, a tactic at a leaf, a delegation record, or a kind node describing one
 * of those classes — shares this one structure. All fields are carried in the
 * file's YAML frontmatter; the markdown body is a cosmetic render of
 * `statement` and is not part of the validated model.
 *
 * The graph is self-describing: `kind` names the kind node (`kind-<kind>`)
 * that defines the node's semantics, edge rules, and the meaning of its
 * `attributes`. The schema therefore validates `kind` only as a non-empty
 * string — the set of valid kinds is data (the committed kind nodes), not
 * code. `validateGraph` enforces that every referenced kind node exists.
 */
export interface IntentionNode {
  // Required core.
  id: string;
  kind: string; // names the kind-<kind> node that defines this node's semantics
  statement: string;
  owner: Owner;
  status: Status;

  // Optional — the dialectic fields do not exist until the dialectic runs,
  // and reading is sensor-populated, so they default rather than throw.
  parent: string | null;
  serves: string[]; // ids of the nodes this node expresses (e.g. strategy → virtue)
  recovers: string[]; // ids of delegation records this node's work unwinds; meaningful on strategies
  rationale: string | null;
  reading: string | null; // current measured value of success_signal.observable; null until a sensor populates it
  gap: string | null;
  clarifications: Clarification[];
  tooling_goals: ToolingGoal[];
  success_signal: SuccessSignal | null;
  attention: Attention | null;

  // Graph-native dispatch state (see strategy-graph-native-dispatch). Layer
  // rules — which kinds may carry each — are enforced by `validateGraph`.
  phase: Phase | null; // persisted dispatch phase; tactics only
  execution: Execution | null; // live in-flight record; tactics only
  validates: string[]; // strategy ids this tactic validates (factual edge); tactics only
  blocked_by: string[]; // tactic ids blocking this one; tactics only
  office_hours: OfficeHours | null; // first-class parking record; goal-layer kinds only
  pace_exempt: boolean; // authored pace-gate bypass; goal-layer kinds only
  rounds: Rounds | null; // /align-tactics round accounting; strategies only

  attributes: Record<string, unknown>; // kind-specific fields; semantics defined by the kind-<kind> node
}

/**
 * Input type for writeNode. Only the required core is mandatory; optional
 * fields may be omitted and validateNode will apply their defaults. This lets
 * callers omit dialectic fields (clarifications, tooling_goals, etc.) that
 * only exist after the dialectic runs.
 */
export interface IntentionNodeInput {
  id: string;
  kind: string;
  statement: string;
  owner: Owner;
  status: Status;
  parent?: string | null;
  serves?: string[];
  recovers?: string[];
  rationale?: string | null;
  reading?: string | null;
  gap?: string | null;
  clarifications?: Clarification[];
  tooling_goals?: ToolingGoal[];
  success_signal?: SuccessSignal | null;
  attention?: Attention | null;
  phase?: Phase | null;
  execution?: Execution | null;
  validates?: string[];
  blocked_by?: string[];
  office_hours?: OfficeHours | null;
  pace_exempt?: boolean;
  rounds?: Rounds | null;
  attributes?: Record<string, unknown>;
}

// --- Local guards ----------------------------------------------------------
// Re-implemented locally (not cross-imported from firestoreutil) so
// intentionsutil stays self-contained. They throw IntentionSchemaError.

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new IntentionSchemaError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new IntentionSchemaError(`Expected boolean for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  const s = requireString(value, field);
  const found = allowed.find((a) => a === s);
  if (found === undefined) {
    throw new IntentionSchemaError(`Invalid ${field}: "${s}"`);
  }
  return found;
}

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new IntentionSchemaError(`Expected string or null for ${field}, got ${typeof value}`);
  }
  return value;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSuccessSignal(value: unknown, field: string): SuccessSignal {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }
  return {
    observable: requireString(value.observable, `${field}.observable`),
    sensor: requireString(value.sensor, `${field}.sensor`),
    threshold: requireString(value.threshold, `${field}.threshold`),
    is_proxy: requireBoolean(value.is_proxy, `${field}.is_proxy`),
  };
}

function validateIdArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(`Expected array for ${field}, got ${typeof value}`);
  }
  return value.map((item, i) => requireString(item, `${field}[${i}]`));
}

/**
 * Kind-specific fields. The schema validates only that this is a plain object —
 * the meaning (and any deeper shape) of its entries is defined by the node's
 * kind node (`kind-<kind>`), which is data, not code. Keys and values pass
 * through the YAML round-trip untouched.
 */
function validateAttributes(value: unknown, field: string): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }
  return { ...value };
}

function validateClarifications(value: unknown, field: string): Clarification[] {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(`Expected array for ${field}, got ${typeof value}`);
  }
  return value.map((item, i) => {
    if (!isPlainObject(item)) {
      throw new IntentionSchemaError(`Expected object at ${field}[${i}], got ${typeof item}`);
    }
    return {
      question: requireString(item.question, `${field}[${i}].question`),
      answer: requireString(item.answer, `${field}[${i}].answer`),
    };
  });
}

function validateToolingGoals(value: unknown, field: string): ToolingGoal[] {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(`Expected array for ${field}, got ${typeof value}`);
  }
  return value.map((item, i) => {
    if (!isPlainObject(item)) {
      throw new IntentionSchemaError(`Expected object at ${field}[${i}], got ${typeof item}`);
    }
    return {
      kind: requireOneOf(item.kind, TOOLING_KINDS, `${field}[${i}].kind`),
      statement: requireString(item.statement, `${field}[${i}].statement`),
    };
  });
}

function validateAttention(value: unknown, field: string): Attention {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }

  const hasBoost = value.boost != null;
  const hasOverride = value.override != null;
  if (hasBoost && hasOverride) {
    throw new IntentionSchemaError(
      `${field} must set exactly one of boost/override, not both`,
    );
  }
  if (!hasBoost && !hasOverride) {
    throw new IntentionSchemaError(
      `${field} must set exactly one of boost/override, got neither`,
    );
  }

  let boost: number | null = null;
  let override: number | null = null;
  if (hasBoost) {
    if (typeof value.boost !== "number" || !Number.isFinite(value.boost)) {
      throw new IntentionSchemaError(`Expected finite number for ${field}.boost`);
    }
    if (value.boost <= 0) {
      throw new IntentionSchemaError(
        `${field}.boost must be > 0, got ${value.boost} (use override: 0 to explicitly zero a branch)`,
      );
    }
    boost = value.boost;
  } else {
    if (typeof value.override !== "number" || !Number.isFinite(value.override)) {
      throw new IntentionSchemaError(`Expected finite number for ${field}.override`);
    }
    if (value.override < 0) {
      throw new IntentionSchemaError(
        `${field}.override must be >= 0, got ${value.override}`,
      );
    }
    override = value.override;
  }

  const rationale = requireString(value.rationale, `${field}.rationale`);
  if (rationale === "") {
    throw new IntentionSchemaError(`${field}.rationale must be a non-empty string`);
  }

  return { boost, override, rationale };
}

// --- Dispatch-state structured fields --------------------------------------

/**
 * A single strategy soft-freeze stamp value. Either:
 *  - a bare substance-hash string (legacy/deprecated form, see below), or
 *  - `{hash, sha}`: `hash` is the same substance-fields hash, and `sha` is the
 *    `origin/main` commit the hash was computed against — i.e. the exact
 *    revision of `intentions/<strategy-id>.md` the stamp reflects. A stale
 *    child can recover the precise delta via
 *    `git diff <sha>..origin/main -- intentions/<strategy-id>.md` instead of
 *    only knowing *that* it drifted.
 */
export type StrategyStampValue = string | { hash: string; sha: string };

/**
 * Live execution record a router stamps on a tactic in flight. Valid on
 * tactics only (enforced by `validateGraph`).
 *
 *  - `strategy_fingerprint` is a per-strategy map `{<strategy-id>: <StrategyStampValue>}`
 *    of each serving strategy's substance-fields hash, stamped at plan/re-evaluation
 *    time and later compared by a router's mid-flight soft-freeze trigger. A
 *    serving strategy absent from the map is never stale (per-strategy null
 *    semantics). Each map value is either a bare hash string or a `{hash, sha}`
 *    object recording the `origin/main` commit the hash was taken against
 *    (see `StrategyStampValue`). The top-level bare-string form (the whole
 *    field, not a map value) is DEPRECATED-LEGACY: it predates multi-serves
 *    stamping and is compared against every serving strategy (a single string
 *    cannot equal two substance hashes, so a multi-serves tactic was born
 *    permanently stale). Legacy strings are accepted transiently and convert
 *    to map form by natural churn — every writer emits map form now, and each
 *    re-stamp rewrites the field. No hashing logic lives here — only the
 *    typed field.
 */
export interface Execution {
  branch: string;
  pr: number | null;
  attempts: Record<string, number>; // per-phase attempt counts
  markers: string[];
  strategy_fingerprint: string | Record<string, StrategyStampValue> | null;
}

/** A first-class parking record: why a node is in office hours and since when. */
export interface OfficeHours {
  reason: string;
  since: string;
  recommendation: string | null;
}

/**
 * `/align-tactics` re-evaluation round accounting; valid on strategies only.
 * `last_completed` is verified-in-prod completion time (advances only when a
 * non-draft child prunes); `last_aligned` is the date the last `/align-tactics`
 * round *landed* (align-decompose time), stamped independently of completion.
 */
export interface Rounds {
  count: number;
  last_completed: string | null;
  last_aligned: string | null;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new IntentionSchemaError(`Expected finite number for ${field}, got ${typeof value}`);
  }
  return value;
}

/** PR numbers, attempt counts, and round counts are counters: whole and >= 0. */
function requireNonNegativeInt(value: unknown, field: string): number {
  const n = requireNumber(value, field);
  if (!Number.isInteger(n) || n < 0) {
    throw new IntentionSchemaError(`Expected non-negative integer for ${field}, got ${n}`);
  }
  return n;
}

/**
 * The shape `graph-commit`'s park_write stamps via `date -u +%Y-%m-%d`. Shape
 * only — semantic calendar validity (month <= 12 etc.) is not this layer's job.
 */
function requireDateString(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new IntentionSchemaError(`Expected YYYY-MM-DD date string for ${field}, got "${s}"`);
  }
  return s;
}

function optionalDateString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requireDateString(value, field);
}

function validateAttempts(value: unknown, field: string): Record<string, number> {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }
  const out: Record<string, number> = {};
  for (const [key, count] of Object.entries(value)) {
    out[key] = requireNonNegativeInt(count, `${field}.${key}`);
  }
  return out;
}

/**
 * The soft-freeze stamp: a per-strategy fingerprint map
 * `{<strategy-id>: <StrategyStampValue>}`, a bare string (deprecated-legacy
 * top-level form, accepted transiently), or null. Each map value is either a
 * bare substance-hash string (legacy) or a `{hash, sha}` object — `sha` is the
 * `origin/main` commit the hash was taken against, letting a stale child
 * recover the exact delta via `git diff <sha>..origin/main --
 * intentions/<strategy-id>.md`. A malformed value (non-string, non-object, or
 * an object missing/mistyping `hash`/`sha`) is rejected.
 */
function validateStrategyFingerprint(
  value: unknown,
  field: string,
): string | Record<string, StrategyStampValue> | null {
  if (value == null) return null;
  if (typeof value === "string") return value; // deprecated-legacy bare-string form
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(
      `Expected string, object, or null for ${field}, got ${typeof value}`,
    );
  }
  const out: Record<string, StrategyStampValue> = {};
  for (const [key, fp] of Object.entries(value)) {
    const stampField = `${field}.${key}`;
    if (typeof fp === "string") {
      out[key] = fp;
    } else if (isPlainObject(fp)) {
      out[key] = {
        hash: requireString(fp.hash, `${stampField}.hash`),
        sha: requireString(fp.sha, `${stampField}.sha`),
      };
    } else {
      throw new IntentionSchemaError(
        `Expected string or {hash, sha} object for ${stampField}, got ${typeof fp}`,
      );
    }
  }
  return out;
}

function validateExecution(value: unknown, field: string): Execution {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }
  return {
    branch: requireString(value.branch, `${field}.branch`),
    pr: value.pr == null ? null : requireNonNegativeInt(value.pr, `${field}.pr`),
    attempts: validateAttempts(value.attempts, `${field}.attempts`),
    markers: validateIdArray(value.markers, `${field}.markers`),
    strategy_fingerprint: validateStrategyFingerprint(value.strategy_fingerprint, `${field}.strategy_fingerprint`),
  };
}

function validateOfficeHours(value: unknown, field: string): OfficeHours {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }
  return {
    reason: requireString(value.reason, `${field}.reason`),
    since: requireDateString(value.since, `${field}.since`),
    recommendation: optionalString(value.recommendation, `${field}.recommendation`),
  };
}

function validateRounds(value: unknown, field: string): Rounds {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }
  return {
    count: requireNonNegativeInt(value.count, `${field}.count`),
    last_completed: optionalString(value.last_completed, `${field}.last_completed`),
    last_aligned: optionalDateString(value.last_aligned, `${field}.last_aligned`),
  };
}

// --- Validator -------------------------------------------------------------

/**
 * Validate an untrusted value (e.g. parsed frontmatter) into an IntentionNode.
 *
 * The required core (id, statement, owner, status) is validated strictly and
 * throws on any missing/invalid field. Optional fields tolerate absent/null
 * and apply their documented defaults; when a structured optional field is
 * present and non-null, its shape is validated. The returned object always
 * carries exactly the IntentionNode fields with defaults applied, so a
 * construct → write → read → deepEqual round-trip is lossless.
 */
export function validateNode(value: unknown): IntentionNode {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for intention node, got ${typeof value}`);
  }

  const id = requireString(value.id, "id");
  if (id === "") {
    throw new IntentionSchemaError("id must be a non-empty string");
  }
  const kind = requireString(value.kind, "kind");
  if (kind === "") {
    throw new IntentionSchemaError("kind must be a non-empty string");
  }
  const status = requireString(value.status, "status");
  if (status === "") {
    throw new IntentionSchemaError("status must be a non-empty string");
  }

  return {
    // Required core.
    id,
    kind,
    statement: requireString(value.statement, "statement"),
    owner: requireOneOf(value.owner, OWNERS, "owner"),
    status,

    // Optional scalars — absent/null tolerated, default null.
    parent: optionalString(value.parent, "parent"),
    rationale: optionalString(value.rationale, "rationale"),
    reading: optionalString(value.reading, "reading"),
    gap: optionalString(value.gap, "gap"),

    // Optional structured — absent/null tolerated, defaults [] / {} / null.
    serves: value.serves == null ? [] : validateIdArray(value.serves, "serves"),
    recovers: value.recovers == null ? [] : validateIdArray(value.recovers, "recovers"),
    clarifications:
      value.clarifications == null
        ? []
        : validateClarifications(value.clarifications, "clarifications"),
    tooling_goals:
      value.tooling_goals == null
        ? []
        : validateToolingGoals(value.tooling_goals, "tooling_goals"),
    success_signal:
      value.success_signal == null
        ? null
        : validateSuccessSignal(value.success_signal, "success_signal"),
    attention:
      value.attention == null ? null : validateAttention(value.attention, "attention"),

    // Graph-native dispatch state — absent/null tolerated, defaults null / [] /
    // false; when present and non-null, shape is validated strictly.
    phase: value.phase == null ? null : requireOneOf(value.phase, PHASES, "phase"),
    execution:
      value.execution == null ? null : validateExecution(value.execution, "execution"),
    validates:
      value.validates == null ? [] : validateIdArray(value.validates, "validates"),
    blocked_by:
      value.blocked_by == null ? [] : validateIdArray(value.blocked_by, "blocked_by"),
    office_hours:
      value.office_hours == null ? null : validateOfficeHours(value.office_hours, "office_hours"),
    pace_exempt:
      value.pace_exempt == null ? false : requireBoolean(value.pace_exempt, "pace_exempt"),
    rounds: value.rounds == null ? null : validateRounds(value.rounds, "rounds"),

    attributes:
      value.attributes == null
        ? {}
        : validateAttributes(value.attributes, "attributes"),
  };
}

// --- Graph-level validation --------------------------------------------------

/**
 * Referential integrity over a whole node set. Per-node shape is `validateNode`'s
 * job; this checks the edges BETWEEN nodes:
 *
 *   1. Every node's `kind` has its defining kind node present (`kind-<kind>`).
 *      This is what makes the graph self-describing: the set of valid kinds is
 *      the set of committed kind nodes, not an enum in this file.
 *   2. Every non-null `parent` resolves to an existing node id.
 *   3. Every `serves` entry resolves to an existing node id.
 *   4. Every `recovers` entry resolves to an existing node id.
 *   5. `attention` appears only on nodes whose kind node sets
 *      `attributes.goal_layer: true`. The eligible layer is data (the kind
 *      nodes), not a kind list in this file — virtues stay unranked because
 *      kind-virtue carries no goal_layer flag, not because code names it.
 *   6. A non-null `parent` resolves to a node of the SAME kind — virtue→virtue,
 *      strategy→strategy, tactic→tactic (uniform across every kind).
 *   7. Every `serves` entry on a `kind: "tactic"` node resolves to a
 *      `kind: "strategy"` node.
 *   8. Every `serves` entry on a `kind: "strategy"` node resolves to a
 *      `kind: "virtue"` node.
 *   9. A non-empty `recovers` appears only on `kind: "strategy"` nodes, and
 *      every entry resolves to a `kind: "delegation"` node.
 *  10. `phase`, `execution`, a non-empty `blocked_by`, and a non-empty
 *      `validates` appear only on `kind: "tactic"` nodes.
 *  11. `office_hours` and a true `pace_exempt` appear only on goal-layer kinds
 *      (same `attributes.goal_layer` gate as `attention`, rule 5).
 *  12. `rounds` appears only on `kind: "strategy"` nodes.
 *  13. Every `blocked_by` entry resolves to an existing `kind: "tactic"` node.
 *  14. Every `validates` entry resolves to an existing `kind: "strategy"` node.
 *  15. `blocked_by` edges contain no cycle (a tactic transitively blocked by
 *      itself is invalid).
 *  16. Every node's `status` must be a key in its kind node's declared
 *      `attributes.status_vocabulary` (a missing declaration on the kind node
 *      is itself an error).
 *
 * Rules 6-9 only judge edges whose target already resolves (rules 2-4 above
 * report the dangling case); this avoids double-reporting the same broken
 * edge under two different messages.
 *
 * Deliberately NOT enforced: `serves` on delegation or kind nodes — a
 * delegation serves whatever depends on it, which is intentionally loose.
 *
 * Throws a single IntentionSchemaError listing ALL problems found, so one run
 * surfaces every dangling reference rather than the first.
 */
export function validateGraph(nodes: IntentionNode[]): void {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ids = new Set(byId.keys());
  const problems: string[] = [];
  for (const node of nodes) {
    if (!ids.has(`kind-${node.kind}`)) {
      problems.push(`${node.id}: kind "${node.kind}" has no kind-${node.kind} node`);
    }
    if (node.parent !== null && !ids.has(node.parent)) {
      problems.push(`${node.id}: parent "${node.parent}" does not resolve to a node`);
    }
    for (const target of node.serves) {
      if (!ids.has(target)) {
        problems.push(`${node.id}: serves "${target}" does not resolve to a node`);
      }
    }
    for (const target of node.recovers) {
      if (!ids.has(target)) {
        problems.push(`${node.id}: recovers "${target}" does not resolve to a node`);
      }
    }
    if (node.attention !== null) {
      const kindNode = byId.get(`kind-${node.kind}`);
      if (kindNode !== undefined && kindNode.attributes.goal_layer !== true) {
        problems.push(
          `${node.id}: attention is only valid on goal-layer kinds — kind-${node.kind} does not set attributes.goal_layer`,
        );
      }
    }
    if (node.parent !== null && byId.has(node.parent)) {
      const parentNode = byId.get(node.parent)!;
      if (parentNode.kind !== node.kind) {
        problems.push(
          `${node.id}: parent "${node.parent}" has kind "${parentNode.kind}", expected same kind "${node.kind}"`,
        );
      }
    }
    if (node.kind === "tactic") {
      for (const target of node.serves) {
        if (!byId.has(target)) continue;
        const targetNode = byId.get(target)!;
        if (targetNode.kind !== "strategy") {
          problems.push(
            `${node.id}: serves "${target}" must resolve to a kind "strategy" node, got kind "${targetNode.kind}"`,
          );
        }
      }
    }
    if (node.kind === "strategy") {
      for (const target of node.serves) {
        if (!byId.has(target)) continue;
        const targetNode = byId.get(target)!;
        if (targetNode.kind !== "virtue") {
          problems.push(
            `${node.id}: serves "${target}" must resolve to a kind "virtue" node, got kind "${targetNode.kind}"`,
          );
        }
      }
    }
    if (node.recovers.length > 0 && node.kind !== "strategy") {
      problems.push(
        `${node.id}: recovers is only valid on kind "strategy" nodes, got kind "${node.kind}"`,
      );
    }
    if (node.kind === "strategy") {
      for (const target of node.recovers) {
        if (!byId.has(target)) continue;
        const targetNode = byId.get(target)!;
        if (targetNode.kind !== "delegation") {
          problems.push(
            `${node.id}: recovers "${target}" must resolve to a kind "delegation" node, got kind "${targetNode.kind}"`,
          );
        }
      }
    }
    // Rule 10: tactic-only dispatch fields.
    if (node.kind !== "tactic") {
      if (node.phase !== null) {
        problems.push(
          `${node.id}: phase is only valid on kind "tactic" nodes, got kind "${node.kind}"`,
        );
      }
      if (node.execution !== null) {
        problems.push(
          `${node.id}: execution is only valid on kind "tactic" nodes, got kind "${node.kind}"`,
        );
      }
      if (node.blocked_by.length > 0) {
        problems.push(
          `${node.id}: blocked_by is only valid on kind "tactic" nodes, got kind "${node.kind}"`,
        );
      }
      if (node.validates.length > 0) {
        problems.push(
          `${node.id}: validates is only valid on kind "tactic" nodes, got kind "${node.kind}"`,
        );
      }
    }
    // Rule 11: office_hours / pace_exempt are goal-layer-only — same gate as
    // attention (rule 5): the kind node must set attributes.goal_layer.
    if (node.office_hours !== null) {
      const kindNode = byId.get(`kind-${node.kind}`);
      if (kindNode !== undefined && kindNode.attributes.goal_layer !== true) {
        problems.push(
          `${node.id}: office_hours is only valid on goal-layer kinds — kind-${node.kind} does not set attributes.goal_layer`,
        );
      }
    }
    if (node.pace_exempt) {
      const kindNode = byId.get(`kind-${node.kind}`);
      if (kindNode !== undefined && kindNode.attributes.goal_layer !== true) {
        problems.push(
          `${node.id}: pace_exempt is only valid on goal-layer kinds — kind-${node.kind} does not set attributes.goal_layer`,
        );
      }
    }
    // Rule 12: rounds is strategy-only.
    if (node.rounds !== null && node.kind !== "strategy") {
      problems.push(
        `${node.id}: rounds is only valid on kind "strategy" nodes, got kind "${node.kind}"`,
      );
    }
    // Rule 13: every blocked_by entry resolves to an existing tactic.
    for (const target of node.blocked_by) {
      const targetNode = byId.get(target);
      if (targetNode === undefined) {
        problems.push(`${node.id}: blocked_by "${target}" does not resolve to a node`);
        continue;
      }
      if (targetNode.kind !== "tactic") {
        problems.push(
          `${node.id}: blocked_by "${target}" must resolve to a kind "tactic" node, got kind "${targetNode.kind}"`,
        );
      }
    }
    // Rule 14: every validates entry resolves to an existing strategy.
    for (const target of node.validates) {
      const targetNode = byId.get(target);
      if (targetNode === undefined) {
        problems.push(`${node.id}: validates "${target}" does not resolve to a node`);
        continue;
      }
      if (targetNode.kind !== "strategy") {
        problems.push(
          `${node.id}: validates "${target}" must resolve to a kind "strategy" node, got kind "${targetNode.kind}"`,
        );
      }
    }
    // Rule 16: status must be a key in the kind node's status_vocabulary.
    {
      const kindNode = byId.get(`kind-${node.kind}`);
      if (kindNode !== undefined) {
        const vocab = kindNode.attributes.status_vocabulary;
        if (!isPlainObject(vocab) || Object.keys(vocab).length === 0) {
          problems.push(
            `${node.id}: kind-${node.kind} has no attributes.status_vocabulary declared`,
          );
        } else if (!Object.prototype.hasOwnProperty.call(vocab, node.status)) {
          problems.push(
            `${node.id}: status "${node.status}" is not declared in kind-${node.kind}'s status_vocabulary`,
          );
        }
      }
    }
  }
  // Rule 15: reject cycles in the blocked_by graph. A DFS over resolved edges
  // flags every node that participates in a cycle (a tactic transitively
  // blocked by itself). Dangling edges are reported by rule 13, not traversed.
  const CYCLE_WHITE = 0;
  const CYCLE_GRAY = 1;
  const CYCLE_BLACK = 2;
  const color = new Map<string, number>(nodes.map((n) => [n.id, CYCLE_WHITE]));
  const inCycle = new Set<string>();
  const path: string[] = [];
  const visit = (id: string): void => {
    color.set(id, CYCLE_GRAY);
    path.push(id);
    const node = byId.get(id);
    if (node !== undefined) {
      for (const target of node.blocked_by) {
        if (!byId.has(target)) continue; // dangling — rule 13 owns it
        if (color.get(target) === CYCLE_GRAY) {
          // Back edge: everything from `target` to here is on the cycle.
          for (const member of path.slice(path.indexOf(target))) {
            inCycle.add(member);
          }
        } else if (color.get(target) === CYCLE_WHITE) {
          visit(target);
        }
      }
    }
    path.pop();
    color.set(id, CYCLE_BLACK);
  };
  for (const node of nodes) {
    if (color.get(node.id) === CYCLE_WHITE) visit(node.id);
  }
  for (const id of inCycle) {
    problems.push(
      `${id}: blocked_by forms a cycle — a tactic cannot be transitively blocked by itself`,
    );
  }
  if (problems.length > 0) {
    throw new IntentionSchemaError(`Graph integrity violations:\n${problems.join("\n")}`);
  }
}
