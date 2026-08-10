---
id: strategy-distribute-workflow
kind: strategy
statement: Make the dispatch workflow forkable in practice — a practitioner
  entry point, not just an open repo
owner: human
status: refining
parent: strategy-promote-progressive-detachment
rationale: >-
  Two nodes agree the workflow is the most distinctive artifact for practitioner
  distribution (layered claim canonically on strategy-data-structure-first: the
  graph is the product, the harness its reference consumer and most distinctive
  artifact), and strategy-owned-orchestration's built-to-be-left claim is
  validated only by forks and derivatives — yet promote's children contain no
  strategy for anyone actually encountering or adopting the chain. This strategy
  owns that: a standalone practitioner-facing entry point (the chain as a thing
  forkable without adopting the whole repo), architecture writeups on the owned
  blog, and strategy-open-source-as-gift's shallow-fork documentation obligation
  applied here specifically. It is the prerequisite for the tier-3 signals half
  the graph's thresholds wait on.

  Paced by strategy-progressive-validation. The tier-1 half of dual-tier work —
  the harness as the author's daily tool, and the graph/router design itself —
  continues ungated. But the practitioner-facing invitation surface
  (plugin/marketplace/npm publication, citation-list submissions, support
  commitments, channel campaigns) is gated on an explicit tier-3 entry
  declaration recorded on strategy-progressive-validation. As of 2026-07-06 that
  declaration has not been made: the design is still in flux and the author has
  not committed practitioner-support bandwidth. Narrowed 2026-08-04: passive
  articulation surfaces on owned properties are readiness-posture work, ungated
  — see the articulation-vs-commitment clarification.
reading: null
gap: null
serves:
  - virtue-progressive-detachment
  - virtue-respect-for-persons
recovers: []
clarifications:
  - question: Does the earlier reading that this work is not premature still stand?
    answer: "Partially reversed 2026-07-06. Issue #2452's re-scope read this
      strategy as rejecting a blanket pacing block. The author has now recorded
      a finer line: artifact work stays ungated (the harness is tier-1 dual-use,
      and its design being in flux is itself a reason to keep building), while
      everything that invites practitioners in or promises them support is gated
      on the tier-3 entry declaration on strategy-progressive-validation —
      because publication of the intention graph and dispatch harness for
      external practitioner consumption is a decision the author has explicitly
      not yet made. Recorded 2026-07-06 interview."
  - question: Is tactic-workflow-entry-point gated by the tier-3 declaration?
    answer: Split. Its architecture-writeup half — publishing how the workflow is
      built, on the owned blog — is ungated voice under
      strategy-exercise-voice/strategy-recover-publishing and can ship any time.
      Its standing-practitioner-entry-point half is an invitation and waits for
      the tier-3 declaration, with the support boundary
      (tactic-practitioner-support-boundary) written first. Recorded 2026-07-06
      interview.
  - question: Where did the pre-graph practitioner issues land when they were migrated?
    answer: "gh #440 (plugin packaging) -> tactic-practitioner-plugin-distribution;
      #442 + #512 (shallow-fork docs and package extraction) ->
      tactic-shallow-fork-docs; #2068 (citation-graph inbound links) ->
      tactic-citation-graph-listing; #2452 (support boundary) ->
      tactic-practitioner-support-boundary; #538's practitioner-channel half ->
      tactic-practitioner-channels (its POSSE/webmention runbook half already
      lives ungated in tactic-indieweb-audience under strategy-own-audience);
      #475 was already migrated as tactic-blog-enshittification-response; #515
      migrated ungated to tactic-nix-clean-system-drill under
      strategy-exercise-recovery-paths. All are draft tactics (no phase):
      structurally unselectable by the router until the author declares
      readiness and runs /align-tactics. Recorded 2026-07-06 interview."
  - question: What keeps the CI node toolchain and the nix dev shell from drifting apart?
    answer: "Today, nothing — .node-version pins 22.22.3 for CI (chosen to dodge the
      undici regression that broke Firebase OAuth on 22.23.0) while the nix dev
      shell floats nodejs_22 on nixos-unstable, and the drift has already
      produced a real cost: the Playwright browser-version mismatch that blocks
      local acceptance runs and forces CI to be the only authority. The
      requirement recorded here: one source of truth for the node toolchain —
      the dev shell derives from (or asserts equality with) .node-version so CI
      and local verification cannot silently diverge; a forkable-in-practice
      workflow includes a dev environment that reproduces what CI runs. Fix
      drafted at tactic-node-toolchain-single-source. Recorded 2026-07-07
      interview."
  - question: How did the first /align-tactics round dispose of the migrated
      practitioner drafts, given tier 3 is undeclared?
    answer: "The 2026-07-11 round decomposed only the ungated minimum. Instrument
      (reading is null): tactic-fork-derivative-sensor extends the office-hours
      snapshot's GitHub signals with fork enumeration and renders a
      fork-and-derivative panel, making this strategy's sensor runnable — it is
      the round's validates-terminal. Tier-entry-test prerequisites:
      tactic-practitioner-support-boundary is planned (phase: implement) behind
      a born-parked copy-approval gate tactic-support-boundary-approval, and
      tactic-practitioner-channels is born-parked as author judgment. Ungated
      artifact work: tactic-node-toolchain-single-source is planned.
      tactic-workflow-entry-point is split per the 2026-07-06 clarification: its
      architecture-writeup half is minted born-parked as
      tactic-workflow-architecture-writeup (blog voice is the author's;
      frame/outline first), and the node itself is rewritten to the
      entry-point-only half, still a draft. The tier-3 declaration is now a
      first-class born-parked gate, tactic-tier3-entry-declaration (serving
      strategy-progressive-validation, where the declaration is recorded),
      blocked_by the two prerequisites. The four invitation-gated drafts —
      tactic-practitioner-plugin-distribution, tactic-citation-graph-listing,
      tactic-shallow-fork-docs, and the rewritten tactic-workflow-entry-point —
      deliberately remain drafts per this strategy's recorded disposition (the
      migration clarification above), now carrying explicit blocked_by edges to
      the gate, rather than being finalized against a design still in flux.
      Recorded 2026-07-11 /align-tactics round."
  - question: How is the CI/nix Playwright chromium browser-version drift kept from
      recurring, and how does it relate to the node-toolchain single-source
      axis?
    answer: "(Recorded 2026-07-22 interview.) The Playwright browser mismatch is a
      second, independent toolchain-drift axis, distinct from and orthogonal to
      the node-version axis the 2026-07-07 clarification single-sources. It is
      the npm-pinned @playwright/test chromium revision drifting from the
      chromium that the nix-provided pkgs.playwright-driver ships, driven by an
      automated nixpkgs bump moving playwright-driver forward — not by
      node-version drift (the 2026-07-07 clarification's attribution of the
      mismatch to node drift was imprecise; the node axis is
      tactic-node-toolchain-single-source, this browser axis is its own tactic).
      It recurred 2026-07-21: flake bump a12b1779 took playwright-driver to
      1.61.1 (chromium 1228) while @playwright/test stayed 1.60.0 (chromium
      1223); the npm pin was hand-bumped to 1.61.1 in PR #2930.
      check-playwright-version-sync.sh detects the drift but cannot prevent it —
      every nixpkgs bump re-opens the gap. Greenfield (endorsed 2026-07-22
      interview): nix is authoritative — nixpkgs decides which chromium exists —
      and the npm pin follows by construction; the invariant is @playwright/test
      == pkgs.playwright-driver.version (verified 2026-07-22: nix eval reports
      1.61.1, matching the npm pin). Couple them at the mover: wrap `nix flake
      update` so it reads playwright-driver.version, rewrites the
      @playwright/test pin in root and audio package.json, runs npm install, and
      stages all together in one commit, so a flake bump can never land drift;
      check-playwright-version-sync.sh stays as the backstop. Fix drafted at
      tactic-playwright-nix-browser-single-source. Rejected alternatives:
      overlay-pin playwright-driver in nix (inverts the source of truth to npm
      but adds an overlay you hand-bump anyway and fights nixpkgs updates); drop
      nix browsers for npx playwright install (loses nix's offline/reproducible
      guarantee and reintroduces a CI network download)."
  - question: What keeps an externally-published build artifact from going stale in
      the pin — the third toolchain-pin axis after node-version and Playwright
      chromium?
    answer: >-
      (Recorded 2026-07-23 interview.) A third pin axis, structurally distinct
      from both prior ones: not two internal pins drifting from each other, but
      a single EXTERNAL reference whose target the publisher can overwrite in
      place. nix/home/wezterm-windows.nix:30 content-pins
      WezTerm-windows-nightly.zip — a rolling upstream URL — by sha256 in
      nix/home/wezterm-pin.nix.


      Diagnosis (endorsed 2026-07-23): pkgs.fetchurl's sha256 pins BYTE
      identity, but the requirement is BUILD identity — the Windows GUI and the
      WSL wezterm-mux-server must be the same wezterm build or the mux PDU
      handshake fails (nix/home/wezterm-windows.nix header). The mechanism
      therefore pins a STRONGER property than the requirement needs, and
      upstream does not maintain that stronger property: it republishes the same
      build with different bytes. Verified 2026-07-23: the zip published 04:50Z
      still unpacks to WezTerm-windows-20260716-195552-76b606ec — the exact
      build the pin names — but hashes 6d3bd51d..., not the 42256640... that PR
      2921 pinned on 2026-07-22. Two repackages of one build in eight days; the
      2026-07-22 fix had a lifetime under 24 hours, and nixos-build went red
      again with no commit involved. Every such repackage is a FALSE failure:
      the property the project actually cares about is unchanged.


      This retires the graph's prior treatment of the refresh as a routine
      mechanical chore (tactic-wezterm-windows-install-lock-resilient's
      2026-07-11 rationale bundled it as a one-off). No refresh cadence
      reachable through the PR cycle can keep a byte pin valid against an
      artifact that churns on upstream's schedule.


      Greenfield (endorsed 2026-07-23): own the artifact you depend on.
      nix/home/sync-wezterm.sh fetches the upstream zip once, ASSERTS it unpacks
      to WezTerm-windows-${version} (the real invariant — the script already
      derives version from that directory name), republishes those exact bytes
      as a release asset the project owns, and fetchurl pins the mirror. The
      mirror is immutable by policy, so the hash is stable forever and a forker
      gets identical bytes. Fix drafted at tactic-wezterm-owned-asset-mirror.


      Rejected alternatives: cross-build the Windows GUI from source at rev —
      the IDEAL greenfield per .claude/rules/design-proposals.md, invariant true
      by construction, and the exact shape the 2026-07-22 Playwright
      clarification endorsed (one side authoritative, the other follows by
      construction) — named as the target but not this round's plan, because
      cross-compiling WezTerm's Rust/DirectWrite/Direct3D stack under nix is
      large and unscoped. Drop the byte hash and assert build identity at
      activation time — encodes the real invariant and can never go stale, but
      leaves nix purity: no store reproducibility, and a forker may get
      different bytes than the author. Take the zip out of CI's closure alone
      (tactic-nix-instance-flake-extraction, phase implement) — necessary and
      landing regardless, since a shared repo's CI has no business building one
      operator's personal Windows terminal, but it fixes the false CI red only
      and leaves home-manager switch broken on the author's own machine at every
      repackage.


      Scope of the invariant, verified 2026-07-23: this is the ONLY
      mutable-reference pin in the tree. nix/home/claude-code.nix:43 pins an npm
      registry tarball at a fixed version (immutable by registry policy, which
      forbids republishing a version) and nix/home/wezterm-package.nix pins a
      git rev (content-addressed). The general requirement recorded here: a
      content-hash pin is sound only against a reference the publisher cannot
      overwrite — an immutable upstream id, a content-addressed rev, or a mirror
      the project owns. A forkable-in-practice workflow fails this test loudly:
      a forker cloning today cannot build, because the pinned hash no longer
      matches what upstream serves.
  - question: Does owning the WezTerm asset mirror deepen the GitHub delegation, and
      should this strategy carry a recovers edge for it?
    answer: "(Recorded 2026-07-23 interview.) No recovers edge. Hosting the mirror
      as a release asset on the project's own GitHub repo adds one artifact to
      delegation-github, whose divergence level is low and whose recovery path
      was drilled 2026-07-16 (hours-to-about-a-day, dominated by CI porting; see
      ops/recovery-drills/github-drill-report.md). The added capture is
      negligible, and the mirror's own recovery cost is near zero: the artifact
      is a frozen cache of a public upstream build, not owned data, so losing it
      is a deliberate-upgrade event (re-mirror, re-pin to fresh bytes), never
      data loss — which is why this does not draw a strategy-durable-owned-data
      obligation either. The mirror host is deliberately NOT fixed to GitHub by
      this record: any store that will not overwrite a published object
      satisfies the invariant, so a later move off GitHub releases needs no
      amendment here."
  - question: Does the tier-3 gate block the README practitioner funnel?
    answer: "Narrowed 2026-08-04 interview: the tier-3 invitation gate distinguishes
      articulation from commitment. Passive articulation surfaces on owned
      properties — the README’s practitioner abstract and runbook, the landing
      about page — are readiness-posture work, valid at tier 1 (the author must
      be able to socialize the value proposition even if only to support tier-1
      development) and ship ungated, including describing the mechanics of
      consuming this repo as a Claude plugin. What remains gated on the tier-3
      declaration: support commitments, marketplace/directory submissions,
      channel campaigns, and any active solicitation of practitioners."
  - question: What is the practitioner runbook, and how does it relate to the gated
      entry-point tactic?
    answer: "(Recorded 2026-08-04 interview.) The README’s runbook is the three-step
      funnel: install this repo’s skills as a Claude plugin → run /mount
      (dialectic onboarding + mechanical mount of this graph as a delegatee) →
      run /align <directive> on the practitioner’s own graph. Under the
      articulation narrowing the runbook ships ungated — it is description on an
      owned surface. It partially delivers the articulation half of
      tactic-workflow-entry-point; that tactic’s gated remainder narrows to
      entry-point features implying support or active solicitation (standing
      support surfaces, submissions, campaigns), which still wait on the tier-3
      declaration with the support boundary written first."
  - question: What is the /mount skill?
    answer: "(Recorded 2026-08-04 interview.) A general mount skill, lanes selected
      by context, folding in every recorded mount use case rather than being
      onboarding-only: (a) onboarding lane, triggered by the absence of an
      intentions/ graph in the invoking repo — periagoge dialectic (the
      practitioner articulates their own model of goals/alignment before
      Claude’s account appears; load-bearing concepts taught Socratically), then
      the mechanical mount: scaffold the practitioner’s own graph (their virtue
      roots, first nodes), record this repo’s graph as a mounted delegatee (a
      delegation record with divergence/irreversibility axes, by-reference shape
      per strategy-graph-mounts), enroll everything taken on trust as
      born-parked review items in the practitioner’s own curriculum, and
      converge on a directive handed to /align; (b) tradition lane — deferring
      to a tradition during /align or curriculum review mounts the tradition’s
      graph; (c) delegation lane — delegating to a vendor mounts the vendor’s
      virtues as constraints. /mount fully supersedes /align’s no-prompt
      onboarding funnel: no-prompt /align delegates to /mount. Full design at
      tactic-mount-skill (serves this strategy and strategy-graph-mounts, the
      artifact’s two owners)."
tooling_goals: []
success_signal:
  observable: practitioners encountering and forking the workflow — entry-point
    visits, forks, derivative projects, fork reports
  sensor: fork and derivative review at office-hours
  threshold: the workflow has a standing practitioner entry point and at least one
    external fork or derivative exists
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  conditions:
    - a practitioner audience for autonomy tooling exists and is reachable
      without engagement platforms
    - tier-3 (practitioner) entry is declared on strategy-progressive-validation
      before any commitment ships — support commitments, marketplace/directory
      submissions, channel campaigns, active solicitation; passive articulation
      on owned surfaces (README abstract and runbook, landing about) plus
      preparation and artifact work are not gated (narrowed 2026-08-04)
---
# Make the dispatch workflow forkable in practice — a practitioner entry point, not just an open repo
