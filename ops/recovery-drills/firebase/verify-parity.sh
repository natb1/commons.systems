#!/usr/bin/env bash
#
# verify-parity.sh — curl the running substitute host (serve-landing.sh) and
# assert response parity against parity-checklist.json's `test_cases`.
#
# Part of the Firebase recovery drill (strategy-exercise-recovery-paths,
# delegation-firebase, Unit 2). This is the machine check that turns the
# checklist into a pass/fail verdict instead of a manual reading exercise.
#
# For each test case in parity-checklist.json `test_cases`:
#   - HTTP status must equal `expected_status`.
#   - When `parity` is true, every header in `expected_headers` must be
#     present on the response, byte-for-byte (case-insensitive header name,
#     exact value match — expected_headers is already Firebase's full merged
#     set for that path, so this is a direct equality check per key, not a
#     loose substring/superset check).
#   - The two SPA cases (`spa-root`, `spa-deep-route`) additionally assert the
#     response BODY is landing/dist/index.html's actual content, not a 404
#     page or empty response — the whole point of the SPA catch-all.
#
# Two test cases carry path PLACEHOLDERS that must be resolved against the
# real build output before curling:
#   - assets-hashed-file:    "/assets/<pick-a-real-hashed-asset>"
#   - root-image-non-asset:  "/<pick-a-real-image-outside-assets>"
# This script resolves both automatically from landing/dist (first hashed
# file under assets/, first image/font-extension file at dist root not under
# assets/). If dist has no candidate for a case, that case is SKIPPED with a
# loud note — not silently passed.
#
# ANY mismatch is a hard failure (loud diagnostic + nonzero exit). A partial
# re-host reported as a pass would corrupt the whole point of the drill: this
# script exists to catch exactly that, so it must never paper over a gap. See
# .claude/rules/code-style.md (clear errors, no defensive fallbacks) and
# .claude/rules/test-integrity.md (never weaken a check to get a green run).
#
# Usage:
#   ops/recovery-drills/firebase/verify-parity.sh
#   BASE_URL=http://127.0.0.1:9090 ops/recovery-drills/firebase/verify-parity.sh
#
# Requires: the substitute host already running (serve-landing.sh), and
# landing/dist built (npm run build --prefix landing).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

BASE_URL="${BASE_URL:-http://127.0.0.1:8088}"
CHECKLIST="$SCRIPT_DIR/parity-checklist.json"
DIST="$REPO_ROOT/landing/dist"

if [[ ! -f "$CHECKLIST" ]]; then
    echo "verify-parity.sh: missing checklist: $CHECKLIST" >&2
    exit 1
fi
if [[ ! -d "$DIST" ]]; then
    echo "verify-parity.sh: document root not found: $DIST" >&2
    echo "  Build the landing app first (e.g. npm run build --prefix landing)." >&2
    exit 1
fi

# Resolve the two placeholder paths against the real build output.
HASHED_ASSET="$(find "$DIST/assets" -maxdepth 1 -type f 2>/dev/null | head -n1)"
NON_ASSET_IMAGE="$(find "$DIST" -maxdepth 1 -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' \
       -o -iname '*.webp' -o -iname '*.avif' -o -iname '*.svg' -o -iname '*.woff2' \) \
    2>/dev/null | head -n1)"

TMP_BODY="$(mktemp)"
TMP_HEADERS="$(mktemp)"
cleanup() { rm -f "$TMP_BODY" "$TMP_HEADERS"; }
trap cleanup EXIT

fail_count=0
pass_count=0
skip_count=0
declare -a RESULTS=()   # "name|status" for the drill report table

# --- helpers -----------------------------------------------------------

# get_header <headers-file> <name> -> last matching value (Firebase/nginx
# semantics: a later-set header of the same name wins; curl -D lists them in
# response order, so the LAST match is the effective value).
get_header() {
    local file="$1" name="$2"
    awk -v want="$(printf '%s' "$name" | tr 'A-Z' 'a-z')" '
        BEGIN { FS=":"; found="" }
        {
            line = $0
            sub(/\r$/, "", line)
            colon = index(line, ":")
            if (colon == 0) next
            key = tolower(substr(line, 1, colon - 1))
            if (key == want) {
                val = substr(line, colon + 1)
                sub(/^[ \t]+/, "", val)
                found = val
            }
        }
        END { print found }
    ' "$file"
}

# --- run each test case --------------------------------------------------

case_count="$(jq '.test_cases | length' "$CHECKLIST")"
i=0
while [[ "$i" -lt "$case_count" ]]; do
    case_json="$(jq -c ".test_cases[$i]" "$CHECKLIST")"
    name="$(jq -r '.name' <<<"$case_json")"
    path="$(jq -r '.path' <<<"$case_json")"
    expected_status="$(jq -r '.expected_status' <<<"$case_json")"
    parity="$(jq -r '.parity' <<<"$case_json")"
    i=$((i + 1))

    # Resolve placeholder paths against real build output; skip loudly if the
    # build has no matching file rather than silently passing/failing.
    if [[ "$path" == "/assets/<pick-a-real-hashed-asset>" ]]; then
        if [[ -z "$HASHED_ASSET" ]]; then
            echo "SKIP  $name: no file found under $DIST/assets/ to probe" >&2
            skip_count=$((skip_count + 1))
            RESULTS+=("$name|SKIP")
            continue
        fi
        path="/assets/$(basename "$HASHED_ASSET")"
    elif [[ "$path" == "/<pick-a-real-image-outside-assets>" ]]; then
        if [[ -z "$NON_ASSET_IMAGE" ]]; then
            echo "SKIP  $name: no non-/assets/ image/font file found in $DIST to probe" >&2
            skip_count=$((skip_count + 1))
            RESULTS+=("$name|SKIP")
            continue
        fi
        path="/$(basename "$NON_ASSET_IMAGE")"
    fi

    url="$BASE_URL$path"
    status="$(curl -s -o "$TMP_BODY" -D "$TMP_HEADERS" -w '%{http_code}' "$url")"
    curl_exit=$?
    if [[ "$curl_exit" -ne 0 ]]; then
        echo "FAIL  $name ($path): curl could not reach $url (exit $curl_exit) — is serve-landing.sh running?" >&2
        fail_count=$((fail_count + 1))
        RESULTS+=("$name|FAIL")
        continue
    fi

    case_ok=1

    if [[ "$status" != "$expected_status" ]]; then
        echo "FAIL  $name ($path): expected status $expected_status, got $status" >&2
        case_ok=0
    fi

    if [[ "$parity" == "true" ]]; then
        header_names="$(jq -r '.expected_headers | keys[]' <<<"$case_json")"
        while IFS= read -r hname; do
            [[ -z "$hname" ]] && continue
            expected_val="$(jq -r --arg k "$hname" '.expected_headers[$k]' <<<"$case_json")"
            actual_val="$(get_header "$TMP_HEADERS" "$hname")"
            if [[ "$actual_val" != "$expected_val" ]]; then
                echo "FAIL  $name ($path): header '$hname' mismatch" >&2
                echo "        expected: $expected_val" >&2
                echo "        actual:   $actual_val" >&2
                case_ok=0
            fi
        done <<<"$header_names"
    fi

    # SPA cases must actually serve index.html content, not a 404/empty body.
    if [[ "$name" == "spa-root" || "$name" == "spa-deep-route" ]]; then
        if ! cmp -s "$TMP_BODY" "$DIST/index.html"; then
            echo "FAIL  $name ($path): response body does not match $DIST/index.html (SPA catch-all not serving index.html)" >&2
            case_ok=0
        fi
    fi

    if [[ "$case_ok" -eq 1 ]]; then
        echo "PASS  $name ($path)"
        pass_count=$((pass_count + 1))
        RESULTS+=("$name|PASS")
    else
        fail_count=$((fail_count + 1))
        RESULTS+=("$name|FAIL")
    fi
done

echo
echo "verify-parity.sh: $pass_count passed, $fail_count failed, $skip_count skipped (of $case_count test cases)"

if [[ "$fail_count" -gt 0 ]]; then
    exit 1
fi
exit 0
