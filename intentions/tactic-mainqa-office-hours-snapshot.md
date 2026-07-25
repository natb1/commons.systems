---
id: tactic-mainqa-office-hours-snapshot
kind: tactic
statement: Verify the office-hours snapshot pipeline live end-to-end — systemd
  timer, producer run, Drive write, app decrypt
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issues 2698, 2696, 2700, 2699, 2727, 2721, 2720, 2704.
  The local-first snapshot pipeline is the surface strategy-attention-surface
  consumes, so its live verification survives the legacy-router drain. Born
  parked: needs the owner machine (live /mnt/g mount, real secrets, gh auth,
  systemd)."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution: null
validates: []
blocked_by: []
office_hours:
  reason: needs owner machine + live credentials (Drive mount, encryption
    password, systemd) — live production verification migrated from the legacy
    main-qa queue
  since: 2026-07-05
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Verify the office-hours snapshot pipeline live end-to-end — systemd timer, producer run, Drive write, app decrypt

## Context

Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase. Source issues (closed, content
preserved here): 2698, 2696, 2700, 2699, 2727, 2721, 2720, 2704 — all
needs-main residue from the office-hours snapshot work (issues 2658, 2660,
2661, 2668; PRs 2677, 2718, 2722, 2695). The local-first encrypted snapshot
pipeline is exactly what
`strategy-attention-surface` consumes, so this verification survives the
legacy-router drain. Dropped as obsolete: live parity against the Firestore
producer docs (legacy issue 2697) — the hosted Firestore owner tier retires
(`tactic-attention-surface-firestore-retire`), so parity with it is not a
target-state property.

One owner sitting on the WSL host with the live /mnt/g mount, gh auth, ADC,
and the real encryption password.

## Verification checklist

1. **Full snapshot write to Drive** (was 2698, PR 2677): run the producer
   live; exactly one encrypted `office-hours-<TS>.benc` lands at the Drive
   path, an immutable history file is written alongside, and `current` is a
   real copy (not a symlink).
2. **Atomic write + loud mount check** (was 2696): with /mnt/g unmounted the
   producer exits with a descriptive error and writes nothing; on success the
   output appears only via atomic rename (no partial file visible).
3. **Fast partial refresh, scope=parked-only** (was 2700): a partial refresh
   rewrites only the parked-items section and the snapshot metadata records
   the partial scope.
4. **Payload decrypt + expected sections** (was 2699): decrypt the `.benc`
   with the real password; payload carries the expected sections plus bounded
   time-series windows, `computedAt`, `scope`, and `chainHealth`. (Section
   list will evolve as legacy-sourced fields — gh queue metrics, Firestore
   topicUsage — retire with their sources; verify against the then-current
   producer contract, not the 2026-07 field list.)
5. **Enabled run + concurrency** (was 2727, PR 2722): with
   `OFFICE_HOURS_SNAPSHOT_ENABLED=1` the producer runs detached and completes;
   two concurrent runs serialize — the second waits or exits cleanly, no
   corruption or duplicate writes.
6. **Timer freshness floor** (was 2721, PR 2718): with the dispatch chain
   stopped, the systemd timer fires on schedule, the run succeeds
   (`systemctl status office-hours-snapshot.timer` + journal), and
   `computedAt` advances — the chain-liveness heartbeat.
7. **Timer catch-up** (was 2720): after a sleep/reboot that misses a fire,
   the service runs on the next resume; `systemctl list-timers` shows past
   and next triggers.
8. **App decrypt** (was 2704, PR 2695): the production office-hours app loads
   an encrypted `.benc` snapshot and decrypts it via the shared
   `@commons-systems/crypto` worker with correct display.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node (interactive-commit-clears-park).
