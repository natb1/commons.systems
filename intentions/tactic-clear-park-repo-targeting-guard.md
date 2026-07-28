---
id: tactic-clear-park-repo-targeting-guard
kind: tactic
statement: "graph-commit's --base token asserts the resolved repo actually holds
  that base blob at HEAD and has a pending edit, so a wrong-repo invocation can
  no longer pass the nothing-staged guard by coincidence; and clear-park /
  resolve-park gain a functional test harness that exercises the repo-targeting
  dimension"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-28 at an office-hours drain sitting, while
  root-causing why a clear-park invocation reported success without landing.
  clear-park derives REPO_ROOT from its own script location
  (packages/intentionsutil/scripts/clear-park:55) and mutates
  intentions/<id>.md under THAT root, but invokes graph-commit as
  \"$SCRIPT_DIR/graph-commit\" with no -C argument
  (packages/intentionsutil/scripts/clear-park:169) — and graph-commit resolves
  its target repo from the CALLER'S CWD, by design, since
  tactic-graph-commit-cwd-repo-resolution landed. When cwd and the
  script-derived REPO_ROOT are different checkouts, clear-park writes repo A
  and graph-commit lands repo B. resolve-park has the identical shape at
  packages/intentionsutil/scripts/resolve-park:176. The immediate two-call-site
  fix (pass -C for REPO_ROOT) is being landed separately on branch
  tactic-graph-commit-staleness-silent-revert; this node covers ONLY the
  systemic residue that let the missing -C survive undetected, which is two
  distinct gaps. (a) graph-commit's nothing-staged guard
  (packages/intentionsutil/scripts/graph-commit:1466-1476) compares each id's
  HEAD blob against the FETCH_HEAD blob and dies only when they DIFFER. A
  wrong-repo invocation whose resolved repo happens to be in sync with
  origin/main produces EQUAL blobs, so the guard passes, the script prints 'no
  new changes to stage ... landing current HEAD' and exits 0 'landed' — a false
  success indistinguishable from the benign 'a prior attempt already committed'
  case. The guard is written to catch a differing blob; it structurally cannot
  catch the equal-blob wrong-repo case. This is a designed hole, not an
  oversight, but the --base token clear-park already passes carries exactly the
  information needed to close it. (b) There is NO test coverage of clear-park
  at all — grep over the repo's test-*.sh files returns zero references to
  clear-park — which is precisely why the missing -C shipped. resolve-park is
  partially covered (test-park-node.sh cases 9-11 exercise --ratify, --reject,
  and the unparked refusal), but no case for either script exercises the
  repo-targeting dimension: every existing case runs with cwd equal to the
  clone root, so the cwd/REPO_ROOT divergence that produces the defect is never
  constructed."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# graph-commit --base repo assertion, and a clear-park / resolve-park test harness

## Context

`packages/intentionsutil/scripts/graph-commit` is the sole write primitive that
lands intention-node edits on `main`. Two wrappers drive it for park lifecycle
writes:

- `packages/intentionsutil/scripts/clear-park` — clears an `office_hours` park.
- `packages/intentionsutil/scripts/resolve-park` — clears a park and applies a
  PR disposition (`--ratify` / `--reject`).

Both follow the same sequence: derive `REPO_ROOT` from the script's own
location, `git fetch origin main`, overwrite `intentions/<id>.md` from
`origin/main` (capturing that blob sha as `FRESH_BLOB`), mutate the refreshed
file via `npx tsx`, then hand off to `graph-commit` with a compare-and-swap
pin:

```
"$SCRIPT_DIR/graph-commit" --base "$NODE_ID=$FRESH_BLOB" -m "$MESSAGE" "$NODE_ID"
```

`graph-commit`, since `tactic-graph-commit-cwd-repo-resolution` landed, resolves
its target repo from the **caller's cwd**, not from its own script location.
Neither wrapper passes `-C "$REPO_ROOT"`. So the wrapper's write and
`graph-commit`'s landing can target two different checkouts whenever cwd is not
the wrapper's own `REPO_ROOT` — the exact situation an office-hours drain
produces when it invokes a wrapper by absolute path from a scratch cwd.

The immediate fix — add `-C "$REPO_ROOT"` at `clear-park:169` and
`resolve-park:176` — is being landed separately on branch
`tactic-graph-commit-staleness-silent-revert`. **This node is scoped to the
systemic residue only** and must not re-land that two-line change.

## Residue (a): the nothing-staged guard cannot see the equal-blob case

When `graph-commit` finds nothing staged, it runs a per-id fail-loud check
(`graph-commit:1466-1476`):

```
local_blob="$(git rev-parse "HEAD:intentions/$id.md" ...)"
main_blob="$(git rev-parse "FETCH_HEAD:intentions/$id.md" ...)"
if [[ "$local_blob" != "$main_blob" ]]; then
  die "the resolved repo ($REPO_ROOT) holds intentions/$id.md content differing
       from origin/main but has nothing staged to commit ..."
fi
```

The comment above it states the intent plainly: after caller-derived
resolution, a nothing-staged tree that differs from `origin/main` "can only
mean the wrong checkout was targeted". That catches the *differing* wrong-repo
case. It cannot catch the *equal* one — if the wrongly-resolved repo is simply
in sync with `origin/main` (the common case for a freshly-checked-out
worktree), both blobs match, the loop passes silently, and the script emits:

```
graph-commit: no new changes to stage for <id> — landing current HEAD
graph-commit: landed <id> on main
```

Exit 0. The caller's real edit, sitting in a different checkout, is never
landed. This is byte-identical in observable behavior to the benign "a prior
attempt already committed but did not push" case, so no caller can tell them
apart.

The fix direction: a supplied `--base <id>=<sha>` token is a positive assertion
about which repo state the caller believed it was editing. When one is present,
the nothing-staged path should verify that the **resolved** repo actually holds
that base blob at HEAD **and** has a pending edit for that id — rather than
accepting an equal-blob match as proof of success. Absent a `--base` token the
current benign-equal behavior may stay as-is; the hardening rides on the token
the wrappers already pass.

## Residue (b): no test harness for clear-park; none for repo targeting

`clear-park` has **zero** test coverage — no `test-*.sh` in the repo references
it. That absence is the direct reason the missing `-C` shipped and survived.

`resolve-park` is partially covered by
`packages/intentionsutil/scripts/test-park-node.sh` (cases 9, 10, 11: `--ratify`
calls `gh pr ready` and clears `office_hours`; `--reject` calls `gh pr close`;
an unparked node is refused with exit 1). But no existing case for either
script constructs the failure geometry: every case runs the wrapper with cwd
equal to the clone root, so cwd and script-derived `REPO_ROOT` never diverge
and the defect class is invisible to the suite.

Scope for this half:

- Bring `clear-park` under the existing harness (or a sibling harness of the
  same shape), covering at least its happy path, its `--base` stale-pin
  refusal, and its rollback-on-graph-commit-failure path.
- Add at least one case per wrapper that runs it **from a cwd that is a
  different checkout than the wrapper's own `REPO_ROOT`**, asserting the edit
  lands in the intended repo — or fails loudly — rather than reporting a false
  success.

## Reuse

- `packages/intentionsutil/scripts/test-park-node.sh` — the existing
  bare-origin + multi-clone harness for `park-node` / `resolve-park`; its
  `make_clone`, `run_pn`, `run_rp`, `origin_show`, and `origin_sha` helpers and
  its `gh`/`npx` PATH shims are the natural base for the new cases. Note its
  `make_clone` symlinks the real repo's `node_modules` into each clone — see
  `tactic-test-park-node-deps-precondition-guard`.
- `packages/intentionsutil/scripts/test-graph-commit.sh` — the graph-commit-side
  functional harness, where a `--base`-token assertion case belongs.
- `tactic-graph-commit-cwd-repo-resolution` (phase `done`, PR #2938) — the
  landed change that made repo resolution caller-derived, and the source of the
  guard this node hardens.
- `.claude/skills/ref-diagnosis-time-cas/SKILL.md` — the `--base`
  diagnosis-time CAS contract these wrappers implement; the hardening must stay
  consistent with its documented exit codes (notably exit 3 for a stale pin).

## Out of scope

- The two-call-site `-C "$REPO_ROOT"` fix (landing on branch
  `tactic-graph-commit-staleness-silent-revert`).
- `graph-commit`'s staleness/freshness detection under concurrent origin/main
  motion — tracked by `tactic-graph-commit-staleness-silent-revert`.
- `ensure_intentions_only_base()`'s unconditional snapshot restore — tracked
  separately by `tactic-graph-commit-intentions-base-stale-restore`.
- No implementation plan is written here; this node is `status: raw`,
  `phase: null` for a later `/align-tactics` pass.
