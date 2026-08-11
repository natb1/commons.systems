---
id: tactic-dispatch-observation-masking
kind: tactic
statement: Test observation masking of stale verbose tool output against LLM
  compaction in dispatch phase sessions, and measure cost against disposition
  quality
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-11 from the /rsi-research dry run. On SWE-bench
  Verified (up to 250 turns, 5 model settings), hiding or truncating old tool
  outputs behind placeholders matched or slightly beat LLM-generated trajectory
  summaries on solve rate, while both cut cost 50%+ over unmanaged context; in
  the best case the masking arm was both cheaper and more accurate. The finding
  contradicts standing doctrine -- production harnesses default to LLM
  compaction -- and it is scoped to exactly this harness's domain, long sessions
  with verbose tool output. The audit already shows where the payload lives:
  payload_bytes.by_tool and worst_sessions rank tool-result bytes per tool and
  per session, and context_lens isolates the sessions above 120k peak context
  with their price proxy. Because the source's magnitude is measured on a
  different harness, this is drafted as a hypothesis to test here, not a change
  to adopt on the strength of the citation."
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: price proxy per closed tactic falls in the affected phases while
    those phases' pooled disposition success rates hold
  sensor: aggregate-usage.sh over equal-length windows before and after the change
    -- payload_bytes.by_tool and worst_sessions, context_lens (sessions above
    the 120000 peak-context threshold and their price_proxy_usd), by_phase and
    by_node price proxy, and by_phase_outcome pooled rates
  threshold: cost per closed tactic in the affected phases drops by at least 15%
    with no drop in by_phase_outcome pooled success rates. The source claims
    50%+ against unmanaged context; under 15% here means the effect did not
    reproduce. A cost drop paid for by a fall in disposition rates is a
    refutation, not a win
  is_proxy: true
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
    source: "2026-08-11 /rsi-research dry run: JetBrains Research, 'The Complexity
      Trap' (NeurIPS 2025), SWE-bench Verified, up to 250 turns, 5 model
      settings"
    claimed_effect: masking stale tool outputs matches or beats LLM summarization on
      solve rate at 50%+ lower cost than unmanaged context
    confidence: high, but scoped to long/verbose-tool-output domains and not adopted
      in any production harness despite being measured
    magnitude_is_provisional: true
  priority: P1
---
# Test observation masking of stale verbose tool output against LLM compaction in dispatch phase sessions, and measure cost against disposition quality

## Context

JetBrains Research, "The Complexity Trap" (NeurIPS 2025), on SWE-bench Verified
— up to 250 turns, 5 model settings: **hiding or truncating old tool outputs
behind placeholders matched or slightly beat LLM-generated trajectory
summaries** on solve rate, while both cut cost 50%+ against unmanaged context.
In the best case (Qwen3-Coder 480B) the masking arm was simultaneously cheaper
*and* more accurate.

This contradicts standing doctrine — Claude Code, OpenHands, and Cursor all
default to LLM compaction — and the research report flagged the gap explicitly:
the result has been measured and not adopted. Its scope condition, "long
sessions with verbose tool output," describes this harness's phase sessions
exactly.

The audit already knows where the payload is. `payload_bytes.by_tool` ranks
tool-result bytes per tool across the window, `payload_bytes.worst_sessions`
names the ten worst offenders, and `context_lens` isolates every session above
the 120000 peak-context threshold with its price proxy and dominant phase
(`aggregate-usage.sh`, the `payload_bytes` and lenses sections). Those three
readings pick the masking targets without guessing.

**This is drafted as a hypothesis to test here, not a change to adopt on the
strength of the citation.** The magnitude was measured on a different harness
against a different baseline (unmanaged context, not this harness's current
compaction).

## Scope

- Identify masking candidates from `payload_bytes.by_tool` — the highest-byte
  tool results whose stale content is not load-bearing later in a session.
- Apply placeholder masking to those, leaving compaction otherwise intact.
- **Out of scope:** replacing compaction wholesale. The source's claim is that
  masking *matches* summarization, not that summarization is harmful; ripping
  out compaction would confound the measurement and risk the solve-rate side of
  the trade.
- **Out of scope:** masking anything a later turn must read back verbatim.

## Reuse

- `aggregate-usage.sh`'s `payload_bytes.by_tool` / `worst_sessions` for target
  selection, and `context_lens` for the population most affected.
- `by_phase_outcome`'s pooled disposition rates as the quality side of the
  trade — already computed, no new instrumentation.

## Dependencies

Reliable per-phase cost attribution. `by_phase` and `by_node` already work for
dispatch sessions, so this does **not** depend on
`tactic-rsi-lane-token-attribution` (that one fixes the rsi and lane buckets).
Recorded here so the sequencing is explicit rather than assumed.

## Verification

Equal-length token-audit windows before and after, over the affected phases:

1. `payload_bytes.by_tool` — masked tools' bytes must fall (confirms the change
   is actually reaching the payload; if it does not, nothing downstream matters).
2. `by_phase` / `by_node` price proxy per **closed tactic** — the cost side.
3. `by_phase_outcome` pooled success rates — the quality side.

**Threshold:** cost per closed tactic drops ≥15% with no fall in pooled
disposition rates. The source claims 50%+ against unmanaged context; this
harness already compacts, so the honest expectation here is smaller. Under 15%
means the effect did not reproduce against *this* baseline.

**Refutation condition:** a cost drop paid for by a fall in disposition rates is
a **refuted hypothesis**, not a partial win — the source's whole claim is that
masking is quality-neutral. Record it as not reproduced and revert. Likewise, a
bytes drop with no cost drop means the masked payload was not what was being
paid for.
