---
id: tactic-dispatch-cache-preserving-context
kind: tactic
statement: Make dispatch session context append-only where the prompt prefix is
  under harness control, and measure the KV-cache effect against the claimed
  agentic-cost reduction
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-11 from the /rsi-research dry run. An append-only
  context layout preserves the KV cache across tool calls -- a purely mechanical
  harness design choice (SICA), independently corroborated by a 2026 eval
  reporting 41-80% agentic-cost reduction and 13-31% faster time-to-first-token
  from prompt caching, with the caveat that naive full-context caching can
  increase latency when cache boundaries are unmanaged. Anything the harness
  injects mid-prompt after a cache boundary -- reordered context, rewritten
  preambles, mutated system reminders -- invalidates the prefix and forces
  re-creation. The audit already carries the discriminating measurement per
  session: cache_read against cache_creation. A change that does not move that
  ratio did not reach a cache boundary, which makes the hypothesis cheaply
  falsifiable before any cost claim is credited."
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: the cache_read to cache_creation ratio rises for dispatch phase
    sessions and price proxy per closed tactic falls
  sensor: aggregate-usage.sh over equal-length windows before and after --
    per-session cache_read, cache_creation, and price_proxy_usd, aggregated
    by_phase and by_node
  threshold: cache_read:cache_creation rises and price proxy per closed tactic
    falls by at least 15% (source range 41-80%, treated as provisional). An
    unchanged ratio means the layout change never reached a cache boundary and
    the finding is recorded as not reproduced here rather than as a partial win
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-audit-cache-efficiency-lens
office_hours: null
pace_exempt: false
rounds: null
attributes:
  reference:
    source: "2026-08-11 /rsi-research dry run: SICA paper (append-only
      KV-cache-preserving layout), corroborated by a 2026 prompt-caching eval"
    claimed_effect: 41-80% agentic-cost reduction and 13-31% faster
      time-to-first-token, with naive full-context caching able to increase
      latency if cache boundaries are unmanaged
    confidence: high on the mechanism; the magnitude range is workload-specific
    magnitude_is_provisional: true
  priority: P1
---
# Make dispatch session context append-only where the prompt prefix is under harness control, and measure the KV-cache effect against the claimed agentic-cost reduction

## Context

An **append-only context layout preserves the KV cache** across tool calls — a
purely mechanical harness design choice, from the SICA paper. Independently
corroborated by a 2026 eval reporting **41–80% agentic-cost reduction and 13–31%
faster time-to-first-token** from prompt caching, with an explicit caveat: naive
full-context caching can *increase* latency when cache boundaries are not
managed.

The mechanism is simple and unforgiving. Anything the harness injects or mutates
*before* the end of an established prefix — reordered context, rewritten
preambles, mutated reminders, a summary spliced into the middle — invalidates
the cache from that point on and forces re-creation. Appending is free; editing
in place is not.

What makes this cheaply falsifiable is that the audit already records the
discriminating number **per session**: `cache_read` against `cache_creation`
(`aggregate-usage.sh:243-254`, surfaced per session and foldable by phase and
node). A layout change that does not move that ratio never reached a cache
boundary — so the hypothesis can be killed before any cost claim is credited to
it.

## Scope

- Audit the harness-controlled portions of the prompt prefix for in-place
  mutation between turns, and make append-only the ones that are cheap to
  convert.
- **Out of scope:** anything owned by the model harness rather than this repo.
  The tactic covers what this repo injects, not the platform's own layout.
- **Out of scope:** aggressive full-context caching — the source names it as the
  case that can make latency *worse*.

## Reuse

- Per-session `cache_read` / `cache_creation` / `price_proxy_usd` from
  `aggregate-usage.sh`, aggregated `by_phase` and `by_node`. No new sensor.

## Verification

Equal-length token-audit windows before and after:

1. **`cache_read : cache_creation` must rise.** This is the mechanism check and
   it runs first — it is cheap and it is the one that can kill the hypothesis
   outright.
2. Price proxy per closed tactic must fall ≥15% (source range 41–80%, treated as
   provisional and workload-specific).

**Refutation condition:** an unchanged ratio means the layout change never
reached a cache boundary — record the finding as **not reproduced here**, not as
a partial win, and do not credit any coincident cost movement to it. A ratio
that rises while cost holds flat means the cache was not where this harness's
spend lives, which is equally a refutation of the *claimed effect* even though
the mechanism worked.

Watch time-to-first-token alongside cost: the source's caveat is that a
cache-boundary change can trade latency for cost. A cost win paid for in latency
should be recorded as such rather than reported as the claimed effect.
