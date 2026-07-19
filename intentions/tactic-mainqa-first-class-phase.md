---
id: tactic-mainqa-first-class-phase
kind: tactic
statement: "Migrate the 12 legacy tactic-mainqa-* placeholder nodes off the
  phase:implement + office_hours bootstrap workaround onto the now-live main-qa
  phase — prune the 3 that are standing conditions (no owner-forcing action
  available) into their owning strategies' attributes.conditions, migrate the
  other 9 to phase: main-qa, and dedup the repeated migration-boilerplate
  Context text"
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round, then
  reconciled 2026-07-18 during /align-tactics finalize: the main-qa Phase enum
  and the qa-main skill's graph node lane already shipped via
  tactic-main-qa-phase (PR #2859, merged 2026-07-11) -- this tactic no longer
  touches schema.ts or qa-main/SKILL.md at all, only intentions/ data. Remaining
  scope is pure graph migration: the 12 tactic-mainqa-* placeholders still carry
  the phase:implement + office_hours bootstrap workaround the enum was meant to
  retire. tactic-main-qa-triage-before-provision (the repo's other legacy
  tactic-main-qa-* id) is already phase:done and stays untouched -- no
  naming-normalization rename is needed since it's the only survivor of that
  naming and it's finished work, not a placeholder. Eligibility-split analysis
  against qa-main's actual contract (Claude-in-Chrome visual/DOM/text checks
  plus coarse 4xx/5xx + console-error corroboration only -- no Firestore
  read-count/network-payload inspection, no localhost/dev-server/emulator
  targets, no CI-log/gh access in the node lane per qa-main/SKILL.md) found zero
  of the 12 currently reclassify to claude-eligible: each needs owner
  credentials, owner hardware, a local dev server, CI-log access, or subjective
  before/after visual judgment outside that contract. 3 of the 12 are standing
  conditions about already-shipped mechanisms with no owner-forcing action
  (contrast tactic-mainqa-deploy-auth-diagnostics, which explicitly offers a way
  to deliberately trigger its event) and fold into the serving strategy's
  attributes.conditions instead of surviving as tactic nodes. This tactic's own
  execution is pure intentions/ data mutation -- no app code, no PR, no CI gate;
  it lands via write-node.ts + graph-commit directly, the same mechanic
  align-tactics itself uses for its writes, then self-advances phase:implement
  -> done in the same or an immediately following graph-commit."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
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
(`.claude/skills/qa-main/SKILL.md`: "this is live prod: there is NO
run-qa-server.sh, NO emulator-port logic") and its node lane skips all `gh`
calls except a merge-state check (no CI-log inspection).

Checked against all 12 nodes' actual verification checklists, **none currently
reclassify to claude-eligible**:

| node | why it stays human-parked |
|---|---|
| `tactic-mainqa-budget-pipeline` | owner Drive mount + real bank statement + real encryption password |
| `tactic-mainqa-deploy-auth-diagnostics` | needs CI job-log inspection — outside the node lane's `gh` scope |
| `tactic-mainqa-ds-storybook-visual` | local Storybook dev server — explicitly out of contract |
| `tactic-mainqa-gcp-cost-alerts` | owner GCP credentials; mutates production billing/monitoring config |
| `tactic-mainqa-instance-flake-personalization` | needs the owner's real Darwin/downstream machines |
| `tactic-mainqa-landing-pageshell` | subjective before/after visual judgment, no live baseline to diff against |
| `tactic-mainqa-office-hours-snapshot` | owner machine: live `/mnt/g` mount, `gh` auth, ADC, systemd |
| `tactic-mainqa-print-app-prod` | checklist needs Firestore read-count/DevTools payload inspection beyond 4xx/5xx |
| `tactic-mainqa-wsl-host-activation` | needs the actual WSL hardware + Windows interop |

So the "eligibility split" resolves to zero reclassifications this round —
all 9 surviving nodes keep their `office_hours` park, migrated only at the
`phase` field. If `qa-main`'s contract later grows (e.g. request-payload
inspection, CI-log access), the table above is the reference for what to
re-examine.

### Standing-condition classification (already resolved — do not re-derive)

3 of the 12 describe a passive "wait for a future event, then observe" check
with **no owner-forcing action available** — contrast
`tactic-mainqa-deploy-auth-diagnostics`, which explicitly offers "one can be
caused by deliberately using invalid credentials in a branch deploy" (an
actionable one-off path, so it is migrated, not pruned — see Unit 2). These 3
are standing invariants about already-shipped mechanisms, not one-off
completable tasks, and belong in the serving strategy's `attributes.conditions`
(free-form `string[]`, no schema constraint — `packages/intentionsutil/src/schema.ts`
`validateAttributes`) instead of surviving as tactic nodes:

- `tactic-mainqa-deploy-smoke-retry` (serves `strategy-autonomous-execution`) —
  reason text is explicitly "passive observation, no setup."
- `tactic-mainqa-dispatch-daemon-restart` (serves `strategy-autonomous-execution`) —
  no forcing mechanism offered; overlaps the strategy's existing daemon-lingering
  condition.
- `tactic-mainqa-review-cost-finder` (serves `strategy-token-economy`) —
  reason text is explicitly "passive observation of a future live review run."

## Units of work

### Unit 1 — Prune the 3 standing-condition nodes into strategy conditions

**Scope.** Delete these 3 files from disk (no edit, straight removal —
`graph-commit --prune` requires the file already absent on disk and present in
`HEAD`, `packages/intentionsutil/scripts/graph-commit:37-39,611-620`):

- `intentions/tactic-mainqa-deploy-smoke-retry.md`
- `intentions/tactic-mainqa-dispatch-daemon-restart.md`
- `intentions/tactic-mainqa-review-cost-finder.md`

Append one `attributes.conditions` entry per pruned node, matching the
existing plain-prose-string list style, via `write-node.ts` (attributes-only
rewrite — body/other fields unchanged):

`intentions/strategy-autonomous-execution.md` — append 2 entries to the
existing `attributes.conditions` list (after the existing daemon-lingering
entry):
1. "the aggregate deploy smoke runners' 503-propagation retry gate absorbs
   transient errors on real prod/preview Firebase Hosting deploys (folded
   from tactic-mainqa-deploy-smoke-retry, pruned `<today's date,
   date -u +%Y-%m-%d>`; re-check via `run-all-prod-deploy-smoke.sh` /
   `run-all-preview-deploy-smoke.sh` passing clean on the next real deploy)"
2. "dispatch-claude-daemon restarts onto the new claude-code store path on a
   flake bump (no manual `systemctl --user restart` needed) and does not
   restart gratuitously on unrelated home-manager activations (folded from
   tactic-mainqa-dispatch-daemon-restart, pruned `<same date>`)"

`intentions/strategy-token-economy.md` — append 1 entry to the existing
`attributes.conditions` list:
3. "the review-phase runtime-cost finder fires on a diff containing an
   unbounded Firestore scan and routes the finding to a non-blocking
   deferral, not a hard Required (folded from tactic-mainqa-review-cost-finder,
   pruned `<same date>`)"

Use the real date from `date -u +%Y-%m-%d`, never a hand-guessed one.

**Out of scope:** do not touch any other field on either strategy (`rounds`,
`clarifications`, etc.) — this is an `attributes.conditions`-only append.

**Dependencies:** none.

**Reuse:** `packages/intentionsutil/scripts/dump-node.ts` (base manifest before
rewriting the 2 pre-existing strategies), `packages/intentionsutil/scripts/write-node.ts`,
`graph-commit --prune`.

**Recommended model:** sonnet (mechanical: delete + append to an existing list,
no design judgment — the classification and exact wording are already decided
above).

### Unit 2 — Migrate the 9 surviving nodes to `phase: main-qa`

**Scope.** For each of the following 9 ids, use `write-node.ts` to flip
`phase: implement` → `phase: main-qa`. Leave `office_hours` untouched on all 9
(see the eligibility-split finding above — none reclassify). Leave every
other frontmatter field and the body untouched — `write-node.ts`/`writeNode`
preserves an existing tactic's on-disk body verbatim on a frontmatter-only
rewrite (`packages/intentionsutil/src/store.ts`; confirmed by
`.claude/skills/qa-main/SKILL.md`'s documented behavior), so do not hand-retype
bodies:

- `tactic-mainqa-budget-pipeline`
- `tactic-mainqa-deploy-auth-diagnostics`
- `tactic-mainqa-ds-storybook-visual`
- `tactic-mainqa-gcp-cost-alerts`
- `tactic-mainqa-instance-flake-personalization`
- `tactic-mainqa-landing-pageshell`
- `tactic-mainqa-office-hours-snapshot`
- `tactic-mainqa-print-app-prod`
- `tactic-mainqa-wsl-host-activation`

**Out of scope:** `intentions/tactic-main-qa-triage-before-provision.md` —
already `phase: done`, do not touch.

**Dependencies:** none (disjoint files from Unit 1).

**Reuse:** `packages/intentionsutil/scripts/dump-node.ts`,
`packages/intentionsutil/scripts/write-node.ts`.

**Recommended model:** sonnet (rote per-file frontmatter flip, no design
judgment).

### Unit 3 — Dedup the repeated migration-boilerplate Context text

**Scope.** Each of the 9 surviving nodes' body currently opens with a
near-identical paragraph of the shape "Migrated `<date>` from the legacy gh
main-qa office-hours queue during the target-state review. Source issue(s)
(closed, content preserved here): `<issue numbers>` — ...". Collapse each
node's opening paragraph to one line:

"Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase."

immediately followed by that node's own unique remaining context sentence(s)
(the specific "why this matters"/"what it depends on" prose already present —
keep this part, do not drop it) and its unchanged verification checklist.
**Do not alter the verification checklists themselves** — only collapse the
shared boilerplate lead-in. This is a body-only `Edit`, no frontmatter change,
so it does not need a separate `write-node.ts` call — fold it into the same
`Edit` pass as Unit 2's per-file touch if that's more convenient in the
implementing session (Unit 2 changes frontmatter via `write-node.ts` which
preserves the body verbatim, so the body-dedup `Edit` can run either just
before or just after the `write-node.ts` call for that file — order between
the two does not matter since they touch disjoint parts of the file).

**Dependencies:** touches the same 9 files as Unit 2 — sequence after or
alongside Unit 2, not before (so there's one clear final state per file, not
two competing edits landing separately).

**Recommended model:** sonnet (mechanical text collapse per an explicit
template, no design judgment).

### Unit 4 — Land and verify

**Scope.** Capture a base manifest for every pre-existing node this round
touches (all of them — this round only edits/prunes existing nodes, it
creates none), then land everything in one `graph-commit` call:

```bash
BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir /tmp/claude-$(id -u)/dump \
  tactic-mainqa-deploy-smoke-retry tactic-mainqa-dispatch-daemon-restart tactic-mainqa-review-cost-finder \
  strategy-autonomous-execution strategy-token-economy \
  tactic-mainqa-budget-pipeline tactic-mainqa-deploy-auth-diagnostics tactic-mainqa-ds-storybook-visual \
  tactic-mainqa-gcp-cost-alerts tactic-mainqa-instance-flake-personalization tactic-mainqa-landing-pageshell \
  tactic-mainqa-office-hours-snapshot tactic-mainqa-print-app-prod tactic-mainqa-wsl-host-activation)

packages/intentionsutil/scripts/graph-commit --base "$BASE" \
  --prune tactic-mainqa-deploy-smoke-retry \
  --prune tactic-mainqa-dispatch-daemon-restart \
  --prune tactic-mainqa-review-cost-finder \
  strategy-autonomous-execution strategy-token-economy \
  tactic-mainqa-budget-pipeline tactic-mainqa-deploy-auth-diagnostics tactic-mainqa-ds-storybook-visual \
  tactic-mainqa-gcp-cost-alerts tactic-mainqa-instance-flake-personalization tactic-mainqa-landing-pageshell \
  tactic-mainqa-office-hours-snapshot tactic-mainqa-print-app-prod tactic-mainqa-wsl-host-activation
```

Both `dump-node.ts` and `graph-commit` need `dangerouslyDisableSandbox: true`
(tsx's IPC socket and the `.bare`/worktree writes are otherwise sandbox-denied
— `.claude/rules/sandbox.md`); when disabling the sandbox, `$TMPDIR` is
**not** inherited, so use an explicit path like `/tmp/claude-$(id -u)/dump`,
never `$TMPDIR/dump` (silently resolves under `/`).

Once that lands clean, advance this tactic itself (`tactic-mainqa-first-class-phase`)
`phase: implement` → `done` via the same dump/write-node.ts/graph-commit
mechanic, in the same call or an immediately following one — no PR, no CI
gate, no `execution.pr` to set.

**Dependencies:** Units 1–3 complete.

**Recommended model:** sonnet (mechanical: run the scripted commands above,
no design judgment).

## Reuse

- `packages/intentionsutil/scripts/dump-node.ts` — base manifest before
  rewriting any pre-existing node (mandatory per `--base` below).
- `packages/intentionsutil/scripts/write-node.ts` — the single validation
  gate for every frontmatter write.
- `packages/intentionsutil/scripts/graph-commit` — `--prune` for the 3
  removed ids, `--base` for every touched pre-existing id, one call lands the
  whole round atomically.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
! ls intentions/tactic-mainqa-deploy-smoke-retry.md intentions/tactic-mainqa-dispatch-daemon-restart.md intentions/tactic-mainqa-review-cost-finder.md 2>/dev/null
! grep -l "^phase: implement" intentions/tactic-mainqa-*.md
```

Manual/prose checks:

- `intentions/strategy-autonomous-execution.md` and
  `intentions/strategy-token-economy.md` each show the 3 new
  `attributes.conditions` entries described in Unit 1.
- The 9 surviving `tactic-mainqa-*` nodes show `phase: main-qa`, unchanged
  `office_hours`, and unchanged verification checklists; their body opening
  paragraph is deduped per Unit 3.
- `intentions/tactic-main-qa-triage-before-provision.md` is untouched (still
  `phase: done`).
- This tactic itself (`tactic-mainqa-first-class-phase.md`) shows
  `phase: done` on `origin/main` after Unit 4 lands.
