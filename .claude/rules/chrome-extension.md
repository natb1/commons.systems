# Chrome Extension (claude-in-chrome)

This repo is developed with Claude Code in WSL/NixOS while Chrome runs on
Windows. The `claude-in-chrome` MCP tools pair the two through Anthropic's
relay — there is no direct WSL↔Windows link, so both sides must be logged into
the same claude.ai account.

## Chrome must be running first

The extension only registers with the relay while Chrome is open. If Chrome is
closed, `list_connected_browsers` returns `[]` and `tabs_context_mcp` reports
"Browser extension is not connected". Start Chrome, then retry.

## Permission popup is async — retry once

The first call to a new tool+origin combination returns a denial
(`permission_required: <origin>` or "Permission denied by user") *before* the
approval popup surfaces in Chrome. The user clicks permit after the call has
already failed; the grant then caches per tool+origin.

Retry the failed call once — the retry succeeds. Don't loop on permission
failures; one retry is enough.

## Which tools hit the gate

Auto-approved via the `.claude/settings.json` allowlist (never prompt):
`tabs_context_mcp`, `read_console_messages`, `read_network_requests`.

Gated (prompt on first use per origin): `navigate`, `javascript_tool`,
`computer`, `gif_creator`, `tabs_create_mcp`. Inside a `browser_batch` the gate
fires per item and stops the batch — run the first action to a new origin
standalone, then batch the rest.

## QA server: emulator reachability from Windows Chrome

`run-qa-server.sh` runs the Vite dev server and the Firebase emulators inside
WSL; browser QA (`/dispatch-qa`, `/ref-qa`, `/ref-prod-qa`) drives Chrome on the
Windows host against them. WSL2's default NAT networking forwards `localhost`
ports from Windows into WSL, but emulators bound only to `127.0.0.1` are not
reliably reachable from the Windows host — the page loads while every Firestore
call fails with `[code=unavailable]`.

`run-qa-server.sh` therefore generates the emulator `firebase.json` with
`"host": "0.0.0.0"` for every emulator (firestore, auth, storage, functions),
binding them on all interfaces so Windows Chrome can reach them. No host-side
configuration is required for QA.

If `localhost` forwarding still misbehaves, enable WSL2 mirrored networking,
which shares `localhost` directly between Windows and WSL. Add to
`%UserProfile%\.wslconfig` on the Windows host and restart WSL with
`wsl --shutdown`:

```
[wsl2]
networkingMode=mirrored
```

`run-acceptance-tests.sh` is unaffected: it builds its own emulator config and
runs Playwright inside WSL, where `localhost` already reaches the emulators.
