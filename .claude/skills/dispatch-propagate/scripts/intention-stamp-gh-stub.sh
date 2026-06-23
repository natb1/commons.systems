#!/usr/bin/env bash
# gh stub for test-intention-stamp.sh
# The real script passes repos/{owner}/{repo}/... with literal braces — gh would expand
# them from GH_REPO, but this stub receives the literal string. Match on substrings.
#
# Env vars that control LIST response:
#   STUB_EXISTING=1  → return one matching comment (author.id == DISPATCH_PLAN_AUTHOR_ID,
#                       body startswith marker)
#   STUB_MIDLINE=1   → return one comment whose body mentions the marker mid-body
#                       (NOT on line 1), author.id still 12345
#   (neither)        → return empty array []
#
# STUB_DIR must be set to a writable directory where POST/PATCH calls record
# posted-method.txt and posted-body.txt.

METHOD=""
URL=""
JQ_FILTER=""
FIELD_BODY_FILE=""
PAGINATE=0

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --method)   METHOD="$2"; shift 2 ;;
    --jq)       JQ_FILTER="$2"; shift 2 ;;
    --field)
      val="${2#body=@}"
      FIELD_BODY_FILE="$val"
      shift 2
      ;;
    --paginate) PAGINATE=1; shift ;;
    api)        shift ;;
    *)
      if [[ -z "$URL" ]]; then
        URL="$1"
      fi
      shift ;;
  esac
done

# ---- LIST comments (paginate, no method, URL ends with /comments not /comments/<id>) ----
if [[ $PAGINATE -eq 1 && -z "$METHOD" ]]; then
  if [[ "$URL" == */comments ]]; then
    if [[ "${STUB_EXISTING:-0}" == "1" ]]; then
      # Matching comment: body starts with the marker, author id matches.
      # Use JSON-escaped \n (two chars) so jq sees valid JSON, not raw control chars.
      printf '[{"id":777,"user":{"id":12345},"body":"<!-- intention:node-id -->\\nold-node\\n"}]\n'
    elif [[ "${STUB_MIDLINE:-0}" == "1" ]]; then
      # Comment body mentions marker mid-line — startswith should NOT match this.
      # Author id is 12345 (matching) so author is not the discriminator; only startswith is.
      printf '[{"id":888,"user":{"id":12345},"body":"some text <!-- intention:node-id --> here\\nstuff\\n"}]\n'
    else
      printf '[]\n'
    fi
    exit 0
  fi
fi

# ---- POST (create) ----
if [[ "$METHOD" == "POST" ]]; then
  if [[ "$URL" == */comments ]]; then
    printf '%s\n' "$METHOD" > "${STUB_DIR}/posted-method.txt"
    if [[ -n "$FIELD_BODY_FILE" ]]; then
      if [[ ! -f "$FIELD_BODY_FILE" ]]; then
        echo "stub: body file not found: $FIELD_BODY_FILE" >&2
        exit 1
      fi
      cp "$FIELD_BODY_FILE" "${STUB_DIR}/posted-body.txt"
    fi
    printf '{"id":777}\n'
    exit 0
  fi
fi

# ---- PATCH (update) ----
if [[ "$METHOD" == "PATCH" ]]; then
  if [[ "$URL" == */comments/* ]]; then
    printf '%s\n' "$METHOD" > "${STUB_DIR}/posted-method.txt"
    if [[ -n "$FIELD_BODY_FILE" ]]; then
      if [[ ! -f "$FIELD_BODY_FILE" ]]; then
        echo "stub: body file not found: $FIELD_BODY_FILE" >&2
        exit 1
      fi
      cp "$FIELD_BODY_FILE" "${STUB_DIR}/posted-body.txt"
    fi
    printf '{"id":777}\n'
    exit 0
  fi
fi

# ---- Single-comment GET (--read mode) ----
# gh api repos/{owner}/{repo}/issues/comments/<CID> [--jq <filter>]
if [[ -z "$METHOD" && $PAGINATE -eq 0 ]]; then
  if [[ "$URL" == */issues/comments/* ]]; then
    if [[ -n "$JQ_FILTER" ]]; then
      # Script uses: --jq '.body | split("\n")[1]'
      # Return the node-id directly since the stub can't run jq
      printf 'goal-foo\n'
    else
      printf '{"body":"<!-- intention:node-id -->\ngoal-foo\n"}\n'
    fi
    exit 0
  fi
fi

echo "stub: unhandled gh invocation: METHOD='$METHOD' URL='$URL' PAGINATE=$PAGINATE JQ='$JQ_FILTER'" >&2
exit 1
