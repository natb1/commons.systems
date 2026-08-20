---
id: tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land
kind: tactic
statement: dispatch-eval-finding --list reads the checkout working tree, but the
  plumbing writer never moves that checkout HEAD and restores node files to HEAD
  content after a verified land — so the ledger read path cannot see the ledger
  write path, and the similarity judgment mints duplicate slugs
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding and, since the 2026-08-19 /align-tactics finalize round, the
  clean-session plan that repairs it.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications:
  - question: What replaces the working-tree read, and what behavior changes when it
      does?
    answer: "(Recorded 2026-08-19 /align-tactics tactic-mode drift review.) The
      read-side fix reads the ledger at a git ref, not from the checkout.
      Verified in the worktree at 2fe56dd9: dispatch-eval-finding:419-471 still
      calls the tolerant listNodes($INTENTIONS_DIR)
      (packages/intentionsutil/src/store.ts:232), and
      packages/intentionsutil/scripts/lib-store-at-ref.ts:47 already provides
      listNodesAtRef(repoRoot, ref), the ref-aware counterpart already in
      production use at
      packages/intentionsutil/scripts/office-hours-select.ts:381-400 with ref
      defaulting to origin/main. One behavior delta the plan owns rather than
      the author: listNodesAtRef is STRICT (it wraps listNodesStrict and throws
      naming every unreadable node file), while listNodes warns on stderr and
      continues. Strict is the posture consistent with condition 9's bound,
      because a silently dropped row is exactly what mints a duplicate slug, and
      --list's caller is a model that sees the non-zero exit, so the failure is
      loud rather than lost. Gate the ref read on the script's existing
      origin_main_ref_ok (dispatch-eval-finding:499) the way --list-retirable
      already does at :538, so an unfetched clone reports \"origin/main does not
      resolve\" instead of an opaque throw. Both callers of list_entries (:482
      --list and :542 --list-retirable) inherit the change."
  - question: Why not simply sync the checkout, and what constrains the ref-read
      implementation inside a sandboxed fire-and-forget job?
    answer: "(Recorded 2026-08-19 /align-tactics tactic-mode drift review.) Two
      constraints on the read mechanism, neither needing an author ruling.
      First, syncing the checkout is the wrong fix here: sync_main_checkout
      (.claude/skills/dispatch-propagate/scripts/lib.sh:2109) does git merge
      --ff-only, which refuses on any dirty tracked file anywhere in the
      checkout, and that is precisely the outage the plumbing writer was adopted
      to avoid (dispatch-eval-finding:784, citing
      tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt). A ref read
      touches the checkout not at all and carries no such precondition. Second,
      listNodesAtRef extracts git archive into an mkdtemp under os.tmpdir();
      dispatch-eval-finding runs from fire-and-forget sandboxed jobs where
      temp-dir handling has failed before, so the plan's verification must
      exercise --list from a sandboxed invocation, and
      packages/intentionsutil/src/store.ts:143 parseNodeRaw over git show is the
      tmpdir-free fallback if it cannot."
  - question: Does the pending retirement of dispatch-eval-finding into one shared
      find-or-recur surface, or the pending plumbing-writer default flip, block
      or reshape this fix?
    answer: (Recorded 2026-08-19 /align-tactics tactic-mode drift review.) This fix
      lands on dispatch-eval-finding while two recorded, still-draft changes
      move the ground under it, and neither blocks it. Condition 1's 2026-08-14
      amendment and clarifications 62/63 record dispatch-eval-finding as a
      writer being retired into one shared find-or-recur surface (carrier
      tactic-finding-search-all-producers, verified phase null / status raw at
      2fe56dd9); since clarification 63 keeps the whole-graph similarity search
      running in every case, the read-at-a-ref property this node fixes must
      hold in whatever surface survives, and a listNodesAtRef call transfers
      with it. Separately, tactic-graph-commit-plumbing-default (also phase null
      / status raw) would flip GRAPH_COMMIT_WRITER's global default from
      worktree to plumbing, at which point every reader that trusts the local
      tree goes stale; dispatch-eval-finding is today the only opt-in plumbing
      caller (GRAPH_COMMIT_WRITER=plumbing appears once, at
      dispatch-eval-finding:814). Scope the fix as "read at the ref" rather than
      as a workaround for the one plumbing caller, so it survives both.
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
    - metric: stale-list-rows
      value: 7
      unit: rows
      window: single-run
      sensor: dispatch-eval-finding --list vs git grep origin/main
      measured: 2026-08-14
    - metric: plumbing-lands-without-head-move
      value: 28
      unit: writes
      window: single-run
      sensor: dispatch-eval-finding stdout + git rev-parse
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: dispatch-eval-finding --list vs git grep origin/main
      measured: 2026-08-14
---
## Context

Recorded 2026-08-14 while retiring the fourteen slugs PR #3090 fixed. Measured, not hypothesized: the under-report happened during that run and was mistaken for data loss before ground truth was checked. This body is the finalized plan; the sections below carry the original diagnosis forward, corrected where a line anchor had drifted.

### The defect

`list_entries` reads the checkout's **working tree**:

```
.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:419-474
  const { listNodes } = await import("./packages/intentionsutil/src/store.js");
  const rows = listNodes(process.argv[1])   // $INTENTIONS_DIR — files on disk
```

`INTENTIONS_DIR` defaults to `$REPO_ROOT/intentions` (`dispatch-eval-finding:358`) — the local checkout, never `origin/main`.

The plumbing writer deliberately never moves the checkout's HEAD (`build_commit_plumbing`, `packages/intentionsutil/scripts/graph-commit:1661`, builds a commit reachable from no ref through a throwaway index and pushes it straight to `origin/main`; the doctrine comment is at `graph-commit:2381-2400`), and `clear_node_residue` (`dispatch-eval-finding:866-917`) restores the node file to **HEAD** content once `verify_landed` confirms publication — and only for the ONE node that invocation wrote, never for the rest of the ledger.

So after a successful plumbing land, the write is on `origin/main` and the files on disk are back to their pre-write state. `--list` cannot see it. It reports the ledger as it stood before its own writes, and keeps doing so until something else moves that checkout's HEAD.

`dispatch-eval-finding` is the only opt-in plumbing caller, so the ledger's read path structurally cannot see the ledger's own write path.

### The evidence

Twenty-eight consecutive plumbing lands (fourteen `--resolved-by`, fourteen `--retire`) moved the main checkout's HEAD not at all. The post-run `--list` reported **7 of 14** entries as still `open` with `resolved_by: NONE`. Ground truth at `origin/main` at the same moment:

```
git grep -l '^phase: done' origin/main -- 'intentions/tactic-eval-finding-*'
  → 18 files
git grep -h -A1 '^  resolved_by:' origin/main
  → 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7 × 14
```

All fourteen had landed. Every row `--list` disagreed on was wrong.

### Why it is not cosmetic

`--list` is the input to the similarity judgment — the step that decides whether a finding in hand is already recorded (see "JUDGMENT against the open ledger", `dispatch-eval-finding:44-51`, and `/rsi` SKILL.md step 6 at `.claude/skills/rsi/SKILL.md:205-220`). A stale read answers "no such entry" for an entry that exists, and the caller mints a near-duplicate slug. The `--list` header at `:401-418` records that a real duplicate slug has already been minted once, by a different mechanism; this is a second path to the same outcome.

`--list-retirable` inherits the same read through `list_entries` (`:543`), so the "candidate list a human acts on" can present already-retired entries as open and invite a double-write.

### Distinct from tactic-eval-finding-eval-finding-list-misses-nonledger

That entry — retired against `1092a403` — is the same **surface** and a different **mechanism**. There, `--list` could not see an entry because membership was filtered on `attributes.ledger_entry` alone; the fix widened membership to prefix-OR-attribute (`:401-418`). Here, membership is decided correctly and the entry is still invisible, because the **source** `list_entries` reads is a tree the writer deliberately leaves behind.

Widening membership does not help a read whose input is stale. Both routes end at a minted duplicate slug, which is why the surface looks identical; the remedies do not overlap. **Neither unit below touches the membership test** — it stays exactly as it is.

The existing mitigation does not cover this. `--list-retirable`'s header warns that the **`origin/main` ref** may be stale ("it judges against the origin/main ref this checkout already has, so fetch first"). The staleness here is in the **node files**, which a fetch does not touch.

### The asymmetry that names the fix

`--list-retirable` already reasons about `origin/main` throughout, and the script already carries the helpers for it — `origin_main_ref_ok` (`:497-501`) and `origin_blob` (`:735-739`), both used by every write path to obtain a trustworthy pre-write blob. `--list` alone reasons about the tree, and its branch (`:476-487`) has no freshness or resolvability guard at all.

The recurrence-record path at `:1090-1110` is the precedent for the underlying principle — it already refuses to trust the local copy when `origin/main` disagrees, calling that case "a recurrence this checkout cannot see".

### Greenfield design, and what this tactic migrates

**Greenfield**: every "what does the graph say" question in the repo is answered from an explicit `(repoRoot, ref)` pair through one ref-aware store reader, and the working tree is scratch space that is never a source of truth for graph state. That library already exists and is already the codebase's direction — `packages/intentionsutil/scripts/lib-store-at-ref.ts` (`listNodesAtRef` at `:47`, `readNodeAtRef` at `:100`), consumed in production by `office-hours-select.ts:90,109,381-400`, `read-sensors.ts:54,767`, `verify-landed:83-84,235-251` and `clear-park`. `office-hours-select` is the exact precedent: a selector that used to read its own checkout, moved to `listNodesAtRef(repoRoot, ref)` with `ref` defaulting to `origin/main`.

**Migration (this tactic)**: move the one remaining stale reader that is measurably minting duplicates — `dispatch-eval-finding`'s `--list`, and therefore `--list-retirable` — onto that library. No new state, no new primitive, no checkout sync.

**Explicitly rejected**: `sync_main_checkout` (`.claude/skills/dispatch-propagate/scripts/lib.sh:2109-2113`). Its `git merge --ff-only` refuses on any dirty tracked file anywhere in the checkout, which is precisely the outage the plumbing writer was wired in to dissolve (`tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt`, cited at `dispatch-eval-finding:784`). A read that mutates the checkout to answer a question would fix this finding by reproducing its sibling. `listNodesAtRef` extracts `git archive <ref> intentions` into a scratch tmpdir and touches neither the tree nor the index.

### What this plan deliberately does NOT change (recorded so a later reader does not re-litigate it)

The script's **write-path** local reads stay local: `classify()` (`:713-727`) calls `readNode(INTENTIONS_DIR, id)`, and `dump-node` hashes the on-disk file for the `--base` CAS manifest. They have the same root cause but the opposite failure posture — they fail **loudly**: a stale local copy on the mint path is caught by the `origin_blob` guard at `:1090-1110` (refuses, exit 1, names the repair command), and a stale local copy on an update path produces a stale `--base` blob that `graph-commit` refuses with exit 3. This finding is about the **silent** read.

One residual is recorded here as an observation, unfixed and out of scope: a **second occurrence of the same slug recorded from the same checkout between syncs** dumps pre-land content and a pre-land base blob, so the recurrence is *refused* rather than counted. That is loud, not silent, and it is a different defect from this one — a later evaluator should record it as its own finding rather than folding it into this node.

### Frontmatter context (not body prose)

`attributes.measured_impact` carries three entries measured 2026-08-14: stale-list-rows 7 rows (single-run), plumbing-lands-without-head-move 28 writes (single-run), recurrence_count 1 (all-time). `attributes.ledger_entry` true, `attributes.first_seen` 2026-08-14. `pace_exempt` true. Serves `strategy-recursive-self-improvement`.

---

## Unit 1 — `--list` reads the ledger at a git ref (default `origin/main`)

**Scope.** One file: `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`.

1. **New config, next to `INTENTIONS_DIR` (`:358`)**:
   - `LIST_REF="${DISPATCH_EVAL_FINDING_LIST_REF:-origin/main}"` — the ref `--list` / `--list-retirable` read the ledger at.
   - `LIB_STORE_AT_REF="${DISPATCH_EVAL_FINDING_LIB_STORE_AT_REF:-$REPO_ROOT/packages/intentionsutil/scripts/lib-store-at-ref.ts}"` — same spelling and role as `verify-landed:83-84`. It is an env seam so the test suite can point a fixture-repo copy of this script at the real library; env-only, no new CLI flag, so the `--list takes no other arguments` guard at `:477-481` is untouched.
2. **Rename the ref guard to take the ref as a parameter.** `origin_main_ref_ok()` at `:499-501` becomes:
   ```bash
   ref_ok() { # <ref>
     git -C "$REPO_ROOT" rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1
   }
   ```
   Update its five existing call sites — `:538`, `:984`, `:1052`, `:1094`, `:1214` — to `ref_ok origin/main`, leaving every one of their log messages and exit codes exactly as they are (those paths genuinely mean `origin/main`: they are about the pre-write rollback blob). Update the two comments that name the old function, at `:497` and `:733`. No test greps for the old name (verified).
3. **Rewrite `list_entries()` (`:419-474`) to read at the ref.** The similarity-judgment JS body — the prefix-OR-attribute membership test, the `unregistered` flag, the `recurrence_count`/`last_seen` extraction, `resolved_by`, `in_flight`, and the sort — is **preserved byte-for-byte**. Only node loading and the argv wiring change:
   - `cd` to `"$(dirname "$LIB_STORE_AT_REF")"`, not `"$REPO_ROOT"`. This matters: `node --import tsx/esm` must resolve `tsx` from a checkout that has `node_modules`, and `$REPO_ROOT` may be a fixture repo that does not. Same reason `verify-landed:250` does `cd "$SCRIPT_DIR"`.
   - Pass three positionals: `"$LIB_STORE_AT_REF" "$REPO_ROOT" "$LIST_REF"`, read as `process.argv[1..3]` (with `node -e`, `argv[1]` is the first user argument — the current code already relies on this).
   - Load with `const { listNodesAtRef } = await import(process.argv[1]);` (absolute-path dynamic import, the `verify-landed:235-251` convention) and `listNodesAtRef(process.argv[2], process.argv[3])` in place of `listNodes(process.argv[1])`.
   - Error posture, mirroring `office-hours-select.ts:395`: catch only errors whose message starts with `"listNodesAtRef:"` (unfetched / mistyped / unresolvable ref — an environment problem), write the message to stderr and `process.exit(69)`. Let anything else — notably `IntentionSchemaError` from a malformed node at the ref — propagate uncaught: it is a repo-integrity failure, and an input to a mint-or-reuse judgment must not silently lose a row.
   - The `LIST_CMD` test seam (`:395-398`, invoked at `:420-422`) keeps its role but changes its argument contract from `<intentions-dir>` to `"$REPO_ROOT" "$LIST_REF"`. No assertion in the suite inspects those arguments (verified — `list.log` is written but never asserted on), so only the stub's usage comment changes, in Unit 2.
4. **Guard and exit-code propagation in the `--list` branch (`:476-487`)**, mirroring the `--list-retirable` block at `:538-541`:
   ```bash
   if ! ref_ok "$LIST_REF"; then
     log "$LIST_REF does not resolve in $REPO_ROOT (unfetched clone, or a pruned/stale remote-tracking ref) — there is no ledger to read"
     exit 69
   fi
   ```
   Then capture rather than stream, so a 69 from the reader is not flattened to 1:
   ```bash
   LIST_RC=0
   LEDGER_ROWS=$(list_entries) || LIST_RC=$?
   if [[ "$LIST_RC" -ne 0 ]]; then
     log "could not read the ledger at $LIST_REF in $REPO_ROOT"
     exit "$LIST_RC"
   fi
   printf '%s\n' "$LEDGER_ROWS"
   exit 0
   ```
   In the `--list-retirable` branch, add the same `ref_ok "$LIST_REF"` check **in addition to** its existing `ref_ok origin/main` check (that one stays: `resolve_landed_commit` judges ancestry against `origin/main` specifically), and change its two "could not read the ledger from `$INTENTIONS_DIR`" messages (`:543`, `:547`) to name `$LIST_REF`.
5. **Header documentation**, in the same file:
   - Env table at `:236-237`: update the `DISPATCH_EVAL_FINDING_LIST_CMD` line (now the `listNodesAtRef` one-liner, taking `<repo-root> <ref>`), and add `DISPATCH_EVAL_FINDING_LIST_REF` (default `origin/main`) and `DISPATCH_EVAL_FINDING_LIB_STORE_AT_REF`. Note on the `DISPATCH_EVAL_FINDING_INTENTIONS_DIR` line that it no longer affects `--list`.
   - `--list` doc block at `:401-418`: add a paragraph stating (a) the read is at `origin/main`, not the working tree, and why — this checkout's HEAD is never moved by the plumbing writer, so the tree is pre-write for every entry this script lands; (b) it is still a pure read: no mutex, no network, no fetch, and it never touches the tree or index — freshness across *sessions* comes from the mandatory post-write fetch `graph-commit` already performs (`graph-commit:2229-2238`), and a caller wanting more can `git fetch origin main` first; (c) enumeration is now STRICT, so a schema-invalid node at `origin/main` fails `--list` loudly instead of dropping a row the judgment must see.

**Out of scope for this unit**: the membership test and row shape (unchanged); `classify()` at `:713-727` and every other working-tree read on the write paths (see "What this plan deliberately does NOT change"); `clear_node_residue`'s HEAD-not-origin/main restore (`:866-917`) — that behavior is correct and load-bearing and stays; any `sync_main_checkout` call; any change to `graph-commit`.

**Recommended model**: `opus`.

## Unit 2 — Regression coverage: the read path sees the write path

**Scope.** One file: `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh`. This suite is auto-discovered in CI whenever the diff touches `.claude/skills/dispatch-propagate/scripts/*` (`run-unit-tests.sh:88`, `:186-200`), which this PR necessarily does.

1. **Fix the stale harness comments.** The header at `:6-11` claims the suite "never runs tsx" — case 15 already does, and Unit 1 does not change that. Correct it to say the default `--list` path runs the real `tsx` loader against a fixture git repo.
2. **Move case (15) to a git fixture** (`:609-770` today). Its four schema-valid node fixtures stay exactly as written; what changes is where they live and how the SUT is invoked. `DISPATCH_EVAL_FINDING_INTENTIONS_DIR` no longer steers `--list`, so build a second miniature repo alongside `$FR`, using the `$FR` setup at `:127-148` as the template:
   ```bash
   LR="$WORK/list-repo"
   LR_SCRIPTS="$LR/.claude/skills/dispatch-propagate/scripts"
   mkdir -p "$LR_SCRIPTS" "$LR/intentions"
   cp "$SUT" "$LR_SCRIPTS/dispatch-eval-finding"; chmod +x "$LR_SCRIPTS/dispatch-eval-finding"
   cp "$HARNESS_DIR/lib.sh" "$LR_SCRIPTS/lib.sh"
   LIST_SUT="$LR_SCRIPTS/dispatch-eval-finding"
   REAL_LIB_STORE_AT_REF="$HARNESS_DIR/../../../../packages/intentionsutil/scripts/lib-store-at-ref.ts"
   git -C "$LR" init -q
   git -C "$LR" config user.email fixture@test
   git -C "$LR" config user.name fixture
   printf '.claude/\n' > "$LR/.git/info/exclude"
   # ... write the four existing case-15 node fixtures into "$LR/intentions/" ...
   git -C "$LR" add intentions
   git -C "$LR" commit -q -m 'ledger fixtures'
   C1=$(git -C "$LR" rev-parse HEAD)
   git -C "$LR" update-ref refs/remotes/origin/main HEAD
   ```
   The copied SUT's `SCRIPT_DIR/../../../..` math resolves `REPO_ROOT` to `$LR` — which is the point: the ref being read is the fixture's, while the library comes from the real checkout. Invoke as
   `env DISPATCH_EVAL_FINDING_LIB_STORE_AT_REF="$REAL_LIB_STORE_AT_REF" "$LIST_SUT" --list`.
   Every existing case-15 assertion (three rows, doctrine root excluded, 15a/15b/15c) runs unchanged against this state.
3. **New case (18) — the regression this tactic exists for.** From the case-15 state, produce exactly what a plumbing land plus `clear_node_residue` leaves behind: `origin/main` ahead, HEAD unmoved, tree at pre-write content. Follow `stub-graph-commit`'s `STUB_GC_PLUMB` block (`:233-252`) as the model:
   - Save the pre-land copy of `tactic-eval-finding-registered-example.md`.
   - In the tree, edit that node to `phase: done` with `recurrence_count` 4→3-independent value (use a distinct value from the pre-land one, e.g. bump 4 to 5), and add a net-new schema-valid entry tactic-eval-finding-landed-only carrying `attributes.resolved_by: '<C1>'` (the 40-char sha captured above) and `phase: null`.
   - Build the commit through a throwaway index and move only the remote-tracking ref:
     ```bash
     idx="$LR/.git/plumb-index"; rm -f "$idx"
     export GIT_INDEX_FILE="$idx"
     git -C "$LR" read-tree HEAD
     git -C "$LR" add -A intentions
     TREE=$(git -C "$LR" write-tree)
     unset GIT_INDEX_FILE; rm -f "$idx"
     LANDED=$(git -C "$LR" commit-tree "$TREE" -p HEAD -m 'plumbing land')
     git -C "$LR" update-ref refs/remotes/origin/main "$LANDED"
     ```
   - Restore the tree the way the script does: copy the saved pre-land file back over the edited one, and `rm -f` the net-new node (an untracked leftover the real `clear_node_residue` deletes). HEAD stays at `$C1`.
   - Assertions:
     - the working-tree copy still reads `phase: null` (`grep`), so the divergence being tested is real;
     - `--list` reports tactic-eval-finding-registered-example with `state == "retired"` and the landed `recurrence_count` — i.e. `origin/main` truth, not the tree's;
     - `--list` includes tactic-eval-finding-landed-only, which does not exist on disk at all;
     - row count is 4 (the doctrine root still excluded);
     - `git -C "$LR" status --porcelain` is byte-identical before and after the `--list` call, and `git -C "$LR" rev-parse HEAD` is unchanged — the read mutates nothing;
     - `--list-retirable` inherits the fix: tactic-eval-finding-landed-only (open at `origin/main`, `resolved_by` = `$C1`, an ancestor of the tip) appears as a retirable candidate, even though its node file is absent from the tree.
4. **New case (19) — the ref guard.** `DISPATCH_EVAL_FINDING_LIST_REF=refs/remotes/origin/nope "$LIST_SUT" --list` exits **69**, names the ref on stderr, and emits no JSON. Same assertion for `--list-retirable`.
5. **New case (20) — strict enumeration is loud.** As the **last** step in `$LR` (nothing after it depends on a clean ref), commit an intentionally malformed `intentions/tactic-eval-finding-broken.md` (valid YAML fences, required field `kind` removed) and move `refs/remotes/origin/main` to that commit. `--list` must exit non-zero and name the offending node on stderr — never exit 0 with the broken row silently missing, which is exactly the shape that mints a duplicate slug.

**Out of scope**: no change to `$FR`, `run_ef`, or any existing write-path case; no new stub; no invocation of the real `graph-commit` binary (the plumbing state is reproduced with git plumbing directly, which is deterministic, network-free and fast). Renumber only if the suite's existing numbering already reaches 18 — check the header case list first and take the next free numbers, updating that list in the same edit.

**Recommended model**: `sonnet`.

**Dependencies**: Unit 1.

## Unit 3 — Tell the callers what `--list` now reads

**Scope.** Two files, prose only:

- `.claude/skills/rsi/SKILL.md` — the `--list` block at `:205-220` (step 6). Add: the listing is read from `origin/main`, not this checkout's files, so it sees entries other sessions landed and entries this session just landed through the plumbing writer; it performs no fetch and never syncs or dirties the checkout; and it fails loudly (exit 69 on an unresolvable `origin/main`, non-zero on a schema-invalid node at that ref) rather than returning a short list — a short list was how a duplicate slug got minted. Keep the sentence at `:180-183` about checking `--list` before calling a sighting novel; it is now true rather than aspirational.
- `.claude/skills/rsi-audit/SKILL.md:168` — same one-sentence correction to "prints the whole ledger" (whole ledger **at `origin/main`**), and note in the step at `:184` that a `69` from `--list` means the ref does not resolve (unfetched clone), not that the ledger is empty.

**Out of scope**: no change to either skill's steps, ordering, or write surface; no new instruction to fetch before running `/rsi` (the read stays network-free by design, and `graph-commit`'s own post-write fetch keeps the ref current within a writing session).

**Recommended model**: `sonnet`.

**Dependencies**: Unit 1.

## Reuse

- `packages/intentionsutil/scripts/lib-store-at-ref.ts:47` — `listNodesAtRef(repoRoot, ref)`. The exact missing primitive: `git cat-file -e <ref>:intentions` precheck, `git archive <ref> intentions` piped through two separately status-checked `execFileSync` calls into `tar -x` in a `mkdtemp` dir, `listNodesStrict` on the result, `rmSync`. Git plumbing only — never touches the working tree or `.git/index`, so it composes with the plumbing writer's never-move-HEAD design instead of fighting it. **Prototyped against this repo during planning**: the exact call shape in Unit 1 returned 41 prefix nodes from `origin/main` with no schema failure.
- `packages/intentionsutil/scripts/office-hours-select.ts:90,109,381-400` — the production precedent for this fix shape (a selector that read its own checkout, moved to `listNodesAtRef` with `ref` defaulting to `origin/main`), including the "catch only `listNodesAtRef:`-prefixed errors, let `IntentionSchemaError` propagate" posture copied in Unit 1.
- `packages/intentionsutil/scripts/verify-landed:83-84,235-251` — the bash-calls-the-library convention: a `LIB_STORE_AT_REF` variable, an absolute-path dynamic `import`, `node --import tsx/esm` (never `npx tsx`, whose CLI opens an IPC socket a sandboxed caller cannot), and `cd` into a directory of the *real* checkout so `tsx` resolves while the repo under inspection is passed as an argument.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:497-501` — `origin_main_ref_ok`, generalized in place to `ref_ok <ref>` rather than duplicated; `:538-541` is the guard-and-exit-69 block Unit 1 mirrors into the `--list` branch.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:419-474` — the membership/row-shape JS, preserved verbatim; `:395-398` the `LIST_CMD` seam, kept.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh:127-148` — the miniature-repo fixture pattern (`git init`, `.git/info/exclude` for `.claude/`, `update-ref refs/remotes/origin/main`) that Unit 2's `$LR` copies; `:233-252` — `stub-graph-commit`'s `STUB_GC_PLUMB` block, the throwaway-index land Unit 2 reproduces inline.
- `packages/intentionsutil/scripts/graph-commit:2229-2238` — the mandatory post-write fetch. Not edited; it is the mechanism that makes `refs/remotes/origin/main` current in the writing checkout, which is what makes a ref-based read see this session's own writes.

**Deliberately not reused**: `sync_main_checkout` (`.claude/skills/dispatch-propagate/scripts/lib.sh:2109-2113`) — see "Greenfield design" above; and `readNodeAtRef` (`lib-store-at-ref.ts:100`), which is the right primitive for `classify()` but `classify()` is out of scope here.

## Verification

The full dispatch-script suite, which contains the new cases and every existing `dispatch-eval-finding` case (run under bash, never zsh — the harness says so at its head):

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh
```

The CI entry point that auto-discovers that suite whenever this PR's diff touches `.claude/skills/dispatch-propagate/scripts/*`:

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

Lint, including the prose-rules and type-safety checks CI runs unconditionally:

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

End-to-end smoke against the real repo: `--list` reads at `origin/main`, returns a well-formed non-trivial array, and mutates nothing. The status snapshot is compared before/after rather than asserted empty, because a node worktree legitimately carries its own modified node file:

```verify
set -e
BEFORE=$(git status --porcelain -- intentions | sha1sum)
OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding --list)
AFTER=$(git status --porcelain -- intentions | sha1sum)
[ "$BEFORE" = "$AFTER" ]
printf '%s' "$OUT" | jq -e 'type == "array" and length >= 20' >/dev/null
printf '%s' "$OUT" | jq -e 'all(.[]; has("id") and has("state") and has("recurrence_count") and has("resolved_by"))' >/dev/null
```

(`printf '%s' … | jq`, never `echo "$OUT" | jq` — `.claude/rules/shell-json.md`.)

**Manual / observe-in-production** (not auto-runnable):

- On the next `/rsi` run after this lands, confirm the `--list` output includes entries landed by *other* sessions since this checkout last synced, and that a `--retire` or `--resolved-by` in that same run is reflected by a subsequent `--list` in the same session. That second half is the measured incident reproduced: before this change, 7 of 14 just-landed rows read back as `open`.
- Confirm the checkout stays clean across a `--list`: `git status --porcelain` unchanged, HEAD unmoved. A `--list` that ever dirties the tree would recreate `tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt`.
- Judgment call for the implementer: if the strict read ever fails on the real `origin/main` because a landed node is schema-invalid, that is a repo-integrity failure to fix at its source — do **not** soften Unit 1 back to a tolerant enumeration, which is the silent-row-drop this finding is about.
