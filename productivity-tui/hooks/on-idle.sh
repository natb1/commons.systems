#!/usr/bin/env bash
# Claude Code hook: Stop, SessionStart — marks a session as idle.
# Reads {session_id, cwd, ...} JSON from stdin.
set -euo pipefail
exec "$(dirname "$0")/update-session.sh" true
