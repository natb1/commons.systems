# rsi-plan

> **Generated file — do not hand-edit.** Rendered by `packages/intentionsutil/scripts/render-rsi-plan.ts` on 2026-08-11 from the intention store at `origin/main` (`4d103b41`).
>
> Single writer: the `/rsi` skill, serialized on the `strategy-recursive-self-improvement` worktree claim, direct-pushed to main (`strategy-recursive-self-improvement` condition 5). The graph is the sole tracker — every section here is derived, and a hand-edited section is a defect. To change what this file says, change the graph and re-render.

## 1. Top author priorities

Ordered by the graph's own attention resolution — effective tier first, then
composed rank (`resolveAttention`, `src/attention.ts`). No hand-ranking: to
move an item, author an `attention` boost or a tier on its node.

| # | tier | rank | strategy | open / total tactics |
|---|---|---|---|---|
| 1 | 3 | 1.0 | `strategy-main-health` — origin/main stays green: a continuously releasable trunk, red episodes self-healing throu… | 0 / 4 |
| 2 | 1 | 8.0 | `strategy-graph-review-curriculum` — The entire graph is subject to a recurring, ever-expanding office-hours review curriculum… | 0 / 0 |
| 3 | 1 | 6.3 | `strategy-graph-native-dispatch` — Dispatch runs on the graph — orchestration state lives in intention nodes, worked through… | 46 / 236 |
| 4 | 1 | 4.2 | `strategy-attention-surface` — Office hours runs on the graph — one local-first surface (status signals and goals explor… | 11 / 18 |
| 5 | 1 | 2.0 | `strategy-author-approved-copy` — Author approval gates all outward-facing copy — user-, practitioner-, collaborator-, and… | 0 / 0 |
| 6 | 1 | 1.8 | `strategy-own-audience` — Own the audience relationship — readers connect by feed and webmention, not by platform a… | 1 / 5 |
| 7 | 1 | 1.8 | `strategy-recover-attention` — Recover attention allocation with owned reading and listening tools | 0 / 1 |
| 8 | 1 | 1.8 | `strategy-recover-discovery` — Recover discovery and filtering — own what reaches the attention queue | 0 / 1 |
| 9 | 1 | 1.8 | `strategy-recover-publishing` — Publish creative work on owned infrastructure, IndieWeb-style | 0 / 4 |
| 10 | 1 | 1.7 | `strategy-recover-finance` — Recover financial visibility with owned, local-first budgeting | 1 / 5 |

## 2. Dispatch queue — delegated priorities

**dispatch queue summary** (drafted 2026-08-11, source of truth `strategy-graph-native-dispatch`):

Paused (`dispatch_pause_state` reads `paused`) and static: origin/main advanced by exactly one commit since yesterday's render (0f2e1412 to 65d8952d, the rsi iteration itself), and the phase table is byte-identical to it — 12 implement, 13 qa, 18 main-qa, 3 review. Backlog is 58/236 = 24.6%, inside the recorded 35% band and non-increasing across the 28d series (47.6% then 38.2% then 31.4% then 24.6%) — but at this sample the band is measuring a queue that is not moving rather than one that is draining. The mass stays in verification: 31 of the 46 phase-set nodes sit in qa or main-qa against 12 in implement, so the binding constraint on resume is downstream of selection, not at it. Review holds three — tactic-graph-commit-landing-signal-unreliable, tactic-reap-safety-behind-branch-false-positive, tactic-wait-calendar-release. Resume remains gated on the recorded criteria, re-measured at the time of the decision.

Backlog band: **24.6%** (58/236 tactics serving `strategy-graph-native-dispatch`; recorded threshold 35% and non-increasing).

| phase | count | nodes |
|---|---|---|
| `implement` | 12 | `tactic-dispatch-stop-backstop-comment`, `tactic-graph-auto-merge-up-to-date-gate`, `tactic-graph-ref-split`, `tactic-legacy-office-hours-entry-removal`, `tactic-node-ancestry-context`, `tactic-node-merge-list-removal-l… |
| `main-qa` | 18 | `tactic-align-tactics-mark-terminal-skipped`, `tactic-align-tactics-tactic-mode-drift-gate`, `tactic-conflict-outranks-ci-precedence`, `tactic-decision-log-append-noncompact-corruption`, `tactic-graph-auto-merge-office-… |
| `qa` | 13 | `tactic-align-session-claiming-liveness-correction`, `tactic-autonomous-ci-pending-liveness-bound`, `tactic-blocked-session-invisible-to-census`, `tactic-bounded-work-in-progress`, `tactic-census-scripted-tick`, `tactic… |
| `review` | 3 | `tactic-graph-commit-landing-signal-unreliable`, `tactic-reap-safety-behind-branch-false-positive`, `tactic-wait-calendar-release` |

## 3. Office-hours queue — parked nodes on the critical path

**office-hours queue summary** (drafted 2026-08-11, source of truth `strategy-attention-surface`):

Unchanged from 2026-08-10: 156 parked, 6 rank-lifted from work they block, 16 live nodes held by a blocked_by edge onto a park — nothing cleared and nothing added, with dispatch paused and no office-hours session run in between. Two holds are unclaimed past 2.6 days with no autonomous re-attempt path (`list-unclaimed-hold-alerts`): tactic-hold-conflict-autonomous-ci-pending-liveness-bound (provision-conflict) and tactic-hold-fix-cap-qa-fix-node-terminal-declaration (fix-attempt-cap), both at rank 25.3 and parked 2026-08-09; a third, tactic-hold-conflict-scope-fingerprint-plan-substance, sits unlifted at 5.3. Rank alone does not order this queue: the highest-ranked park, tactic-drain-disposition-diagnosis-cas at 90.3 since 2026-07-28, blocks nothing, while the lifted set that does release named work all ranks below it. Measured office-hours spend over the 7d window is 4.2% of price proxy against dispatch's 69.6%.

Canonical source: `office-hours-select.ts --list`, read at the same ref as the
rest of this render. Parked blockers are already rank-lifted from what they
block — the `blocks` column names the source a park inherited its rank from,
which is what makes it critical-path. Never hand-roll this list.

| rank | type | parked node | since | blocks |
|---|---|---|---|---|
| 55.3 | other | `tactic-graph-tick-node-lane-auto-merge` | 2026-08-05 | `tactic-graph-auto-merge-up-to-date-gate` |
| 25.3 | other | `tactic-hold-conflict-autonomous-ci-pending-liveness-bound` | 2026-08-09 | `tactic-autonomous-ci-pending-liveness-bound` |
| 25.3 | other | `tactic-hold-fix-cap-qa-fix-node-terminal-declaration` | 2026-08-09 | `tactic-qa-fix-node-terminal-declaration` |
| 17.3 | other | `tactic-hold-residue-bounded-work-in-progress` | 2026-08-10 | `tactic-bounded-work-in-progress` |
| 5.3 | other | `tactic-clarification-citation-ids` | 2026-08-10 | `tactic-graph-ref-split` |
| 5.3 | other | `tactic-delegation-classification-derivation` | 2026-08-10 | `tactic-graph-ref-split` |
| 90.3 | other | `tactic-drain-disposition-diagnosis-cas` | 2026-07-28 | — |
| 61.3 | other | `tactic-lane-instrument-substitution-guard` | 2026-07-31 | — |
| 55.3 | other | `tactic-node-merge-list-removal-loss` | 2026-07-31 | — |
| 55.3 | other | `tactic-phase-terminal-requires-disposition` | 2026-08-05 | — |
| 55.3 | other | `tactic-qa-main-park-base-cas` | 2026-07-31 | — |
| 50.0 | other | `tactic-attention-tier-ranking` | 2026-08-03 | — |
| 25.3 | other | `tactic-conflict-lane-exit11-retry-bound` | 2026-08-03 | — |
| 25.3 | other | `tactic-conflict-outranks-ci-precedence` | 2026-08-03 | — |
| 25.3 | other | `tactic-dispatch-config-untracked-pace-curve` | 2026-08-05 | — |
| 25.3 | other | `tactic-probe-unknown-never-clear` | 2026-08-05 | — |

Showing every rank-lifted park (6) and the top 10 of 150 unlifted parks by rank. The remaining **140** are not shown here — `npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list` is the full queue.

Parked total: **156**, of which **6** are rank-lifted from a blocked source. Live nodes held by a `blocked_by` edge onto a parked node: **16**.

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

**Per-workflow token attribution** (window 7d, from
`aggregate-usage.sh`'s per-skill `by_phase` buckets folded by `WORKFLOW_SKILLS`,
`src/rsi.ts`). `price_proxy_usd` holds price constant to compare token volume;
`cost_usd` is the truthful per-model bill.

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

Every task is a graph node serving `strategy-recursive-self-improvement` — the graph is the
sole tracker, so a task that is not a node does not exist. Budget: a session's
default is 1; a task costs what its `attributes.rsi_cost` says (default 0).
Execution continues until the budget is exhausted.

| task | cost | phase | state | statement |
|---|---|---|---|---|
| `tactic-dispatch-skill-standards-extraction` | 0 | — | draft | Rename the dispatch skill family for uniform /dispatch-* naming — /align-tactics to /dispatch-plan, /qa-fix t… |
| `tactic-review-tradition-agentic-engineering` | 0 | — | born-parked (parked) | Office-hours review sitting: verify tradition-agentic-engineering — the already-load-bearing claim, the initi… |
| `tactic-rsi-implement-skill` | 1 | — | draft | Build the rsi-implement orchestration loop in /rsi — serially drive a claimed node through the existing dispa… |
| `tactic-rsi-plan-skill` | 0 | done | done | Build the /rsi-plan rendering skill and render-rsi-plan.ts — regenerate rsi-plan.md from graph state, draft t… |
| `tactic-rsi-research-skill` | 0 | — | draft | Build the /rsi-research skill and its weekly harness-cron schedule — the scheduled /deep-research sensor lane… |
| `tactic-rsi-skill` | 0 | done | done | Build the /rsi skill — the serialized recursive-self-improvement iteration loop |

## 7. External operational ledgers

Records that are still load-bearing and still live outside the graph. Each
is a bootstrap carry: read it before acting on the operational layer, and
retire the entry — by deleting it from `attributes.external_ledgers` on
`strategy-recursive-self-improvement` — once the graph carries what it carries. Do not
delete the file itself while its entry stands.

- `~/.claude/plans/task-notification-task-id-bwopwgmr1-tas-lucky-parasol.md`
  — Prototype-session operating record. Still the sole carrier for the numbered operational invariants I13-I30, the graph-write and --base CAS recipes, the reap traps, and the sandbox rules — this graph carries the strategy, not the operations. Most STANDING invariants are independently held in the session memory store (I13, I16, I18, I21, I24, I25); the residue is not (I15, I22's exact form, I27, I28, I29, I30). Retire this entry once that residue lands as graph nodes or memories, and do not delete the file while the entry stands.
