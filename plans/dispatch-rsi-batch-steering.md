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

<!-- S-15a..S-15d were recorded retroactively, after S-15. They precede it
     chronologically and are placed in message order here. -->

## S-15a — No parks were expected; interview to resolve them (discharged)

> There are not expected to be any parked decisions needed from the author for
> this batch. Interview me now to resolve all parks. Before parking any
> decisions apply the same triage as when executing code-review: does this
> really require author input - is it a doctrine ambiguity or just an
> implementation detail?

The premise was **false** and saying so was the substance of the reply: parks
existed. The interview that followed produced Rulings 1–7 in
`plans/dispatch-rsi-author-rulings.md`, which is where its output lives. The
second sentence extends S-13's triage from review findings to *every* park
decision — the bar for parking is the same bar as for forwarding an "author
call", and it is high.

## S-15b — Resume prompt restating the review gate (standing) — restates S-10/S-11

A session-resume prompt that re-issued the two binding rules by name rather
than adding new ones:

> Every PR in this batch must get `/code-review high --fix --comment` run
> against it as a DETACHED process before it merges. […] NEVER enable
> auto-merge before the review has settled: that is exactly how PR #3140 merged
> unreviewed.

It also fixed the four retroactive targets as squashed-diff rev-ranges —
`77bd7471~1..77bd7471` (#3140), `96d22cb1~1..96d22cb1` (#3138),
`a4a964b8~1..a4a964b8` (#3136), `478cc324~1..478cc324` (#3134) — and recorded
why reopening is not an option: GitHub cannot reopen merged PRs and all four
head branches are deleted on origin.

Its operational traps are binding and are repeated here because they have each
already cost real time:

- `LC_ALL=C grep -a` under `intentions/` — one node carries a NUL byte that
  silences plain `grep`'s line output (exit status and `-c`/`-l`/`-q` stay
  correct, which is what makes it easy to miss).
- Never `git stash` — see the safety constraints below.
- Run `run-lint.sh` and `run-typecheck.sh` only **after** committing; they diff
  `origin/main...HEAD` and are vacuous on uncommitted work.
- Write shell scripts to files under `/tmp/claude-1000/` and `bash` them; a
  worktree-isolated session refuses inline compound commands and redirects.

## S-15c — Reload a skill lost to compaction (discharged)

> reload the /batch skill that appears to have been lost during compaction. Act
> on the tasks that completed during compaction.

Two obligations, not one: restore the lost instruction context, **and** drain
the agent results that arrived while it was gone. Completed work that is never
collected is indistinguishable from work never done.

## S-15d — Verify the detachment claim, don't assert it (discharged)

> confirm that that code review can run as a background task and not as a
> detached process. Won't it be killed on the 5-min background task timeout?

A correct challenge to an unproven assumption, answered by measurement rather
than assertion. `dispatch-code-review` launches through `setsid` and `disown`
(and hard-fails if `setsid` is absent — "there is no synchronous fallback"), so
the review child is a **different session leader** from the shell that launched
it and signals to the Bash job's process group stop at that boundary. What gets
backgrounded is only the await wrapper, a poll loop; killing it costs nothing,
because run state lives outside the worktree and re-invoking with identical
arguments re-attaches. The standing lesson is the method: verify a survival
claim with session IDs, never with confidence.

## S-15 — "File for ratification" means ship it, not defer it (standing) — QUALIFIES S-13

> "Filing for ratification" mean executing the change using your best judgement,
> then filing for ratification when the whole batch is done. If the behavior
> change is the scope of the PR, then you have the authority to bypass the
> integrity check.

S-13 said to triage every "author call" and keep a ratification list. This
corrects how that list was being used: it is a **record of what was already
done**, never a queue of work held back pending approval. The executor decides
and ships; the author confirms afterward.

Second clause, narrower and more consequential: when the behavior change **is
the scope of the PR**, the executor may bypass the test-integrity check — that
is, may rewrite a test assertion that pins the *old* behavior. This is a real
carve-out from `.claude/rules/test-integrity.md`, which otherwise forbids
touching a failing or blocking assertion. It is bounded by its own precondition:

- The behavior change must be **what the PR is for**, not a side effect
  discovered while doing something else. A test that blocks an incidental
  cleanup still wins.
- The replacement assertion must assert the **new correct behavior positively**
  and be at least as strong as the one it replaces. Deleting the case, skipping
  it, or loosening it to "does not crash" is still forbidden — the rule against
  weakening a test to make CI green is untouched.
- Say plainly in the commit which assertion changed and why the precondition
  holds.

First application: deleting `graph-commit`'s interim list-entry removal guard
and rewriting the "far-ahead list-entry removal" case in `test-graph-commit.sh`,
which today asserts the park the deletion removes. The guard's own header names
its deletion condition, and that condition is met
(`tactic-node-merge-list-removal-loss` is `phase: done`; `threeWayList` is
base-aware).

## S-16 — Ratification is a NOTE, never a gate (standing) — RESTATES S-15

> remember: filing for ratification means you do the thing without me providing
> approval, and then just note it for me to review later

Issued after S-15 was violated again, so the failure mode is worth naming
precisely rather than restating the rule. Both violations took the same shape:
a finding was correctly triaged as needing author judgement, and the *decision*
was then deferred along with the note. That is the error. "File for
ratification" splits into two independent halves that must not travel together:

1. **Do the thing now**, on best judgement. No approval is sought, and none is
   waited for. Executing is not contingent on the note.
2. **Write it down** for review after the batch completes.

The second violation is the clearer illustration. The `dispatch-fleet-alarm`
review finding was written up in a commit message as "the fix is either the
deferred shared extraction or narrowing that claim, and choosing between them is
a design call rather than a defect repair. Filed for ratification." Every word
of that triage was right, and the conclusion drawn from it was still wrong: a
design call is exactly what the executor is expected to make. The correct
handling was to choose the owned-region extraction, implement it, and record the
choice — which is what then happened.

**The tell:** if the ratification list contains anything the author would have
to act on before work can continue, the rule has been broken. It is a record of
decisions already made and shipped, not a queue. A reader of that list should be
able to disagree with an entry and file a follow-up, never discover that
something has been sitting unbuilt awaiting their word.

---

## S-17 — The stopping check covers rate and quality, not just parallelism (standing) — EXTENDS S-9/S-12

> whenever stopping, in addition to running a check for parallelization
> opportunities (existing guidance) also evaluate efficiency/efficacy of batch
> execution more generally and act on opportunities to self steer to improve
> rate and quality of progress.

S-9 and S-12 made the parallelism check a hard gate at every stop. S-17 widens
that gate: parallelism is one lever among several, and on this batch it is
frequently the *wrong* one — graph landings serialize on a global lock, so
adding agents to them buys nothing (see "Parallelism cannot beat `graph-commit`
invocation count" in `plans/dispatch-rsi-sequence.md`).

**"Act" is the operative word, and "self steer" means write it down.** A
stopping check that produces observations and no change is the failure this
instruction corrects; so is one that reports an improvement to the author
instead of making it. At every stopping point, run the S-9 parallelism check,
then these three, and land whatever they turn up:

- **Rate.** What actually took longest, and what was the binding constraint —
  invocation count, a serialized gate, re-measuring something already measured,
  or a decision left un-ruled that standing authority already covers?
- **Quality.** What went wrong or nearly went wrong, and is the guard against a
  repeat durable, or does it live only in the conversation?
- **Steering.** Where would a written steer pay most, and in which durable home:
  this file for batch conduct, `.claude/rules/` for repo-wide practice, a memory
  file for cross-session judgement, `plans/dispatch-rsi-sequence.md` for how to
  execute this specific window.

The operating detail this produced lives in `plans/dispatch-rsi-sequence.md`
under "The stopping check — parallelism first, then rate and quality", so the
executor reads it from the index it already reads first.

---

## Safety constraints held throughout (self-imposed, not author-issued)

Recorded here so they survive with the rest, and because violating any of them
would damage state outside this session.

**Each carries its SOURCE and SCOPE**, because a prohibition carried forward
without both becomes indistinguishable from a standing author rule at the next
compaction — and one item on this very list was wrong for exactly that reason
(see the struck bullet below). Source is one of: author instruction, project
rule, an executor-written subagent prompt, or inference. Scope is one of: this
subagent, this worktree, this session, global.

- **Never `git stash`** in a shared worktree — the stash stack is global across
  worktrees and other live sessions may pop it. Every subagent brief carries this.
  *(Source: project rule, `.claude/rules/sandbox.md` and the environment brief.
  Scope: global.)*
- ~~**Never run `mint-mainqa-nodes`** outside a throwaway repo with a stubbed
  remote — it fetches and pushes to the real repository.~~ **REFUTED 2026-08-30.
  Source: an executor-written read-only subagent prompt. Scope: that subagent —
  never the executor.** It was carried onto this list by mistake and nearly
  blocked PR5a Unit 7 outright. The tell was in the prompt it came from: the
  same block also forbade `graph-commit`, `write-node.ts`, `clear-park`,
  `park-node`, `transition-node` and `git push`, every one of which the executor
  had been running all session under the authority in
  `plans/dispatch-rsi-sequence.md`. A prohibition naming one script while the
  same list forbids sibling tools you are demonstrably using under authority was
  scoped to a different actor. The real property is unremarkable and shared by
  every graph tool here: `mint-mainqa-nodes` fetches and pushes to the real
  repository, which is what it is *for*. Kept struck rather than deleted so the
  next reader sees the failure mode, not just its absence.
- **Never commit `.claude/agents`** — a documented phantom, always untracked. Use
  explicit per-file `git add`; never `git add -A` or `git add .`.
  *(Source: inference from the persistent untracked entry. Scope: global.)*
- **No file edits in the worktree while a detached `--fix` review is running** —
  every subagent spawned during a run carries an explicit read-only warning.
- **Closing keywords** (`close/closes/closed`, `fix/fixes/fixed`,
  `resolve/resolves/resolved`) may appear only on deliberate `Closes #N` lines;
  GitHub scans the whole body, so a keyword next to any other `#N` fires.
- **Never push to main/master, never force-push, never merge by hand.**
  *(Source: project rule / environment brief. Scope: global. Note this does NOT
  forbid `graph-commit`, which lands node edits on `main` by design and is
  granted in the authority section.)*
