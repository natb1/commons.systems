/**
 * The payload shape baked into the published artifact at build time.
 *
 * A published claude artifact cannot read the intention store at runtime by any
 * route — its capability set is `downloads`/`mcp` only and a strict CSP blocks
 * every external host including fetch/XHR. So the page is a SNAPSHOT: every
 * number below is computed in Node against a working clone and serialized into
 * the single output file. See `intentions/tactic-plan-view-table.md` §Substrate.
 *
 * Consequence for filters: filtering is fully client-side and cannot fetch, so
 * every row and every ancestor the filters can reach must already be here.
 */

import type { RankKey } from "@commons-systems/intentionsutil";

/** The three fixed lane categories. Hue encodes KIND, never ancestor identity. */
export type LaneKind = "strategy" | "delegation" | "blocker";

/** One off-spine ancestor edge, rendered as a gutter lane rather than a cell. */
export interface Lane {
  id: string;
  kind: LaneKind;
}

/** One ancestor's authored contribution to a row's rank. */
export interface SourceContribution {
  id: string;
  /** The ancestor's own authored boost/override — the amount it injects. */
  amount: number;
}

/**
 * Why a row has no position in the router's selection order. Rendered as a
 * typed reason, never a blank cell.
 */
export type UnavailableReason =
  | { kind: "parked" }
  | { kind: "blocked"; by: string[] }
  | { kind: "container" }
  | { kind: "frozen" };

export interface PlanRow {
  id: string;
  statement: string;
  /** Effective tier — the outer ranking axis, from `resolveAttention`. */
  tier: number;
  /**
   * The row's full rank key, or null when the node got no `ResolvedAttention`
   * (it was not eligible). Carried WHOLE rather than collapsed to one number:
   * the ordering is lexicographic over `(tier, band, score, depth)`, and any
   * single scalar standing in for it would let one tier's weight decide
   * another tier's order. Sort with `compareRankKeyDesc`, never by subtraction.
   */
  rank: RankKey | null;
  /** Persisted phase, or null for a draft awaiting `/align-tactics`. */
  phase: string | null;
  /** 0-based index into `PHASE_LADDER`, or -1 for a draft. */
  phaseIndex: number;
  /** Band spine, largest contributor first. Rendered as nested span columns. */
  spine: string[];
  /** Everything the spine drops, painted as gutter lanes. */
  lanes: Lane[];
  /** Every distinct ancestor's authored contribution — the hot-lineage input. */
  sources: SourceContribution[];
  labels: string[];
  /** 1-based position in the router's selection order, or null. */
  position: number | null;
  /** ISO date. Absolute: never recomputed under a filter. */
  eta: string | null;
  reason: UnavailableReason | null;
  /** True when the row is a draft emitted at the `align-tactics` rung. */
  draft: boolean;
}

export interface Provenance {
  /** The commit the build ran against. Stamped prominently on the page. */
  sha: string;
  shaShort: string;
  /** Whether the working clone was clean at build time. */
  clean: boolean;
  /** ISO-8601 UTC build timestamp. */
  builtAt: string;
  /** The branch/ref the sha was read from. */
  ref: string;
}

export interface Velocity {
  /** Closures per day over the trailing window. Zero means a paused queue. */
  perDay: number;
  windowDays: number;
  closures: number;
  created: number;
}

export interface Payload {
  provenance: Provenance;
  velocity: Velocity;
  rows: PlanRow[];
  /** Statements for every id a row can reference, for hover/labels. */
  titles: Record<string, string>;
  /** Kind for every referenced ancestor id. */
  kinds: Record<string, string>;
  counts: {
    openTactics: number;
    selectable: number;
    drafts: number;
    phaseSet: number;
    parked: number;
    blocked: number;
    container: number;
  };
}

/**
 * Everything the page needs, as one serialized object.
 *
 * Declared HERE rather than beside the builder that produces it so the browser
 * half never has even a type-only import edge into a module that imports
 * `node:child_process`. A type import is erased, but the edge invites a later
 * value import that would not be.
 */
export interface PageData {
  payload: Payload;
  /** Done/total descendant counts per ancestor. Global, not windowed. */
  progress: Record<string, { done: number; total: number }>;
  /** Row id → delegation ids reachable from it, for the zero-lane note. */
  delegations: Record<string, string[]>;
}

/**
 * The five ladder rungs a tactic passes through, in order — the compact
 * progress pip's segments.
 *
 * Deliberately WIDER than `LADDER` in
 * `packages/intentionsutil/src/transitions.ts`, which is
 * `["implement", "qa", "review", "done"]`: that constant is the router's
 * control-flow spine and omits `main-qa`, which `forwardPhase` nonetheless
 * routes to when a tactic carries needs-main residue (39 nodes sit there in the
 * live store). A progress pip that dropped `main-qa` would render those rows as
 * if they had skipped a rung. `fix` is an INTERRUPT, not a rung — a fixing row
 * pips at its persisted phase and is marked separately.
 */
export const PHASE_LADDER: readonly string[] = [
  "implement",
  "qa",
  "review",
  "main-qa",
  "done",
];

/** The six label chips, in render order. */
export const LABELS = [
  "bug",
  "security",
  "outage",
  "parked",
  "delegated",
  "blocked",
] as const;
