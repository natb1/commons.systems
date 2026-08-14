# Step 6 + Escalation — set derivation, outcome-envelope emits, count sourcing

This reference carries the detailed escalation-set derivation, the outcome-envelope
emit recipes, and the two-kinds count sourcing for Step 6 and the Escalation
section of `SKILL.md`. The body holds the three-outcome precedence skeleton and
the terminal bash calls (`dispatch-complete-phase`, `dispatch-mark-complete`,
`dispatch-finalize-phase`, `dispatch-mark-deviation`).

## Escalation set (Step 6)

Build it directly from **`result.dispositions`** — the Workflow's already-filtered
output — not by re-deriving class from the raw in-memory residue list.
(Re-deriving would find already-satisfied items absent from `result.dispositions`,
get `undefined` for their class, and wrongly include them because
`undefined !== 'needs-main'`.) Define the set as:

- every **item in `result.dispositions`** — i.e. `opus-fixable` and `needs-human`
  items, which still escalate (the skill does not yet act on those classes); **plus**
- the **non-residue terminal blockers** that already escalate, unchanged. These
  stay terminal — only disposition-class residue is dropped from the set:
  - a malformed or empty triage plan (Step 3 plan validation),
  - an `origin/main` merge conflict (Step 0.5),
  - the Chrome extension unavailable so browser items could not run (Step 3c),
  - a multi-app demo choice (Step 1),
  - a failed pre-QA acceptance check (Step 3b, a bug needing a plan-mode fix).

`needs-main`-class residue items are in **neither** part of the set — they were
filed as follow-ups in Step 3.6, always carrying `main-qa`. Each carries
`dispatch:office-hours` **only** when its Step-3.6.1 determination is `human`,
routing it to office-hours human review; `autonomous` follow-ups withhold
`dispatch:office-hours` and route to the `/qa-main` handler. Either way they
are filed, not escalated.

`already-satisfied` residue items are likewise in **neither** part of the set —
they are **dropped as PASS** by the Workflow (partitioned into
`result.already_satisfied`, excluded from `result.dispositions`) and are therefore
never members of the escalation set. They do not park this PR.

## Clean autonomous pass (Step 6) — escalation set empty

This now holds even for a run whose only residue items all classified
`needs-main`: those were filed as `blocked_by` follow-ups in Step 3.6 and
dropped, leaving the escalation set empty. It also holds when every residue item
classified `already-satisfied`: those were dropped as PASS by the Workflow
(partitioned into `result.already_satisfied`), leaving `result.dispositions` and
the escalation set both empty — `dispatch:qa-done` applies. (It also holds, as
before, when every `script-verifiable` and `needs-browser` item PASSed, zero
`needs-human-judgment` items were recorded, no bug was found, and none of the
non-residue blockers fired.)

On a clean pass apply the `dispatch:qa-done` label via `dispatch-complete-phase`
(use `dangerouslyDisableSandbox: true` — it invokes `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-complete-phase "$PR_NUM" qa
```

The PR number passed here is **expected** to differ from the worktree's
`<issue>-…` branch issue number — the PR↔issue linkage was established earlier
in the tick, so this session must **not** pause to re-confirm the mismatch.
This skill **owns** its `dispatch:qa-done` label — parallel to how
`/review-fix` owns `dispatch:reviewed` — so `/dispatch-propagate`
does not apply the label after this skill returns.

Then call `dispatch-mark-complete` as the final action. `CLAUDE_JOB_DIR`
unset = interactive run; the script no-ops with a clear diagnostic.

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete \
  --phase qa --pr "$PR_NUM"
```

**Then emit the outcome envelope** (contract:
`.claude/docs/outcome-envelope.md`). This call runs **sandboxed** —
`dispatch-emit-outcome` is pure, so do **not** pass
`dangerouslyDisableSandbox`. Pass `--disposition completed`, `--fixes-applied 0`,
and **omit** `--terminated-reason` (forbidden on a non-escalated disposition).

**Tool-denial accounting** (applies to every emit call site in this file and in
`auto-fix-lane.md`): `tool_denials` and `denied_commands` are always in the
record, defaulting to `0` / `[]`. Neither is a count this skill computes —
`dispatch-emit-outcome` derives them from this session's own transcript
(`toolDenialKind == "user-rejected"`), so a QA pass that lost a tool call to a
permission denial mid-flight cannot report a clean record with the gap invisible.
Pass `--tool-denials` / `--denied-command` **only** to correct a derived value
you know is wrong.

Source the counts by whether Step 3.5 ran this pass:

- **Step 3.5 ran** (clean pass via only-`needs-main` or only-`already-satisfied`
  residue): use `result.findings_surfaced` / `result.findings_actionable`;
  `--followups-filed` = the Step-3.6 newly-filed count (`0` if Step 3.6 did not
  run); `--subagents-launched` = `SKILL_SUBAGENTS + result.subagents_launched`
  (`SKILL_SUBAGENTS` already counts the Step-2b triage and any Step-3.6 filing
  subagents).
- **Step 3.5 was skipped** (the common clean pass — residue list was empty, so
  `result` is absent): pass `--findings-surfaced 0 --findings-actionable 0
  --followups-filed 0` and `--subagents-launched <SKILL_SUBAGENTS>` (typically
  just the Step-2b Opus triage subagent — `result` is absent, so no Workflow
  fan-out is added).

qa-fix keeps **no** merge base, so **omit** `--base-sha`. Derive `repo` from the
local remote (read-only git, sandbox-safe). On the node lane (`TARGET_KIND=node`)
pass `--node-id "$N"` and omit `--issue`; on the legacy issue lane
(`TARGET_KIND=issue`) keep `--issue "$N"` and omit `--node-id` — see the
idempotency preamble's "never pass `--issue`" node-lane rule, which extends here
to naming the `--node-id "$N"` substitution:

```bash
REPO=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
if [[ "$TARGET_KIND" == node ]]; then
  id_arg=(--node-id "$N")
else
  id_arg=(--issue "$N")
fi
# tool_denials / denied_commands are always in the record and are DERIVED by the
# script from this session's transcript — pass no flag for them.
.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome \
  --phase qa --repo "$REPO" "${id_arg[@]}" --pr "$PR_NUM" \
  --findings-surfaced <result.findings_surfaced, or 0 if Step 3.5 was skipped> \
  --findings-actionable <result.findings_actionable, or 0 if Step 3.5 was skipped> \
  --fixes-applied 0 \
  --followups-filed <Step-3.6 newly-filed count, or 0> \
  --subagents-launched <SKILL_SUBAGENTS + result.subagents_launched when Step 3.5 ran; else SKILL_SUBAGENTS> \
  --disposition completed
```

**Then, as the ABSOLUTE LAST action**, run `dispatch-finalize-phase` — AFTER
the envelope emit above (it self-closes the session, terminating telemetry, so
all prior steps must complete first). It strips any premature
`dispatch:office-hours` from the issue + PR, spawns the next tick + sweep, and
self-closes (`exec claude rm`; a no-op interactively when `CLAUDE_JOB_DIR` is
unset). Use `dangerouslyDisableSandbox: true` — it invokes `gh` (network) and
`claude rm` (over a Unix socket):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-finalize-phase "$N" --pr "$PR_NUM"
```

This drives self-close, office-hours stripping, and chain propagation
deterministically — the chain no longer depends on a second Stop hook firing
(which the harness does not reliably emit after a background-task wait). A
stray second Stop firing afterward is harmless: every finalize step is
idempotent. This is the clean-pass success terminus only — the user-input
blocker escalation below does **not** call `dispatch-finalize-phase`; it
legitimately leaves the session for the Stop hook's office-hours disposition.

## User-input blocker (Step 6) — escalation set non-empty

This fires when any member of the set is present: an `opus-fixable` or
`needs-human` residue item (a `script-verifiable`/`needs-browser` FAIL or a
`needs-human-judgment` item that classified `needs-human` — i.e. it did **not**
classify `needs-main` or `already-satisfied`), OR any
non-residue blocker — a malformed or empty triage plan (Step 3 plan
validation), the pre-QA acceptance check failed (a bug needing a plan-mode fix,
Step 3b), the Chrome extension unavailable so browser items could not run (Step
3c), a multi-app demo choice (Step 1), or the `origin/main` merge conflicted
(Step 0.5). A `needs-main`-class residue item is **not** a member — it was filed
as a follow-up in Step 3.6 and does not, on its own, trigger this blocker. An
`already-satisfied`-class residue item is likewise **not** a member — it was
dropped as PASS by the Workflow (absent from `result.dispositions`) and does not
trigger this blocker.

Do **not** apply `dispatch:qa-done`. Escalate per the **Escalation** section
below and **stop**.

The "unexpected permission prompt" blocker needs no explicit handling — if one
fires mid-run, `dispatch-input-block.sh` already applies `dispatch:office-hours`
to the issue and passes the baton (spawns the next tick) while this session
stays blocked on the prompt.

## Escalation section — outcome-envelope count sourcing

On a user-input blocker, do **not** write the `phase-completed` marker. This is a
deliberate office-hours park: before the `dispatch-mark-deviation` call, perform
the in-session recommend step — see
`.claude/skills/dispatch-propagate/escalation-recommend.md`. Instead of the
completion marker, call `dispatch-mark-deviation` so the Stop hook can surface the
reason in the office-hours comment. The Stop hook (`.claude/hooks/dispatch-stop.sh`) reads
marker-absence as Branch A and applies `dispatch:office-hours` to the **issue**,
parking it for the office-hours queue (`/office-hours` runs the user-input
residue).

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
  "/qa-fix: QA needs a human (judgment item, bug, or failed pre-QA check); escalating to office-hours"
```

Tailor the reason text to the blocker that actually fired (malformed/empty triage
plan, `needs-human-judgment` item, `script-verifiable`/`needs-browser` FAIL, failed
pre-QA check, Chrome extension unavailable, multi-app choice, merge conflict, **the
qa-fix attempt cap reached on opus-fixable residue**, or **a planner scope-deviation
on the opus-fixable residue** — pass `result.fix_plan.deviation_reason` for the
latter).

**Then emit the outcome envelope** (contract:
`.claude/docs/outcome-envelope.md`). This call runs **sandboxed** —
`dispatch-emit-outcome` is pure, so do **not** pass `dangerouslyDisableSandbox`.
It must fire **before** the session stops; order relative to
`dispatch-mark-deviation` does not matter. Pass `--disposition escalated` and
`--terminated-reason` set to the **same tailored reason string** passed to
`dispatch-mark-deviation` above.

This Escalation section is the funnel for **two kinds** of escalate route, which
differ in whether the Step-3.5 Workflow ran — source the counts accordingly:

- **Step-3.5 ran** (the Step-3.7 escalate-finalize path: cap reached,
  scope-deviation, planning-failed, or fix-pass-landed-nothing) — `result` is in
  scope. Use
  `result.findings_surfaced` / `result.findings_actionable`; `fixes-applied 0` and
  `followups-filed` = the Step-3.6 newly-filed count (the escalate path applied no
  fixes); `subagents-launched` = `SKILL_SUBAGENTS + result.subagents_launched`.
  On the **fix-pass-landed-nothing** escalate, `SKILL_SUBAGENTS` includes the `k`
  `/implement-unit` invocations the loop forked this pass (`+ k`) — the faithful
  counter reports them even though no unit landed; this is a correction over the
  old Step-3.5-ran escalation formula, which had no Step-3.7 term.
- **An early blocker before Step 3.5** (Step 0.5 merge conflict, Step 1 multi-app,
  Step 3 malformed/empty plan, Step 3b acceptance fail, Step 3c Chrome
  unavailable) — `result` is **absent**. Pass `--findings-surfaced 0
  --findings-actionable 0 --fixes-applied 0 --followups-filed 0` and
  `--subagents-launched <SKILL_SUBAGENTS>`. The counter reports exactly what was
  forked before the blocker: a Step 0.5 / Step 1 blocker that forked nothing yields
  `0`; a Step 3/3b/3c blocker fires after the Step-2b triage forked, yielding `1`.
  Note the **Step 0.5 fork-then-conflict** case: when the Step 0.5 fallback fork
  was taken and *then* hit a merge conflict, `SKILL_SUBAGENTS` is `1`, because the
  fallback fork ran before the conflict — a correction over the old rule, which
  reported `0`.

qa-fix keeps **no** merge base, so **omit** `--base-sha`. Derive `repo` from the
local remote (read-only git, sandbox-safe). On the node lane (`TARGET_KIND=node`)
pass `--node-id "$N"` and omit `--issue`; on the legacy issue lane
(`TARGET_KIND=issue`) keep `--issue "$N"` and omit `--node-id`:

```bash
REPO=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
if [[ "$TARGET_KIND" == node ]]; then
  id_arg=(--node-id "$N")
else
  id_arg=(--issue "$N")
fi
# tool_denials / denied_commands are always in the record and are DERIVED by the
# script from this session's transcript — pass no flag for them.
.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome \
  --phase qa --repo "$REPO" "${id_arg[@]}" --pr "$PR_NUM" \
  --findings-surfaced <result.findings_surfaced, or 0 if Step 3.5 did not run> \
  --findings-actionable <result.findings_actionable, or 0 if Step 3.5 did not run> \
  --fixes-applied 0 \
  --followups-filed <Step-3.6 newly-filed count, or 0> \
  --subagents-launched <SKILL_SUBAGENTS + result.subagents_launched when Step 3.5 ran; else SKILL_SUBAGENTS> \
  --disposition escalated \
  --terminated-reason "<the same tailored reason string passed to dispatch-mark-deviation>"
```

Then **stop**.
Marking a deviation is **terminal** for the walkthrough — do not restart the QA
server or re-run the walkthrough after escalating.
