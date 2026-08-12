---
id: tactic-audit-cache-efficiency-lens
kind: tactic
statement: Add a measured cache-efficiency lens to the audit — hit ratio and
  cache-creation churn across sibling sessions — from the
  cache_creation/cache_read data aggregate-usage.sh already collects but no lens
  reads
owner: ai
status: raw
parent: null
rationale: Drafted 2026-08-12 /align round. The data has been collected and
  priced since aggregate-usage.sh was written; only the lens is missing, and
  lens 8 mentions prompt-cache reuse qualitatively without measuring it. This
  supplies the discriminating measurement the existing draft
  tactic-dispatch-cache-preserving-context already names as its own acceptance
  test, so the two compose rather than duplicate.
reading: null
serves:
  - strategy-token-economy
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
# Add a measured cache-efficiency lens to the audit — hit ratio and cache-creation churn across sibling sessions — from the cache_creation/cache_read data aggregate-usage.sh already collects but no lens reads

Drafted by the 2026-08-12 `/align` round, carrying the cache clarification
recorded that day on `strategy-token-economy`.

## The finding

The data is collected and priced; only the lens is missing.
`aggregate-usage.sh` reads `cache_creation_input_tokens` and
`cache_read_input_tokens` per turn (`aggregate-usage.sh:243-244`), carries them
into every bucket (`zero_bucket`, `:604`), and prices them separately
(`RATE_CACHE_CREATION` / `RATE_CACHE_READ`, `:539-540`). No lens reads them.
Lens 8 only gestures at "prompt-cache reuse across sibling sessions"
qualitatively.

## What to measure

- **Hit ratio** — `cache_read / (input + cache_creation + cache_read)`, per
  session, per phase, and window-wide.
- **Creation churn** — repeated prefix re-creation across sibling sessions with
  staggered start times. This is the shape a cache-boundary violation actually
  leaves in the data: high `cache_creation` with low `cache_read` on sessions
  that share a system prompt.

## Scope tagging

Meaningful at **both** scopes, so not fleet-only. Per-run it answers whether
this ladder's sibling sessions re-created a prefix they could have shared;
fleet-wide it answers whether a harness change moved the ratio at all.

## Composes with, does not duplicate

The existing draft `tactic-dispatch-cache-preserving-context` already names
"cache_read against cache_creation" as its own discriminating measurement — a
change that does not move the ratio never reached a cache boundary. This lens
**supplies** that measurement. Plan the two together; do not let either
re-implement the other.

## Bound

Report the measured magnitude only. Do **not** assert hypothetical savings —
the same discipline lenses 9 and 10 already carry.
