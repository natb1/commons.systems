---
name: align-strategy
description: Interview-driven recording of a `strategy-*` intention node — the graph-native successor to `/file-issue`'s requirements-definition role. Frames the input as a new strategy or an edit to an existing one, runs a Socratic dialectic to fix intent/placement/benefit/signal/conditions, advises on delegation capture, retains tactical byproducts as draft tactic nodes, and lands the record via `graph-commit`. On-demand only; never files a GitHub issue.
user-invocable: true
---

# Align Strategy

`/align-strategy [optional requirement text]` records or revises a
`strategy-*` intention node under interview. It supersedes `/file-issue`'s
requirements-definition role for the graph-native dispatch model
(`intentions/strategy-graph-native-dispatch.md`): a strategy enters
execution by being recorded here, not by becoming a GitHub issue. Full
spec and coverage matrix: `intentions/tactic-graph-native-dispatch.md`
§2.2 and §4.

This skill never files, edits, or closes anything on GitHub. Its only
artifact is one or more `intentions/strategy-*.md` (and, incidentally,
`intentions/tactic-*.md` draft) nodes landed on `origin/main`.

**Record-completeness contract** (strategy clarification 31 / condition 7):
the graph record is the **sole carrier** from this skill to `/align-tactics` —
the target router queues re-evaluation as a fresh session with only the
graph, no memory of this interview. Every decision, edge-case resolution,
and tactical byproduct this round produces must land in the node
(`clarifications`/`attributes.conditions`/`success_signal`, plus draft-tactic
bodies) at record time (step 5); running `/align-tactics` in the same
session afterward is a bootstrap safety net, not a substitute for a
complete record. Step 6's clause-coverage walk is the check that discharges
this condition.

The interview **is** the audit (clarification 2 on
`strategy-graph-native-dispatch`): unlike `/file-issue`, there is no
downstream PR review step that checks the requirement was captured
correctly. Take the dialectic seriously — a rushed interview is a
permanent gap in the record, not a draft someone else will catch.

## Trigger and input

On-demand only, human-invoked. Treat any text following `/align-strategy`
as the **requirement text** for step 1. With no text, run the
**improvement pass** branch of step 1 instead.

Never `AskUserQuestion`-free for the interview itself (step 2) — this
skill's whole value is the dialectic. Reserve `AskUserQuestion` for
bounded choices with a recommended option listed first, per the
2026-07-03 prototype run's convention; open-ended elicitation is a normal
conversational turn, prose reply captured as-is (same split as
`.claude/skills/align-init/SKILL.md`'s rung-0 intent interview).

## Step 0 — Claim and isolate

Before the first write, claim the target node id and author in its
worktree — the same uniform node-id reservation discipline the router's
fan-out workers follow (`strategy-graph-native-dispatch`'s 2026-07-06
concurrency-safety clarification). Never author strategy edits in the
shared `main` checkout: a second concurrent session's dirty tracked file
blocks your `graph-commit` rebase, and a stale read races live phase state
(both happened live the day that clarification landed).

1. **Resolve the target node id.** For an edit, an improvement pass, or a
   doctrine round, it is the primary `strategy-*` being edited — claimed
   before the first write. A brand-new strategy has no id until step 5
   constructs it; author it in the worktree and claim its id as soon as the
   id is fixed.
2. **Check the claim.** If `<project-root>/.claude/worktrees/<node-id>`
   already exists with a live session — `worktree_has_live_session <path>`
   (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:15`,
   run with `dangerouslyDisableSandbox: true`) — the claim is held by
   another session: stop and report the held claim to the author. Do
   **not** park the node — a held claim is not a defect.
3. **Enter the worktree.** Otherwise create or re-enter it — native
   `EnterWorktree` with the node id as the worktree name, or the
   `provision-node-worktree`
   (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`)
   primitive — and do all authoring and the step-5 `graph-commit` from
   there. The worktree **is** the claim: the same live-session ⇔ worktree
   liveness rule the router uses, so no separate lock is needed.

**Doctrine-recording rounds pin the pace curve.** A round that records
governing dispatch doctrine (a concurrency-safety or
dispatch-discipline clarification) pins
`dispatch.config/target-workers.json` to floor 0 / terminal 1 for its
audit window so the fleet quiesces while the doctrine settles, then
restores the standing 50 / 100 curve after — the practice the 2026-07-06
clarification records.

## Step 1 — Frame

**With requirement text:**

1. **Multi-topic separation.** If the text bundles independent concerns —
   each would need its own `success_signal` and could be pursued to
   completion without the other — treat it as N separate strategies. Run
   steps 2–6 once per concern, each producing its own node and its own
   `graph-commit` call in step 5. Do not force unrelated concerns into one
   node to avoid re-running the interview.
2. **Duplicate / overlap detection.** Grep `intentions/strategy-*.md` for
   keyword overlap with the requirement (statement, rationale, and
   clarification text). A strong match means this is an **edit**, not a
   new strategy — read the matched node in full via
   `readNode(intentionsDir, id)` (or just read the file: only the
   frontmatter is authoritative) before the interview, and use it as the
   dialectic's starting point.
3. **New vs. edit.** No strong overlap → new strategy: identify which
   `virtue-*.md` node(s) it serves (a strategy's `serves` must resolve to
   `kind: virtue` — `validateGraph` rule 8). Overlap found → edit: confirm
   with the author (`AskUserQuestion`, recommended: "edit
   `strategy-<id>`") before proceeding.

**With no requirement text — improvement pass:**

1. Read every `intentions/strategy-*.md` node. For each, check:
   - Any `attributes.conditions` entry that no longer plausibly holds
     against current repo/author state.
   - `reading`/`gap` staleness — a `reading` that predates a clarification
     it should have been invalidated by, or a `gap` describing a target
     already met.
   - A `clarifications` entry contradicted by a later clarification on the
     same or a related node.
   - **Greenfield-relevance gate** (strategy clarification 26): sweep the
     strategy's open (non-draft, non-`done`) tactics for subjects deleted or
     superseded by a non-draft node elsewhere in the graph (a raw draft
     never obsoletes live work). Per-unit: a doomed unit is a candidate to
     drop, naming the superseding node; a tactic demotes to draft only when
     it is *fully* superseded; a tactic on doomed surface may be kept only
     with an explicit interim-live-risk exception naming its expiry event
     (e.g. "until the gh-queue drains"). This is the same gate
     `/align-tactics` runs at finalization — running it here too catches
     staleness on strategies with no pending decomposition round.
2. Separately, list `virtue-*.md` ids that appear in **no** strategy's
   `serves` — a virtue with no strategy expressing it is a candidate for a
   brand-new strategy.
3. Present the candidates (failing-condition strategies, stale-signal
   strategies, contradicted-clarification strategies, doomed-tactic
   strategies, unserved virtues) via `AskUserQuestion` and let the author
   pick one or more to take into step 2. If the author picks none, stop
   here — there is nothing to record.

**Mechanics.** The corpus staleness checks above (condition-vs-repo-state,
reading/gap dating, contradicted clarifications, greenfield-relevance) may
fan out to `Explore` subagents returning compact `path:line`-anchored
findings — the interview dialectic itself (step 2 onward) is never
delegated. Keyword grep (this step's corpus sweep, and step 3's delegation
sweep) only **shortlists** candidates; it never disposes of one — disposition
requires reading each shortlisted node in full. A strategy-corpus census
script is planned as an enumeration hook for this sweep
(`tactic-align-tactics-mechanical-floor` Unit 4); until it lands, sweep the
corpus by hand as above.

## Step 2 — Interview dialectic

Run this once per strategy target selected in step 1 (new or edit).

1. **Intent.** Elicit the one-line `statement` a plain conversational turn
   first; once you have enough to draft one, confirm it via
   `AskUserQuestion` with your best draft as the recommended option.
2. **Placement.** For a new strategy: propose the `serves` virtue id(s) and,
   if it is naturally a sub-strategy of an existing one, a `parent`
   strategy id (same-kind only — `validateGraph` rule 6). For an edit:
   confirm placement is still correct given the revision. Recommend your
   best guess first.
3. **Benefit.** Talk through why this strategy is worth running now versus
   later or not at all — this is conversational, not a gated question,
   but its conclusion should be visible in the eventual `rationale`.
4. **Signal.** Draft a `success_signal` — `{observable, sensor, threshold,
   is_proxy}` — and confirm it names something a sensor can actually read.
   A strategy with no plausible sensor is a sign the intent is still too
   abstract; push back before recording one.
5. **Conditions.** Ask the author to state the circumstances this strategy
   is contingent on (`attributes.conditions`) — author availability,
   architectural assumptions, another strategy holding, etc.
6. **Edge cases and consequences.** For each of the above, surface at
   least one edge case or downstream consequence and resolve it with the
   author. Every resolution becomes a dated `clarifications` entry —
   `{question, answer}` where `answer` ends with a provenance sentence in
   the existing convention, e.g. `"...Recorded 2026-07-05 interview."`
   (get the date via `date -u +%Y-%m-%d`, never hand-guessed).
7. **Design-canvas support (UI-design requirements only).** When a
   decision is about UI shape and text underspecifies it, supplement
   `AskUserQuestion` with visual aids: build mockup/variant artifacts on
   `@commons-systems/ds` and sync them to the claude.ai/design canvas via
   `DesignSync`, so the author disambiguates by pointing at a variant.
   Canvas artifacts are interview aids, not deliverables — the resolution
   they produce is recorded as an ordinary dated clarification like any
   other. Caveat: a freshly synced component is absent from the canvas
   until the project is opened/refreshed — warn the author if this is
   their first look at a same-session sync.

**The `/file-issue` 8-category evaluation, folded into the steps above**
(so nothing from the coverage matrix silently drops):

| Category | Where it lands here |
|---|---|
| Duplicates | Step 1.2 overlap detection |
| Compliance | Step 2.2 — does intent trace to a real virtue |
| Clarity | Step 2.1 — a muddled composite statement is a step-1.1 multi-topic split, not a vague one-liner accepted as-is |
| Correctness | Step 2.4 — does the signal actually measure the stated intent |
| Relevance | Step 1 improvement-pass branch (edit mode only) |
| Decomposition | Deliberately **not** this skill's job — a strategy is never broken into PR leaves here; that is `/align-tactics` |
| Recommendations | The interview's own resolutions, recorded live as clarifications — there is no separate recommendations pass |
| Open-issue alignment | Step 1 improvement-pass condition/signal staleness sweep, generalized from "issues" to "the graph" |

## Step 3 — Delegation advice

Grep `intentions/delegation-*.md` for nodes whose `statement` or
`attributes.delegated` overlaps the strategy's domain. For each match:

1. Propose (`AskUserQuestion`) whether the strategy should carry a
   `recovers: [<delegation-id>]` edge (`recovers` is valid only on
   `kind: strategy`, and every entry must resolve to `kind: delegation` —
   `validateGraph` rule 9). A strategy that unwinds or reduces reliance on
   a delegation should record the edge even if unwinding is only partial.
2. Read the delegation's `attributes.divergence.level` and
   `attributes.irreversibility.{gated,recovery_cost}`. Surface capture risk
   explicitly in the proposal: high divergence or a gated, costly
   irreversibility means the author should weigh this before committing —
   state it in the `AskUserQuestion` description, not just in your own
   head.

## Step 4 — Retain draft tactics

Tactical or implementation content that surfaces naturally during the
interview is **retained, never refined and never dropped** — this skill
has no plan schema or quality bar to hold it to; that is `/align-tactics`'s
job.

**Artifact-owner placement** (strategy clarification 27): a draft's `serves`
names the strategy that owns the artifact the byproduct touches — never the
nearest-fit strategy just because it is the one under interview. A
genuinely cross-cutting byproduct uses an honest multi-entry `serves`
naming every owning strategy. When no strategy owns the artifact, do not
force-fit one: surface the gap to the author (a candidate for a brand-new
strategy, per the improvement-pass branch above) rather than parking the
draft under a strategy that does not actually own it.

For each such byproduct, write a draft tactic node:

```bash
cat > "$TMPDIR/tactic-draft.json" <<'JSON'
{"id":"tactic-<slug>","kind":"tactic","statement":"<one-line>","owner":"ai","status":"raw","parent":null,"serves":["<strategy-id>"],"rationale":"<why this surfaced, from the interview>"}
JSON
npx tsx packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/tactic-draft.json"
```

No `phase` field (equivalently `phase: draft`) marks it as retained
context, not selectable work — the router never selects a draft tactic and
it does not count as a child for the strategy's `/align-tactics`
eligibility. If the byproduct is more than a one-line statement, follow
with a direct `Edit` of the node body (everything after the closing `---`
fence) to carry the fuller context — `writeNode` preserves an existing
tactic body verbatim across later frontmatter-only rewrites, so this
survives untouched until `/align-tactics` consumes it.

Never write this content to an ad-hoc design doc outside `intentions/` —
the graph is the only home for tactical context, however provisional.

**Graph as sole tracker** (strategy clarification 28): the `intentions/`
graph is the source-of-truth issue tracker, bug tracker included — every
defect worth fixing is a tactic (or a unit of one), never a side channel
(an ad-hoc doc, a code comment thread, a chat aside). A byproduct that is a
bug report is retained here exactly like any other tactical byproduct. Code
`TODO`s stay pointer-only — `TODO(tactic-<id>)` — never carrying the
substance itself; a substantive TODO with no backing node is a
review-phase finding, not something this skill should ever produce.

## Step 5 — Record

Write the full node through `write-node.ts` — never hand-edit the YAML
frontmatter:

- **New strategy:** construct the full JSON from the interview (required
  core plus `serves`, `rationale`, `clarifications`, `success_signal`,
  `attributes.conditions`, `recovers` from step 3) and pipe or `--file` it
  into `write-node.ts`.
- **Edit:** read the existing node's frontmatter in full by **dumping it
  through `dump-node.ts`**, which captures both the JSON to reconcile and a
  base manifest recording the blob you read — the compare-and-swap token
  step 5's `graph-commit --base` checks (never a bare `readNode` one-liner,
  which records no base):

  ```bash
  BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts \
    --out-dir "$TMPDIR/dump" <strategy-id>)
  # reconcile from "$TMPDIR/dump/<strategy-id>.json"; pass "$BASE" to graph-commit below
  ```

  Only the frontmatter is authoritative. **Amendment completeness**
  (strategy clarification 38,
  widening clarification 32's tactic-amendment bar to any node amendment in
  any align skill): an edit round is a **whole-node reconciliation**, never
  a patch applied in isolation. Reconcile the edited strategy's `statement`,
  `rationale`, `attributes.conditions`, `success_signal`, and every
  `clarifications` entry the edit touches or contradicts against the
  interview's full outcome before constructing the JSON to land — landing
  one new clarification while a sibling field (an older clarification, a
  stale condition, an unrevised rationale sentence) still contradicts it is
  an incomplete amendment, the same defect class as an incomplete record
  (condition 7). The author's live presence in this interview reduces but
  does not remove the risk: the record, not the session, is the carrier.
  Construct the fully-reconciled JSON (not a `jq` delta patch) and pass it
  to `write-node.ts`. Never transcribe frontmatter by hand.

```bash
npx tsx packages/intentionsutil/scripts/write-node.ts --file "$TMPDIR/strategy.json"
```

Then land it — `graph-commit` is the **only** write path, never a
hand-rolled `git commit`/`git push`. For an **edit**, pass the base
manifest from `dump-node.ts` via `--base` so a stale read is refused
mechanically (before any commit) rather than left to rebase luck:

```bash
packages/intentionsutil/scripts/graph-commit --base "$BASE" \
  <strategy-id> [<draft-tactic-id> ...]
```

A brand-new strategy has no origin/main blob to compare, so it takes no
`--base` entry — omit the flag (or the id) for nodes this round creates;
`--base` covers only the pre-existing nodes you dumped.

Bundle any draft tactic nodes authored in the same pass into the same
`graph-commit` call as their serving strategy — one call, one commit,
covering everything this interview produced. A multi-topic round
(step 1.1) instead runs step 5 **once per independent strategy**, each its
own `graph-commit` call with its own draft-tactic bundle: the "single-node
commit" discipline (clarification 2) is about one node id per file inside
a commit that stays small and reviewable, not a hard cap of one file per
push.

If `graph-commit` exits 1 having printed a parking message, the node
landed with `office_hours` set instead of the intended content (a
concurrent-edit conflict) — tell the author and stop; do not retry
automatically.

**Soft-freeze warning.** If this is an edit to a strategy that has open
(non-draft, non-`done`) child tactics, warn the author **before** running
`graph-commit`: landing this edit queues a soft freeze and re-evaluation
of the open subtree once the router (`tactic-graph-router-selector` /
`tactic-graph-router-transitions`) is live (clarification 10). Until then,
say so explicitly and prompt the author to run the re-evaluation as an
inline `/align-tactics` pass in the same session — every round recorded on
`strategy-graph-native-dispatch` so far has done exactly this by hand.

## Step 6 — Requirements coverage check

Before finishing (requirement-text mode only): walk the author's original
text clause by clause and confirm each maps to a recorded element — a
`clarifications` entry, a `rationale` sentence, a `tooling_goals` entry, an
`attributes.conditions` entry, or a draft-tactic bullet. An unmapped clause
never drops silently: either return to the interview for it, or land it in
a draft tactic body. State in your final summary to the author which
clause mapped where — this is the one behavior a rushed pass is most
likely to skip, and skipping it is exactly the failure mode this step
exists to catch (found live in the 2026-07-03 `strategy-attention-surface`
round: a requirement anchor that survived only in session context until
this check restored it).

This walk is what discharges the record-completeness contract (strategy
clarification 31 / condition 7, see the preamble above): `/align-tactics`
re-evaluates from a fresh session with only the graph, so a clause that
maps to nothing recorded is a gap this skill — not the next session — is
responsible for closing.

## Out of scope

- `/align-tactics` (breaking a recorded strategy into PR-sized tactics —
  `tactic-align-tactics-skill`) and `/align-init` (fork onboarding —
  `tactic-align-init-skill`): sibling skills, not this one's job.
- Deleting `/file-issue` itself: that is `tactic-legacy-router-removal`,
  gated on the legacy gh queue draining. `/file-issue` keeps working for
  gh-issue work throughout this skill's rollout.

## Verification

Prose only — this is an interactive-dialectic skill with no automated
test surface, so no ```verify block:

- Dry-run on a toy requirement in an interactive session. Confirm:
  - the written node passes `npx tsx packages/intentionsutil/scripts/validate-graph.ts`;
  - it landed via `graph-commit` (visible on `origin/main`, not just
    locally committed);
  - any draft tactics from step 4 landed in the same commit and read back
    with `phase` absent;
  - no `gh issue`/`gh pr` command ran anywhere in the flow.
