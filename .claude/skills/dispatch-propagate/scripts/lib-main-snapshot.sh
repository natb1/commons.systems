#!/usr/bin/env bash
# lib-main-snapshot.sh — sourceable helpers that capture and materialize a
# main-branch snapshot's PROVENANCE (ref/sha/fetchedAt) so it can be passed to
# packages/intentionsutil/scripts/check-node-selection.ts's `--snapshot-ref`
# / `--snapshot-sha` / `--snapshot-fetched-at` flags
# (tactic-graph-execute-fresh-main-read, Unit 2).
#
# The gate itself never fetches (see check-node-selection.ts's header comment:
# `node:child_process` must NEVER be imported there) — provenance acquisition
# is the CALLER's job. These functions are that acquisition, shared across
# every script that materializes an intentions/ snapshot and invokes the gate:
# provision-node-worktree, assert-node-selection, dispatch-derive-node-target.
#
# Usage: source this file, then call:
#   main_snapshot_capture <repo_root> [<ref>]
#   main_snapshot_materialize <repo_root> <ref> <dest_dir>
#   main_snapshot_write_sidecar <project_root> <node_id>
#
# Safe to source multiple times. Does NOT use set -e (callers must inspect
# return codes, not have the shell die under them).

if [[ -z "${_LIB_MAIN_SNAPSHOT_LOADED:-}" ]]; then
  _LIB_MAIN_SNAPSHOT_LOADED=1

  # main_snapshot_capture <repo_root> [<ref>] — resolve <ref> (default
  # "origin/main") to a commit sha and record the instant this call ran as the
  # fetch attestation.
  #
  # IMPORTANT: call this ONLY immediately after a `git fetch` of <ref>
  # SUCCEEDED. `fetchedAt` attests that the fetch happened, not that this
  # `rev-parse` call happened — an `rev-parse` run long after a stale fetch
  # would silently backdate a fetch that never occurred.
  #
  # On success, sets (in the CALLER's shell — deliberately not `local`, these
  # must escape this function):
  #   MAIN_SNAPSHOT_REF         the ref resolved (as passed, or the default).
  #   MAIN_SNAPSHOT_SHA         the 40-hex commit <ref> resolved to.
  #   MAIN_SNAPSHOT_FETCHED_AT  UTC instant of this call, `date -u +%FT%TZ`.
  #   MAIN_SNAPSHOT_FLAGS       array: (--snapshot-ref "$ref" --snapshot-sha
  #                             "$sha" --snapshot-fetched-at "$ts"), ready to
  #                             splice into a check-node-selection.ts
  #                             invocation as "${MAIN_SNAPSHOT_FLAGS[@]}".
  # On failure (rev-parse failed), returns 1 and sets MAIN_SNAPSHOT_FLAGS=()
  # so a caller that forwards it unconditionally forwards nothing rather than
  # stale values from a previous call.
  main_snapshot_capture() {
    local repo_root="$1"
    local ref="${2:-origin/main}"

    local sha
    if ! sha=$(git -C "$repo_root" rev-parse "$ref" 2>&1); then
      echo "main_snapshot_capture: git -C '$repo_root' rev-parse '$ref' failed: $sha" >&2
      MAIN_SNAPSHOT_FLAGS=()
      return 1
    fi

    MAIN_SNAPSHOT_REF="$ref"
    MAIN_SNAPSHOT_SHA="$sha"
    MAIN_SNAPSHOT_FETCHED_AT="$(date -u +%FT%TZ)"
    MAIN_SNAPSHOT_FLAGS=(--snapshot-ref "$MAIN_SNAPSHOT_REF" --snapshot-sha "$MAIN_SNAPSHOT_SHA" --snapshot-fetched-at "$MAIN_SNAPSHOT_FETCHED_AT")
    return 0
  }

  # main_snapshot_materialize <repo_root> <ref> <dest_dir> — extract the
  # `intentions/` tree at <ref> into <dest_dir> (so the caller then reads
  # `<dest_dir>/intentions`).
  #
  # `git archive` and `tar -x` are run as two SEPARATELY status-checked
  # commands, never as a shell pipeline (`git archive ... | tar -x`). See
  # packages/intentionsutil/scripts/lib-store-at-ref.ts ~44-48: without
  # `pipefail`, a failing `git archive` still exits 0 through `tar`, silently
  # extracting an empty stream — which for a fail-closed gate reads as
  # "nothing is parked" rather than as the acquisition failure it is.
  #
  # Returns non-zero with a message on stderr if either step fails. Cleans up
  # its own temp tar file in all cases.
  main_snapshot_materialize() {
    local repo_root="$1"
    local ref="$2"
    local dest_dir="$3"

    local tar_file
    tar_file="$(mktemp)" || {
      echo "main_snapshot_materialize: mktemp failed" >&2
      return 1
    }

    if ! git -C "$repo_root" archive "$ref" intentions >"$tar_file" 2>/dev/null; then
      echo "main_snapshot_materialize: git -C '$repo_root' archive '$ref' intentions failed" >&2
      rm -f "$tar_file"
      return 1
    fi

    if ! tar -x -C "$dest_dir" -f "$tar_file"; then
      echo "main_snapshot_materialize: tar -x -C '$dest_dir' -f '$tar_file' failed" >&2
      rm -f "$tar_file"
      return 1
    fi

    rm -f "$tar_file"
    return 0
  }

  # main_snapshot_write_sidecar <project_root> <node_id> — write the triple
  # captured by the most recent main_snapshot_capture call
  # (MAIN_SNAPSHOT_REF / MAIN_SNAPSHOT_SHA / MAIN_SNAPSHOT_FETCHED_AT) as one
  # JSON object to <project_root>/.claude/worktrees/<node_id>.snapshot-provenance
  # — the same sidecar convention as provision-node-worktree's
  # `.scope-fingerprint` file: deliberately outside every checkout, so it
  # never dirties a tree.
  #
  # Written so a later unit's caller can read what was actually used to gate
  # this node's provisioning.
  main_snapshot_write_sidecar() {
    local project_root="$1"
    local node_id="$2"
    local sidecar_path="$project_root/.claude/worktrees/$node_id.snapshot-provenance"

    if [[ -n "${MAIN_SNAPSHOT_FETCHED_AT:-}" ]]; then
      jq -n \
        --arg ref "${MAIN_SNAPSHOT_REF:-}" \
        --arg sha "${MAIN_SNAPSHOT_SHA:-}" \
        --arg fetchedAt "$MAIN_SNAPSHOT_FETCHED_AT" \
        '{ref: $ref, sha: $sha, fetchedAt: $fetchedAt}' >"$sidecar_path"
    else
      jq -n \
        --arg ref "${MAIN_SNAPSHOT_REF:-}" \
        --arg sha "${MAIN_SNAPSHOT_SHA:-}" \
        '{ref: $ref, sha: $sha, fetchedAt: null}' >"$sidecar_path"
    fi
  }

fi
