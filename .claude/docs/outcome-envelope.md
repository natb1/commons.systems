# Dispatch Outcome Envelope

The outcome envelope is a machine-readable summary that a dispatch phase emits
once per run. It records what the phase surfaced, fixed, and decided, so a reader
can compute per-run hit rates without re-parsing the phase's prose or PR comments.

This doc is the single source of truth for the envelope. The emit script, the
phase Workflow returns, the SKILL wiring, and the `aggregate-usage.sh` reader are
all written against the field set, enums, and formulas defined here. Do not change
them in one place without changing this doc.

## Carrier shape

The envelope is a stable marker line immediately followed by a fenced `json`
block:

````
<!-- dispatch:outcome:v1 -->
```json
{ "schema": "dispatch.outcome.v1", "phase": "review", ... }
```
````

The reader greps for the literal marker line:

```
<!-- dispatch:outcome:v1 -->
```

and parses the JSON object in the fenced block that immediately follows it. This
mirrors the existing `<!-- dispatch:plan -->` HTML-comment carrier convention used
elsewhere in dispatch (see `dispatch-read-plan` / `dispatch-write-plan`).

## Fields

The envelope object contains exactly these fields. Counts are computed by the
phase Workflow and passed to the emit script; the reader derives rates from them
(see [Hit-rate formulas](#hit-rate-formulas)) — the rates are not stored in the
envelope.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `schema` | string | no | const `"dispatch.outcome.v1"` |
| `phase` | string | no | enum `{review, qa}`, extensible to future phases |
| `repo` | string | no | e.g. `natb1/commons.systems` |
| `issue` | integer | yes | the dispatch issue number on the issue lane, or `null` on the node lane |
| `node_id` | string | yes | the intention-graph node id on the node lane, or `null` on the issue lane |
| `pr` | integer | yes | the PR number, or `null` when no PR exists yet |
| `base_sha` | string | yes | the merge base the phase ran against, or `null` |
| `findings_surfaced` | integer ≥ 0 | no | total deduped findings the phase surfaced |
| `findings_actionable` | integer ≥ 0 | no | the actionable subset (see membership below) |
| `fixes_applied` | integer ≥ 0 | no | findings the phase actually fixed |
| `followups_filed` | integer ≥ 0 | no | follow-up issues the phase filed |
| `subagents_launched` | integer ≥ 0 | no | total subagents spawned (see semantics below) |
| `tool_denials` | integer ≥ 0 | no | user-rejected tool calls the phase took (see below); `0` when none |
| `denied_commands` | array of string | no | best-effort shapes of the denied calls; `[]` when none |
| `disposition` | string | no | enum `{completed, completed_with_fixes, escalated}` |
| `terminated_reason` | string | yes | escalation reason on `escalated`, else `null` |

Exactly one of `issue` / `node_id` is non-null: the issue lane sets `issue`
(`node_id` null), the node lane sets `node_id` (`issue` null) — mirroring the
session sidecar's dual `issue`/`node_id` shape (`dispatch-stamp-session`).

## `disposition` enum

A closed set of three values, consistent across phases:

- `completed` — the phase finished its work and applied no fixes.
- `completed_with_fixes` — the phase finished and applied one or more fixes.
- `escalated` — the phase stopped for user review (a deviation/escalation).

Path → value mapping:

| Phase | Terminal path | `disposition` |
|---|---|---|
| review-fix | normal complete, no fixes (`fixed.length === 0`) | `completed` |
| review-fix | normal complete, fixes applied (`fixed.length > 0`) | `completed_with_fixes` |
| review-fix | deviation | `escalated` |
| qa-fix | clean pass | `completed` |
| qa-fix | auto-fix applied | `completed_with_fixes` |
| qa-fix | escalate | `escalated` |

## `terminated_reason`

On an `escalated` path, `terminated_reason` is the escalation/deviation reason
string — the same text passed to `dispatch-mark-deviation`. On every non-escalated
path it is `null`.

## `findings_actionable` membership

"Actionable" means the finding warranted action this run (it was fixed, was
required, or was deferred to a follow-up) — as opposed to findings the phase
surfaced but dismissed, refuted, or judged out of scope.

### review-fix

`findings_actionable` counts dispositions whose `bucket` is one of:

- `Fixed`
- `Required`
- `Deferred`

The following buckets are explicitly **excluded** from `findings_actionable`:

- `Refuted`
- `Unverified`
- `Informational`
- `Dismissed`
- `False-positive`
- `Out-of-scope`

`findings_surfaced` counts all deduped findings (every disposition entry,
regardless of bucket). `fixes_applied` is `fixed.length` — the size of the
separate `fixed` array, which equals the count of `Fixed`-bucket dispositions.

### qa-fix

`findings_actionable` counts all items in `result.dispositions` — every triaged
QA residue item, across the classes `opus-fixable`, `needs-main`, and
`needs-human`. Items in `already_satisfied` are **non-actionable** and are not
counted in `findings_actionable` (they are also not counted in
`findings_surfaced`; surfaced counts the triaged residue).

`fixes_applied` is the count of items the auto-fix lane actually fixed
(`opus-fixable` items resolved this run).

## Hit-rate formulas

The reader computes these from the stored counts. Each rate is `null` when its
denominator is zero (never emit a divide-by-zero or a fabricated `0`):

- `hit_rate = fixes_applied / findings_surfaced` — `null` when `findings_surfaced == 0`.
- `actionability = findings_actionable / findings_surfaced` — `null` when `findings_surfaced == 0`. The share of surfaced findings that were actionable.
- `fix_rate = fixes_applied / findings_actionable` — `null` when `findings_actionable == 0`. The share of actionable findings that were fixed.

`hit_rate` factors as `actionability × fix_rate` when both denominators are
non-zero.

### Which rate reflects which phase

`/rsi-audit` reports each phase on the metric that phase can actually
move. (These rates once fed an automated promote-to-Opus routing policy generator;
that policy was retired in #2872 — the phase orchestrator is now always Sonnet and
Opus tiering is chosen per-`agent()` inside each Workflow. The rates now inform the
report a human reads, not an automated router.)

- `review` is read on `hit_rate`. The review Workflow counts subagent-applied
  fixes into `fixes_applied` directly, so the rate reflects review's own
  output.
- `qa` is read on `actionability`. qa-fix's designed output is triage and
  follow-ups — its fix lane delegates fixes to `/implement-unit` — so pooled
  `hit_rate` is structurally near 0 regardless of how well the phase performs;
  `actionability` measures the triage quality qa does control.

## `subagents_launched` semantics

`subagents_launched` is the **sum** of two sources:

1. The phase Workflow's own fan-out count. For review-fix this includes the
   internal finder, skeptic, and fixer fan-out the Workflow spawns. For qa-fix it
   includes the Workflow's triage and verification fan-out.
2. SKILL-body subagents spawned outside the Workflow. For review-fix these are the
   Step 5a deferred-filing and Step 5b security-follow-up `/file-issue`
   subagents.

Unit 3 (the Workflow returns) computes source 1; the SKILL wiring (Unit 4) adds
source 2 before calling the emit script. The emitted value is the total.

## `tool_denials` / `denied_commands` semantics

An unattended phase can lose a tool call mid-flight to a permission denial and
still finish. It then reports a clean record — `disposition: completed`,
`findings_actionable: 0` — with nothing to say the check it was assessing never
ran. `tool_denials` closes that gap: it is **always present**, so a phase that
took denials cannot emit a clean-looking record without the gap being visible to
the ladder and to `/rsi`.

The signal is the harness's `toolDenialKind: "user-rejected"` JSON field on the
user message carrying the declined call — the same field `aggregate-usage.sh`
classifies `user_rejections` from. Do **not** grep for the human-readable "The
user doesn't want to proceed with this tool use" phrase: it is absent from many
denials, so a literal search returns zero and reads as a clean session.

`dispatch-emit-outcome` **derives both fields itself** from the emitting
session's transcript whenever `--tool-denials` is omitted. Deriving is the
default rather than an argument the phase supplies, because a phase that
silently lost a verifying check to a denial is exactly the phase least likely to
self-report it. Derivation is best-effort: an unlocatable or unparseable
transcript yields `0` / `[]` and never fails the emit.

Overrides, for a caller that has a better number than the transcript does:

- `--tool-denials <n>` replaces the derived count.
- `--denied-command <shape>` (repeatable) replaces the derived shapes.

The two need not agree in length. `tool_denials` is the count of record;
`denied_commands` is a diagnostic — a denial whose originating `tool_use` is not
in the transcript renders as `"<unknown tool call>"`, and a `Bash` denial renders
as `Bash: <command>` truncated to 160 characters.

## Reader contract

- The envelope block lands in a `tool_result` — the stdout of a Bash tool call —
  in the worker session's transcript `.jsonl`. The reader scans transcripts for
  the marker line.
- **Last-wins** precedence: if multiple envelope blocks appear in one transcript,
  the reader uses the last one.
- The reader's `by_phase_outcome` reduce admits exactly two session types:
  `worker` and `router-tick`. Subagent transcripts are excluded (a subagent
  that happens to print the marker produces no stray envelope), and `recovery`
  and `other` session types are also excluded — they are not envelope emitters.
- **Strict count validation**: an envelope that parses as JSON but is missing
  any of the three rate-feeding counts — `findings_surfaced`,
  `findings_actionable`, `fixes_applied` (each non-nullable here) — is null-ified
  and treated as **absent**, exactly like a session with no envelope. The reader
  never coerces a partial envelope into a zero-count object, so a partial
  envelope can never produce a fabricated `0` rate. (`followups_filed` and
  `subagents_launched` are not validated this way — they do not feed any rate.)

## Adoption recipe for a new phase

To make a future phase emit the envelope:

1. Extend the phase's Workflow return with the computed fields:
   `findings_surfaced`, `findings_actionable`, `fixes_applied`,
   `followups_filed`, and the Workflow's own `subagents_launched` count, plus the
   `disposition` and `terminated_reason` for each terminal path.
2. Call `dispatch-emit-outcome` at **every** terminal path of the phase
   (complete, complete-with-fixes, and escalate), passing the computed fields and
   adding any SKILL-body subagent count to `subagents_launched`. Leave
   `--tool-denials` / `--denied-command` off — the script derives them; a new
   phase inherits the denial accounting for free.
3. Use the `disposition` enum and the actionability/hit-rate definitions in this
   doc. Add the new `phase` value to the enum here when you do.

## Worked example

A review-fix run that surfaced 8 findings, found 5 actionable, fixed 3, filed 2
follow-ups, and spawned 11 subagents — a `completed_with_fixes` outcome:

````
<!-- dispatch:outcome:v1 -->
```json
{
  "schema": "dispatch.outcome.v1",
  "phase": "review",
  "repo": "natb1/commons.systems",
  "issue": 1860,
  "node_id": null,
  "pr": 1871,
  "base_sha": "0a454453c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
  "findings_surfaced": 8,
  "findings_actionable": 5,
  "fixes_applied": 3,
  "followups_filed": 2,
  "subagents_launched": 11,
  "tool_denials": 0,
  "denied_commands": [],
  "disposition": "completed_with_fixes",
  "terminated_reason": null
}
```
````

For these counts the reader computes `hit_rate = 3/8 = 0.375`,
`actionability = 5/8 = 0.625`, and `fix_rate = 3/5 = 0.6` (and
`0.625 × 0.6 = 0.375`, matching `hit_rate`).

On the graph-native node lane the same envelope instead carries `"issue":
null, "node_id": "tactic-example-node"` — every other field is unchanged.
