# Steering directives for this batch — verbatim, with status

Every instruction the author has used to steer execution of the dispatch/RSI
serialized window, in order. **Standing** items govern all future turns and
survive compaction; **discharged** items were one-off and are recorded for
provenance. Nothing else in this session is a user instruction — every other
input has been an automated background-task notification, which explicitly is
not user input and is not approval or consent.

---

## S-1 — The batch charter (standing)

> Execute the dispatch/RSI window serial PR sequence.
>
> Entry point: `plans/dispatch-rsi-sequence.md` (read it fully first — it is the
> index: current state, execution order, hard ordering constraints, and the
> "Batch execution authority — granted 2026-08-29" and "Parallelism, for a batch
> executor" sections that govern how you run). Per-PR executable detail:
> `plans/dispatch-rsi-serialized-pr-plan.md` — every section there is
> clean-session-executable; each unit carries a *Model:* tag naming the subagent
> model to implement it with.
>
> Start at the position the index's "Where this stands" table marks Next
> (currently Position 1 — PR18) and proceed strictly in position order. All
> author gates are discharged and four standing grants are recorded in the
> authority section — auto-merge each PR on green, resolve graph/planning
> bookkeeping yourself, and do not stall waiting on the author. Park to
> office_hours only for genuine ambiguity the docs don't rule.

Derived reading, still in force: the index's "Parallelism, for a batch executor"
section **overrides** the generic batch template. Merges land one at a time in
position order; two PRs of the same bundle never overlap. Parallelism is applied
*within* a PR across units with disjoint files, plus unlimited **read-only**
research agents pre-staging future positions.

## S-2 — Verify plan provenance (discharged)

> confirm the plan you are working from is synced with origin/main

## S-3 — Resume after a lost monitor (discharged)

> I don't see the CI monitor. Pick up where you left off.

## S-4 — Red CI on main is in scope (standing)

> Debug and fix failing ci on main as part of this batch of work

Not merely "get this PR green" — the blind spot that let main go red is batch
work too.

## S-5 — Parallelize and protect main-thread context (standing)

> use subagents to parallelize work and manage main thread context wherever
> possible

## S-6 — Look for concurrent work (standing, later hardened by S-9/S-12)

> Is there any other work that can be executed concurrently?

## S-7 — Never stop without a wake-up armed (standing)

> Before stopping always make sure there is some task running that will wake you
> up to continue progress once it completes. For each 5-hour token reset window,
> make sure you are running something that will wake you up in case you run out
> of tokens.

## S-8 — Prove the cron can't race itself (discharged)

> Confirm that the cron strategy won't create racing sessions

## S-9 — Check for parallel work before every stop (standing)

> Before stopping always check if there are additional tasks that can be run in
> parallel subagents

## S-10 — Every PR is gated on a detached code review (standing) — QUALIFIES S-1

> For each PR in this batch, before merging, execute `/code-review high --fix
> --comment`. It cannot run directly in session it must run as a detached
> process - look at how the dispatch ladder does this for an example. Run this
> retroactively for any PR that has already merged (recommend how to do so,
> either re-open PR or create a new PR for the fixes)

This **narrows S-1's auto-merge grant**: auto-merge must not be armed until the
review has settled. PR #3140 merged unreviewed precisely because auto-merge was
armed before this rule existed — do not repeat it.

## S-11 — One PR for all retroactive review (standing)

> you can create one PR for all retroactive review

## S-12 — The parallelization check is a hard gate (standing) — reinforces S-9

> Are you checking for parallelization opportunities before each stop?

Asked because I had not been rigorous about it. Treat S-9 as a gate that must be
executed before every stop, not an aspiration.

## S-13 — Do not rubber-stamp an "author call" (standing)

> Whenever a review returns an "author" call, consider whether it really requires
> author input - does in draw an ambiguity in the graph doctrine, or is it an
> implementation detail. In either case, act on your best judgement and keep a
> list of anything that needs author ratification when the batch is complete.

Triage every deferred finding: doctrine ambiguity vs implementation detail. Act
either way. Accumulate genuine doctrine questions in the ratification list
(`AUTHOR-RATIFICATION-LIST.md`) for the end of the batch. A reviewer calling
something an "author decision" is an opinion to be tested, not a routing order.

## S-14 — Preserve the steering record (standing)

> Write a list of the points I've used to steer batch execution in this session
> so far so that they are not lost during compaction.

This file. Keep it current as new directives arrive.

---

## Safety constraints held throughout (self-imposed, not author-issued)

Recorded here so they survive with the rest, and because violating any of them
would damage state outside this session:

- **Never `git stash`** in a shared worktree — the stash stack is global across
  worktrees and other live sessions may pop it. Every subagent brief carries this.
- **Never run `mint-mainqa-nodes`** outside a throwaway repo with a stubbed
  remote — it fetches and pushes to the real repository.
- **Never commit `.claude/agents`** — a documented phantom, always untracked.
- **No file edits in the worktree while a detached `--fix` review is running** —
  every subagent spawned during a run carries an explicit read-only warning.
- **Closing keywords** (`close/closes/closed`, `fix/fixes/fixed`,
  `resolve/resolves/resolved`) may appear only on deliberate `Closes #N` lines;
  GitHub scans the whole body, so a keyword next to any other `#N` fires.
- **Never push to main/master, never force-push, never merge by hand.**
