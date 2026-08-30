# lib-base-pin.sh — shared `--base` pin resolution for park-node and
# clear-park. Sourced (never executed) by both scripts from their own
# SCRIPT_DIR; relies on the caller having already run `set -uo pipefail` and
# parsed BASE_SUPPLIED / BASE_ARG from its own flag loop.
#
# resolve_base_pin <prog-name> <node-id>
#
# Resolves BASE_SUPPLIED/BASE_ARG to a 40-hex blob sha in PINNED_BASE (left ""
# when --base was not supplied), before any network call, so a malformed
# --base is a cheap usage error rather than a mid-flight failure. Handles the
# manifest-file branch, the `<id>=<sha>` pair branch, the bare-sha branch, and
# the 40-hex validation — plus the BASE_SUPPLIED-but-empty-value usage-error
# guard (an explicitly supplied but empty `--base ''` / `--base=` must fail
# loudly, not silently degrade to an unpinned park/clear; see
# .claude/skills/ref-diagnosis-time-cas/SKILL.md).
#
# On any error this exits the whole process directly with status 2 — exactly
# what the block each caller inlined used to do — so callers do not need to
# check a return code. <prog-name> is used verbatim as the message prefix
# ("park-node" or "clear-park") so operator-visible errors keep naming which
# script raised them; every other byte of each message is shared.
resolve_base_pin() {
  local prog="$1"
  local node_id="$2"

  PINNED_BASE=""
  if [[ $BASE_SUPPLIED -eq 1 && -z "$BASE_ARG" ]]; then
    echo "$prog: --base requires a non-empty <blobsha>|<id>=<blobsha>|<manifest-file> value" >&2
    exit 2
  fi
  if [[ $BASE_SUPPLIED -eq 1 ]]; then
    if [[ -f "$BASE_ARG" ]]; then
      local line line_id line_sha
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ -z "$line" ]] && continue
        line_id="${line%%=*}"
        line_sha="${line#*=}"
        if [[ "$line_id" == "$node_id" ]]; then
          PINNED_BASE="$line_sha"
          break
        fi
      done <"$BASE_ARG"
      if [[ -z "$PINNED_BASE" ]]; then
        echo "$prog: manifest '$BASE_ARG' has no entry for node id '$node_id'" >&2
        exit 2
      fi
    elif [[ "$BASE_ARG" == *=* ]]; then
      local pair_id="${BASE_ARG%%=*}"
      local pair_sha="${BASE_ARG#*=}"
      if [[ "$pair_id" != "$node_id" ]]; then
        echo "$prog: --base id '$pair_id' does not match node id '$node_id'" >&2
        exit 2
      fi
      PINNED_BASE="$pair_sha"
    else
      PINNED_BASE="$BASE_ARG"
    fi
    if [[ ! "$PINNED_BASE" =~ ^[0-9a-f]{40}$ ]]; then
      echo "$prog: --base resolved to '$PINNED_BASE', not a full 40-hex blob sha" >&2
      exit 2
    fi
  fi
}
