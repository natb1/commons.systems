# GitHub recovery drill — export → substitute-forge import round-trip

Exercises the recovery path recorded on `intentions/delegation-github.md`
(`recovery_path: re-host — git is portable by design; issues/PR relationships
export via API; Actions workflows would need porting to another runner`). The
drill stands up a substitute forge, loads it with this repo's GitHub data using
the substitute's *own* migration tooling, and measures what survives. Per the
strategy's scope note it stops short of production cutover — the forge is stood
up, loaded, and inspected, not adopted.

## Run metadata

- **Drill date:** 2026-07-16
- **Export (Unit 1) captured at:** 2026-07-16T04:07:33Z (`archives-manifest.json`)
- **Import (Unit 2) run at:** 2026-07-16T04:14–04:34Z
- **Effort:** ~30 min active wall-clock for the import leg (Gitea stand-up ~5
  min; migration ~15 min of unattended import before it hit the rate-limit wall
  and was halted). A *complete* import would have taken >1 hour because of
  GitHub REST rate-limit backoff (see friction below).
- **Substitute forge:** Gitea 1.26.4 (`nix build nixpkgs#gitea`, no Docker),
  SQLite backend, throwaway data dir under `ops/recovery-drills/archives/`
  (gitignored), listening on `127.0.0.1:3939`. Process stopped and data dir
  removed at end of drill.
- **Import mechanism:** Gitea's built-in GitHub migrator (`POST
  /api/v1/repos/migrate`, `service: github`), authenticated with the
  interactive `gh` CLI token. Deliberately the forge's own tooling, not a
  bespoke importer — the drill measures what a real substitute preserves.

## Survived / lost table

Exported counts are from the Unit 1 manifest (`archives-manifest.json`).
Imported counts are read directly from Gitea's SQLite tables at the point the
migration was halted.

| Entity | Exported (manifest) | Imported (Gitea) | Verdict |
|---|---|---|---|
| Non-PR issues | 0 | 0 | N/A — none exist (tracking migrated to `intentions/`) |
| Pull requests | 1312 | 1317 | **Survived (full).** +5 is live drift: the fleet opened 5 PRs in the export→import gap. PR bodies + state spot-checked and render. |
| PR / issue comments | 6343 | 1196 (and climbing when halted) | **Survives faithfully, throughput-bound.** Comments imported correctly; the count is partial only because the run was halted at the rate-limit wall, not because comments are dropped. |
| PR reviews (threads) | (not counted in manifest) | 5 (stalled) | **Partial — this is where the REST budget ran out.** Per-PR review fetch is the rate-limit killer (~1 call/PR × 1317). |
| Labels | (not counted) | 60 | **Survived.** |
| Milestones | (not counted) | 0 | N/A — none exist. |
| Releases | 0 | 2 | **Over-count, not loss.** Gitea auto-registers git tags as tag-releases (`last-prod-deploy`, `archive/896-…`). No GitHub Releases existed; these are tag artifacts. |
| Workflow files (as files) | 16 registered / 8 live `.yml` in HEAD | 8/8 present in migrated git repo | **Survived as files** (git content is 100%). They do **not execute** in Gitea — see porting cost. (Manifest's 16 is the Actions API `total_count`, which includes deleted workflows + the dynamic CodeQL entry; only 8 live files exist in HEAD.) |
| Sub-issue edges | 0 | 0 (unsupported) | **Capability gap, no data lost.** Gitea's migrator predates GitHub's sub-issues API and imports none. 0 existed here. |
| Issue dependency edges (blocked_by / blocking) | 0 | 0 (`issue_dependency` table empty) | **Capability gap, no data lost.** Gitea's migrator does not import GitHub issue dependencies. 0 existed — dependencies live in the graph's own `blocked_by` field, not GitHub. |
| Git history / branches | (out of scope for export — mirrored clones exist) | Full clone (47 MB) imported | **Survived (trivial leg).** This is `delegation-github`'s `non_delegable_floor`; `git clone --mirror` is the easy part. |
| Actions run history / logs / check status | not exportable via API | not imported | **Lost.** No migrator imports this; it is GitHub-only and unrecoverable through a forge migration. |
| Secrets | not exportable (known gap) | n/a | **Lost by design** — API cannot read secret values back. Noted in Unit 1 manifest. |

## Measured recovery friction

**Easy / worked cleanly:**
- Standing up Gitea from nixpkgs (no Docker) and initializing it non-interactively
  (`gitea migrate` + `gitea admin user create` + generated access token): minutes.
- The git leg: full `git clone` of the 47 MB repo completed instantly and the
  working tree (including all 8 `.github/workflows/*.yml`) is intact in the
  migrated repo.
- Kicking off the import is a single authenticated API call; Gitea runs it as an
  async task and imports repo + PRs + labels + comments + reviews with its own
  tooling. No bespoke import code was written — exactly the point of the drill.
- Data fidelity where it imported: PR titles/bodies/state, comment bodies, and
  labels all render correctly.

**Needed intervention / hit a wall (the headline finding):**
- **The migration exhausted the entire 5000-request/hour GitHub REST rate limit
  before finishing.** It consumed ~4650 REST calls reaching the per-PR review
  phase, then drained the bucket to **0/5000** and stalled with reviews only 5
  of ~1300 done. The per-PR review/thread fetch (~1 call per PR × 1317 PRs) is
  the cost driver that overruns the hourly budget.
- Because Gitea's downloader backs off and sleeps until the rate-limit reset,
  a *complete* import of this repo (1312 PRs + 6343 comments + per-PR reviews)
  must span **multiple hourly reset windows** — turning a ~20-minute job into a
  multi-hour one. The drill was halted at the wall rather than left to drain
  reset windows, both because the measurement was already conclusive and to
  protect the shared token budget.
- **Shared-token blast radius:** the import ran on the interactive `gh` CLI
  token, which shares the same 5000/hr REST bucket as the live dispatch fleet.
  A real recovery must use a **dedicated PAT** so the migration's rate-limit
  consumption does not starve concurrent automation. This is a concrete
  tooling/process gap, not a theoretical one — the drill measurably drove the
  shared bucket to zero.
- Minor, expected: Gitea logged `GetBranchCommitID: can't find commit ID for
  head` warnings for PRs whose source branches were deleted after merge. The PR
  record and diff still import; only the live head ref is absent (it lives in
  git history, not as a branch). Non-issue for an archival re-host.

## Residual dependence assessment

**What GitHub still uniquely holds for this project.** The intention graph
(`intentions/`, 378 nodes) is now the source-of-truth issue tracker, and the
export confirms it: **0 non-PR GitHub issues exist.** So the classic "issue
tracker" dependence is already gone — issues are local Markdown, versioned in
git, and would survive GitHub's disappearance untouched. The load-bearing
GitHub-only residual has shrunk to three things:

1. **Pull requests (1312).** The review/merge substrate the dispatch chain
   drives. Gitea's migrator imports the PR records, bodies, and diffs faithfully
   — so the *history* re-hosts. The fragile parts are (a) in-flight open/draft
   PRs mid-workflow, and (b) per-PR review threads, which are exactly what the
   rate limit throttled.
2. **CI execution and its history.** This is the genuine, non-mechanical loss.
   Workflow *files* migrate as text but **do not run** in Gitea, and Actions
   **run history, logs, and check-status are not exported at all** — no migrator
   recovers them. Re-establishing CI means porting 8 workflow files to Gitea
   Actions (or another runner): they use 2 distinct third-party actions
   (`DeterminateSystems/nix-installer-action`, `softprops/action-gh-release`)
   plus 5 first-party `actions/*` (`checkout`, `cache`, `setup-node`,
   `setup-go`, `setup-java`) that Gitea Actions largely mirrors. Porting is
   hours of rewriting `uses:` references and validating the Nix-based build
   steps — bounded, but real.
3. **PR/issue comments (6343).** The dispatch chain posts plan, status, QA, and
   review comments on PRs — the audit trail of autonomous work. These migrate,
   but slowly (rate-limit-bound), and historical CI-status comments reference
   runs that no longer exist post-migration.

**What the dispatch/build chain would actually lose today if GitHub vanished:**
- **Not** the issue graph — it is local in `intentions/*.md` and git-versioned.
- **Not** the git history — mirrored clones exist on local machines at all times
  (`non_delegable_floor`); this is the trivial leg.
- **Would lose:** live CI execution (until 8 workflows are ported to a new
  runner), all historical CI run logs/status (unrecoverable), and it would face
  a **multi-hour, rate-limited re-import** of the PR + comment corpus before the
  substitute forge holds the full review/audit history.

**Measured recovery cost (for the record flip).** Substitute-forge stand-up:
minutes. Git re-host: trivial (mirror clones already exist). PR + comment
corpus re-host: **multi-hour, rate-limit-bound** (spans several 5000/hr windows
for 1312 PRs + 6343 comments + per-PR reviews; requires a dedicated PAT to avoid
starving live automation). CI: the real porting cost — 8 workflow files to a new
runner. Net: **hours-to-about-a-day of migration work, dominated by CI porting
and the rate-limited PR/comment re-import; the issue graph and git history carry
near-zero recovery cost.** Structural capability gaps (sub-issue and dependency
edges are not imported by Gitea's migrator) cost nothing here because those
edges are unused — dependencies live in the graph's own `blocked_by` field.
