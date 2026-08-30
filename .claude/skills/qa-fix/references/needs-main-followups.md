# Step 3.6 — File needs-main follow-ups

This reference carries the full needs-main recording procedure for Step 3.6 of
`SKILL.md`. The body holds the guard (run only when Step 3.5 ran and
`result.dispositions` contains a `class === "needs-main"` item) and the terse
per-lane control flow — mint the destination nodes on the node lane, file a
`blocked_by` follow-up per needs-main item on the legacy lane.

This step fires whenever a `needs-main` disposition exists — independent of
whether the run will ultimately fix, park, or pass on some *other* class. It runs
**before** the Step 3.7 auto-fix lane, so a mixed fixing pass records its
needs-main items here and the Step 4 comment (posted from inside Step 3.7's
fix finalize path) can truthfully list them. A run that carries both a
`needs-main` item and an `opus-fixable`/`needs-human` item records the needs-main
item here, and "drop from escalation" (Step 6) stops a `needs-main` item
from triggering a park on its own account, never suppresses a park caused by
another class.

## Node-target lane (`TARGET_KIND=node`) — supersedes the gh filing below

A node target files **nothing on GitHub** and appends **nothing** to the source
tactic's own body. Instead it **mints standalone `tactic-mainqa-*` destination
nodes** that carry the post-merge verification themselves: at most **two** per
source PR — one per lane, never three — grouped by who can verify the items.

The source tactic is not written by this step at all. Step 4's
`transition-node "$N" --set-pr "$PR_NUM"` still advances it `qa → review`
exactly as before, and because its body carries no residue section it then goes
`review → done`. `main-qa` is post-merge by definition and is now reached only
by the destination nodes, which are **born** at that phase carrying the source's
PR.

### Sort each item by its `Verifiability:` mark

Verifiability is triaged here at record time. Machine-verifiable means checkable
by **any** tool the autonomous lane can run — a deployed-URL browser
observation, but equally a `git`, `journalctl`, log, `jq`, `grep`, `ls`,
filesystem or test-run check. Reachability by Claude-in-Chrome is **not** the
criterion: an item whose check is a repo/journal/log/shell observation — and
whose `url_path` is therefore a placeholder such as `current` rather than a
route — **is** machine-verifiable. An item is author-required **only if it
cannot be machine-checked at all**: it needs private credentials/accounts Claude
lacks, a subjective product/UX judgment, or the user's product intent. This
makes the legacy boot-then-reject waste structurally impossible on the node
lane.

Every joined item carries exactly one mark:

- `MACHINE` — settleable by a check the autonomous lane can run (browser **or**
  shell/git/journal/log/filesystem).
- `AUTHOR` — cannot be machine-checked at all (private credentials/accounts,
  subjective product/UX judgment, the user's product intent).
- `WAIT` — a valid machine check whose event has not occurred yet (deploy lag,
  an accumulation that needs N more ticks). State the awaited event.

**Default:** `MACHINE`. `AUTHOR` requires naming which of the three barriers
applies. "The browser cannot reach it" is never a barrier.

A `WAIT` item is a **hold on the machine node**: `WAIT` is never a third lane
and never an author item. `MACHINE` and `WAIT` items both group to the machine
lane; only `AUTHOR` items group to the author lane.

A `MACHINE` item may also carry a `check` value — the concrete command or
observation recipe (e.g. `journalctl -u dispatch-tick --since -2h | grep
'sweep'`) — which rides onto the destination node so the drain runs it rather
than re-deriving it.

### The destination nodes

| field | machine lane | author lane |
|---|---|---|
| `id` | `tactic-mainqa-<slug>-machine` | `tactic-mainqa-<slug>-author` |
| `kind` | `tactic` | `tactic` |
| `phase` | `main-qa` | `main-qa` |
| `owner` | `ai` | `human` |
| `status` | `codified` | `delegated` |
| `office_hours` | `null` | `{reason, since, recommendation, session_type: "other"}` |
| `serves` | copied verbatim from the source | copied verbatim from the source |
| `parent` | `null` | `null` |
| `blocked_by` | `[<source-id>]` | `[<source-id>]` |
| `execution` | `{branch: <source branch>, pr: <source PR>, attempts: {}, markers: [], strategy_fingerprint: null}` | same |
| queue | dispatch (`/qa-main`) | office-hours only |

`<slug>` is the source id with a **single** leading `tactic-` stripped. **A lane
with no items is omitted**: a run whose items are all `MACHINE`/`WAIT` mints one
node, and so does a run whose items are all `AUTHOR`.

The machine node is dispatch-selectable and routes to `/qa-main`'s node lane,
which owns verification there. The author node is never selectable (the selector
skips any node with a non-null `office_hours`) and reaches the human only via
the office-hours queue — so it is born parked with a non-empty `reason` and
`recommendation` composed from its own items. Both are `blocked_by` the source,
so neither is worked until the source PR merges and the source reconciles to
`done`.

### Procedure

1. **Select and join.** Take the dispositions whose `class === "needs-main"` and
   join each back to the in-memory residue list from Step 3 **by `id`** — the
   dispositions array carries only `{id, title, kind, class, aesthetic, verify,
   rationale}`, not `url_path` / `expected_outcome` / `finding`. This is the
   same join the legacy lane's step 1 below performs.
2. **Mark** each joined item `MACHINE`, `AUTHOR` or `WAIT` per the sort above.
3. **Mint.** Write the joined, marked items to `tmp/mainqa-items-<n>.json` as a
   JSON array — one object per item, `{id, title, url_path, expected_outcome,
   finding, verifiability}` plus an optional `check` — and run, from the
   worktree root (use `dangerouslyDisableSandbox: true`; the script fetches and
   pushes):

   ```bash
   packages/intentionsutil/scripts/mint-mainqa-nodes "$N" --pr "$PR_NUM" \
     --items tmp/mainqa-items-<n>.json
   ```

   It groups the items by lane, builds each node's frontmatter and body, lands
   every created node in **one** `graph-commit`, and prints one
   `minted <id> (CREATE|EXISTING)` line per non-empty lane. Exit 0 is landed (an
   all-`EXISTING` no-op included), 1 a write/`graph-commit` failure, 2 a usage
   error. A lane whose node already exists on `origin/main` reports `EXISTING`
   and is not rewritten.

   The mint is idempotent **only while the item set is unchanged**.
   `assert_existing_covers` hard-errors (exit 1) when the landed node does not
   already record every item the pass routed to that lane, and its remedy is a
   manual `write-node.ts` + `graph-commit` append — which an autonomous fixing
   pass cannot perform. A re-run that discovers a new item therefore REFUSES
   rather than converging. The refusal is the safe direction, but note it can
   fire falsely: item ids are LLM-authored, so re-spelling one item reads as an
   uncovered item.
4. **Never append to the source body**, and do not set the source's phase here —
   Step 4's `transition-node` write still owns `qa → review`.
5. **Record** each minted id for the Step 4 comment's filed-follow-ups sub-list.
   This seam forks **no** subagents — add **zero** to `SKILL_SUBAGENTS`.

### The `Verifiability:` sub-line (interim convention, now read-only)

Source nodes recorded before this shape carry the same three values as a
`Verifiability:` sub-line on each bullet of a `## needs-main residue` body
section, alongside an optional `Check:` sub-line. `Check:` is optional because
residue already on `origin/main` predates the convention; a drain that finds
none derives the recipe from the expected outcome.

**Retirement:** the standalone `tactic-mainqa-*` node shape is live as of this
PR **for newly-recorded items**, and a companion unit migrates the live `WAIT`
marks — but **39** source nodes still carry a `## needs-main residue` section at
a phase other than `done` (measured at `bb5e7f3f`; **34** of them already at
`main-qa` or `review`) and drain **in place**. Count these with
`LC_ALL=C grep -al`: one residue-carrying node holds a literal NUL byte, and
plain `grep -l` silently omits it. So the sub-line is now a
**read-only** convention for that drain tail — `/qa-main` still parses it on
legacy source nodes — and is **no longer written** by `/qa-fix`. It retires
fully, together with the `## needs-main residue` section itself, once the last
residue-carrying node drains. **Do not delete either while any node still
carries residue.**

Skip the rest of this step; the legacy lane (`TARGET_KIND=issue`) runs it
unchanged.

## Legacy lane (`TARGET_KIND=issue`)

This mirrors `/review-fix` Step 5a/5b — the canonical "file a `blocked_by`
follow-up via `/file-issue` from a dispatch phase" recipe (subagent fan-out,
`dispatch-followup-exists` skip, `===FILE-ISSUE-RESULTS===` parsing,
`ref-github-issues` dependencies API). Procedure:

1. **Select and join.** Take the dispositions whose `class === "needs-main"`. The
   dispositions array carries only `{id, title, kind, class, aesthetic, verify,
   rationale}` — it does **not** carry `url_path` / `expected_outcome` /
   `finding`. **Join each selected disposition back to the in-memory residue list
   from Step 3 by `id`** to recover those fields. The result is one object per
   needs-main item carrying `{id, title, kind, url_path, expected_outcome,
   finding}` (the disposition contributes `id`/`title`/`kind`; the residue
   contributes `url_path`/`expected_outcome`/`finding`).

   **Determine the route.** The **parent thread** (this caller — it holds the
   joined residue fields above and these documented criteria) computes a
   per-item `route` for each joined needs-main item. The `identifier` does not
   exist yet (the Step 3.6.2 emitter produces it). So compute `route` here
   against the `id`-keyed join, then carry it across to each item's
   `identifier` once Step 3.6.2 emits one `{identifier, …}` object per input
   item, in input order — the parent owns this `id`↔`identifier`
   correspondence and ends with an `identifier`→`route` map threaded into the
   Step 3.6.3 forks.

   - `autonomous` (apply `main-qa` only; **withhold** `dispatch:office-hours`
     so the router routes the follow-up to `/qa-main`) — when verification is
     an **objective check any tool the autonomous lane can run** can settle:
     hitting a public deployed URL and checking deployed behavior,
     element-or-text presence, console errors, network responses, or public
     analytics, **or** a repo/journal/log/shell/filesystem check (`git`,
     `journalctl`, `jq`, `grep`, `ls`, a test run). **No** auth wall, **no**
     private credentials/accounts, **no** subjective product/UX judgment.
   - `human` (apply `main-qa` + `dispatch:office-hours`, unchanged) — when
     verification needs private credentials/accounts Claude lacks (an
     auth-walled view), subjective product/UX judgment, or the user's product
     intent.
   - **Uncertain → `human`** (conservative default). The asymmetry is
     explicit: a wrongly-`autonomous` item is recoverable via `/qa-main`'s
     cannot-verify valve, but a verification that needs the user must never be
     silently skipped. Not reachable by the browser is never a source of that
     uncertainty — a check no browser can perform is `autonomous`.

   **Recorded caveat (legacy lane only).** On this lane `/qa-main` still runs
   `dispatch-main-qa-triage` (`qa-main/SKILL.md` Step 4·0, "Triage: is this
   follow-up browser-verifiable?"), which is browser-only, so a non-browser
   `autonomous` item on this lane would still exit 3 → cannot-verify. This
   lane is retired (its router entry is removed; the script is dead code on
   the node lane per the **Node-target lane** section's sort paragraph,
   "Sort each item by its `Verifiability:` mark"), so the divergence is
   **recorded, not fixed here** — `dispatch-main-qa-triage` is explicitly not
   edited.

2. **Compose the follow-ups** by piping the joined needs-main items through the
   Unit-1 emitter (pure — no network/git/gh, runs sandboxed-fine, no
   `dangerouslyDisableSandbox` needed for this call):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-qa-needs-main-followup "$N" "$PR_NUM" \
     < <(printf '%s' '<joined needs-main items as JSON array>')
   ```

   It emits a JSON array of `{identifier, title, body}`, one object per input
   item (`[]` when the input is empty). The `identifier` is embedded verbatim in
   `title` so `dispatch-followup-exists` can dedup it.

3. **File each follow-up.** For each emitted `{identifier, title, body}`, fork a
   subagent (`subagent_type: general-purpose`, `model: sonnet`). Pass this
   item's `route` (from the parent's `identifier`→`route` map, Step 3.6.1) into
   the subagent prompt **as data**. The subagent does **not** make the
   determination — it only relays the value to the script in sub-step c. These
   subagents touch only GitHub and never the working tree, so fan them out in
   parallel (multiple Agent calls in one message). Each subagent, with
   `dangerouslyDisableSandbox: true` for the `gh` calls (`gh` needs network — see
   `.claude/rules/sandbox.md`):

   a. Runs the deterministic existence check on the follow-up's `identifier`:

      ```bash
      .claude/skills/dispatch-propagate/scripts/dispatch-followup-exists "<identifier>"
      ```

      If it prints an issue number, an open or closed tracking issue already
      covers this identifier — **skip** `/file-issue` entirely: do not file, do
      not re-label. Record the follow-up as already-tracked, mapping its
      `identifier` to the existing issue `#<N>` for the Step 4 comment, and return
      that `<N>`. Otherwise proceed.

   b. Invokes `/file-issue` with the follow-up's `title` on the first line and its
      `body` after. `/file-issue` owns duplicate detection, creation, `@me`
      assignment, the `help wanted` label, and type + topic classification; it
      ends with a `===FILE-ISSUE-RESULTS===` … `===FILE-ISSUE-RESULTS-END===`
      block. Read every `<disposition> <N>` record line between the sentinels — a
      single machine-keyed follow-up normally yields one record; iterate step c
      over each if more.

   c. For each created `<followup-N>`, records a `blocked_by` dependency **on
      `<followup-N>`, targeting the issue under QA `$N`** (the current worktree's
      issue, resolved in Step 0 — not the issue that implemented this skill).
      This makes the follow-up `blocked_by` the issue under QA: its manual
      post-merge verification waits until this PR's issue is done. Use the
      `ref-github-issues` dependencies API (invoke `ref-github-issues` for the
      exact `gh api --input` syntax; do not restate it). `/file-issue` applies
      `help wanted` + `@me`; then call the post-process helper
      (`dangerouslyDisableSandbox: true` — it calls `gh`):

      ```bash
      .claude/skills/dispatch-propagate/scripts/dispatch-qa-apply-main-qa-labels "<followup-N>" --route <autonomous|human>
      ```

      Pass the `route` relayed into this subagent. The script always removes
      `help wanted` and adds `main-qa`, leaving `@me`. For `--route human` it
      **also** adds `dispatch:office-hours`, so the follow-up lands on the
      office-hours queue (human review). For `--route autonomous` it
      **withholds** `dispatch:office-hours`, so the router routes the follow-up
      to the autonomous `/qa-main` handler instead.

   d. Returns `<followup-N>` mapped to its `identifier`.

4. **Capture** each filed-or-existing `<followup-N>` against its `identifier` for
   the Step 4 filed-follow-ups sub-list. Increment `SKILL_SUBAGENTS` by the
   number of **filing subagents forked** in sub-step 3 — i.e. the number of
   emitted `{identifier, title, body}` follow-up items, counting *every* forked
   subagent including those for already-tracked items (whose subagent still runs
   the `dispatch-followup-exists` existence check). This is the FORKED count, a
   distinct number from `--followups-filed` (which counts only newly-filed
   items): the two diverge whenever an item was already-tracked.

The needs-main filing is **idempotent** (guarded per-identifier by
`dispatch-followup-exists`), so it is safe to run on every pass — including a
re-QA tick after a Step 3.7 fix. A follow-up already filed on an earlier pass is
recorded as already-tracked, not re-filed.
