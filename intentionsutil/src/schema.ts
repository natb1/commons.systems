import { IntentionSchemaError } from "./errors.js";

// --- Enums -----------------------------------------------------------------

/** Who is accountable for a node's intention. */
export type Owner = "human" | "ai" | "procedure";

export const OWNERS: readonly Owner[] = ["human", "ai", "procedure"];

/** Lifecycle stage of a node as it moves from raw intention to codified work. */
export type Status = "raw" | "refining" | "delegated" | "codified";

export const STATUSES: readonly Status[] = ["raw", "refining", "delegated", "codified"];

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

// --- Node ------------------------------------------------------------------

/**
 * A single intention node. Every node — a charter principle at the root or an
 * issue's scope at a leaf — shares this one structure. All fields are carried
 * in the file's YAML frontmatter; the markdown body is a cosmetic render of
 * `statement` and is not part of the validated model.
 */
export interface IntentionNode {
  // Required core.
  id: string;
  statement: string;
  owner: Owner;
  status: Status;

  // Optional — backfill has a source for some of these; the dialectic fields
  // do not exist until the dialectic runs, so they default rather than throw.
  parent: string | null;
  rationale: string | null;
  reading: string | null;
  gap: string | null;
  clarifications: Clarification[];
  tooling_goals: string[];
  success_signal: SuccessSignal | null;
}

/**
 * Input type for writeNode. Only the required core is mandatory; optional
 * fields may be omitted and validateNode will apply their defaults. This lets
 * backfill callers omit dialectic fields (clarifications, tooling_goals, etc.)
 * that only exist after the dialectic runs.
 */
export interface IntentionNodeInput {
  id: string;
  statement: string;
  owner: Owner;
  status: Status;
  parent?: string | null;
  rationale?: string | null;
  reading?: string | null;
  gap?: string | null;
  clarifications?: Clarification[];
  tooling_goals?: string[];
  success_signal?: SuccessSignal | null;
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

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(`Expected array for ${field}, got ${typeof value}`);
  }
  return value.map((item, i) => {
    if (typeof item !== "string") {
      throw new IntentionSchemaError(`Expected string at ${field}[${i}], got ${typeof item}`);
    }
    return item;
  });
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

  return {
    // Required core.
    id,
    statement: requireString(value.statement, "statement"),
    owner: requireOneOf(value.owner, OWNERS, "owner"),
    status: requireOneOf(value.status, STATUSES, "status"),

    // Optional scalars — absent/null tolerated, default null.
    parent: optionalString(value.parent, "parent"),
    rationale: optionalString(value.rationale, "rationale"),
    reading: optionalString(value.reading, "reading"),
    gap: optionalString(value.gap, "gap"),

    // Optional structured — absent/null tolerated, defaults [] / null.
    clarifications:
      value.clarifications == null
        ? []
        : validateClarifications(value.clarifications, "clarifications"),
    tooling_goals:
      value.tooling_goals == null
        ? []
        : requireStringArray(value.tooling_goals, "tooling_goals"),
    success_signal:
      value.success_signal == null
        ? null
        : validateSuccessSignal(value.success_signal, "success_signal"),
  };
}
