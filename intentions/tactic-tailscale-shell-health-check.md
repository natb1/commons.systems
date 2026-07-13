---
id: tactic-tailscale-shell-health-check
kind: tactic
statement: "Interactive-shell Tailscale auth check: an interactive zsh session
  on each machine prints a named banner with the ready login URL when tailscale
  BackendState != Running"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-13 by /align-tactics round 1 (split from the
  retained draft of the same id). Detection half of the strategy and the
  signal's sensor: a fast local check (tailscale status --json over the local
  socket, milliseconds) at interactive zsh init only — non-interactive/dispatch
  shells excluded per the strategy clarification. On BackendState != Running it
  names the diagnosis and includes the auth URL (tailscale status prints 'Log in
  at: <url>') so resolution is one click, not a debugging session. The
  router-host office-hours feed originally bundled into this draft is split out
  to born-parked tactic-tailscale-office-hours-auth-signal (design-entangled)."
reading: null
gap: null
serves:
  - strategy-tailscale-auth-visibility
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates:
  - strategy-tailscale-auth-visibility
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Interactive-shell Tailscale auth check: named banner + login URL when BackendState != Running

## Context

Motivated by the 2026-07-07 wezterm incident: tailscale on the dispatch-router
host was logged out (BackendState NeedsLogin, empty Self.DNSName) and the only
symptom surfaced two layers and one OS away — a wezterm GUI window closing with
a cryptic log line. Nothing named the diagnosis, so resolution cost a forensic
debugging session.

This tactic adds the **detection half** of `strategy-tailscale-auth-visibility`
and is the signal's sensor: an interactive-shell check that names the Tailscale
auth state at shell init so a NeedsLogin is diagnosed at login, not by
debugging. Scope is the interactive-shell banner on **each machine** (the
NixOS/WSL router host and the Darwin client; both use the shared
`nix/home/zsh.nix`). Non-interactive dispatch-fleet shells are excluded (strategy
clarification: a check firing in every bg agent session adds latency/noise where
no human is looking). The router-host **office-hours feed** is a separate,
design-entangled surface handled by born-parked
`tactic-tailscale-office-hours-auth-signal` and is **out of scope** here.

## Unit 1 — Interactive zsh Tailscale auth banner

**Scope**: Extend the zsh `initContent` block in `nix/home/zsh.nix:18` (the
`lib.mkOrder 1000` block that today only defines `__wezterm_set_git_branch` and
registers it on `precmd_functions`/`chpwd_functions`). Add a shell function that,
**guarded to interactive shells only** (`[[ -o interactive ]]` — `.zshrc` can be
sourced by tooling, and the dispatch fleet's non-interactive shells must stay
silent), runs a fast local `tailscale status --json` (local socket,
milliseconds) once at shell init (call it directly in the init body, **not** via
`precmd_functions`, so it fires once per shell, not once per prompt). When
`.BackendState != "Running"` (NeedsLogin, Stopped, NoState), print a named
banner to stderr naming the diagnosis and host, e.g.
`tailscale is not logged in on <hostname> (BackendState: <state>)`, plus the
ready login URL. Tailscale surfaces the URL two ways — the plain `tailscale
status` output includes a `Log in at: <url>` line on NeedsLogin, and the
`--json` payload carries `.AuthURL`; parse `.AuthURL` from the json already
fetched (fall back to printing `run: sudo tailscale up` when it is empty).

Defensive discipline (mirror the wezterm reference at `nix/home/wezterm.nix:63`):
if `tailscale` is not on PATH or the socket is down, the function must stay
**silent** — absence of tailscale is not a banner. Do not `set -e`-fail the
shell; the check is best-effort and never blocks login. Use `jq` or `tailscale
status`'s own fields — `jq` is available in the nix env; if you prefer no `jq`
dependency in the login path, parse the non-json `tailscale status` first line
(`BackendState` is derivable from the `Log in at:` presence). Prefer `--json` +
`jq` for a precise `BackendState` read.

- **Out of scope**: non-interactive shells; the office-hours feed; the wezterm
  loud-fail (its own tactic); any auto-remediation (`tailscale up`) — resolution
  stays manual per the strategy.
- **Anchors**: `nix/home/zsh.nix:18` (the `initContent` `lib.mkOrder 1000`
  block to extend); reuse the defensive tailscale-invocation pattern at
  `nix/home/wezterm.nix:52-110`.
- **Recommended model**: sonnet — one contained nix/zsh config file, clear
  reference pattern.

## Unit 2 — Nix test: generated zsh init contains the guarded auth check

**Scope**: Add a nix test mirroring `nix/home/wezterm.test.nix`'s module-eval +
`lib.hasInfix` approach. Create `nix/home/zsh.test.nix` that evaluates
`zsh.nix` with a mock config and asserts the generated
`programs.zsh.initContent` (a) contains the interactive guard (`-o interactive`),
(b) contains a `BackendState` / `tailscale status` check, and (c) prints an auth
URL / remediation. Wire it into `flake.nix` `checks` at `flake.nix:101-111`
alongside `weztermTests`/`claudeCodeTests` so `nix flake check` runs it in CI.

- **Reuse**: `nix/home/wezterm.test.nix` evaluateModule + `lib.hasInfix` harness
  (`nix/home/wezterm.test.nix:138-153`); flake checks wiring at
  `flake.nix:101-111`.
- **Recommended model**: sonnet.
- **Dependencies**: Unit 1.

## Reuse

- `nix/home/wezterm.nix:52-110` — the pcall-guarded `tailscale status --json`
  invocation and `BackendState`/`DNSName` parsing (silent when tailscale absent).
- `nix/home/wezterm.test.nix` — module-eval + `lib.hasInfix` test harness to copy.
- `flake.nix:101-111` — `checks` aggregation to register the new test.

## Verification

```verify
nix flake check
```

Manual (per machine, on the NixOS router host and the Darwin client): run
`home-manager switch`, then open a fresh interactive shell while `tailscale
status` reports Running → no banner. Run `sudo tailscale logout`, open a fresh
interactive shell → the named banner and login URL print. Confirm a
non-interactive shell (`zsh -c 'true'`) prints nothing.
