import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { IntentionSchemaError } from "./errors.js";

// --- Types ------------------------------------------------------------------

export interface ExecutionTracker {
  node_id: string;
  issue_number: number;
  state: "open" | "closed";
  linked_prs: Array<{ number: number; state: "open" | "closed" | "merged" }>;
  dispatch_labels: string[];
  refreshed_at: string;
}

// --- Path safety ------------------------------------------------------------
// Re-implemented locally (not imported from store.ts) to express split-authority:
// the tree owns intention, GitHub owns execution.

function assertPathSafeId(id: string): void {
  if (id.includes("/") || id.includes("\\") || id.includes("..")) {
    throw new IntentionSchemaError(
      `Node id contains path separators or traversal sequences: "${id}"`
    );
  }
}

// --- Local guards -----------------------------------------------------------

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new IntentionSchemaError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number") {
    throw new IntentionSchemaError(`Expected number for ${field}, got ${typeof value}`);
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

const PR_STATES = ["open", "closed", "merged"] as const;
const ISSUE_STATES = ["open", "closed"] as const;

function validateLinkedPrs(
  value: unknown,
  field: string
): Array<{ number: number; state: "open" | "closed" | "merged" }> {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(`Expected array for ${field}, got ${typeof value}`);
  }
  return value.map((item, i) => {
    if (!isPlainObject(item)) {
      throw new IntentionSchemaError(`Expected object at ${field}[${i}], got ${typeof item}`);
    }
    return {
      number: requireNumber(item.number, `${field}[${i}].number`),
      state: requireOneOf(item.state, PR_STATES, `${field}[${i}].state`),
    };
  });
}

// --- Validator --------------------------------------------------------------

export function validateTracker(value: unknown): ExecutionTracker {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for execution tracker, got ${typeof value}`);
  }

  const node_id = requireString(value.node_id, "node_id");
  if (node_id === "") {
    throw new IntentionSchemaError("node_id must be a non-empty string");
  }

  return {
    node_id,
    issue_number: requireNumber(value.issue_number, "issue_number"),
    state: requireOneOf(value.state, ISSUE_STATES, "state"),
    linked_prs: validateLinkedPrs(value.linked_prs, "linked_prs"),
    dispatch_labels: requireStringArray(value.dispatch_labels, "dispatch_labels"),
    refreshed_at: requireString(value.refreshed_at, "refreshed_at"),
  };
}

// --- I/O --------------------------------------------------------------------

export function writeTracker(dir: string, record: ExecutionTracker): void {
  assertPathSafeId(record.node_id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${record.node_id}.json`), JSON.stringify(record, null, 2) + "\n");
}

export function readTracker(dir: string, node_id: string): ExecutionTracker {
  assertPathSafeId(node_id);
  const raw = readFileSync(join(dir, `${node_id}.json`), "utf8");
  return validateTracker(JSON.parse(raw));
}

export function listTrackers(dir: string): ExecutionTracker[] {
  return readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort()
    .map((n) => readTracker(dir, n.slice(0, -".json".length)));
}

// --- Mapping helpers --------------------------------------------------------

export function nodeIdToIssue(node_id: string, trackersDir: string): number | null {
  const match = /^issue-(\d+)$/.exec(node_id);
  if (match !== null) {
    return Number(match[1]);
  }
  if (existsSync(join(trackersDir, `${node_id}.json`))) {
    return readTracker(trackersDir, node_id).issue_number;
  }
  return null;
}

export function issueToNodeId(issue_number: number, trackersDir: string): string {
  if (!existsSync(trackersDir)) {
    return `issue-${issue_number}`;
  }
  const found = listTrackers(trackersDir).find((r) => r.issue_number === issue_number);
  if (found !== undefined) {
    return found.node_id;
  }
  return `issue-${issue_number}`;
}
