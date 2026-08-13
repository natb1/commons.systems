---
id: tactic-rsi-lane-token-attribution
kind: tactic
statement: Make rsi-family and research-lane session spend attributable in
  dispatch-token-audit, so the strategy's per-workflow spend condition can be
  read at all
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-11 from the /rsi-research dry run. The strategy's
  fit function is value per token with spend attributed across dispatch,
  office-hours, and rsi, and the research lane carries a condition that its
  spend stay small relative to dispatch. Neither is readable today:
  aggregate-usage.sh keys whole-session attribution off a hardcoded
  worker_skills allowlist that contains no rsi-family skill, so every rsi turn
  lands in the <none> bucket. This is already observed, not predicted -- the
  2026-08-11 queue summary on this strategy records rsi's 7d share rendering as
  0.0% while <none> is the largest single bucket at 4747.37 price proxy over
  12008 turns. This is the prerequisite for every other measurement tactic in
  this batch: without it, a cost claim about the lane cannot be confirmed or
  refuted."
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: token-audit windows containing rsi, rsi-plan, or research-lane
    sessions carry non-zero spend in those sessions' own buckets, and the <none>
    bucket shrinks by approximately the amount attributed
  sensor: .claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh --
    by_skill, by_attribution_skill, launch_skill, and the <none> bucket's
    price_proxy_usd, read over a window containing a known rsi or research-lane
    run whose own totals are recorded independently
  threshold: the known session's spend appears in its own bucket within 10% of
    that session's independently recorded totals, and rsi's rendered workflow
    share stops reading 0.0% whenever such sessions exist in the window
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  reference:
    source: endogenous -- the 2026-08-11 /rsi-research dry run (spec correction C5
      on tactic-rsi-research-skill) and the 2026-08-11 queue_summary reading on
      strategy-recursive-self-improvement
    claimed_effect: the recorded per-workflow spend attribution is unreadable for
      rsi and the research lane, so conditions written against it cannot be
      evaluated
    confidence: measured in this harness, not imported
  priority: P0 -- prerequisite for the measurement tactics drafted alongside it
---
# Make rsi-family and research-lane session spend attributable in dispatch-token-audit, so the strategy's per-workflow spend condition can be read at all

## Context

`strategy-recursive-self-improvement`'s fitness function is value per token
**with spend attributed across dispatch, office-hours, and rsi**, and
`tactic-rsi-research-skill` carries a condition that the lane's spend stay
small relative to dispatch. Both are unreadable today.

`aggregate-usage.sh` types a session as a `worker` and re-keys its whole
transcript onto a launch skill only when the first user message matches
`<command-name>/<skill></command-name>` for a skill in a **hardcoded
allowlist** — `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:312`:

```
def worker_skills: ["plan-issue","implement","qa-fix","review-fix","fix-checks",
  "fix-conflicts","dispatch-conflict","qa-main","budget-parse-job","resolve-epic",
  "office-hours","align-strategy","align-tactics","align-init","align"];
```

No `rsi`, no `rsi-plan`, no `rsi-research`. Every turn of every rsi session
therefore falls to the `<none>` bucket.

This is **already observed, not predicted**. The 2026-08-11 `queue_summary`
reading on `strategy-recursive-self-improvement` records it verbatim: rsi's
7-day share renders as 0.0% "because no turn in the window carried an `rsi` or
`rsi-plan` attribution skill — the aggregate's largest single bucket is
`<none>` at 4747.37 price proxy over 12008 turns, so the workflow split
understates rsi rather than showing it spent nothing."

The research lane adds a second, harder case (spec correction **C5** on
`tactic-rsi-research-skill`): its real cost lives in nested
`subagents/workflows/wf_*/agent-*.jsonl` under an **anonymous headless session
id** with no node id anywhere. The measured dry-run cycle — 108 subagents,
~364k output + ~44.7M cache-read tokens — is invisible to the audit entirely.

## Scope

- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:312` — the
  `worker_skills` allowlist, and the `worker_cmd_re` at `:315` built from it.
- The lane's cron wrapper (per C1/C2 on `tactic-rsi-research-skill`) — whatever
  makes the headless session identifiable.
- **Out of scope:** changing what the audit measures, its pricing model, or any
  bucket other than attribution keys. This tactic makes existing spend
  *visible*; it does not reduce it.

## Design choice to settle before implementing

Two mechanisms exist, and they are not equivalent:

1. **Extend `worker_skills`** with the rsi family. Cheap, but the lane's
   first-user command is `/deep-research` (C1 — `/rsi-research` cannot invoke it
   from inside a session), so allowlisting `deep-research` would also capture
   author-invoked research sessions that are not lane spend.
2. **Write an attribution sidecar** next to the session transcript. The audit
   already knows this shape — `--exclude-sidecar-sessions` reads
   `<stem>.file-issue-attribution.json` — so a lane sidecar naming the workflow
   reuses an existing, tested convention and cannot capture unrelated sessions.

Recommendation: (1) for the in-session rsi skills, (2) for the headless lane.
Recording both here so the choice is made on the record rather than inside an
implementation session.

## Reuse

- `aggregate-usage.sh`'s existing whole-session re-keying — no new mechanism.
- The `<stem>.file-issue-attribution.json` sidecar convention already parsed by
  the same script.
- `render-rsi-plan.ts` already renders the workflow split; it needs no change
  once the buckets are populated.

## Verification

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

Beyond the unit tests, the acceptance test is a **measured comparison against a
known session**, which is what makes this falsifiable:

1. Record one rsi (or lane) session's own totals independently.
2. Run `aggregate-usage.sh --days N` over a window containing it.
3. Its spend must appear in its own bucket within 10% of those totals, and the
   `<none>` bucket must shrink by approximately the amount attributed.

**Refutation condition:** if the bucket populates but `<none>` does not shrink
correspondingly, the change is double-counting rather than attributing — that
is a refutation, not a partial success. A bucket that reads non-zero while
`<none>` holds steady is the failure this check exists to catch.
