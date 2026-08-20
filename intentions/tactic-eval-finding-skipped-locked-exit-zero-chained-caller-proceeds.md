---
id: tactic-eval-finding-skipped-locked-exit-zero-chained-caller-proceeds
kind: tactic
statement: skipped-locked and skipped-in-flight are documented lost writes but
  exit 0 like landed and noop, so a caller chaining on exit status proceeds as
  if the write succeeded — one --resolved-by loss let the chained --retire
  retire an entry with no resolved_by
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
blocked_by:
  - tactic-eval-finding-in-flight-guard-permanent-after-execution-completes
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: lost-writes-passed-as-success
      value: 1
      unit: writes
      window: single-run
      sensor: dispatch-eval-finding stdout
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: dispatch-eval-finding stdout
      measured: 2026-08-14
---

Recorded 2026-08-14 from a write that was actually lost during the PR #3090
retirement run, not from a hypothesis. The concrete instance was recovered by
hand; the shape that allowed it was not. Planned 2026-08-19; the diagnosis below
is the original finding, re-anchored to the line numbers measured in this
worktree at `origin/main` 9ce15363, with the greenfield question the finding
left open now decided (see "The design decision").

## Context

### The defect

`skipped-locked` is documented honestly. The stdout-protocol block at
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:208-211` states
it is "a LOST occurrence, not a deferred one" — nothing was read, nothing was
written, and nothing will re-invoke. `skipped-in-flight` at `:212-221` says the
same thing in the same words ("this is a LOST occurrence … not a deferred one").

But both **exit 0**, and so does `landed`, and so does `noop`. The token carries
the whole signal; the exit code carries none of it. A caller that branches on
exit status — every caller that uses `&&`, `set -e`, or an unchecked sequential
invocation — proceeds as though the write succeeded.

Four sites emit a lost-write token and then `exit 0` (verified in this tree):

```
dispatch-eval-finding:942-943    skipped-locked    bounded-wait mutex exhausted
dispatch-eval-finding:980-981    skipped-in-flight --retire guard
dispatch-eval-finding:1048-1049  skipped-in-flight --resolved-by + --body-file guard
dispatch-eval-finding:1210-1211  skipped-in-flight the recurrence-record path
```

and two copies of the contract assert the four-outcomes-on-zero rule:

```
dispatch-eval-finding:197-201  "# Exit codes: as dispatch-fleet-alarm — 0 landed/no-op/skipped-locked/
                                # skipped-in-flight, 1 the graph write failed (rolled back), 64 usage, …"
dispatch-eval-finding:298-300  usage() heredoc: "exit: 0 landed / no-op / skipped-locked / skipped-in-flight, …"
```

### The evidence

While recording resolutions for the fourteen slugs of PR #3090, the pair for
each slug was run as `--resolved-by … && --retire`. On
`eval-since-bound-excludes-worker` a concurrent writer held the graph-write
mutex:

```
--resolved-by 1092a403…  → skipped-locked   (exit 0; nothing recorded)
--retire                 → landed           (ran because && saw exit 0)
```

The entry was retired to `phase: done` carrying **no `resolved_by` at all** —
the one field `--list-retirable` filters on, permanently absent on an entry that
can no longer appear in that list because it is already retired. Re-running
`--resolved-by` alone recovered it (`landed`), but only because the token was
read by eye in the transcript.

`/rsi` — the principal caller — is spawned fire-and-forget by
`dispatch-ladder-run` with its transcript discarded. It cannot read the token by
eye, which is the only way the loss is currently detectable.

### Why PR #3090's precedent does not cover it

PR #3090's Unit D drew exactly this distinction one level up: it split the
in-flight refusal out of `noop` into its own token, `skipped-in-flight`, so a
caller could tell "your intent was satisfied" from "nothing was recorded". That
fixed the **token**. It left the **exit code** undiscriminating. Four outcomes,
two of them documented losses, one exit code. That the loss survived Unit D's
pass on the neighbouring token is the argument for changing the exit code rather
than writing more prose.

### Blast radius, measured

No committed script invokes `dispatch-eval-finding` programmatically. Every
caller is a model-driven skill that runs it through Bash — `.claude/skills/rsi/SKILL.md`
(`:213`, `:233`, `:275`), `.claude/skills/rsi-audit/SKILL.md` (step 6, `:175`),
and `.claude/skills/dispatch-ladder/SKILL.md:404` (which cites `--list` only). A
grep for a `&&` chain in any skill body found none: the loss that motivated this
node came from an ad-hoc hand-run pair, not from committed automation. So the
contract change breaks nothing that exists today, and it hardens the surface
against the manual pattern that already cost one write plus every future
programmatic caller. That measured emptiness is why this is a cheap change, not
a risky one.

## The design decision

Two judgments the finding left open, both decided here.

### 1. Where the contract belongs (greenfield first)

**The ideal design.** The discriminating exit is a property of the
**find-or-recur write surface contract**, not of one script. Condition 20 of
`strategy-recursive-self-improvement` requires exactly one such surface in the
repo, and clarification 62 records that its carrier — `tactic-finding-search-all-producers`
— is where the five private writers consolidate. That surface's contract should
read:

- **stdout** names the *cause* — `landed`, `noop`, `skipped-locked`,
  `skipped-in-flight`, and whatever the consolidated surface adds.
- **exit status** answers exactly one question, the one a chaining caller asks:
  *was anything recorded?* `0` yes; `3` no, and nothing will re-invoke; `1`/`64`/
  `69`/`70` the write was attempted and failed.

A caller must never need to parse stdout to learn that its write was lost.

**Why this plan still patches `dispatch-eval-finding` today.** Four reasons, and
the plan takes the brownfield step deliberately rather than deferring:

1. `tactic-finding-search-all-producers` is `status: raw`, `phase: null` — a
   draft with no plan and no date. Deferring means the live loss stands for an
   unbounded interval.
2. Condition 9 of the serving strategy states its own scope explicitly: "the
   bound outlives the current writer." A standing bound is satisfied by the
   current writer *now* and inherited by the successor, not held in escrow for
   it.
3. `dispatch-eval-finding` is the live, sole writer both `/rsi` and `/rsi-audit`
   call. It is the correct file to patch today, for the same reason the sibling
   node reached the same conclusion in its own out-of-scope note.
4. Installing it now converts the requirement from prose into a **test-locked,
   source-ratcheted property** (Unit 2's case). The consolidation must then
   carry a green assertion forward rather than re-derive a doctrine sentence —
   which is precisely the failure mode ("findings in prose only") this strategy
   already names.

**Instruction carried to `tactic-finding-search-all-producers`** (this node
authors no graph write; the instruction is recorded here for whoever plans that
node): when the one shared find-or-recur surface is built, the exit contract
above is a REQUIREMENT ON IT, not an artefact of the writer being replaced. The
ratchet assertions Unit 2 adds are the mechanical statement of that requirement;
migrating them is part of the consolidation, and dropping them re-loses this
finding.

### 2. Scope: `dispatch-eval-finding` only, and the divergence is recorded

`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm` also emits
`skipped-locked` and exits 0 (`:113-127`, `:554-555`), and this script's header
cites it verbatim ("Exit codes: as dispatch-fleet-alarm"). **Fleet-alarm is
deliberately left alone.** Its skip is a *deferred* occurrence, not a lost one:
its callers are 2–5 minute systemd timers, it takes the mutex non-blocking on
purpose (`dispatch-fleet-alarm:113-120`), and "the caller re-derives its whole
reading from scratch next pass". Exit 0 is honest there. It is dishonest here
only because this script's caller is fire-and-forget with no next pass — which
is already recorded as DIVERGENCE 3 in this file's header (`:96-100`).

So the change is a **fourth divergence**, and the file already has the
convention for recording one. Adding it repairs the "as dispatch-fleet-alarm"
claim at `:197` in the same edit, rather than leaving a header that now
misstates the sibling relationship.

### 3. One code, not two

Both lost-write tokens get the **same** new code, `3`. The exit code answers one
question — was anything recorded — and the *cause* is stdout's job; the whole
defect being repaired is a status that tried to carry cause and carried nothing.
Two codes would invite callers to branch on cause via status, duplicating
stdout and re-creating the drift. `3` is chosen over an invented number because
`packages/intentionsutil/scripts/park-node:362` and
`packages/intentionsutil/scripts/clear-park:342` already use exit 3 in this
script family for "a documented no-op; nothing was written" — the identical
shape. Verified free here: `dispatch-eval-finding` occupies only 0, 1, 64, 69
and 70 today.

## Sequencing — read this before writing any diff

`tactic-eval-finding-in-flight-guard-permanent-after-execution-completes` is at
`status: codified`, `phase: implement`, finalized 2026-08-19 (commit 9ce15363),
with a landed multi-unit plan that rewrites **exactly** the lines this node must
touch:

| file | that node's edit | this node's edit |
|---|---|---|
| `dispatch-eval-finding:978/1046/1208` | replaces the predicate with a `node_fix_in_flight` helper and a capture-then-`case` form at each site | changes `exit 0` → `exit 3` at those same sites |
| `dispatch-eval-finding:131-142`, `:212-221` | rewrites the in-flight prose | rewrites the neighbouring exit-code prose at `:197-201` |
| `test-dispatch-eval-finding.sh` cases (8)/(8b)/(15)/(16) | edits/extends them | flips their `RC` assertions |
| `rsi/SKILL.md:256-266`, `rsi-audit/SKILL.md:184` | redefines "in-flight" | rewrites the exit-code sentence in the same paragraphs |

That plan explicitly preserves "each site's existing stderr message and
`skipped-in-flight` stdout token verbatim" — so it does **not** fix the exit
code, but it does churn every line this node touches. Textual conflict is
near-certain if both land concurrently.

**Disposition: this node is sequenced SECOND.** The implementing session must,
before writing anything:

1. Merge `origin/main` into its branch and confirm the sibling's change is
   present — `grep -c node_fix_in_flight .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`
   returns ≥ 4 once it has landed.
2. If it has **not** landed yet, stop and park to office-hours rather than
   racing it. Rebasing this small diff onto that one is trivial; reconciling two
   independent rewrites of four `case` blocks and four prose paragraphs is not.
3. Re-anchor every site **by its quoted text, never by the line number in this
   plan** — the sibling's edit shifts all of them, and its
   capture-then-`case` form places `exit 0` on the same line as the token
   (`printf 'skipped-in-flight\n'; exit 0 ;;`) rather than on the next line.

A `blocked_by` edge to that node is the correct graph expression of this
ordering. **It has been recorded**: this node's frontmatter carries
`blocked_by: [tactic-eval-finding-in-flight-guard-permanent-after-execution-completes]`
as of the 2026-08-19 finalize round, so the router will not select this node
until the sibling reaches `done`. Step 1 of Verification below is the
belt-and-braces re-check for a session that reaches the code anyway.

### Scope boundary — what this change does NOT close

(Recorded 2026-08-19 /align-tactics round, from the drift review's Side-B
premise sweep. Stated here because the plan cites condition 9 as its
justification and must not be read as discharging it.)

This remedy makes the lost write **legible** to a chained caller. It does not
make the occurrence **survive**. After `exit 3` ships, `skipped-locked` still
drops the occurrence and the recurrence figure is still understated by it — the
caller now *knows*, which is strictly better than the silent success it gets
today, but knowing is not recording.

So `strategy-recursive-self-improvement` condition 9 — "a writer that cannot
take the graph-write lock must not skip-and-warn when its caller is a detached
job that nobody will re-invoke" — remains only **partially served** after this
node completes. What serves it so far:

- the bounded wait (`tactic-eval-finding-lock-wait`, phase `done`), which
  converts most contention into a successful late write rather than a loss; and
- this node's discriminating exit, which makes the residual loss detectable by
  the caller rather than only by a human reading a discarded transcript.

What stays **owed**: a durable retry or spool that makes the occurrence itself
survive lock-wait exhaustion. That is explicitly **out of scope here** — it is a
different mechanism with its own storage and replay questions, not a larger
version of this diff. Scoping it out is a deliberate decision, not a claim that
condition 9 is closed. A session that later builds the shared find-or-recur
surface (see §1 above) is the natural place to settle it; whoever does should
record it as its own tactic rather than folding it onto this node.

### Intended outcome

A caller can tell a lost write from a landed one without parsing stdout;
`--resolved-by … && --retire` becomes safe by construction; and the requirement
is locked by a source ratchet that the eventual shared-writer consolidation must
carry forward rather than re-derive.

---

## Unit 1 — give the two lost-write tokens a discriminating exit code

**Recommended model:** opus (the code change is four literals; the work is the
contract judgment and the reconciliation of three prose blocks in a
doctrine-dense header where a stale sentence is itself the class of defect this
node exists to stop).

**Dependencies:** none within this plan, but see "Sequencing" above — the
sibling node must have landed on `origin/main` first.

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`.

1. **Define the code once, near the top-of-script configuration** — alongside
   `SLUG_RE` / `SLUG_MAX` / `SERVES_RE` (`:265-269`), not in `lib.sh` (which is
   `cp`-ed standalone by ~17 CI fixtures and must stay copyable):

   ```bash
   # A LOST WRITE: this pass recorded NOTHING and nothing will re-invoke it.
   # Distinct from 0 (something was recorded, or the intent was already
   # satisfied) and from 1/64/69/70 (the write was attempted and FAILED).
   # stdout still names WHICH loss — the exit code answers only "was anything
   # recorded?", which is the question a chaining caller asks. Value 3 matches
   # packages/intentionsutil/scripts/park-node:362 and clear-park:342, this
   # script family's existing code for "a documented no-op, nothing written".
   readonly EXIT_LOST_WRITE=3
   ```

2. **Change the four emit sites** to `exit "$EXIT_LOST_WRITE"`, leaving every
   `printf` token and every stderr `log` line **byte-identical**. Locate each by
   its quoted stderr text, not by line number:
   - `:942-943` — after `log "another graph writer still holds … THIS OCCURRENCE
     WAS NOT COUNTED AND IS LOST …"`, `printf 'skipped-locked\n'`.
   - `:980-981` — `--retire`, after `"… refusing to complete it mechanically;
     NOTHING WAS RECORDED, this retirement is LOST, not deferred …"`.
   - `:1048-1049` — `--resolved-by` + `--body-file`, after `"… would rewrite its
     body, staling that session's scope stamp — NOTHING WAS RECORDED …"`.
   - `:1210-1211` — the recurrence path, after `"… THIS OCCURRENCE WAS NOT
     COUNTED; re-record it after that work lands"`.

   Do **not** touch the `noop` exits (`:970`, `:1038`, `:1190`, `:1280`) or any
   `landed` exit: `noop` means the caller's intent was already satisfied, which
   is a success and stays 0. That asymmetry is the entire content of the change
   and must be stated in the header (below).

3. **Reconcile the header exit-code block** at `:197-201`. It currently opens
   "as dispatch-fleet-alarm" and lists four outcomes on 0. Rewrite to:

   ```
   # Exit codes (DIVERGENCE 4 from dispatch-fleet-alarm — see above):
   #   0   landed, or noop: something was recorded, or the caller's intent was
   #       already satisfied.
   #   3   a LOST WRITE: skipped-locked or skipped-in-flight. Nothing was read,
   #       nothing was written, and NOTHING WILL RE-INVOKE THIS PASS. stdout
   #       names which. This is not a script failure — it is a refusal that a
   #       caller chaining on status must not mistake for success.
   #   1   the graph write failed (rolled back).
   #   64  usage.  69  environment.
   #   70  the write failed AND the rollback left a dirty intentions/<id>.md
   #       (escalate, never retry; the log line names the exact `git checkout --`).
   ```

   Keep the `70` escalation wording verbatim.

4. **Add DIVERGENCE 4 to the divergence block**, immediately after DIVERGENCE 3
   (which ends around `:100`), in the same voice as 1–3:

   > **DIVERGENCE 4 — A LOST WRITE EXITS NON-ZERO.** Fleet-alarm's
   > `skipped-locked` exits 0 correctly: its skip is DEFERRED — a systemd timer
   > re-fires a minute later and re-derives the whole reading. Divergence 3
   > already records why that is false here: this script's caller is spawned
   > fire-and-forget and has no next pass, so a skip is a LOST occurrence. An
   > exit code that cannot be told apart from success is the same defect one
   > layer down, and it has fired once for real — a `--resolved-by … &&
   > --retire` pair retired an entry with no `resolved_by` because `&&` read
   > exit 0 from a lock loss (PR #3090's retirement run). So the two lost-write
   > tokens exit `EXIT_LOST_WRITE` (3) and the successful ones exit 0. stdout
   > still carries the cause; the exit code carries only "was anything
   > recorded", which is the one question `&&` and `set -e` actually ask.

   **Also update the divergence COUNT.** The block is introduced at `:27` by
   the line `# MODELLED ON dispatch-fleet-alarm, WITH THREE DELIBERATE
   DIVERGENCES` — verified present 2026-08-19. Adding a fourth without
   changing that word leaves the file asserting three while carrying four,
   which is precisely the shipped-rule-versus-stale-prose defect this node
   exists to stop, reproduced inside its own fix. Change `THREE` to `FOUR`.

5. **Reconcile the stdout-protocol block** (`:203-221`). Add one sentence after
   the `landed`/`noop` entries — "`landed` and `noop` exit 0; `skipped-locked`
   and `skipped-in-flight` exit 3 (see Exit codes above)" — and leave every other
   word of the four token definitions alone. The sibling node rewrites the
   `skipped-in-flight` entry's *condition*; this unit adds only the exit-status
   fact, so the two edits compose.

6. **Reconcile `usage()`** at `:298-300` — the second copy of the same contract
   — in lockstep:

   ```
   exit: 0 landed / no-op, 3 nothing was recorded (skipped-locked /
         skipped-in-flight — a LOST write, not a failure and not a success),
         1 graph write failed (rolled back), 64 usage, 69 environment,
         70 write failed and the rollback left a dirty node file.
   ```

**Out of scope for this unit:** `dispatch-fleet-alarm` (deliberately, per "The
design decision" §2 — its skip is deferred and exit 0 is honest there);
`dispatch-graph-main-red-sync`; any change to `list_entries`' `state` or
`in_flight` fields (`:452`, `:457` — the sibling node owns `in_flight`); the
in-flight *predicate* itself (same); any new stdout token; `lib.sh`'s
`graph_write_lock_acquire_wait` (`lib.sh:2306`, unchanged — the fix is purely in
how this caller reacts to its rc 1); and any graph write.

---

## Unit 2 — lock the new contract in the suite, both directions

**Recommended model:** sonnet (explicit assertions at named lines in an existing
harness; the fixture shapes and helper names are given verbatim below).

**Dependencies:** Unit 1.

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh`
(1068 lines and 177/177 assertions green at plan time, measured 2026-08-19 in
this worktree). Do not weaken, skip, or delete any existing assertion — per
`.claude/rules/test-integrity.md`, update the *expected value* where the
contract changed, and nowhere else.

Harness facts the implementer needs (no re-reading required):
`run_ef <ENV=v …> -- <SUT args>` (`:266-296`) sets `RC`, `SOUT` (stdout only)
and `OUT` (stderr+stdout); env overrides go **before** the `--`.
`assert_eq` / `assert_contains` come from `test-helpers.sh` (`:16`, `:41`);
`assert_not_contains` is defined locally at `:115-125`. `hold_lock()`
(`:511-526`) backgrounds a `flock` holder and busy-waits until the lock is
genuinely taken — reuse it as-is. The suite must keep ending with exactly one
`report_results` call (`:1066-1068`; it is the decision-log guard's only call
site).

1. **Flip the four `RC` assertions** whose expected value the contract changed.
   Each keeps its paired stdout-token assertion untouched — the token assertion
   is what proves the exit code did not swallow the cause:
   - `:436` `assert_eq "(8) in-flight entry exits 0" "0" "$RC"` → expects `3`;
     retitle to `"(8) in-flight entry exits 3 (a lost write, not a success)"`.
   - `:457` `(8b) --retire on an in-flight entry exits 0` → `3`.
   - `:561` `(13) a spent wait budget still exits 0` → `3`, retitled
     `"(13) a spent wait budget exits 3 — a lost write is not a success"`.
   - `:866` `(16) an in-flight entry refuses the BODY refresh` → `3`.

   Mirror the existing in-file convention for annotating a deliberate contract
   change: case (8) already carries a `# CONTRACT CHANGE (tactic-eval-finding-ledger,
   unit D2)` comment block at `:437-441`. Add the parallel block naming this
   node, stating that the token stayed and the status moved.

2. **Assert the negative half explicitly** — that the *successful* dispositions
   still exit 0, which is what makes the new code discriminating rather than
   merely different. These assertions already exist and must stay green with no
   edit; call them out by name in the case-index comment so a future editor sees
   the pairing: `(4)` identical-body recurrence (`:362`), `(5)` recurrence after
   retirement (`:389`), `(7)` `--retire` (`:421`), `(12)` contended-but-lands
   (`:541`), and `(16)`'s "re-stating the same resolution exits 0" (`:856`) —
   that last one is the sharpest, since it is a `noop` sitting one branch away
   from a `skipped-in-flight`.

3. **Add case (25) — a doctrine ratchet over the SUT source**, in the style of
   case (11) (`:495-509`), which does `SRC="$(cat "$SUT")"` and asserts on the
   text. Append after the last case, following the file's `# --- (N) title ---`
   convention:
   - `assert_contains` `'readonly EXIT_LOST_WRITE=3'` — the code is defined once
     and by name, not as a bare literal at four sites.
   - `assert_not_contains` on the SUT text of a lost-write token immediately
     followed by a zero exit. Compute it in-test the same way the verify fence
     below does:
     `LOSTZERO="$(grep -A2 "printf 'skipped" "$SUT" | grep -cE 'exit 0' || true)"`
     then `assert_eq "(25) no lost-write token exits 0" "0" "$LOSTZERO"`.
     Today that count is **4**, so the assertion is non-vacuous.
   - `assert_not_contains` `'0 landed / no-op / skipped-locked / skipped-in-flight'`
     — the `usage()` copy of the old four-on-zero contract is gone.
   - `assert_contains` `'DIVERGENCE 4'` — the divergence from fleet-alarm is
     recorded in the file that diverges, so the next reader of "as
     dispatch-fleet-alarm" is not misled.

   Note in the case body, for whoever consolidates the five private writers,
   that these four assertions are the mechanical form of the exit contract and
   must **move to the shared surface's suite**, not be deleted, when
   `dispatch-eval-finding` is retired as a writer.

4. **Update the case-index header comment** (`:19-86`), which restates the
   contract in prose three times and would otherwise contradict the shipped
   code — the exact defect class this node records. Lines to fix: `:34-35`
   ("(8) … records nothing, exits 0 skipped-in-flight"), `:53-56` ("(13) … still
   gets the `skipped-locked` disposition"), and `:75-79` (the (16) in-flight
   sub-case). Add the `(25)` entry.

**Out of scope for this unit:** any change to the SUT; any new test file; any
edit to `.github/workflows/unit-tests.yml` — `run-unit-tests.sh:88` sets
`RUN_PR_SCRIPTS=true` for any changed path under
`.claude/skills/dispatch-propagate/scripts/`, and its `:186-196` loop globs
`test-*.sh` from that directory, so both changed files are auto-discovered by
the `unit-tests` job with no workflow edit.

---

## Unit 3 — reconcile the two calling skills' exit-code prose

**Recommended model:** sonnet (prose edits at named lines, no logic).

**Dependencies:** Unit 1. Lands in the **same PR** as Units 1–2: a shipped
contract whose caller documentation still asserts the old rule is the
findings-in-prose-only failure this strategy names, and splitting it across PRs
recreates it.

**Scope.** Two files, prose only.

1. **`.claude/skills/rsi/SKILL.md`** — the fire-and-forget principal caller the
   finding names.
   - `:256-266`, the "Exit codes:" paragraph. It opens "`0` landed / `noop` /
     `skipped-locked` / `skipped-in-flight`". Rewrite the enumeration to: `0`
     landed or `noop`; `3` a LOST write — `skipped-locked` or
     `skipped-in-flight`, nothing was recorded and nothing will re-invoke; `1`
     write failed and rolled back; `64` usage; `69` environment; `70` dirty node
     file (keep the `git checkout --` escalation sentence verbatim). Keep every
     operational instruction unchanged — the occurrence is still uncounted, must
     still be reported, must still not be retried inside the same job. The
     sibling node rewrites this paragraph's *definition* of `skipped-in-flight`;
     touch only the status enumeration so the two edits compose.
   - Add one sentence with the sanctioned chaining idiom, since the loss came
     from an unsafe one: a caller that runs two calls in sequence chains them
     with `&&` **and** may now rely on it, because a lost write no longer
     satisfies `&&`. Give the `--resolved-by … && --retire` pair as the worked
     example, naming it as the pair that failed.
   - `:287-291`, Step 7's report list "(`landed` / `noop` / `skipped-locked` /
     `skipped-in-flight`)". Keep the four words — they are the stdout vocabulary
     and are unchanged — and add that the last two now come with exit 3, which
     is how a non-interactive caller detects them without a transcript.

2. **`.claude/skills/rsi-audit/SKILL.md`** — the other producer.
   - `:184`, step 6.6 "Record the outcome". Two errors, both must be fixed. It
     says the in-flight guard reports **`noop`** (it has reported
     `skipped-in-flight` since PR #3090's unit D2), and its closing sentence —
     "A non-zero exit … **is a landing failure, not a skip**" — inverts exactly
     under this change. Rewrite so `skipped-in-flight` is listed as its own
     outcome word alongside `landed` / `noop` / `skipped-locked`, and so the
     status rule reads: exit 0 means something was recorded or the intent was
     already satisfied; exit 3 means nothing was recorded (a LOST occurrence);
     any other non-zero is a landing failure. All three belong in the report's
     ledger-landing subsection.
   - `:197`, the "Ledger-landing outcomes" report spec, which lists "(`landed` /
     `noop` / `skipped-locked` / a failure exit code)". Add `skipped-in-flight`
     and distinguish the lost-write exit from a failure exit, matching `:184`.

3. **`.claude/skills/dispatch-ladder/SKILL.md:404`** — verified at plan time to
   cite `--list` only, with no exit-code claim. **Do not edit it.** Re-grep
   (`grep -n 'skipped-locked\|exit' .claude/skills/dispatch-ladder/SKILL.md`)
   and edit only if a stale exit-code claim has appeared since.

**Out of scope:** any behavioural instruction change to either skill; any
frontmatter change (both skills' remediation lists are author-owned per
condition 19 of the serving strategy); `.claude/settings.json`; and
`/fewer-permission-prompts`.

**Operational caveat for the implementing session:** every file this plan
touches is under `.claude/skills/`, covered by the sandbox's `denyWithinAllow`
list. `Write`/`Edit` work normally; the **commit** and any tree-updating git op
against these paths need `dangerouslyDisableSandbox: true` on the *first*
attempt (`.claude/rules/sandbox.md`). Do not pre-emptively disable the sandbox
for reads, greps, or the test runs.

---

## Reuse

- `packages/intentionsutil/scripts/park-node:362` and
  `packages/intentionsutil/scripts/clear-park:342` — `exit 3` for "a documented
  refusal; nothing was written". The precedent for the *value*, from the same
  script family. Reuse the number rather than inventing one;
  `dispatch-eval-finding` occupies only 0/1/64/69/70 today, so 3 is free.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:265-269`
  (`SLUG_RE` / `SLUG_MAX` / `SERVES_RE`) — the insertion point for the new
  `readonly` constant. Deliberately **not** `lib.sh`: it is `cp`-ed standalone
  by ~17 CI fixtures, and a one-consumer constant has no reason to inherit that
  copyability constraint.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:60-100` — the
  existing DIVERGENCE 1/2/3 header convention; DIVERGENCE 4 follows its form and
  voice exactly.
- `lib.sh:2306` `graph_write_lock_acquire_wait` — unchanged. It is already the
  bounded-wait verb this script uses (`dispatch-eval-finding:936`); the fix is
  entirely in how the caller reacts to its rc 1 at `:938-944`.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh` —
  `run_ef` (`:266-296`) already exposes `RC`, `SOUT` and `OUT` after every
  invocation, so the new assertions need no plumbing; `hold_lock()` (`:511-526`)
  already constructs both the "waits then lands" (12) and "wait exhausted" (13)
  contention shapes by varying the hold duration against
  `DISPATCH_EVAL_FINDING_LOCK_WAIT`; `assert_not_contains` (`:115-125`) is the
  local negative helper; case (11) (`:495-509`) is the source-ratchet pattern
  case (25) copies; case (8)'s `# CONTRACT CHANGE …` block (`:437-441`) is the
  annotation style for a deliberately flipped expectation.
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh:16,41,94` —
  `assert_eq`, `assert_contains`, `report_results`, already sourced at
  `test-dispatch-eval-finding.sh:111`.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88,186-196` — the
  existing auto-discovery that already runs this suite in CI for any change
  under the scripts directory. No workflow edit.
- `.claude/skills/dispatch-propagate/scripts/run-lint.sh` — runs the type-safety
  escape check and the shell-JSON prose rule over net-new committed lines;
  invoked in Verification below.

## Verification

Baseline measured 2026-08-19 in this worktree at `origin/main` 9ce15363, before
any change: the suite is **177/177 green**, and each fenced check below **fails
today** (measured counts in parentheses), so none can pass vacuously.

The full suite must be green, with every pre-existing assertion intact:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh
```

No lost-write token is followed by a zero exit anywhere in the SUT — the whole
defect, stated mechanically. The `-A2` window catches both the current
next-line form and the same-line `printf …; exit 0 ;;` form the sibling node
introduces. **Today this count is 4:**

```verify
test "$(grep -A2 "printf 'skipped" .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding | grep -cE 'exit 0')" -eq 0
```

The code is defined once by name and used at all four sites — one definition
plus four uses is five occurrences. **Today this count is 0:**

```verify
test "$(grep -c 'EXIT_LOST_WRITE' .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding)" -ge 5
```

Neither in-file copy of the old four-outcomes-on-zero contract survives — the
`usage()` heredoc and the header block. **Today each count is 1:**

```verify
test "$(grep -c '0 landed / no-op / skipped-locked / skipped-in-flight' .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding)" -eq 0
```

```verify
test "$(grep -c 'skipped-in-flight, 1 the graph write failed' .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding)" -eq 0
```

The divergence from the sibling script is recorded in the file that diverges, so
the header's "as dispatch-fleet-alarm" is no longer a bare, now-false claim.
**Today this fails — there are only three divergences:**

```verify
grep -q 'DIVERGENCE 4' .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding
```

And the count that introduces the block agrees with it, so the file does not
assert three divergences while carrying four. **Today `:27` reads `WITH THREE
DELIBERATE DIVERGENCES` (measured 2026-08-19), so this fails:**

```verify
test "$(grep -c 'WITH THREE DELIBERATE DIVERGENCES' .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding)" -eq 0
```

The principal caller's own documentation no longer asserts the old enumeration.
**Today this line is present at `rsi/SKILL.md:256`:**

```verify
test "$(grep -c 'Exit codes: `0` landed / `noop` / `skipped-locked` / `skipped-in-flight`' .claude/skills/rsi/SKILL.md)" -eq 0
```

Repo lint stays clean:

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / judgment checks, in order:

1. **Confirm the sibling landed first.** Before any edit, `git log --oneline
   origin/main | head` and `grep -c node_fix_in_flight
   .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding` (≥ 4 once
   `tactic-eval-finding-in-flight-guard-permanent-after-execution-completes` has
   merged). If it has not, park rather than race — see "Sequencing".
2. **Read the three reconciled contract blocks end to end** (the divergence
   block, the header `Exit codes:` block, and the `usage()` heredoc) and confirm
   no sentence anywhere in the file still says a lost write exits 0. The gap
   between a shipped rule and its surrounding prose is the exact defect this
   node records; leaving one behind reproduces it inside the fix.
3. **Exercise the failed pair by hand, in a scratch checkout, against the
   stubs — never the live graph.** The suite's case (13) plus `hold_lock()`
   already reproduce the contended-mutex loss; run the SUT under a held lock as
   `… --resolved-by '#3090' && … --retire --slug <slug>` and confirm the
   `--retire` **does not run**. That is the original incident, replayed. Do not
   fire a real occurrence at a live ledger entry to test the script — that
   fabricates a recurrence figure to prove a contract.
4. **Post-merge, confirm `/rsi`'s next spawned run reports honestly.** The
   observable is a phase-boundary `/rsi` job whose report names a
   `skipped-locked` or `skipped-in-flight` outcome; it should now be reachable
   from the job's exit status rather than only from a discarded transcript.
   Absence of such a run in the first window is not evidence of a regression —
   the condition is rare by construction.
5. **`dispatch-fleet-alarm` is deliberately unchanged.** If a later session
   observes a fleet-alarm lock skip that was genuinely lost rather than deferred
   (i.e. its systemd timer did not re-fire), that is a **distinct** finding:
   record it through `dispatch-eval-finding` under its own slug, do not fold it
   onto this node, whose scope is this one script's exit contract.

## Measured impact carried forward

`lost-writes-passed-as-success` = 1 write (single-run window, sensor
`dispatch-eval-finding` stdout, measured 2026-08-14); `recurrence_count` = 1
(all-time). These figures live in `attributes.measured_impact` and are unchanged
by this planning round — no new occurrence was observed on 2026-08-19; only the
line anchors and the sibling-overlap facts were re-measured.
