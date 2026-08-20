---
id: tactic-eval-finding-worktree-isolation-guard-refuses-worker-commands
kind: tactic
statement: Two independent Claude Code gates hard-refuse worker-written Bash
  commands and .claude/rules/sandbox.md documents neither as a refusal — the
  worktree-isolation guard blocked 6 commands in one align-tactics phase (75
  percent of the phase non-schema tool errors, all 6 of its policy_blocks, 0.84
  usd of retry price proxy) because the too-complex-to-verify variant survives
  only as a passing clause under a git -C heading, and the auto-mode classifier
  separately denied a cd-prefixed compound in the next phase because that shape
  is framed as a permission-prompt cost rather than the hard denial it is in an
  unattended worker, so neither gate has a section of its own for a worker to
  find
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: isolation_guard_refusals
      value: 6
      unit: occurrences
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: policy_blocks
      value: 6
      unit: events
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: retry_price_proxy_usd
      value: 0.84
      unit: usd
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: retry_share_of_measured_price_proxy
      value: 0.013
      unit: fraction
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: automode_denials
      value: 1
      unit: events
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14T17:12:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: retry_price_proxy_usd
      value: 0.35
      unit: usd
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14T17:12:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: sandbox_overrides
      value: 29
      unit: events
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14T17:12:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: gates_blocking_cd_prefixed_compound
      value: 2
      unit: distinct gates
      window: tactic-attention-per-tier-boost-migration 2026-08-14 ladder
      sensor: rsi
      measured: 2026-08-14
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
## Context

Two independent Claude Code gates refuse worker-written Bash commands outright —
the built-in **worktree-isolation guard** and the **auto-mode classifier** — and
`.claude/rules/sandbox.md`, the file a worker consults, documents neither as a
hard refusal. The isolation guard's shape-keyed variant survives only as a
single passing sentence buried under a `git -C` heading; the `cd && command`
shape is framed purely as a permission-prompt cost. In an unattended dispatch
worker there is no prompt to pay: the call is denied, the turn is spent, and the
worker retries blind. Per lens 7's own doctrine — a rule violated repeatedly is
usually a rule written badly — this is a documentation defect, not a worker
defect.

The intended outcome is one findable section in `.claude/rules/sandbox.md` that
names both gates, both isolation-guard variants, the measured command shapes
that trip them, the fact that `dangerouslyDisableSandbox` is not a workaround for
either, and the three remedies — with the two existing scattered mentions reduced
to cross-links.

**Design note (greenfield first).** The ideal fix is not documentation at all:
the refusal message would name its own remedy, or a preflight would rewrite the
offending shape before it is issued. Neither surface is ours — the isolation
guard and the classifier are Claude Code built-ins, and no repo-side hook runs
earlier than them (`.claude/rules/sandbox.md:157-158` records that the PreToolUse
hook is a *later* gate). Documentation in the always-loaded rules file is the
only actuator this repo owns, so it is what this tactic builds. The migration
question is therefore purely one of *placement and size*, treated below as a real
constraint rather than an afterthought.

**Cost constraint, measured.** `.claude/rules/*.md` is auto-loaded into every
session (there is no `CLAUDE.md` in this repo; the nine rules files are the whole
surface). Measured 2026-08-19: those nine files total **450 lines**, of which
`sandbox.md` is **198** — 44%. Every line added here is paid by every worker in
every session, which is `strategy-token-economy`'s own currency. The plan
therefore *relocates* the existing buried clause rather than duplicating it, and
carries a hard line-count ceiling in Verification.

### Recorded occurrences (carried forward)

**Occurrence 1 — `tactic-attention-per-tier-boost-migration`, `align-tactics`
phase, 2026-08-14.** `aggregate-usage.sh --session
adaffcf8-1144-41bf-b038-e0cddc37f89e`, `.tool_errors` (six subagents; the
orchestrator turn is unmeasurable — see
`tactic-eval-finding-align-tactics-worker-transcript-unscanned` — so this is a
floor):

| signature | count | sessions |
| --- | --- | --- |
| `This session is isolated in the worktree PATH, but this command is too complex to verify…` | 5 | 3 |
| `This session is isolated in the worktree PATH, but this command changes directory to the shared checkout (PATH) before r…` | 1 | 1 |
| `InputValidationError: StructuredOutput was called with input that could not be parsed as JSON` | 1 | 1 |
| `Output does not match required schema: root: must have required property 'reuse_candidates'…` | 1 | 1 |

Six isolation refusals across 4 of 6 subagents — **75% of the phase's non-schema
tool errors**, lining up one-for-one with `permission_friction`: `policy_blocks`
6, `user_rejections` 0, `automode_denials` 0. `retry_price_proxy_usd` summed
across the six rows is **$0.84** against a $65.92 phase price proxy (1.3%). Small
in this phase; recorded because it is deterministic and free to prevent.

**Occurrence 2 — same node, `implement` phase, 2026-08-14T17:12:06Z.** The same
rule gap, enforced by a *different* gate. Session
`09888b78-be81-4597-bb3d-55b3cfa00d63` issued at 17:41:57Z, with
`dangerouslyDisableSandbox: true`:

    cd /home/n8/natb1/commons.systems/.claude/worktrees/tactic-attention-per-tier-boost-migration
    bash .claude/skills/dispatch-propagate/scripts/run-lint.sh 2>&1 | tail -40

It was denied by the **auto-mode classifier** — "Blocked by classifier. If you
have other tasks that don't depend on this action, continue working on those."
Not the isolation guard and not a user rejection: `automode_denials: 1`,
`policy_blocks: 0`, `user_rejections: 0`, `retry_price_proxy_usd: 0.35`. The
worker recovered next turn by re-issuing the same lint run without the `cd`
prefix. So the `cd`-prefixed compound is measured blocked by **two independent
gates in two consecutive phases of one ladder run**. Occurrence 1's note that
`automode_denials` were 0 was scoped to that phase's data, never a claim that the
classifier does not fire on this pattern — it does.

Same phase, recorded as context for the same rewrite rather than as a separate
ask: total `sandbox_overrides` **29 across 5 sessions** (20 in the worker alone).
`sandbox.md`'s own doctrine is that an always-on override carries no signal, and
at that density it carries none.

**Occurrence 3 — 2026-08-19, this planning session, measured on this worktree at
`origin/main 04095404`.** The defect is unfixed and the refusal surface is
**wider than the two variants above**. This session's first Bash call —
`mkdir -p DIR && BASE=$(cmd) && echo "$BASE" > FILE` — was refused with the "too
complex to verify" text, containing no `cd` and no `git -C` at all. The guard
keys on **stdout redirects (`>`), command substitution (`$(…)`), loops
(`for`/`while`), and chains mixing those with other commands**. A section written
from occurrence 1's four bullets alone would still leave a worker guessing why a
plain `cmd > file` was refused.

### Current state of the target file (verified 2026-08-19, `origin/main 04095404`)

`.claude/rules/sandbox.md` is 198 lines. Headings:

    L1   # Sandbox
    L51  ## Tree-updating git ops touching read-only paths
    L83  ## Network namespace isolation
    L92  ## claude agents --json
    L105 ## pass / GPG pinentry
    L123 ## Command pattern matching
    L128 ### Avoid `cd && command` for write/execute commands
    L144 ### `git -C /path` is auto-approved for worktrees
    L181 ### Avoid inline env var prefixes
    L187 ### Avoid double quotes spanning newlines in heredoc commit messages
    L195 ### CI polling

There is still **no heading for the isolation guard**. The "too complex to
verify" clause is one passing sentence at **L160-162**, inside the `git -C`
subsection. The `cd && command` subsection (L128-142) still frames the cost as a
permission prompt ("misses rules like `Bash(npx vitest:*)`"), never as a hard
refusal. **Locate by heading text when editing, not by these line numbers** — an
intervening merge shifts them.

### Explicit scope rulings

- **In scope**: the isolation-guard / classifier section in
  `.claude/rules/sandbox.md`, plus the one skill file whose recorded premise this
  node's own evidence contradicts (Unit 2).
- **Out of scope, deliberately**: two unrelated sandbox failures measured on this
  worktree 2026-08-19 — `provision-node-worktree`'s `check-node-selection.ts`
  dying with the tsx IPC-pipe `EPERM: … /tmp/claude-1000/tsx-1000/N.pipe`, and its
  `git worktree add` dying with `could not lock config file .git/config: File
  exists`. Neither is documented in `sandbox.md` today (grep: "tsx" 0 hits,
  "config.lock" 0 hits). They are a different fault family (sandbox mount/EPERM,
  not a refusal gate), and folding them in would inflate an always-loaded file
  past the budget this plan is written to hold. **Record them as their own
  finding through the standard find-or-recur write surface; do not add them
  here.**
- **Sibling, do not re-fix**:
  `tactic-eval-finding-unattended-worker-tool-use-rejected-midflight` is phase
  `done`. Verified this session — its landed fix (`de8ebfd3`, in PR #3090) changed
  only the `dispatch.outcome.v1` emitter (deriving `tool_denials` and
  `denied_commands` from the transcript); **it touched no rules file**, so there
  is no duplication risk. That entry remains distinct: it is the *permission gate
  asking a non-existent human* for approval mid-flight (`user_rejections`), which
  killed a phase. Both occurrences here were refused outright, asked for nobody,
  and were recoverable. Keep the two entries separate.
- `grep -rln 'isolation guard|too complex to verify|isolated in the worktree'
  intentions/*.md` returns this node only — no other live node owns this surface.

---

## Unit 1 — Give the two hard-refusal gates their own section in `.claude/rules/sandbox.md`

**Scope.** Edits exactly one file: `.claude/rules/sandbox.md`. Three changes.

**(a) Add one new `##` section**, inserted immediately **before** `## Command
pattern matching` (currently L123) — it belongs ahead of that section because
those subsections are about *prompt*-causing prefix mismatches, and this one is
about outright denial. Heading text, verbatim, because Verification greps it:

    ## Hard refusals: worktree isolation and the auto-mode classifier

Required content, in this order:

1. One opening sentence: two gates refuse a command outright; neither is a
   permission prompt, and **in an unattended dispatch worker — the majority case
   — there is nobody to approve anything**, so the call is denied, the turn is
   spent, and the only recovery is a differently-shaped command.
2. **Gate 1, the worktree-isolation guard.** State that it is a Claude Code
   built-in and an *earlier* gate than the PreToolUse hook, so hook approval never
   reaches it and `dangerouslyDisableSandbox` is not a workaround — reuse the
   framing already at `.claude/rules/sandbox.md:157-158` near-verbatim rather than
   inventing new wording. Two variants:
   - **flag-keyed** — `git -C <path>` from a worktree-isolated session; one-line
     cross-reference to the existing `### `git -C /path` is auto-approved for
     worktrees` subsection, which keeps that detail.
   - **shape-keyed** — the "too complex to verify" refusal. Reproduce the refusal
     text in a fenced block, matching the existing verbatim-refusal style at
     `sandbox.md:152-155`:

           This session is isolated in the worktree ..., but this command is too
           complex to verify that it stays inside the worktree; break it into
           plain, separate commands. Refusing to run it

     Then the **measured trigger list** (occurrence 3): any stdout redirect
     (`cmd > file`, including into `$TMPDIR`), command substitution (`X=$(cmd)`),
     loops (`for` / `while`), and any chain mixing one of those with another
     command. Add the calibration that a plain `&&` chain of simple commands
     usually passes — the guard keys on redirects and control flow, not on `&&`
     itself. Keep this list to a few lines; it is the load-bearing content.
3. **Gate 2, the auto-mode classifier**, firing independently of gate 1 and
   observed on `cd <dir> && <command>` and on `cmd; echo "EXIT=$?"`, including
   when `dangerouslyDisableSandbox: true` is set (occurrence 2). Quote the
   **canonical** signature prefix, not only the short surface form, so the doc
   stays textually consistent with the sensor that classifies it
   (`.claude/skills/rsi-audit/scripts/aggregate-usage.sh:413-419`):

           Permission for this action was denied by the Claude Code auto mode classifier

   Note the short form seen in a tool result is "Blocked by classifier …", and
   that a related shape splits the command and asks approval for one part ("This
   Bash command contains multiple operations. The following part requires
   approval: …") — which in an unattended session is a dead end, not a prompt.
4. **Remedies**, as a short ordered list: (i) one plain command per Bash call;
   (ii) a directory flag instead of `cd` — `--prefix`, `--root`, `-C` where
   permitted; (iii) `Write` a script file and run it by path in one plain call,
   which is usually cheapest when the work is genuinely iterative.
5. One closing sentence naming the reader-side signal: `aggregate-usage.sh`
   classifies gate 1 as `policy_blocks` and gate 2 as `automode_denials` under
   `permission_friction`, so non-zero friction counts in a phase are usually this
   rule being paid, not a real permission problem.

**(b) Relocate, do not duplicate.** Delete the trailing sentence at
`sandbox.md:160-162` — "A second variant refuses compound commands as too complex
to verify; break those into plain separate commands." — from the `### `git -C
/path`` subsection, and replace it with a single cross-reference line pointing at
the new section. This is why the change is a relocation rather than an addition:
the content moves to a heading a worker can find.

**(c) Correct the `cd && command` framing.** In `### Avoid `cd && command` for
write/execute commands` (L128-142), keep the existing prefix-matching /
`--project` / `--root` guidance unchanged, and add **two sentences at most**:
that in a worktree-isolated or unattended session this shape is not merely
prompt-prone but a hard denial by whichever gate reaches it first, with a
cross-link to the new section.

**Out of scope for this unit**: every other section of `sandbox.md`; the tsx
`EPERM` and `.git/config` lock failures (see Scope rulings above); any change to
`.claude/settings.json`, any hook, or any script. Prose only.

**Size budget**: net addition to `.claude/rules/sandbox.md` must stay at or under
**45 lines** (198 → ≤243), enforced mechanically in Verification. If the section
does not fit, cut prose — not the trigger list in (2) and not the remedies in (4),
which are the two parts a refused worker actually needs.

**Recommended model**: opus.

## Unit 2 — Correct the contradicted classifier premise in `dispatch-conflict/SKILL.md`

**Scope.** Edits exactly one file:
`.claude/skills/dispatch-conflict/SKILL.md`. Two anchors, both of which record a
premise this node's occurrence 2 measured false:

- **`:838`** — "In practice `git -C <path> …` reaches the auto-mode classifier and
  is approved there; a `cd … && …` compound is the shape that is prompt-prone —
  see `.claude/rules/sandbox.md`." Change "prompt-prone" to state that in an
  unattended session the classifier **denies** this shape outright (measured
  2026-08-14, `automode_denials: 1` on the `implement` phase of
  `tactic-attention-per-tier-boost-migration`), and point at the new
  `## Hard refusals` section by name.
- **`:1193-1200`** — the "**This is a deliberate exception to the `cd … && …`
  prohibition**" note for Lane 3, which currently instructs "Accept the classifier
  round-trip here". The exception itself **stands** — `dispatch-run-verification`
  takes no working-directory argument, and running the verify blocks in the
  primary checkout would verify the wrong tree, so do **not** remove it. Add a
  two-to-four sentence caveat: the round-trip is not guaranteed to be approved,
  and on denial the recovery is to `Write` a small script that performs the `cd`
  internally and invoke it by path in one plain command — never to drop the `cd`
  and run in the session's cwd, which is exactly the tree-drift this lane exists
  to prevent.

**Out of scope for this unit**: any behavioral change to Lane 3, to
`dispatch-run-verification`, or to any script; adding a working-directory
argument anywhere; every other passage in the file.

**Implementation caveat**: `.claude/skills/` is a `denyWithinAllow` carve-out in
the sandbox filesystem config. If the edit fails read-only, retry with
`dangerouslyDisableSandbox: true` — retry on the failure, never pre-emptively
(`.claude/rules/sandbox.md:41-50`).

**Recommended model**: sonnet.

**Dependencies**: Unit 1 (this unit cross-links the section Unit 1 creates by its
exact heading text).

---

## Reuse

- `.claude/rules/sandbox.md:144-179` — `### `git -C /path` is auto-approved for
  worktrees`. Current sole home of the "too complex to verify" clause (L160-162)
  and the source of the verbatim-refusal-in-a-fenced-block style (L152-155) the
  new section must match.
- `.claude/rules/sandbox.md:157-158` — "That is a Claude Code built-in, an earlier
  gate than the PreToolUse hook, so the hook's approval never reaches it." Reuse
  near-verbatim so the new section does not imply the sandbox override is a
  workaround.
- `.claude/rules/sandbox.md:128-142` — `### Avoid `cd && command` for
  write/execute commands`. The subsection whose framing Unit 1(c) corrects; keep
  its heading and its `--project` / `--root` guidance intact.
- `.claude/rules/sandbox.md:41-50` — the retry-never-pre-empt doctrine, and its
  named exceptions list. The new section belongs to neither list (an override
  changes nothing for these gates); say so in one clause rather than restating
  the doctrine.
- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:413-419` —
  `friction_kind()`, the tested classifier that maps
  `"This session is isolated in the worktree"` → `policy_blocks` and
  `"Permission for this action was denied by the Claude Code auto mode
  classifier"` → `automode_denials`. **Canonical source of the exact strings**;
  quote these rather than re-deriving from a transcript.
- `.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh:2184,2246,2291` —
  existing synthetic fixtures already encoding the "too complex" refusal phrasing;
  the new prose must stay textually consistent with them.
- `.claude/skills/dispatch-conflict/SKILL.md:1193-1200` — the existing worked
  example of documenting *when a compound command must be used anyway and why*;
  the model for the escape-hatch language, and the target of Unit 2.
- `.claude/skills/review-fix/SKILL.md:1282-1283` — the in-repo convention for
  citing `sandbox.md` by line range (`.claude/rules/sandbox.md:14-17`); future
  citers of the new section should follow it.
- `/ref-write-instructions` skill — the repo's conventions for editing
  `.claude/rules/*.md`. Load it before writing Unit 1's prose.
- Memory note `worktree-isolated-bash-refuses-loops-and-redirects` (user memory
  dir) — already records the widened trigger list measured 2026-08-13. The
  discovery is not new; the **rules file** is the gap. Use it to cross-check
  Unit 1's trigger list for completeness.

**Not reusable, checked and ruled out** (do not spend time re-deriving):
`lint-prose-rules.sh` scopes both its rules to shell scripts via
`is_shell_script()` (`.claude/skills/dispatch-propagate/scripts/lib.sh:37-51`), and
`run-lint.sh:60-73` only sets `RUN_PROSE` for a changed shell script — so a
commit touching only `.claude/rules/sandbox.md` never invokes it.
`lint-verify-fence-paths.sh` walks `intentions/*.md` only.
`check-type-safety-escapes.sh` scans TS/JS only. `run-rules-check.sh` is
Firestore/Storage rules syntax, unrelated. **No test in this repo asserts the
content of `.claude/rules/*.md`** — building such a linter is out of scope for a
prose fix.

## Verification

Auto-runnable checks. Each fence is a single assertion, run from the repo or
worktree root. Note the trap this file's own subject matter illustrates: a
**negated** grep fence passes vacuously when the text it looks for is wrapped
differently than the fence expects, so every assertion below is a **positive**
grep with a short pattern chosen to survive prose reflow.

The new section exists under its exact heading:

```verify
grep -q '^## Hard refusals' .claude/rules/sandbox.md
```

Both gates are named in the file:

```verify
grep -q 'too complex to verify' .claude/rules/sandbox.md
```

```verify
grep -q 'auto mode classifier' .claude/rules/sandbox.md
```

The shape-keyed trigger list is present (occurrence 3's widening — a section
lacking this leaves the majority refusal undocumented):

```verify
grep -q 'command substitution' .claude/rules/sandbox.md
```

Unit 2's cross-link landed:

```verify
grep -q 'Hard refusals' .claude/skills/dispatch-conflict/SKILL.md
```

The always-loaded context budget holds — `sandbox.md` was 198 lines before this
change and must not exceed 243 (`awk` rather than `wc | test`, to avoid the
command substitution the guard this rule documents would refuse):

```verify
awk 'END { exit (NR > 243) }' .claude/rules/sandbox.md
```

**Manual checks** (judgment, not mechanical):

1. Read the new section start to finish as a worker who has just been refused
   would: does it answer "why was `cmd > file` refused" and "what do I type
   instead" within the first screen? If not, the trigger list and the remedies are
   buried and should move up.
2. Confirm the "too complex to verify" sentence no longer appears in the
   `### `git -C /path`` subsection body — i.e. that this was a **relocation**, not
   a duplication. A grep cannot distinguish the two; read L144-180 and check that
   what remains there is a cross-reference line.
3. Confirm the `### Avoid `cd && command`` subsection retains its original
   `--project` / `--root` vitest guidance unchanged, with only the hard-refusal
   sentences added.
4. Confirm Unit 2 did **not** remove Lane 3's deliberate `cd … && …` exception —
   only added the denial caveat and its recovery.

**Observe in production.** The finding's own sensor is the check that this
worked: on the next few dispatch phases, read `permission_friction` via
`aggregate-usage.sh` at node scope and watch `policy_blocks` and
`automode_denials`. A subsequent phase still taking isolation refusals at the
occurrence-1 rate (6 in one phase, 75% of non-schema tool errors) means the
section is written but not being found or not being followed, which is a *new*
occurrence on this node — record it here rather than opening a second entry.
