// Household consent report for `strategy-household-shared-attachments`. The
// strategy's recorded sensor is "owner review at office-hours over the
// delegation records"; this instrument is the report that review works from
// (the `tactic-durability-audit-instrument` precedent — no registry Sensor,
// because the sensor is the owner review itself).
//
// It reads the local intention store (no Firestore, no network) and, for every
// `kind: delegation` record carrying `attributes.household.shared: true`, prints
// the record, its basis, the moves touching it (every `kind: strategy` node
// whose `recovers` names the record) with each move's recorded consent entry or
// a `NO RECORDED CONSENT` line, and the household-voiced preferences. It then
// lists the explicitly not-shared records and the still-unassessed records, and
// closes with a summary counting the moves touching shared records that carry no
// recorded consent — the review's attention list against the strategy threshold
// ("no shared attachment is migrated or re-aligned without recorded consent").
//
// The `attributes.household` shape is validated at the read boundary: a
// malformed block is a FATAL error naming the record (clear errors over
// fallbacks, `.claude/rules/code-style.md`). An ABSENT block is not an error —
// it means the record has not yet been assessed for household sharing.
//
// Report-only: it writes no `consent`/`preferences` entries and stamps no node.
// Consent and preference entries are recorded only from the household's own
// voice at office-hours (tactic-household-consent-offering). The intentions
// directory is resolved from `import.meta.url`, never cwd, matching the sibling
// scripts.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/household-consent-report.ts

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { isPlainObject, type IntentionNode } from "../src/schema.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/household-consent-report.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

// --- Household shape (validated at the read boundary) ----------------------

export interface ConsentEntry {
  date: string;
  move: string;
  decision: string;
}

export interface Household {
  shared: boolean;
  basis: string;
  consent: ConsentEntry[];
  preferences: string[];
}

/**
 * Validate and narrow a delegation record's `attributes.household` block.
 *
 * Returns `null` when the block is ABSENT — an unassessed record, never an
 * error. When the block is PRESENT but malformed, throws a fatal error naming
 * the record and the offending field (clear errors over fallbacks). Consent and
 * preference entries are read verbatim; this only checks shape, never voice.
 */
export function parseHousehold(node: IntentionNode): Household | null {
  const raw = node.attributes.household;
  if (raw === undefined || raw === null) return null;

  const where = `household-consent-report: ${node.id} attributes.household`;
  if (!isPlainObject(raw)) {
    throw new Error(`${where} must be an object, got ${typeof raw}`);
  }
  if (typeof raw.shared !== "boolean") {
    throw new Error(`${where}.shared must be a boolean, got ${typeof raw.shared}`);
  }
  if (typeof raw.basis !== "string" || raw.basis.trim() === "") {
    throw new Error(`${where}.basis must be a non-empty string`);
  }
  if (!Array.isArray(raw.consent)) {
    throw new Error(`${where}.consent must be an array (use [] when none)`);
  }
  const consent: ConsentEntry[] = raw.consent.map((entry, i) => {
    if (!isPlainObject(entry)) {
      throw new Error(`${where}.consent[${i}] must be an object`);
    }
    if (typeof entry.date !== "string" || typeof entry.move !== "string" || typeof entry.decision !== "string") {
      throw new Error(
        `${where}.consent[${i}] must carry string date, move, and decision fields`,
      );
    }
    // Empty strings are as malformed as a missing field: an empty date/move/
    // decision would render a garbled `— consent : ` line and count as full
    // consent coverage, so reject them (matching the non-empty `basis` check
    // above and the clear-errors-over-fallbacks rule).
    if (entry.date.trim() === "" || entry.move.trim() === "" || entry.decision.trim() === "") {
      throw new Error(
        `${where}.consent[${i}] date, move, and decision must be non-empty`,
      );
    }
    return { date: entry.date, move: entry.move, decision: entry.decision };
  });
  if (!Array.isArray(raw.preferences)) {
    throw new Error(`${where}.preferences must be an array (use [] when none)`);
  }
  const preferences: string[] = raw.preferences.map((p, i) => {
    if (typeof p !== "string") {
      throw new Error(`${where}.preferences[${i}] must be a string`);
    }
    return p;
  });

  return { shared: raw.shared, basis: raw.basis, consent, preferences };
}

// --- Report model ----------------------------------------------------------

/** A recovery/re-alignment move touching a shared record and its consent state. */
export interface Move {
  /** The `kind: strategy` node whose `recovers` names the record. */
  strategyId: string;
  /** The matched consent entry, or `null` when none is recorded. */
  consent: ConsentEntry | null;
}

export interface SharedRecordReport {
  id: string;
  basis: string;
  moves: Move[];
  preferences: string[];
}

export interface ReportModel {
  shared: SharedRecordReport[];
  notShared: { id: string; basis: string }[];
  unassessed: string[];
  /** Moves touching shared records that carry no recorded consent entry. */
  uncoveredMoveCount: number;
}

/**
 * Build the report model from every node in the store. Pure: takes the already
 * read nodes, resolves each delegation record's household state through
 * `parseHousehold` (which throws on a malformed block), and cross-references
 * strategies' `recovers` edges to enumerate the moves touching each shared
 * record.
 */
export function buildReport(nodes: IntentionNode[]): ReportModel {
  const delegations = nodes.filter((n) => n.kind === "delegation");
  const strategies = nodes.filter((n) => n.kind === "strategy");

  // Index each delegation id to the strategy ids that recover it, in a single
  // pass — mirrors router.ts's `childrenOf` cross-reference map rather than
  // re-filtering the whole strategy list once per shared record.
  const recoversIndex = new Map<string, string[]>();
  for (const strategy of strategies) {
    for (const delegationId of strategy.recovers) {
      const list = recoversIndex.get(delegationId);
      if (list === undefined) recoversIndex.set(delegationId, [strategy.id]);
      else list.push(strategy.id);
    }
  }

  const shared: SharedRecordReport[] = [];
  const notShared: { id: string; basis: string }[] = [];
  const unassessed: string[] = [];

  for (const record of delegations) {
    const household = parseHousehold(record);
    if (household === null) {
      unassessed.push(record.id);
      continue;
    }
    if (!household.shared) {
      notShared.push({ id: record.id, basis: household.basis });
      continue;
    }

    // Moves touching this shared record: every strategy that recovers it,
    // sorted for deterministic output, each matched to its consent entry.
    const moves: Move[] = (recoversIndex.get(record.id) ?? [])
      .slice()
      .sort()
      .map((strategyId) => ({
        strategyId,
        consent: household.consent.find((c) => c.move === strategyId) ?? null,
      }));

    shared.push({ id: record.id, basis: household.basis, moves, preferences: household.preferences });
  }

  // Derive the uncovered-move count from the built model rather than mutating a
  // counter inside the map above, so the summary can never desync from the
  // moves it summarizes.
  const uncoveredMoveCount = shared
    .flatMap((r) => r.moves)
    .filter((m) => m.consent === null).length;

  return { shared, notShared, unassessed, uncoveredMoveCount };
}

// --- Report rendering ------------------------------------------------------

/** Render the report model as markdown (stdout). */
export function formatReport(model: ReportModel): string {
  const lines: string[] = [];
  lines.push("# Household consent report — strategy-household-shared-attachments");
  lines.push("");
  lines.push(
    "Sensor: owner review at office-hours over the delegation records. Consent " +
      "and preference entries are recorded only from the household's own voice " +
      "(tactic-household-consent-offering); this report never seeds them.",
  );
  lines.push("");

  lines.push("## Shared attachments");
  lines.push("");
  if (model.shared.length === 0) {
    lines.push("_No delegation record is marked `household.shared: true`._");
    lines.push("");
  }
  for (const record of model.shared) {
    lines.push(`### ${record.id}`);
    lines.push("");
    lines.push(`- Basis: ${record.basis}`);
    lines.push("- Moves touching this attachment (strategies' `recovers` edges):");
    if (record.moves.length === 0) {
      lines.push("  - _none recorded as a `recovers` edge_");
    } else {
      for (const move of record.moves) {
        if (move.consent === null) {
          lines.push(`  - ${move.strategyId} — NO RECORDED CONSENT`);
        } else {
          lines.push(
            `  - ${move.strategyId} — consent ${move.consent.date}: ${move.consent.decision}`,
          );
        }
      }
    }
    lines.push("- Household preferences:");
    if (record.preferences.length === 0) {
      lines.push("  - _none recorded_");
    } else {
      for (const pref of record.preferences) {
        lines.push(`  - ${pref}`);
      }
    }
    lines.push("");
  }

  lines.push("## Not shared (assessed author-only)");
  lines.push("");
  if (model.notShared.length === 0) {
    lines.push("_None._");
  } else {
    for (const record of model.notShared) {
      lines.push(`- ${record.id} — ${record.basis}`);
    }
  }
  lines.push("");

  lines.push("## Unassessed (no household block)");
  lines.push("");
  if (model.unassessed.length === 0) {
    lines.push("_None — every delegation record has been assessed._");
  } else {
    lines.push("These records have no `household` block yet — assess each for sharing:");
    for (const id of model.unassessed) {
      lines.push(`- [ ] ${id}`);
    }
  }
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(
    `- Moves touching shared attachments with NO RECORDED CONSENT: ${model.uncoveredMoveCount} ` +
      "(the review's attention list against the threshold — no shared attachment " +
      "migrated or re-aligned without recorded consent).",
  );
  lines.push(
    "- Re-alignment moves not carried as `recovers` edges are enumerated by the " +
      "reviewing owner: the mechanical list above covers only strategies' recorded " +
      "`recovers` edges into shared records.",
  );
  lines.push("");

  return lines.join("\n");
}

// --- Main ------------------------------------------------------------------

export function main(): number {
  const nodes = listNodes(intentionsDir);
  const model = buildReport(nodes);
  process.stdout.write(formatReport(model));
  // Exit 0 always: the report is informational. A non-zero uncovered count is
  // the review's attention list, not a program failure.
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(main());
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
