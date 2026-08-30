---
id: tactic-dispatch-config-untracked-pace-curve
kind: tactic
statement: dispatch.config/target-workers.json — the pace curve every scheduling
  decision reads, and today the sole gate holding the fleet at zero workers — is
  untracked AND not gitignored in the main checkout, so the fleet's throughput
  dial has no version history, no review path, and no recovery if the working
  tree is ever cleaned
owner: ai
status: raw
parent: null
rationale: "Measured 2026-08-05: `dispatch-target-workers` returns 0 — the
  weekly curve gate that paces the whole fleet to zero and which the bootstrap
  plan correctly warns must never be 'fixed' — and it resolves that value from
  dispatch.config/target-workers.json. `git status` reports that directory as
  `??` and `git check-ignore -v` reports it as NOT ignored, so it is neither
  tracked nor deliberately excluded: it is simply absent from version control by
  omission. The consequence is not theoretical. A `git clean -fd` in the main
  checkout, a fresh clone, or a re-provision would silently delete the file, and
  the fleet's throughput dial would fall back to whatever the resolver's default
  is with no signal that a deliberate operator setting had been lost — the same
  failure shape the strategy already treats as serious for graph state, applied
  to the one file that decides whether any work is dispatched at all. It also
  explains a live confusion this session: the file is invisible from the graph
  worktree, so a search for the pause/pace configuration from there finds
  nothing. CONNECTED, AND WHY THIS IS NOT A ONE-LINE FIX: the 2026-07-31
  fleet-instrument clarification records that the dispatch.config/*.json PAUSE
  FIELD named by condition 16's 2026-07-26 amendment 'does not exist in the
  repo', and that the live pause mechanism is instead the sentinel file at
  $XDG_DATA_HOME/commons-dispatch/paused. Checked 2026-08-05: that sentinel does
  not exist either, so the fleet is currently gated by target_n=0 alone and
  condition 16 still describes a mechanism that is not the live one. Any
  resolution here should reconcile with clarifications 107 and 108, which
  already put dispatch workflow configuration under XDG standards and debated
  whether the pause knob should be configurable at all. Fork to weigh at
  planning time, all three defensible: (a) TRACK it — version history and review
  for a load-bearing dial, at the cost of committing a machine-specific value
  that every checkout then inherits; (b) GITIGNORE it — make local-only explicit
  rather than accidental, keeping the current behaviour but ending the
  ambiguity; (c) MOVE it under XDG alongside the pause sentinel, which is what
  clarification 107 already points at and which would put both scheduling knobs
  in one place."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 0.04
  override: null
  rationale: >-
    Bootstrap band 2 (50/20/10 interim scale): durability of the fleet's own
    scheduling configuration — adjacent to the config-unreadable and
    worker-cap-durability work already in that band.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Born parked. The finding is mechanical and verified, but the REMEDY IS
    A DESIGN/POLICY CHOICE THE GRAPH HAS ALREADY HALF-DECIDED IN A DIFFERENT
    DIRECTION, so choosing here unilaterally would pre-empt recorded doctrine.
    Clarification 107 resolves dispatch workflow configuration toward XDG
    standards and clarification 108 debates whether the pause knob belongs in a
    config file at all; the 2026-07-31 fleet-instrument clarification then found
    that the config FIELD condition 16 names does not exist while the sentinel
    file does. Tracking target-workers.json in the repo would move a scheduling
    knob INTO the repo at the same time as that line of doctrine is moving the
    others OUT of it, and gitignoring it forecloses the XDG option by making the
    current location official. The three options also differ in who they bind: a
    tracked file is shared by every checkout, an ignored file is per-machine,
    and an XDG file is per-user — and this repo is intended to be forked, so
    which of those a downstream deployment inherits is an author call."
  since: 2026-08-05
  recommendation: "Ratify, in a one-question /align-strategy or office-hours
    sitting citing this park: does dispatch.config/target-workers.json become
    (a) tracked, (b) explicitly gitignored, or (c) relocated under XDG alongside
    the pause sentinel — and does the answer also settle condition 16, which
    still names a dispatch.config pause field that does not exist while the live
    mechanism is the sentinel file? Then clear this park and run /align-tactics
    tactic-dispatch-config-untracked-pace-curve to finalize a plan. STATE A
    FRESH SESSION NEEDS: the reader is
    .claude/skills/dispatch-propagate/scripts/dispatch-target-workers, consumed
    by graph-select-target where it sets TARGET_N (the pace/ceiling block that
    also carries the 'standalone selection is paced to zero' exit); the pause
    sentinel path and its dispatch-tick read are cited in the 2026-07-31
    fleet-instrument clarification on the serving strategy; the prior config
    doctrine is clarifications 107 and 108 there. Verify the current state
    before acting — the file may have been tracked, ignored or moved in the
    interim — with `git status --porcelain dispatch.config/` and `git
    check-ignore -v dispatch.config` from the MAIN checkout, since the directory
    is invisible from a graph worktree. Do NOT change the target_n VALUE as part
    of this work: zero is the weekly curve, a deliberate pause, and never a
    defect to fix."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# dispatch.config/target-workers.json is untracked and not gitignored, so the fleet's throughput dial has no version history or recovery


## Author ruling, 2026-08-29 — RELOCATE UNDER XDG

**Ruled (author, 2026-08-29 batch-execution sitting; recorded in
`plans/dispatch-rsi-author-rulings.md` §"Ruling 2 — `dispatch.config/target-workers.json`
relocates under XDG").**

The live, per-user `dispatch.config/target-workers.json` **relocates under XDG,
beside the pause sentinel**, following clarification 107's direction. Options (a)
tracked and (b) explicitly gitignored — the other two the 2026-08-05 park put on
the table — are **rejected**. The reason is who each binds: a tracked file is
shared by every checkout, an ignored file is per-machine, and an XDG file is
per-user. This repo is intended to be forked, and a fork must inherit **no**
scheduling knob from upstream. That is why the park called it an author call, and
it is what the ruling turns on.

**A tracked defaults TEMPLATE ships alongside it** (executor decision D6,
2026-08-30, recorded in the same file). The template carries no live values and
stays in the instance repo, so a fork gets a starting point without inheriting
this deployment's schedule. Ruling 2 governs the **live file**; the template node
governs a **template**. The two are reconcilable, not competing.

**This overturns the competing record on `tactic-dispatch-config-template`.** That
node's `## Context` at `intentions/tactic-dispatch-config-template.md:59-64` reads
*"Human-edited fleet-behavior config migrates, tracked — `target-workers.json`,
`auto-merge.json`, `epic.json` …"*. As of this ruling that sentence is corrected
in scope: **the template** migrates tracked; the **live** `target-workers.json`
does not — it goes to XDG. The other files named in that bullet are untouched by
this ruling.

**DO NOT change the `target_n` VALUE as part of this work.** Zero is the weekly
pace curve — a deliberate pause, never a defect to fix.

### State a fresh session needs

Retained from the 2026-08-05 park's recommendation, because clearing the park
destroys the field.

- The reader is `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers`,
  consumed by `graph-select-target` where it sets `TARGET_N` (the pace/ceiling
  block that also carries the "standalone selection is paced to zero" exit).
- The pause sentinel path and its `dispatch-tick` read are cited in the
  2026-07-31 fleet-instrument clarification on the serving strategy; the prior
  config doctrine is clarifications 107 and 108 there.
- **Verify the current state before acting** — the file may have been tracked,
  ignored or moved in the interim — with `git status --porcelain dispatch.config/`
  and `git check-ignore -v dispatch.config` from the **MAIN checkout**, since the
  directory is invisible from a graph worktree.
