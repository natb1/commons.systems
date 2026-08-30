---
id: tactic-audit-permission-friction
kind: tactic
statement: Measure permission friction (denials, approval round-trips, sandbox
  retries) as an audit lens, and give the attended periodic audit a closing
  /fewer-permission-prompts step
owner: ai
status: codified
parent: null
rationale: "Drafted 2026-08-12 /align round, carrying the attended-only
  execution ruling of the same day. Two halves that must ship together: the lens
  is measurable at both scopes, but the remediation is attended-only because
  .claude/settings.json sits in this repo's sandbox denyWithinAllow list and
  writing it requires an override no unattended job should hold."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: strategy-recursive-self-improvement
  pr: 3074
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T03:26:48Z
    mergeCommitSha: c3c229f0de63db09df7dc01ce02177f3d1b56c95
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Measure permission friction (denials, approval round-trips, sandbox retries) as an audit lens, and give the attended periodic audit a closing /fewer-permission-prompts step

Drafted by the 2026-08-12 `/align` round, carrying the attended-only execution
ruling recorded that day on `strategy-token-economy` ("May a token-audit surface
EXECUTE a remediation").

## Two halves, shipped together

**1. The lens (both scopes).** Permission denials, policy blocks, and sandbox
overrides per session — see "Approval round-trips dropped" below for the fourth
thing this bullet originally named and why it is not there. This doubles as the
harness-documentation gap signal: a documented rule violated repeatedly is
usually a rule written badly, so recurring adherence failures are ledger entries
against the *doc*, not only against the session.

**2. The remediation (attended only).** `/dispatch-token-audit` — human-invoked
— gains a closing step that runs `/fewer-permission-prompts`. The unattended
per-phase evaluator gets the lens and never the step.

## Why the split is mechanical, not stylistic

`.claude/settings.json` sits in this repo's sandbox `denyWithinAllow` list, so
writing it requires `dangerouslyDisableSandbox` — an attended act by
construction. A detached evaluator could not perform the write without a
standing sandbox override, and granting one to an unattended job is a larger
concession than the step is worth.

## Contract narrowing this depends on

`/dispatch-token-audit`'s step 7 report-only clause narrows to "writes no
**routing policy** and no graph or product files." The no-auto-apply bound on
routing policy (`strategy-token-economy` clarification 10 / its routing
condition) is **unchanged** and must not be loosened by this unit. Update the
SKILL.md prose so the narrowing is explicit rather than implied by a new step
contradicting an old sentence.

The narrowing landed in **three** places, not one: report-only was restated in
the frontmatter `description`, in the body opener, and in step 7 itself, so
editing step 7 alone would have left the description contradicting the new step.

## Approval round-trips dropped — not derivable, and the gap stays open

The statement and the lens bullet above name **approval round-trips** as one of
the things to measure. Implementation dropped them, because they are **not
derivable from transcript data**. A transcript records what was *denied* — a
rejection, a classifier block, a policy or hook refusal — and never records an
*approval*: an approved tool call is indistinguishable from a call that was
never gated at all. Nor is prompt latency recoverable; nothing timestamps the
interval a human spent sitting at a prompt.

So the shipped lens measures four things that ARE extractable, none of which is
an approval count, and the report is told in as many words not to present a
denial count as one:

1. `user_rejections` — the human declined the call.
2. `automode_denials` — the auto-mode classifier denied it. This is the
   `/fewer-permission-prompts` signal specifically: the denial text itself ends
   by telling the user to add a permission rule.
3. `policy_blocks` — a settings permission rule, or a PreToolUse hook, refused
   it. Hook refusals carry no harness-level denial marker (`toolDenialKind` is
   null on them), so they are matched by refusal text.
4. `sandbox_overrides` — calls carrying `dangerouslyDisableSandbox: true`, the
   friction *workaround* rather than a denial.

Plus `retry_price_proxy_usd`: the measured price proxy of the assistant turns
that immediately followed a denial — the turns actually spent recovering.

**The gap this leaves is real and is recorded here rather than only in the PR.**
Approval count and prompt-wait time remain unmeasured, so "how much of the
author's attention does the permission system consume" is still unanswered.
Closing it needs a data source transcripts do not carry — a harness-side
permission-decision log that records grants as well as denials, with the
prompt's open and close times. That is a separate tactic against the harness,
not an extension of this lens.

## Resolved: denials ARE separable from ordinary tool errors

The draft flagged this as unverified. They are separable, on two discriminators.
The primary one is the error signature text itself, run through the same
`err_signature` normalizer the existing `tool_errors` lens uses — so a friction
signature joins directly to its `tool_errors` row. The fallback is the
line-level `toolDenialKind` / `toolUseResult` fields the harness stamps on the
denied user message, which catch the one case text cannot: a rejection whose
result text is the human's own typed reason and therefore has no fixed prefix.
The lens did not need its own extraction pass; it reuses stage 1's existing scan.

## Resolved: the built-in stays unread, and the step is written so that is fine

`/fewer-permission-prompts` is a built-in. Its description confirms it writes the
project `.claude/settings.json`, but its merge semantics are not readable from
this repo, and `.claude/settings.local.json` is not readable from the sandbox at
all. Rather than leave the step unwired, it is written as **run it, review the
resulting diff, commit deliberately** — with an explicit instruction to drop the
change rather than hand-patch it if the review is not clean. The attended review
is the guard against clobbering the hand-authored `permissions.allow` rules, and
it needs no knowledge of the built-in's internals. The concurrent-commit
collision question is answered the same way: the human is looking at the diff.


## Author ruling, 2026-08-29 — this node is a COMPLETION RECORD

**Ruled (author, 2026-08-29 batch-execution sitting; recorded in
`plans/dispatch-rsi-author-rulings.md` §"Ruling 1").** A draft whose substance
shipped under a sibling carrier becomes a **completion record**: stamp
`execution.completion` against the carrier PR, `status: raw → codified`,
`phase: null → done`, **do not prune**. This discharges item (2) of the
2026-08-18 park — the unrecorded convention for a sibling-carrier draft — which
that park proposed as a clarification and could not write.

**Applied here.** Both halves this node asked for are merged. The lens ships at
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1215-1252` (window rollup;
its own comment names this node) and `:835-846` (per-session
`.permission_friction`), with the four-bucket denial classifier at `:386-426`
reusing the `err_signature` normalizer plus the `toolDenialKind`/`toolUseResult`
fallback exactly as this node's "Resolved: denials ARE separable" section
specifies. Catalogued as lens 12, tagged `[any-scope]`, at
`.claude/skills/rsi-audit/SKILL.md:138-154`. The attended-only closing
`/fewer-permission-prompts` remediation is step 9 at `:208-218`, gated on lens
12's `automode_denials`. The unattended consumer is `/rsi` lens 7
(`.claude/skills/rsi/SKILL.md:48-51`), which forbids running the step and names
this node by id. Regression coverage:
`.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh:2176-2307`. Landed by
`f9af1a69` (2026-08-12, introduced the `permission_friction` identifier) and
`c3c229f0` / PR #3074, under sibling carriers `tactic-rsi-audit-skill-rename`
and `tactic-rsi-audit-ledger-findings` (both `phase: done`).

### Two items the 2026-08-18 park raised that Ruling 1 does NOT answer

Retained verbatim in substance because clearing the park destroys them, and
**neither is discharged by the completion record**. Both are owed to an `/align`
pass on `strategy-token-economy`; a per-node run may not write a serving
strategy.

1. **SIDE-A FAILED CONDITION — the 2026-08-12 execution condition's narrowing
   half is dead as written.** It records report-only as *"writes no routing
   policy and no graph or product files"*, but the shipped skill states the bound
   in all three canonical places as *"writes no routing policy and no product
   files"* (`.claude/skills/rsi-audit/SKILL.md:3` frontmatter description, `:8`
   body opener, `:204` numbered bound 8) and deliberately carves the graph **out**:
   step 6 lands top-ranked opportunities as `tactic-eval-finding-<slug>` nodes
   through `dispatch-eval-finding` (carrier `tactic-rsi-audit-ledger-findings`,
   `phase: done`, PR #3074), with `:204` stating *"Step 6's graph ledger write is
   not covered by this bound."* The attended-only half still holds and the
   no-auto-apply bound on routing policy is intact — only the "no graph" clause is
   dead. This bears on this node because its own "Contract narrowing this depends
   on" section carries the same dead phrasing and instructs writing it into
   SKILL.md prose; planned as written it would forbid a write that already ships.
2. **REQUIREMENT AMBIGUITY — clarification 43's owed check was never discharged
   and the step was wired anyway.** Clarification 43 names this node as owing a
   check on how `/fewer-permission-prompts` merges into an existing
   `settings.json` and whether it can collide with a concurrent worker's commit.
   The check was never performed; step 9 is already wired
   (`.claude/skills/rsi-audit/SKILL.md:212-216`); and the built-in has no readable
   implementation anywhere in the repo tree or `~/.claude` (confirmed 2026-08-18),
   so the owed check **cannot be performed from here at all**. What shipped
   substitutes an attended `git diff .claude/settings.json` review — with an
   instruction to drop the change rather than hand-patch it if the review is not
   clean — for the verification. That is a design substitution, not a discharge,
   and it is owed ratification.
