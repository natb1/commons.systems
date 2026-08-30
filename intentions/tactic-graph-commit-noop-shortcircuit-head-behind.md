---
id: tactic-graph-commit-noop-shortcircuit-head-behind
kind: tactic
statement: graph-commit's nothing-staged no-op short-circuit does not fire for
  the default (worktree) writer when HEAD is strictly BEHIND origin/main, so a
  checkout whose content parity with origin/main is already proven still buys a
  full landing cycle and holds the global landing lock for nothing
owner: ai
status: codified
parent: null
rationale: "Surfaced as a deferred code-review finding during the /review-fix
  pass on PR #2981 (tactic-graph-commit-noop-landing-false-failure). Classified
  out-of-scope for that PR: its Unit 2 explicitly scoped the short-circuit to
  the HEAD==FETCH_HEAD case and listed the HEAD-behind case under Out of scope
  for this unit. Re-verified against origin/main 8a233524 during the 2026-08-20
  /align-tactics finalize, which narrowed the statement: the guard has since
  been widened by one arm for GRAPH_COMMIT_WRITER=plumbing, so the live gap is
  the default worktree writer only, and the stored line anchor
  (graph-commit:1699) is stale — the plan locates the guard by symbol."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr15-graph-commit-simplification
  pr: 3136
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-29T23:45:52Z
    mergeCommitSha: a4a964b8e80bcac307d089b001a5419b1ed46fd8
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit's nothing-staged no-op short-circuit does not fire for the default (worktree) writer when HEAD is strictly BEHIND origin/main, so a checkout whose content parity with origin/main is already proven still buys a full landing cycle and holds the global landing lock for nothing

## Context

`packages/intentionsutil/scripts/graph-commit` has a no-op short-circuit in
`main()`'s nothing-staged branch (added by `tactic-graph-commit-noop-landing-false-failure`,
PR #2981). When nothing is staged and every target id's blob already matches
`origin/main`, running the full landing cycle — landing-lock claim, `graph/**`
scratch push, `await_checks` CI-stamp poll, push to main — cannot change main.
It is pure cost, and it holds the global `refs/graph/landing-lock` while it
burns.

**The finding as originally recorded is now only half true, and its stored
line anchor is stale.** Measured against `origin/main` at `8a233524`
(2026-08-20), the guard has already been widened by one arm since the finding
was filed. It currently reads (locate by symbol — line numbers drift; the
file is 4012 lines):

```sh
# packages/intentionsutil/scripts/graph-commit:3943-3944, in main()'s nothing-staged branch
if [[ "$head_sha" == "$main_sha" ]] \
   || [[ "$GRAPH_COMMIT_WRITER" == "plumbing" && "$all_ids_match_main" -eq 1 ]]; then
```

`GRAPH_COMMIT_WRITER` defaults to `worktree` (graph-commit:418, where the
comment states the default deliberately stays `worktree`; only
`dispatch-eval-finding` opts into `plumbing` today). So:

- the **plumbing** writer already short-circuits the HEAD-behind case
  (regression-covered by test-graph-commit.sh Case 74);
- the **default worktree** writer still does not — it falls through to the
  `unpushed -eq 0` branch at graph-commit:3968-3971 ("landing current HEAD
  … the landing cycle will fast-forward") and runs `land()` in full.

That remaining gap — the default writer only — is what this tactic closes.
The stored Provenance anchor `graph-commit:1699` is **stale**; that line today
sits inside `build_commit_plumbing()`'s prune-path hashing and is unrelated.

**Two structural facts make the fix small and provably safe** (both verified
in-session against `8a233524`):

1. `unpushed` (graph-commit:3909, `git rev-list --count "$main_sha..$head_sha"`)
   is already exactly the ancestry read the finding asks for: `unpushed -eq 0`
   *is* "HEAD is at or behind origin/main". No new
   `git merge-base --is-ancestor` subprocess is needed.
2. `all_ids_match_main` (graph-commit:3914-3927) is already the content-parity
   proof. Stronger: **reaching the guard with `unpushed -eq 0` already implies
   `all_ids_match_main -eq 1`**, because the per-id loop `die`s on any blob
   mismatch unless `id_divergence_is_own_orphan` excuses it, and that helper
   (graph-commit:1528-1550) requires a commit in `MAIN_SHA..HEAD` — impossible
   when `unpushed` is 0. Consequences: the existing `head_sha == main_sha` arm
   is *strictly subsumed* by a content-parity + `unpushed -eq 0` test, and the
   `unpushed -eq 0` else-arm at graph-commit:3968-3971 becomes **dead code**
   once the guard is widened.

**Intended outcome.** A worktree-writer invocation with nothing staged whose
target ids already match `origin/main` exits 0 immediately — zero `gh` calls,
no scratch branch, no landing lock, no CI stamp — whether HEAD equals
`origin/main` or is merely contained in it.

**Sequencing and obsolescence (re-checked 2026-08-20, correcting the stored
note).** The stored body says this surface disappears if `tactic-graph-ref-split`
lands first. That node is at `phase: implement` — **not landed** — so this work
is live, not obsolete. Two sibling drafts touch the same function and **must
not be edited by this plan**: `tactic-graph-commit-plumbing-default` (phase
null) and `tactic-graph-commit-direct-three-way-merge` (phase null). If
`tactic-graph-commit-plumbing-default` lands first the default writer becomes
`plumbing` and this fix is largely subsumed — but the arms are independent, so
either landing order is safe and neither blocks the other.

**Accepted behavior change, stated explicitly.** Today a behind-but-clean
worktree-writer invocation fast-forwards the caller's checkout as a *side
effect* of `land()`'s rebase. After this change it does not: HEAD stays where
it was. That is correct — `graph-commit` is a writer, not a tree-sync
primitive (`sync_main_checkout` in `lib.sh`, or an explicit `fetch` +
`reset --hard`, is the sync path), and the `plumbing` arm already set exactly
this precedent for its writer. Do not add a compensating fast-forward.

---

## Unit 1 — Widen the nothing-staged no-op short-circuit to content parity, writer-agnostic

**Scope.** `packages/intentionsutil/scripts/graph-commit` only.

1. **The guard** (currently graph-commit:3943-3944, inside `main()`'s
   nothing-staged branch; find it by the `assert_noop_matches_intent` call
   immediately below it). Replace the two-arm condition with the greenfield
   form that states the actual semantics — content parity is *necessary*, and
   then either HEAD can contribute nothing or HEAD is not the writer's subject
   at all:

   ```sh
   if [[ "$all_ids_match_main" -eq 1 ]] \
      && { [[ "$unpushed" -eq 0 ]] || [[ "$GRAPH_COMMIT_WRITER" == "plumbing" ]]; }; then
   ```

   This drops the `head_sha == main_sha` arm as strictly subsumed (see Context
   fact 2), preserves the plumbing arm's behavior byte-for-byte, and reuses
   both existing locals — **no new `git` subprocess**. Keep the `head_sha` /
   `main_sha` locals: the echo below still prints both shas.
2. **Do not touch** the body of the short-circuit: `assert_noop_matches_intent`
   (graph-commit:1447-1477) is content-based (SNAP_DIR intent vs `$MAIN_SHA`
   blob), so it is already correct for the behind case; the existing echo at
   graph-commit:3951 already names both shas and does not assert equality, so
   its wording stays; `emit_verdict_and_exit noop` stays the single exit path.
3. **Comment block above the guard** (graph-commit:3929-3942) currently
   documents two arms. Rewrite it for the single condition: content parity is
   the load-bearing test; `unpushed -eq 0` means HEAD is contained in
   `origin/main` and so can contribute nothing to a push; the plumbing writer
   builds from on-disk content and never had HEAD as its subject. State
   explicitly that a mismatch with `unpushed -eq 0` cannot reach here (the
   per-id loop dies), and that the widened arm is confirmed downstream by
   `print_verdict()`'s **step 3** (content equivalence), not step 2 — Unit 2
   records why.
4. **Delete the now-dead else arm** at graph-commit:3968-3971 (the "HEAD … is
   behind origin/main …; no unpushed local commit, so the landing cycle will
   fast-forward" message). After the widening, reaching that point implies
   `unpushed -gt 0`. Collapse the `if [[ "$unpushed" -gt 0 ]]` / `else` pair
   into the unconditional orphan-recovery echo, and rewrite the comment block
   above it (graph-commit:3959-3966) to say why only the orphan case remains
   reachable. Do **not** keep the branch as defensive residue and do **not**
   add an unreachable-assertion `die` — dead code with a lying message is the
   thing being removed.
5. **`assert_noop_matches_intent`'s die prose** (graph-commit:1470). The
   phrase "yet nothing was staged and HEAD is already origin/main" becomes
   inaccurate once the behind case reaches this guard. Reword that clause to
   cover both, e.g. "yet nothing was staged and nothing this tree holds could
   land it (every id already matches origin/main, and HEAD is at or behind
   it)". **Preserve verbatim** the substrings test-graph-commit.sh Case 79
   greps for: `intentions/$id.md`, `Refusing to emit a false 'landed'`,
   `preserved at $SNAP_DIR`, and the `--base $id=<sha>` note. Change no logic
   in this function.

**Out of scope for this unit:** the plumbing arm's semantics; the `unpushed > 0`
orphan-recovery path (that is real work to push and must keep running the
landing cycle); `ensure_intentions_only_base()`; anything in `land()` /
`try_land()`; and any edit to `tactic-graph-commit-plumbing-default` or
`tactic-graph-commit-direct-three-way-merge` territory (the writer default at
graph-commit:418 stays `worktree`).

**Recommended model:** opus.

---

## Unit 2 — `print_verdict()`: report a no-push equivalence honestly, and record why step 2 stays strict

**Scope.** `packages/intentionsutil/scripts/graph-commit`, `print_verdict()`
only.

Context: with Unit 1 landed, a behind-HEAD no-op reaches `print_verdict noop`
with `PUSHED_SHA` empty and `head_sha != main_sha`. Step 2 (graph-commit:2261-2279)
therefore does not fire, and the run resolves at **step 3** (content
equivalence, graph-commit:2281-2352) to `landed-equivalent` → exit 0
(`emit_verdict_and_exit`, graph-commit:2432-2439). The *status* is right; the
*reason phrase* is not — it currently reads `no push did not reach
origin/main, but … (a peer landed identical content)`, and no peer did
anything here.

1. **Step 3's reason text** (graph-commit:2347-2349, the
   `elif [[ "$unsatisfied" -eq 0 ]]` arm). Branch the phrase on whether a push
   was ever attempted:
   - `PUSHED_SHA` empty → "no push was attempted, and origin/main already
     carries exactly this invocation's intended content for every id — there
     was nothing to land".
   - `PUSHED_SHA` set → keep today's wording verbatim, including "(a peer
     landed identical content)".

   Keep `verdict="landed-equivalent"` in both cases and keep the line shape
   produced by `_emit_verdict_line` unchanged — `land-align-round:244` gates on
   the structured fields (`pushed=none` still matches its regex), never on the
   reason phrase.
2. **Do NOT widen step 2** to an ancestry test, and record why in its comment.
   Widening `head_sha == main_sha` to `git merge-base --is-ancestor HEAD FETCH_HEAD`
   would introduce a **false `landed`**: `print_verdict` re-fetches
   `origin/main`, so if a peer lands a *different* edit to one of our ids
   between `main()`'s fetch and that re-fetch, HEAD is still an ancestor of the
   new main while main no longer carries this run's intended content — step 2
   would report `landed` and skip the content comparison that catches it. The
   strict ref test is what makes step 2 self-limiting; step 3 is the correct
   home for the behind case precisely because it is content-based and reads a
   fresh main. Add this as a short paragraph in step 2's existing comment block
   (which already explains the deliberate `context == "noop"` scoping —
   preserve that scoping and that explanation).

**Out of scope:** step 1 (ancestry), the park/prune arms, `_emit_verdict_line`,
the exit mapping, and the verdict-contract header block at graph-commit:123-168
(no status changes, so it needs no edit).

**Recommended model:** sonnet.

**Dependencies:** Unit 1.

---

## Unit 3 — Regression case: default (worktree) writer, checkout strictly behind origin/main

**Scope.** `packages/intentionsutil/scripts/test-graph-commit.sh` only (3732
lines; a plain shell suite, **not** vitest).

1. **Seed a fixture id.** Add `t-behind-noop` and `t-behind-advance` to the
   `seed_node` id list at test-graph-commit.sh:427-444 (the loop that ends
   `t-noop-guard t-noop-unit t-merge-npx-guard`).
2. **Append a new case at the end of the case sequence** — after Case 83
   ("npx is never invoked on the write path") and **before** the final
   "No scratch branches left behind anywhere" block. Numbering runs past 83;
   append as Case 84, do not renumber anything.

   Model it directly on **Case 74** (test-graph-commit.sh:3334-3357), which is
   the same defect scoped to the plumbing writer. The new case is Case 74's
   shape **without** the `GRAPH_COMMIT_WRITER=plumbing` export, so it exercises
   the default `worktree` writer:

   ```sh
   # --- Case 84: worktree writer, a clean checkout merely BEHIND origin/main ---
   set_mode green
   sync_clone "$B"
   sync_clone "$A"
   edit_line "$A" t-behind-advance 4 advance-main-past-B
   run_gc "$A" -m 'test: advance main past B' t-behind-advance >/dev/null 2>&1
   before="$(origin_sha)"
   calls_before="$(gh_calls)"
   out="$(run_gc "$B" -m 'test: worktree no-op behind main' t-behind-noop 2>&1)"; rc=$?
   ```

   Assert, all of: `rc -eq 0`; `grep -q 'no new changes to stage' <<<"$out"`;
   `grep -q 'skipping the landing cycle' <<<"$out"`;
   `! grep -q 'landing current HEAD' <<<"$out"` (the dead branch Unit 1
   removes must not be printed); `"$(origin_sha)" == "$before"`;
   `"$(gh_calls)" == "$calls_before"` (zero stamp polls); `-z "$(scratch_refs)"`
   (no `graph/**` scratch branch pushed); and the verdict line pinned to
   Unit 2's classification —
   `grep -q 'verdict: landed-equivalent .*pushed=none .*context=noop' <<<"$out"`.
   Use `ok` on success and `no "…"` plus `printf '%s\n' "$out"` on failure, in
   the file's house style. Finish with `sync_clone "$B"` so later blocks see a
   clean clone.
3. **Add a hard-fail arm to the same case** (the Case 41 angle,
   test-graph-commit.sh:2195-2214). With `$B` still behind (the no-op pushed
   nothing), run `set_mode hard-fail` and repeat the invocation on `$B`;
   assert `rc -eq 0`, `! grep -q 'polling failed' <<<"$out"`, and
   `gh_calls -eq 0`. This proves the short-circuit fires *before* the poller,
   so a broken `gh` cannot turn a behind-checkout no-op into a failure. Restore
   with `set_mode green` and `sync_clone "$B"` afterwards.

**Reuse verbatim, do not hand-roll:** `run_gc` (test-graph-commit.sh:993-1012 —
the subshell wrapper that wires PATH, the gh mode file, the call log and the
fixture dir, then invokes `bash packages/intentionsutil/scripts/graph-commit`),
`set_mode` / `gh_calls` / `origin_sha` / `sync_clone` / `edit_line` /
`scratch_refs` (test-graph-commit.sh:978-991), and the shared `$A` / `$B`
clones. `make_clone` (test-graph-commit.sh:496-511) is available if a dedicated
clone turns out to be needed, but Case 74 shows `$A`/`$B` suffice.

**Out of scope:** modifying Case 41, Case 74, or Cases 78-79; renumbering
cases; touching `test-park-node.sh` or any other suite.

**Recommended model:** sonnet.

**Dependencies:** Units 1 and 2 (the case asserts both behaviors).

---

## Reuse

- `packages/intentionsutil/scripts/graph-commit:3909` — `unpushed`
  (`git rev-list --count "$main_sha..$head_sha"`). Already the ancestry read;
  `unpushed -eq 0` is exactly "HEAD is contained in origin/main". Reuse instead
  of adding `git merge-base --is-ancestor`.
- `packages/intentionsutil/scripts/graph-commit:3914-3927` —
  `all_ids_match_main`, the per-id blob comparison against `$MAIN_SHA`. The
  content-parity proof the widened guard rests on; it also carries the
  `id_divergence_is_own_orphan` exemption and the wrong-repo `die`.
- `packages/intentionsutil/scripts/graph-commit:1528-1550` —
  `id_divergence_is_own_orphan()`. Reads `MAIN_SHA..HEAD`, so it cannot excuse
  a divergence when `unpushed` is 0; this is what makes the widened arm
  provably safe.
- `packages/intentionsutil/scripts/graph-commit:1447-1477` —
  `assert_noop_matches_intent()`. Content-based and writer-agnostic; already
  guards the widened arm without logic change (prose only, Unit 1 step 5).
- `packages/intentionsutil/scripts/graph-commit:2432-2439` —
  `emit_verdict_and_exit()` and its `landed|landed-equivalent → exit 0`
  mapping. The widened arm routes through the existing call, not a new exit.
- `packages/intentionsutil/scripts/graph-commit:2281-2352` — `print_verdict()`
  step 3. Ref-agnostic content comparison against a freshly fetched
  `origin/main`; already resolves the behind-main case correctly.
- `packages/intentionsutil/scripts/test-graph-commit.sh:3334-3357` — Case 74,
  the direct template for the new case.
- `packages/intentionsutil/scripts/test-graph-commit.sh:2195-2214` — Case 41,
  the hard-fail-mode assertion shape.
- `packages/intentionsutil/scripts/test-graph-commit.sh:978-1012` and `:496-511`
  — `set_mode`, `gh_calls`, `origin_sha`, `sync_clone`, `edit_line`,
  `scratch_refs`, `run_gc`, `make_clone`.

## Verification

The suite is a plain shell suite invoked directly by CI
(`.github/workflows/unit-tests.yml:305` → `packages/intentionsutil/scripts/test-graph-commit.sh`).
There is **no vitest project** for it — do not invoke `npx vitest`.

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

The full suite must pass, not just the new case. Specifically these must stay
green unchanged: Case 41 (no-op short-circuit under hard-fail `gh`), Case 74
(plumbing writer behind main), Cases 78-79 (far-ahead edit is never a `noop`;
the `assert_noop_matches_intent` unit arms, which grep the die prose Unit 1
step 5 edits), and Case 48 (far-ahead + stale `--base` layer-3 merge).

Sibling suites that exercise the same writer and the verdict contract:

```verify
packages/intentionsutil/scripts/test-park-node.sh || exit 1
packages/intentionsutil/scripts/test-land-align-round.sh || exit 1
packages/intentionsutil/scripts/test-verify-landed.sh || exit 1
packages/intentionsutil/scripts/test-transition-node.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / judgment checks:

- **Dead-branch removal is complete.**
  `grep -n 'landing cycle will fast-forward' packages/intentionsutil/scripts/graph-commit`
  must return nothing after Unit 1.
- **No new subprocess on the hot path.**
  `grep -n 'merge-base --is-ancestor' packages/intentionsutil/scripts/graph-commit`
  must show only the pre-existing `print_verdict()` step-1 use — the widened
  guard adds none.
- **Verdict-contract consumers unaffected.** Re-read
  `packages/intentionsutil/scripts/land-align-round:244`: its regex gates on
  the structured fields (`pushed=none` matches), never on the reason phrase
  Unit 2 edits. Confirm no other consumer greps `a peer landed identical
  content` (as of 2026-08-20 there is none outside graph-commit itself).
- **Observe in production.** After merge, watch a tick's `graph-commit` runs
  where a worker worktree is behind `origin/main` with an unchanged node: the
  run should print the "no new changes to stage … skipping the landing cycle"
  line and a `verdict: landed-equivalent … pushed=none … context=noop` line,
  with no `graph/**` scratch branch and no landing-lock claim in the same
  window. This is the cost the tactic exists to remove; there is no counter to
  read, so read the run's own stderr.
- **Accepted side effect.** Confirm during review that nothing in the change
  compensates for the checkout no longer being fast-forwarded as a side effect
  of the skipped `land()` (see Context, "Accepted behavior change").

## Provenance and carried-forward evidence

- **Source:** deferred code-review finding from the `/review-fix` pass on
  PR #2981 (`tactic-graph-commit-noop-landing-false-failure`, phase done).
  That PR's Unit 2 explicitly scoped its short-circuit to the
  `HEAD == FETCH_HEAD` case and listed the HEAD-behind case under "Out of scope
  for this unit" — settled precedent to extend, not re-litigate.
- **Adversarial verdict:** not independently verify-gated (code-review residue
  bucket `Deferred`; Lane-A code-review findings are trusted from the built-in
  review directly). The mechanism claims in this plan were, however, re-verified
  in-session against `origin/main` `8a233524` on 2026-08-20.
- **Stale anchor, corrected:** the original record cited
  `packages/intentionsutil/scripts/graph-commit:1699`. That line is unrelated
  today. Locate the guard by symbol — `main()`'s nothing-staged branch, the
  `if` immediately preceding `assert_noop_matches_intent`.
- **Obsolescence, re-checked 2026-08-20:** `tactic-graph-ref-split` (which
  would delete the CI stamp and `await_checks` entirely, taking this surface
  with it) is at `phase: implement`, not landed. If it lands before this work
  starts, close this node as obsolete; otherwise the work stands.

## What shipped — 2026-08-29, all three units

Landed in #3136 (merge commit `a4a964b8`), Position 2 of the dispatch/RSI
serialized window.

**Unit 1 — the guard is now writer-agnostic.** It reads:

```
all_ids_match_main == 1 && (unpushed == 0 || GRAPH_COMMIT_WRITER == plumbing)
```

The old `head_sha == main_sha` arm is **subsumed, not dropped**: `HEAD ==
origin/main` implies `unpushed == 0`, so every invocation that short-circuited
before still does. No new `git` subprocess was added. The dead `else` arm is
gone — `grep -n 'landing cycle will fast-forward'` now returns nothing — and the
`if/else` pair collapsed into the unconditional orphan-recovery echo, with no
unreachable `die` left as residue. The `die` prose in
`assert_noop_matches_intent` was reworded, preserving all four grep-pinned
substrings verbatim.

The safety argument, verified against source rather than asserted: reaching the
guard with `unpushed == 0` **forces** content parity, because a divergent id
cannot get past the loop above — `id_divergence_is_own_orphan()` reads
`MAIN_SHA..HEAD`, that range is empty when nothing is unpushed, so the `die`
fires first. The widened arm is therefore unreachable on divergent content.
`MAIN_SHA` and the locally-computed `main_sha` are the same `FETCH_HEAD` on
every path that reaches the guard; the only intervening fetch is inside
`park_and_exit`, which exits.

**Unit 2 — honest verdict reporting.** `print_verdict()`'s step-3 reason no
longer credits "a peer landed identical content" when `PUSHED_SHA` is empty and
no push was ever attempted; that named an actor which did nothing. The
push-attempted wording is preserved verbatim. Step 2's ref test is left
**strict** on purpose, with a comment recording why: relaxing it to
`merge-base --is-ancestor` would manufacture a false `landed`, because that
function re-fetches and a peer can land a *different* edit to one of our ids in
between. The behind case belongs to step 3, which is content-based and reads the
fresh tip.

**Unit 3 — regression case.** Shipped as **Case 85**, not Case 84 — a Case 84
already existed (the real-park-helper block). No `GRAPH_COMMIT_WRITER` export,
so it exercises the default writer. It carries two assertions beyond those
specified, both anti-vacuity guards: a fixture precondition that the clone is
genuinely behind main, and a check that `HEAD` is unmoved afterwards.

**Accepted behavior change:** a behind-but-clean worktree-writer run no longer
fast-forwards the caller's checkout as a side effect of `land()`'s rebase.
`graph-commit` is a writer, not a tree-sync primitive — `sync_main_checkout()`
in `lib.sh` is the sync path. Do not add a compensating fast-forward.

### Independence from the unwritten Units 1–2 of PR15

PR15 shipped under a split ruling that deliberately did **not** write the
`GRAPH_COMMIT_WRITER` default flip or the worktree-writer retirement. Verified:
the default still reads `worktree`. That is exactly why this node was needed —
its whole point was to close the *worktree*-writer gap while that remains the
default, and it listed the default as out of scope from the outset. The two
sibling drafts those units would have closed,
`tactic-graph-commit-plumbing-default` and
`tactic-graph-commit-direct-three-way-merge`, were correctly left untouched;
both remain open and travel with ref-split. They are not silently absorbed here.

The node's "close as obsolete" branch does **not** apply: `tactic-graph-ref-split`
is still unlanded under the 2026-08-29 ruling, so this work stands as done on its
own merits, not as obsolete.

### Corrections to this node's own text

- The `statement`/title reads as though the guard were strictly `HEAD ==
  origin/main`. It was not: a content-parity arm already existed, gated to the
  plumbing writer. The Context section says so; the title does not.
- Every line anchor has drifted by roughly 100–140 lines. Locate by symbol.
- "Append as Case 84" is stale — see above.

### Residue, carried forward as an observation

A live tick showing a behind-main worker print "skipping the landing cycle" with
`pushed=none … context=noop` and no landing-lock claim has not yet been
observed. Observe-in-production item, not unshipped scope.

**Verification:** `test-graph-commit.sh` 124/0 (three consecutive clean runs);
`test-park-node.sh` 25/0; `test-land-align-round.sh` 10/0; `test-verify-landed.sh`
25/0; `test-transition-node.sh` 3/0; `run-lint.sh` clean.

The new case was proven non-vacuous by reverting only `graph-commit`, keeping the
case, and confirming both arms `FAIL`. That proof caught a real vacuity bug on
its first attempt: under the old code `land()` fast-forwarded the fixture, so the
hard-fail arm passed against broken code. Both arms now assert their precondition
before testing. Separately, `assert_noop_matches_intent` was **measured** — not
asserted — to still fire on the widened path, via a temporary `die` probe that
was then removed and the file confirmed byte-identical.
