#!/usr/bin/env bash
# Tests for lib-resolve-dirty-apps -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 28354-28455.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# resolve_dirty_apps (#1887)
# ============================================================================
#
# Covers the longest-prefix workspace resolution and shared-package retrigger
# path introduced in #1887. A synthetic fixture declares three workspaces:
# landing (flat), blog (flat, consumes @commons-systems/ds), and packages/ds
# (nested). Each case is sorted before asserting because resolve_dirty_apps
# emits names in hash-iteration order.

echo ""
echo "=== resolve_dirty_apps: nested workspace resolution ==="

echo "Test: resolve_dirty_apps -- nested direct + shared retrigger"
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/landing" "$TMPDIR_TEST/blog" "$TMPDIR_TEST/packages/ds"
printf '%s' '{"workspaces":["landing","blog","packages/ds"]}' > "$TMPDIR_TEST/package.json"
printf '%s' '{}' > "$TMPDIR_TEST/landing/package.json"
printf '%s' '{"dependencies":{"@commons-systems/ds":"*"}}' > "$TMPDIR_TEST/blog/package.json"
printf '%s' '{}' > "$TMPDIR_TEST/packages/ds/package.json"

out=$(printf '%s\n' "packages/ds/base.css" | (source "$SCRIPT_DIR/lib.sh"; resolve_dirty_apps "$TMPDIR_TEST") | sort)
assert_eq "resolve_dirty_apps: nested direct + shared retrigger" \
  $'blog\npackages/ds' "$out"

echo "Test: resolve_dirty_apps -- flat workspace regression"
out=$(printf '%s\n' "landing/index.html" | (source "$SCRIPT_DIR/lib.sh"; resolve_dirty_apps "$TMPDIR_TEST") | sort)
assert_eq "resolve_dirty_apps: flat workspace regression" \
  "landing" "$out"

echo "Test: resolve_dirty_apps -- prefix boundary marks nothing"
out=$(printf '%s\n' "packages/dsx/foo" | (source "$SCRIPT_DIR/lib.sh"; resolve_dirty_apps "$TMPDIR_TEST") | sort)
assert_eq "resolve_dirty_apps: prefix boundary marks nothing" \
  "" "$out"

echo "Test: resolve_dirty_apps -- root-config fan-out marks all workspaces"
out=$(printf '%s\n' "package.json" | (source "$SCRIPT_DIR/lib.sh"; resolve_dirty_apps "$TMPDIR_TEST") | sort)
assert_eq "resolve_dirty_apps: root-config fan-out marks all workspaces" \
  $'blog\nlanding\npackages/ds' "$out"

# vitest.config.ts is the shared root test config: editing it alone must fan out
# to every workspace, otherwise a broken test config resolves an empty dirty set
# and run-unit-tests exits green. (#tactic-ci-change-detection-transitive Unit 2)
echo "Test: resolve_dirty_apps -- vitest.config.ts fan-out marks all workspaces"
out=$(printf '%s\n' "vitest.config.ts" | (source "$SCRIPT_DIR/lib.sh"; resolve_dirty_apps "$TMPDIR_TEST") | sort)
assert_eq "resolve_dirty_apps: vitest.config.ts fan-out marks all workspaces" \
  $'blog\nlanding\npackages/ds' "$out"

rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# Transitive internal-dep closure (#tactic-ci-change-detection-transitive Unit 1).
# fellspiral -> @commons-systems/blog -> @commons-systems/ds, but fellspiral
# never declares ds. A ds-only change must still mark fellspiral dirty via the
# transitive closure, not just blog (its direct declarer).
echo ""
echo "=== resolve_dirty_apps: transitive internal-dep closure ==="

echo "Test: resolve_dirty_apps -- ds change marks transitive dependent fellspiral"
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/fellspiral" "$TMPDIR_TEST/blog" "$TMPDIR_TEST/packages/ds"
printf '%s' '{"workspaces":["fellspiral","blog","packages/ds"]}' > "$TMPDIR_TEST/package.json"
printf '%s' '{"dependencies":{"@commons-systems/blog":"*"}}' > "$TMPDIR_TEST/fellspiral/package.json"
printf '%s' '{"dependencies":{"@commons-systems/ds":"*"}}' > "$TMPDIR_TEST/blog/package.json"
printf '%s' '{}' > "$TMPDIR_TEST/packages/ds/package.json"

out=$(printf '%s\n' "packages/ds/base.css" | (source "$SCRIPT_DIR/lib.sh"; resolve_dirty_apps "$TMPDIR_TEST") | sort)
assert_eq "resolve_dirty_apps: ds change marks blog and transitive fellspiral" \
  $'blog\nfellspiral\npackages/ds' "$out"

# A change to the mid-tier package (blog) marks only blog and its dependent
# fellspiral, never the leaf ds it consumes (dependents propagate up, not down).
echo "Test: resolve_dirty_apps -- blog change marks fellspiral but not ds"
out=$(printf '%s\n' "blog/index.ts" | (source "$SCRIPT_DIR/lib.sh"; resolve_dirty_apps "$TMPDIR_TEST") | sort)
assert_eq "resolve_dirty_apps: blog change marks blog and fellspiral only" \
  $'blog\nfellspiral' "$out"

rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# Same transitive closure, but with the mid-tier package nested under packages/
# (the real repo's actual layout: every internal @commons-systems/* package
# lives at packages/<name>, never at a bare top-level <name> dir). The
# dependency-short-name key ("blog") and the workspace app path
# ("packages/blog") diverge here, which the flat-workspace fixture above
# cannot exercise — a BFS that mistakenly re-keys on the full app path instead
# of re-deriving the short name silently truncates the closure at depth 1.
echo "Test: resolve_dirty_apps -- ds change marks transitive dependent fellspiral (nested packages/ mid-tier)"
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/fellspiral" "$TMPDIR_TEST/packages/blog" "$TMPDIR_TEST/packages/ds"
printf '%s' '{"workspaces":["fellspiral","packages/blog","packages/ds"]}' > "$TMPDIR_TEST/package.json"
printf '%s' '{"dependencies":{"@commons-systems/blog":"*"}}' > "$TMPDIR_TEST/fellspiral/package.json"
printf '%s' '{"peerDependencies":{"@commons-systems/ds":"*"}}' > "$TMPDIR_TEST/packages/blog/package.json"
printf '%s' '{}' > "$TMPDIR_TEST/packages/ds/package.json"

out=$(printf '%s\n' "packages/ds/base.css" | (source "$SCRIPT_DIR/lib.sh"; resolve_dirty_apps "$TMPDIR_TEST") | sort)
assert_eq "resolve_dirty_apps: ds change marks nested packages/blog and transitive fellspiral" \
  $'fellspiral\npackages/blog\npackages/ds' "$out"

rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# <<< END MOVED <<<

report_results
