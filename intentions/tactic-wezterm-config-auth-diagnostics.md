---
id: tactic-wezterm-config-auth-diagnostics
kind: tactic
statement: wezterm.lua ssh_domains discovery fails loudly on Tailscale
  NeedsLogin instead of silently returning an empty domain list
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-07 strategy interview, directly from the
  motivating incident. nix/home/wezterm.nix's generated Lua parses tailscale
  status --json and quietly yields zero ssh_domains when Self.DNSName is empty
  (BackendState NeedsLogin), so wezterm-gui dies with the cryptic 'desired
  default domain nixos was not found in mux'. The config should detect
  BackendState != Running and wezterm.log_error a named diagnosis ('tailscale is
  logged out on <host> — run: sudo tailscale up') so the wezterm log itself
  carries the root cause; optionally surface it in the GUI rather than
  terminating bare. Finalized 2026-07-13 by /align-tactics round 1 (consumes the
  retained draft of the same id)."
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
# wezterm ssh_domains discovery fails loudly on Tailscale NeedsLogin

## Context

Directly from the 2026-07-07 motivating incident. `nix/home/wezterm.nix`'s
generated Lua parses `tailscale status --json` and quietly yields zero
`ssh_domains` when `Self.DNSName` is empty (BackendState NeedsLogin), so
wezterm-gui dies with the cryptic `desired default domain nixos was not found in
mux`. The failure surfaced two layers from its cause and named no diagnosis.

This tactic makes the discovery **fail loudly**: detect `BackendState !=
"Running"` and `wezterm.log_error` a named diagnosis so the wezterm log itself
carries the root cause instead of a bare termination. It is one of the two named
surfaces that let the next NeedsLogin incident be diagnosed by a named check
rather than forensic debugging (`strategy-tailscale-auth-visibility`).

## Unit 1 — Loud BackendState diagnosis in ssh_domains discovery

**Scope**: In the generated Lua discovery block in `nix/home/wezterm.nix:62-110`,
inside the existing `pcall`, after `wezterm.json_parse(stdout)` succeeds
(`nix/home/wezterm.nix:69`), read `status.BackendState`. When it is not
`"Running"` (NeedsLogin / Stopped / NoState), call `wezterm.log_error` with a
named diagnosis that includes the host and the remediation command, e.g.
`tailscale is logged out (BackendState=<state>) — ssh_domains will be empty; run:
sudo tailscale up`. Keep the happy path unchanged: still iterate `Self` + `Peer`
and build `ssh_domains` from whatever nodes have a `DNSName` (the mux may still
have some domains; the diagnosis is additive). The existing `wezterm.log_warn`
calls at `:66` and `:71` stay. This changes only the diagnostic surface, not
domain construction, and stays inside the pcall so a tailscale-absent machine is
unaffected.

- **Out of scope**: changing the mux default-domain / `default_gui_startup_args`
  startup behavior (`nix/home/wezterm.nix:43`); auto-remediation; the zsh shell
  banner (its own tactic). A GUI-surfaced toast (vs the log) is optional and not
  required — the `log_error` line is the deliverable.
- **Anchors**: `nix/home/wezterm.nix:64` (`wezterm.run_child_process`), `:69`
  (`wezterm.json_parse`), `:66` and `:71` (existing `log_warn` calls to mirror
  for the new `log_error`), `:85` (`node.DNSName` node iteration).
- **Recommended model**: sonnet — a localized change to one generated-Lua block
  with a clear existing pattern.

## Unit 2 — Nix test: generated Lua asserts the BackendState diagnosis

**Scope**: Extend `nix/home/wezterm.test.nix` with `lib.hasInfix` assertions that
the generated Lua contains a `BackendState` check and a `log_error` diagnosis
string, alongside the existing ssh_domains / pcall assertions
(`nix/home/wezterm.test.nix:138-204`). The Lua-syntax validator
(`nix/home/wezterm.test.nix:63`) already covers the added code, so no new
harness is needed — just new assertion cases.

- **Reuse**: existing `lib.hasInfix` test cases at
  `nix/home/wezterm.test.nix:138-204`; Lua syntax validator at
  `nix/home/wezterm.test.nix:63`.
- **Recommended model**: sonnet.
- **Dependencies**: Unit 1.

## Reuse

- `nix/home/wezterm.nix:62-110` — the `pcall` + `json_parse` + node-iteration
  block to extend.
- `nix/home/wezterm.test.nix` — module-eval + `lib.hasInfix` + Lua-syntax test
  harness (already wired into `flake.nix` `checks`).

## Verification

```verify
nix flake check
```

Manual (on the router host): with `sudo tailscale logout`, launch wezterm-gui →
the wezterm log carries the named `tailscale is logged out ... run: sudo
tailscale up` line instead of only `desired default domain nixos was not found
in mux`. With tailscale Running, `ssh_domains` populates as before and no error
is logged.
