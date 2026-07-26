# Step 3.6 — File needs-main follow-ups

This reference carries the full needs-main follow-up filing procedure for Step
3.6 of `SKILL.md`. The body holds the guard (run only when Step 3.5 ran and
`result.dispositions` contains a `class === "needs-main"` item) and the terse
"file a `blocked_by` follow-up per needs-main item" control flow.

This step fires whenever a `needs-main` disposition exists — independent of
whether the run will ultimately fix, park, or pass on some *other* class. It runs
**before** the Step 3.7 auto-fix lane, so a mixed fixing pass files its
needs-main follow-ups here and the Step 4 comment (posted from inside Step 3.7's
fix finalize path) can truthfully list them. A run that carries both a
`needs-main` item and an `opus-fixable`/`needs-human` item files the needs-main
follow-up here, and "drop from escalation" (Step 6) stops a `needs-main` item
from triggering a park on its own account, never suppresses a park caused by
another class.

## Node-target lane (`TARGET_KIND=node`) — supersedes the gh filing below

A node target files **nothing anywhere**. Instead, append a `## needs-main
residue` section to the tactic's **own body** (`intentions/<node-id>.md` —
bodies are authoritative for tactics) by running:

```
npx tsx packages/intentionsutil/scripts/append-machinery-section.ts <node-id> --section-file <path-to-composed-section>
```

(or piping the composed markdown via stdin — `--section-file -` is the
default), never by hand-editing the node file directly, with one entry per
`needs-main` item carrying its `id`, `title`, `url_path`, `expected_outcome`,
and `finding`. This CLI is mandatory: it places the section below the
machinery sentinel, which is what keeps the append outside the tactic scope
fingerprint, so the append can never trigger a false scope-drift demotion.
That append rides in the Step-4 state-only completion commit (the `transition-node` write);
the reconciler then routes the merged tactic to its `main-qa` phase (the
transition writer picks `qa → main-qa` because the residue section is present),
where `tactic-main-qa-phase`'s handler owns verification. Only
machine/browser-verifiable items become residue: verifiability is triaged here
at record time (the `route` computation below already classifies every item),
and a prod observation needing human judgment stays `needs-human` →
`office_hours` (the Escalation seam), never residue. This makes the legacy
boot-then-reject waste structurally impossible on the node lane. Skip the rest
of this step; the legacy lane (`TARGET_KIND=issue`) runs it unchanged.

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
     an **objective check observable on public deployed prod** that
     `/qa-main`'s read-only Claude-in-Chrome flow can perform: hitting a
     deployed public URL and checking deployed behavior, element-or-text
     presence, console errors, network responses, or public analytics. **No**
     auth wall, **no** private credentials/accounts, **no** subjective
     product/UX judgment.
   - `human` (apply `main-qa` + `dispatch:office-hours`, unchanged) — when
     verification needs private credentials/accounts Claude lacks (an
     auth-walled view), subjective product/UX judgment, or the user's product
     intent.
   - **Uncertain → `human`** (conservative default). The asymmetry is
     explicit: a wrongly-`autonomous` item is recoverable via `/qa-main`'s
     cannot-verify valve, but a verification that needs the user must never be
     silently skipped.

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
