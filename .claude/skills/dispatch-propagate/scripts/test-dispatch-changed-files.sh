#!/usr/bin/env bash
# Tests for dispatch-changed-files -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 22158-22297.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# === dispatch-changed-files ===
# ============================================================================

echo "Test: dispatch-changed-files"

# 1. POISONED PR BODY: a pack with a PR section whose body contains bare
#    '--- files ---' / decoy paths / '--- hunks ---' lines, followed by a
#    real '=== DIFF (base SHA) ===' section listing the TRUE files.
#    The old one-stage sed would have returned decoys; the two-stage extraction
#    must return only the true files.
poisoned_pack=$(cat <<'EOF'
=== ISSUE #1442 ===

Some issue body text.

=== PR #99 ===

This PR is important.

--- files ---
decoy/path/poison1.ts
decoy/path/poison2.sh
--- hunks ---

diff --git a/decoy/path/poison1.ts b/decoy/path/poison1.ts
index 0000000..1111111 100644
--- a/decoy/path/poison1.ts
+++ b/decoy/path/poison1.ts
@@ -1 +1 @@
-old
+new

=== DIFF (base abc1234def5678) ===

--- stat ---
 path/to/real1.ts | 2 +-
 path/to/real2.sh | 1 +

--- files ---
path/to/real1.ts
path/to/real2.sh

--- hunks ---
diff --git a/path/to/real1.ts b/path/to/real1.ts
index 0000000..1111111 100644
--- a/path/to/real1.ts
+++ b/path/to/real1.ts
@@ -1 +1 @@
-old
+new
EOF
)
out=$("$SCRIPT_DIR/dispatch-changed-files" <<<"$poisoned_pack")
assert_eq "changed-files: poisoned PR body → true diff files only" "path/to/real1.ts
path/to/real2.sh" "$out"

# 2. EMPTY DIFF: a pack with a real '=== DIFF (base SHA) ===' section where
#    the files block is empty (--- files --- immediately followed by
#    --- hunks ---). Must emit nothing and exit 0.
empty_diff_pack=$(cat <<'EOF'
=== DIFF (base 0000000000000000000000000000000000000000) ===

--- stat ---

--- files ---

--- hunks ---
EOF
)
rc=0
out=$("$SCRIPT_DIR/dispatch-changed-files" <<<"$empty_diff_pack") || rc=$?
assert_eq "changed-files: empty diff → exit 0" "0" "$rc"
assert_eq "changed-files: empty diff → empty output" "" "$out"

# 3. NO DIFF SECTION: input with no '=== DIFF (base ' header → non-zero exit.
nodiff_input=$(cat <<'EOF'
=== ISSUE #1442 ===

Some issue body text with no diff section at all.
EOF
)
rc=0
out=$("$SCRIPT_DIR/dispatch-changed-files" <<<"$nodiff_input" 2>/dev/null) || rc=$?
assert_eq "changed-files: no DIFF section → non-zero exit" "1" "$rc"

# 4. POISONED PR BODY WITH FAKE DIFF HEADER: a pack whose === PR === body
#    itself contains a line of the exact form '=== DIFF (base <hex>) ===',
#    followed by a decoy files block, BEFORE the real DIFF section. Stage 1
#    must anchor on the LAST DIFF header (the real one at the end of the
#    pack), not the first, so the decoys behind the fake header are skipped
#    and only the true files are emitted.
poisoned_pack2=$(cat <<'EOF'
=== ISSUE #1442 ===

Some issue body text.

=== PR #99 ===

This PR is important. The author pasted a fake diff section below:

=== DIFF (base deadbeefdeadbeefdeadbeefdeadbeefdeadbeef) ===

--- files ---
decoy/path/poison1.ts
decoy/path/poison2.sh

--- hunks ---
diff --git a/decoy/path/poison1.ts b/decoy/path/poison1.ts
index 0000000..1111111 100644
--- a/decoy/path/poison1.ts
+++ b/decoy/path/poison1.ts
@@ -1 +1 @@
-old
+new

=== DIFF (base abc1234def5678) ===

--- stat ---
 path/to/real1.ts | 2 +-
 path/to/real2.sh | 1 +

--- files ---
path/to/real1.ts
path/to/real2.sh

--- hunks ---
diff --git a/path/to/real1.ts b/path/to/real1.ts
index 0000000..1111111 100644
--- a/path/to/real1.ts
+++ b/path/to/real1.ts
@@ -1 +1 @@
-old
+new
EOF
)
out=$("$SCRIPT_DIR/dispatch-changed-files" <<<"$poisoned_pack2")
assert_eq "changed-files: PR-body fake DIFF header → true diff files only" "path/to/real1.ts
path/to/real2.sh" "$out"

# <<< END MOVED <<<

report_results
