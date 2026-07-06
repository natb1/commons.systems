---
id: tactic-review-low-severity-sweep
kind: tactic
statement: Sweep of low-severity code-review findings (a11y nits, dead code,
  minor CI/error-handling hardening) captured from the 2026-07-05 review
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-07-05 review. Retained context, not selectable
  work: ~70 low-severity findings the review confirmed but that do not each
  warrant a PR-sized tactic. Recorded so nothing is lost; the author or a later
  /align-tactics round can promote individual items. Relates to
  strategy-progressive-validation as the nearest validation/cleanup posture; the
  grouping is by area in the body, not a claim each advances the signal."
reading: null
gap: null
serves:
  - strategy-progressive-validation
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
# Low-severity code-review sweep (2026-07-05)

## Context

Retained context, not selectable work. The 2026-07-05 review confirmed
~60 low-severity findings that do not each warrant a PR-sized tactic.
Recorded so nothing is lost; a later `/align-tactics` round (or the
author) can promote individual items. Grouped by area — each line is a
confirmed finding with an anchor. Not exhaustive of every nit, but covers
the substantive lows.

A first version of this sweep (landed alongside this round) mis-sorted
several higher-severity findings into this "low" node. Those have since
been promoted to their own tactics or folded into existing ones:
`tactic-token-audit-node-attribution` (day-slice undercount, subagent
double-count), `tactic-shared-ui-correctness` (cc-badge styling,
BudgetPaceChart freeze), `tactic-crypto-core-consolidate` (buffer-transfer
footgun), `tactic-budget-etl-balance-history` (duplicate virtual doc IDs),
`tactic-print-viewer-save-reliability`, `tactic-budget-week-axis-consistency`,
and `tactic-dispatch-script-hardening`. This sweep now holds only the items
actually rated low.

## budget app

- `use-app-state.ts:318` vs `:275`: empty-string password treated as an
  encrypted session on load but truthy-checked on export -> manual export
  silently writes unencrypted `.json`.
- `entities/budget.ts:194`: `parseRawBudget` passes `name` through
  unvalidated -> literal `undefined` series label instead of a clear error.
- `idb.ts:114` / `upload.ts:101-113`: duplicate ids in an uploaded export
  silently collapse (IDB put last-wins); no uniqueness validation.
- `balance.ts:193-259`: `computeBudgetBalance` is dead code re-implementing
  money logic already in `computeAllBudgetBalances`.
- `pages/account-view-model.ts:32-36,78`: all-null-timestamp accounts get
  `maxTs=0` -> "12/31/1969" sorted first.
- `pages/budgets-hydrate.ts:185-186,240-245,371`: non-array parse throws
  raw TypeError (skips DataIntegrityError path); module-level
  `scrollAbort` shared across hydrators.
- `pages/statement-source-view.ts:222,227,241`: bare catch blocks bypass
  `classifyError`.
- missing test: `pages/accounts-cash-flow-chart.ts` (computes its own rolling
  averages, no unit test).
- `LegacyRoute.tsx` + `legacy-hydrate.ts`: dead production code.
- `pages/Accounts.tsx:387-415`: ~25 lines duplicated from `wireChartResize`
  with a stale justifying comment.

## budget-etl (Go)

- `internal/export/export.go:440-452`: atomic snapshot write renames without
  `Sync()` (power-loss truncation risk on the only encrypted snapshot).
- `internal/parse/csv.go:45`: truncated metadata row silently records
  balance 0 / zero date.
- `internal/parse/parse.go:229` + `main.go:1481`: `Balance int64` conflates a
  real $0.00 with "absent" -> paid-off card gets no balance history.
- `internal/journal/journal.go:41,306`: `centTolerance=1` can only create
  false transfer merges (amounts are exact integer cents).

## print

- `Viewer.tsx:46-49` + `useBookmarks.ts:87`: bookmarks store loads once with
  the initial cloud store; a post-mount Firestore failure forks state.
- `local-folder-ui.ts:178-190`: "Forget folder" never calls the sidecar
  `clearLocalDirectory` hook.
- `useViewerController.ts:483-487`: keydown handler ignores modifiers ->
  Alt+ArrowLeft both pages and navigates back.
- `viewer/image-archive.ts:67-83`: no object-URL/Blob eviction (holds all
  decompressed images for the session).

## audio

- `storage.ts:7-14` vs `local-source.ts:38-44`: two drifted MIME maps
  (`.aac` accepted in one, unreachable in the other).
- `pages/Home.tsx:47-50,76-82`: pre-React dead code + misleading validation
  message.

## packages / blog / office-hours

- `packages/blog/src/pages/HomeRegion.tsx:83-85`: never sets `data-hydrated`
  after runtime fetch-hydrate -> re-fetch/re-parse on every nav.
- `packages/blog/src/create-blog-app.ts:413`; `feed.ts:26-42` vs
  `post-types.ts:14-51`: admin nav hydration mismatch; feed/sitemap use
  laxer published-post rules than the canonical validator.
- `packages/blog/src/blog-roll/parse-feed.ts:41`: xmlns-strip regex requires
  a literal space -> Firefox `<feed\nxmlns=...>` reported unavailable.
- `packages/crypto/src/crypto.ts:55-61`: `worker.onerror` nulls the worker
  without `terminate()` (orphaned PBKDF2 threads).
- `packages/idbutil/src/connection.ts:80`: stale open-request `onerror`
  unconditionally nulls `dbPromise`, clobbering a fresh memoized promise.
- `packages/firestoreutil/src/bounded-query.ts:66-88`: mutable shared
  `constraints` array (branching two queries off one base cross-contaminates).
- `packages/authutil/src/firebase-auth.ts:106-111`: `signOut()` resolves on
  failure (caller navigates as signed-out while the session is live).
- `packages/firebaseutil/src/config.ts:26`: module-scope `requireEnv` for the
  reCAPTCHA key hard-fails import for apps that never enable App Check.
- `packages/router` index vs location-store: two navigation systems that do
  not notify each other (vanilla router + React `useLocation` desync).
- office-hours: `QueueMetricsPanel.tsx:35-37` unrounded runway ("23.36...
  days"); `local-snapshot-source.ts:148-152` stamps the staleness watermark
  before decode (a transient decode failure marks the version "seen");
  `Dashboard.tsx:357-361` demo banner references removed auth; five vanilla
  DOM renderers (`queue-band.ts` etc.) referenced only by tests.
- `packages/mediautil/src/local-folder.ts:60-66`: bare `catch { continue }`
  swallows consumer mapper bugs (files silently vanish from the library).

## backend / functions / rules

- `functions/src/project-signals.ts:328-329`: PSI fan-out is all-or-nothing
  (`Promise.all`) - one 429 drops PSI for all apps; combined with the
  full-overwrite snapshot (`project-signals-core.ts:535`) erases
  last-known-good on a transient upstream blip. Use `allSettled` + merge.
- `firestore.rules:520-527`: signal-samples demo tier can `get` but not
  `list` (the promised public time-series is unusable); no rules-test.
- `firestore.rules:52-54` vs `:77-79`: the transactions-rule comment
  ("updates limited to note, category, reimbursement, budget, and
  normalization fields") drifted from the rule, which also permits
  `statementItemId`/`journalEntryId` rewrites (type-checked only, not
  pinned) — intentional (the reconcile flow needs it) but the comment
  under-states the mutable surface reviewers actually read as the
  security contract.
- `functions/src/dispatch-queue-metrics-core.ts` / `office-hours-sync-core.ts`:
  orphaned after the #2763 decommission with stale header contracts,
  consumed cross-package via relative imports. (Note: relocation overlaps the
  in-flight `tactic-attention-surface-analytics-collector`.)
- `feed-proxy.ts:122-125`: upstream Content-Type reflected verbatim; force
  XML or add `X-Content-Type-Options: nosniff`.

## ops / dispatch scripts (mostly legacy — many OBE at legacy-router-removal)

- token-audit: `aggregate-usage.sh:168,174,846` local-time window vs UTC
  find (excludes recent |offset| hours). (Tracked by
  `tactic-token-audit-node-attribution`; the day-slice and double-count
  halves of this finding were promoted out of this sweep into that same
  tactic's Unit 4.)
- `run-typecheck.sh:117`, `run-lint.sh:56-59`: `set -e` / process-substitution
  patterns that can false-green a workspace.
- `dispatch-reconcile-merged:61` creation-ordered "merged recently" window
  (misses old-PR-merged-today, the #2512 case); `dispatch-select-target:270`
  unpaginated main-broken check; `dispatch-find-owning-pr:92` treats any API
  error as 404; `dispatch-route:179,196,211,277-284` undiagnosed parks +
  stranded-push conflation; `dispatch-attempt-count` remove-then-add label
  bump; `gh_retry:125-151` retries non-idempotent POSTs (double-file risk).
  (Mostly legacy-gh-router scoped — check survival against
  `tactic-legacy-router-removal` before fixing.)
- `.claude/hooks/statusline.sh:28` divide-by-zero; `worktree-remove.sh:62-63`
  resolved-vs-unresolved path compare.
- duplication belonging in lib.sh: `gh label create` idiom x8; the four
  marker-comment upsert copies (OBE via node-body plans);
  `dispatch-attempt-count`/`dispatch-qa-fix-attempt` near-clones;
  `api_error_reason` identical in fetch-analytics/fetch-psi.
- dead scripts (zero non-test refs): `issue-siblings`, `wait-for-url.sh`,
  `check-inbox-age`, `dispatch-reclaim-audit`.
