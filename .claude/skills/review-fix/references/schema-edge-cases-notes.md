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
  `tests`; the Workflow launches **no agent finders at all** (`agentFinderSet`
  returns `[]`). code-review is no longer an agent in the Workflow — it already
  ran as the Step 1b `claude -p` pre-stage, which is always-on regardless of
  surface, so its findings still reach the disposition set via the Sonnet
  `parse:code-review` structuring subagent. With no wave-2 finders there is
  nothing to probe for, so `coverage_incomplete` stays `false`. The skill still
  applies `dispatch:reviewed` and writes the marker.
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
(`model: opus`) — the `/security-review` pass stays findings-only (no `--fix`
flag), and the surface-gated security/cost domain lenses run detection-only as
before, since finding real bugs and vulnerabilities in the diff is the core
reasoning of the phase. The `code-review` quality pass is **not a Workflow agent
at all**: it runs OUTSIDE this model split, as the `claude -p '/code-review low
--fix'` pre-stage in SKILL.md Step 1b — its own nested session, with its own
model and context window, applying its own working-tree edits directly (the
tactic-review-phase-trust-builtin-review reversal of the prior #1172
detection-only doctrine, now invoked through the entry point that actually
runs). Effort is `low`, not `max`: `max` was measured at >39 min and ~$372 of
price proxy on a real diff without completing (see
`code-review-invocation.md` §1.2, §5.4, §7). **Fix-authoring agents run on
Opus** (`model: opus`), writing all working-tree changes: this includes both the
shared Lane-B fix fan-out over classified/verified findings AND the
**residue phase** subagent (also Opus), which additionally applies
resolve-dispositioned fixes for Lane-A's (code-review's and security-review's)
un-auto-fixed residue. The cheaper mechanical stages run on **Sonnet**: dedup,
classify, the adversarial verify skeptics (all Lane-B-scoped only), and the
`parse:code-review` structuring subagent — which reads the pre-stage's
free-form findings text plus its patch and emits the `LANE_A_SCHEMA`
`{ fixed, residue }` envelope. That last one is Sonnet for the same reason as
dedup/classify: it is mechanical text→JSON structuring, because the *reasoning*
was already done by the built-in. The orchestrator (this skill) authors no
product code.

**Probe-wave throttle short-circuit (#1857).** On a `code` surface the Workflow
splits the finder fan-out into two waves instead of one barrier. Wave 1 launches
only `security-review` — real review work, and the finder always present whenever
there are any agent finders at all — and doubles it as a throttle probe. If it
returns `null`, the Workflow skips wave 2 entirely rather than waste those
launches on a throttled model, and sets `result.coverage_incomplete = true` with a
human `result.coverage_note` (surfaced in the Step 6 partial-coverage line). The
`agent()` primitive already retries internally, so a `null` result is a repeated
failure after retries — a genuine outage signal, not a one-off flake. This
deliberately accepts the reduced throttle-probe robustness of a single finder
(versus the prior two): the internal retry means `null` already means "failed
after retries". Otherwise wave 2 launches the remaining surface-gated
security/domain lenses. On `empty`/`docs`/`tests` surfaces there are no agent
finders at all — both waves are empty, nothing is launched, and the dead-probe
gate is explicitly guarded on `probeFinders.length > 0` so it cannot fire
spuriously; `coverage_incomplete` stays `false`, because with no wave 2 there is
nothing to probe *for*. (`code-review` was the wave-1 probe before it moved to the
Step-1b pre-stage; it is not an agent finder anymore, so the probe re-pointed to
`security-review`.) **Marker/label behavior is intentionally unchanged:**
a throttled run
still applies `dispatch:reviewed` and writes the marker — this matches today's
behavior when all finders return `null`, producing a degraded quality-only review.
This is a launch-efficiency change only; genuine worker *death* on a transient
rate-limit (and its backed-off resume) remains #1733's responsibility via the Stop
hook, not this gate. `coverage_incomplete` is independent of the `deviation`
criterion.

**Unverified instrument — NOT the same path as the throttle short-circuit.** A
Lane-A finder (`code-review`, `security-review`) names a built-in instrument it
must actually invoke. Two independent checks run: the finder's own
`instrument: {name, invoked, failure_text}` receipt, and a separate agent's read
of the actual Claude session transcript record (via
`.claude/skills/dispatch-propagate/scripts/dispatch-verify-instrument-invocation`).
Either one failing discards that instrument's payload entirely — never merged
under the instrument's name, never dispositioned, never credited to
`fixes_applied` — records the reason in `result.instrument_failures`, sets
`coverage_incomplete` with a human `coverage_note`, **and sets `deviation`**, so
Step 7 escalates to office-hours via `dispatch-mark-deviation`. The transcript
verdict wins any disagreement with the receipt: a receipt claiming `invoked:true`
against a transcript that shows no successful invocation is exactly the
fabrication signature the check exists to catch, and a verifier agent that died
fails the gate too (fail-closed). That verifier agent sees counts and booleans
only: the verify script's verbatim transcript rejection text is
attacker-influenceable (it is transcript content — the error body of this
instrument's own failed tool call, quoted verbatim), so each command it runs
projects the verdict down to
`{instrument, verified, invocations, succeeded, rejections}` with `jq` and drops
stderr before the output reaches the agent, and the schema has no free-text field.
The "why not verified" phrase in `coverage_note` is rebuilt from those integers by
the orchestrator, never transcribed by the agent.

Do not conflate this with the throttle path above. They look superficially alike
— both set `coverage_incomplete` — but they end differently and deliberately so:

| | throttle short-circuit | unverified instrument |
|---|---|---|
| trigger | finder returned `null` (died after retries) | receipt or transcript check failed |
| payload | there was none | discarded |
| `deviation` | unchanged (usually false) | **true** |
| terminal action | applies `dispatch:reviewed`, writes the marker | escalates to office-hours |

The reason for the split: a `null` finder contributed no payload, so nothing is
attributed to the instrument and there is nothing to guard — turning that into a
lane failure would park the node on every rate-limit. An unverified instrument,
by contrast, means a review was reported under a name that did not run. That is
not a degraded review, it is a false one, and it escalates unconditionally
(never severity-scaled — the failure is that the review did not happen, not that
a finding went unfixed).
