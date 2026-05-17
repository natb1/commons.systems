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
