---
id: tactic-finding-search-all-producers
kind: tactic
statement: Merge the five private follow-up writers into ONE find-or-recur write
  surface that every finding producer calls — an optional deterministic key plus
  a whole-graph similarity search, with a key/search disagreement recorded as a
  finding rather than resolved silently
owner: ai
status: raw
parent: null
rationale: "REWRITTEN 2026-08-14 by the second /align round of that date, on
  author ruling, raising this node's bar from per-skill discipline to merged
  common logic. As first drafted earlier the same day it installed
  find-before-minting as prose in EACH producer's skill; the author ruled that
  all skills tracking follow-ups must use merged common logic, stating the goal
  as DRY/parsimony. Six copies of one instruction is the same defect class as
  five scripts — it is how the repo arrived at five private writers in the first
  place — so the drafted shape was itself the thing to fix. Rewritten rather
  than superseded by a fresh node, which is the merge discipline this change
  records, practised on itself, exactly as the sibling
  tactic-eval-finding-ledger was rewritten earlier the same day. That sibling is
  unchanged and still owns the namespace and class-marker retirement. Serves
  both strategies honestly rather than by nearest fit: the RULE that binds every
  producer is strategy-graph-native-dispatch's, and the write surface is a
  dispatch-surface script, while the OBSERVABLE that reads the outcome —
  distinct find-or-recur write surfaces equals 1 — joined
  strategy-recursive-self-improvement's success_signal in the same round,
  because the instrument that reads it is /rsi and a sensor lives with its
  instrument. Adding that second serves edge is a deliberate classification act
  taken in an attended interview, and it does lift this node's band."
reading: null
serves:
  - strategy-graph-native-dispatch
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

# One find-or-recur write surface, called by every finding producer

**Rewritten 2026-08-14** by the second `/align` round of that date. As first
drafted earlier the same day this node installed find-before-minting as *prose in
each producer's skill*. The author raised the bar to **merged common logic**,
stating the goal as DRY/parsimony. Six copies of one instruction is the same
defect class as five scripts — it is how the repo arrived at five private writers
— so the drafted shape was itself the thing to fix.

The normative statement lives on `strategy-graph-native-dispatch`, clarification
*"Is the find-before-minting rule discharged by each producer's skill stating it,
or by one shared write surface every producer calls?"*. The evaluator-side
reasoning and the observable that reads the outcome live on
`strategy-recursive-self-improvement` (its one-write-surface condition, and the
`distinct find-or-recur write surfaces equals 1` reading added to its
`success_signal` the same round).

## Measured state at record time

Seven skills call **five** distinct private writers, all under
`.claude/skills/dispatch-propagate/scripts/`:

| writer | keyed by | callers |
|---|---|---|
| `dispatch-eval-finding` | model similarity judgment over `--list`, slug-addressed | `/rsi`, `/rsi-audit`, `/dispatch-ladder` |
| `dispatch-invalid-state-followup` | `sha256(cause-slug)` → `tactic-invalid-state-rc-<8 hex>` | `/dispatch-invalid-state` |
| `dispatch-security-followup` + `dispatch-followup-exists` | stable identifier in a GitHub issue title | `/review-fix` |
| `dispatch-qa-needs-main-followup` | `qa-needs-main #<N>: <key>` in a GitHub issue title | `/qa-fix`, `/qa-main` |
| `dispatch-fleet-alarm` | a closed enum of eight fault kinds | fleet sweeps |

The **retired** `/file-issue` is still cited as a caller of
`dispatch-followup-exists`.

`dispatch-invalid-state-followup`'s hashed namespace is the exact shape the
same-day find-before-minting ruling forbids: a mint-or-reuse decision scoped to
an id prefix, so a duplicate minted outside it is structurally invisible to the
search meant to catch it.

## What the merged surface must do

1. **Optional deterministic key.** A caller with a stable machine key passes it —
   an invalid-state cause slug, a CI failure signature, a CodeQL rule id, an npm
   advisory id — and is addressed by it. This is not a convenience: it is what
   `dispatch-invalid-state-followup`'s header argues for explicitly, so that one
   lane defect stranding three nodes converges on one follow-up carrying three
   occurrences rather than three near-identical nodes nobody triages.
2. **Whole-graph similarity search, always.** It runs in every case, key or no
   key, over the open tactic set — never scoped to an id prefix or to a class
   attribute. This is the rule `strategy-graph-native-dispatch` fixes.
3. **Disagreement is a finding.** When the key says "new" and the search says
   "this already exists elsewhere", record that as a finding rather than
   resolving it silently. *Owned limit:* that this is a useful signal rather than
   noise is untested — measure its rate before treating it as one.
4. **Preserve what the existing writers already got right.** Resumption of a
   retired entry rather than re-minting (so a recurrence after retirement does
   not restart the count at 1); the `attributes.measured_impact` prune exemption;
   refusal rather than laundering on a credential-shaped string or a GitHub
   closing keyword next to a `#N`; the `skipped-in-flight` refusal when a node's
   `execution` is non-null; and the pace exemption, which
   `strategy-recursive-self-improvement`'s first condition already ruled follows
   the *write*, not the rsi namespace.
5. **Per-skill prose reduces to naming the call.** No producer restates the
   discipline. A restatement is not compliance.

## Settle this before designing around it

The three **GitHub-issue-keyed** writers — `dispatch-security-followup`,
`dispatch-qa-needs-main-followup`, `dispatch-followup-exists` — key on a tracker
that is **disabled repo-wide**. They may be legacy *removals* rather than
callers to migrate. This was **not verified** in the recording round and is the
first thing to establish: if they are removals, the merged surface has three
callers to serve, not six.

`dispatch-retriage-orphaned-followups` is a *scanner*, not a writer, and is out
of scope here.

## Sibling

`tactic-eval-finding-ledger` is unchanged and still owns the retirement of
`attributes.ledger_entry` as a class marker, the `tactic-eval-finding-*`
namespace as a membership test, and the re-keying of the prune exemption to
`attributes.measured_impact`. That node removes the *primitive*; this one
supplies the single writer that replaces the five.
