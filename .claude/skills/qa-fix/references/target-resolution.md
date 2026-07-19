# Step 0 — Node-lane target resolution and parked re-entry guard

This reference carries the full node-lane target-resolution subroutine for Step 0
of `SKILL.md`. The body keeps the legacy `<N>` extraction and the decision (resolve
`NODE_ID`, require phase `qa`, apply the parked re-entry guard, set `N` /
`TARGET_KIND`); the mechanical frontmatter-parsing bash lives here.

The full `case` block:

```bash
BRANCH=$(basename "$(git rev-parse --show-toplevel)")
case "$BRANCH" in
  [0-9]*-*)
    N="${BRANCH%%-*}"; TARGET_KIND=issue ;;
  *)
    # Graph-native node lane: worktree named after the intention node id.
    NODE_ID="$BRANCH"
    git fetch origin main --quiet
    NODE_MD=$(git archive origin/main "intentions/$NODE_ID.md" 2>/dev/null | tar -xO 2>/dev/null) || {
      echo "/qa-fix: '$BRANCH' is neither a legacy '<N>-…' worktree nor a node with intentions/$NODE_ID.md at origin/main" >&2
      exit 1
    }
    NODE_PHASE=$(printf '%s\n' "$NODE_MD" | sed -n 's/^phase: *//p' | head -1)
    if [ "$NODE_PHASE" != "qa" ]; then
      echo "/qa-fix: node '$NODE_ID' phase is '$NODE_PHASE' at origin/main, not 'qa'" >&2
      exit 1
    fi
    # Re-entry guard: parking sets office_hours without changing phase, so a
    # stale wakeup must not re-run qa-fix against a parked node. Agrees with
    # the canonical selection gate `readParked`
    # (packages/intentionsutil/scripts/check-node-selection.ts:90-93): parked
    # iff first-class `office_hours` is non-null OR a non-null
    # `attributes.office_hours` squatter block is present (squatter convention
    # live until tactic-schema-migration-backfill). Match only the YAML
    # frontmatter (never the body — a prose `office_hours: null` line must not
    # be mistaken for state); capture as text (grep -q exit code is unreliable
    # on empty input) and test for emptiness.
    NODE_FRONTMATTER=$(printf '%s\n' "$NODE_MD" | awk '/^---$/{d++; next} d==1{print} d>=2{exit}')
    PARKED=""
    # First-class park: an unparked node carries the literal
    # `office_hours: null`; its absence means a nested block replaced it.
    FIRST_CLASS_NULL=$(printf '%s\n' "$NODE_FRONTMATTER" | grep -xF 'office_hours: null')
    [ -z "$FIRST_CLASS_NULL" ] && PARKED=1
    # Squatter park: an indented non-null `office_hours:` line under
    # `attributes:` — select indented `office_hours:` lines, drop the `null`
    # ones; anything left is a populated squatter block.
    SQUATTER=$(printf '%s\n' "$NODE_FRONTMATTER" \
         | grep -E '^[[:space:]]+office_hours:' \
         | grep -vE '^[[:space:]]+office_hours:[[:space:]]+null[[:space:]]*$')
    [ -n "$SQUATTER" ] && PARKED=1
    if [ -n "$PARKED" ]; then
      echo "/qa-fix: node '$NODE_ID' is already office_hours-parked at origin/main — nothing to do" >&2
      exit 0
    fi
    N="$NODE_ID"; TARGET_KIND=node ;;
esac
```

`$N` keys the remaining steps' `tmp/` filenames (the issue number on the legacy
lane, the node id on the node lane). `$TARGET_KIND` selects the lane at the seams
that differ — see **Node-target lane** in `SKILL.md`. **On the node lane no gh
issue is ever read or written.**
