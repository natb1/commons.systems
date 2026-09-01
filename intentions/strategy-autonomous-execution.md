---
id: strategy-autonomous-execution
kind: strategy
statement: Run tactical execution through an owned autonomous dispatch chain
owner: human
status: codified
parent: strategy-owned-orchestration
rationale: >-
  The dispatch workflow is a project in its own right and carries its intentions
  here like any other. The autonomous chain — issue to plan to implement to
  review to QA — converts tactical execution into strategic attention: intent
  enters as issues, the chain does the tactical work, and the human engages at
  escalation points rather than in every step. The office-hours app is its
  observability surface: backlog runway, capacity band, escalations, and the
  intention tree itself.


  The whole chain is skills and scripts in the repo, forkable and locally run —
  no platform runtime, per its parent strategy-owned-orchestration. That makes
  it the artifact most distinctive for practitioner distribution (a layered
  claim — the graph is the product, the harness its reference consumer;
  canonical home strategy-data-structure-first): dual-tier in the
  strategy-progressive-validation sense, the author's daily development tool and
  the thing a practitioner would most plausibly fork.


  That hand-off only holds if the chain runs unattended: the daemon must keep
  ticking while the human is away — logged out, no interactive session — which
  is what makes "engage only at escalation points" real rather than "engage only
  while a terminal happens to be open".
reading: null
serves: []
recovers: []
clarifications:
  - question: What makes unattended execution safe at the harness layer?
    answer: "A composite invariant spanning two config systems that no single file
      states: (a) Bash runs sandboxed by default with the write-allowlist
      confined to the git substrate (.bare, worktrees) while denyWithinAllow
      makes agent-behavior config — .claude/skills/, hooks, settings.json, .git
      — read-only even to an approved session (.claude/settings.json); (b) the
      PreToolUse hook auto-approves any script under .claude/skills/*/scripts/
      by path convention (.claude/hooks/approve-workflow-commands.sh), which is
      safe only because of (a): a session that could write that tree could mint
      its own approvals. Neither half is safe without the other; changing either
      requires re-checking the pair. Recorded 2026-07-07 interview. AMENDED
      2026-09-01 (stale mechanism naming): the write-allowlist entry is `.git`
      since the 2026-07-21 physical de-baring, not \".bare, worktrees\"; and the
      read-only denyWithinAllow carve-outs are a Claude Code built-in
      config-protection layer, not entries this repo's settings.json carries.
      The pairing invariant - sandbox allowlist and approval hook, neither safe
      without the other - is unchanged. (decision: ratified - provenance-derived
      2026-09-01: recorded from author interview in the pre-stamp era; see the
      worktree-doctrine stamping-pass clarification on
      strategy-graph-native-dispatch, 2026-09-01.)"
  - question: Why do the dispatch lifecycle hooks swallow errors (trap-all, exit 0)
      when the code-style rule says clear errors over defensive fallbacks?
    answer: "A deliberate, reasoned inversion of the repo's own default: a broken
      hook must never wedge every session, block prompt submission, or halt
      session start, so lifecycle hooks fail open to passthrough with
      degradation recorded via stderr plus durable label/sidecar state. The one
      exception is worktree-create, which is allowed to fail (with
      registered-worktree rollback). The approval hook fails open only to a
      permission prompt, never to allow. Recorded 2026-07-07 interview.
      (decision: ratified - provenance-derived 2026-09-01: recorded from author
      interview in the pre-stamp era; see the worktree-doctrine stamping-pass
      clarification on strategy-graph-native-dispatch, 2026-09-01.)"
  - question: What keeps the chain from suppressing its own failure signals?
    answer: "Test integrity (.claude/rules/test-integrity.md): a failing test is
      never weakened, skipped, or deleted by an autonomous session — fix the
      code or escalate to office-hours; there is no self-serve escape hatch.
      This is what keeps CI signal trustworthy when most merges see no human
      review — a load-bearing condition of the chain, not a style preference.
      Human override-merge skips only pre-merge review, never QA. Recorded
      2026-07-07 interview."
  - question: How do secrets reach the chain?
    answer: "Secrets never live in the repo or Claude-readable config: they resolve
      at runtime from the GPG-encrypted pass store, and the gpg-agent cache is
      warmed only interactively by the human — auto-warming from within a
      session is deliberately out of scope. Every secret-needing workflow (e.g.
      budget parse jobs) is therefore structurally semi-autonomous. It looks
      like a missing feature; it is a security posture, recorded so a future
      session does not fix it. Recorded 2026-07-07 interview."
  - question: Are PR preview deploys part of the autonomous chain?
    answer: "No — preview capability is retained, but author-requested only. The
      automatic preview-and-smoke job (.github/workflows/pr-checks.yml: per-app
      Firebase preview channels + smoke + bot comment on every PR, with
      merge-time cleanup in prod-deploy.yml) is to be removed from the dispatch
      workflow; a dedicated skill performs on-demand preview deploys when the
      author explicitly asks — for example while reproducing an
      office-hours-parked QA finding. Every-PR previews spend deploy minutes,
      hosting-channel quota, and credential exposure on artifacts the autonomous
      path never looks at. Change drafted at tactic-preview-deploy-on-demand.
      Recorded 2026-07-07 interview."
  - question: How is CI verification kept fast enough for the autonomous chain?
    answer: "Change-scoping is a standing requirement, not an optimization to be
      traded away: PR verification and prod deploys run only against apps a diff
      actually reaches (get-changed-apps.sh change detection; prod deploys diff
      from the last-prod-deploy tag so a failed deploy retries from the last
      successful marker, workflow_dispatch as the deploy-everything override,
      paths-ignore skipping non-app paths). Scoping correctness is load-bearing
      — an incomplete dirty map ships untested code — which is what
      tactic-ci-change-detection-transitive fixes; the answer to a detection gap
      is completing the map, never abandoning scoping for test-everything.
      Recorded 2026-07-07 interview."
  - question: Does the backlog-drain success signal prove the autonomous chain is
      running unattended?
    answer: No. An interactive `claude agents` invocation spawns its own transient
      daemon (a child of that process, tagged --origin transient) that keeps
      background jobs running; on 2026-07-08 this masked a dead managed
      dispatch-claude-daemon.service for roughly a day. So durability needs a
      distinct liveness observable on the managed lingering daemon, read while
      no interactive session is substituting for it. Recorded 2026-07-08
      interview.
  - question: Is running a managed daemon about pinning the chain to the latest
      claude-code binary?
    answer: No — the transient daemon already re-execs the current claude binary on
      each launch, so it is never stale; it is the managed systemd daemon that
      must be restarted onto the new store path after an upgrade (tracked
      separately by tactic-mainqa-dispatch-daemon-restart). The reason to run a
      managed lingering daemon is unattended durability across logout, a facet
      distinct from version-pinning. Recorded 2026-07-08 interview.
  - question: What must "keeps ticking while I'm away" survive?
    answer: Logout and the absence of any interactive session — persistence via
      systemd linger (users.users.n8.linger = true), independent of an
      interactive claude agents process whose transient daemon dies with it.
      Surviving host reboot and machine sleep / network drop are explicitly out
      of scope for this requirement. Recorded 2026-07-08 interview.
  - question: What host-environment invariant must the dispatch host's primary
      checkout maintain?
    answer: "The primary checkout at ~/natb1/commons.systems stays on the main
      branch — never a feature branch. Branch work happens in worktrees; the
      primary checkout is reserved for main. This is load-bearing for two
      unattended paths: (a) dispatch's main-sync — dispatch-select-tick's `git
      merge --ff-only origin/main` runs on the main worktree
      (.claude/rules/sandbox.md) and can only fast-forward a checkout that is on
      main; (b) the worktree-create hook resolves the project root from a
      worktree with main checked out, so a non-main primary checkout makes
      EnterWorktree/provisioning fail with 'no worktree with main checked out;
      cannot resolve the project root'. Enforcement is prevent-at-source — no
      dispatch/provisioning path may leave the primary checkout on a feature
      branch (e.g. a failed `git worktree add`+chained `cd` that drops later git
      ops into the primary checkout and switches it off main) — drafted at
      tactic-primary-checkout-main-guard. Recorded 2026-07-08 interview."
  - question: Does that invariant require the primary checkout to stay current with
      origin/main, or only to be on the main branch?
    answer: Only on the main branch. Staleness is expected and normal — the checkout
      is necessarily behind origin/main between syncs; a separate freshness
      requirement in the graph ensures a sync runs before executing tasks that
      assume fresh main. Folding currency into this invariant would wrongly
      treat an ordinary stale checkout as a violation. Worktrees are exempt —
      they legitimately check out feature branches; the invariant is scoped to
      the primary checkout alone. Recorded 2026-07-08 interview.
  - question: How is the backlog/escalation reading taken now that the GitHub issue
      queue is retired?
    answer: "GitHub issues were disabled on the repo once the gh dispatch queue
      drained (observed 2026-07-11): the backlog is now the graph's open tactics
      and escalations are office_hours parks on nodes. The office-hours
      dashboard's gh-fed queue-metrics panels
      (functions/src/dispatch-queue-metrics-core.ts producer) no longer measure
      the live queue; graph-derived velocity/backlog series are in-flight at
      tactic-attention-surface-velocity-pace (strategy-attention-surface owns
      the app surface). Until those land, a signal reading counts backlog and
      escalations directly from the graph (open phase-set tactics; nodes with
      office_hours set) alongside the managed-daemon liveness check. Recorded
      2026-07-11 /align-tactics round."
  - question: When a CI guard fails because guarded content legitimately moved, is
      restoring the moved literal an acceptable fix?
    answer: "(Recorded 2026-07-21 interview.) No -- that is the
      expedient-over-correct pattern, the dual of test-weakening: the guard
      passes while ceasing to track the mechanism it exists to verify. Live
      case: PR #2927's skill-thinning moved the 'model: opus' literal out of
      review-fix/SKILL.md into references/, and the fix-checks worker's first
      fix restored the literal to satisfy the prose grep; the correct fix
      (adopted after author challenge) re-pointed the guard at the runtime
      enforcement in .claude/workflows/review-fix.js. Doctrine: a fix worker
      facing a failed proxy guard first asks what invariant the guard protects
      and where that invariant is really enforced. Autonomous re-pointing is
      permitted only with the safeguard pair: (a) the enforcing mechanism is
      identified, and (b) the re-pointed guard is demonstrated load-bearing --
      mutate the mechanism, watch the guard fail. Short of that confidence,
      restore the guarded content but record the proxy-restore explicitly in the
      PR comment/accumulator so a human sees it; silent restoration is the
      failure mode, not restoration itself. Steelman resolved by divergence: the
      rival minimal-intervention doctrine (autonomous workers never redesign
      guards, always restore-and-escalate) was declined because every legitimate
      content move would become a human interrupt in a chain whose point is
      unattended drain; the demonstration safeguard carries the rival's safety
      concern instead. Scope: this governs proxy guards -- content greps and
      similar surface checks standing in for a mechanism enforced elsewhere;
      ordinary failing tests stay wholly under the never-weaken doctrine. Adds a
      control on delegation-anthropic-claude's self-audit loop without unwinding
      it -- no recovers edge, mirroring strategy-verified-requirements' recorded
      reasoning. Enforcement home: .claude/rules/test-integrity.md (drafted at
      tactic-test-integrity-proxy-guard-rule)."
tooling_goals:
  - kind: sensor
    statement: a managed dispatch daemon liveness sensor that reports whether the
      lingering dispatch-claude-daemon.service is up and ticking unattended,
      distinguishing it from a transient (--origin transient) daemon spawned by
      an interactive claude agents session
success_signal:
  observable: attention economics — the managed lingering dispatch daemon drains
    the backlog unattended (across logout, with no interactive claude agents
    session substituting a transient daemon) while human escalations stay
    bounded
  sensor: the office-hours dashboard (backlog runway, capacity band, escalation
    queue) plus a managed-daemon liveness check that distinguishes the lingering
    user unit from a transient interactive daemon
  threshold: the managed daemon runs continuously across logout and backlog runway
    stays inside the capacity band without escalation volume exceeding
    office-hours capacity
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  conditions:
    - frontier-agent access remains economical at individual scale
    - escalation volume stays within office-hours capacity
    - "the sandbox/approval-boundary coupling holds: agent-behavior config stays
      read-only to sessions while skill scripts are auto-approved by path"
    - "the chain cannot suppress its own failure signals: test integrity is
      enforced — fix or escalate, never weaken — and a failing check is fixed at
      the level of the invariant it protects, never silently satisfied by
      restoring a brittle proxy"
    - the dispatch daemon runs as a lingering systemd user service
      (users.users.n8.linger = true), persisting across logout — not a transient
      daemon tied to an interactive claude agents session
    - the dispatch host's primary checkout (~/natb1/commons.systems) stays on
      the main branch — never a feature branch — so dispatch's ff-only main-sync
      and the worktree-create hook's project-root resolution both hold (currency
      not required; a separate freshness requirement governs pre-task sync)
---
# Run tactical execution through an owned autonomous dispatch chain
