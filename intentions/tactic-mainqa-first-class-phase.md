---
id: tactic-mainqa-first-class-phase
kind: tactic
statement: Migrate all 12 legacy tactic-mainqa-* placeholder nodes off the
  phase:implement + office_hours bootstrap workaround onto the now-live main-qa
  phase (office_hours left unchanged -- none reclassify to claude-eligible under
  qa-main's actual contract) and dedup the repeated migration-boilerplate
  Context text
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round, then
  reconciled 2026-07-18 during /align-tactics finalize (and corrected again
  same-day after an opus adversarial review flagged authority and consistency
  problems in the first pass): the main-qa Phase enum and the qa-main skill's
  graph node lane already shipped via tactic-main-qa-phase (PR #2859, merged
  2026-07-11) -- this tactic no longer touches schema.ts or qa-main/SKILL.md at
  all, only intentions/ data. Remaining scope is pure graph migration: the 12
  tactic-mainqa-* placeholders still carry the phase:implement + office_hours
  bootstrap workaround the enum was meant to retire.
  tactic-main-qa-triage-before-provision (the repo's other legacy
  tactic-main-qa-* id) is already phase:done and stays untouched -- no
  naming-normalization rename is needed since it's the only survivor of that
  naming and it's finished work, not a placeholder. Eligibility-split analysis
  against qa-main's actual contract (Claude-in-Chrome visual/DOM/text checks
  plus coarse 4xx/5xx + console-error corroboration only -- no Firestore
  read-count/network-payload inspection, no localhost/dev-server/emulator
  targets, no CI-log/gh access in the node lane per qa-main/SKILL.md) found zero
  of the 12 currently reclassify to claude-eligible: each needs owner
  credentials, owner hardware, a local dev server, CI-log/review-artifact
  access, or subjective before/after visual judgment outside that contract. An
  earlier draft of this finalize also proposed pruning 3 of the 12
  (deploy-smoke-retry, dispatch-daemon-restart, review-cost-finder) into their
  serving strategies' attributes.conditions as 'standing conditions.' Rejected
  on review: (a) writing a strategy's attributes.conditions autonomously is
  outside a per-node tactic-target /align-tactics session's authority --
  conditions are author-ratified via /align-strategy, and the per-node finalize
  flow explicitly forbids a tactic-target session from touching the serving
  strategy's frontmatter (SKILL.md:146-150), let alone a DIFFERENT strategy's;
  (b) the 'forceable vs unforceable' dividing line used to justify the split
  does not actually hold up against the 12 nodes' own text
  (dispatch-daemon-restart is forceable via a deliberate flake bump + rebuild,
  same as the kept deploy-auth-diagnostics); (c) pruning dispatch-daemon-restart
  would orphan a by-id cross-reference already recorded in
  strategy-autonomous-execution's own clarification 8. All 12 migrate uniformly
  this round; whether any becomes a standing strategy condition once verified is
  a future /align-strategy call, not this tactic's to make. This tactic's own
  execution is pure intentions/ data mutation -- no app code, no PR, no CI gate;
  it lands via write-node.ts + graph-commit directly, the same mechanic
  align-tactics itself uses for its writes, then self-advances phase:implement
  -> done in the same graph-commit call, since router-driven /implement
  selection does not apply to a tactic whose entire work product is graph
  mutation rather than code. Executed 2026-07-18: all 12 nodes migrated to
  phase:main-qa with office_hours unchanged, migration-boilerplate deduped per
  Unit 2, and this tactic self-advanced to phase:done in the same graph-commit
  landing all 13 nodes."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-mainqa-first-class-phase

## Context

The Phase enum used to lack `main-qa`, so migrated post-merge-verification
work wore `phase: implement` + `office_hours` as a bootstrap workaround. That
premise is now stale: `tactic-main-qa-phase` (PR #2859, merged 2026-07-11)
already added `"main-qa"` to `PHASES` in `packages/intentionsutil/src/schema.ts`
and built the `qa-main` skill's graph node lane (`.claude/skills/qa-main/SKILL.md`).
Design home for the phase semantics: `strategy-graph-native-dispatch`'s
main-qa clarification (2026-07-04) — `main-qa` sits between merge and `done`;
`pass` → `done` (prune), `broken` → an implement-chain bug tactic, `cannot-verify`
→ `office_hours`.

This tactic's remaining job is **pure `intentions/` data migration** of the 12
`tactic-mainqa-*` placeholder nodes — no `schema.ts` change, no PR, no CI gate.
It lands directly via `write-node.ts` + `graph-commit`, the same mechanism
`/align-tactics` itself uses for its own writes (`.claude/skills/align-tactics/SKILL.md`
Step 5), not via `/implement`'s normal draft-PR flow. Once landed, this tactic
self-advances `phase: implement` → `done` in the same or an immediately
following `graph-commit` call — there is no `execution.pr` to set and no CI to
wait on.

`intentions/tactic-main-qa-triage-before-provision.md` (the repo's other
legacy `tactic-main-qa-*`-named id) is already `phase: done` / `status: codified`
— finished work, not a placeholder. It is the sole survivor of that naming, so
no naming-normalization rename is needed; leave it untouched.

### Eligibility-split finding (already resolved — do not re-derive)

`qa-main`'s graph node lane verifies via Claude-in-Chrome (`navigate`,
`get_page_text`, `find`, `read_page`, `computer` for screenshots) plus coarse
error-signal corroboration only (`read_console_messages` for JS errors,
`read_network_requests` scoped to 4xx/5xx status codes — **not** counting or
inspecting individual request payloads, e.g. Firestore read volumes). It
explicitly excludes localhost/dev-server/emulator targets
(`.claude/skills/qa-main/SKILL.md`: "This is **live prod**: there is **NO**
`run-qa-server.sh`, **NO** acceptance gate, **NO** ssh tunnel, **NO**
emulator-port logic") and its node lane skips all `gh` calls except a
merge-state check (no CI-log inspection).

Checked against all 12 nodes' actual verification checklists, **none currently
reclassify to claude-eligible** — every one needs owner credentials, owner
hardware, a local dev server, CI-log/review-artifact access, or subjective
before/after visual judgment outside that contract:

| node | why it stays human-parked |
|---|---|
| `tactic-mainqa-budget-pipeline` | owner Drive mount + real bank statement + real encryption password |
| `tactic-mainqa-deploy-auth-diagnostics` | needs CI job-log inspection — outside the node lane's `gh` scope |
| `tactic-mainqa-deploy-smoke-retry` | needs `run-all-{prod,preview}-deploy-smoke.sh` / CI run results — outside the node lane's `gh` scope |
| `tactic-mainqa-dispatch-daemon-restart` | needs live host access (`systemctl --user`, daemon version) — owner hardware |
| `tactic-mainqa-ds-storybook-visual` | local Storybook dev server — explicitly out of contract |
| `tactic-mainqa-gcp-cost-alerts` | owner GCP credentials; mutates production billing/monitoring config |
| `tactic-mainqa-instance-flake-personalization` | needs the owner's real Darwin/downstream machines |
| `tactic-mainqa-landing-pageshell` | subjective before/after visual judgment, no live baseline to diff against |
| `tactic-mainqa-office-hours-snapshot` | owner machine: live `/mnt/g` mount, `gh` auth, ADC, systemd |
| `tactic-mainqa-print-app-prod` | checklist needs Firestore read-count/DevTools payload inspection beyond 4xx/5xx |
| `tactic-mainqa-review-cost-finder` | needs to observe a live review-phase run's finding disposition — not a deployed web surface |
| `tactic-mainqa-wsl-host-activation` | needs the actual WSL hardware + Windows interop |

So the "eligibility split" resolves to zero reclassifications this round —
all 12 keep their `office_hours` park, migrated only at the `phase` field. If
`qa-main`'s contract later grows (e.g. request-payload inspection, CI-log
access), the table above is the reference for what to re-examine.

### Considered and rejected: pruning some of the 12 into strategy conditions

An earlier draft of this finalize additionally proposed treating 3 of the 12
(`tactic-mainqa-deploy-smoke-retry`, `tactic-mainqa-dispatch-daemon-restart`,
`tactic-mainqa-review-cost-finder`) as "standing conditions about
already-shipped mechanisms" and pruning them into their serving strategies'
`attributes.conditions`. **Rejected on adversarial review; do not revisit
without a fresh reason:**

1. **Out of authority.** `/align-tactics`' per-node tactic-target flow is
   explicit that "a per-node tactic-target session never touches the serving
   strategy's frontmatter" (`.claude/skills/align-tactics/SKILL.md:146-150`) —
   and this would have touched a strategy that isn't even this tactic's
   `serves` target. Conditions are author-ratified via `/align-strategy`; no
   `/align-tactics` path autonomously mints one.
2. **The classification didn't hold up.** The "forceable vs. unforceable"
   line used to justify keeping `deploy-auth-diagnostics` as a tactic while
   pruning the other 3 doesn't actually separate them:
   `dispatch-daemon-restart` is just as forceable (a deliberate flake bump +
   `nixos-rebuild switch`) as `deploy-auth-diagnostics` (deliberately breaking
   credentials on a branch deploy). All 12 are one-time post-merge
   verifications, not ongoing invariants — a category error to sort some of
   them as "standing conditions."
3. **Would have orphaned a reference.** `strategy-autonomous-execution.md`'s
   own clarification 8 names `tactic-mainqa-dispatch-daemon-restart` by id as
   the tracker for that check; pruning it would have left a dangling
   cross-reference with no mechanism to catch it (`attributes`/clarification
   text isn't structurally validated).

All 12 migrate uniformly this round. Whether any of them should become a
standing strategy condition once verified at least once is a future
`/align-strategy` call on the owning strategy — not something this tactic
decides or writes.

## Units of work

### Unit 1 — Migrate all 12 nodes to `phase: main-qa`

**Scope.** For each of the following 12 ids, use `write-node.ts` to flip
`phase: implement` → `phase: main-qa`. Leave `office_hours` untouched on all
12 (see the eligibility-split finding above — none reclassify). Leave every
other frontmatter field and the body untouched — `write-node.ts`/`writeNode`
preserves an existing tactic's on-disk body verbatim on a frontmatter-only
rewrite (`packages/intentionsutil/src/store.ts`; confirmed by
`.claude/skills/qa-main/SKILL.md`'s documented behavior), so do not hand-retype
bodies:

- `tactic-mainqa-budget-pipeline`
- `tactic-mainqa-deploy-auth-diagnostics`
- `tactic-mainqa-deploy-smoke-retry`
- `tactic-mainqa-dispatch-daemon-restart`
- `tactic-mainqa-ds-storybook-visual`
- `tactic-mainqa-gcp-cost-alerts`
- `tactic-mainqa-instance-flake-personalization`
- `tactic-mainqa-landing-pageshell`
- `tactic-mainqa-office-hours-snapshot`
- `tactic-mainqa-print-app-prod`
- `tactic-mainqa-review-cost-finder`
- `tactic-mainqa-wsl-host-activation`

**Out of scope:** `intentions/tactic-main-qa-triage-before-provision.md` —
already `phase: done`, do not touch. No strategy file is touched by this
tactic at all (see "Considered and rejected," above).

**Dependencies:** run this unit's `dump-node.ts` base-manifest capture (see
Unit 3) before making any of these edits, not after.

**Reuse:** `packages/intentionsutil/scripts/write-node.ts`.

**Recommended model:** sonnet (rote per-file frontmatter flip, no design
judgment).

### Unit 2 — Dedup the repeated migration-boilerplate Context text

**Scope.** Each of the 12 nodes' body currently opens with a near-identical
paragraph of the shape "Migrated `<date>` from the legacy gh main-qa
office-hours queue during the target-state review. Source issue(s) (closed,
content preserved here): `<issue numbers>` — ...". Collapse each node's
opening paragraph to one line:

"Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase."

immediately followed by that node's own unique remaining context sentence(s)
(the specific "why this matters"/"what it depends on" prose already present —
keep this part, do not drop it) and its unchanged verification checklist.
**Do not alter the verification checklists themselves** — only collapse the
shared boilerplate lead-in. This is a body-only `Edit`, no frontmatter change,
so it does not need a separate `write-node.ts` call — fold it into the same
pass as Unit 1's per-file touch if that's more convenient in the implementing
session (Unit 1 changes frontmatter via `write-node.ts` which preserves the
body verbatim, so the body-dedup `Edit` can run either just before or just
after the `write-node.ts` call for that file — order between the two does not
matter since they touch disjoint parts of the file).

**Dependencies:** touches the same 12 files as Unit 1 — sequence after or
alongside Unit 1, not before (so there's one clear final state per file, not
two competing edits landing separately).

**Recommended model:** sonnet (mechanical text collapse per an explicit
template, no design judgment).

### Unit 3 — Land and verify

**Scope.** Capture a base manifest for every pre-existing node this round
touches — the 12 targets **plus this tactic itself** — **before Unit 1/2 make
any edits** (this is a plain read of `origin/main`, so it must run first, not
after the local edits land):

```bash
BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir /tmp/claude-$(id -u)/dump \
  tactic-mainqa-first-class-phase \
  tactic-mainqa-budget-pipeline tactic-mainqa-deploy-auth-diagnostics tactic-mainqa-deploy-smoke-retry \
  tactic-mainqa-dispatch-daemon-restart tactic-mainqa-ds-storybook-visual tactic-mainqa-gcp-cost-alerts \
  tactic-mainqa-instance-flake-personalization tactic-mainqa-landing-pageshell tactic-mainqa-office-hours-snapshot \
  tactic-mainqa-print-app-prod tactic-mainqa-review-cost-finder tactic-mainqa-wsl-host-activation)
```

Then run Unit 1 and Unit 2's edits. Once those are done, also flip this
tactic's own frontmatter `phase: implement` → `done` via `write-node.ts` (no
`execution.pr` to set — there is no PR for this tactic; it is pure graph
data). Then land everything — the 12 targets plus this tactic — in **one**
`graph-commit` call:

```bash
packages/intentionsutil/scripts/graph-commit --base "$BASE" \
  tactic-mainqa-first-class-phase \
  tactic-mainqa-budget-pipeline tactic-mainqa-deploy-auth-diagnostics tactic-mainqa-deploy-smoke-retry \
  tactic-mainqa-dispatch-daemon-restart tactic-mainqa-ds-storybook-visual tactic-mainqa-gcp-cost-alerts \
  tactic-mainqa-instance-flake-personalization tactic-mainqa-landing-pageshell tactic-mainqa-office-hours-snapshot \
  tactic-mainqa-print-app-prod tactic-mainqa-review-cost-finder tactic-mainqa-wsl-host-activation
```

Both `dump-node.ts` and `graph-commit` need `dangerouslyDisableSandbox: true`
(tsx's IPC socket and the `.bare`/worktree writes are otherwise sandbox-denied
— `.claude/rules/sandbox.md`); when disabling the sandbox, `$TMPDIR` is
**not** inherited, so use an explicit path like `/tmp/claude-$(id -u)/dump`,
never `$TMPDIR/dump` (silently resolves under `/`).

No `--prune` is used anywhere in this tactic — nothing is deleted.

**Note for whichever session executes this:** this tactic must be hand-run
(a human-invoked session, or `/implement` reinterpreted as "run these
commands"), not left for an autonomous router to select and feed through the
normal `/implement`→draft-PR flow — its entire work product is `intentions/`
data mutation, not code, so there is no unit of code for `/implement-unit` to
build and no PR for CI to gate.

**Dependencies:** the base-manifest capture (first bullet) must precede Units
1–2; the final `graph-commit` must follow both.

**Recommended model:** sonnet (mechanical: run the scripted commands above,
no design judgment).

## Reuse

- `packages/intentionsutil/scripts/dump-node.ts` — base manifest before
  rewriting any pre-existing node (mandatory per `--base` below), captured
  **before** any local edits in this round, not after.
- `packages/intentionsutil/scripts/write-node.ts` — the single validation
  gate for every frontmatter write.
- `packages/intentionsutil/scripts/graph-commit` — `--base` for every touched
  pre-existing id, one call lands the whole round atomically. No `--prune`
  needed this round.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
! grep -l "^phase: implement" intentions/tactic-mainqa-*.md
```

The last check only passes once this tactic itself (which matches the
`tactic-mainqa-*.md` glob) has also self-advanced to `done` — run it after
Unit 3's final `graph-commit`, not before.

Manual/prose checks:

- All 12 `tactic-mainqa-*` nodes show `phase: main-qa`, unchanged
  `office_hours`, and unchanged verification checklists; their body opening
  paragraph is deduped per Unit 2.
- `intentions/tactic-main-qa-triage-before-provision.md` is untouched (still
  `phase: done`).
- Neither `intentions/strategy-autonomous-execution.md` nor
  `intentions/strategy-token-economy.md` is touched by this tactic.
- This tactic itself (`tactic-mainqa-first-class-phase.md`) shows
  `phase: done` on `origin/main` after Unit 3 lands.
