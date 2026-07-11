---
id: tactic-recovery-drill-firebase
kind: tactic
statement: "Walk the Firebase recovery path: re-host one deployed app off
  Firebase and record the cost"
owner: ai
status: codified
parent: null
rationale: "The drill strategy-exercise-recovery-paths names for
  delegation-firebase, scaled per the strategy: actually re-host one app, record
  cost and friction, and flip the record's last_exercised from null to a real
  date."
reading: null
gap: null
serves:
  - strategy-exercise-recovery-paths
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-recovery-drill-firebase
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 4ee635b8acf77f2cb701ca3625baa5edf2209e23bf04d30e72650eb7b94f36fa
validates:
  - strategy-exercise-recovery-paths
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Walk the Firebase recovery path: re-host one deployed app off Firebase and record the cost

## Context

`delegation-firebase` records a low recovery cost ("the hosted tier is a
rebuildable projection of owned local data") but `last_exercised: null` —
the re-host has never been walked. The drill
`strategy-exercise-recovery-paths` names for it: actually re-host one app,
record cost and friction, flip `last_exercised`. Target: the **landing**
app — a static build (`landing/dist`) whose hosting contract lives in one
`firebase.json` block (`firebase.json:147-160`: public dir, an
`/api/webmention` function rewrite, an SPA catch-all rewrite) plus the
shared per-site headers block above it (`firebase.json:7-…`: CSP, COOP,
HSTS, X-Frame-Options, X-Content-Type-Options, and the
`/blogroll.opml` / `/feed.xml` content-type/CORS headers). Per the
strategy's 2026-07-11 clarification, the drill re-hosts and verifies a
real serving copy; the final DNS cutover (a Cloudflare zone change —
`delegation-identity-root` holds that leg) is documented, not executed.
Production stays on Firebase.

## Unit 1 — substitute host: translate the hosting contract

**Recommended model:** opus

Implement in a subagent (`model: opus`), working-tree edits only, passing
this unit's context and scope in the prompt.

Scope:

- `ops/recovery-drills/firebase/` (new): an nginx config
  (`nginx-landing.conf`) that reproduces the landing hosting block from
  `firebase.json` — serve `landing/dist`, the SPA catch-all rewrite,
  every header in the landing-site headers block (CSP string verbatim,
  COOP, HSTS, X-Frame-Options, X-Content-Type-Options), and the
  `/blogroll.opml` + `/feed.xml` header overrides. The one non-static
  surface, the `/api/webmention` function rewrite
  (`firebase.json:150-155`), cannot be re-hosted by a static server:
  represent it as an explicit `return 503` location with a comment, and
  record it in the report as the measured backend-recovery residue.
- A run script (`serve-landing.sh`) that starts nginx from nixpkgs
  (`nix run nixpkgs#nginx` or `nix shell nixpkgs#nginx`) against that
  config on a localhost port with a throwaway prefix dir — no root, no
  system install. Follow `.claude/rules/shell-json.md` in any committed
  `.sh`.
- A parity checklist generated from `firebase.json` (manual extraction is
  fine; a jq extraction script is better) enumerating every
  header/rewrite the landing site carries, so Unit 2 verifies against the
  contract rather than memory.
- Out of scope: any other app's hosting block; Firestore/functions
  re-hosting (landing's only backend surface is the webmention rewrite,
  recorded as residue); actually changing DNS.

## Unit 2 — serve and verify parity

**Recommended model:** sonnet

Dependencies: Unit 1.

Implement in a subagent (`model: sonnet`), working-tree edits only.

Scope:

- Build landing (`npm run build --prefix landing`; note: the prerender
  step spawns tsx servers — run un-sandboxed per the known
  landing-build-in-sandbox EPERM issue) and start the substitute server.
  Server + `curl` checks run with sandbox disabled
  (`.claude/rules/sandbox.md`, network-namespace isolation).
- A verify script (`verify-parity.sh`) that curls `/`, one deep SPA
  route, `/feed.xml`, `/blogroll.opml`, and a static asset, asserting:
  200s, the SPA catch-all serves `index.html`, and every checklist header
  matches the `firebase.json` value byte-for-byte. Fail loud on any
  mismatch — a partial re-host reported as success would corrupt the
  drill's whole point.
- Record wall-clock time and every friction point in
  `ops/recovery-drills/firebase-drill-report.md`: date, time spent,
  parity table, the webmention residue, and the documented-but-not-executed
  cutover step (Cloudflare DNS for the landing subdomain → substitute
  host; note that `*.commons.systems` TLS would move to the substitute —
  certbot or Cloudflare-proxied).

## Unit 3 — flip the record

**Recommended model:** sonnet

Dependencies: Unit 2.

Implement in a subagent (`model: sonnet`), working-tree edits only.

Scope: update `intentions/delegation-firebase.md` via
`packages/intentionsutil/scripts/write-node.ts`: set
`attributes.irreversibility.last_exercised` to the drill date and refresh
`attributes.irreversibility.recovery_cost` with the measured figure. Land
via `packages/intentionsutil/scripts/graph-commit delegation-firebase` —
node edits never ride the code PR.

## Reuse

- `firebase.json:147-160` (landing block) and the landing-site `headers`
  array as the single source of the contract being reproduced.
- `packages/intentionsutil/scripts/write-node.ts` + `graph-commit` for
  the record flip.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: run `serve-landing.sh` then `verify-parity.sh` (both
un-sandboxed) and confirm the parity table passes with the webmention 503
as the only recorded residue; confirm the drill report carries a real
measured time; confirm `delegation-firebase`'s `last_exercised` is a real
date on `origin/main` after the graph-commit.
