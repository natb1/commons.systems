---
id: tactic-eval-finding-utc-bounds-local-newermt
kind: tactic
statement: Stop eval jobs concluding absence from a displaced search window —
  events.jsonl stamps are UTC and `find -newermt` parses a bare timestamp in the
  host's LOCAL zone, so an eval that passes a ledger stamp through unconverted
  searches a window offset by the UTC offset, matches nothing, and records its
  own blindness as evidence that no artifact was ever written
owner: ai
status: raw
parent: null
rationale: "Observed on 2026-08-13 in the /rsi post-hoc evaluation
  rsi-eval-tactic-attention-namespaced-rank-qa-1786592808 (session 2503ccc7),
  evaluating the qa phase of tactic-attention-namespaced-rank. The eval reported
  that 'no file of any kind was created or modified anywhere under
  ~/.claude/projects' during the [03:46:48Z, 03:59:02Z] window, 'confirmed with
  an unscoped find ~/.claude/projects -newermt ...', and concluded that the
  conflict-lane session had registered with the daemon and then died before
  touching disk. That conclusion is false. The session left an 850 KB transcript
  at ~/.claude/projects/-home-n8-natb1-commons-systems/675bbbc1-....jsonl whose
  first user message is stamped 2026-08-13T03:46:48.315Z (the launch instant)
  and whose last write is 03:59:00Z, plus a session directory, a session-env
  entry and two security-state files -- and the lane had SUCCEEDED, resolving
  five merge conflicts and pushing 855a060e. The search failed because
  `find -newermt` parses a bare timestamp in the local zone: on this host (EDT,
  -0400) `-newermt '2026-08-13 03:46:48'` means 07:46:48Z, roughly four hours in
  the future, so it could not match any file that existed. Reproduced directly:
  the UTC-bound find returns nothing while the same instant expressed locally
  ('2026-08-12 23:46:48') returns the transcript immediately. The false finding
  landed on origin/main as 1f97dbe5
  (tactic-eval-finding-conflict-lane-registered-phantom) and had to be corrected
  by hand."
reading: null
serves:
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
## The mechanism

`events.jsonl` stamps are UTC with a trailing `Z` (`2026-08-13T03:46:48Z`).
`find -newermt` parses a bare timestamp in the host's **local** zone. An eval
that lifts a bound out of the ledger and passes it through unconverted searches
a window displaced by the UTC offset.

```
$ find ~/.claude/projects -name '675bbbc1*.jsonl' -newermt '2026-08-13 03:46:48'
        (no output — the UTC bound, read as local: ~4h in the future)
$ find ~/.claude/projects -name '675bbbc1*.jsonl' -newermt '2026-08-12 23:46:48'
/home/n8/.claude/projects/.../675bbbc1-….jsonl        (same instant, local bound)
```

## Why it is worse than a wrong number

The failure is silent and it *inverts* a conclusion rather than degrading it. A
displaced window returns zero rows, and zero rows read naturally as "no artifact
was ever written" — so the eval concluded a worker had died when its own search
simply could not see a live, successful session.

An eval lane is a measuring instrument. A silent inversion in an instrument is
the most expensive kind of defect: it manufactures work against imaginary causes
and, worse, lends false confidence — the finding it produced was specific,
well-argued, and cited its own method as corroboration.

## Directions

1. **Make the bound unambiguous at the boundary.** Prefer `-newer <file>`, which
   takes an mtime directly and cannot be misparsed, or an explicit-offset stamp
   (`-newermt '2026-08-13 03:46:48 +0000'`, or the `@<epoch>` form). These jobs
   already receive `--since` as a Unix epoch (`--since 1786592808`), so the
   unambiguous form is available without parsing anything at all.

2. **Refuse to conclude absence from a single negative search.** A "zero
   filesystem trace" conclusion should require a positive control — confirm the
   same search *does* return a file known to exist in the window — before it may
   become a finding. The instrument must demonstrate it can see before its
   blindness is recorded as evidence.

Direction 1 is the mechanical fix. Direction 2 is what would have caught this
regardless of cause, and generalizes past `find` to any absence-based
measurement an eval makes.

## Related

- [[tactic-eval-finding-conflict-lane-registered-phantom]] — the false finding
  this bug produced.
- [[tactic-ladder-await-phase-only-completion-test]] — the real defect behind
  the halt the eval was examining.
