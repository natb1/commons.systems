---
id: tactic-drain-disposition-diagnosis-cas
kind: tactic
statement: A batched office-hours drain captures a node's origin/main blob at
  DIAGNOSIS time (via dump-node.ts) and pins it through a new
  park-node/clear-park --base flag, so a disposition executes only if
  origin/main is unchanged since diagnosis — refusing with a distinct exit code
  (3, stale-diagnosis) that routes back to re-diagnosis, rather than silently
  landing on top of an intervening fleet write or falling through to
  graph-commit's own auto-merge-then-park path
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-25 concurrency/serialization review.
  tactic-clear-park-primitive supplies clear-park with --base compare-and-swap,
  but captures the base immediately before landing (park-node's pattern), so it
  catches only a write concurrent with the land itself. The interview window —
  diagnosis, author question, author answer, execution — stays unguarded, and
  that is precisely the window the 2026-07-25 graph-router race landed in: while
  the author held an unexecuted grant for one resolution of
  tactic-graph-router-live-worker-visibility, a concurrent fleet actor landed
  the opposite resolution and cleared the park, so a real design question was
  settled by push timing rather than by the author's answer."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 85
  override: null
  rationale: "Author-directed 2026-07-25: the queue-serialization work
    (dispatch-queue claim integrity, office-hours drain claiming, and the
    cross-queue landing path) is the current focus. Own boost 85 composes with
    the +5 inherited from strategy-graph-native-dispatch to an authored 90 —
    exact parity with tactic-graph-router-live-worker-read-robust, the existing
    author-set boost on this same defect class — and deliberately below
    strategy-main-health's standing 100 so the main-health signal keeps its
    recorded dominance."
phase: done
execution:
  branch: tactic-drain-disposition-diagnosis-cas
  pr: 2969
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-26T05:06:48Z
    mergeCommitSha: be70f133fdfbccb1bc5ac037d8bd3e2c275952d9
    graphCommitSha: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    /qa-main: needs-main residue item 10 ("clear-park --base — sibling half of
    the pin") on tactic-drain-disposition-diagnosis-cas is not
    browser-verifiable — its url_path
    (packages/intentionsutil/scripts/clear-park) names a repo script path, not a
    live-prod web URL, so Claude-in-Chrome verification does not apply (Step 4·0
    non-browser-outcome routing).


    Repo inspection instead (gh + git, not browser) found the residue's recorded
    finding is now stale: sibling PR #2947 (tactic-clear-park-primitive) shows
    state MERGED, mergedAt 2026-07-25T18:21:49Z — the residue text said it was
    "still in phase qa." clear-park now exists on origin/main (git cat-file -e
    origin/main:packages/intentionsutil/scripts/clear-park succeeds). But its
    usage line is still `clear-park <node-id> [note]` with no --base flag — Unit
    3 of this tactic (the mirrored diagnosis-time pin: same leading-flags-only
    --base parse loop, three value forms, 40-hex validation, stale-diagnosis
    exit 3 ordered before the already-cleared no-op guard) was never
    implemented; it was explicitly deferred at plan/execution time because #2947
    had not yet merged. That blocker has now cleared.
  since: 2026-07-28
  recommendation: >-
    File/plan a follow-on tactic that implements Unit 3 of
    tactic-drain-disposition-diagnosis-cas verbatim, now that its blocker (PR
    #2947 / clear-park existing on origin/main) has cleared:


    1. Edit packages/intentionsutil/scripts/clear-park: add the same
    leading-flags-only `--base` parse loop as park-node (three value forms —
    bare 40-hex sha, `<id>=<sha>`, or manifest file; same exit-2 validation),
    the same pin check placed immediately after FRESH_BLOB resolves and strictly
    BEFORE the already-cleared no-op guard (ordering is the crux — see Unit 3's
    rationale in intentions/tactic-drain-disposition-diagnosis-cas.md), and the
    same `stale-diagnosis` exit-3 message wording (substituting `clear-park:`).
    Verify the merged script's internal no-op signal (the `.mts` helper's
    internal exit 3) is fully translated to exit 0 by the wrapper and never
    leaks — remap it (e.g. to 9) if it does, so the script's externally
    observable exit 3 means stale-diagnosis and nothing else.

    2. Extend packages/intentionsutil/scripts/test-park-node.sh with case 10
    exactly as specified: park t-pinned, capture the pin, land a concurrent
    clear from another clone, then assert `clear-park --base <pin> t-pinned`
    exits 3 with the stale-diagnosis marker and unchanged origin_sha (the pin
    must fire instead of the no-op guard).

    3. Once landed, this needs-main residue item (id 10) on
    tactic-drain-disposition-diagnosis-cas can close — re-run /qa-main (or
    verify by hand) to confirm.


    Full spec: intentions/tactic-drain-disposition-diagnosis-cas.md, "Unit 3 —
    clear-park --base" section.
pace_exempt: false
rounds: null
attributes: {}
---
# A batched office-hours drain captures a node's origin/main blob at DIAGNOSIS time (via dump-node.ts) and pins it through a new park-node/clear-park --base flag, so a disposition executes only if origin/main is unchanged since diagnosis — refusing with a distinct exit code (3, stale-diagnosis) that routes back to re-diagnosis, rather than silently landing on top of an intervening fleet write or falling through to graph-commit's own auto-merge-then-park path

## Context

A batched office-hours **drain** diagnoses several parked nodes, interviews the
human author about each proposed disposition, and only then executes the
granted disposition through `park-node` / `clear-park`. Minutes pass between
diagnosis and execution.

Both primitives capture their compare-and-swap token **at execution time**:
`park-node` fetches `origin/main` and resolves `FRESH_BLOB` immediately before
landing (`packages/intentionsutil/scripts/park-node:70`), then passes that blob
to `graph-commit --base` (`park-node:118`). `clear-park` (sibling tactic
`tactic-clear-park-primitive`, PR #2947) mirrors the same self-refresh. So the
CAS always compares against "origin/main right now," never "origin/main as it
was when the human was asked." Any fleet write landing during the interview
window is silently absorbed — including one that would have changed which
disposition the human should have granted. This already happened once: while
the author held an unexecuted grant for one resolution of
`tactic-graph-router-live-worker-visibility`, a concurrent fleet actor landed
the opposite resolution and cleared the park, so a real design question was
settled by push timing rather than by the author's answer.

The capture half of the fix already exists:
`packages/intentionsutil/scripts/dump-node.ts` writes a `base-manifest.txt` of
`<id>=<blobsha>` lines for the content it actually read (`dump-node.ts:52-68`)
and prints the manifest path on stdout. What is missing is the ability for
`park-node` / `clear-park` to **accept and honor an externally-supplied,
diagnosis-time base** instead of always self-deriving one fresh.

**The refusal must not be a park.** `graph-commit --base` cannot serve this
role: on a stale base it does not refuse, it attempts a structural three-way
auto-merge (layer 3) and, failing that, writes an `office_hours` park and
exits 1 (`graph-commit:216-285`, `check_base_freshness` → `park_and_exit`).
Auto-merging a diagnosis-time divergence is exactly the silent absorption this
tactic exists to stop, and parking a node the human is *currently being
interviewed about* is the wrong terminal state. So the pinned-base check
belongs **in `park-node` / `clear-park`, before any mutation**, with its own
exit code that a caller can cheaply distinguish from the other failure modes:

| exit | meaning | caller action |
|---|---|---|
| 0 | landed | done |
| 1 | write / `graph-commit` failed, or `origin/main` unreachable / node absent | genuine failure; surface it |
| 2 | usage error | fix the invocation |
| **3** | **`stale-diagnosis` — origin/main moved since the pinned base** | **re-read the node, re-diagnose, re-interview, retry with a fresh base** |

Exit 3 is new and additive: every existing caller
(`.claude/hooks/dispatch-stop.sh:58-76`) passes positionals only and treats
any non-zero as a generic best-effort failure, so no caller breaks.

Out of scope for this tactic: `clear-park`'s own baseline land-time CAS (that
is `tactic-clear-park-primitive`'s job), and any in-repo drain orchestration
skill (none exists; `.claude/skills/office-hours/SKILL.md` is read-only and
never executes a disposition; `tactic-office-hours-self-modification-skill` is
an unplanned draft). This tactic delivers the mechanical primitive plus the
calling convention that any current or future drain caller — in-repo or the
author's external `~/prompt-emulated-office-hours.md` — must follow.

## Units of work

### Unit 1 — `park-node --base`: pin the diagnosis-time blob, refuse with exit 3

**Recommended model:** sonnet — the flag semantics, insertion point,
exit-code contract, and message marker are all fully specified below.

**Scope.** Edit exactly one file: `packages/intentionsutil/scripts/park-node`.

1. **Argument parsing** (replaces the fixed positional block at
   `park-node:49-58`). Add a **leading-flags-only** parse loop: consume flags
   while the current arg starts with `--`; the first non-flag argument ends
   flag parsing and every remaining argument is positional **verbatim**.
   (Leading-flags-only is deliberate: `<reason>` and `<recommendation>` are
   free text and must never be re-interpreted as flags. Do not add a `-*`
   rejection after the first positional.)
   - `--base <value>` and `--base=<value>` both accepted; `--base` with no
     following argument → `usage:` line on stderr, `exit 2`.
   - Any other leading `--flag` → `usage:` line, `exit 2`.
   - After the loop, apply the existing guard unchanged against the collected
     positionals: fewer than 2 or more than 3, or an empty node id / reason →
     `exit 2`.
   - Updated usage string:
     `usage: park-node [--base <blobsha>|<id>=<blobsha>|<manifest-file>] <node-id> <reason> [recommendation]`.

2. **Resolve `--base` to a 40-hex blob sha** (`PINNED_BASE`), before any
   network call, so a malformed base is a cheap usage error:
   - If the value names an existing **file**, read it as a manifest of
     `<id>=<sha>` lines (blank lines ignored) and select the line whose id
     equals `$NODE_ID`. If `$NODE_ID` is not present in the manifest → error
     on stderr and `exit 2` (the caller handed over a manifest that does not
     cover this node — a caller bug, not staleness). Mirror `graph-commit`'s
     `parse_base_arg` file-vs-literal discrimination (`graph-commit:199-214`).
   - Else if the value matches `<id>=<sha>`, require the id to equal
     `$NODE_ID` (mismatch → `exit 2`) and take the sha.
   - Else treat the value as a bare blob sha.
   - Validate the resulting sha against `^[0-9a-f]{40}$`; anything else →
     `exit 2` with a message naming the offending value. Full-length only,
     because the check is a string equality against `git rev-parse` output,
     which is always full-length; a valid-looking abbreviation would produce a
     spurious exit 3.

3. **The pin check.** Insert immediately after `FRESH_BLOB` is resolved
   (`park-node:70`) and **before** the local-file overwrite at `park-node:74`.
   If `PINNED_BASE` is non-empty and `!= "$FRESH_BLOB"`, print to stderr and
   `exit 3`:

   ```
   park-node: stale-diagnosis — intentions/<id>.md on origin/main is now <FRESH_BLOB> but the pinned --base is <PINNED_BASE>; the node changed between diagnosis and execution. Re-read the node, re-decide the disposition, and retry with a freshly captured base. Nothing was written.
   ```

   The literal token `stale-diagnosis` is the stable machine-greppable
   marker; callers match on it and/or on exit 3. Exiting here guarantees zero
   side effects: it precedes the local overwrite, the `mktemp` at
   `park-node:80`, the `MUTATED` flag, and the EXIT trap installed at
   `park-node:87-101`, so there is nothing to roll back.

4. **Absent-node case stays exit 1.** When the node does not exist on
   `origin/main` (`park-node:70-72`), keep the existing message and `exit 1`
   even if `--base` was supplied. Rationale: this is a hard "cannot park a
   node that is not landed" state, and a re-diagnosis retry loop would spin on
   it forever rather than converge — it needs a human, not a re-read. State
   this in the header comment so it is not re-litigated.

5. **Leave `park-node:118` unchanged** — keep passing
   `--base "$NODE_ID=$FRESH_BLOB"` to `graph-commit`. By construction
   `FRESH_BLOB == PINNED_BASE` once the pin check passes, so substituting the
   pinned value would be a no-op; and `graph-commit`'s `--base` semantics
   (auto-merge, then park) are deliberately *not* what the diagnosis-time pin
   wants. The narrow execution-time race between `park-node`'s fetch and
   `graph-commit`'s fetch keeps its existing auto-merge/auto-park behavior
   (`test-park-node.sh` case 2, around line 298) — unchanged and out of scope.

6. **Header comment** (extend the block at `park-node:17-41`, matching this
   repo's in-line documentation of the other CAS behavior). Document: the
   `--base` flag and its three accepted value forms; that the pin is a
   *diagnosis-time* token distinct from the script's own execution-time
   self-refresh; the new exit 3 and its `stale-diagnosis` marker; that exit 3
   routes to **re-diagnosis, never to a park**; that absent-on-origin/main
   stays exit 1; and a one-line pointer to
   `.claude/skills/ref-diagnosis-time-cas/SKILL.md` for the full caller loop.
   Update the `Usage:` and `Exit codes:` lines (`park-node:37-41`).

**Out of scope:** any change to `graph-commit` (its `--base` is already fully
general — `graph-commit:32,41-45,164,199-214`), to `dump-node.ts`, to
`store.ts`/`schema.ts`, to `demote-node-to-implement`, to
`.claude/hooks/dispatch-stop.sh` or any other existing caller, and to
`clear-park` (Unit 3).

**Dependencies.** None.

### Unit 2 — Extend `test-park-node.sh` with the pinned-base cases

**Recommended model:** sonnet — explicit cases against an existing harness.

**Scope.** Edit exactly one file:
`packages/intentionsutil/scripts/test-park-node.sh` (459 lines). Reuse its
existing machinery unchanged: the bare scratch origin and seed
(`test-park-node.sh:80-150`), `make_clone` (`:153-164`), the `gh`/`npx` PATH
shims (`:166-231`), and the `run_pn` helper (`:241-252`), which already
forwards arbitrary args to `park-node`.

Add `t-pinned` to the `seed_node` id loop at `test-park-node.sh:122-124`, then
append four cases after case 5 (which ends around line 454), each following
the established `ok`/`no` assertion shape (`:76-78`):

- **Case 6 — matching pin lands.** In a fresh clone, capture
  `pin="$(git -C "$ORIGIN" rev-parse main:intentions/t-pinned.md)"`, then
  `run_pn "$X" --base "$pin" t-pinned 'diagnosed reason'`. Assert exit 0 and
  that `origin_show t-pinned` contains `office_hours` — i.e. a matching pin is
  transparent.
- **Case 7 — stale pin refuses with exit 3, zero side effects.** Reusing the
  now-stale `$pin` from case 6 (case 6's own park advanced `origin/main`), run
  `run_pn "$X" --base "$pin" t-pinned 'second reason'`. Assert: exit code
  exactly 3; stderr contains `stale-diagnosis`; `origin_sha` is byte-identical
  to the pre-run value; and `git -C "$X" diff -- intentions/t-pinned.md` is
  empty (no local mutation, nothing for the trap to roll back).
- **Case 8 — manifest-file form and manifest-miss.** Write
  `$WORK/manifest.txt` containing two lines in exactly `dump-node.ts`'s format
  (`t-pinned=<stale sha>` plus an unrelated `t-stale=<sha>` line, proving
  multi-node manifests select correctly). Assert
  `run_pn "$X" --base "$WORK/manifest.txt" t-pinned 'reason'` exits 3 with the
  `stale-diagnosis` marker. Then write a manifest containing only the
  unrelated id and assert the same invocation exits **2** (manifest does not
  cover this node), with `origin_sha` unchanged in both sub-assertions.
- **Case 9 — flag-parsing regressions.** Assert `exit 2` for: `--base` with no
  value; an unknown leading flag; a non-40-hex base value. Assert `exit 0` for
  a bare positional invocation whose `<reason>` and `<recommendation>` contain
  leading dashes and spaces (backward compatibility of the leading-flags-only
  loop) — use a fresh clone and the `t-stale` node.

Update the harness's `# Covers:` header list (`test-park-node.sh:26-52`) with
the new case descriptions, matching the existing entries' level of detail.

**Out of scope:** `test-graph-commit.sh` (no `graph-commit` change), and any
new test file — this repo tests bash CLIs through these functional harnesses,
not `*.test.ts`. The harness is already a required CI step
(`.github/workflows/unit-tests.yml:206-207`), so new cases gate merges
automatically with no workflow edit.

**Dependencies.** Unit 1.

### Unit 3 — `clear-park --base`: the same pin, ordered before the already-cleared no-op

**Recommended model:** opus — the target file does not exist at plan time, so
the implementer must read whatever actually merged and place the check
correctly relative to a guard whose ordering is the crux of the incident.

**Blocked / first action.** `clear-park` is **not on `origin/main` yet**
(verified 2026-07-25:
`git cat-file -e origin/main:packages/intentionsutil/scripts/clear-park`
fails). It is delivered by the sibling tactic `tactic-clear-park-primitive`
(PR #2947, `phase: qa` as of this writing). Before doing anything else, run:

```bash
git fetch origin main && git cat-file -e origin/main:packages/intentionsutil/scripts/clear-park
```

If that fails, **this unit is blocked, not broken** — stop, record it as
deferred pending `tactic-clear-park-primitive` merging, and ship Units 1, 2
and 4 without it. Do not create `clear-park` here; that is the sibling's
deliverable.

**Scope.** Once `clear-park` exists, edit exactly one file plus one test
file:

1. `packages/intentionsutil/scripts/clear-park` — read the merged script
   first and locate its actual arg guard, its `origin/main` fetch and
   `FRESH_BLOB` resolution, and its already-cleared no-op guard (the planned
   design has the `.mts` helper signal already-null via `process.exit(3)`
   which the wrapper translates to a note + `exit 0`). Then apply Unit 1's
   change verbatim in shape:
   - Same leading-flags-only `--base` parse loop, same three value forms,
     same 40-hex validation, same `exit 2` conditions. New usage:
     `clear-park [--base <blobsha>|<id>=<blobsha>|<manifest-file>] <node-id> [note]`.
   - Same pin check, same `stale-diagnosis` message wording (substituting
     `clear-park:`), same `exit 3`, placed immediately after `FRESH_BLOB`
     resolves and before the local overwrite.
   - **Exit-code collision check:** the planned no-op guard already uses an
     internal `3` from the `.mts` helper. That is an *internal* code the
     wrapper translates to `exit 0`; it must never leak. Verify the merged
     script actually translates it, and if the merged implementation lets a
     bare `3` escape to the caller, remap the internal signal (e.g. to `9`)
     so the script's externally observable exit 3 means `stale-diagnosis` and
     nothing else.
   - **Ordering is the crux:** the pin check must run **strictly before** the
     already-cleared no-op guard. The recorded incident is precisely "a
     concurrent fleet actor cleared the park during the interview window" —
     if the no-op guard ran first, that case would return `exit 0` "nothing
     to do" and the drain would record its disposition as *successfully
     executed* when in fact it was pre-empted. With the pin first, that case
     correctly returns exit 3 and routes to re-diagnosis. Call this out in
     the header comment so a future edit does not reorder it.
   - Header comment: same additions as Unit 1 item 6, plus the ordering
     rationale above.
2. `packages/intentionsutil/scripts/test-park-node.sh` — add **case 10**:
   copy `clear-park` into the seed alongside `park-node`
   (`test-park-node.sh:94-100`) **guarded by `[[ -f "$CP_SCRIPT" ]]`**, and
   guard the case itself the same way, printing a skip note when absent so
   the harness stays green on a main without `clear-park`. The case: park
   `t-pinned` via the origin, capture that blob as the pin, land a concurrent
   clear from another clone so the node is already unparked on origin, then
   run `clear-park --base "$pin" t-pinned` and assert exit 3 with the
   `stale-diagnosis` marker and an unchanged `origin_sha` — i.e. the pin
   fires *instead of* the no-op guard. Extend the harness header note to say
   it now covers `clear-park` too.

**Out of scope:** `clear-park`'s own baseline land-time CAS, its
`office_hours = null` payload, its commit-message format, and its
already-cleared semantics — all owned by `tactic-clear-park-primitive`. This
unit only layers the pinned-base capability on top of whatever that tactic
lands.

**Dependencies.** Unit 1 (the shape to mirror), Unit 2 (the harness cases it
extends), and the sibling tactic `tactic-clear-park-primitive` being merged to
`main`.

### Unit 4 — `ref-diagnosis-time-cas` reference skill

**Recommended model:** sonnet — content outline fixed below; the work is
tone-matching an existing template.

**Design decision (stated, not hedged): a new `ref-*` skill, not expanded
script headers.** The script headers document the *flag* (Units 1 and 3 do
exactly that, matching how `park-node:17-41` already documents its other CAS
behavior in-line). But the thing a caller needs is a **three-program
protocol** — capture with `dump-node.ts`, pin through `park-node`/`clear-park`,
and loop back to re-diagnosis on exit 3 — that no single script header owns.
Duplicating that loop into both `park-node` and `clear-park` headers
guarantees drift, and neither header is discoverable to the external
`~/prompt-emulated-office-hours.md` caller. The `ref-*` precedent is exactly
"shared procedure other skills point to instead of restating it"
(`.claude/skills/ref-github-issues/SKILL.md`, `ref-delegability`,
`ref-signal-identification`, `ref-issue-labels`, `ref-memory-management`,
`ref-write-instructions`).

**Scope.** Create one file: `.claude/skills/ref-diagnosis-time-cas/SKILL.md`.
Match the sibling refs' shape — YAML frontmatter with **only** `name` and
`description` (deliberately **no** `context:` key, so it is a loadable
reference rather than an auto-injected one), then an H1 and terse H2
sections, roughly 50-70 lines (siblings run 48-77 lines:
`ref-delegability` = 54, `ref-signal-identification` = 48,
`ref-github-issues` = 77). Read `.claude/skills/ref-github-issues/SKILL.md`
first for tone and table/code-block density.

Frontmatter:

```
name: ref-diagnosis-time-cas
description: Diagnosis-time compare-and-swap reference — how a batched drain captures each node's base blob at diagnosis time and pins it through park-node/clear-park --base, and why an exit-3 stale-diagnosis refusal must route back to re-diagnosis rather than to a park.
```

Sections:

1. **When this applies** — any caller with a gap between deciding a
   disposition and executing it (an office-hours drain interviewing the
   author between the two). Not needed for immediate mechanical parks like
   the Stop-hook backstop (`.claude/hooks/dispatch-stop.sh`), which diagnose
   and execute in the same breath.
2. **The three-step protocol**, with copy-pasteable commands: capture
   (`npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir <dir> <id>...`,
   which prints the manifest path on stdout and writes `<id>=<blobsha>`
   lines); interview; execute
   (`park-node --base <manifest> <id> <reason> [recommendation]` /
   `clear-park --base <manifest> <id> [note]`). Note that one manifest covers
   a whole batch and each script selects its own id's line.
3. **Exit-code contract** — reproduce the 0/1/2/3 table from this plan's
   Context, with the `stale-diagnosis` stderr marker named literally.
4. **The re-diagnosis loop** — on exit 3: re-dump the node (new manifest),
   re-read it, re-decide, re-interview if the change is material to the
   question that was asked, then retry. **Never** convert an exit-3 refusal
   into an `office_hours` park: the node is already parked (or under active
   human review), and parking it again would record a mechanical failure
   where what actually happened is that the diagnosis went stale. Bound the
   loop (2-3 attempts) and escalate to the human if it will not converge.
5. **Why not just `graph-commit --base`** — one short paragraph:
   `graph-commit`'s stale-base path auto-merges (layer 3) and, failing that,
   parks (`graph-commit:216-285`), which is silent absorption plus a wrong
   terminal state for an interview-window divergence. The pin is checked
   earlier, in the disposition script, before any mutation.

**Out of scope:** any edit to `.claude/skills/office-hours/SKILL.md` or any
other existing skill (none of them execute dispositions today, so none has a
call site to point at this ref yet); creating a drain skill; anything under
`~/`.

**Dependencies.** Unit 1 (the flag and exit code the doc describes must
exist). Describe `clear-park --base` in the doc regardless of whether Unit 3
shipped, with a one-line note that it lands with
`tactic-clear-park-primitive`'s follow-on if Unit 3 was deferred.

## Reuse

- `packages/intentionsutil/scripts/dump-node.ts` (`dumpNodes`,
  `dump-node.ts:52-68`) — **no code change**; it already emits exactly the
  `<id>=<blobsha>` manifest format the new `--base` flag consumes, and
  already prints the manifest path on stdout for direct hand-off.
- `packages/intentionsutil/scripts/graph-commit` — **no code change**;
  `--base` already accepts literal pairs or a manifest file with no
  requirement that the caller derived it recently
  (`graph-commit:32,41-45,164,199-214`). Its `parse_base_arg`/`add_base_pair`
  file-vs-literal discrimination (`graph-commit:188-214`) is the parsing
  shape Units 1 and 3 mirror in bash.
- `packages/intentionsutil/scripts/park-node` — its own
  `git fetch origin main` + `git rev-parse origin/main:intentions/<id>.md`
  block (`park-node:70`) already computes the exact value the pin is
  compared against; the check is a two-line addition, not new machinery. Its
  `MUTATED` flag + EXIT-trap rollback pattern (`park-node:82-101`) is what
  the pre-mutation placement deliberately sidesteps, and is the template
  Unit 3 preserves in `clear-park`.
- `packages/intentionsutil/scripts/test-park-node.sh` — the whole
  scratch-origin harness (bare origin `:80-150`, `make_clone` `:153-164`,
  `gh`/`npx` PATH shims `:166-231`, `origin_show`/`origin_sha`/`sync_clone`/
  `edit_line` `:234-239`, `run_pn` `:241-252`, `ok`/`no` `:76-78`). New cases
  are additive; no harness restructuring. Already CI-gated at
  `.github/workflows/unit-tests.yml:206-207`.
- `packages/intentionsutil/scripts/test-graph-commit.sh` — its existing
  `--base` cases 12/13/15 are the reference for manifest-file fixture
  construction if Unit 2's case 8 needs a pattern.
- `.claude/skills/ref-github-issues/SKILL.md` (and `ref-delegability`,
  `ref-signal-identification`) — the format/tone/length template for Unit 4.
- `packages/intentionsutil/src/store.ts` `readNode`/`writeNode` — untouched;
  both scripts keep authoring content exclusively through it.

## Verification

Shell syntax and executability (Units 1, 3):

```verify
bash -n packages/intentionsutil/scripts/park-node || exit 1
bash -n packages/intentionsutil/scripts/test-park-node.sh || exit 1
test -x packages/intentionsutil/scripts/park-node || exit 1
if [ -f packages/intentionsutil/scripts/clear-park ]; then
  bash -n packages/intentionsutil/scripts/clear-park && test -x packages/intentionsutil/scripts/clear-park
fi
```

Usage-error and flag-parsing contract — all of these exit before any network
call, so they are safe to run anywhere (Unit 1):

```verify
set -u
PN=packages/intentionsutil/scripts/park-node
fail=0
check() { # <expected-rc> <label> <args...>
  exp="$1"; label="$2"; shift 2
  "$PN" "$@" >/dev/null 2>&1; rc=$?
  if [ "$rc" -eq "$exp" ]; then echo "PASS: $label"; else echo "FAIL: $label (rc=$rc want=$exp)"; fail=1; fi
}
check 2 "no args"
check 2 "--base with no value"             --base
check 2 "unknown leading flag"             --nope t-x 'reason'
check 2 "non-hex base"                     --base not-a-sha t-x 'reason'
check 2 "short/abbreviated base"           --base deadbeef t-x 'reason'
check 2 "id mismatch in <id>=<sha> base"   --base "other-id=$(printf '0%.0s' $(seq 40))" t-x 'reason'
check 2 "too many positionals"             t-x 'reason' 'reco' 'extra'
grep -q -- '--base' "$PN" && echo "PASS: --base documented in script" || { echo "FAIL: --base not documented"; fail=1; }
grep -q 'stale-diagnosis' "$PN" && echo "PASS: stale-diagnosis marker present" || { echo "FAIL: marker missing"; fail=1; }
grep -q 'exit 3' "$PN" && echo "PASS: exit 3 present" || { echo "FAIL: exit 3 missing"; fail=1; }
exit $fail
```

Full functional harness — no network required (it builds its own bare origin
and shims `gh`/`npx`); needs `bash`, `git`, `jq`, and a real `node`/`npx tsx`
for cases 4-5. This is the primary gate for Units 2 and 3 and is the same
command CI runs (Units 2, 3):

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

Reference-doc structural check (Unit 4):

```verify
set -u
DOC=.claude/skills/ref-diagnosis-time-cas/SKILL.md
fail=0
test -f "$DOC" && echo "PASS: doc exists" || { echo "FAIL: doc missing"; fail=1; }
head -1 "$DOC" | grep -qx -- '---' && echo "PASS: frontmatter opens" || { echo "FAIL: no frontmatter"; fail=1; }
grep -q '^name: ref-diagnosis-time-cas$' "$DOC" && echo "PASS: name key" || { echo "FAIL: name key"; fail=1; }
grep -q '^description: ' "$DOC" && echo "PASS: description key" || { echo "FAIL: description key"; fail=1; }
awk '/^---$/{n++; next} n==1 && /^context:/{found=1} END{exit !found}' "$DOC" \
  && { echo "FAIL: unexpected context: key (ref-* skills are loadable, not auto-injected)"; fail=1; } \
  || echo "PASS: no context: key (matches ref-* precedent)"
for tok in dump-node.ts park-node stale-diagnosis 'exit 3'; do
  grep -q "$tok" "$DOC" && echo "PASS: mentions $tok" || { echo "FAIL: missing $tok"; fail=1; }
done
exit $fail
```

**Manual / observe-in-production** (not auto-runnable — these require a live
`git fetch origin main` and a real `graph-commit` land on `main`, with
network and repository-mutating side effects out of scope for an automated
non-mutating check; same posture as `tactic-clear-park-primitive`'s own
deferred needs-main-residue items):

- **Matching pin round-trip.** Against a real landed scratch node:
  `npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir /tmp/dx <node-id>`,
  then immediately
  `./packages/intentionsutil/scripts/park-node --base /tmp/dx/base-manifest.txt <node-id> "test reason" "test recommendation"`
  (sandbox off — it needs network/daemon/TLS). Confirm exit 0 and that
  `git show origin/main:intentions/<node-id>.md` carries the new
  `office_hours`.
- **Stale pin refusal against real `origin/main`.** Re-run the same
  `park-node --base /tmp/dx/base-manifest.txt ...` after the above land (the
  manifest is now stale). Confirm exit code exactly 3, stderr containing
  `stale-diagnosis`, `git rev-parse origin/main` unchanged, and `git status`
  clean — nothing written locally or remotely.
- **`clear-park` pin beats the no-op guard.** Against a node that is parked
  at capture time but cleared by another actor before execution, confirm
  `clear-park --base <manifest> <node-id>` exits 3 with the `stale-diagnosis`
  marker rather than exiting 0 with the "not parked; nothing to do" note.
  This is the exact `tactic-graph-router-live-worker-visibility` incident
  shape and is the highest-value production observation of this tactic.
- **End-to-end drain loop.** Once a drain caller exists
  (`tactic-office-hours-self-modification-skill`, or the author's external
  `~/prompt-emulated-office-hours.md`), observe that an exit-3 refusal routes
  the caller back into re-diagnosis and never into an `office_hours` park.

## Related

Supersedes the prose-only mitigation currently carried as session memory
("re-verify before executing a granted disposition"), converting session
discipline into mechanism — the same upgrade the 2026-07-06 base-version
clarification made for read-freshness generally.

## needs-main residue

- **id:** 10
  **title:** `clear-park --base` — sibling half of the pin
  **url_path:** `packages/intentionsutil/scripts/clear-park` (does not exist on `origin/main` yet)
  **expected_outcome:** `clear-park` mirrors `park-node`'s `--base` pin (same
  three value forms, same `stale-diagnosis` exit 3, ordered before the
  already-cleared no-op guard) once the sibling tactic
  `tactic-clear-park-primitive` (PR #2947) merges.
  **finding:** `clear-park` is not yet on `origin/main` (PR #2947 is still in
  phase `qa`). This PR's own body and Unit 3 of this tactic explicitly scope
  the mirrored pin out as blocked pending that merge — a documented planned
  deferral, not a defect in this PR. Verify once #2947 merges.
