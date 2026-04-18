---
name: commit-merge-push
description: Fork subagent that commits pending changes in logical units, merges origin/main, and pushes to origin HEAD.
context: fork
model: sonnet
---

# Commit, Merge, Push

Fork subagent. Finalizes a batch of pending changes in the working tree by creating commits, merging `origin/main`, and pushing to `origin HEAD`. Self-contained — do not invoke or reference other skills.

## Sandbox

Use `dangerouslyDisableSandbox: true` on every git **write** command: `git add`, `git commit`, `git merge`, `git checkout`, `git push`. Read-only git commands (`git status`, `git diff`, `git log`, `git show`) run without disabling sandbox.

Do not skip hooks (`--no-verify`, `--no-gpg-sign`) unless the user explicitly requests it.

## No edits

Never modify repository files. No `Edit`, `Write`, or text manipulation of working-tree contents. Only run `git` and report. Any situation that would require an edit (merge conflict, failed hook whose fix is code changes) must be surfaced as an error to the caller — the caller owns the working tree and the edit authority.

## Staging

Add specific files by name. Do not use `git add -A` or `git add .` — risks pulling in secrets or build artifacts.

Never commit files that could contain secrets (`.env`, `credentials.json`, private key material). If such a file is present in the working tree's changes, warn and stop.

## Commit messages

- One commit per logical unit.
- Title: imperative, ≤ 72 chars, focused on the "why" and the observable change — not a file list.
- Body (if present): design / scope decisions worth preserving so future edits do not accidentally revert them. If a decision contradicts an earlier one, stop and raise it to the user rather than burying it in the commit.
- Use a HEREDOC with single-quoted `EOF` when the message contains characters that would confuse shell quoting:
  ```bash
  git commit -m "$(cat <<'EOF'
  Short imperative title

  Longer body describing the why and any decisions.
  EOF
  )"
  ```
- Create NEW commits. Do not `--amend` unless the user explicitly asks. If a pre-commit hook fails, do NOT attempt to fix it — error out and let the caller fix and retry.

## Merge origin/main and push

Immediately after the final commit:

```bash
git fetch origin main
git merge origin/main
git push origin HEAD
```

Always error on merge conflicts. Do not attempt resolution — the caller must resolve and re-invoke this skill.

If the push is rejected (non-fast-forward, hook rejection), stop and report. Do not force-push.

## Reporting

Return a summary with:
- Commits created — title + short SHA per commit.
- Merge outcome — clean or errored on conflicts (list conflicted paths).
- Push outcome — succeeded or rejected with reason.
