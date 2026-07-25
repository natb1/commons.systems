import { IntentionSchemaError } from "./errors.js";
import { buildIdRefMatchers, classifyRef, extractIdRefs } from "./id-refs.js";

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
 *
 * `"fix"` is deliberately NOT a member: the CI-fix interrupt lives entirely in
 * the orthogonal `execution.fix` field (see `FixState`), set/cleared by the
 * graph selector off the live CI verdict, independent of `phase`.
 */
export type Phase =
  | "draft"
  | "align-tactics"
  | "implement"
  | "qa"
  | "review"
  | "main-qa"
  | "done";

export const PHASES: readonly Phase[] = [
  "draft",
  "align-tactics",
  "implement",
  "qa",
  "review",
  "main-qa",
  "done",
];

/**
 * What kind of office-hours attention a parked node needs, keyed to the
 * criterion actually used to backfill this field:
 *
 * - `"requirement-discovery"`: the park needs the author to decide or
 *   clarify a requirement/intent before work can proceed (e.g.
 *   `strategy-recover-attention`).
 * - `"curriculum-review"`: the park is a reading/dialog demonstration
 *   sitting the author runs with the text in hand (e.g. the
 *   `tactic-reading-chunk-*` / `tactic-dialog-review-*` parks, which
 *   `/reading-review` drives).
 * - `"other"`: the default for every park with no natural type —
 *   including machine-authored parks such as `apply-fix-state.ts`'s
 *   `applyParkCheck` retry-budget park — and the value `validateOfficeHours`
 *   substitutes when `session_type` is absent, which keeps the field
 *   additive over the existing store.
 *
 * `"requirement-discovery"` and `"curriculum-review"` are the two types
 * soft-penalized in `officeHours.ts` (`SESSION_TYPE_PENALTY`), so
 * classifying a park as typed lowers its default rank versus `"other"`.
 */
export type SessionType = "requirement-discovery" | "curriculum-review" | "other";
export const SESSION_TYPES: readonly SessionType[] = [
  "requirement-discovery",
  "curriculum-review",
  "other",
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
/**
 * A CI-fix interrupt in flight on a tactic, orthogonal to `phase`. `since` is
 * the interrupt date (`date -u +%Y-%m-%d`); `attempt` is the fix-attempt
 * counter (replaces the `attempts["fix"]` convention); `pushed_sha` is the
 * last SHA `/fix-checks` pushed — the pending-CI guard, null before the first
 * push.
 */
export interface FixState {
  since: string;
  attempt: number;
  pushed_sha: string | null;
}

export interface Execution {
  branch: string;
  pr: number | null;
  attempts: Record<string, number>; // per-phase attempt counts
  markers: string[];
  strategy_fingerprint: string | Record<string, StrategyStampValue> | null;
  /**
   * Optional (not just nullable) at the type level: existing `Execution`
   * object literals across the codebase predate this field and are out of
   * scope for this additive-only unit. `validateExecution` always populates
   * it (to a validated object or `null`) on any value it returns.
   */
  fix?: FixState | null;
}

/** A first-class parking record: why a node is in office hours and since when. */
export interface OfficeHours {
  reason: string;
  since: string;
  recommendation: string | null;
  session_type: SessionType;
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

/**
 * Nullable `FixState` object: string `since`, number `attempt`, nullable
 * string `pushed_sha`.
 */
function validateFixState(value: unknown, field: string): FixState | null {
  if (value == null) return null;
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object or null for ${field}, got ${typeof value}`);
  }
  return {
    since: requireDateString(value.since, `${field}.since`),
    attempt: requireNonNegativeInt(value.attempt, `${field}.attempt`),
    pushed_sha: optionalString(value.pushed_sha, `${field}.pushed_sha`),
  };
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
    fix: validateFixState(value.fix, `${field}.fix`),
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
    session_type:
      value.session_type == null
        ? "other"
        : requireOneOf(value.session_type, SESSION_TYPES, `${field}.session_type`),
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
 * True when `kind-<kind>` exists and does NOT flag `attributes.goal_layer`. The
 * shared gate behind the goal-layer-only rules (attention — rule 5; office_hours
 * / pace_exempt — rule 11). A missing kind node is rule 1's concern, so this
 * returns false there (no goal-layer complaint on top of the missing-kind one).
 */
function kindIsNotGoalLayer(kind: string, byId: Map<string, IntentionNode>): boolean {
  const kindNode = byId.get(`kind-${kind}`);
  return kindNode !== undefined && kindNode.attributes.goal_layer !== true;
}

/**
 * Rules 6-9 shape: for each `targets` entry that ALREADY resolves, require its
 * kind to be `expected`. Dangling entries are left to rules 2-4, so this never
 * double-reports a broken edge.
 */
function checkResolvedEdgeKinds(
  node: IntentionNode,
  targets: string[],
  edge: string,
  expected: string,
  byId: Map<string, IntentionNode>,
  problems: string[],
): void {
  for (const target of targets) {
    const targetNode = byId.get(target);
    if (targetNode === undefined) continue; // dangling — rules 2-4 own it
    if (targetNode.kind !== expected) {
      problems.push(
        `${node.id}: ${edge} "${target}" must resolve to a kind "${expected}" node, got kind "${targetNode.kind}"`,
      );
    }
  }
}

/**
 * Rules 13-14 shape: every `targets` entry must resolve AND be of kind
 * `expected`. Unlike `checkResolvedEdgeKinds`, this owns the dangling case for
 * these edges (no separate existence rule covers blocked_by / validates).
 */
function checkRequiredEdgeKinds(
  node: IntentionNode,
  targets: string[],
  edge: string,
  expected: string,
  byId: Map<string, IntentionNode>,
  problems: string[],
): void {
  for (const target of targets) {
    const targetNode = byId.get(target);
    if (targetNode === undefined) {
      problems.push(`${node.id}: ${edge} "${target}" does not resolve to a node`);
      continue;
    }
    if (targetNode.kind !== expected) {
      problems.push(
        `${node.id}: ${edge} "${target}" must resolve to a kind "${expected}" node, got kind "${targetNode.kind}"`,
      );
    }
  }
}

/** Rules 1-4: kind, parent, serves and recovers all name an existing node. */
function checkExistenceEdges(
  node: IntentionNode,
  ids: Set<string>,
  problems: string[],
): void {
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
}

/** Rule 6: a resolved parent must share the node's kind. */
function checkParentKind(
  node: IntentionNode,
  byId: Map<string, IntentionNode>,
  problems: string[],
): void {
  if (node.parent === null) return;
  const parentNode = byId.get(node.parent);
  if (parentNode !== undefined && parentNode.kind !== node.kind) {
    problems.push(
      `${node.id}: parent "${node.parent}" has kind "${parentNode.kind}", expected same kind "${node.kind}"`,
    );
  }
}

/** Rules 5 & 11: attention, office_hours and pace_exempt are goal-layer-only. */
function checkGoalLayerOnlyFields(
  node: IntentionNode,
  byId: Map<string, IntentionNode>,
  problems: string[],
): void {
  if (node.attention !== null && kindIsNotGoalLayer(node.kind, byId)) {
    problems.push(
      `${node.id}: attention is only valid on goal-layer kinds — kind-${node.kind} does not set attributes.goal_layer`,
    );
  }
  if (node.office_hours !== null && kindIsNotGoalLayer(node.kind, byId)) {
    problems.push(
      `${node.id}: office_hours is only valid on goal-layer kinds — kind-${node.kind} does not set attributes.goal_layer`,
    );
  }
  if (node.pace_exempt && kindIsNotGoalLayer(node.kind, byId)) {
    problems.push(
      `${node.id}: pace_exempt is only valid on goal-layer kinds — kind-${node.kind} does not set attributes.goal_layer`,
    );
  }
}

/**
 * Rules 9, 10 & 12: kind-typed field placement — recovers/rounds are
 * strategy-only, and phase/execution/blocked_by/validates are tactic-only.
 */
function checkKindTypedFields(node: IntentionNode, problems: string[]): void {
  if (node.recovers.length > 0 && node.kind !== "strategy") {
    problems.push(
      `${node.id}: recovers is only valid on kind "strategy" nodes, got kind "${node.kind}"`,
    );
  }
  if (node.rounds !== null && node.kind !== "strategy") {
    problems.push(
      `${node.id}: rounds is only valid on kind "strategy" nodes, got kind "${node.kind}"`,
    );
  }
  if (node.kind === "tactic") return;
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

/** Rule 16: status must be a key in the kind node's status_vocabulary. */
function checkStatusVocabulary(
  node: IntentionNode,
  byId: Map<string, IntentionNode>,
  problems: string[],
): void {
  const kindNode = byId.get(`kind-${node.kind}`);
  if (kindNode === undefined) return;
  const vocab = kindNode.attributes.status_vocabulary;
  if (!isPlainObject(vocab) || Object.keys(vocab).length === 0) {
    problems.push(`${node.id}: kind-${node.kind} has no attributes.status_vocabulary declared`);
  } else if (!Object.prototype.hasOwnProperty.call(vocab, node.status)) {
    problems.push(
      `${node.id}: status "${node.status}" is not declared in kind-${node.kind}'s status_vocabulary`,
    );
  }
}

/**
 * Rule 17: every clarifications[].answer carries a dated provenance clause (a
 * YYYY-MM-DD substring, placed anywhere). This is the same date pattern
 * readingDate() (router.ts) uses; it is inlined rather than imported because
 * router.ts already imports from this file (a back-import would cycle). The
 * machine consumers this protects are readingDate() and coverage.ts's
 * lastReviewedOf, which parse this date to timestamp a clarification.
 */
function checkClarificationDates(node: IntentionNode, problems: string[]): void {
  for (let i = 0; i < node.clarifications.length; i++) {
    if (!/\d{4}-\d{2}-\d{2}/.test(node.clarifications[i].answer)) {
      problems.push(
        `${node.id}: clarifications[${i}].answer carries no dated provenance clause (YYYY-MM-DD) — see readingDate()`,
      );
    }
  }
}

/**
 * Rule 18: no node other than strategy-main-health may match or exceed its
 * dominant attention.boost via either attention.boost or attention.override.
 * Threshold (`dominantBoost`) is read live by the caller; when null the guard is
 * inert. An author may opt out with "ACK: main-health-dominance" in the node's
 * attention.rationale.
 */
function checkAttentionDominance(
  node: IntentionNode,
  dominantBoost: number | null,
  problems: string[],
): void {
  if (
    dominantBoost === null ||
    node.id === "strategy-main-health" ||
    node.attention === null ||
    node.attention.rationale.includes("ACK: main-health-dominance")
  ) {
    return;
  }
  const { boost, override } = node.attention;
  if (boost !== null && boost >= dominantBoost) {
    problems.push(
      `${node.id}: attention.boost (${boost}) matches or exceeds strategy-main-health's dominant boost (${dominantBoost}) — add "ACK: main-health-dominance" to attention.rationale to override`,
    );
  }
  if (override !== null && override >= dominantBoost) {
    problems.push(
      `${node.id}: attention.override (${override}) matches or exceeds strategy-main-health's dominant boost (${dominantBoost}) — add "ACK: main-health-dominance" to attention.rationale to override`,
    );
  }
}

/**
 * Rule 15: reject cycles in the blocked_by graph. A DFS over resolved edges
 * flags every node that participates in a cycle (a tactic transitively blocked
 * by itself). Dangling edges are reported by rule 13, not traversed.
 */
function checkBlockedByCycles(
  nodes: IntentionNode[],
  byId: Map<string, IntentionNode>,
  problems: string[],
): void {
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
}

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
 *  17. Every `clarifications[].answer` carries a dated provenance clause — a
 *      `YYYY-MM-DD` substring placed anywhere in the string (placement-agnostic,
 *      uniform across every kind). This is the convention `readingDate()`
 *      (router.ts) and `coverage.ts`'s `lastReviewedOf` parse to date a
 *      clarification; a dateless answer silently breaks those consumers.
 *  18. `strategy-main-health` holds a dominant attention: no OTHER node's
 *      `attention.boost` or `attention.override` may match or exceed
 *      `strategy-main-health`'s own live `attention.boost`. This keeps red-main
 *      fix work outranking everything else. The threshold is read live from the
 *      graph (never hardcoded); if `strategy-main-health` is absent or its
 *      `attention`/`attention.boost` is null there is no dominance to protect
 *      and the guard is inert. A node may opt out by placing the literal
 *      substring `ACK: main-health-dominance` in its `attention.rationale`.
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
  // Rule 18 threshold: strategy-main-health's own live attention.boost. Read
  // from the same nodes array; null when the node, its attention, or its boost
  // is absent — in which case there is no dominance to protect (guard inert).
  const mainHealthNode = byId.get("strategy-main-health");
  const dominantBoost =
    mainHealthNode !== undefined && mainHealthNode.attention !== null
      ? mainHealthNode.attention.boost
      : null;
  for (const node of nodes) {
    // Rules 1-4: every referenced id exists.
    checkExistenceEdges(node, ids, problems);
    // Rules 5 & 11: attention / office_hours / pace_exempt are goal-layer-only.
    checkGoalLayerOnlyFields(node, byId, problems);
    // Rule 6: a resolved parent shares the node's kind.
    checkParentKind(node, byId, problems);
    // Rules 7-8: resolved serves targets carry the kind the layer requires.
    if (node.kind === "tactic") {
      checkResolvedEdgeKinds(node, node.serves, "serves", "strategy", byId, problems);
    }
    if (node.kind === "strategy") {
      checkResolvedEdgeKinds(node, node.serves, "serves", "virtue", byId, problems);
      // Rule 9: resolved recovers targets are delegation nodes.
      checkResolvedEdgeKinds(node, node.recovers, "recovers", "delegation", byId, problems);
    }
    // Rules 9, 10 & 12: kind-typed field placement.
    checkKindTypedFields(node, problems);
    // Rules 13-14: blocked_by / validates resolve to the required kind.
    checkRequiredEdgeKinds(node, node.blocked_by, "blocked_by", "tactic", byId, problems);
    checkRequiredEdgeKinds(node, node.validates, "validates", "strategy", byId, problems);
    // Rule 16: status is in the kind node's status_vocabulary.
    checkStatusVocabulary(node, byId, problems);
    // Rule 17: clarification answers carry a dated provenance clause.
    checkClarificationDates(node, problems);
    // Rule 18: main-health attention dominance.
    checkAttentionDominance(node, dominantBoost, problems);
  }
  // Rule 15: reject cycles in the blocked_by graph.
  checkBlockedByCycles(nodes, byId, problems);
  if (problems.length > 0) {
    throw new IntentionSchemaError(`Graph integrity violations:\n${problems.join("\n")}`);
  }
}

/**
 * Planned-reference heuristic, shared by `validateGraphProseRefs` (below) and
 * the digest's DANGLING-REFS annotation (`digest.ts` imports this). Does some
 * OTHER currently-open (`phase !== "done"`) tactic's `statement` or body mention
 * `ref`? A missing reference that IS so mentioned is a forward reference to
 * planned-but-not-yet-committed work rather than a genuine dangling ref.
 *
 * Lives here (not in `digest.ts`) so the browser-safe graph barrel — which
 * includes `schema.ts` but must never reach `digest.ts`'s Node-only transitive
 * deps — can use it; `digest.ts` reuses this one implementation rather than
 * duplicating the closure.
 *
 *  - Matches `ref` as a whole id token (same `[\w-]` boundaries as `idShape`),
 *    so a missing `tactic-x` is not falsely "planned" by an unrelated
 *    `tactic-x-v2`.
 *  - Excludes the referencing node itself: every missing ref is, by
 *    construction, present in its own referencing text (that is how it was
 *    extracted), so a self-match would make EVERY missing ref falsely
 *    "planned". `[planned]` must mean some OTHER open tactic mentions it.
 */
export function mentionsRef(
  nodes: IntentionNode[],
  bodies: Map<string, string>,
  ref: string,
  referencedBy: string,
): boolean {
  const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`);
  return nodes.some(
    (t) =>
      t.kind === "tactic" &&
      t.phase !== "done" &&
      t.id !== referencedBy &&
      (re.test(t.statement) || re.test(bodies.get(t.id) ?? "")),
  );
}

/**
 * Prose referential integrity: every backtick-quoted, id-shaped reference in a
 * node's PROSE (not its structural edges) must resolve to a live or pruned
 * node, be a forward reference to planned-but-uncommitted work, or be
 * grandfathered by the baseline.
 *
 * `validateGraph` checks structural edges (parent/serves/blocked_by/…). This is
 * the SEPARATE prose check: a node's `rationale`/`clarifications`/body can name
 * a sibling node id in prose that does not exist on main (e.g. the sibling's own
 * graph-commit lost a push race), and no structural rule catches it. Kept
 * separate — `validateGraph` stays a pure function of `IntentionNode[]` alone;
 * this needs the node bodies and the git-derived deleted-id set the caller
 * gathers.
 *
 * Scanned fields per node: `statement`, `rationale` (when non-null),
 * `attention.rationale` (when `attention` is non-null), every
 * `clarifications[].answer`, and the node's markdown body (when present in
 * `bodies`). The id-shape/backtick/classification logic is reused from
 * `id-refs.ts` (same semantics as the digest's DANGLING-REFS table); the
 * planned-reference exemption is `mentionsRef` (above), shared with the digest.
 *
 * `baseline` grandfathers pre-existing prose-dangling references (keys of the
 * form `"<ref>|<referencedBy>"`) so the CI check does not retroactively break
 * main; it should not grow going forward.
 *
 * Throws a single IntentionSchemaError listing ALL problems found, matching
 * `validateGraph`'s collect-then-throw contract.
 */
export function validateGraphProseRefs(
  nodes: IntentionNode[],
  bodies: Map<string, string>,
  deletedIds: string[],
  baseline: Set<string>,
): void {
  const storeIds = new Set(nodes.map((n) => n.id));
  const deleted = new Set(deletedIds);
  // Vocabulary and kind prefixes are built the SAME way the digest's
  // tableDanglingRefs builds them (current store ids ∪ deleted ids; prefixes
  // derived from the vocabulary, never a hardcoded kind list).
  const vocab = new Set<string>([...storeIds, ...deleted]);
  const prefixes = new Set([...vocab].map((id) => id.split("-")[0]).filter((p) => p.length > 0));
  const matchers = buildIdRefMatchers(prefixes);

  const problems: string[] = [];
  for (const node of nodes) {
    // Every prose field to scan for this node.
    const texts: string[] = [node.statement];
    if (node.rationale !== null) texts.push(node.rationale);
    if (node.attention !== null) texts.push(node.attention.rationale);
    for (const c of node.clarifications) texts.push(c.answer);
    const body = bodies.get(node.id);
    if (body !== undefined) texts.push(body);

    // Dedup refs across the node's fields so one (node, ref) pair is at most one
    // problem even when the ref appears in both, say, rationale and body.
    const refs = new Set<string>();
    for (const text of texts) {
      for (const ref of extractIdRefs(text, matchers, vocab, node.id)) refs.add(ref);
    }
    for (const ref of refs) {
      if (classifyRef(ref, storeIds, deleted) !== "missing") continue;
      if (mentionsRef(nodes, bodies, ref, node.id)) continue; // planned forward reference
      if (baseline.has(`${ref}|${node.id}`)) continue; // grandfathered
      problems.push(
        `${node.id}: prose reference \`${ref}\` does not resolve to a node ` +
          `(not planned by any open tactic, not baselined)`,
      );
    }
  }
  if (problems.length > 0) {
    throw new IntentionSchemaError(`Prose reference violations:\n${problems.join("\n")}`);
  }
}
