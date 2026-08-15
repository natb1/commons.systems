# Pre-PR sessions for the serialized dispatch/RSI window

Companion to `plans/dispatch-rsi-serialized-pr-plan.md`. That document holds the
unit-level specs and the bundle order; this one holds the six **no-diff
sessions** — the work that produces no code but must happen before the PR it
gates.

**One session now gates the first PR** — session 0 below, added by Revision 6 of
the main plan. Two earlier candidates remain withdrawn: the node-lane parking
session (zero mergeable node-lane PRs, and no path to a non-zero set while the
sentinel holds) and the pre-pause `/rsi-audit` baselines (the ladder was not
working during that period, so a broken-before against fixed-after comparison is
confounded).

Session 0 is different in kind from the other six. They *inform* a PR; it
*settles the shape of one*. Everything else here gates Bundle 3 or Bundle 5.

---

## Summary

| # | Session | Gates | Bundle (order) | Must merge first | Run when |
|---|---|---|---|---|---|
| **0** | **`graph-ref-split` decision** | **PR1 + PR15** | **Bundle 0 (1st)** | **none — nothing may merge first** | **before Bundle 1** |
| 1 | code-review lock design | PR6 | Bundle 3 (5th) | none | any time; see the sequencing note |
| 2 | cache-preserving context | PR7 | Bundle 3 (5th) | none *in code*; Bundle 4 to clear the graph edge | during the window |
| 3 | observation masking | PR7 | Bundle 3 (5th) | none for the cost half | split — see below |
| 4 | band-derivation ratification | PR10 | Bundle 5 (6th) | none | any time |
| 5 | tradition: agentic engineering | PR11 | Bundle 5 (6th) | none | any time |
| 6 | fan-out and model routing | PR11 | Bundle 5 (6th) | none (`blocked_by: []`) | during the window |

One is a decision session (0), three are `/office-hours` sittings (1, 4, 5), and
three are measurement sessions (2, 3, 6). Only one of the six has a real merge
prerequisite, and it is weaker than it looks.

*(Bundle ordinals shifted by one in Revision 6: Bundle 1b was inserted after
Bundle 1, so Bundle 3 is now fifth and Bundle 5 sixth.)*

**`/office-hours` is read-only.** Its own description: it "reviews read-only,
reports where to engage, and stops; takes no fix/label/close/phase/graph
action." The sitting produces a disposition for the human; **completing and
unparking the node is a separate manual step** afterwards. Do not treat a
finished sitting as a cleared gate until the node is actually unparked.

---

## 0. The `graph-ref-split` decision — gates PR1 and PR15

**Node:** `tactic-graph-refsplit-blocker-audit`
**Subject node:** `tactic-graph-ref-split` — `status: codified`, **`phase:
implement`**, 37 blockers
**Must merge first:** nothing — and nothing *should*. This runs before Bundle 1.

**Why this is not an `/office-hours` sitting.** `/office-hours <node-id>` runs
the graph-native lane over a **parked** node, and
`tactic-graph-refsplit-blocker-audit` carries `office_hours: null`. Either park
it first with `park-node` to use that lane, or run it as a plain ad-hoc analysis
session with the prompt below. The second is simpler and this is an author
decision, not a review.

```
Decide the disposition of tactic-graph-ref-split before the serialized
dispatch/RSI window begins. Read both nodes first:

  intentions/tactic-graph-ref-split.md          (status: codified, phase: implement, 37 blockers)
  intentions/tactic-graph-refsplit-blocker-audit.md

The subject node moves the intention graph onto a dedicated graph-main branch
validated by the write path alone (no CI stamp), making graph-commit a
plumbing-based CAS push against origin/graph-main and replacing the
CI-stamp/scratch-branch mechanic outright.

The conflict: plans/dispatch-rsi-serialized-pr-plan.md PR1 Units 1-4 and all of
PR15 repair the very mechanic this node deletes. If it lands during or shortly
after the window, that work is aimed at a retired write path.

The audit node asks whether the 37 blockers encode real dependencies or a
quiescence requirement that never converges. A development freeze IS such a
quiescence — this window is the most favorable condition ref-split will ever
get, and simultaneously the window whose PRs it would invalidate.

Produce one of three dispositions, recorded on tactic-graph-refsplit-blocker-audit:

  (a) LAND FIRST      — ref-split goes before Bundle 1; PR1 Units 1-4 and PR15
                        are re-scoped against the CAS-push write path
  (b) DEFER           — ref-split waits past the window; the plan proceeds as
                        written and tactic-graph-refsplit-read-coherence stays
                        parked with it
  (c) BLOCKERS UNREAL — the 37 blockers do not encode real dependencies; say
                        what makes the cutover incremental rather than
                        one-sitting, and re-order the bundles accordingly

For (a) or (c), also state which of PR1's Units 5-8 survive. Those four (the
ORPHANED check-row rc collapse, the SNAP_DIR clobber, the npx-crash-as-park
misclassification, and the read-path tree resolution) are believed independent
of which ref the graph lands on — confirm or refute that, since it determines
whether PR1 has anything left to do under disposition (a).
```

**Do not let this become an implementation session.** The deliverable is a
disposition plus its consequence for PR1 and PR15, not a migration. If the answer
is (a), the ref-split implementation is its own planning exercise afterwards.

**The cost of skipping it** is not a broken window — it is doing PR1 Units 1–4
and all of PR15 twice, or discovering mid-window that the write path is being
replaced underneath the PRs that repair it.

## 1. Code-review lock design — gates PR6

**Node:** `tactic-review-sitting-code-review-lock-design`
**Must merge first:** nothing.

```
/office-hours tactic-review-sitting-code-review-lock-design
```

The most load-bearing of the six. The node was born parked by the 2026-08-13
`/align` round that raised built-in `/code-review` from `low` to `high`; the
author delegated the flock design to Claude and holds it **on trust, not on
verification**. Enrolled nodes are `strategy-token-economy` (the clarification
carrying the mechanism) and `tactic-code-review-detached-node-lock` (the carrier
that would build it).

The sitting must resolve a specific contradiction rather than bless the design:
the flock shipped in #3078, yet
`tactic-eval-finding-detached-code-review-dies-with-launcher` shows the detached
child dies with its launcher anyway despite `setsid`. **A lock held by a process
that dies with its launcher is not a lock.** Hand the sitting this framing:
should the lock be held by the detached child at all, or by a supervisor that
outlives both? If the answer is the supervisor, PR6 Unit 2 changes shape
entirely.

**Sequencing note — a genuine tension, not a resolved question.** The main plan
(R5) requires PR6's units to be ordered so detachment is fixed *and
demonstrated* (Unit 1) before the lock is trusted (Unit 2). The sitting has no
merge prerequisite and can run today. But its central question is better
answered with the detachment demonstration in hand. Two defensible readings:

- **Sitting first, strictly** — as R5 says, so PR6 does not implement a refuted
  design. Cheapest, and it is the plan's stated position.
- **Unit 1 first, then the sitting, then Unit 2** — the sitting gets evidence
  instead of argument about whether a detached child can hold anything.

Pick deliberately. The failure mode of getting it wrong is building Unit 2 on a
design the sitting would have rejected.

## 2. Cache-preserving context — gates PR7

**Node:** `tactic-dispatch-cache-preserving-context`
**Must merge first:** nothing in code. See the caveat.

```
/rsi-audit <window>

Read the hit_ratio lens (lenses.cache_efficiency.hit_ratio,
aggregate-usage.sh:1211) and record the prompt-prefix
cache baseline on tactic-dispatch-cache-preserving-context. Measure over the
ad-hoc supervised sessions of this serialized window — this metric is a property
of how sessions are constructed, not of ladder health, so it does not need fleet
data. State the window and the instrument sha on the node alongside the number.
```

**The caveat, and it cuts in your favor.** The node carries
`blocked_by: tactic-audit-cache-efficiency-lens`, which reads as "Bundle 4 must
merge first." But that blocker's deliverable **already shipped**: `hit_ratio` is
emitted at `aggregate-usage.sh:1211`. It is one of the four nodes the main plan
flags as done-in-code but open-in-graph (R2). So:

- *By the code*: the lens is live, measure now.
- *By the graph*: the edge clears when Bundle 4's verify-and-close pass sets
  `tactic-audit-cache-efficiency-lens` to `phase: done`.

Bundle 4 runs third and PR7 sits in Bundle 3 (fourth), so following the graph
strictly costs nothing — the prerequisite is satisfied by the recommended order
anyway. Measure whenever; just do not read the open edge as a missing lens.

## 3. Observation masking — gates PR7

**Node:** `tactic-dispatch-observation-masking`
**`blocked_by:`** `[]`
**Must merge first:** nothing — but the measurement splits in two.

This is the one session that cannot be fully satisfied before the PR it gates.
The node's statement is to test masking of stale verbose tool output against LLM
compaction "in dispatch phase sessions, and measure cost against disposition
quality." Those two halves have different data requirements:

| Half | Needs | Available |
|---|---|---|
| **cost** — tool-result payload, peak context, price proxy | any long session with verbose tool output | **now**, including the ad-hoc sessions of this window |
| **disposition quality** — did masking change the outcome | dispatch phase sessions with a working ladder | only after the staged resumption |

A working ladder is what Bundle 3 delivers, and PR7 is *inside* Bundle 3 — so
the quality half cannot precede the PR it gates. Do not stall Bundle 3 waiting
for it.

**Cost half — run during the window:**

```
/rsi-audit <window>

Measure the cost half of tactic-dispatch-observation-masking over this window's
sessions: payload_bytes.by_tool and payload_bytes.worst_sessions for tool-result
bytes per tool and per session (aggregate-usage.sh:1028-1047), and
lenses.context_over_120k for sessions above 120k peak context with their price
proxy (:1120-1134). All three are already shipped. Record the numbers and the
window on the node, and mark explicitly that the disposition-quality half is
outstanding.

Note: the node's own rationale calls that third lens `context_lens`. No such key
exists — the emitted key is `lenses.context_over_120k`. Fix the node's prose
while you are in it rather than hunting for a lens that was never named that.
```

**Quality half — run at the staged resumption**, when the sentinel comes off at
`max_concurrent_workers: 1` and one node walks the full ladder. That is the
first trustworthy dispatch-phase data this repo will have. Treat PR7 as shipping
against the cost half, with the quality half as a follow-up that may revise it.

## 4. Band-derivation ratification — gates PR10

**Node:** `tactic-review-band-derivation-ratification`
**Must merge first:** nothing. No code dependency.

```
/office-hours tactic-review-band-derivation-ratification
```

Born parked by the 2026-08-12 office-hours round that cleared
`tactic-attention-namespaced-rank`'s park. The author directed that the
resolution be applied using Claude's recommendation rather than derived in
dialectic, so the content is held on trust and owes one re-validation. The held
content is Claude's logical analysis of internal consistency in the rank
algebra — it has no grounding text, which is why the deferral typology makes it
a sitting rather than a reading chunk.

Re-validate the 2026-08-12 band/residual resolution across `kind-kind`,
`strategy-rsi-delegated-prioritization` and `tactic-attention-namespaced-rank`.

## 5. Tradition: agentic engineering — gates PR11

**Node:** `tactic-review-tradition-agentic-engineering`
**Must merge first:** nothing.

```
/office-hours tactic-review-tradition-agentic-engineering
```

Mode-A curriculum enrollment for `tradition-agentic-engineering`, created in the
same 2026-08-10 `/align` round as the record it enrolls. The record was created
via the immediate-record path at `status: delegated`, so three things are held
on trust from the recording interview and need an author sitting **against the
actual sources**: the adopted entry, the diverged entry, and the
already-load-bearing judgment.

## 6. Fan-out and model routing — gates PR11

**Node:** `tactic-rsi-measure-fanout-and-model-routing`
**`blocked_by:`** `[]`
**Must merge first:** nothing. The instrument already distinguishes subagent
transcripts and counts `subagents_launched` (`aggregate-usage.sh:1052-1070`), so
this needs no PR3 lens.

```
/rsi-audit <window>

Measure THIS harness's own subagent fan-out and model-routing economics and
record them on tactic-rsi-measure-fanout-and-model-routing. Measure over this
window's own sessions — fan-out and routing are properties of how the harness is
configured, not of ladder health.

The node exists to stop two external findings being imported unmeasured.
CooperBench measured agents collaborating on SHARED code degrading with agent
count (68.6% -> 46.5% -> 30.0% for 2 -> 3 -> 4), and the report flagged the open
question it could not resolve: whether that penalty generalizes to
orchestrator-plus-independent-subagent patterns or is specific to concurrent
edits on shared files. This repo fans out across separate worktrees — the
non-shared case, precisely the unresolved one. So the external number does not
transfer; measure the local one.
```

This matters for PR11 specifically: the lens catalog declares a `model:` per
lens, and setting those from unmeasured external numbers is the exact error this
node was written to prevent.

---

## Sequencing summary

```
Bundle 0  ──  session 0 IS the bundle — must precede Bundle 1
Bundle 1  ──  no sessions (its shape is set by session 0)
Bundle 1b ──  no sessions (its shape is set by session 0)
Bundle 2  ──  no sessions
Bundle 4  ──  no sessions (clears session 2's graph edge as a side effect)
Bundle 3  ──  sessions 1, 2, 3(cost half) must precede PR6 / PR7
Bundle 5  ──  sessions 4, 5, 6 must precede PR10 / PR11
Bundle 7  ──  no sessions (cold; runs just before the resumption)
staged resumption ── session 3 (quality half), as a follow-up to PR7
```

**Session 0 is the only one that blocks.** Everything else informs a PR that can
be written regardless; session 0 determines whether PR1 and PR15 are worth
writing in their current form at all. Run it first, alone, before any code.

Sessions 1, 4 and 5 have no data or merge prerequisite and can run at any point,
including now — even before session 0, since none of them touches the write
path. Running them early is free and removes them from the critical path — with
the one deliberate exception of session 1, whose ordering against PR6 Unit 1 is a
real judgment call rather than a scheduling detail.
