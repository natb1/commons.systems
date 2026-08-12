# rsi-plan

> ## ⚠ HAND-AUTHORED TARGET-STATE RENDER — 2026-08-11
>
> **This revision was not produced by `render-rsi-plan.ts`.** It was written by
> hand, on 2026-08-11, from the intention store at `origin/main` (`42bb99b9`),
> to show the shape this document is *supposed* to have once the renderer
> catches up with the format contract that landed in `869ba4e4`.
>
> It exists so the next `/rsi` iteration has an explicit target to converge on.
> The renderer changes are tracked by `tactic-rsi-plan-merged-priority-table`
> and `tactic-rsi-plan-priority-render`. **The next `render-rsi-plan.ts` run
> will overwrite this file**, and until those two tactics land it will overwrite
> it with the *old* shape. That is expected; do not treat the regression as a
> defect in this revision.
>
> Every number below is derived from the live graph at `42bb99b9` — nothing is
> invented. What is hand-done is the *layout*, not the data.
>
> Normal contract, suspended for this one revision: `rsi-plan.md` is a derived
> artifact, `render-rsi-plan.ts` is its sole writer, and a hand-edited section is
> a defect (`strategy-recursive-self-improvement` condition 5;
> `strategy-rsi-plan-surface` condition 1). This revision is a deliberate,
> recorded exception, not a precedent.

## What the renderer must change to produce this file

Authoritative format contract: the clarification *"What is the shape of the
merged priority table this strategy's tactics must render?"* on
`strategy-rsi-plan-surface`. Where anything else disagrees with it, it wins.

1. **Sections 1, 2 and 3 collapse into one table** (below). Old §1's strategy
   rows become the group header rows; old §2's dispatch-delegated nodes become
   the ordinary rows; old §3's parked nodes become ordinary rows with the
   `parked` column set. Section numbers **4, 5, 6, 7 are deliberately kept** so
   the graph's many references to "section 6 (task plan)" and friends still
   resolve.
2. **Tier is the outer key**, descending, because `selectGraphTargets`
   (`packages/intentionsutil/src/router.ts`) sorts on the *lifted* `(tier, rank)`
   pair. Inside a tier band, rows are grouped by parent strategy with groups
   sorted by resolved rank descending. Rows are never grouped by phase.
3. **Group header rows carry the full strategy lineage**, walked up `parent` to
   the root, plus that strategy's own ETA.
4. **Two independent columns**, `delegated` (`owner: ai`) and `parked`
   (`office_hours` non-null). Measured here: 143 of the 388 unfinished tactic
   rows are parked and **54 of those are `owner: ai`**, so a single combined lane
   column would hide one fact on 54 rows. The parked cell carries the blocking
   answer inline rather than spending a fourth column.
5. **ETAs are derived at render time, never stored.** Velocity is the dispatch
   queue's 28-day closure rate; a tactic row's ETA is `today + position ÷
   velocity`, a strategy header's is `today + open-child count ÷ velocity`.
6. **Section 6 gains a `type` column and a `reasoning` column** (replacing
   `state`), and its `cost` column shows the *derived* cost — see §6.

Two things this render found that the renderer implementation still has to
settle, and which the graph does not currently decide:

- **Row set.** Old §2 listed only phase-set (`open`) tactics, so `draft`
  tactics — including `tactic-rsi-plan-merged-priority-table` and
  `tactic-rsi-plan-priority-render` themselves — would never appear. This render
  includes **every non-`done` tactic** (`open` + `born-parked` + `draft`, 388
  rows), because the router selects drafts for planning and because an ETA that
  ignores undrafted work understates drain time. If that is wrong, the merged
  table's row-set rule needs recording on `strategy-rsi-plan-surface`.
- **Strategy-header ETA vs. its own rows.** The contract derives a header's ETA
  from its *open* (phase-set) child count, while the rows beneath it include
  drafts. The two therefore disagree — `strategy-rsi-plan-surface` heads a group
  whose ETA (1 open child) is earlier than every row in it. Either the header
  count widens to match the row set, or the disagreement is recorded as
  intended.

**Ranking provenance for this render.** The row order below reflects
`42bb99b9`, which compressed the authored `attention.boost` magnitude on 42
open tactics onto a `0.01`-per-level ladder so a tactic boost can no longer lift
a node out of its parent strategy's band. That is a **stopgap**: the bound it
enforces is doctrine-only today, because `resolveAttention`'s authored term is
still a flat additive sum. Making it structural — ordering by
`(tier, band, residual)` — is tracked at `tactic-attention-namespaced-rank`
(row 9 below). Two rows still cross their band on inherited value alone, with no
boost to compress, and no boost edit can reach them:
`tactic-dispatch-skill-standards-extraction` (row 12, value 11.33 in band 7) and
`tactic-office-hours-graph-type-passthrough` (row 21, value 8.5 in band 6.33).
Both serve several strategies, and `resolveAttention` sums the authored
contributions of every distributor where the recorded doctrine says take the
maximum. They are visible in the table as rows that sort above their own group's
lead — the clearest reason to land `tactic-attention-namespaced-rank`.

## 1–3. Priorities — merged table

*(Was: §1 top author priorities, §2 dispatch queue, §3 office-hours parked
nodes. Merged per `strategy-rsi-plan-surface`; implementation split across
`tactic-rsi-plan-merged-priority-table` and `tactic-rsi-plan-priority-render`.)*

**dispatch queue summary** (drafted 2026-08-11, source of truth `strategy-graph-native-dispatch`):

Paused (`dispatch_pause_state` reads `paused`) and static: origin/main advanced by exactly one commit since yesterday's render (0f2e1412 to 65d8952d, the rsi iteration itself), and the phase table is byte-identical to it — 12 implement, 13 qa, 18 main-qa, 3 review. Backlog is 58/236 = 24.6%, inside the recorded 35% band and non-increasing across the 28d series (47.6% then 38.2% then 31.4% then 24.6%) — but at this sample the band is measuring a queue that is not moving rather than one that is draining. The mass stays in verification: 31 of the 46 phase-set nodes sit in qa or main-qa against 12 in implement, so the binding constraint on resume is downstream of selection, not at it. Review holds three — tactic-graph-commit-landing-signal-unreliable, tactic-reap-safety-behind-branch-false-positive, tactic-wait-calendar-release. Resume remains gated on the recorded criteria, re-measured at the time of the decision.

**office-hours queue summary** (drafted 2026-08-11, source of truth `strategy-attention-surface`):

Unchanged from 2026-08-10: 156 parked, 6 rank-lifted from work they block, 16 live nodes held by a blocked_by edge onto a park — nothing cleared and nothing added, with dispatch paused and no office-hours session run in between. Two holds are unclaimed past 2.6 days with no autonomous re-attempt path (`list-unclaimed-hold-alerts`): tactic-hold-conflict-autonomous-ci-pending-liveness-bound (provision-conflict) and tactic-hold-fix-cap-qa-fix-node-terminal-declaration (fix-attempt-cap), both at rank 25.3 and parked 2026-08-09; a third, tactic-hold-conflict-scope-fingerprint-plan-substance, sits unlifted at 5.3. Rank alone does not order this queue: the highest-ranked park, tactic-drain-disposition-diagnosis-cas at 90.3 since 2026-07-28, blocks nothing, while the lifted set that does release named work all ranks below it. Measured office-hours spend over the 7d window is 4.2% of price proxy against dispatch's 69.6%.

*(Both summaries are carried verbatim from `attributes.queue_summary` on their
owning strategies, as the render contract requires. They were drafted before
`42bb99b9` and quote the pre-compression rank magnitudes — 90.3, 25.3, 5.3 —
which no longer exist. The next `/rsi-plan` pass redrafts them.)*

**Backlog band:** 24.9% (61/245 tactics serving `strategy-graph-native-dispatch`;
recorded threshold 35% and non-increasing).

**Velocity:** 8.14 closures/day — 228 `owner: ai` tactics closed over the
trailing 28 days, measured the same way the token-economy sensor measures it
(`+phase: done` transitions plus deleted `owner: ai` node files across
`intentions/` git history). Every ETA below is `2026-08-11 + position ÷ 8.14`,
rounded to the day. A zero velocity would render as *unavailable*, never as
today.

Reading order is execution order: the ETA column counts monotonically down the
page, which is the property that makes the table worth reading.

| node | phase | delegated | parked | est. delivery |
|---|---|---|---|---|
| **Tier 3 · strategy-owned-orchestration › strategy-autonomous-execution › strategy-main-health** | | | | **2026-08-11** |
| _resolved rank 1.00 · open children (all tiers): 0 · rows in this band: 1_ | | | | |
| 1. `tactic-nix-wezterm-pin-nightly-drift`<br/>Main Nix Validate is permanently red because nix/home/wezterm-pin.nix pins a hash for a NIGHTLY artifact repu… | `— (born-parked)` | delegated | parked — since 2026-08-09 | 2026-08-11 |
| **Tier 2 · strategy-explicit-intent › strategy-graph-drives-dispatch › strategy-graph-native-dispatch** | | | | **2026-08-17** |
| _resolved rank 6.33 · open children (all tiers): 49 · rows in this band: 1_ | | | | |
| 2. `tactic-review-fix-residue-death-coverage`<br/>review-fix residue phase: surface/file Lane-A residue when the disposition agent dies | `main-qa` | delegated | parked — since 2026-08-03 | 2026-08-11 |
| **Tier 2 · strategy-explicit-intent › strategy-attention-surface** | | | | **2026-08-12** |
| _resolved rank 4.17 · open children (all tiers): 11 · rows in this band: 1_ | | | | |
| 3. `tactic-office-hours-snapshot-wire-contract`<br/>office-hours snapshot: extract a shared producer/reader wire-contract and fix the three breaks (GraphQL comme… | `review` | delegated | parked (blocks other priorities) — since 2026-08-03 | 2026-08-11 |
| **Tier 2 · strategy-owned-web-platform** | | | | **2026-08-11** |
| _resolved rank 1.00 · open children (all tiers): 4 · rows in this band: 1_ | | | | |
| 4. `tactic-prerender-single-injection-path`<br/>Collapse the blog prerender to the PageShell single-root injection path, retiring the legacy regex/string inj… | `qa` | delegated | parked — since 2026-08-03 | 2026-08-11 |
| **Tier 2 · strategy-promote-progressive-detachment** | | | | **2026-08-11** |
| _resolved rank 1.00 · open children (all tiers): 1 · rows in this band: 1_ | | | | |
| 5. `tactic-analytics-preinit-vitals`<br/>analyticsutil: deliver web-vitals and the first page_view for sessions torn down before firebase analytics in… | `— (born-parked)` | delegated | parked — since 2026-08-03 | 2026-08-12 |
| **Tier 1 · strategy-owned-orchestration › strategy-autonomous-execution › strategy-recursive-self-improvement › strategy-rsi-plan-surface** | | | | **2026-08-11** |
| _resolved rank 9.00 · open children (all tiers): 1 · rows in this band: 3_ | | | | |
| 6. `tactic-rsi-plan-merged-priority-table`<br/>Merge rsi-plan.md's author-priorities, dispatch-queue, and office-hours sections into one tier-banded table g… | `— (draft)` | delegated |  | 2026-08-12 |
| 7. `tactic-rsi-plan-priority-render`<br/>Rework rsi-plan.md rendering — priority-ordered node listing with parent/phase/ETA columns, velocity-derived … | `— (draft)` | delegated |  | 2026-08-12 |
| 8. `tactic-rsi-plan-render-pause-block`<br/>Render the dispatch pause and its resume criteria into rsi-plan.md from attributes.pause, so the pause state … | `implement` | delegated |  | 2026-08-12 |
| **Tier 1 · strategy-owned-orchestration › strategy-autonomous-execution › strategy-recursive-self-improvement › strategy-rsi-delegated-prioritization** | | | | **2026-08-11** |
| _resolved rank 8.50 · open children (all tiers): 0 · rows in this band: 3_ | | | | |
| 9. `tactic-attention-namespaced-rank`<br/>Make namespaced rank structural — order by (tier, band, residual) with an authored attention.scope stamp, so … | `— (draft)` | delegated |  | 2026-08-12 |
| 10. `tactic-priority-provenance-schema`<br/>Document and validate the delegated-priority machinery — attributes.priority_log and attributes.rsi_task on k… | `— (draft)` | delegated |  | 2026-08-12 |
| 11. `tactic-rsi-evaluate-skill`<br/>Build the /rsi-evaluate skill — the delegated evaluation and reprioritization subagent of the rsi loop | `— (draft)` | delegated |  | 2026-08-12 |
| **Tier 1 · strategy-owned-orchestration › strategy-autonomous-execution › strategy-recursive-self-improvement** | | | | **2026-08-11** |
| _resolved rank 7.00 · open children (all tiers): 1 · rows in this band: 9_ | | | | |
| 12. `tactic-dispatch-skill-standards-extraction`<br/>Rename the dispatch skill family for uniform /dispatch-* naming — /align-tactics to /dispatch-plan, /qa-fix t… | `— (draft)` | delegated |  | 2026-08-12 |
| 13. `tactic-review-tradition-agentic-engineering`<br/>Office-hours review sitting: verify tradition-agentic-engineering — the already-load-bearing claim, the initi… | `— (born-parked)` |  | parked — since 2026-08-10 | 2026-08-13 |
| 14. `tactic-dispatch-cache-preserving-context`<br/>Make dispatch session context append-only where the prompt prefix is under harness control, and measure the K… | `— (draft)` | delegated |  | 2026-08-13 |
| 15. `tactic-dispatch-observation-masking`<br/>Test observation masking of stale verbose tool output against LLM compaction in dispatch phase sessions, and … | `— (draft)` | delegated |  | 2026-08-13 |
| 16. `tactic-rsi-external-acceptance-gate`<br/>Gate rsi's own harness changes on an acceptance signal outside rsi's control, and record the rate at which se… | `— (draft)` | delegated |  | 2026-08-13 |
| 17. `tactic-rsi-implement-acceleration-review`<br/>Give the rsi skill a mechanism for the acceleration review every rsi-implement task now owes — a closing step… | `implement` | delegated |  | 2026-08-13 |
| 18. `tactic-rsi-lane-token-attribution`<br/>Make rsi-family and research-lane session spend attributable in dispatch-token-audit, so the strategy's per-w… | `— (draft)` | delegated |  | 2026-08-13 |
| 19. `tactic-rsi-measure-fanout-and-model-routing`<br/>Measure this harness's own subagent fan-out and model-routing economics before importing either external find… | `— (draft)` | delegated |  | 2026-08-13 |
| 20. `tactic-rsi-research-skill`<br/>Build the /rsi-research skill and its weekly harness-cron schedule — the scheduled /deep-research sensor lane… | `— (draft)` | delegated |  | 2026-08-13 |
| **Tier 1 · strategy-explicit-intent › strategy-graph-drives-dispatch › strategy-graph-native-dispatch** | | | | **2026-08-17** |
| _resolved rank 6.33 · open children (all tiers): 49 · rows in this band: 163_ | | | | |
| 21. `tactic-office-hours-graph-type-passthrough`<br/>Plumb --type <session-type> through the office-hours-graph entry point so the session-type filter is reachabl… | `— (born-parked)` | delegated | parked — since 2026-08-04 | 2026-08-14 |
| 22. `tactic-lane-instrument-substitution-guard`<br/>Fail a dispatch lane that cannot invoke its named instrument, instead of letting the agent substitute itself … | `main-qa` | delegated | parked — since 2026-07-31 | 2026-08-14 |
| 23. `tactic-demote-node-stale-local-read`<br/>Make graph-script repo-root resolution uniform and explicit — today demote-node-to-implement and dump-node.ts… | `— (draft)` | delegated |  | 2026-08-14 |
| 24. `tactic-graph-auto-merge-up-to-date-gate`<br/>graph-auto-merge merges only a PR whose branch is current with origin/main and whose passing checks ran on th… | `implement` | delegated |  | 2026-08-14 |
| 25. `tactic-graph-tick-node-lane-auto-merge`<br/>Tick reconciler owns a single label-free, CI-validated auto-merge of a reviewed node-lane PR, keyed off the n… | `main-qa` | delegated | parked (blocks dispatch) — since 2026-08-05 | 2026-08-14 |
| 26. `tactic-hold-conflict-scope-fingerprint-plan-substance`<br/>hold: provision-conflict on `tactic-scope-fingerprint-plan-substance` — a tracked hold blocking the source un… | `— (born-parked)` | delegated | parked (blocks dispatch) — since 2026-08-09 | 2026-08-14 |
| 27. `tactic-node-merge-list-removal-loss`<br/>graph-commit's layer-2 field-level merge cannot express a REMOVAL: the base-free list union silently restores… | `implement` | delegated | parked — since 2026-07-31 | 2026-08-14 |
| 28. `tactic-phase-evidence-fingerprint-bound`<br/>Bind phase-completion evidence (phase-log entry, qa-done marker, QA PR comment) to the scope fingerprint it w… | `qa` | delegated |  | 2026-08-14 |
| 29. `tactic-phase-terminal-requires-disposition`<br/>A phase skill that terminates on a needs-human judgment item must land an office_hours park before exiting — … | `main-qa` | delegated | parked — since 2026-08-05 | 2026-08-15 |
| 30. `tactic-qa-main-park-base-cas`<br/>/qa-main's cannot-verify Stop-hook park calls park-node with no --base CAS, so an in-flight qa-main session c… | `qa` | delegated | parked — since 2026-07-31 | 2026-08-15 |
| 31. `tactic-reap-session-worktree-classification`<br/>Classify a reap candidate as having-a-node-worktree versus running-at-the-repo-root before the sweep resolves… | `— (draft)` | delegated |  | 2026-08-15 |
| 32. `tactic-scope-fingerprint-plan-substance`<br/>Scope tacticScopeFingerprint to PLAN SUBSTANCE only, excluding machinery-appended body sections, so no machin… | `qa` | delegated |  | 2026-08-15 |
| 33. `tactic-autonomous-ci-pending-liveness-bound`<br/>Bound pending CI on the autonomous dispatch path — a node whose checks never start or whose run is cancelled … | `qa` | delegated |  | 2026-08-15 |
| 34. `tactic-blocked-session-invisible-to-census`<br/>The reap/health census classifies sessions on `state: done` alone, so a session in any other non-`working` st… | `qa` | delegated |  | 2026-08-15 |
| 35. `tactic-claim-containment-durable-anchor`<br/>Anchor a claimed node's freeze in durable state rather than the daemon-backed session registry, so a registry… | `— (draft)` | delegated |  | 2026-08-15 |
| 36. `tactic-conflict-lane-exit11-retry-bound`<br/>Bound the exit-11 conflict-lane kicks: a Lane 3 dispatch-conflict session that stops without declaring a term… | `qa` | delegated | parked — since 2026-08-03 | 2026-08-15 |
| 37. `tactic-conflict-outranks-ci-precedence`<br/>Make the normal selection path check mergeable BEFORE writing execution.fix, so a CONFLICTING-and-red node ro… | `main-qa` | delegated | parked — since 2026-08-03 | 2026-08-16 |
| 38. `tactic-dispatch-config-untracked-pace-curve`<br/>dispatch.config/target-workers.json — the pace curve every scheduling decision reads, and today the sole gate… | `— (born-parked)` | delegated | parked — since 2026-08-05 | 2026-08-16 |
| 39. `tactic-graph-execute-fresh-main-read`<br/>The node-selection gate must perform its own origin/main freshness read so every caller inherits it -- today … | `qa` | delegated |  | 2026-08-16 |
| 40. `tactic-hold-conflict-autonomous-ci-pending-liveness-bound`<br/>hold: provision-conflict on `tactic-autonomous-ci-pending-liveness-bound` — a tracked hold blocking the sourc… | `— (born-parked)` | delegated | parked (blocks dispatch) — since 2026-08-09 | 2026-08-16 |

> **This table is truncated.** It shows rows **1–40 of 388** unfinished tactics,
> and **8 of 48** strategy group headers. The cut falls *inside* the tier-1
> `strategy-explicit-intent › strategy-graph-drives-dispatch ›
> strategy-graph-native-dispatch` group, after 20 of that group's 163 rows —
> so 143 further rows of the highest-volume group, and 40 entire strategy
> groups, are below the cut and not shown. The last row of the full table
> (position 388) would carry an estimated delivery of **2026-09-28**.
>
> The cut is a readability cap chosen for this hand render, not a property of
> the contract. The renderer must state its own cut the same way: a silent
> truncation reads as "this is everything" when it is not. The full ordering is
> `npx tsx packages/intentionsutil/scripts/frontier-view.ts`; the full parked
> queue is `npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list`.

**Queue counts.** 388 unfinished tactics across 48 strategy groups: 1 at tier 3,
4 at tier 2, 383 at tier 1. By owner, 293 are delegated (`owner: ai`) and 95 are
`owner: human`. 143 are parked, of which **54 are also delegated** — the
orthogonality that rules out a single combined lane column.
`office-hours-select --list` counts **157** parked *nodes*, a larger set: it also
counts 10 parked strategies and 4 parked tactics already at `phase: done`,
neither of which is a row here. Of the parked rows, 6 are rank-lifted from work
they block, and 16 live nodes are held by a `blocked_by` edge onto a park.

## 4. Metrics

Every graph signal whose `success_signal.sensor` name is REGISTERED in the
read-sensors registry (`scripts/read-sensors.ts`) — i.e. every signal that is
actually measured, with a threshold to be measured against. This is a subset of
graph signals rendered from the existing readings machinery, never a parallel
metric registry (`strategy-recursive-self-improvement` condition 8). Registering a new rsi metric
means adding a sensor there and naming it on the owning node.

**Fitness function.** rsi optimizes the value the combined dispatch +
office-hours + rsi system delivers toward author intentions — closure velocity
plus strategy signal progress, per token, attributed per workflow. Greenfield
expectation: dispatch spend significantly outpaces office-hours and rsi; a
deviation from that is itself a review trigger, not a datum to note and pass.

| node | reading | threshold | gap |
|---|---|---|---|
| `strategy-exercise-recovery-paths` | exercised: 4/22 records; 18 null last_exercised; review_trigger firing not recorded (sensor read 2026-08-10) | no record's last_exercised is null, and no fired review_trigger is left unactioned | shortfall |
| `strategy-graph-drives-dispatch` | serves: 121/121 open tactics; readings: 19/53 sensor-naming strategies (45 unregistered sensors) | every open tactic carries a non-empty serves edge and sensor-run readings exist for every strategy that names a sensor | shortfall |
| `strategy-graph-native-dispatch` | lifecycle: tactic-gap-derive-on-read implement→qa→review→done (2026-08-10); router selections: 2374 records, 281 nodes; backlog: 58/236 = 24.6% (band ≤35%); backlog series 28d: 47.6% → 38.2% → 31.4% → 24.6% (non-increas… | the owned path carries tactics through the full lifecycle continuously, and the machinery's own open defect backlog — open (phase set, not done) plus born-parked tactics serving t… | shortfall |
| `strategy-main-health` | green: every check on the current origin/main HEAD concludes success (or neutral/skipped) | green: every check on the current origin/main HEAD concludes success (or neutral/skipped) | **met** |
| `strategy-owned-web-platform` | dependency-audit: 27 runtime deps, 0 unjustified, 1 dead-upstream | zero unjustified runtime dependencies and no unreviewed dependency growth between office-hours reviews | shortfall |
| `strategy-realign-attachments` | high-divergence: 5 records; 4 covered by recovers; uncovered: delegation-communications (sensor read 2026-08-10) | every high-divergence record is covered by a recovers edge or a recorded re-alignment | shortfall |
| `strategy-recursive-self-improvement` | pause: paused; backlog: 58/236 = 24.6% (band ≤35%); parked: 156 (21 blocking); worktrees: 54; tokens 7d: dispatch 91% / office-hours 0% / rsi 0% / other 9% | dispatch runs unpaused with the recorded resume criteria held, strategy-graph-native-dispatch's own 35% non-increasing band holds, and consecutive rsi iterations complete with zer… | shortfall |
| `strategy-token-economy` | utilization: 27% weekly; tactics 28d: 310 created / 226 closed (net +84) | utilization near 100% of the weekly allowance while open claude-eligible tactics are non-increasing (closure at or above arrival); full utilization with a growing backlog fails th… | shortfall |
| `tactic-main-red-ac908454` | green: every check on the current origin/main HEAD concludes success (or neutral/skipped) | green: every check on the current origin/main HEAD concludes success (or neutral/skipped) | **met** |

**Per-workflow token attribution** (window 7d, from `aggregate-usage.sh`'s
per-skill `by_phase` buckets folded by `WORKFLOW_SKILLS`, `src/rsi.ts`).
`price_proxy_usd` holds price constant to compare token volume; `cost_usd` is
the truthful per-model bill. *Carried unchanged from the 2026-08-11 machine
render at `4d103b41` — this hand render produced no new usage aggregate, and
reporting zeros instead would be a false measured claim.*

| workflow | share | price proxy (USD) | cost (USD) | turns |
|---|---|---|---|---|
| dispatch | 69.6% | 13638.02 | 3073.92 | 45247 |
| office-hours | 4.2% | 814.94 | 336.40 | 1968 |
| rsi | 0.0% | 0.00 | 0.00 | 0 |
| other | 26.2% | 5139.78 | 1551.11 | 14018 |

## 5. Recommended additional telemetry

The graph's own record of instrumentation it wants and does not yet have:
every `tooling_goals` entry of `kind: sensor`, with its owning node. A gap
belongs here by being authored on the node that feels it — not by being
listed here.

| owning node | sensor goal |
|---|---|
| `strategy-attention-surface` | local signal adapters mapping non-versioned files (budget .benc, office-hours snapshot, pace telemetry, analytics exports) to their owning strategies' signals |
| `strategy-autonomous-execution` | a managed dispatch daemon liveness sensor that reports whether the lingering dispatch-claude-daemon.service is up and ticking unattended, distinguishing it from a transient (--origin transient) daemon spawned by an interactive claude agent… |
| `strategy-complete-grounding` | grounding gap analysis — tick-runnable: enumerate durable-layer nodes (virtue, strategy, kind, delegation) carrying neither attributes.traditions nor attributes.grounding, ranked by deference/capture exposure (delegation divergence level,… |
| `strategy-data-structure-first` | README–graph alignment guard — CI floor checking every referenced node/file exists and retired-construct terms are absent; curriculum enrollment carries the judgment layer |
| `strategy-firebase-demo-saas` | a firebase-import reachability audit distinguishing live consumers (production surface or demo) from dead code |
| `strategy-graph-drives-dispatch` | frontier-view renders the resolved ranking |
| `strategy-graph-integrity` | graph-digest.ts — token-bounded whole-graph digest: per-node summary lines plus derived check tables (tactic-graph-digest-tooling) |
| `strategy-graph-mounts` | derived-degree computation — motivation flow across each mount boundary, compared against the record's hand-assessed level, with disagreement surfaced as a review signal |
| `strategy-graph-native-dispatch` | lifecycle telemetry from the store itself — phase transition history and round counts readable from node state |
| `strategy-graph-review-curriculum` | review-coverage table in the graph digest / align-audit report — per durable-layer node: mode, review path, last reviewed (tactic-review-curriculum-coverage-sensor) |
| `strategy-graph-self-description` | CI drift guard comparing what schema.ts enforces (fields, rules, enums) against what the kind nodes declare |
| `strategy-owned-web-platform` | a dependency-justification audit over the workspace manifests — every third-party runtime dependency carries a recorded justification, with upstream liveness reported alongside |
| `strategy-philosophical-grounding` | office-hours reading-review skill — run one curriculum chunk's demonstration at office-hours as periagoge, never implantation: probe from the text before any account of Claude's appears, let the author articulate and commit first, surface… |
| `strategy-token-economy` | token-audit aggregate with node-id attribution — weekly allowance utilization plus per-node/per-phase spend and yield, joined by the intention node id (extends /dispatch-token-audit) |
| `strategy-token-economy` | velocity series — claude-eligible tactics created vs closed per strategy subtree (shared with strategy-autonomous-execution via tactic-attention-surface-velocity-pace) |
| `strategy-verified-requirements` | map-integrity validator — per-clause verification-encoding coverage and mapped-suite health, wired into CI and the read-sensors run, status derived on read (tactic-requirement-map-integrity-validator) |

## 6. RSI task plan

**rsi queue summary** (drafted 2026-08-11, source of truth `strategy-recursive-self-improvement`):

R2 landed as #3065/#3066 and both of its task nodes are now phase done — tactic-rsi-plan-skill and tactic-rsi-skill. R3, tactic-rsi-implement-skill (rsi_cost 1, the only budgeted item left), landed its code mid-iteration as #3067 (6dbdf63c): .claude/skills/rsi/scripts/rsi-advance and rsi-await with their shell tests and a unit-tests workflow entry, 6 files, +1100/-12. The node itself is not closed out — status raw, phase null, no execution record — so the graph does not yet carry the completion its merged code implies. The remaining drafts are tactic-rsi-research-skill and tactic-dispatch-skill-standards-extraction, both cost 0; tactic-review-tradition-agentic-engineering is born-parked for an office-hours sitting and is not claude-executable. rsi's own measured 7d spend renders as 0.0% because no turn in the window carried an `rsi` or `rsi-plan` attribution skill — the aggregate's largest single bucket is `<none>` at 4747.37 price proxy over 12008 turns, so the workflow split understates rsi rather than showing it spent nothing.

Every task is a graph node serving `strategy-recursive-self-improvement` — the
graph is the sole tracker, so a task that is not a node does not exist. Budget: a
session's default is 1. **Cost is derived, not declared:** an `implementation`
task always costs 1 and a declared `rsi_task.cost` on it is ignored and flagged;
every other type defaults to 0 unless the node declares
`attributes.rsi_task.cost`. The legacy standalone `attributes.rsi_cost` is
retired. Execution continues until the budget is exhausted.

The `type` and `reasoning` columns come from `attributes.rsi_task`. An
`implementation` row's reasoning must state why the task sits on the rsi plan
rather than on the dispatch queue — a bug affecting queue integrity, a bootstrap
deadlock to unblock, and so on.

| task | type | cost | phase | reasoning | statement |
|---|---|---|---|---|---|
| `tactic-dispatch-cache-preserving-context` | — *not recorded* | 0 | — | — *not recorded* | Make dispatch session context append-only where the prompt prefix is under harness control, and measure the K… |
| `tactic-dispatch-observation-masking` | — *not recorded* | 0 | — | — *not recorded* | Test observation masking of stale verbose tool output against LLM compaction in dispatch phase sessions, and… |
| `tactic-dispatch-skill-standards-extraction` | — *not recorded* | 0 | — | — *not recorded* | Rename the dispatch skill family for uniform /dispatch-* naming — /align-tactics to /dispatch-plan, /qa-fix t… |
| `tactic-review-tradition-agentic-engineering` | — *not recorded* | 0 | — (born-parked) | — *not recorded* | Office-hours review sitting: verify tradition-agentic-engineering — the already-load-bearing claim, the initi… |
| `tactic-rsi-external-acceptance-gate` | — *not recorded* | 0 | — | — *not recorded* | Gate rsi's own harness changes on an acceptance signal outside rsi's control, and record the rate at which se… |
| `tactic-rsi-implement-acceleration-review` | — *not recorded* | 0 | `implement` | — *not recorded* | Give the rsi skill a mechanism for the acceleration review every rsi-implement task now owes — a closing step… |
| `tactic-rsi-implement-skill` | — *not recorded* | 0 | `done` | — *not recorded* | Build the rsi-implement orchestration loop in /rsi — serially drive a claimed node through the existing dispa… |
| `tactic-rsi-lane-token-attribution` | — *not recorded* | 0 | — | — *not recorded* | Make rsi-family and research-lane session spend attributable in dispatch-token-audit, so the strategy's per-w… |
| `tactic-rsi-measure-fanout-and-model-routing` | — *not recorded* | 0 | — | — *not recorded* | Measure this harness's own subagent fan-out and model-routing economics before importing either external find… |
| `tactic-rsi-plan-skill` | — *not recorded* | 0 | `done` | — *not recorded* | Build the /rsi-plan rendering skill and render-rsi-plan.ts — regenerate rsi-plan.md from graph state, draft t… |
| `tactic-rsi-research-skill` | — *not recorded* | 0 | — | — *not recorded* | Build the /rsi-research skill and its weekly harness-cron schedule — the scheduled /deep-research sensor lane… |
| `tactic-rsi-skill` | — *not recorded* | 0 | `done` | — *not recorded* | Build the /rsi skill — the serialized recursive-self-improvement iteration loop |

**Flags this section raises at `42bb99b9`.** No node in the graph carries an
`attributes.rsi_task` object yet, so `type` and `reasoning` are empty on every
row and every derived cost falls to the type-less default of 0 — including
`tactic-rsi-implement-skill`, which still carries the retired standalone
`attributes.rsi_cost: 1`. Under the flag kinds
`tactic-rsi-plan-priority-render` specifies, that node raises a
*legacy-rsi-cost* flag (repoint it to `rsi_task.cost`), and every row raises a
*missing-reasoning* flag once its type is set to `implementation`. Three rows
(`tactic-rsi-implement-skill`, `tactic-rsi-plan-skill`, `tactic-rsi-skill`) are
`phase: done` and raise *task-done*: drop them and re-derive the sequence.
`tactic-review-tradition-agentic-engineering` raises *task-parked* — it is an
office-hours sitting and is not claude-executable.

### 6.1 Reprioritization delta — this iteration

What `/rsi-evaluate` moved, derived from `attributes.priority_log` entries dated
this iteration.

*No delegated reprioritization has been recorded.* No node in the graph carries
an `attributes.priority_log` yet — the schema and its lint are tracked at
`tactic-priority-provenance-schema`, the writer at `tactic-rsi-evaluate-skill`,
both drafts under `strategy-rsi-delegated-prioritization` (rows 9–11 above). This
section renders empty honestly rather than being omitted; an omitted section
cannot be distinguished from a section with nothing to report.

### 6.2 Reprioritization-outcome audit

The post-hoc fitness check the steelman mitigation names: derived at render by
joining `priority_log` entry dates with node closure dates — did nodes the model
front-loaded close faster than the queue's baseline closure interval? Derived on
read, no new stored state.

*Insufficient data.* With no `priority_log` entries in the graph there is
nothing to join, so no reprioritization has yet been audited. Baseline for the
join when data exists: the 28-day closure series measured above — 331 `owner: ai`
tactics created and 228 closed, net +103, 8.14 closures/day.

*Placement note for the renderer:* 6.1 and 6.2 are rendered here as subsections
of §6 because both are products of the same `/rsi-evaluate` pass that re-derives
the task plan. `tactic-rsi-plan-priority-render` names them as render items but
does not fix their position; if they belong beside the merged table instead, that
placement should be recorded rather than decided in code.

## 7. External operational ledgers

Records that are still load-bearing and still live outside the graph. Each
is a bootstrap carry: read it before acting on the operational layer, and
retire the entry — by deleting it from `attributes.external_ledgers` on
`strategy-recursive-self-improvement` — once the graph carries what it carries. Do not
delete the file itself while its entry stands.

- `~/.claude/plans/task-notification-task-id-bwopwgmr1-tas-lucky-parasol.md`
  — Prototype-session operating record. Still the sole carrier for the numbered operational invariants I13-I30, the graph-write and --base CAS recipes, the reap traps, and the sandbox rules — this graph carries the strategy, not the operations. Most STANDING invariants are independently held in the session memory store (I13, I16, I18, I21, I24, I25); the residue is not (I15, I22's exact form, I27, I28, I29, I30). Retire this entry once that residue lands as graph nodes or memories, and do not delete the file while the entry stands.
