import { IntentionSchemaError } from "./errors.js";

// --- Enums -----------------------------------------------------------------

/** Who is accountable for a node's intention. */
export type Owner = "human" | "ai" | "procedure";

export const OWNERS: readonly Owner[] = ["human", "ai", "procedure"];

/** Lifecycle stage of a node as it moves from raw intention to codified work. */
export type Status = "raw" | "refining" | "delegated" | "codified";

export const STATUSES: readonly Status[] = ["raw", "refining", "delegated", "codified"];

/** What kind of tooling a goal codifies. */
export type ToolingKind = "actuator" | "sensor";

export const TOOLING_KINDS: readonly ToolingKind[] = ["actuator", "sensor"];

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
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

  return {
    // Required core.
    id,
    kind,
    statement: requireString(value.statement, "statement"),
    owner: requireOneOf(value.owner, OWNERS, "owner"),
    status: requireOneOf(value.status, STATUSES, "status"),

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
  }
  if (problems.length > 0) {
    throw new IntentionSchemaError(`Graph integrity violations:\n${problems.join("\n")}`);
  }
}
