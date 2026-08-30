---
name: align-audit
description: Autonomously re-audit the whole intention graph against the three standing integrity requirements (internal consistency, closure, parsimony) across all six kinds — the recurring re-visiting mechanism that write-time gates never provide. Digest-first token-bounded reading, mechanical-then-flagged-then-sampled-content passes, every finding dispositioned, findings touching virtue/strategy substance routed to the author, one `graph-commit` per run. Never files a GitHub issue; never runs `gh`.
user-invocable: true
---

# Align Audit

`/align-audit` re-audits every `intentions/**` node against the three standing
requirements `strategy-graph-integrity` records — **internal consistency**,
**closure** (every node closed, justified through a virtue root, or delegated
across a recorded delegation/mount boundary), and **parsimony** — and lands one
`graph-commit` per run in which every finding carries a disposition. It is the
graph's *re-visiting* mechanism: the write-time gates (`validateGraph`,
`graph-commit`'s stamped checks, the record-time
`tactic-align-strategy-alignment-tests` draft) never re-open settled content,
and one-time sweeps expire on completion. This skill is the standing pass that
keeps re-reading the whole record, kept affordable by digest-first reading (the
strategy's token-bounded condition). Full spec: `strategy-graph-integrity`
(`intentions/strategy-graph-integrity.md`) and its serving tactic
`intentions/tactic-align-audit-skill.md`.

This skill never files, edits, or closes anything on GitHub, and never runs
`gh`. Its only artifacts are `intentions/**.md` writes — a run clarification and
a refreshed `reading` on `strategy-graph-integrity`, plus any drafted-tactic or
inline-fix nodes — landed on `origin/main` via `graph-commit`.

It is the **autonomous** counterpart to the align interviews, and it inherits
its structure from the two sibling align skills, each with a part it does not
take:

- **From `/align-tactics` (`.claude/skills/align-tactics/SKILL.md`)** — take the
  autonomy contract and the office-hours park model (this skill is autonomous by
  default and never calls `AskUserQuestion` as its escalation mechanism), the
  Step 0 worktree-claim discipline, and the `write-node.ts` → body `Edit` →
  `graph-commit` write path with `dump-node.ts --base` manifests. Drop the
  decomposition machinery: this skill plans nothing and mints no
  implement-phase plans; it audits and dispositions.
- **From `/align-strategy` (`.claude/skills/align-strategy/SKILL.md`)** — take
  the register, the "grep/table is a shortlist, never a disposition" rule (a
  candidate finding is confirmed only by reading the flagged node's full body),
  the deferral mechanics and interview-type conventions it points to, and the
  base-manifest write path. Invert the interaction model: `/align-strategy`
  conducts an interview; **`/align-audit` never conducts one** — it audits the
  record *between* interviews and routes substance findings to the author.

## Trigger and input

Two triggers, same pipeline:

- **On-demand** — `/align-audit`, human-invoked, no argument required. It audits
  the whole graph; it never takes a single node as its target.
- **Scheduled recurrence** — the audit is meant to recur on a cadence
  (`strategy-graph-integrity` condition 4: a lapse is the same cadence-lapse
  capture mechanism `strategy-explicit-intent` names). Wiring the actual
  scheduler is out of this skill's scope; the skill documents the trigger and
  runs identically whether fired by hand or by a schedule.

## Step 0 — Claim and isolate

Before the first write, claim a session worktree and author there — the same
uniform node-id reservation discipline the router's fan-out workers and the
sibling align skills follow (`strategy-graph-native-dispatch`'s 2026-07-06
concurrency-safety clarification). Never author in the shared `main` checkout: a
concurrent session's dirty tracked file blocks this run's `graph-commit` rebase,
and a stale read races live phase state.

1. **Fetch and audit at `origin/main`** (freshness guard). The audit judges the
   *landed* record, not a stale local checkout — `git fetch origin main` first
   and read node content at `origin/main` (e.g. `git show
   origin/main:intentions/<id>.md`) when confirming a finding, emulating
   `tactic-align-skills-latest-graph-guard` until it lands. A finding derived
   from a far-behind working tree is a false positive.
2. **Resolve the worktree node id.** The audit has no single target node, so
   claim under `strategy-graph-integrity` (the strategy it serves) or an
   audit-round slug.
3. **Check the claim.** If `<project-root>/.claude/worktrees/<node-id>` already
   exists with a live session — `worktree_has_live_session <path>`
   (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:15`, run
   with `dangerouslyDisableSandbox: true`) — the claim is held by another
   session: stop and report the held claim, then end the run. A held claim is
   **not** an `office_hours` park and **not** a defect.
4. **Enter the worktree.** Otherwise create or re-enter it — native
   `EnterWorktree` with the node id as the worktree name, or the
   `provision-node-worktree`
   (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`)
   primitive — and do all authoring and the Step 7 `graph-commit` from there.
   The worktree **is** the claim.

## Autonomy contract

Runs to completion without user interaction. Parks to `office_hours` — never
`AskUserQuestion` as the escalation mechanism — under the same model
`/align-tactics` uses. The binding condition for this skill:

**Findings touching virtue or strategy substance always route to the author**
(`strategy-graph-integrity` condition 3, extending
`strategy-explicit-intent`'s human-authorship condition — the audit never
rewrites doctrine autonomously). Two routes, by author presence:

- **Author present** (an interactive `/align-audit` run) — surface the finding
  through the interview-type doctrine's conventions
  (`.claude/skills/align-strategy/SKILL.md`, "Question mechanics" and "Deferral
  mechanics"): a recommendation listed first, an honest boldness assessment, and
  an explicit accept-as-deferral option. A deferral lands a dated held-on-trust
  clarification plus one born-parked review item in the same commit, per the
  universal deferral rule owned there — do not restate that typology here.
- **Author absent** (a scheduled or headless run) — park the finding as a
  report, never auto-applied. Set `office_hours: {reason, since}` on the
  affected node via `write-node.ts` and land it with `graph-commit`. `since` is
  `date -u +%Y-%m-%d` (never hand-guessed). The `reason` carries the specific
  finding and a best-next-steps recommendation, so the office-hours queue tells
  the author exactly what decision is needed — every park writes recoverable
  context **at park time**, because session attach/resume is not a supported
  recovery path (the park-time-recommendation rule `/align-tactics` states;
  carry the recommendation as a labelled trailing sentence in `reason` until the
  first-class `office_hours.recommendation` field lands in `schema.ts`).

Do not call `AskUserQuestion` as the escalation mechanism — parking (or, when
the author is present, the deferral machinery) is the whole autonomy contract.

## The pipeline

Seven steps. Steps 1–2 read cheaply (digest only, no node bodies); Steps 3–5
open full bodies only where the mechanical layer flags them or the rotating
sample selects them; Step 6 dispositions; Step 7 records exactly one
`graph-commit`.

### Step 1 — Digest

Run the whole-graph digest and read its output — **do not read node bodies
yet**. The digest is the token-bounding device that makes a whole-graph pass fit
an ordinary session (`strategy-graph-integrity` condition 1: the audit stays
token-bounded, full node bodies opened only where flagged):

```bash
node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only
```

The CLI is read-only (local store + `git log`, no `gh`, no network, no committed
file) and lives in `packages/intentionsutil/scripts/graph-digest.ts`, landed by
`graph-digest.ts` (landed by PR #2865; the node `tactic-graph-digest-tooling` was pruned at `phase: done` and no longer exists). `--tables-only` emits just the derived check
tables (Section 2); drop the flag for the full per-node summary (Section 1) when
the sampled content pass (Step 5) needs the per-node lines.

### Step 2 — Mechanical checks

Read the derived tables straight from the digest — this is the full-mechanical
layer that runs every node every run. The tables
(`packages/intentionsutil/src/digest.ts`) and what each carries:

- **`[VALIDATE]`** — `validateGraph` result: `pass`, or the integrity-violation
  message (referential/structural rules 1–15).
- **`[CLOSURE]`** — every strategy/tactic whose motivation chain (`serves` plus
  the transitive `parent` chain) never reaches a `kind: virtue` root. The
  edge-resolution limb of closure; an empty-`serves` sub-strategy whose parent
  chain reaches a root is legitimately closed.
- **`[DONE-PRESENT]`** — tactics at `phase: done` still present in the store
  (should have pruned).
- **`[DUP-SERVES]`** — every node re-declaring an entry of its direct parent's
  `serves` (partial overlaps included, strategy and tactic layers) — a
  parsimony signal.
- **`[NEAR-DUP-STATEMENTS]`** — statement pairs above token-Jaccard 0.6,
  highest first, capped. A **shortlist** for disposition, never a disposition:
  parallel per-strategy sweep families are a known-benign pattern.
- **`[DANGLING-REFS]`** — node-id references in prose bodies classified
  `live` / `pruned` / `missing` / `wildcard`, with a `[planned]` annotation
  when an open tactic mentions a missing ref. A `missing` unowned by any queued
  tactic is the only violation class; `pruned` and family-wildcard refs are
  legal (the three-class reference convention on `strategy-graph-integrity`).
- **`[STORED-DEFAULTS]`** — per-node count of serialized frontmatter keys equal
  to a schema default. A structure-parsimony signal only; remediation is owned
  elsewhere (`tactic-omit-default-serialization` /
  `strategy-graph-self-description`), not fixed here.

### Step 3 — Flagged reads

Open full node bodies **only** for the nodes the mechanical layer flagged, and
confirm each candidate finding against content. The `[NEAR-DUP-STATEMENTS]` and
`[DANGLING-REFS]` tables are shortlists, never dispositions — the same
grep-shortlists-but-never-disposes discipline `/align-strategy`'s step-1 corpus
sweep follows. A near-dup pair is a real finding only after reading both nodes
confirms genuine redundancy (not a benign parallel sweep); a `missing` ref is a
real finding only after confirming no open/queued tactic owns creating the
target. Confirm at `origin/main`.

### Step 4 — Content-level pass, sampled

Full mechanical coverage runs every node every run (Steps 2–3); **content-level**
coverage is amortized across runs via a rotating sample of nodes — a whole-graph
content re-read every run would break the token bound. For the sampled nodes,
read the full body and check for what the mechanical tables cannot see:

- clarification entries contradicted by a later entry on the same or a related
  node (consistency);
- rationale sentences contradicting a recorded `attributes.conditions` entry
  (consistency);
- doctrine duplicated outside its one home (parsimony — the content half
  `strategy-graph-integrity` owns; structure-parsimony stays with
  `strategy-graph-self-description` by pointer);
- a node's content no longer expressing the virtue its motivation chain
  terminates in — the **justification** limb of closure is content-level, not
  merely that the `serves`/`parent` edge resolves (the `[CLOSURE]` table checks
  edge resolution; this check reads whether the content still means it).

### Step 5 — Disposition

Every confirmed finding gets **exactly one** disposition — none drops silently:

- **Fixed inline** — mechanical, non-doctrinal only (e.g. pruning a leaked
  `[DONE-PRESENT]` tactic, correcting a plain-typo dangling ref). The fix lands
  in this run's `graph-commit`.
- **Drafted as a tactic** — a fix that is real work becomes a tactic (or a unit
  of an existing one), authored the same way `/align-strategy` retains a draft
  tactic. The graph is the sole issue/bug tracker
  (`strategy-graph-integrity` and `strategy-graph-native-dispatch` sole-tracker
  doctrine): never a side channel.
- **Already-tracked** — dedupe against queued tactics; cite the owning node's id
  in the report rather than re-filing (e.g. the 11 done-but-present tactics the
  emulated run found were already owned by
  `tactic-graph-self-consistency-sweep` Unit 1).
- **Ratified exception** — the author judges a flagged pattern benign (e.g. a
  known parallel-sweep near-dup); recorded as such.
- **Deferred** — held on trust with a dated clarification plus a born-parked
  review item, per the universal deferral rule.

**Substance findings route to the author** (Autonomy contract, above): any
finding touching virtue or strategy substance is never fixed inline — it goes to
the author (present: via the interview conventions; absent: parked as a report).
Only mechanical, non-doctrinal findings are eligible for inline fix.

### Step 6 — Report and record

One clarification on `strategy-graph-integrity` per run, carrying: counts by
requirement (consistency / closure / parsimony), each finding's disposition, and
repeats-versus-the-prior-run (the signal's threshold reads a clean cycle as zero
undispositioned findings **and** zero repeats of the prior cycle's findings).
End the clarification `answer` with a provenance sentence in the convention, e.g.
`"...Recorded 2026-07-16 /align-audit run."` (date via `date -u +%Y-%m-%d`).
Refresh the strategy's `reading` — the audit run **is** the strategy's sensor
read (`success_signal.sensor` = "the /align-audit report"). A run that changes
nothing still records its clean result: a clean cycle is a real reading.

### Step 7 — Land one graph-commit

All of the run's writes — the run clarification and refreshed `reading` on
`strategy-graph-integrity`, any inline fixes, any drafted or born-parked tactics
— land in **one** `graph-commit`. Follow the sibling skills' write path exactly:

- **Base manifest for every pre-existing node this run edits.** Dump them
  through `dump-node.ts` *before* rewriting, then pass the manifest to
  `graph-commit --base` so a stale read of a live node is refused mechanically
  rather than by rebase luck. Nodes this run *creates* have no `origin/main`
  blob and take no `--base` entry.

  ```bash
  BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts \
    --out-dir "$TMPDIR/dump" strategy-graph-integrity [<other-pre-existing-id> ...])
  ```

- **Frontmatter via `write-node.ts`** — construct the full node JSON and pipe or
  `--file` it in; never hand-author YAML frontmatter, `write-node.ts` is the
  single validation gate. For a park, set `office_hours: {reason, since}`.

  ```bash
  npx tsx packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/node.json"
  ```

- **Body via `Edit`** for any node whose body content changes (`writeNode`
  preserves an existing body verbatim across frontmatter-only rewrites).

- **Land via `graph-commit`** — the **only** write path, never a hand-rolled
  `git commit`/`git push`:

  ```bash
  packages/intentionsutil/scripts/graph-commit --base "$BASE" \
    strategy-graph-integrity [<id> ...]
  ```

  Pass `--base "$BASE"` whenever the call touches a pre-existing node. If
  `graph-commit` exits 1 having printed a parking message, a concurrent writer
  landed an overlapping edit and this run's content did not land (the node
  landed with `office_hours` set instead); if it exits 1 with the busy-main
  `... retry later` message, nothing landed and no park was set. Either way,
  report it and stop — do not retry automatically within this session.

## Ratchet rule

Any check this skill runs in prose that stabilizes across runs and is
expressible in code **graduates** into `validateGraph`/CI or the digest tables
(`strategy-graph-integrity` condition 2). The skill's prose checks are an
**incubator, never the permanent home** — a mechanical check that has proven
stable belongs in `validateGraph` (as a new rule) or `digest.ts` (as a new
table), not re-run by hand every audit. When you notice a prose check has become
mechanical and stable, draft the tactic that migrates it (Step 5, "drafted as a
tactic") rather than leaving it living in this skill indefinitely.

## Landing caveat

`.claude/skills/**` is **agent-behavior config**, and dispatch auto mode denies
committing it (the `.claude/rules/sandbox.md` read-only carve-out and the
auto-mode config-commit denial). Two consequences:

- **This skill file's own future edits** — if a commit touching
  `.claude/skills/align-audit/SKILL.md` is denied under auto mode, park to
  `office_hours` for interactive landing (reason naming the denied path); do not
  retry the commit autonomously.
- **A run that needs to touch `.claude/skills/**` content** — if a fix a
  `/align-audit` run wants to apply would itself edit `.claude/skills/**`, do not
  retry the commit autonomously under auto mode: park to `office_hours` naming
  the denied path, and let an interactive session land it. This is about *how*
  the commit lands, not extra content the skill must carry — the audit's own
  `intentions/**` writes land fine via `graph-commit`'s `graph/**` fast path.

## Out of scope

- **Rewriting virtue or strategy substance autonomously** — substance findings
  route to the author (Autonomy contract); this skill never edits doctrine on
  its own authority.
- **Replacing the record-time gates or the align interviews** — the record-time
  `tactic-align-strategy-alignment-tests` draft and `validateGraph`/`graph-commit`
  stay the write-time gates; `/align-strategy` and `/align-tactics` stay the
  interviews. This skill audits the record **between** interviews; it never
  conducts one.
- **Remediating structure-parsimony** — `[STORED-DEFAULTS]` and the
  omit-default/derived-never-stored mechanics are owned by
  `tactic-omit-default-serialization` / `strategy-graph-self-description`; this
  skill reads the signal but does not fix it.
- **Folding in the retired dialectic / improvement-pass components** — whether
  components of the retired rung-5 dialectic and the retired `/align-strategy`
  improvement pass belong in `/align-audit` is a pending inclusion decision owned
  by the born-parked office-hours sitting `tactic-align-audit-legacy-review`.
  Author this skill **without** them; that sitting amends it if it decides to
  fold them in.
- **Cadence wiring** — the scheduler that fires the recurrence
  (`strategy-graph-integrity` condition 4); this skill documents its trigger, a
  lapse is captured by `strategy-explicit-intent`'s cadence-lapse mechanism.

## Verification

Prose — the deliverable is a skill file; the real test is a run:

- Read-through against `strategy-graph-integrity`'s four conditions: digest-first
  token-bounding (Steps 1–2 read no bodies), the ratchet rule, author routing
  for substance findings, and a documented recurrence trigger are all present in
  the skill body.
- First run (produces the strategy's first `reading` — the substance of
  `tactic-align-audit-skill`'s `validates` edge): from a claimed worktree at
  `origin/main`, execute `/align-audit` end-to-end; every finding dispositioned;
  the run clarification plus a refreshed `reading` land on
  `strategy-graph-integrity` in one `graph-commit` (visible on `origin/main`).
- No `gh issue`/`gh pr` command ran anywhere in the flow; the run's only writes
  are state-only `intentions/**` edits via the graph fast path.
