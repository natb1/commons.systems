---
id: tactic-fastpath-guard-empty-push-residual
kind: tactic
statement: "Graph fast-path guard: treat empty PUSHED_COMMITS from a concurrent
  already-landed push as a benign skip instead of a fail-closed refusal"
owner: ai
status: codified
parent: null
rationale: "Post-#2898 residual, observed twice on 2026-07-23 blocking
  clear-park landings: a scratch graph branch pushed at a SHA already landed on
  main produces an empty push payload, and check-graph-fast-path.sh refuses
  fail-closed (PUSHED_COMMITS is empty). tactic-graph-fastpath-guard-diff-base
  (phase qa) predicted this sub-case but its landed scope excludes it. Checked
  at finalization (2026-07-23): not a duplicate — that node's fix explicitly
  deferred this empty-payload case as intentional fail-closed behavior;
  production experience since shows it false-fails a provably-safe
  concurrent-landing race."
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-fastpath-guard-empty-push-residual
  pr: 2956
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Graph fast-path guard: treat empty PUSHED_COMMITS from a concurrent already-landed push as a benign skip instead of a fail-closed refusal

## Context

`.github/scripts/check-graph-fast-path.sh` is the CI guard for the `graph/**`
fast-path workflow (`.github/workflows/graph-fast-path.yml`).
`packages/intentionsutil/scripts/graph-commit` force-pushes a scratch commit to
a `graph/<id>-<pid>` branch to trigger this workflow, then fast-forwards that
same SHA onto `origin/main` once required checks stamp green
(`graph-commit:718-727` explains the scratch push is a plain `--force`, not
`--force-with-lease`, since the branch is PID-scoped/throwaway; the fast-forward
itself is at `graph-commit:745`). The guard reads `PUSHED_COMMITS` (env var,
`${{ toJSON(github.event.commits.*.id) }}` — a JSON array of SHA strings from
the push-event payload) and, at script lines 36-39, currently fail-closes with
`exit 1` whenever that array is empty.

An empty `PUSHED_COMMITS` array has a confirmed benign cause: two concurrent
`graph-commit` invocations can produce byte-identical commit content (identical
tree + parent + author/committer timestamps), hence the identical commit SHA.
When one invocation's fast-forward to `main` lands first, the other
invocation's later scratch-branch push of that same already-landed SHA is a
push GitHub already knows about, so `github.event.commits` is empty for that
push event. This false-positive blocked two legitimate landings in production
on 2026-07-23 (`##[error]PUSHED_COMMITS is empty — no pushed commits to
verify. Refusing to fast-path (fail-closed).`), each requiring manual `git
reset --hard origin/main` recovery so the next attempt produced a genuinely
new commit.

This is a distinct, narrower case than the one fixed by the already-merged PR
#2898 (`tactic-graph-fastpath-guard-diff-base`, phase `qa`), which anchored the
intentions-only diff check to the payload instead of a moving
`origin/main...HEAD` three-dot range. That fix's own code comment explicitly
deferred this empty-payload case, documenting it as intentional fail-closed
behavior ("An empty `commits` array occurs only in the degenerate 'scratch SHA
already reachable from another ref at push time' case... refusing here is not
a new regression"). This tactic revisits that explicit prior decision because
production experience since then shows it is a false-positive that blocks
legitimate concurrent landings, not a security concern — **provided** the fix
only skips when it can prove the SHA is safe, never on empty-payload alone.
Checked against the graph corpus at finalization: no other node (including
`tactic-graph-commit-delete-vs-edit-park-hardening` and
`tactic-graph-commit-landing-lock`, which address `graph-commit`'s internal
race handling, not this CI guard's empty-payload behavior) covers this case —
not a duplicate.

## Unit 1 — Ancestry-guarded benign skip for empty PUSHED_COMMITS (script + workflow + tests)

**Recommended model:** opus

Correctness/security-sensitive: the failure mode of a wrong call is failing
*open* (accepting an unverified push through a guard that stamps required
checks green without real CI). The ancestry proof, the ref-validity handling,
and the fail-closed fall-through all require careful judgment.

**Scope.**

**(1a) `.github/scripts/check-graph-fast-path.sh` — replace the unconditional
empty-array `exit 1` at lines 30-39.**

Current block (lines 30-39):

```bash
# Fail-closed on an empty commit list. An empty `commits` array occurs only in
# the degenerate "scratch SHA already reachable from another ref at push time"
# case (a re-push of an already-landed SHA). Today's three-dot guard ALSO
# false-fails in that same case, so refusing here is not a new regression — it is
# the intended fail-closed behavior. Falling back to head_commit.id or an
# origin/main range would fail OPEN and defeat the guard's purpose.
if [ "${#SHAS[@]}" -eq 0 ]; then
  echo "::error::PUSHED_COMMITS is empty — no pushed commits to verify. Refusing to fast-path (fail-closed)."
  exit 1
fi
```

Replace with (exact text to transcribe):

```bash
# An empty `commits` array is NOT automatically fatal. It has one confirmed
# benign cause: graph-commit force-pushes a scratch SHA to trigger this workflow,
# then fast-forwards that SAME SHA onto main. If a second concurrent graph-commit
# produced byte-identical commit content (identical tree+parent+timestamps =>
# identical SHA) and its fast-forward landed FIRST, this push re-pushes a SHA
# GitHub already knows about, so github.event.commits is empty. That SHA is
# already on main and was already verified — refusing it false-fails a legitimate
# landing. We skip ONLY when we can PROVE the pushed HEAD SHA is already reachable
# from origin/main; every other empty-payload case stays fail-closed. Note a
# fetch-depth: 0 checkout (actions/checkout, graph-fast-path.yml) makes
# origin/main available as refs/remotes/origin/main without an extra fetch step.
if [ "${#SHAS[@]}" -eq 0 ]; then
  HEAD_SHA="${PUSHED_HEAD_SHA:-}"
  if [ -z "$HEAD_SHA" ]; then
    echo "::error::PUSHED_COMMITS is empty and PUSHED_HEAD_SHA is unset — cannot prove the pushed commit already landed. Refusing to fast-path (fail-closed)."
    exit 1
  fi
  if ! git rev-parse --verify --quiet "refs/remotes/origin/main^{commit}" >/dev/null; then
    echo "::error::PUSHED_COMMITS is empty and origin/main is not available to verify the pushed commit already landed. Refusing to fast-path (fail-closed)."
    exit 1
  fi
  if git merge-base --is-ancestor "$HEAD_SHA" refs/remotes/origin/main 2>/dev/null; then
    echo "::notice::PUSHED_COMMITS is empty but pushed HEAD $HEAD_SHA is already reachable from origin/main (benign concurrent already-landed push). Skipping fast-path verification."
    exit 0
  fi
  echo "::error::PUSHED_COMMITS is empty and pushed HEAD $HEAD_SHA is NOT reachable from origin/main — cannot prove it already landed. Refusing to fast-path (fail-closed)."
  exit 1
fi
```

Design decisions (binding, not implementer discretion):

- **Env var name `PUSHED_HEAD_SHA`**, carrying `${{ github.sha }}`. On a branch
  push, `github.sha` is the tip commit of the pushed ref — exactly the scratch
  SHA that (in the benign case) already landed on main. No existing convention
  to match beyond `PUSHED_COMMITS` itself (the only other repo-wide
  `github.sha` use is the unrelated `.github/workflows/prod-deploy.yml:38`).
- **`git merge-base --is-ancestor "$HEAD_SHA" refs/remotes/origin/main`** is
  the proof. `--is-ancestor` returns 0 when the first commit is an ancestor of
  the second, and a commit counts as its own ancestor — so it returns 0 both
  when `origin/main` points *at* the pushed SHA and when main has advanced
  *past* it. Returns non-zero (not an ancestor) → fail-closed. Used as an `if`
  condition so `set -e` doesn't abort on the legitimate "not an ancestor" exit
  code.
- **`origin/main` ref validity is explicit and fail-closed.** Before the
  ancestry test, `git rev-parse --verify --quiet
  "refs/remotes/origin/main^{commit}"` confirms the ref resolves to a commit.
  If not, emit a clear `::error::` and `exit 1` rather than letting
  `merge-base` fail under `set -e` with an opaque message.
- **`2>/dev/null` on `merge-base`** suppresses git's stderr noise on the rare
  path where `$HEAD_SHA` is not a resolvable object in the checked-out repo; in
  that case `--is-ancestor` returns non-zero, the `if` treats it as "not
  proven," and control falls through to the final fail-closed `exit 1` — a
  bogus HEAD SHA can never skip the guard.
- **Empty string is treated identically to unset**: `"${PUSHED_HEAD_SHA:-}"`
  collapses both to the empty-`HEAD_SHA` fail-closed branch.

**Out of scope for 1a:** the non-empty-`PUSHED_COMMITS` path (lines 41-100,
now shifted by the replacement) is untouched — every existing per-commit
intentions-only / merge / symlink / no-op check stays exactly as is. Do not
add `head_commit.id` or `origin/main...HEAD` range fallbacks (they fail open).
Do not touch `graph-commit`'s push logic (the `--force` scratch push at
`graph-commit:724` is intentional and PID-scoped; this tactic only relaxes the
guard's reaction, not the push).

**(1b) `.github/workflows/graph-fast-path.yml` — add the new env var, in the
`Verify the push is intentions/-only` step (lines 20-22).**

Current:

```yaml
      - name: Verify the push is intentions/-only
        env:
          PUSHED_COMMITS: ${{ toJSON(github.event.commits.*.id) }}
        run: .github/scripts/check-graph-fast-path.sh
```

Replace the `env:` map with:

```yaml
      - name: Verify the push is intentions/-only
        env:
          PUSHED_COMMITS: ${{ toJSON(github.event.commits.*.id) }}
          PUSHED_HEAD_SHA: ${{ github.sha }}
        run: .github/scripts/check-graph-fast-path.sh
```

**Out of scope for 1b:** no changes to the `checkout` step (already runs
`fetch-depth: 0`, which fetches full history for all branches so
`refs/remotes/origin/main` is present — no added fetch step needed), and no
changes to the `acceptance`/`preview-and-smoke`/`lint`/`unit-tests` stamp jobs.

**(1c) `.github/scripts/test-check-graph-fast-path.sh` — extend the harness
and cover the three ancestry outcomes.**

First, extend `run_check` (lines 64-69) to accept an optional third positional
argument as `PUSHED_HEAD_SHA`, defaulting to empty so the existing 2-arg call
sites (cases a-d2, f, g) keep working unchanged:

Current:

```bash
run_check() {
  local repo="$1" shas="$2"
  RC=0
  STDERR=""
  STDERR=$(cd "$repo" && export PUSHED_COMMITS="$shas" && "$CHECK_SCRIPT" 2>&1) || RC=$?
}
```

Replace with:

```bash
run_check() {
  local repo="$1" shas="$2" head_sha="${3:-}"
  RC=0
  STDERR=""
  STDERR=$(cd "$repo" && export PUSHED_COMMITS="$shas" PUSHED_HEAD_SHA="$head_sha" && "$CHECK_SCRIPT" 2>&1) || RC=$?
}
```

Update the header comment above `run_check` (lines 59-61) to also mention
`PUSHED_HEAD_SHA` (optional third arg, defaults to empty).

Then, in the existing case (e) block (lines 207-215):

- **Keep case (e) but retarget its comment banner** — with no third arg,
  `PUSHED_HEAD_SHA` is empty → the script's `-z "$HEAD_SHA"` branch → `exit 1`.
  The existing `assert_exit 1` and `assert_stderr_contains "empty"` both still
  hold unchanged. Update only the banner (lines 207-209) to read: empty
  `PUSHED_COMMITS` with no `PUSHED_HEAD_SHA` provided → exit 1 (fail-closed,
  cannot prove already-landed).

- **Add case (e2) — empty payload + head SHA reachable from origin/main →
  exit 0 (benign skip).** Insert immediately after case (e) (after line 215),
  following the case (a) setup pattern (lines 112-124) for the fake
  `origin/main` ref:

  ```bash
  # ---------------------------------------------------------------------------
  # Case (e2): Empty PUSHED_COMMITS + PUSHED_HEAD_SHA reachable from
  # origin/main → exit 0 (benign skip: a concurrent push already landed it).
  # ---------------------------------------------------------------------------
  echo "--- case (e2): empty PUSHED_COMMITS, head SHA already on origin/main → exit 0 ---"
  REPO=$(make_temp_repo)

  mkdir -p "$REPO/intentions"
  printf 'strategy body\n' > "$REPO/intentions/strategy-foo.md"
  git -C "$REPO" add intentions/strategy-foo.md
  git -C "$REPO" commit -q -m "add intention"
  SHA=$(git -C "$REPO" rev-parse HEAD)
  git -C "$REPO" update-ref refs/remotes/origin/main "$SHA"

  run_check "$REPO" "$(shas_json)" "$SHA"
  assert_exit 0 "(e2) empty PUSHED_COMMITS, head already on origin/main: exit 0"
  assert_stderr_contains "already reachable from origin/main" "(e2) benign-skip reason named"
  ```

- **Add case (e3) — empty payload + head SHA NOT reachable from origin/main →
  exit 1 (fail-closed).** Insert after (e2):

  ```bash
  # ---------------------------------------------------------------------------
  # Case (e3): Empty PUSHED_COMMITS + PUSHED_HEAD_SHA NOT reachable from
  # origin/main → exit 1 (fail-closed: cannot prove it already landed).
  # ---------------------------------------------------------------------------
  echo "--- case (e3): empty PUSHED_COMMITS, head SHA not on origin/main → exit 1 ---"
  REPO=$(make_temp_repo)

  mkdir -p "$REPO/intentions"
  printf 'base\n' > "$REPO/intentions/base.md"
  git -C "$REPO" add intentions/base.md
  git -C "$REPO" commit -q -m "base"
  SHA_BASE=$(git -C "$REPO" rev-parse HEAD)
  git -C "$REPO" update-ref refs/remotes/origin/main "$SHA_BASE"

  printf 'a\n' > "$REPO/intentions/a.md"
  git -C "$REPO" add intentions/a.md
  git -C "$REPO" commit -q -m "child of base, not on origin/main"
  SHA_CHILD=$(git -C "$REPO" rev-parse HEAD)

  run_check "$REPO" "$(shas_json)" "$SHA_CHILD"
  assert_exit 1 "(e3) empty PUSHED_COMMITS, head not on origin/main: exit 1"
  assert_stderr_contains "NOT reachable from origin/main" "(e3) fail-closed reason named"
  ```

- **Add case (e4) — empty payload + head SHA set but origin/main ref absent →
  exit 1 (fail-closed).** Insert after (e3):

  ```bash
  # ---------------------------------------------------------------------------
  # Case (e4): Empty PUSHED_COMMITS + PUSHED_HEAD_SHA set but origin/main ref
  # absent → exit 1 (fail-closed: cannot verify).
  # ---------------------------------------------------------------------------
  echo "--- case (e4): empty PUSHED_COMMITS, origin/main ref absent → exit 1 ---"
  REPO=$(make_temp_repo)

  mkdir -p "$REPO/intentions"
  printf 'a\n' > "$REPO/intentions/a.md"
  git -C "$REPO" add intentions/a.md
  git -C "$REPO" commit -q -m "add a, no origin/main ref set"
  SHA=$(git -C "$REPO" rev-parse HEAD)

  run_check "$REPO" "$(shas_json)" "$SHA"
  assert_exit 1 "(e4) empty PUSHED_COMMITS, origin/main absent: exit 1"
  assert_stderr_contains "origin/main is not available" "(e4) fail-closed reason named"
  ```

**Out of scope for 1c:** cases (a), (b), (c), (d), (d2), (f), (g) are
unchanged in body (they still exercise the non-empty path and pass with the
default empty `PUSHED_HEAD_SHA`).

**Dependencies:** none — 1a/1b/1c land together as one PR (the tests validate
the exact script behavior 1a introduces; the workflow env wiring 1b is what
makes 1a effective in CI).

## Reuse

- `make_temp_repo()` — `.github/scripts/test-check-graph-fast-path.sh:41-51`.
- `shas_json()` — `.github/scripts/test-check-graph-fast-path.sh:55-57`
  (no-args → `[]`).
- `run_check()` — `.github/scripts/test-check-graph-fast-path.sh:64-69`
  (extend per 1c).
- `assert_exit` — `.github/scripts/test-check-graph-fast-path.sh:72-84`.
- `assert_stderr_contains` — `.github/scripts/test-check-graph-fast-path.sh:87-101`
  (uses `grep -qF`, so pass literal substrings).
- Fake `origin/main` ref pattern —
  `.github/scripts/test-check-graph-fast-path.sh:121`:
  `git -C "$REPO" update-ref refs/remotes/origin/main "$SHA"`. Reuse verbatim
  for cases (e2)/(e3).
- New-case block pattern — copy the `--- case (x): ... ---` banner+body blocks
  (e.g. case (a) at lines 112-124), append before the Summary section at
  line 267.
- `refs/remotes/origin/main` availability in CI —
  `.github/workflows/graph-fast-path.yml` (`actions/checkout` with
  `fetch-depth: 0`) makes it present without an added fetch.
- `git merge-base --is-ancestor` has no prior use in this repo (grep-confirmed
  zero hits) — it is written directly in the script per 1a, not reused from
  anywhere.

## Verification

```verify
bash .github/scripts/test-check-graph-fast-path.sh
```

Expected: all cases pass, including retargeted case (e) and new (e2) exit 0 /
(e3) exit 1 / (e4) exit 1. The final line prints `All tests passed.` and the
script exits 0.

If `shellcheck` is available, additionally lint the edited guard:

```verify
shellcheck .github/scripts/check-graph-fast-path.sh
```

Manual / observe-in-production checks:

- Confirm the workflow YAML still parses — `git diff` the workflow and
  visually confirm `PUSHED_HEAD_SHA` is indented identically to
  `PUSHED_COMMITS` under `env:`.
- On the next real concurrent-landing race in production (two `graph-commit`
  invocations racing to land byte-identical intentions commits), confirm the
  losing invocation's `graph/**` push no longer false-fails: the `guard`
  job's "Verify the push is intentions/-only" step should emit the
  `::notice::PUSHED_COMMITS is empty but pushed HEAD <sha> is already
  reachable from origin/main ...` line and exit 0, and the landing should
  complete without manual `git reset --hard origin/main` recovery. Until such
  a race occurs naturally, this is observation-only; the hermetic case (e2)
  is the standing proof of the skip path.
- No `blocked_by` dependency on any other graph node — none found. No
  data-visualization guidance applies (this is a CI shell script, not a
  chart).

## needs-main residue

- **id:** 8
- **title:** Real concurrent-landing race no longer false-fails in production
- **url_path:** current
- **expected_outcome:** The double-blocking behavior reported on 2026-07-23
  does not recur; a provably-already-landed concurrent push is skipped via
  the `::notice::` benign path, not fail-closed.
- **finding:** Verifiable only against a live concurrent-landing race in
  production, not assertable at merge time. The merge-time proxy — the
  hermetic (e2) harness case — already passed
  (`bash .github/scripts/test-check-graph-fast-path.sh`, all 19 cases green).
  Planned deferral: observe the next real concurrent `graph-commit` race and
  confirm the losing invocation's `graph/**` push emits the
  `::notice::PUSHED_COMMITS is empty but pushed HEAD <sha> is already
  reachable from origin/main ...` line and exits 0, landing without manual
  `git reset --hard origin/main` recovery.
