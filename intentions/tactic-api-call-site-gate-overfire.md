---
id: tactic-api-call-site-gate-overfire
kind: tactic
statement: Narrow the dispatch-api-call-site classifier so generic call-site
  tokens (query(, collection(, fetch(, axios) do not fire on diffs that merely
  mention them in comments, prose, tests, or .claude/ tooling — the merged
  api-cost lens over-fires and launches an extra Lane-B agent with nothing in
  scope to review
owner: ai
status: raw
parent: null
rationale: "Surfaced by review-fix's own review pass on PR #3031
  (tactic-review-api-cost-lens-merge), which introduced dispatch-api-call-site.
  The finder (Source cost) demonstrated the over-fire on that PR's own diff:
  piping the PR's merge-base..HEAD diff through the classifier prints
  api_call_site=true purely because added comment/prompt-text lines in
  review-fix.js and the shell scripts contain the literal substrings getDocs(,
  collection(, and query( -- the diff touches no application code and no real
  Firestore call site. Because api_call_site is the sole trigger for the merged
  api-cost agent (review-fix.js's agentFinderSet), every review run over a diff
  that merely mentions these tokens -- docs, prompts, tests, .claude/ tooling,
  or any SQL/HTTP client using .query() -- launches an extra Opus/Sonnet
  subagent with nothing in scope, a recurring per-run token-spend amplifier on a
  set of dispatch runs that grows without bound. Classified Deferred (advisory,
  Source cost) by review-fix's adversarial-verify pipeline -- not Required, and
  independent of tactic-review-api-cost-lens-merge's own PR, which the
  disposition table's non-escalation invariant already treats as out of scope
  for a merge-blocking fix."
reading: null
gap: null
serves:
  - strategy-token-economy
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
# Narrow the dispatch-api-call-site classifier so generic call-site tokens (query(, collection(, fetch(, axios) do not fire on diffs that merely mention them in comments, prose, tests, or .claude/ tooling — the merged api-cost lens over-fires and launches an extra Lane-B agent with nothing in scope to review

## Provenance

- **Source PR:** #3031 (`tactic-review-api-cost-lens-merge`), surfaced by the
  review-fix pipeline's own `cost`-Source finder during that PR's own review
  pass.
- **Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-api-call-site:35`
  (the `CALL_SITE_RE` extended-regex match over added diff lines).
- **Failure scenario.** The classifier scans every added line of the whole
  diff for bare substrings — `fetch(`, `axios`, `getDocs(`, `getDoc(`,
  `addDoc(`, `setDoc(`, `updateDoc(`, `deleteDoc(`, `onSnapshot(`, `query(`,
  `collection(`, `collectionGroup(`, `XMLHttpRequest` — with no filter for
  comments, prose, test files, or path (e.g. `.claude/**`). Several of these
  tokens are generic enough (`query(`, `collection(`, `fetch(`, `axios`) that
  non-Firestore and even non-code diffs classify `true`. Demonstrated live on
  PR #3031's own diff: `git diff <merge-base> HEAD | dispatch-api-call-site`
  printed `api_call_site=true` purely because added comment/prompt-text lines
  in `review-fix.js` and the shell scripts contain the strings `getDocs(`,
  `collection(`, and `query(` — the diff touched no application code and no
  real Firestore call site at all. Because this flag is the sole trigger for
  the merged `api-cost` Lane-B agent (`review-fix.js`'s `agentFinderSet`),
  every review run over a diff that merely mentions these tokens — docs,
  prompts, tests, `.claude/` tooling, or any SQL/HTTP client using `.query()`
  — launches an extra Opus/Sonnet subagent that has nothing in scope to
  review. This is a recurring per-run token-spend amplifier on a set of
  dispatch runs that grows without bound. The classifier's own header already
  acknowledges the fire rate is unmeasured; this is the measurable over-fire
  half of that risk.
- **Adversarial verdict.** Classified `Deferred` (Source `cost`, advisory —
  never `Required`, never verify-eligible per the disposition table's
  non-escalation invariant) by the review-fix Workflow that ran on PR #3031.
  Not routed through adversarial-verify (advisory findings are excluded from
  `requiredFindings` before the skeptic gate runs), and explicitly out of
  scope for a merge-blocking fix on that PR.
- **Recommended fix (from the review-fix disposition, for whoever finalizes
  this draft to evaluate):** narrow the classifier before it fires more
  broadly — (a) restrict the scan to added lines in paths that can host a
  real call site (exclude `.claude/**`, `*.md`, and test files, or intersect
  with the same `APP_RE`/`RULES_RE` path set `dispatch-security-surface`
  already computes); (b) drop or tighten the generic tokens (`query(`,
  `collection(`, `fetch(`) — e.g. require a Firestore/HTTP receiver context
  (`\b(db|firestore)\s*,`), a `firebase/firestore` import, or word-boundary
  anchoring like `(^|[^A-Za-z.])collection\(`; (c) skip added lines that are
  comment-only (`^\+\s*(//|#|\*)`). Add PR #3031's own branch diff as a
  false-positive regression vector in `test-dispatch-api-call-site.sh` so the
  over-fire stays pinned once fixed.
