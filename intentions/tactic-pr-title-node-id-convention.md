---
id: tactic-pr-title-node-id-convention
kind: tactic
statement: "Construct the `<node id>: <short description>` PR title at the
  opener and guard it in CI — every new PR's title carries its node id verbatim
  and its head branch resolves to a real node"
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-25 /align-strategy round that recorded the
  PR-title convention as a standing condition on strategy-graph-native-dispatch.
  The clarification records the doctrine; this node is the completable change
  that makes it hold. Today PR titles are free-form (`dispatch-open-pr --title
  "<short summary>"`, .claude/skills/implement/SKILL.md:375) while the branch
  alone carries the node id, so `main`'s squash-merge subjects — the repo is
  squash-only with squash_merge_commit_title=PR_TITLE — carry no link back to
  intent.
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
# Construct the `<node id>: <short description>` PR title at the opener and guard it in CI — every new PR's title carries its node id verbatim and its head branch resolves to a real node

Retained draft context from the 2026-07-25 `/align-strategy` round. Not yet a
plan — `/align-tactics` owns decomposition, unit scoping, and verification
blocks. The recorded doctrine this implements is the PR-title clarification and
the matching `attributes.conditions` entry on `strategy-graph-native-dispatch`;
read those first, they are authoritative over anything below.

## Current state (verified 2026-07-25)

- `dispatch-open-pr` takes a free-form `--title` and passes it straight to
  `gh pr create --draft --title "$TITLE"`
  (`.claude/skills/dispatch-propagate/scripts/dispatch-open-pr:203`); the usage
  banner documents it as "REQUIRED. The PR title." (`:16`).
- `/implement` Step 4 instructs `--title "<short summary>"`
  (`.claude/skills/implement/SKILL.md:375`); `/plan-issue`'s SKILL.md also
  references the script.
- The node id already lives on the branch (`execution.branch` equals the node
  id), so the opener has the id available without extra lookup.
- The repo is squash-only with `squash_merge_commit_title=PR_TITLE`, so a PR
  title becomes `main`'s commit subject verbatim — this is why the title, not
  just a PR-open gate, is the load-bearing artifact.
- `.github/workflows/pr-checks.yml` runs `on: pull_request` with
  `types: [opened, synchronize, reopened]` and already holds several
  small sensor jobs — the natural host for a title guard.
- No `.github/dependabot.yml` exists today.

## Byproduct units (unrefined)

1. **Construct the prefix at the opener.** `dispatch-open-pr` derives
   `<node id>: ` from the node (branch name is the node id) and prepends it to
   the caller's `--title` text, so conforming titles are true by construction
   rather than hand-copied — this is what keeps the convention consistent with
   derived-never-stored. Decide whether the script prepends unconditionally or
   rejects a `--title` that already carries a prefix; make it idempotent either
   way. Update the usage banner and the `/implement` (and `/plan-issue`) call
   sites so the documented `--title` value is the description alone.

2. **CI guard for hand-opened PRs.** A job in `.github/workflows/pr-checks.yml`
   that fails when the PR title does not match `^<id>: .+` **or** when `<id>`
   does not resolve to a file in `intentions/`. The resolution half is the
   adopted half of this round's steelman: a shape-only check would pass a
   typo'd or invented id. Add `edited` to the workflow's `pull_request` types so
   a post-open retitle is re-checked. Exempt only the draining legacy
   gh-issue lane; bot-authored PRs are not exempt.

3. **Legacy-lane exemption with a named expiry.** Encode the gh-issue-lane
   carve-out so it is mechanically identifiable and removable when the queue
   drains — coordinate with `tactic-legacy-router-removal` rather than
   inventing a parallel switch.

## Explicitly out of scope

- Retitling existing open PRs. The condition binds at open time going forward.
- The `graph: <verb> <node-id> (...)` subject convention on direct-push
  `intentions/` commits — a different surface, untouched.
