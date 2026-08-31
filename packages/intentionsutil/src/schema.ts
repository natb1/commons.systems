import { IntentionSchemaError } from "./errors.js";
import { buildIdRefMatchers, classifyRef, extractIdRefs } from "./id-refs.js";
import {
  WAIT_MAX_HORIZON_DAYS,
  WAIT_MAX_HORIZON_MS,
  parseWaitUntil,
  waitIdFor,
} from "./waits.js";

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

// `superseded` is DELIBERATELY absent from this array. Nothing validates
// against `STATUSES` — its only consumers are two re-exports (`src/index.ts`,
// `src/graph.ts`) and an `Array.isArray` shape assertion in `test/graph.test.ts`
// — and adding a value here would imply a central status enum the graph
// deliberately does not have. The `superseded` terminal lives where every other
// status value lives: each kind node's `attributes.status_vocabulary`, enforced
// by rule 16.
export const STATUSES: readonly string[] = ["raw", "refining", "delegated", "codified"];

/**
 * The abandonment terminal. A node at this status was not completed — its
 * intent moved elsewhere, and `superseded_by` names where.
 *
 * Carried on `status`, never on `phase`. A `superseded` PHASE would deadlock
 * the ladder: `blockersComplete` treats a blocker as complete only when it is
 * absent or at `phase: "done"`, so a non-pruning superseded phase would block
 * every dependent forever. A status also reaches kinds a phase cannot —
 * `phase` is tactic-only (rule 10), while supersession is legal on any kind.
 */
export const SUPERSEDED_STATUS = "superseded";

/** The node was abandoned in favour of whatever `superseded_by` names. */
export function isSuperseded(node: IntentionNode): boolean {
  return node.status === SUPERSEDED_STATUS;
}

/**
 * The node is finished with, by EITHER terminal — completed (`phase: "done"`)
 * or abandoned (`status: "superseded"`).
 *
 * Sites that specifically mean *reached the completed terminal* must keep the
 * literal `phase === "done"` test; this predicate is for the distinct question
 * "is this node still live work".
 */
export function isRetired(node: IntentionNode): boolean {
  return node.phase === "done" || isSuperseded(node);
}

/**
 * The tier axis: the outer, lexicographically-dominant ranking key. Tier 1 is
 * the default; tier 2 is a bug-fix/security mark or an explicit authored lift;
 * tier 3 is production/main work. Tier is never authored as `1` — 1 is the
 * implicit default (rule 19 rejects an explicit `attributes.tier: 1`).
 */
export const TIERS: readonly number[] = [1, 2, 3];

/** The default tier every unmarked node sits in. */
export const DEFAULT_TIER = 1;

/** The tiers an author may name explicitly via `attributes.tier`. */
export const AUTHORABLE_TIERS: readonly number[] = [2, 3];

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
 * The wider dispatch phase vocabulary: every `PHASES` member plus the two
 * orthogonal interrupt names a dispatch driver prints as a phase — `fix` (the
 * CI-fix interrupt, carried in `execution.fix`) and `conflict` (the
 * merge-conflict interrupt, carried in `execution.conflict`). Neither is a
 * `Phase` member by deliberate design (see `Phase` above), but both name a real
 * pass a lane runs, and `execution.attempts` is ALREADY keyed by exactly this
 * wider set — see `scripts/apply-conflict-state.ts`'s `CONFLICT_ATTEMPTS_KEY`.
 *
 * `LanePass.phase` is validated against this rather than against `PHASES`
 * because `fix` and `conflict` are REAL awaited rungs, not merely printable
 * names: `graph-select-target`'s `sensor_gate` emits both as the selected phase,
 * `dispatch-ladder-advance` passes that through, and `dispatch-ladder-await` is
 * then invoked with it as the from-phase.
 *
 * THE RULE FOR A WRITER: stamp the rung the ladder awaited at. The reader's
 * probe is `.execution.lane_pass.phase == "$FROM_PHASE"`, so nothing else can
 * match. That is NOT always the node's persisted `phase`, and the two entries
 * into `dispatch-conflict` are exactly where they diverge:
 *
 * - provision exit 11 (`execution.conflict` null) — advance reports the node's
 *   own ladder phase as the from-phase, so the node's `phase` IS the rung.
 * - the router's conflict interrupt (`execution.conflict` non-null) — the
 *   selector emits `conflict`, so the rung is `conflict`, NOT the node's phase.
 *
 * `dispatch-conflict` SKILL 7b stamps the node's persisted `phase` on both, so
 * it is right on the first and wrong on the second; qa-fix's auto-fix lane
 * stamps the literal `qa`, which is right because its front door already gated
 * on `phase == qa`. The `dispatch-conflict` mismatch is currently UNREACHABLE
 * rather than fixed: on any rung that is not a `Phase` member the reader's
 * phase probe runs first and asks `.phase != "conflict"`, which is true for
 * every node, so it returns `advanced` before the lane-pass probe is consulted.
 * That vacuous-`advanced` defect is filed separately; when it is fixed, this
 * writer must start stamping the rung. Do not "simplify" this set down to
 * `PHASES` in the meantime — that would break the fix rather than the bug.
 */
export const DISPATCH_PHASE_NAMES: readonly string[] = [...PHASES, "fix", "conflict"];

/**
 * The closed set of lanes that may stamp `execution.lane_pass` — the lanes that
 * complete a pass by pushing to the node's branch and writing job-dir markers
 * without moving the node's `phase`, so a successful pass is otherwise
 * indistinguishable from a stall.
 *
 * `fix-checks` is listed here as vocabulary before it has a writer: the
 * constant is the one place the lane names are declared, and the ladder reader
 * accepts any member, so listing it now costs nothing and keeps the set from
 * being re-spelled per lane.
 */
export type LanePassLane = "conflict" | "qa-fix" | "fix-checks";

export const LANE_PASS_LANES: readonly LanePassLane[] = ["conflict", "qa-fix", "fix-checks"];

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
 * A user-authored attention injection: a SPARSE per-tier map of boost values.
 *
 *  - `boosts` maps a tier key (the decimal strings `"1"`, `"2"`, `"3"` — the
 *    members of `TIERS`) to the boost the author chose ON THAT TIER'S SCALE.
 *    Each value must be finite and `> 0`. Namespacing by tier is what makes a
 *    value meaningful: a magnitude picked on the tier-1 scale says nothing on
 *    the tier-2 scale, so a node claiming attention in two tiers states each
 *    claim separately rather than carrying one value plus a namespace tag.
 *  - Sparseness is load-bearing. An ABSENT tier key means "this node makes no
 *    claim in that tier" and must stay distinguishable from an authored lowest
 *    value. Never write a `0` into the stored map to stand for an unauthored
 *    tier — treating a missing tier as 0 is a RESOLVER-time convention, not a
 *    storage-time one.
 *  - A plain object, never a `Map`: nodes are serialized with `yaml.stringify`
 *    (`src/store.ts`) and re-serialized to JSON into the office-hours seed.
 *
 * Valid only on goal-layer kinds (those whose kind node sets
 * `attributes.goal_layer: true`) — enforced by `validateGraph`, not here. The
 * rank this seeds is derived on read by `resolveAttention` and is NEVER stored
 * in frontmatter.
 */
export interface Attention {
  boosts: Record<string, number>; // tier key ("1"|"2"|"3") -> finite value > 0; sparse
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
  // Ids of the nodes that supersede this one. Stored on the SUPERSEDED node;
  // the reverse direction is derived by scan, never by a maintained index.
  // Legal on EVERY kind (unlike phase/execution/validates/blocked_by above) —
  // rule 24's same-kind target rule is what makes it meaningful everywhere.
  superseded_by: string[];
  // The event that expires this node's supersession edge — normally the
  // in-flight PR's own merge or closure. Required (rule 26) when the node is
  // superseded WHILE in flight (`execution` non-null): a similarity judgment
  // never halts live work, and that interim-live-risk exception is only
  // permitted when an expiry is named. `null` otherwise.
  supersession_expiry: string | null;
  office_hours: OfficeHours | null; // first-class parking record; goal-layer kinds only
  pace_exempt: boolean; // authored pace-gate bypass; goal-layer kinds only
  rounds: Rounds | null; // /align-tactics round accounting; strategies only

  attributes: Record<string, unknown>; // kind-specific fields; semantics defined by the kind-<kind> node
}

/**
 * Every first-class `IntentionNode` field name, as a compiler-enforced probe.
 *
 * The `Record<keyof IntentionNode, true>` annotation makes this object wrong in
 * BOTH directions the moment the interface above moves: omitting a field is a
 * missing-property error, and naming something that is not a field is an
 * excess-property error. So the derived `FIRST_CLASS_FIELD_NAMES` — and with it
 * `validateGraph`'s rule 23 shadow-ban — cannot drift from the schema. Adding a
 * field to `IntentionNode` extends the ban automatically, or fails the build;
 * there is no second list to keep in sync by hand.
 *
 * Declared here rather than beside the other rule vocabularies at the top of the
 * file so whoever edits the interface meets the obligation immediately below it.
 */
const FIRST_CLASS_FIELD_PROBE: Record<keyof IntentionNode, true> = {
  id: true,
  kind: true,
  statement: true,
  owner: true,
  status: true,
  parent: true,
  serves: true,
  recovers: true,
  rationale: true,
  reading: true,
  clarifications: true,
  tooling_goals: true,
  success_signal: true,
  attention: true,
  phase: true,
  execution: true,
  validates: true,
  blocked_by: true,
  superseded_by: true,
  supersession_expiry: true,
  office_hours: true,
  pace_exempt: true,
  rounds: true,
  attributes: true,
};

/**
 * The first-class field names no `attributes` key may shadow (rule 23). Derived
 * from `FIRST_CLASS_FIELD_PROBE`, so it is exactly the schema's own field list.
 */
export const FIRST_CLASS_FIELD_NAMES: readonly string[] = Object.keys(FIRST_CLASS_FIELD_PROBE);

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
  clarifications?: Clarification[];
  tooling_goals?: ToolingGoal[];
  success_signal?: SuccessSignal | null;
  attention?: Attention | null;
  phase?: Phase | null;
  execution?: Execution | null;
  validates?: string[];
  blocked_by?: string[];
  superseded_by?: string[];
  supersession_expiry?: string | null;
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

/** The legal tier keys of an `attention.boosts` map, as decimal strings. */
const TIER_KEYS: readonly string[] = TIERS.map((t) => String(t));

/**
 * Read a legacy `tier:` namespace tag, defaulting to `"1"` when absent — every
 * boost authored before the tier axis existed was chosen on the tier-1 scale.
 * Accepts the number or the string form (YAML scalar keys/values arrive as
 * either depending on the parse path).
 */
function legacyTierKey(value: unknown, field: string): string {
  if (value == null) return String(DEFAULT_TIER);
  const key = typeof value === "number" ? String(value) : value;
  if (typeof key !== "string" || !TIER_KEYS.includes(key)) {
    throw new IntentionSchemaError(
      `${field}.tier must be one of ${TIERS.join(", ")}, got ${JSON.stringify(value)}`,
    );
  }
  return key;
}

function requirePositiveBoost(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new IntentionSchemaError(`Expected finite number for ${field}`);
  }
  if (value <= 0) {
    throw new IntentionSchemaError(`${field} must be > 0, got ${value}`);
  }
  return value;
}

function validateAttention(value: unknown, field: string): Attention {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }

  const boosts: Record<string, number> = {};

  if (value.boosts != null) {
    // Canonical form. YAML integer keys reach us as JS string keys on a plain
    // object, but a JSON/JS caller may hand us number keys — normalize both.
    if (!isPlainObject(value.boosts)) {
      throw new IntentionSchemaError(
        `Expected object for ${field}.boosts, got ${typeof value.boosts}`,
      );
    }
    for (const [rawKey, rawValue] of Object.entries(value.boosts)) {
      const key = String(rawKey);
      if (!TIER_KEYS.includes(key)) {
        throw new IntentionSchemaError(
          `${field}.boosts key must be one of ${TIER_KEYS.join(", ")}, got ${JSON.stringify(rawKey)}`,
        );
      }
      boosts[key] = requirePositiveBoost(rawValue, `${field}.boosts[${key}]`);
    }
  } else if (value.boost != null) {
    // LEGACY compatibility sugar, owned by
    // tactic-attention-per-tier-boost-migration: `boost: X` with an optional
    // `tier: T` namespace tag becomes `{ "T": X }` (tier "1" when untagged).
    // Required, not optional cleanup — the live intentions/ store still has 91
    // nodes on this form. Delete this branch once those node files are
    // rewritten to the canonical `boosts:` map.
    const key = legacyTierKey(value.tier, field);
    boosts[key] = requirePositiveBoost(value.boost, `${field}.boost`);
  } else if (value.override != null) {
    // LEGACY compatibility sugar, owned by
    // tactic-attention-per-tier-boost-migration: the old branch-cap semantics
    // of `override` are gone; this is now purely a shape mapping. `override: X`
    // with optional `tier: T` becomes `{ "T": X }`. Required, not optional
    // cleanup — one live node is still on `override: 60`. Delete this branch
    // with the `boost:` branch above.
    //
    // `override: 0` — the old "zero this branch" spelling — is REJECTED, not
    // mapped to the empty map. Accepting it would make the read-accepted and
    // write-emitted shapes disagree: `validateNode` would yield
    // `{boosts: {}, rationale}`, `writeNode` serializes exactly that
    // (`stringify(validated)`), and re-reading that file hits the empty-map
    // rejection below — so any write that round-trips the node (read-sensors'
    // reading write-back, write-node, graph-commit, the boost scripts) would
    // permanently corrupt it into a file `listNodes` can only warn about and
    // skip, silently dropping the node (and any `blocked_by` gate it holds)
    // out of the graph. Rejecting at parse time keeps the failure loud and at
    // the authoring seam.
    const key = legacyTierKey(value.tier, field);
    if (typeof value.override !== "number" || !Number.isFinite(value.override)) {
      throw new IntentionSchemaError(`Expected finite number for ${field}.override`);
    }
    if (value.override <= 0) {
      throw new IntentionSchemaError(
        `${field}.override must be > 0, got ${value.override} — the legacy "zero this branch" spelling has no meaning in the per-tier boosts map; drop the ${field} block entirely to claim nothing`,
      );
    }
    boosts[key] = value.override;
  }

  if (Object.keys(boosts).length === 0) {
    throw new IntentionSchemaError(
      `${field} must claim at least one tier in ${field}.boosts — an attention block with no boosts says nothing; drop the block instead`,
    );
  }

  const rationale = requireString(value.rationale, `${field}.rationale`);
  if (rationale === "") {
    throw new IntentionSchemaError(`${field}.rationale must be a non-empty string`);
  }

  return { boosts, rationale };
}

/**
 * A node's OWN tier — what its own marks say, ignoring anything inherited from
 * ancestors (`resolveAttention` derives the effective, inherited tier over the
 * parent/serves relation on top of this).
 *
 * `max(explicit, semantic, 1)`:
 *  - explicit: `attributes.tier` when it is the number 2 or 3. Any other value
 *    contributes nothing here — rule 19 is what rejects it, and normalizing it
 *    away silently would hide the violation from the validator.
 *  - semantic: 2 when `attributes.bug_fix === true` or `attributes.security ===
 *    true` — the marks that mean "this is a defect/security fix", which sit in
 *    tier 2 without the author naming a tier at all.
 *
 * One implementation, used by `attention.ts`'s effective-tier fixpoint. (It was
 * also the basis of the retired rule 20; see the `validateGraph` rule catalog.)
 */
export function ownTier(node: IntentionNode): number {
  const attributes = isPlainObject(node.attributes) ? node.attributes : {};
  const explicit =
    attributes.tier === 2 || attributes.tier === 3 ? attributes.tier : 0;
  const semantic = attributes.bug_fix === true || attributes.security === true ? 2 : 0;
  return Math.max(explicit, semantic, DEFAULT_TIER);
}

/**
 * Whether a node is an EVALUATION FINDING LEDGER ENTRY — a tactic carrying
 * `attributes.ledger_entry: true`, minted by
 * `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`.
 *
 * A ledger entry is a durable record of a recurring evaluation finding: its
 * `attributes.measured_impact` carries the recurrence count and impact figures
 * that inform ranking. Retirement is `phase: "done"` WITH those figures intact,
 * so a later recurrence resumes the count instead of restarting it — which is
 * only true if a retired entry is never deleted. Every consumer that treats
 * `phase: "done"` as "finished, delete or drop it" must therefore exempt these:
 * the owed-prune census (`scripts/graph-census-debt.ts`) and `rsi.ts`'s §6 task
 * plan both call this. `intentions/kind-tactic.md`'s `ledger_entry` section is
 * the normative contract.
 *
 * One implementation rather than a predicate re-spelled at each call site: a
 * consumer that spells it differently silently un-exempts the ledger.
 */
export function isLedgerEntry(node: IntentionNode): boolean {
  const attributes = isPlainObject(node.attributes) ? node.attributes : {};
  return node.kind === "tactic" && attributes.ledger_entry === true;
}

// --- Durable-layer write fence ----------------------------------------------

/**
 * The router- and sensor-owned state fields: the small, enumerable half of a
 * node's frontmatter that an unattended writer may set on ANY node, including a
 * durable-layer one. Everything a machine legitimately stamps lives here —
 * dispatch state (`phase`, `execution`, `blocked_by`, `status`), the parking
 * record (`office_hours`), sensor output (`reading`), round accounting
 * (`rounds`), and the derived-rank seed (`attention`).
 *
 * Typed as `keyof IntentionNode` so a field renamed on the interface fails the
 * typecheck here rather than silently dropping out of the set — a member that
 * quietly stopped matching would move that field to the refused side, which is
 * the safe direction, but a member that was never a real field would sit here
 * looking like a permission that never applies.
 *
 * This is NOT an allowlist of what may be written. It is the exemption half of
 * `isDurableWriteRefused`'s negative check — see that function for why the
 * direction matters.
 */
export const STATE_FIELDS: readonly (keyof IntentionNode)[] = [
  "phase",
  "execution",
  "office_hours",
  "reading",
  "attention",
  "rounds",
  "status",
  "blocked_by",
];

/**
 * The durable layer: the kinds whose content is human-owned doctrine rather
 * than machine-managed work. An autonomous writer may move their state fields
 * but never their substance.
 *
 * Deliberately NOT `grounding.ts`'s `DURABLE_KINDS`, which is a different set
 * for a different question: that one audits which nodes must carry a grounding
 * mark, and it excludes `tradition` precisely because tradition records ARE the
 * grounding. Here `tradition` is squarely in scope — a tradition record is
 * delegated articulation of a primary text, the last content an unattended
 * writer should rewrite. Reusing the grounding set would leave every
 * `tradition-*` node on the permitted side of the fence.
 */
export const DURABLE_LAYER_KINDS: readonly string[] = [
  "virtue",
  "strategy",
  "delegation",
  "kind",
  "tradition",
];

/** Whether `kind` names a durable-layer node. */
export function isDurableLayerKind(kind: string): boolean {
  return DURABLE_LAYER_KINDS.includes(kind);
}

/**
 * Whether an unattended writer must REFUSE to set `field` on a node of `kind`.
 *
 * The check is deliberately NEGATIVE — durable kind AND field not in
 * `STATE_FIELDS` — so an unknown or novel field name lands on the refuse side by
 * default. The positive form (permit when the field is in some allowed set)
 * was ruled first, on 2026-08-14, and corrected on 2026-08-15 because it fails
 * OPEN: the measured fallthrough included `rationale`, the field named first in
 * the doctrine this fence protects. Getting a write fence wrong in the
 * permissive direction is silent, so an unrecognized field must refuse.
 *
 * Do not "simplify" this into a lookup against a permitted-field list. The
 * asymmetry is the whole point: `STATE_FIELDS` is a closed exemption applied
 * only after the kind has already been recognized as durable.
 */
export function isDurableWriteRefused(kind: string, field: string): boolean {
  if (!isDurableLayerKind(kind)) return false;
  return !STATE_FIELDS.some((allowed) => allowed === field);
}

/**
 * The subset of `fields` an unattended writer must refuse on a node of `kind`,
 * in the order given. Empty means every field is permitted.
 *
 * One implementation rather than the predicate re-spelled per caller: a caller
 * that spells the loop itself is one `!` away from inverting the fence.
 */
export function refusedDurableFields(kind: string, fields: readonly string[]): string[] {
  return fields.filter((field) => isDurableWriteRefused(kind, field));
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

/**
 * A pending-merge conflict interrupt in flight on a tactic, orthogonal to
 * `phase` — exactly parallel to `FixState`, but for a reviewed-awaiting-merge
 * node whose PR reports `mergeable == CONFLICTING` rather than failing CI.
 * `since` is the interrupt date (`date -u +%Y-%m-%d`); `attempt` is the
 * conflict-resolution attempt counter.
 *
 * `head_sha` is the REVIEW-BINDING guard, the conflict lane's counterpart to
 * `FixState.pushed_sha`: the PR's `headRefOid` observed at the moment the
 * interrupt was entered — i.e. the head the completed review verdict
 * (`reviewed` marker) examined. A conflicting node keeps that marker while the
 * interrupt is in flight, so an unguarded "GitHub now says MERGEABLE" clear
 * would re-arm auto-merge on WHATEVER tree currently sits at the head,
 * including one pushed after the review. Every mechanical clear (marker
 * preserved) must therefore be conditioned on the current head still equalling
 * this sha; any other head — the conflict resolver's rewritten branch, or an
 * arbitrary push — must clear by INTENTION instead (marker stripped, review
 * re-runs). Null means "no head recorded" (a legacy interrupt entered before
 * this field existed), which is treated as unrecognized: fail closed to the
 * by-intention clear. Optional at the type level for the same additive-only
 * reason `Execution.conflict` itself is; `validateConflictState` always
 * populates it.
 */
export interface ConflictState {
  since: string;
  attempt: number;
  head_sha?: string | null;
}

/**
 * A COMPLETED lane pass, stamped by the lane that finished it. The durable
 * graph-state answer to "did that pass actually run?".
 *
 * The dispatch ladder driver (`dispatch-ladder-await`) decides whether a phase
 * pass completed by reading `origin/main` graph state. Two lanes — the
 * merge-conflict lane and qa-fix's auto-fix "fixing pass" — complete their work
 * by pushing to the node's branch and writing job-dir markers; neither moves
 * the node's `phase`. Without a stamp, a SUCCESSFUL pass by either lane can
 * only ever read as `stalled`. So the completing lane writes this and the
 * ladder compares it against the launch window.
 *
 *  - `at` is the completion instant, `YYYY-MM-DDTHH:MM:SSZ` (see
 *    `requireTimestampString` for why the format is load-bearing).
 *  - `lane` is which lane completed the pass, one of `LANE_PASS_LANES`.
 *  - `phase` is the dispatch phase the pass ran in, one of
 *    `DISPATCH_PHASE_NAMES` — the wider vocabulary, not `PHASES`.
 *  - `sha` is the sha the lane pushed, when it pushed one; null otherwise.
 *    Optional at the type level for the same additive-only reason
 *    `Execution.conflict` itself is; `validateLanePass` always populates it.
 *
 * A single object, not a list: each pass OVERWRITES the previous stamp. It is
 * bounded, and no consumer reads history, so it never needs clearing.
 */
export interface LanePass {
  at: string;
  lane: string;
  phase: string;
  sha?: string | null;
}

/**
 * Merge-verification evidence recorded on `Execution` at the done-transition,
 * so a merge-verification gate need not trust `execution.pr` alone. There are
 * two independent sufficient proofs:
 *
 * - A real PR merge: `mergedAt` + `mergeCommitSha` both non-null. GitHub REST
 *   never reports a PR state of "MERGED" (only "open"/"closed"), so a
 *   non-null `merged_at` is the merge signal, and `mergeCommitSha` is the
 *   `merge_commit_sha` GitHub reports (the sha landed on the base branch).
 * - An out-of-band landing: `graphCommitSha` non-null, backfilled manually by
 *   an authoring or office-hours session when content reached `main` via
 *   commits rather than the recorded PR. The session knows the sha firsthand;
 *   it is never derived mechanically from `graph-commit`, which prints no sha
 *   to stdout.
 *
 * All three fields null means a node was reconciled to `done` with no
 * evidence recorded (e.g. abandoned or otherwise unverifiable) — a later
 * census step flags this case rather than silently pruning it.
 */
export interface Completion {
  mergedAt: string | null; // GitHub PR merged_at, FULL ISO-8601 w/ time
  mergeCommitSha: string | null; // GitHub merge_commit_sha (the sha on the base)
  graphCommitSha: string | null; // manually-backfilled out-of-band landing sha
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
  /**
   * Optional (not just nullable) at the type level: existing `Execution`
   * object literals across the codebase predate this field and are out of
   * scope for this additive-only unit. `validateExecution` always populates
   * it (to a validated object or `null`) on any value it returns.
   */
  conflict?: ConflictState | null;
  completion?: Completion | null;
  /**
   * Optional (not just nullable) at the type level: existing `Execution`
   * object literals across the codebase predate this field and are out of
   * scope for this additive-only unit. `validateExecution` always populates
   * it (to a validated object or `null`) on any value it returns.
   */
  lane_pass?: LanePass | null;
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

/**
 * A fixed-width UTC second-precision timestamp, `YYYY-MM-DDTHH:MM:SSZ`. Shape
 * only, like `requireDateString` — semantic calendar validity is not this
 * layer's job.
 *
 * The repo's date-only convention is unusable for the launch-window comparison
 * `LanePass` exists for: a stamp written this morning would qualify for every
 * launch for the rest of the day (the accumulation trap). Fixed-width second
 * precision with a literal `Z` is LOAD-BEARING — it makes lexicographic order
 * equal chronological order, which is what lets the reader compare with a plain
 * jq `>=` and no date arithmetic.
 *
 * A writer must therefore truncate `toISOString()` output with
 * `.replace(/\.\d{3}Z$/, "Z")`. Left in, the milliseconds are a same-second
 * landmine: `"…:06.789Z" >= "…:06Z"` is FALSE, because `.` is 0x2E and `Z` is
 * 0x5A.
 */
function requireTimestampString(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)) {
    throw new IntentionSchemaError(
      `Expected YYYY-MM-DDTHH:MM:SSZ timestamp string for ${field}, got "${s}"`,
    );
  }
  return s;
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

/**
 * Nullable `ConflictState` object: string `since`, number `attempt`, nullable
 * string `head_sha` (the review-binding head guard — see `ConflictState`).
 * Mirrors `validateFixState`, whose `pushed_sha` is the CI-lane analogue.
 */
function validateConflictState(value: unknown, field: string): ConflictState | null {
  if (value == null) return null;
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object or null for ${field}, got ${typeof value}`);
  }
  return {
    since: requireDateString(value.since, `${field}.since`),
    attempt: requireNonNegativeInt(value.attempt, `${field}.attempt`),
    head_sha: optionalString(value.head_sha, `${field}.head_sha`),
  };
}

/**
 * Nullable `LanePass` object: second-precision `at`, `lane` from
 * `LANE_PASS_LANES`, `phase` from `DISPATCH_PHASE_NAMES` (the wider dispatch
 * vocabulary — `fix` and `conflict` are members, unlike in `PHASES`), and a
 * nullable `sha`. Mirrors `validateConflictState`.
 *
 * Both vocabularies are closed on purpose: a stamp naming a lane or phase the
 * reader does not recognize would be silently rejected at compare time and read
 * as a stall, which is the exact failure this field exists to remove.
 */
function validateLanePass(value: unknown, field: string): LanePass | null {
  if (value == null) return null;
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object or null for ${field}, got ${typeof value}`);
  }
  return {
    at: requireTimestampString(value.at, `${field}.at`),
    lane: requireOneOf(value.lane, LANE_PASS_LANES, `${field}.lane`),
    phase: requireOneOf(value.phase, DISPATCH_PHASE_NAMES, `${field}.phase`),
    sha: optionalString(value.sha, `${field}.sha`),
  };
}

/**
 * Nullable `Completion` object: nullable strings `mergedAt`, `mergeCommitSha`,
 * `graphCommitSha`. Deliberately uses `optionalString` (not
 * `optionalDateString`) for `mergedAt` — GitHub's `merged_at` is a full
 * ISO-8601 timestamp (e.g. "2026-07-11T12:00:00Z"), not the strict
 * `YYYY-MM-DD` shape `requireDateString`/`optionalDateString` enforce.
 */
function validateCompletion(value: unknown, field: string): Completion | null {
  if (value == null) return null;
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object or null for ${field}, got ${typeof value}`);
  }
  return {
    mergedAt: optionalString(value.mergedAt, `${field}.mergedAt`),
    mergeCommitSha: optionalString(value.mergeCommitSha, `${field}.mergeCommitSha`),
    graphCommitSha: optionalString(value.graphCommitSha, `${field}.graphCommitSha`),
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
    conflict: validateConflictState(value.conflict, `${field}.conflict`),
    completion: validateCompletion(value.completion, `${field}.completion`),
    lane_pass: validateLanePass(value.lane_pass, `${field}.lane_pass`),
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
    superseded_by:
      value.superseded_by == null ? [] : validateIdArray(value.superseded_by, "superseded_by"),
    supersession_expiry:
      value.supersession_expiry == null
        ? null
        : requireString(value.supersession_expiry, "supersession_expiry"),
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
 *
 * `superseded_by` and `supersession_expiry` are DELIBERATELY not confined here,
 * and that omission must not be "fixed". Rule 24 requires a supersession target
 * to share the superseded node's kind, which already makes the edge meaningful
 * on every kind; and supersession has to reach strategies, which is the half of
 * the requirement a tactic-only `phase` terminal structurally could not cover.
 */
export function checkKindTypedFields(node: IntentionNode, problems: string[]): void {
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
 * Rule 18: `strategy-main-health` owns tier 3 (the top tier) exclusively.
 *
 *  (a) No node other than `strategy-main-health` may AUTHOR an explicit
 *      `attributes.tier: 3`. The check reads the RAW `attributes.tier` field —
 *      not `ownTier`, and not `resolveAttention`'s effective tier — because
 *      INHERITING tier 3 down `parent`/`serves` is exactly how auto-created
 *      red-main fix tactics get their urgency. Authorship is guarded; the
 *      derived value never is.
 *  (b) When `strategy-main-health` is present in the node set, it must itself
 *      carry `attributes.tier: 3` — the structural successor to the old
 *      numeric guard's "or reduce it" half. When it is absent (partial
 *      fixtures) this half is inert.
 *
 * The opt-out channel for the literal substring "ACK: main-health-dominance" is
 * deliberately ASYMMETRIC between the two halves:
 *
 *  - Half (a) honors it in the authoring node's `rationale` OR its
 *    `attention.rationale`. A node can be tier-lifted with `attention: null`,
 *    so `rationale` must be accepted too.
 *  - Half (b) honors it ONLY in `strategy-main-health`'s own
 *    `attention.rationale`. Its `rationale` is where the node narrates this
 *    very guard, and prose describing the mechanism (which necessarily quotes
 *    the token) must not exempt the node from it — that self-exemption let the
 *    node be silently demoted with no validator signal. Requiring an
 *    `attention` block makes a genuine opt-out a deliberate structural act
 *    rather than an accident of wording.
 */
function checkTierDominance(
  node: IntentionNode,
  mainHealthPresent: boolean,
  problems: string[],
): void {
  const ACK = "ACK: main-health-dominance";
  const ackedInAttention =
    node.attention !== null && node.attention.rationale.includes(ACK);
  if (node.id === "strategy-main-health") {
    // (b) main-health must hold tier 3 itself. Only `attention.rationale`
    // overrides — see the asymmetry note above.
    if (ackedInAttention) return;
    if (mainHealthPresent && node.attributes.tier !== 3) {
      problems.push(
        `${node.id}: must author attributes.tier: 3 — it owns the top tier so red-main fix work outranks everything else; restore attributes.tier: 3 or add "${ACK}" to its attention.rationale to override (its own rationale does not count — that field narrates this guard)`,
      );
    }
    return;
  }
  const acked =
    ackedInAttention || (node.rationale !== null && node.rationale.includes(ACK));
  if (acked) return;
  // (a) no other node may author an explicit tier 3.
  if (node.attributes.tier === 3) {
    problems.push(
      `${node.id}: authors attributes.tier: 3, the tier reserved for strategy-main-health — use attributes.tier: 2 (or inherit tier 3 via serves/parent), or add "${ACK}" to its rationale to override`,
    );
  }
}

/**
 * Rule 19: tier-mark shape. `attributes.bug_fix` and `attributes.security` are
 * booleans when present; `attributes.tier` is the number 2 or 3 when present.
 * An explicit `attributes.tier: 1` is REJECTED — 1 is the implicit default that
 * every unmarked node already carries, so authoring it is redundant noise that
 * would make "no tier key" and "tier 1" two spellings of one state.
 */
function checkTierMarkShape(node: IntentionNode, problems: string[]): void {
  for (const mark of ["bug_fix", "security"] as const) {
    const value = node.attributes[mark];
    if (value !== undefined && typeof value !== "boolean") {
      problems.push(
        `${node.id}: attributes.${mark} must be a boolean, got ${typeof value}`,
      );
    }
  }
  const tier = node.attributes.tier;
  if (tier !== undefined && (typeof tier !== "number" || !AUTHORABLE_TIERS.includes(tier))) {
    problems.push(
      `${node.id}: attributes.tier must be ${AUTHORABLE_TIERS.join(" or ")}, got ${JSON.stringify(tier)} — tier 1 is the implicit default and must never be authored`,
    );
  }
}

/**
 * Rule 23: no `attributes` key may shadow a first-class `IntentionNode` field
 * name. Re-spelling a field inside the free-form `attributes` bag gives one
 * state two spellings, and every reader has to choose — so a node whose real
 * phase sat under `attributes.phase` was invisible to any consumer that read
 * `node.phase`, which is how the router misrouted squatter nodes.
 *
 * The ban is deliberately the whole field set, not just `phase`: `phase` is the
 * only key that ever squatted in the store, but the class of defect is "a
 * first-class field re-spelled inside the free-form bag", and banning the class
 * also closes `attributes.execution` and `attributes.office_hours` — the other
 * two keys the retired `check-node-selection.ts` fallback readers honored. The
 * forbidden set is `FIRST_CLASS_FIELD_NAMES`, derived from a compiler-enforced
 * probe over `keyof IntentionNode`, so it cannot drift from the schema.
 *
 * Unlike rules 19/21/22, PRESENCE is the violation: a shadowing key is rejected
 * whatever its value (including `null` and a well-formed one), because there is
 * no correct way to spell a first-class field under `attributes` — the correct
 * spelling is the field itself. Every violating key on a node is reported, not
 * just the first, so one run tells the author the whole edit to make.
 *
 * NOTE — RULE NUMBER COLLISION. `intentions/tactic-supersession-edge-and-terminal.md`
 * also claims rules **23 and 24**, for the supersession edge and its cycle check.
 * Neither is landed as of 2026-08-29, and neither is this one at the time of
 * writing. Rule numbers are cross-referenced from node bodies and are NEVER
 * reused (see the burned rule 20 in the ledger above `validateGraph`), so
 * whichever of the two lands second must renumber its rules — and update the
 * claiming node body — rather than sharing a number.
 */
function checkAttributesShadowing(node: IntentionNode, problems: string[]): void {
  for (const key of FIRST_CLASS_FIELD_NAMES) {
    if (!Object.prototype.hasOwnProperty.call(node.attributes, key)) continue;
    problems.push(
      `${node.id}: attributes.${key} shadows the first-class ${key} field — the attributes squatter representation is retired; move the value to the node's own ${key} field and delete attributes.${key}`,
    );
  }
}

/**
 * The four string-valued fields every `attributes.measured_impact` entry
 * carries. `value` (a finite number) and `measured` (a `YYYY-MM-DD` date) are
 * checked separately because their types differ.
 */
const MEASURED_IMPACT_STRING_FIELDS: readonly string[] = [
  "metric",
  "unit",
  "window",
  "sensor",
];

/**
 * Rule 21: `attributes.measured_impact` shape — an array of SUMMARY measurement
 * records `{metric, value, unit, window, sensor, measured}`. See
 * `intentions/kind-tactic.md`'s `measured_impact` section for what each field
 * means and why the key never orders anything.
 *
 * `attributes` is otherwise a free-form record, so a malformed measurement would
 * reach every consumer unchallenged. This key drives decisions — it is the
 * evidence a delegated attention write or a `bug_fix` classification cites — so
 * it gets a shape rule, on the same reasoning as rule 19's tier marks.
 */
function checkMeasuredImpactShape(node: IntentionNode, problems: string[]): void {
  const raw = node.attributes.measured_impact;
  if (raw === undefined) return;
  if (!Array.isArray(raw)) {
    problems.push(
      `${node.id}: attributes.measured_impact must be an array of measurement records, got ${raw === null ? "null" : typeof raw}`,
    );
    return;
  }
  for (let i = 0; i < raw.length; i++) {
    const entry: unknown = raw[i];
    const at = `${node.id}: attributes.measured_impact[${i}]`;
    if (!isPlainObject(entry)) {
      problems.push(
        `${at} must be a {metric, value, unit, window, sensor, measured} record, got ${entry === null ? "null" : typeof entry}`,
      );
      continue;
    }
    for (const field of MEASURED_IMPACT_STRING_FIELDS) {
      const value = entry[field];
      if (typeof value !== "string" || value.trim() === "") {
        problems.push(
          `${at}.${field} must be a non-empty string, got ${JSON.stringify(value)}`,
        );
      }
    }
    const value = entry.value;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      problems.push(`${at}.value must be a finite number, got ${JSON.stringify(value)}`);
    }
    const measured = entry.measured;
    if (typeof measured !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(measured)) {
      problems.push(
        `${at}.measured must be a YYYY-MM-DD date, got ${JSON.stringify(measured)}`,
      );
    }
  }
}

/**
 * Rule 22: WAIT-node shape. A WAIT node is a `kind: "tactic"` node carrying
 * `attributes.wait_for` — the id of the source tactic it holds (via that
 * source's `blocked_by` naming the WAIT). This check fires on exactly that
 * signature (`kind === "tactic"` AND `wait_for` present) and is otherwise
 * completely inert, so no ordinary tactic is affected.
 *
 * The invariants, and why each one is load-bearing:
 *  - `wait_for` is a non-empty string, and the node's own id equals
 *    `waitIdFor(wait_for)`. The canonical-id tie is what lets a sweep enumerate
 *    waits BY THEIR OWN ID while a writer derives the id FROM the source — a
 *    decoy node carrying someone else's `wait_for` would otherwise be swept as
 *    if it were the genuine wait. A `waitIdFor` throw (a `wait_for` whose
 *    derivation does not fit the node-id slug shape) is itself the violation.
 *  - `wait_until` is present and parses via `parseWaitUntil` (an ISO 8601 UTC
 *    instant, `YYYY-MM-DDTHH:MM:SSZ`). It is the release predicate; an
 *    unparseable one would leave the node armed forever.
 *  - `wait_until` is not more than `WAIT_MAX_HORIZON_DAYS` beyond now, and —
 *    when `attributes.wait_armed_since` is present — not more than that beyond
 *    `wait_armed_since` either. This is the bound the attempt cap CANNOT
 *    supply: `wait_attempts` counts release/re-arm rounds, so a wait armed for
 *    a distant instant never comes due, never reaches the cap, and never
 *    escalates, while its `blocked_by` edge holds the source indefinitely.
 *    `arm-wait` refuses to write such a node; this rung is what stops a
 *    hand-landed one. Only the UPPER side is bounded, so the check is
 *    monotonically safe as clock time advances: a node that validates today
 *    still validates tomorrow.
 *  - `wait_armed_since`, when present, parses via `parseWaitUntil`. It records
 *    when the current arming cycle began and is what bounds an EXTEND loop —
 *    extension is deliberately not a new attempt, so armed AGE, not the attempt
 *    counter, is the thing that can escalate a wait extended forever.
 *  - `wait_attempts`, when present, is an integer >= 1. It is the re-arm
 *    counter feeding the finite attempt cap; absence is legal (a
 *    freshly-armed wait has made no attempt yet), a malformed value is not —
 *    it would make the cap unreachable.
 *  - `wait_reason` and `wait_recommendation` are present non-empty strings.
 *    They are what the author reads when the cap escalates the wait to
 *    office-hours, so an armed wait with neither is an un-actionable hold.
 *  - `phase` is `null` (armed) or `"done"` (released). A WAIT never carries a
 *    ladder phase: it is a hold, not executable work, and enforcing that here
 *    is what makes a separate router exclusion for the executable-tactic loop
 *    unnecessary.
 */
function checkWaitNodeShape(node: IntentionNode, problems: string[]): void {
  if (node.kind !== "tactic") return;
  const waitFor = node.attributes.wait_for;
  if (waitFor === undefined) return;

  if (typeof waitFor !== "string" || waitFor === "") {
    problems.push(
      `${node.id}: attributes.wait_for must be a non-empty string naming the source node this wait holds, got ${JSON.stringify(waitFor)} — set attributes.wait_for to the source tactic's id`,
    );
  } else {
    let expected: string | null = null;
    try {
      expected = waitIdFor(waitFor);
    } catch (err) {
      problems.push(
        `${node.id}: attributes.wait_for "${waitFor}" does not derive a usable wait id — ${(err instanceof Error ? err.message : String(err))}; pick a source id whose derived wait id fits the node-id slug shape`,
      );
    }
    if (expected !== null && node.id !== expected) {
      problems.push(
        `${node.id}: a WAIT node's id must equal waitIdFor(attributes.wait_for), which is "${expected}" — rename the node to "${expected}" or correct attributes.wait_for, since the sweep enumerates waits by their own id and a mismatch would apply the release/re-arm decision to the wrong node`,
      );
    }
  }

  const untilMs = parseWaitUntil(node.attributes.wait_until);
  if (untilMs === null) {
    problems.push(
      `${node.id}: attributes.wait_until must be an ISO 8601 UTC instant of the form YYYY-MM-DDTHH:MM:SSZ, got ${JSON.stringify(node.attributes.wait_until)} — set the calendar instant the tick sweep releases this wait at`,
    );
  }

  // The armed-age stamp, and the two horizon bounds it participates in.
  const armedSinceRaw = node.attributes.wait_armed_since;
  let armedSinceMs: number | null = null;
  if (armedSinceRaw !== undefined) {
    armedSinceMs = parseWaitUntil(armedSinceRaw);
    if (armedSinceMs === null) {
      problems.push(
        `${node.id}: attributes.wait_armed_since must be an ISO 8601 UTC instant of the form YYYY-MM-DDTHH:MM:SSZ when present, got ${JSON.stringify(armedSinceRaw)} — it records when this arming cycle began, and it is what bounds an extend-forever loop the attempt counter cannot see`,
      );
    }
  }
  if (untilMs !== null) {
    // `Date.now()` rather than a passed-in clock: only the UPPER side is
    // bounded, so validity is monotonic — a node that passes now cannot start
    // failing merely because time advanced.
    if (untilMs - Date.now() > WAIT_MAX_HORIZON_MS) {
      problems.push(
        `${node.id}: attributes.wait_until ${JSON.stringify(node.attributes.wait_until)} is more than ${WAIT_MAX_HORIZON_DAYS} days in the future — a wait armed past that horizon never comes due, so it never reaches WAIT_ATTEMPT_CAP and never escalates, while its blocked_by edge holds ${JSON.stringify(waitFor)} indefinitely; arm a nearer instant and let the wait re-arm`,
      );
    }
    if (armedSinceMs !== null && untilMs - armedSinceMs > WAIT_MAX_HORIZON_MS) {
      problems.push(
        `${node.id}: attributes.wait_until ${JSON.stringify(node.attributes.wait_until)} is more than ${WAIT_MAX_HORIZON_DAYS} days after attributes.wait_armed_since ${JSON.stringify(armedSinceRaw)} — an extension is not a new attempt, so a wait extended this far past its arming instant suppresses its source without ever reaching the attempt cap; let it come due and re-arm instead`,
      );
    }
  }

  const attempts = node.attributes.wait_attempts;
  if (attempts !== undefined && (typeof attempts !== "number" || !Number.isInteger(attempts) || attempts < 1)) {
    problems.push(
      `${node.id}: attributes.wait_attempts must be an integer >= 1 when present, got ${JSON.stringify(attempts)} — omit it on a freshly-armed wait, otherwise record the re-arm count that feeds the attempt cap`,
    );
  }

  for (const field of ["wait_reason", "wait_recommendation"] as const) {
    const value = node.attributes[field];
    if (typeof value !== "string" || value === "") {
      problems.push(
        `${node.id}: attributes.${field} must be a non-empty string, got ${JSON.stringify(value)} — it is what the author reads when the attempt cap escalates this wait to office-hours`,
      );
    }
  }

  if (node.phase !== null && node.phase !== "done") {
    problems.push(
      `${node.id}: a WAIT node's phase must be null (armed) or "done" (released), got ${JSON.stringify(node.phase)} — a wait is a hold, not executable work, so it never carries a ladder phase`,
    );
  }
}

/**
 * Rules 15 & 25: reject cycles in a directed edge field. A three-colour DFS over
 * resolved edges flags every node that participates in a cycle. Dangling edges
 * are reported by the edge's own existence rule (13 for `blocked_by`, 24 for
 * `superseded_by`), not traversed.
 *
 * ONE implementation, called once per cyclic edge field. A second near-identical
 * copy would be exactly the duplicated-write-surface defect the graph strategy's
 * one-shared-write-surface ruling condemns. A self-edge (a node naming itself)
 * is a length-1 cycle this DFS already catches, so it needs no separate check.
 */
function checkEdgeCycles(
  nodes: IntentionNode[],
  byId: Map<string, IntentionNode>,
  problems: string[],
  edgeOf: (node: IntentionNode) => string[],
  message: (id: string) => string,
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
      for (const target of edgeOf(node)) {
        if (!byId.has(target)) continue; // dangling — the existence rule owns it
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
    problems.push(message(id));
  }
}

/**
 * Rule 26: a node superseded WHILE IN FLIGHT must name its supersession's
 * expiry event.
 *
 * The ruled exception is that an in-flight node still takes the supersession
 * edge and still gets NO park, so a similarity judgment never halts live work.
 * That interim-live-risk exception is only permitted when an expiry is named —
 * normally the in-flight PR's own merge or closure. Without this rule
 * `supersession_expiry` would be another field nothing reads.
 *
 * The expiry is per-NODE, not per-edge: the risk being bounded is that THIS
 * node is in flight, which is a property of the node's own dispatch state and
 * not of which node supersedes it. A per-edge expiry would repeat one value.
 *
 * IN FLIGHT is `execution` non-null AND `phase` not yet `done`. Non-null
 * `execution` ALONE is not the test: nothing ever clears the record, so it
 * means "was ever dispatched", not "is running now" — measured 2026-08-31 on
 * the live store, 151 of the 208 `phase: "done"` nodes still carry a non-null
 * `execution`. Keying on `execution` alone would (a) refuse a supersession edge
 * on any completed node until the author invented an expiry for work that
 * finished long ago, and (b) make the expiry unclearable: once the named event
 * fires and the PR merges to `phase: "done"`, setting the field back to `null`
 * would trip a rule claiming the node is still in flight.
 *
 * Inert on a node that is not superseded, and on a superseded node that is not
 * in flight — there is no interim live risk to except.
 */
function checkSupersessionExpiry(node: IntentionNode, problems: string[]): void {
  if (node.superseded_by.length === 0) return;
  if (node.execution === null) return;
  if (node.phase === "done") return; // completed, whatever `execution` still holds
  if (node.supersession_expiry === null || node.supersession_expiry.trim() === "") {
    problems.push(
      `${node.id}: superseded while in flight (execution is non-null) but supersession_expiry is not named — the interim-live-risk exception requires an expiry event, normally the in-flight PR's own merge or closure`,
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
 *  18. `strategy-main-health` owns tier 3 exclusively — dominance is now
 *      structural (top tier) rather than numeric (highest boost). No node
 *      other than `strategy-main-health` may AUTHOR an explicit
 *      `attributes.tier: 3`, and `strategy-main-health`, when present in the
 *      node set, must carry `attributes.tier: 3` itself (that half is inert
 *      when it is absent, e.g. partial fixtures). The check reads the RAW
 *      `attributes.tier` field, never `ownTier`'s combined value or the
 *      effective inherited tier: INHERITING tier 3 down `parent`/`serves` is
 *      exactly how auto-created red-main fix tactics get their urgency, so
 *      only authorship is guarded. The opt-out substring
 *      `ACK: main-health-dominance` is honored asymmetrically: an authoring
 *      node may place it in its `rationale` OR its `attention.rationale`
 *      (it can be tier-lifted with `attention: null`), but demoting
 *      `strategy-main-health` requires the token in that node's own
 *      `attention.rationale` alone — its `rationale` narrates this very guard,
 *      and prose describing the mechanism must not exempt the node from it.
 *  19. Tier marks are well-shaped: `attributes.bug_fix` and
 *      `attributes.security`, when present, are booleans; `attributes.tier`,
 *      when present, is the number 2 or 3. An explicit `attributes.tier: 1` is
 *      rejected — 1 is the implicit default every unmarked node already
 *      carries, so authoring it would give one state two spellings.
 *  20. RETIRED — was the per-tier boost namespace check, retired along with the
 *      `attention.tier` namespace tag when attention became a per-tier boost
 *      map. Rule numbers are cross-referenced from node bodies; 20 is burned,
 *      so the next new rule takes 21.
 *  21. `attributes.measured_impact`, when present, is an array of summary
 *      measurement records `{metric, value, unit, window, sensor, measured}` —
 *      `metric`/`unit`/`window`/`sensor` non-empty strings, `value` a finite
 *      number, `measured` a `YYYY-MM-DD` date. `attributes` is otherwise
 *      free-form, so without this rule a malformed measurement would reach
 *      every consumer unchallenged; the key is cited evidence for attention
 *      and classification writes, so it earns a shape rule like rule 19's tier
 *      marks. The rule checks shape only — it never reads a value, because a
 *      measurement is queryable input to a ranking act, never an ordering
 *      authority of its own.
 *  22. WAIT-node shape: a `kind: "tactic"` node carrying `attributes.wait_for`
 *      (the id of the source tactic it holds) is a WAIT node, and must be
 *      completely formed as one. Its `wait_for` is a non-empty string and its
 *      own id equals `waitIdFor(wait_for)` — that canonical-id tie is what
 *      lets the tick sweep enumerate waits by their own id while a writer
 *      derives the id from the source, so a decoy carrying someone else's
 *      `wait_for` cannot be swept in the genuine wait's place. Its
 *      `attributes.wait_until` is a parseable ISO 8601 UTC instant
 *      (`YYYY-MM-DDTHH:MM:SSZ`) — the calendar release predicate, without
 *      which the hold never releases. Its `attributes.wait_attempts`, when
 *      present, is an integer >= 1 (absent is legal on a freshly-armed wait;
 *      malformed is not, since it feeds the finite re-arm cap). Its
 *      `attributes.wait_reason` and `attributes.wait_recommendation` are
 *      non-empty strings — what the author reads when the cap escalates the
 *      wait to office-hours. And its `phase` is `null` (armed) or `"done"`
 *      (released), never a ladder phase: a wait is a hold, not executable
 *      work, and enforcing that here is what makes a separate router
 *      exclusion for the executable-tactic loop unnecessary. The rule is
 *      entirely inert on any node without `attributes.wait_for`.
 *  23. No `attributes` key shadows a first-class `IntentionNode` field name.
 *      The retired squatter convention let a node spell a first-class field
 *      inside the free-form `attributes` bag instead — `attributes.phase`,
 *      `attributes.execution`, `attributes.office_hours`. That gives one state
 *      two spellings and silently splits every reader: a consumer reading
 *      `node.phase` saw `null` on a node that was really at `main-qa`, which is
 *      how squatter nodes were misrouted. The forbidden set is the schema's own
 *      field list (`FIRST_CLASS_FIELD_NAMES`, derived from a compiler-enforced
 *      `Record<keyof IntentionNode, true>` probe), so adding a field to the
 *      interface extends the ban and it can never drift. Unlike rules 19, 21
 *      and 22 — which are inert when their key is absent and constrain its
 *      SHAPE when present — presence alone violates this rule, at any value
 *      including `null`: there is no well-formed way to author a first-class
 *      field under `attributes`. Every violating key on a node is reported.
 *      `attributes` stays free-form for every key that is not a field name.
 *
 *      RULE NUMBER COLLISION, RESOLVED 2026-08-31.
 *      `intentions/tactic-supersession-edge-and-terminal.md` also claimed 23
 *      and 24. The shadow-ban landed first and keeps 23; supersession landed
 *      second and renumbered to 24, 25 and 26 below, per the standing "whichever
 *      lands second renumbers" rule (see burned rule 20 above). That node's body
 *      still says "23 and 24" and is stale on this point.
 *  24. `superseded_by` targets exist and share the superseded node's kind. A
 *      tactic superseded by a strategy is not a supersession, it is a
 *      re-parenting; same-kind is modelled on rule 6's parent-kind rule and
 *      costs nothing, since `checkRequiredEdgeKinds` already takes the expected
 *      kind as an argument and `node.kind` is passed straight in. A dangling
 *      supersession target is a hard fail: nodes are never pruned, so a target
 *      that does not resolve was never written, not retired. Unlike rules 10
 *      and 13-14 this rule is NOT kind-confined — `superseded_by` is legal on
 *      every kind, because a superseded strategy is exactly the case a
 *      tactic-only phase terminal could not express.
 *  25. `superseded_by` contains no cycles — a node cannot transitively supersede
 *      itself, and self-supersession (a node naming its own id) is the length-1
 *      case. Shares one three-colour DFS with rule 15 via `checkEdgeCycles`
 *      rather than copying it. Like rule 15 this is a whole-graph pass, wired
 *      outside the per-node loop.
 *  26. A node superseded WHILE IN FLIGHT names its expiry event. When
 *      `superseded_by` is non-empty AND the node is in flight — `execution`
 *      non-null and `phase` not `done`, since the execution record is never
 *      cleared on completion — a non-empty
 *      `supersession_expiry` is required. The ruling is that supersession never
 *      parks live work — an in-flight node takes the edge and keeps running —
 *      and that interim-live-risk exception is only permitted when an expiry is
 *      named, normally the in-flight PR's own merge or closure. Inert when the
 *      node is not superseded, and when a superseded node is not in flight.
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
  // Rule 18: is strategy-main-health part of the set being validated? When it
  // is absent (a partial fixture) the "main-health must hold tier 3" half of
  // the guard is inert — there is no node to hold it.
  const mainHealthPresent = byId.has("strategy-main-health");
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
    // Rule 18: strategy-main-health owns tier 3 exclusively.
    checkTierDominance(node, mainHealthPresent, problems);
    // Rule 19: tier marks are well-shaped.
    checkTierMarkShape(node, problems);
    // Rule 21: measured_impact entries are well-shaped summary records.
    checkMeasuredImpactShape(node, problems);
    // Rule 22: a WAIT node's id, calendar predicate and hold fields are well-shaped.
    checkWaitNodeShape(node, problems);
    // Rule 23: no attributes key shadows a first-class field name.
    checkAttributesShadowing(node, problems);
    // Rule 24: superseded_by targets exist and share this node's kind. NOT
    // kind-confined — `node.kind` is the expected kind, so the rule is
    // meaningful on every kind.
    checkRequiredEdgeKinds(node, node.superseded_by, "superseded_by", node.kind, byId, problems);
    // Rule 26: a node superseded while in flight names its expiry event.
    checkSupersessionExpiry(node, problems);
  }
  // Rule 15: reject cycles in the blocked_by graph.
  checkEdgeCycles(
    nodes,
    byId,
    problems,
    (n) => n.blocked_by,
    (id) =>
      `${id}: blocked_by forms a cycle — a tactic cannot be transitively blocked by itself`,
  );
  // Rule 25: reject cycles in the superseded_by graph.
  checkEdgeCycles(
    nodes,
    byId,
    problems,
    (n) => n.superseded_by,
    (id) => `${id}: superseded_by forms a cycle — a node cannot transitively supersede itself`,
  );
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
 * `batchIds` is the set of node ids the write batch currently in flight is
 * committed to creating but has not landed yet. A batch that writes its members
 * one graph-commit at a time (the evaluation ledger writer is the motivating
 * case) cannot land a member naming a sibling of the same batch unless the
 * members are hand-ordered: when the first member is validated the sibling sits
 * in neither the store nor the deleted set, so it classifies `missing`.
 * Resolving against the batch as well as the store removes that ordering
 * constraint.
 *
 * `batchIds` is matched by EXACT id membership only — never by shape, prefix, or
 * family — so declaring a batch can never admit an id the batch does not
 * actually contain, and the default empty set leaves this check exactly as
 * strict as it was.
 *
 * Throws a single IntentionSchemaError listing ALL problems found, matching
 * `validateGraph`'s collect-then-throw contract.
 */
export function validateGraphProseRefs(
  nodes: IntentionNode[],
  bodies: Map<string, string>,
  deletedIds: string[],
  baseline: Set<string>,
  batchIds: ReadonlySet<string> = new Set<string>(),
): void {
  const storeIds = new Set(nodes.map((n) => n.id));
  const deleted = new Set(deletedIds);
  // Vocabulary and kind prefixes are built the SAME way the digest's
  // tableDanglingRefs builds them (current store ids ∪ deleted ids; prefixes
  // derived from the vocabulary, never a hardcoded kind list), plus the ids the
  // in-flight batch declares, which are known ids that simply have not landed
  // yet. Adding them to the vocabulary only ever makes the extractor recognize
  // MORE tokens as references; the exemption below is what makes them resolve.
  const vocab = new Set<string>([...storeIds, ...deleted, ...batchIds]);
  const prefixes = new Set([...vocab].map((id) => id.split("-")[0]).filter((p) => p.length > 0));
  const matchers = buildIdRefMatchers(prefixes);
  // Named in the violation message only when a batch was actually declared, so
  // an undeclared run does not report a clause that could not have applied.
  const batchClause = batchIds.size > 0 ? ", not minted by the batch under write" : "";

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
      if (batchIds.has(ref)) continue; // minted by the batch under write
      if (mentionsRef(nodes, bodies, ref, node.id)) continue; // planned forward reference
      if (baseline.has(`${ref}|${node.id}`)) continue; // grandfathered
      problems.push(
        `${node.id}: prose reference \`${ref}\` does not resolve to a node ` +
          `(not planned by any open tactic${batchClause}, not baselined)`,
      );
    }
  }
  if (problems.length > 0) {
    throw new IntentionSchemaError(`Prose reference violations:\n${problems.join("\n")}`);
  }
}
