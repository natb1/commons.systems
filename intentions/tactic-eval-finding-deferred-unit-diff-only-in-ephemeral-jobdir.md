---
id: tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir
kind: tactic
statement: "The escalation path has no durable channel for
  finished-but-unlandable work: the implement phase left a verified 36973-byte
  Unit 4 diff only at CLAUDE_JOB_DIR/tmp/unit4-deferred.patch and wrote a park
  recommendation citing that path, the job dir has since been deleted and the
  diff is lost — so give a deferring session a pushed-tag preservation channel,
  and make the park path refuse or annotate any reason or recommendation citing
  an ephemeral path"
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
office_hours:
  reason: worker session froze at a permission/classifier denial — claude agents
    reports state=blocked and the transcript has had no activity for 1994s; the
    session cannot make progress and cannot park itself (a blocked session never
    reaches the Stop hook), so the dispatch-tick frozen-session sweep parked
    this node
  since: 2026-08-19
  recommendation: Find the holding job with 'claude agents --all' and attach it
    ('claude attach <job-id>'), then answer the pending prompt. If the denied
    command was gratuitous, cancel it and let the worker continue; if it is
    genuinely needed, run it yourself or add a standing permission rule — do NOT
    rewrite the command to route around the classifier. If the session is
    unrecoverable, stop it ('claude rm <job-id>'), let dispatch-sweep reap the
    worktree, then run clear-park -C <repo-root> <node-id> to return the node to
    the lane. Until that session is gone, office-hours reports this node as
    'all-held' rather than launching a review session for it, because the frozen
    session still holds the node-id session name.
  session_type: other
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: at_risk_patch_size
      value: 36973
      unit: bytes
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: durable_copies_of_deferred_unit
      value: 0
      unit: copies
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
## Context

### What was observed

Node `tactic-attention-per-tier-boost-migration`, `implement` phase, ladder run
started 2026-08-14T17:11:29Z.

The phase implemented all four planned units, then deferred Unit 4 (validateGraph
rule 22, the two legacy compat-branch deletions in `validateAttention`, the
now-unused `legacyTierKey`, and the `kind-kind.md` field-doctrine prose) out of
PR #3093 because it cannot land atomically with the data migration. The Unit 4
work was **written, verified against a synthetic post-migration store, and then
reverted out of the working tree before it was ever committed**. Its only
surviving copy was a 36,973-byte patch file at
`$CLAUDE_JOB_DIR/tmp/unit4-deferred.patch` — concretely
`/home/n8/.claude/jobs/09888b78/tmp/unit4-deferred.patch`.

The escalation the worker parked onto the node names exactly that path as the
recovery route, and hedges immediately after it: "recover from that session's
job dir if needed, or just re-run /implement-unit with the same Unit 4 scope
text".

The hedge was warranted, and that is the finding. The harness documents
`$CLAUDE_JOB_DIR/tmp` as scratch that "is cleaned up when the job is deleted, so
anything the user should keep belongs somewhere durable instead". The park
recommendation pointed a future session at an artifact whose lifetime nothing
guaranteed, and whose loss silently converts a completed, verified unit back
into work to be redone.

### The predicted loss has materialized — this is a post-mortem, not a live save

Measured 2026-08-19 in this worktree at `HEAD == origin/main a92b92b9`, and
re-verified during this planning round. **An earlier revision of this node ended
with "the patch still existed at the time of this evaluation — this is a live
opportunity to preserve it, not a post-mortem". That sentence is now false and
is retracted here.**

- `ls /home/n8/.claude/jobs/09888b78` → `No such file or directory`. The whole
  job directory is gone, not just `tmp/`. The 36,973-byte patch no longer exists
  anywhere on this host. `durable_copies_of_deferred_unit` was 0; the at-risk
  bytes are now lost bytes.
- **Unit 4 is not recoverable from git either.** `legacyTierKey` is still live at
  `packages/intentionsutil/src/schema.ts:388`, called at `:440` and `:461`;
  `grep -n 'rule 22' packages/intentionsutil/src/*.ts` returns nothing.
  `git log --oneline origin/tactic-attention-per-tier-boost-migration` carries
  Units 1–3 only (`2827ca00` vocabulary, `868a66a6` migration script,
  `afb3d8b7` the 91-node data migration, `1fe90deb` a type-safety-marker fixup)
  plus two `origin/main` merges. There is no Unit 4 commit and therefore no
  revert to recover from — which is exactly why a commit-first channel would
  have saved it. PR #3093 is still unmerged and the branch still exists.
- **The source node is still parked, five days on.**
  `intentions/tactic-attention-per-tier-boost-migration.md`: `phase: implement`
  (file line 118), `office_hours` (file line 131), `office_hours.since:
  2026-08-14`; its `office_hours.recommendation` still literally reads "The full
  diff is saved for reuse in this job's `tmp/unit4-deferred.patch` … recover
  from that session's job dir if needed". Step 2 of that recommendation is
  un-actionable as written; only its fallback clause survives.

### Root cause

The escalation path has **no durable channel for "work that is finished but must
land later"**, and **no gate that notices when a park recommendation cites a
directory the harness deletes**. Both halves are missing, and the caller-note
scope caution stands: a refusal shipped without a channel blocks a park with no
sanctioned alternative and strands the session. **Do not ship the refusal
without the channel.** This plan ships the channel first (Unit 1), then the
gates (Units 2–3), then the doctrine that points sessions at it (Unit 4).

### Intended outcome

1. A session that must defer finished work can make it durable in one command,
   verified against `origin` before the work leaves its working tree.
2. A park whose reason or recommendation cites an ephemeral path is refused
   in-session, where the model can still fix it, and — on the paths where an
   in-session refusal is impossible — is landed with a durability warning welded
   into the record the human reads.
3. The doctrine that tells phase skills how to escalate names the channel, so
   the next deferral does not have to invent one.

### Greenfield design: durable means git-reachable from a pushed ref

The codebase's own doctrine (user memory `unpushed-merge-safety-via-merge-tree`)
defines recoverable content by git-reachability from a ref, never by
file-presence in a directory. So the channel is a **pushed git tag**, not a file
copy anywhere:

- The deferred work becomes one commit on top of the current `HEAD`.
- That commit is pushed to `refs/tags/deferred/<node-id>/<label>` — a ref, so
  GitHub retains the object permanently and independently of the node branch's
  fate (branch deletion on merge, PR closure).
- Only after `git ls-remote` confirms the tag on `origin` is the work removed
  from the working tree.
- The park recommendation cites `git show <tag>` / `git cherry-pick <tag>` —
  durable text pointing at a durable object.

Two measured facts pick the tag over the two obvious alternatives:

- **Pushing a branch is not free.** `.github/workflows/unit-tests.yml:3-7`
  triggers on `push` with `branches-ignore: [main, 'graph/**']`, so a
  `deferred/*` **branch** would fire a full unit-tests run per preservation.
  Only `.github/workflows/budget-etl-release.yml:3-6` triggers on tags, and only
  for `budget-etl-v*` — a `deferred/*` **tag** fires no workflow at all.
- **Commit-then-revert on the node branch** (the finding's candidate direction 1)
  works only while that branch survives, adds two net-zero commits to the PR
  under review, and is unavailable to a session escalating before any PR exists.
  The tag is strictly more robust for the same effort.

No brownfield migration path is required: nothing depends on the current
(absent) behavior, and the existing lost patch cannot be recovered by any design.

### Explicitly out of scope

- **Re-implementing the lost Unit 4.** That belongs to
  `tactic-attention-per-tier-boost-migration`, not here. This tactic must not
  touch `packages/intentionsutil/src/schema.ts`'s `legacyTierKey` or add
  validateGraph rule 22.
- **Rewriting that node's stale `office_hours.recommendation`.** It is a parked
  node awaiting an office-hours sitting; correcting a parked node's disposition
  is an office-hours act, not an implement-phase act. Leave it. (A future
  office-hours session should note that its Step 2 is dead and only the "re-run
  /implement-unit with the same Unit 4 scope text" fallback survives.)
- **`$CLAUDE_JOB_DIR` as a marker relay.** Writing
  `office-hours-reason` / `office-hours-recommendation` into `$CLAUDE_JOB_DIR` is
  the *sanctioned* use of job scratch: small text with a specific already-existing
  later consumer (`terminal_without_disposition_sweep`) that promptly lands it
  durably. Do not "fix" that mechanism. The defect is text that *cites* an
  ephemeral path as a place to recover **content** from.
- **Making every phase skill call one marker-writer script.** That is
  `tactic-node-lane-escalate-park-unconsumed` territory (phase done, adjacent but
  distinct: it fixed escalations that never landed at all; this one is about what
  a park that *did* land points at).
- **`.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation` — decoy,
  do not edit.** It is the legacy GitHub-issue lane: it resolves an issue number
  from the worktree basename, shells out to `dispatch-apply-office-hours` (which
  calls `gh`), and takes only a reason — no recommendation argument at all.
  GitHub Issues are disabled repo-wide. It is not on the node-lane path this
  finding is about.

### Not a duplicate

`tactic-node-lane-escalate-park-unconsumed` (done) fixed the adjacent defect that
the node-lane escalation never *landed*. `tactic-office-hours-pr-custody` (done)
is the custody **precedent** this design follows, not an overlap.
`tactic-eval-finding-detached-code-review-dies-with-launcher` (implement) is
about a detached child dying — unrelated.

### Evidence a later session cannot rediscover

- Worker session `09888b78-be81-4597-bb3d-55b3cfa00d63`; the deviation escalation
  was staged via `$CLAUDE_JOB_DIR/tmp/office-hours-reason.tmp` and companion
  recommendation/pr files; the terminal-without-disposition sweep landed the park
  as commit `0ea4026f` at 2026-08-14T17:50:56Z.
- Deferred patch: 36,973 bytes, written 2026-08-14T17:40Z; durable copies 0.
- Cost to re-derive: the whole Unit 4 implementation plus the 107-turn Opus
  investigation that established the deferral was necessary ($21.02 price proxy
  for the investigation alone).
- Phase `execution.fix.attempt`: null; `execution.conflict`: null — this was not
  rework, it was rework the harness queued up for itself.

---

## Unit 1 — `preserve-deferred-work`: the durable channel

**Scope.** New executable
`.claude/skills/dispatch-propagate/scripts/preserve-deferred-work` plus its suite
`.claude/skills/dispatch-propagate/scripts/test-preserve-deferred-work.sh`
(both new files; nothing else changes in this unit).

Home directory chosen deliberately: `run-unit-tests.sh:88` sets
`RUN_PR_SCRIPTS=true` for any changed file matching
`.claude/skills/dispatch-propagate/scripts/*`, and lines 186-200 then glob
`"$SCRIPTS"/test-*.sh` — so a suite in this directory gets CI coverage from the
existing wiring whenever that directory changes. (Unit 3 additionally hand-wires
a named step so it also runs when only `packages/intentionsutil/` changes.)

Interface:

```
preserve-deferred-work --node <node-id> --label <label> [-C <dir>] [--] <pathspec>...
```

- `-C <dir>` (optional) resolves the repo/worktree root; **absent, it resolves
  from the caller's cwd, never from the script's own location**. This is the
  `graph-commit` contract (`packages/intentionsutil/scripts/graph-commit:38`) and
  the inverse of the `transition-node` / `dump-node.ts` defect where a script
  inferred the tree from where it lived.
- `--node` must match `^[A-Za-z0-9._-]+$` (the same charset `park-node:194`
  enforces); `--label` must match `^[a-z0-9][a-z0-9-]*$`. Both are interpolated
  into a git ref name, so validate before use.
- `<pathspec>...` are the paths holding the deferred work. Required, non-empty.

Behavior, in this exact order — the order is the correctness requirement:

1. **Preconditions (exit 2, nothing mutated).** An `origin` remote exists;
   `user.email`/`user.name` are configured (a missing identity is a loud failure,
   never a fallback — see user memory `ci-only-fail-missing-global-git-identity`);
   `git status --porcelain -- <pathspec>` is non-empty (else "nothing to
   preserve"); and `git status --porcelain` lists **no** path outside
   `<pathspec>` (else "uncommitted changes outside the preserved pathspec: …;
   commit or stash them first"). The strict precondition is what makes step 6's
   reset exact and safe.
2. `HEAD_BEFORE="$(git rev-parse HEAD)"`.
3. `git add -- <pathspec>` then commit with a message naming the node, the label
   and why it is deferred → `PRESERVED_SHA`.
4. `git tag "deferred/<node-id>/<label>" "$PRESERVED_SHA"` — a **lightweight**
   tag (an annotated tag needs a tagger identity and buys nothing here; the
   commit message carries the prose). If the tag already exists locally or on
   `origin`, exit 2 and tell the caller to pass a distinct `--label`; never
   silently move a tag.
5. `git push origin "refs/tags/deferred/<node-id>/<label>"`, then **verify**:
   `git ls-remote --tags origin "refs/tags/deferred/<node-id>/<label>"` must
   report `PRESERVED_SHA`. Exit-0 from `push` is not the verdict — this mirrors
   `park-node`'s own doctrine that a writer's exit code is never evidence a write
   landed (`park-node:90-101`, the `verify-landed` block).
6. **Only after step 5 verifies**, remove the work from the working tree:
   `git reset --hard "$HEAD_BEFORE"`, then confirm
   `git status --porcelain -- <pathspec>` is empty. If it is not, exit 1 loudly,
   naming the tag, so nothing is lost.
7. Stdout: **exactly one line**, `preserved <tag> <sha>` (the `hold-node`
   single-line-stdout convention, `packages/intentionsutil/scripts/hold-node:44-47`).
   Stderr: a copy-pasteable recovery block —
   `git fetch origin 'refs/tags/deferred/*:refs/tags/deferred/*'`,
   `git show <tag>`, `git cherry-pick <tag>` — for the escalating session to
   paste into its park recommendation.

**Failure semantics — the load-bearing part.** If step 3, 4, 5 or the step-5
verification fails, the script **exits 1 with everything left in place**: the
local commit and tag stay, the working tree is *not* reset, and the message says
so explicitly ("the preserved commit is LOCAL ONLY at `<sha>`; nothing was
removed from your working tree"). A rollback that reset the tree here would
destroy the very work the script exists to save — this is the one place where
"clean up after yourself" is the bug.

Header must document (per `.claude/rules/sandbox.md`) that `git reset --hard` is
a tree-updating op and the script is therefore invoked with
`dangerouslyDisableSandbox: true`.

Out of scope for this unit: preserving work that is *already* committed and
pushed (it is already durable — the script says so and exits 2 with "nothing to
preserve"); any graph write; any `gh` call.

Test suite (`test-preserve-deferred-work.sh`) uses a scratch bare origin + clone,
in the style of `packages/intentionsutil/scripts/test-park-node.sh:206-320`
(`make_clone`, `origin_sha`) but far smaller — no `npx`/`gh` shims are needed,
this script touches neither. Cases:

1. Happy path: work preserved, tag present on the scratch origin at the expected
   sha, working tree clean, branch tip back at `HEAD_BEFORE`, stdout exactly
   `preserved <tag> <sha>`.
2. `git show <tag>` in a *fresh clone* of the scratch origin reproduces the
   deferred content — the durability claim, asserted end-to-end.
3. Dirty path outside the pathspec → exit 2, nothing committed, nothing pushed.
4. Empty change set → exit 2, "nothing to preserve".
5. Duplicate label → exit 2, the existing tag still points at the original sha.
6. Push failure (point `origin` at a non-writable/absent path) → exit 1, working
   tree **still holds the deferred work**, local tag present. This is the
   regression test for the failure semantics above.
7. Malformed `--node` / `--label` → exit 2 before any mutation.

**Recommended model:** opus. A multi-step git state machine whose failure
ordering is the whole point; the plan leaves the exact rollback boundaries to be
enforced at implementation time.

---

## Unit 2 — shared ephemeral-citation detector, and `park-node` annotates (never refuses)

**Scope.**
- New sourceable library `packages/intentionsutil/scripts/lib-ephemeral-citation.sh`.
- `packages/intentionsutil/scripts/park-node` (468 lines) sources it and
  annotates.
- `packages/intentionsutil/scripts/test-park-node.sh` (1519 lines) gains the
  library to its seed list and two new cases.

**The library.** One pattern list, two consumers (this unit's `park-node` and
Unit 3's `dispatch-mark-node-park`) — a shared surface rather than the same
regex array copied twice, per the serving strategy's parsimony ruling. It
exports:

- `ephemeral_citation_match <text>` — case-insensitive ERE scan
  (`shopt -s nocasematch`, the loop shape at
  `.claude/skills/dispatch-propagate/scripts/dispatch-mark-node-park:98-106`).
  Echoes the matched pattern and returns 0 on a match, returns 1 otherwise.
  Patterns: `\$CLAUDE_JOB_DIR`; `/\.claude/jobs/`; `\.claude/jobs/[0-9a-f]{6,}`;
  `\$TMPDIR`; `(^|[^A-Za-z0-9_])/tmp/`; and the prose forms the incident actually
  used — `job dir`, `job's tmp`, `jobdir`.
- `ephemeral_citation_warning <matched-pattern> <field-name>` — the standard
  warning paragraph, naming the matched pattern, the field it matched in, why the
  path does not survive (the harness deletes job scratch with the job), and the
  sanctioned channel by path
  (`.claude/skills/dispatch-propagate/scripts/preserve-deferred-work`).

**`park-node` annotates and never refuses — this is not a style preference.**
`park-node`'s exit 3 is already taken by `stale-diagnosis`, and both sweep call
sites in `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`
branch on it: `park_args` at `:671` with the `elif (( rc == 3 ))` handler at
`:720`, and the terminal-without-disposition path's `park_args` at `:1416` with
its handler at `:1491`. Both read exit 3 as "re-diagnose next tick" and leave the
markers in place. A new refusal there would be logged as stale-diagnosis, retried
forever against identical marker text, and the node would never park. So:

After the existing arg parse (`park-node:180-190`) and before the write, run the
detector over `$RECOMMENDATION` **and** `$REASON`. On a match:

- print a loud diagnostic to stderr naming the matched pattern and the field, and
- **prepend** `ephemeral_citation_warning`'s paragraph to `$RECOMMENDATION`
  (when `$REASON` matched and the recommendation is empty, the warning becomes
  the recommendation), so the human reading `office_hours.recommendation` at
  office hours sees the durability caveat welded to the text that misleads them.
- **The exit code is unchanged and the park always lands.** Never touch
  `$REASON` itself — the header's standing contract at `park-node:55-60` is that
  this script never folds text into `<reason>` on the caller's behalf. The
  recommendation prepend is a new, deliberate mutation and must be documented in
  the header block alongside the recommendation contract.

The write itself is untouched: the embedded tsx writer still receives the
recommendation as argv and assigns `node.office_hours = { reason, since,
recommendation: recommendation || null }` (`park-node:373-377`). No schema
change: `OfficeHours` (`packages/intentionsutil/src/schema.ts:696-701`,
validated at `:918-931`) stays exactly as it is — `recommendation` is prose, and
the durable payload lives in git under the tag, not in frontmatter.

**Two traps in the test file, both measured:**

1. **The copy-fixture trap.** `test-park-node.sh:220-237` seeds a *fixed list* of
   scripts into its scratch origin (`cp "$PN_SCRIPT" …`, then a `chmod +x`
   list); `run_pn` (`:612-623`) executes
   `bash packages/intentionsutil/scripts/park-node` **inside the clone**. The
   moment `park-node` gains a `source .../lib-ephemeral-citation.sh`, every case
   fails with a missing file unless the library is added to both the `cp` block
   and the `chmod` list. This is the recorded `lib-sh-new-source-breaks-copy-fixtures`
   failure; add the library there in the same edit that adds the `source`.
2. **The stderr-only recommendation.** The suite's `npx` shim
   (`test-park-node.sh:358-573`) emulates the tsx writer: it writes
   `office_hours: {reason: "…", since: "…", recommendation: null}` into the node
   file (`:566-572`) and echoes the real recommendation **only to stderr**
   (`recommendation='…'`). So assert the annotation against `run_pn`'s captured
   output (`out="$(run_pn … 2>&1)"`), not against `origin_show`.

New cases, modelled on case 8 (`test-park-node.sh:946-959`, the `--pr`
non-integer rejection — same capture/assert shape):

- Recommendation citing `$CLAUDE_JOB_DIR/tmp/unit4-deferred.patch` → **exit 0**,
  the park lands (assert `office_hours` present on the scratch origin), and the
  captured stderr shows the recommendation carrying the durability warning and
  naming `preserve-deferred-work`.
- Reason citing `/home/n8/.claude/jobs/09888b78/tmp/x.patch` with an empty
  recommendation → exit 0, park lands, warning present, and the reason as
  written to the node is byte-identical to the reason passed in.
- Recommendation citing `git show deferred/<node>/<label>` → exit 0, park lands,
  and the recommendation reaches the writer **unmodified** (no warning text).

**Recommended model:** opus. `park-node` is delicate, heavily-documented
concurrency-sensitive infra with two live sweep call sites, and the test file has
two non-obvious traps.

**Dependencies:** Unit 1 (the warning text names `preserve-deferred-work` by
path, which must exist).

---

## Unit 3 — `dispatch-mark-node-park` refuses in-session, and both suites get named CI steps

**Scope.**
- `.claude/skills/dispatch-propagate/scripts/dispatch-mark-node-park` (144 lines).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-mark-node-park.sh`
  (135 lines).
- `.github/workflows/unit-tests.yml` — two new named steps in the `hook-tests`
  job (job starts at `:219`; the `park-node` step is the pattern, `:292-293`).

**The gate.** This is the *loud in-session failure* the finding's direction 3
asks for, placed where a refusal is recoverable: the live model still holds the
context and can rewrite the recommendation, or run `preserve-deferred-work` and
cite the tag instead. Mirror the existing browser-reachability gate exactly:

- Source `packages/intentionsutil/scripts/lib-ephemeral-citation.sh` (relative to
  `$SCRIPT_DIR`, the same three-levels-up hop this directory already uses to reach
  `packages/intentionsutil/scripts/park-node`).
- Run the detector over **both** `$REASON` and `$RECOMMENDATION` — note the
  existing browser gate checks only `$REASON` (`:90-121`), and the incident's
  citation was in the *recommendation*.
- On a match: **exit 3, nothing written**, no override flag (the browser gate's
  stated reason at `:13-31` applies verbatim: a bypass defeats the check).
  The message names the matched pattern, the offending field, and the remedy —
  run `preserve-deferred-work`, then cite `git show <tag>`.
- Position it with the browser gate, i.e. **after** arg-shape validation and
  **before** the `CLAUDE_JOB_DIR` guard at `:123`, so a bad recommendation exits
  3 even on an interactive run with `CLAUDE_JOB_DIR` unset. That ordering is
  already documented at `:22-26`; keep the doc block accurate.

Do **not** change how the markers themselves are written (`:131-144`) — the
`$CLAUDE_JOB_DIR` marker relay is sanctioned (see "Explicitly out of scope").

**Tests.** `test-dispatch-mark-node-park.sh` already has `assert_rejected`
(`:76-88`), but it hardcodes the browser gate's stderr substring
(`"cannot be machine-checked AT ALL"`). Add a sibling
`assert_rejected_ephemeral(label, reason, recommendation)` asserting exit 3, a
substring unique to the new message (e.g. `preserve-deferred-work`), and that
neither marker file was written. Cases: ephemeral path in the reason; ephemeral
path in the recommendation; the `job dir` prose form (the incident's exact
hedge); and one **positive** case — a recommendation citing
`git show deferred/<node>/<label>` writes both markers and exits 0.

**CI wiring.** `run-unit-tests.sh:88` + `:186-200` already run every
`test-*.sh` in this directory — but only when a file *in this directory*
changed. A later PR touching only `packages/intentionsutil/scripts/lib-ephemeral-citation.sh`
would not fire it. Add two named steps to `hook-tests`, copying the
`:292-293` shape:

```yaml
      - name: Run dispatch-mark-node-park tests
        run: .claude/skills/dispatch-propagate/scripts/test-dispatch-mark-node-park.sh
      - name: Run preserve-deferred-work tests
        run: .claude/skills/dispatch-propagate/scripts/test-preserve-deferred-work.sh
```

A dead suite and a passing suite look identical from a PR's green checkmark
(recorded incident: `.claude/skills/rsi/scripts/test-rsi-claim.sh` shipped in
PR #3065 and never ran). Confirm the steps actually executed on this PR's run:

```
gh api repos/natb1/commons.systems/actions/jobs/<job-id> \
  --jq '.steps[] | select(.name | test("preserve-deferred-work|dispatch-mark-node-park")) | "\(.name): \(.conclusion)"'
```

**Recommended model:** sonnet. Mechanical: a second gate copied from an existing
one in the same file, additional cases in an existing helper's shape, and two
YAML steps copied from a neighbouring one.

**Dependencies:** Unit 1 (the suite it wires must exist), Unit 2 (the library it
sources must exist).

---

## Unit 4 — doctrine: name the channel where escalating sessions read

**Scope.**
- `.claude/skills/dispatch-propagate/escalation-recommend.md` (139 lines) — the
  canonical escalation-recommend procedure, pointed at by 12 skills
  (`implement/SKILL.md:251`, `implement-unit/SKILL.md:197`,
  `fix-checks/SKILL.md:114,349`, `qa-fix/SKILL.md:547`,
  `qa-main/SKILL.md:729`, `review-fix/references/terminal-actions.md:205`,
  `dispatch-conflict/SKILL.md:488,687,1237,1532`, `resolve-epic/SKILL.md:141`,
  `budget-parse-job/SKILL.md:48`, `qa-fix/references/terminal-disposition.md:177`).
- `.claude/skills/implement/SKILL.md` escalation block (`:139-148`).
- `.claude/skills/implement-unit/SKILL.md` escalation block (`:195-207`).

**In `escalation-recommend.md`,** add a section — "What the recommendation may
cite" — after the existing "The recommendation the subagent returns must be
concrete, actionable…" paragraph:

- A recommendation may cite only content that outlives the session: a path in
  the repo, a pushed commit or tag, a PR number, or a graph node id.
- It may **never** cite `$CLAUDE_JOB_DIR`, `$TMPDIR`, `/tmp`, or a
  `~/.claude/jobs/<id>` path as the place to recover content from. Job scratch is
  a relay for markers a later tick reads within minutes, not storage. State the
  measured consequence in one sentence: a 36,973-byte verified unit diff was
  cited that way on 2026-08-14 and was gone by 2026-08-19.
- When the parked item has finished-but-unlandable work in the working tree, run
  `preserve-deferred-work` **before** writing the recommendation, and cite the
  tag it prints. Show the invocation and the one-line stdout contract.
- Note that `dispatch-mark-node-park` refuses (exit 3, nothing written) a reason
  or recommendation that cites an ephemeral path, and that `park-node` lands the
  park with a durability warning prepended — so the check is mechanical, not
  advice.

**In `implement/SKILL.md`** (`:139-148`) and **`implement-unit/SKILL.md`**
(`:195-207`), add one step to each escalation block, immediately before the
marker/deviation call: if any implemented-and-verified work is being left out of
the PR, preserve it with `preserve-deferred-work` and cite the printed tag in the
recommendation. Keep it to the invocation plus a pointer to
`escalation-recommend.md` — the doctrine has one home; these are call sites, not
copies of it (six prose copies of one instruction is the defect this serving
strategy names, not the fix).

Prose in all three files follows `.claude/rules/writing-style.md`.

**Recommended model:** sonnet. Documentation edits with the exact insertion
points and content given.

**Dependencies:** Unit 1 (documents its interface), Unit 3 (describes its
refusal).

---

## Reuse

- `packages/intentionsutil/scripts/park-node:55-60` — the standing
  park-recommendation contract ("a mechanical park must carry recoverable
  context") that Unit 2 extends from *present* to *durably recoverable*; `:102`
  and `:122` the usage line; `:128-190` the leading-flags-only parse whose
  invariants Unit 2 must not disturb; `:373-377` the embedded office_hours
  writer; `:62-67` the `--pr` custody precedent (`tactic-office-hours-pr-custody`
  — "escalation parks keep custody of their PR"), the same shape as "an
  escalation park keeps custody of its artifact"; `:90-101` the `verify-landed`
  doctrine that a writer's exit code is not evidence the write landed, which
  Unit 1's step-5 `ls-remote` verification copies.
- `.claude/skills/dispatch-propagate/scripts/dispatch-mark-node-park:13-31,
  90-121` — the rejection-gate shape Unit 3 mirrors: pattern array +
  `shopt -s nocasematch` loop → exit 3, no write, no override flag, validation
  ordered before the `CLAUDE_JOB_DIR` guard.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-mark-node-park.sh:76-88`
  — the `assert_rejected` closure Unit 3's `assert_rejected_ephemeral` copies.
- `packages/intentionsutil/scripts/test-park-node.sh:206-320` (scratch origin +
  `make_clone`), `:612-623` (`run_pn`), `:946-959` (case 8, the usage-rejection
  assert shape) — Units 1 and 2's test scaffolding.
- `packages/intentionsutil/scripts/hold-node:33-52` — the flag/exit-code/stdout
  conventions Unit 1's CLI follows (`--*-file` inputs, exactly one stdout line,
  park-node's 0/1/2 exit scheme).
- `packages/intentionsutil/scripts/graph-commit:38` — the `-C`/cwd repo-root
  resolution contract Unit 1 copies (never resolve the tree from the script's own
  location).
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88, 186-200` — the
  existing per-directory auto-glob that gives Units 1 and 3's suites CI coverage;
  `.github/workflows/unit-tests.yml:219` (`hook-tests` job) and `:292-293` (the
  `park-node` step) — the named-step pattern Unit 3 copies.
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:671,
  720, 1416, 1491` — the two sweep call sites and their `rc == 3` handlers; read
  before touching `park-node`'s exit codes.
- `packages/intentionsutil/src/schema.ts:696-701, 918-931` — `OfficeHours` and
  its validator; **read to confirm no change is needed**, not to change.
- User memory `unpushed-merge-safety-via-merge-tree` — durability is
  git-reachability from a ref, the doctrine Unit 1 implements;
  `lib-sh-new-source-breaks-copy-fixtures` — the Unit 2 test trap;
  `skill-shell-tests-not-autodiscovered-ci` — the Unit 3 wiring trap and its
  verification command.
- `.claude/rules/sandbox.md` — `git reset --hard` is a tree-updating op; Unit 1's
  header records the `dangerouslyDisableSandbox: true` requirement.

A note on one objection that does **not** apply here:
`.claude/skills/review-fix/SKILL.md:1095-1105` forbids pasting finder-output text
verbatim into a pushed node body (possible secrets in CodeQL/npm/secrets-lens
output). That rule is scoped to untrusted reviewer-generated text. This tactic
pushes the author's own already-implemented and verified diff as a git commit —
the same content the PR would have carried had it landed — so the redaction rule
is not a blanket objection to durable preservation, and a reviewer should not
read it as one.

## Verification

Run the three shell suites. Units 1 and 3 add the first and second; the third
covers Unit 2's changes to `park-node`.

```verify
.claude/skills/dispatch-propagate/scripts/test-preserve-deferred-work.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-mark-node-park.sh
```

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

Confirm the two named CI steps exist in the `hook-tests` job (positive greps —
each must print a matching line, so a rename or a mis-indented step fails here
rather than silently never running):

```verify
grep -n 'run: .claude/skills/dispatch-propagate/scripts/test-preserve-deferred-work.sh' .github/workflows/unit-tests.yml || exit 1
grep -n 'run: .claude/skills/dispatch-propagate/scripts/test-dispatch-mark-node-park.sh' .github/workflows/unit-tests.yml
```

Confirm the shared detector is the single source of the pattern list — both
consumers source it, and neither carries its own copy of the ephemeral-path
regexes:

```verify
grep -n 'lib-ephemeral-citation.sh' packages/intentionsutil/scripts/park-node || exit 1
grep -n 'lib-ephemeral-citation.sh' .claude/skills/dispatch-propagate/scripts/dispatch-mark-node-park || exit 1
grep -n 'lib-ephemeral-citation.sh' packages/intentionsutil/scripts/test-park-node.sh
```

(The third grep is the copy-fixture guard: the library must appear in
`test-park-node.sh`'s seed block, or every case in that 1519-line suite fails on
a missing source.)

Lint, which runs the prose-rule and type-safety-escape checks over the added
lines:

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual / judgment checks, not auto-runnable:**

- **End-to-end durability, against the real remote.** In a scratch worktree,
  make a trivial edit, run
  `preserve-deferred-work --node <this-node-id> --label smoke <path>` with
  `dangerouslyDisableSandbox: true`, then from a *different* checkout run
  `git fetch origin 'refs/tags/deferred/*:refs/tags/deferred/*'` and
  `git show deferred/<this-node-id>/smoke` — the content must be there and the
  original worktree must be clean. Then delete the smoke tag locally and on
  `origin` (`git push origin :refs/tags/deferred/<this-node-id>/smoke`). Confirm
  the push of a `deferred/*` tag fired no workflow run
  (`gh run list --limit 5` shows nothing new for it) — the design premise that a
  tag is CI-free.
- **The refusal has somewhere to go.** Read the Unit 3 refusal message as a
  fresh session would: it must name `preserve-deferred-work` and show enough to
  act on without opening another file. A refusal that only says "no" reproduces
  the stranding hazard this plan exists to avoid.
- **Observe in production.** The next time a phase escalates with deferred work,
  check that the landed `office_hours.recommendation` cites a
  `deferred/<node-id>/<label>` tag rather than a job path — and that
  `git show` on that tag still resolves a week later. Until one such escalation
  occurs, this tactic's effect is unobserved in the field.
- **Do not treat `tactic-attention-per-tier-boost-migration` as fixed.** Its
  Unit 4 is permanently lost and its park recommendation is still stale. This
  plan makes the next loss impossible; it recovers nothing.
