# Per-finding schema, edge cases, and notes

Referenced from the body's "Per-finding schema", "Edge cases", and "Notes"
pointers. Reference material — the finding schema, edge-case handling, and the
background rationale (model split, probe-wave throttle) — that the orchestrator
does not need in-context up front.

## Per-finding schema

Every finding — emitted by the Workflow's finders and inline scans, and carried
through to the unified set — has these fields:

- **Location** — `path:line`.
- **Description** — what the issue is and why it is a risk.
- **Source** — which review produced it (`code-review`, `review`,
  `input-validation`, `secrets`, `red-team`, `security-review`, `auth`,
  `data-exposure`, `firebase`, `codeql`, `npm`). Dedup in the Workflow may record
  several sources on one finding.
- **OWASP** — the OWASP Top 10 (2021) category (e.g. `A01:2021 Broken Access
  Control`, `A03:2021 Injection`). Security findings only; empty for
  code-review findings.
- **STRIDE** — one of Spoofing, Tampering, Repudiation, Information Disclosure,
  Denial of Service, Elevation of Privilege. Security findings only.
- **Confidence** — `high`, `medium`, or `low`.
- **Recommended fix** — the concrete change that resolves the finding.
- **Disposition** — the unified bucket from the **Disposition table**, set by the
  Workflow's classify step.

## Edge cases

- **Empty, docs-only, or test-only diff** — `surface` is `empty`, `docs`, or
  `tests`; the Workflow launches no security finders and no security agents. The
  code-review agent still runs. The skill still applies
  `dispatch:reviewed` and writes the marker.
- **A finder finds nothing** — record that source as clean; it contributes no
  findings to the Workflow.
- **A finder agent fails** — the Workflow retries once. If it fails again, partial
  coverage is noted in `result.dispositions` and surfaced in the Step 6 PR
  comment.
- **`npm audit` sandbox or network failure** — the dependency audit runs inline;
  retry its `npm audit` with `dangerouslyDisableSandbox: true`. If it still fails,
  report the dependency audit as "could not run" rather than silently dropping
  that domain.
- **CodeQL fetch failure** — the CodeQL fetch runs inline; retry the `gh api`
  fetch once with `dangerouslyDisableSandbox: true`. If it still fails, report the
  CodeQL scan as "could not run" rather than dropping it silently. An empty alert
  array is not a failure — it means no open alerts.

## Notes

This is the workflow's terminal actionable phase: applying `dispatch:reviewed`
(Step 7) is the terminal action and writing the phase-completed marker is the
dispatch chain's hand-off cue. The skill never readies the PR — the router's
`dispatch-reconcile-ready` reconciles readiness on every tick, promoting the PR
once CI is passing and `mergeable == MERGEABLE` (no longer a one-shot readying
action here). The dispatch workflow has no human checkpoint before a PR
goes ready — the single PR-comment summary is the audit trail. This is an
intentional trade-off for an autonomous background-job run.

The skill is idempotent: a re-invocation with `dispatch:reviewed` already on the
PR skips Steps 1–6 and runs Step 7, which flushes any unpushed commits, skips the
phase-log write and outcome-envelope emit, and writes the phase-completed marker
(the Workflow is not re-run on re-entry, so the deviation criterion is treated as
not met). Readiness is the router's projection, reconciled on later ticks — not
something re-entry asserts.

**Model split (#1172, #2872, tactic-review-phase-trust-builtin-review).** The
dispatch chain runs this `review` phase orchestrator on **Sonnet** (via
`dispatch-phase-model`, which maps `review → sonnet`) — always; there is no
learned policy that can promote the orchestrator to Opus. The model tiering is
owned by the Workflow's per-`agent()` `model:` settings, and Opus is reserved
for the genuinely complex, generative subtasks: **finder agents run on Opus**
(`model: opus`) — the always-on `code-review` finder now runs `/code-review max
--fix` and applies its own working-tree edits directly (no longer
detection-only — this is the tactic-review-phase-trust-builtin-review reversal
of the prior #1172 doctrine), the `/security-review` pass stays findings-only
(no `--fix` flag), and the surface-gated security/cost domain lenses run
detection-only as before, since finding real bugs and vulnerabilities in the
diff is the core reasoning of the phase. **Fix-authoring agents run on Opus**
(`model: opus`), writing all working-tree changes: this now includes both the
shared Lane-B fix fan-out over classified/verified findings AND the new
**residue phase** subagent (also Opus), which additionally applies
resolve-dispositioned fixes for Lane-A's (code-review's and security-review's)
un-auto-fixed residue. The cheaper mechanical stages — dedup, classify, and the
adversarial verify skeptics — run on **Sonnet**, and now scope only to Lane-B
findings. The orchestrator (this skill) authors no product code.

**Probe-wave throttle short-circuit (#1857).** On a `code` surface the Workflow
splits the finder fan-out into two waves instead of one barrier. Wave 1 launches
only the single always-on `code-review` quality finder — real review work that
runs on every surface — and doubles it as a throttle probe. If it returns `null`,
the Workflow skips the security finder wave entirely rather than waste those
launches on a throttled model, and sets `result.coverage_incomplete = true` with a
human `result.coverage_note` (surfaced in the Step 6 partial-coverage line). The
`agent()` primitive already retries internally, so a `null` result is a repeated
failure after retries — a genuine outage signal, not a one-off flake. This
deliberately accepts the reduced throttle-probe robustness of a single finder
(versus the prior two): the internal retry means `null` already means "failed
after retries". Otherwise wave 2 launches the surface-gated security finders. On
`empty`/`docs`/`tests` surfaces there are no security finders, so this degenerates
to a single wave (no change). **Marker/label behavior is intentionally unchanged:**
a throttled run
still applies `dispatch:reviewed` and writes the marker — this matches today's
behavior when all finders return `null`, producing a degraded quality-only review.
This is a launch-efficiency change only; genuine worker *death* on a transient
rate-limit (and its backed-off resume) remains #1733's responsibility via the Stop
hook, not this gate. `coverage_incomplete` is independent of the `deviation`
criterion.
