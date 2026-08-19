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
clarifications:
  - question: Is the quality half of this node’s threshold — by_phase_outcome pooled
      disposition rates — readable for the phases this node would touch?
    answer: "(Recorded 2026-08-19 /align-tactics per-node drift review.) The quality
      half of this node's threshold — 'no drop in by_phase_outcome pooled
      success rates' — is readable for only three phases, which constrains where
      masking targets may be chosen. dispatch-emit-outcome:90 sets
      ALLOWED_PHASES=(review qa fix-checks), and aggregate-usage.sh builds
      by_phase_outcome only over emitted envelopes
      (aggregate-usage.sh:1049-1081, with the mirroring emitter guard at :1293).
      Phases outside that set — notably implement, where the largest Bash
      tool-result payloads are most likely to rank in payload_bytes.by_tool —
      emit no envelope and therefore carry no pooled disposition rate at all.
      Consequence for this node: masking targets must either be scoped to
      review, qa and fix-checks so the refutation condition is actually
      runnable, or the plan must state explicitly that the quality side is
      unmeasured for the phases it touches and name what stands in for it.
      Without that, a cost drop recorded in an envelope-less phase cannot be
      distinguished from the refutation this node's own threshold defines — 'a
      cost drop paid for by a fall in disposition rates is a refutation, not a
      win'. See .claude/docs/outcome-envelope.md for the envelope shape and the
      rate formulas."
  - question: Do the field names and the per-closed-tactic denominator this node’s
      Verification section cites actually exist in aggregate-usage.sh?
    answer: "(Recorded 2026-08-19 /align-tactics per-node drift review.) Two
      bookkeeping corrections so this node's Verification section is runnable as
      written. FIRST, `context_lens` is not a key anywhere in the audit: the
      field is `lenses.context_over_120k` (aggregate-usage.sh:1377, computed as
      $ctx_lens, 120000-token threshold). The other two named readings are
      correct — `payload_bytes.by_tool` and `payload_bytes.worst_sessions` at
      aggregate-usage.sh:1028-1047. SECOND, 'price proxy per closed tactic' is
      not a computed field: $by_node (aggregate-usage.sh:930-947) sums sessions,
      turns and price_proxy_usd per node id from the dispatch-stamp sidecar and
      is agnostic to whether that node ever reached phase done, and no script
      divides by a closed-tactic count. The denominator is a manual join —
      cross-reference by_node's node ids against the phase:done transitions
      inside the same window — and must be spelled out step by step in the plan
      rather than assumed queryable. There is also no comparator: nothing in the
      repo diffs two aggregate-usage.sh outputs, so the 'equal-length windows
      before and after' protocol is a hand-run jq comparison. The sibling node
      tactic-dispatch-cache-preserving-context carries the identical phrase and
      the identical gap."
  - question: What did the 2026-08-19 caller-thread measurement find about where the
      payload is, which phase carries it, and what the cache baseline implies?
    answer: "(Recorded 2026-08-19 /align-tactics per-node run, measured on the
      caller thread against origin/main 43cf33f6 and handed to the drift review;
      recorded here so the numbers survive the session that took them.) FIRST,
      target selection is already answered and is not a unit of work.
      aggregate-usage.sh --days 3 gives payload_bytes.total 29,455,791 bytes, of
      which Bash is 24,807,668 over 9,503 results (84.2%, ~2.6 KB per result)
      and Read is 4,146,244 over 368 results (14.1%, ~11.3 KB per result);
      TaskOutput 248,667/17 and Workflow 83,972/49 follow, and every other tool
      is under 60 KB. Two tool families are 98.3% of the payload. SECOND, the
      affected population is effectively one phase, not the 'affected phases'
      the draft assumes: lenses.context_over_120k reports 79 sessions above the
      120000 peak-context threshold at $3,187.92 price proxy, folding by_phase
      to align-tactics 73 sessions / $2,554.52 and <none> 6 sessions / $633.40.
      THIRD, and this is the economics finding that most changes what a plan
      here should do: lenses.cache_efficiency.hit_ratio.window is 0.9526
      (align-tactics 0.9502). Cached input is billed at a fraction of fresh
      input, so a 'bytes removed times input price' saving estimate overstates
      the win by roughly an order of magnitude against this baseline; and
      rewriting a tool result already sitting in an established prefix
      invalidates that prefix from the mask point on and re-pays cache_creation
      for everything after it. Ingest-time capping never enters the prefix at
      full size and is cache-safe; retro-masking is not. Whichever disposition
      the author takes, that check is cheap, runs before any implementation, and
      can kill or reshape the hypothesis on its own. FOURTH, the harness probe
      behind the park: Claude Code 2.1.231 carries the hook-payload names
      updatedInput, additionalContext and toolResult, and no updatedOutput,
      updatedToolResult or replaceOutput, so no hook can rewrite a landed tool
      result. What does exist is ingest-time truncation via
      BASH_MAX_OUTPUT_LENGTH, MAX_MCP_OUTPUT_TOKENS,
      CLAUDE_CODE_MAX_OUTPUT_TOKENS and MAX_THINKING_TOKENS (all four names
      present in the binary, settable through the currently-empty env block of
      .claude/settings.json), a PreToolUse updatedInput rewrite of the outgoing
      Bash command, and source-side verbosity cuts in repo-owned scripts. FIFTH,
      a constraint on any plan that follows: aggregate-usage.sh is the
      instrument for every threshold on this node, so changing what it counts
      mid-experiment confounds the before/after windows. And a unit whose only
      deliverable is a .claude/hooks or .claude/settings.json edit may not be
      committable from an auto-mode worker, which has been observed to have such
      commits denied."
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
office_hours:
  reason: "Ratified scope has no carrier in this repo, and the only available
    substitute tests a different hypothesis — an author ruling is owed before a
    plan can be authored. The node's Scope applies 'placeholder masking' to
    stale, high-byte tool results, i.e. the cited paper's arm: hiding an
    observation AFTER the turn that needed it. Verified against this worktree:
    .claude/settings.json configures only PreToolUse, SessionStart, Stop,
    UserPromptSubmit, WorktreeCreate and WorktreeRemove; there is no PostToolUse
    hook anywhere under .claude/ and no hook emits updatedInput (both greps
    zero-hit); PreToolUse rewrites an outgoing request, never a landed result;
    settings.json has no env block and no context or compaction key. Context
    assembly and compaction are platform-owned, so nothing in this repo can
    replace an observation already in context. Even adding a PostToolUse hook
    would fire at result time, yielding emit-time capping rather than
    staleness-keyed masking. The buildable substitute — emit-time capping or
    placeholder-with-rehydration in repo-owned producers (run-unit-tests.sh:137,
    run-typecheck.sh:181, run-pr-checks-wait.sh:104, on the
    dispatch-context-pack:252-313 cap template) — differs in two ways that
    change the measurement: it is keyed on emit rather than staleness, so
    content is never available for the turn that needs it (a larger quality risk
    than the source measured), and it reaches only Bash results from repo-owned
    scripts, leaving Read, Grep and Task results untouched however they rank in
    payload_bytes.by_tool. Planning it as written would author against an
    unbuildable mechanism; planning the substitute would silently swap new scope
    for ratified scope and invalidate the node's own refutation condition, which
    rests on the source's quality-neutrality claim. Proposed clarification for
    author ratification, three dispositions: (a) re-scope to emit-time capping
    of repo-owned producers and amend statement, rationale and refutation
    condition to say the cited result is APPROXIMATED, not reproduced; (b) keep
    staleness-keyed masking as ratified scope and hold until a harness seam
    exists; (c) treat it as strategy condition 6's case — a lane-drafted finding
    whose mechanism this harness cannot run — and drop to a born-parked
    candidate chunk for an author sitting. Note the same-batch sibling
    tactic-dispatch-cache-preserving-context already carries the bound this node
    lacks: 'Out of scope: anything owned by the model harness rather than this
    repo.' Two immaterial corrections are recorded as clarifications rather than
    blockers: `context_lens` is really `lenses.context_over_120k`, 'price proxy
    per closed tactic' has no computed denominator (manual join required), and
    by_phase_outcome exists only for review/qa/fix-checks
    (dispatch-emit-outcome:90), so the quality half of the threshold is
    unreadable outside those three phases."
  since: 2026-08-19
  recommendation: "Rule on one of three dispositions, all spelled out in the
    reason: (a) re-scope this node to emit-time capping of repo-owned producers
    and amend its statement, rationale and refutation condition to say the cited
    result is APPROXIMATED rather than reproduced; (b) keep staleness-keyed
    masking as the ratified scope and hold the node until a harness seam exists
    to carry it; (c) treat it as strategy condition 6’s case — a lane-drafted
    finding whose mechanism this harness cannot run — and drop it to a
    born-parked candidate chunk for an author sitting. Take the disposition in
    an /align pass on strategy-recursive-self-improvement or by editing this
    node directly, then re-run /align-tactics
    tactic-dispatch-observation-masking. Whichever way it goes, run the cache
    check first: at a 0.9526 hit ratio (clarification 3) the hypothesis may not
    survive contact with this harness’s baseline, and that costs nothing to
    establish. The same ruling is owed on the same-batch sibling
    tactic-dispatch-cache-preserving-context, which shares the unmeasurable
    per-closed-tactic denominator and the same platform-ownership boundary."
  session_type: requirement-discovery
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
