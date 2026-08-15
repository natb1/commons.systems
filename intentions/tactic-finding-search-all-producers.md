---
id: tactic-finding-search-all-producers
kind: tactic
statement: "Merge the five private follow-up writers into ONE find-or-recur
  write surface that every node creator calls — running BOTH shared checks on
  one search pass: duplicate/merge (optional deterministic key plus a
  whole-graph similarity search) and supersession (the new node tested as a
  superseder, rewrite-in-place preferred, close-as-superseded recorded and
  parked, never executed unattended)"
owner: ai
status: raw
parent: null
rationale: "REWRITTEN 2026-08-14 by the THIRD /align round of that date, on
  author ruling, widening this node from the finding-producer population to ALL
  node creation and adding the supersession check. Two same-day rewrites precede
  this one (per-skill discipline -> merged common logic; then this). What
  changed this round: the author ruled that exactly TWO write surfaces create
  nodes and the seam is by KIND — the /align interview record for
  persistent-layer nodes, this surface for every tactic — and named
  /align-tactics explicitly as a CALLER of this surface rather than a third
  surface. That makes this node's caller set larger than the seven skills
  measured in the previous rewrite: /align Step 4 and /align-tactics
  decomposition join it, and neither is among the five private writers, so
  neither is served by the merge as previously scoped. The author further ruled
  that the supersession analysis belongs on this same surface rather than a
  second one, on the same DRY/parsimony ground as the first merge, and that a
  superseded node is RECORDED and PARKED with a close recommendation, never
  closed by the unattended producer. serves is unchanged and still honest: the
  RULE binding every creator is strategy-graph-native-dispatch's and the surface
  is a dispatch-surface script, while the OBSERVABLE that reads the outcome
  lives on strategy-recursive-self-improvement with its instrument. Rewritten in
  place rather than superseded — this node is phase null, a draft — which is the
  merge discipline this change records, practised on itself for the third time
  on this date."
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# One find-or-recur write surface, called by every finding producer

**Rewritten 2026-08-14** by the second `/align` round of that date. As first
drafted earlier the same day this node installed find-before-minting as *prose in
each producer's skill*. The author raised the bar to **merged common logic**,
stating the goal as DRY/parsimony. Six copies of one instruction is the same
defect class as five scripts — it is how the repo arrived at five private writers
— so the drafted shape was itself the thing to fix.

**Rewritten again 2026-08-14** by the **third** `/align` round of that date, on
author ruling. Two things changed, both widening: the population this surface
serves grew from *finding producers* to **every node creator**, and the surface
gained a **second check** — supersession. See "The two surfaces" and "The
supersession half" below.

The normative statement lives on `strategy-graph-native-dispatch`, clarification
*"Is the find-before-minting rule discharged by each producer's skill stating it,
or by one shared write surface every producer calls?"*, now joined by the
same-strategy clarifications *"What are the sanctioned ways a node enters the
graph…"* and *"What common analysis do both node-creation surfaces run…"*. The
evaluator-side reasoning and the observables that read the outcome live on
`strategy-recursive-self-improvement` (its one-write-surface condition, the
`distinct find-or-recur write surfaces equals 1` reading, and the
no-superseded-node-advances reading added to its `success_signal.observable` in
the third round).

## The two surfaces, and why this one has more callers than measured below

The author ruled 2026-08-14 that exactly **two** write surfaces create nodes, and
that the seam is **by kind**:

1. **The `/align` interview record** — the only way a *persistent-layer* node
   (virtue, strategy, delegation, tradition) enters the graph.
2. **This surface** — the only way a *tactic* enters, whoever the caller is.

`/align-tactics` was named explicitly by the author as a **caller** of this
surface, not a third surface: a decomposition that creates nodes creates them
through here. So the caller set is strictly larger than the table below measured:
**`/align` Step 4** (interview byproducts) and **`/align-tactics` decomposition**
both join it, and *neither is among the five private writers*, so neither is
served by the merge as previously scoped. Both currently call `write-node.ts`
directly with no find-before-minting step at all — `.claude/skills/align/SKILL.md`
Step 4 contains no dedup instruction, and `/align`'s only duplicate check
(Step 1.2) greps **strategy statements** and never reaches the tactic set.

## Measured state at record time

Seven skills call **five** distinct private writers, all under
`.claude/skills/dispatch-propagate/scripts/`:

| writer | keyed by | callers |
|---|---|---|
| `dispatch-eval-finding` | model similarity judgment over `--list`, slug-addressed | `/rsi`, `/rsi-audit`, `/dispatch-ladder` |
| `dispatch-invalid-state-followup` | `sha256(cause-slug)` → `tactic-invalid-state-rc-<8 hex>` | `/dispatch-invalid-state` |
| `dispatch-security-followup` + `dispatch-followup-exists` | stable identifier in a GitHub issue title | `/review-fix` |
| `dispatch-qa-needs-main-followup` | `qa-needs-main #<N>: <key>` in a GitHub issue title | `/qa-fix`, `/qa-main` |
| `dispatch-fleet-alarm` | a closed enum of eight fault kinds | fleet sweeps |

The **retired** `/file-issue` is still cited as a caller of
`dispatch-followup-exists`.

`dispatch-invalid-state-followup`'s hashed namespace is the exact shape the
same-day find-before-minting ruling forbids: a mint-or-reuse decision scoped to
an id prefix, so a duplicate minted outside it is structurally invisible to the
search meant to catch it.

## What the merged surface must do — check one, duplicate and merge

1. **Optional deterministic key.** A caller with a stable machine key passes it —
   an invalid-state cause slug, a CI failure signature, a CodeQL rule id, an npm
   advisory id — and is addressed by it. This is not a convenience: it is what
   `dispatch-invalid-state-followup`'s header argues for explicitly, so that one
   lane defect stranding three nodes converges on one follow-up carrying three
   occurrences rather than three near-identical nodes nobody triages.
2. **Whole-graph similarity search, always.** It runs in every case, key or no
   key, over the open tactic set — never scoped to an id prefix or to a class
   attribute. This is the rule `strategy-graph-native-dispatch` fixes.
3. **Disagreement is a finding.** When the key says "new" and the search says
   "this already exists elsewhere", record that as a finding rather than
   resolving it silently. *Owned limit:* that this is a useful signal rather than
   noise is untested — measure its rate before treating it as one.
4. **Preserve what the existing writers already got right.** Resumption of a
   retired entry rather than re-minting (so a recurrence after retirement does
   not restart the count at 1); the `attributes.measured_impact` prune exemption;
   refusal rather than laundering on a credential-shaped string or a GitHub
   closing keyword next to a `#N`; the `skipped-in-flight` refusal when a node's
   `execution` is non-null; and the pace exemption, which
   `strategy-recursive-self-improvement`'s first condition already ruled follows
   the *write*, not the rsi namespace.
5. **Per-skill prose reduces to naming the call.** No producer restates the
   discipline. A restatement is not compliance. This now includes
   `.claude/skills/align/SKILL.md` Step 4, `.claude/skills/align-tactics/SKILL.md`
   (whose greenfield-relevance-gate prose at `:322` is the *only* surviving copy
   of the supersession check), and `strategy-discovered-requirements`' body role 4
   ("deduped against the open tactic set before minting"), which becomes a
   pointer at this surface rather than a free-standing instruction.

## The supersession half — check two

**Added 2026-08-14, third round.** Both checks run on **one search pass**. The
node being created is tested not only as a *duplicate* of existing nodes but as a
**superseder** of them, so the graph does not implement one strategy or tactic and
later attempt the one it supersedes. This is a **creation-time** check keyed on
the **new** node — not a corpus sweep — which bounds the blast radius to one
search per creation and is what makes it affordable here.

6. **Absorb the greenfield-relevance gate.** The gate
   (`strategy-graph-native-dispatch` clarification 26, body §Other Settled
   Mechanism) moves here from `/align-tactics` finalization. Its mechanics are
   **preserved, not replaced**: per-unit doomed drops naming the superseding node;
   "a raw draft never obsoletes live work"; only a *fully* superseded node treated
   as terminal; and doomed-surface keeps allowed only as an explicit
   interim-live-risk exception naming its expiry event.
7. **Rewrite-in-place is the first disposition.** On a supersession match, offer
   *merge the new intent into the existing node and mint nothing* before anything
   else. This is the discipline the record practised on itself three times on
   2026-08-14 — `tactic-eval-finding-ledger`, and this node twice.
   **Close-as-superseded is the backstop**, for what rewrite cannot reach: the
   existing node is non-draft (it carries live commitments a rewrite would
   silently discard), it is in flight, or its intent genuinely *dies* rather than
   evolves.
8. **Record; never close unattended.** Closing terminates recorded work, so under
   `strategy-recursive-self-improvement`'s declared-remediation-list condition a
   record-only producer may not do it — and a model similarity judgment must not
   sit on the destructive side (the record documents that judgment being wrong, on
   `tactic-eval-finding-eval-finding-list-misses-nonledger`). The surface writes:
   an **edge naming the superseding node**, on both nodes, plus an `office_hours`
   **park** on the superseded node whose recommendation is to close. The close
   itself is a **declared remediation** — an office-hours sitting, or a lane that
   declares it.
9. **Never clobber an existing park** (author ruling). `office_hours` is
   single-valued, so on an already-parked node the reason is **updated to carry
   both** the supersession *and* the original reason. The sitting must read why
   the node was parked twice; an overwrite loses the first reason.

### Two sub-points the author did not rule on

Flagged as **Claude-derived**, not author-ruled, and enrolled for ratification by
`tactic-review-supersession-derived-subpoints`:

- **In-flight nodes get the edge but no park.** This extends item 4's existing
  `skipped-in-flight` refusal rather than inventing a second in-flight rule. It
  leaves a live PR able to land work on superseded surface — which is the
  interim-live-risk exception clarification 26 already permits.
- **Only a *fully* superseded node is parked.** Partial supersession keeps
  clarification 26's per-unit doomed-drop unchanged and parks nothing.

### What is not measured

The observable on `strategy-recursive-self-improvement` reads **precision** — that
no node with an inbound supersession edge advances. It does **not** read recall: a
supersession this surface never finds is invisible to it. A second candidate
observable (supersession-parked nodes get dispositioned rather than accumulating)
was put to the author and not taken, so the **park-storm risk is unmeasured**.
Measure the park rate before trusting the queue to drain.

## Settle this before designing around it

The three **GitHub-issue-keyed** writers — `dispatch-security-followup`,
`dispatch-qa-needs-main-followup`, `dispatch-followup-exists` — key on a tracker
that is **disabled repo-wide**. They may be legacy *removals* rather than
callers to migrate. This was **not verified** in the recording round and is the
first thing to establish: if they are removals, the merged surface has three
callers to serve, not six.

`dispatch-retriage-orphaned-followups` is a *scanner*, not a writer, and is out
of scope here.

## Sibling

`tactic-eval-finding-ledger` is unchanged and still owns the retirement of
`attributes.ledger_entry` as a class marker, the `tactic-eval-finding-*`
namespace as a membership test, and the re-keying of the prune exemption to
`attributes.measured_impact`. That node removes the *primitive*; this one
supplies the single writer that replaces the five.
