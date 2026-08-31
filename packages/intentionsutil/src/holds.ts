// holds — the tracked-hold vocabulary: the hold kinds, their id-slug mapping,
// the deterministic hold-id derivation, and the re-check policy per kind.
//
// This module is the single source of truth for that vocabulary. The producer
// half (scripts/hold-node-decide.ts) and any consumer that re-checks a hold's
// tracked condition both import from here rather than re-deriving it.

/**
 * Hold-kind vocabulary: HOLD_KINDS is the source of truth for the producer
 * kinds this tool implements; KIND_SLUGS and HoldKind both derive from it.
 *
 * Reserved slugs (the id scheme is deliberately extensible; a slug reserved here
 * is documentation of the namespace, not an implemented producer):
 *
 *  - `conflict`    — provision-conflict: a merge-conflict retry against a
 *                    moving main. IMPLEMENTED.
 *  - `fix-cap`     — fix-attempt-cap: the CI-fix interrupt exhausted
 *                    FIX_ATTEMPT_CAP attempts (see src/transitions.ts).
 *                    IMPLEMENTED.
 *  - `residue`     — worktree-residue: provision-node-worktree refused to
 *                    provision the node's worktree because it carries
 *                    mechanical residue from a dead session (exit 14 — a dirty
 *                    tracked tree, or a detached HEAD / in-progress operation
 *                    that could not be auto-repaired). NOT a content conflict:
 *                    origin/main merges clean once the residue is cleared, so
 *                    it never reaches the /dispatch-conflict lane. It is a
 *                    steady state with no autonomous repair path, so the
 *                    producer escalates on the FIRST occurrence — there is no
 *                    strike ladder in front of it. IMPLEMENTED.
 *  - `ci-stalled`  — ci-pending-stalled: the autonomous tick observed the
 *                    node's draft-PR CI verdict as `pending` on the SAME head
 *                    SHA for DISPATCH_CI_PENDING_STRIKE_CAP consecutive
 *                    observations — its checks either never started (an empty
 *                    status-check rollup) or started and never concluded.
 *                    Unlike worktree-residue this DOES have a plausible
 *                    self-heal (the checks may still start), so it sits behind
 *                    a strike ladder rather than escalating on the first
 *                    occurrence. IMPLEMENTED.
 *  - `no-progress` — RESERVED for a different tactic's future per-node
 *                    no-progress fuse. Deliberately NOT wired to a producer
 *                    kind or a CLI case here; the name is reserved so the id
 *                    scheme (`tactic-hold-no-progress-<source>`) is documented
 *                    and cannot be claimed for something else. The CI-stall
 *                    bound above minted its own `ci-stalled` slug rather than
 *                    claiming this one: `no-progress` names a general per-node
 *                    fuse, and spending it on one specific cause would leave
 *                    that general fuse unnameable.
 */
export const HOLD_KINDS = [
  "provision-conflict",
  "fix-attempt-cap",
  "worktree-residue",
  "ci-pending-stalled",
] as const;

export type HoldKind = (typeof HOLD_KINDS)[number];

export const KIND_SLUGS: Record<HoldKind, string> = {
  "provision-conflict": "conflict",
  "fix-attempt-cap": "fix-cap",
  "worktree-residue": "residue",
  "ci-pending-stalled": "ci-stalled",
};

/**
 * Type guard narrowing a raw CLI string to `HoldKind`. Derived from HOLD_KINDS
 * (the single source of truth) rather than an enumerated `||` chain, so adding
 * a kind above cannot leave a stale second list behind here.
 */
export function isHoldKind(k: string): k is HoldKind {
  return (HOLD_KINDS as readonly string[]).includes(k);
}

/** Reserved-but-unimplemented kind slugs (see KIND_SLUGS' doc comment). */
export const RESERVED_KIND_SLUGS: readonly string[] = ["no-progress"];

/** The node-id slug shape provision-node-worktree:79 enforces. */
const NODE_ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The load-bearing closing sentence of every hold body's "How to resolve". */
export const RESOLUTION_SENTENCE =
  "resolve the hold tactic to `phase: done` (then prune) — clearing " +
  "`office_hours` alone does not unblock the source.";

/**
 * Derive the deterministic hold id and assert it matches the node-id slug shape
 * enforced at .claude/skills/dispatch-propagate/scripts/provision-node-worktree:79.
 * Throws (the CLI turns this into a non-zero exit + stderr) rather than emitting
 * an id the provisioner would later reject.
 */
export function holdIdFor(kind: HoldKind, sourceId: string): string {
  const slug = KIND_SLUGS[kind];
  if (slug === undefined) {
    throw new Error(`hold-node-decide: unknown kind "${kind}"`);
  }
  const id = `tactic-hold-${slug}-${sourceId.replace(/^tactic-/, "")}`;
  if (!NODE_ID_RE.test(id)) {
    throw new Error(
      `hold-node-decide: derived hold id "${id}" does not match the node-id slug ` +
        `shape ${NODE_ID_RE.source} (from source "${sourceId}") — ` +
        `provision-node-worktree would reject it`,
    );
  }
  return id;
}

/**
 * Whether a hold kind's tracked condition can be re-checked mechanically, and
 * if so by which predicate.
 *
 *  - `auto`   — a single-call predicate decides "does the tracked condition
 *               still hold?", so a hold of this kind can be auto-resolved when
 *               the condition has cleared.
 *  - `manual` — no such predicate exists; `why` records the reason, and a hold
 *               of this kind stays parked until a human or a dedicated session
 *               resolves it.
 */
export type HoldRecheck =
  | { policy: "auto"; predicate: "worktree-clean" }
  | { policy: "manual"; why: string };

/**
 * The re-check policy for every hold kind.
 *
 * The `Record<HoldKind, HoldRecheck>` type is load-bearing: adding a kind to
 * HOLD_KINDS without classifying it here fails typecheck (TypeScript's
 * mapped-type exhaustiveness over `Record<HoldKind, ...>` enforces this — no
 * manual assertion needed). A kind with no machine-checkable predicate must say
 * so explicitly, via a `manual` entry carrying a `why`, rather than silently
 * defaulting to never-re-checked.
 */
export const KIND_RECHECK: Record<HoldKind, HoldRecheck> = {
  "worktree-residue": { policy: "auto", predicate: "worktree-clean" },
  "provision-conflict": {
    policy: "manual",
    why:
      "resolving a content conflict against a moving main is a session's job " +
      "(/dispatch-conflict Lane 3); there is no single-call predicate that " +
      "distinguishes 'resolved' from 'not yet attempted'",
  },
  "fix-attempt-cap": {
    policy: "manual",
    why:
      "the cap is exhausted attempts, not an observable external condition; " +
      "re-checking would mean re-running CI, which is not a predicate",
  },
  "ci-pending-stalled": {
    policy: "manual",
    why:
      "checking whether CI concluded requires a live PR-verdict fetch, not a " +
      "local predicate the auto-resolve sweep can run without a network call; " +
      "and the hold fires on an exhausted strike ladder, not on a condition " +
      "that flips back on its own",
  },
};
