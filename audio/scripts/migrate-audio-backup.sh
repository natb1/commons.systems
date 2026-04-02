#!/usr/bin/env bash
# One-time migration: copy ~1,544 MP3 files from the rml-media backup bucket to the
# audio app's production storage and create corresponding Firestore documents.
# Creates a private group and assigns all items to it.
# Usage: migrate-audio-backup.sh [--dry-run] [--progress-file <path>]
set -euo pipefail

SOURCE_BUCKET="gs://rml-media/audio-backup-20251117-121224"
DEST_BUCKET="gs://commons-systems.firebasestorage.app"
PROJECT="commons-systems"
COLLECTION_PATH="audio/prod/media"
GROUPS_PATH="audio/prod/groups"
GROUP_ID="rml-private"
MEMBERS=("nathan@natb1.com" "lwebb7@jhmi.edu")
TOKEN_REFRESH_INTERVAL=50

DRY_RUN=false
PROGRESS_FILE="migrate-progress.log"

CLEANUP_FILES=()
cleanup() { rm -f "${CLEANUP_FILES[@]}"; }
trap cleanup EXIT

usage() {
  cat >&2 <<EOF
Usage: migrate-audio-backup.sh [--dry-run] [--progress-file <path>]

Options:
  --dry-run               Validate without uploading or creating documents
  --progress-file <path>  Track completed files for resumability (default: migrate-progress.log)
EOF
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --progress-file)
      shift
      if [ $# -eq 0 ]; then
        echo "error: --progress-file requires a path argument" >&2
        usage
      fi
      PROGRESS_FILE="$1"
      shift
      ;;
    *) echo "error: unknown argument: $1" >&2; usage ;;
  esac
done

for cmd in ffprobe gsutil gcloud curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: required command not found: $cmd" >&2
    exit 1
  fi
done

refresh_token() {
  if ! TOKEN="$(gcloud auth print-access-token 2>&1)"; then
    echo "error: failed to get auth token. Run 'gcloud auth login' first." >&2
    exit 1
  fi
}

# --- Auth ---
refresh_token

# --- Group setup ---
echo "Checking group '${GROUP_ID}'..."
GROUP_URL="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${GROUPS_PATH}/${GROUP_ID}"
GROUP_RESP_FILE=$(mktemp)
CLEANUP_FILES+=("$GROUP_RESP_FILE")
GROUP_HTTP=$(curl -sS -o "$GROUP_RESP_FILE" -w '%{http_code}' "$GROUP_URL" \
  --config <(echo "header = \"Authorization: Bearer ${TOKEN}\""))

if [ "$GROUP_HTTP" -ge 200 ] && [ "$GROUP_HTTP" -lt 300 ]; then
  echo "Group '${GROUP_ID}' already exists."
elif [ "$GROUP_HTTP" = "404" ]; then
  echo "Creating group '${GROUP_ID}'..."
  MEMBER_VALUES=$(printf '%s\n' "${MEMBERS[@]}" | jq -R '{ stringValue: . }' | jq -s '.')
  GROUP_BODY=$(jq -n \
    --arg name "$GROUP_ID" \
    --argjson members "$MEMBER_VALUES" \
    '{
      fields: {
        name: { stringValue: $name },
        members: { arrayValue: { values: $members } }
      }
    }')

  if [ "$DRY_RUN" = true ]; then
    echo "[dry-run] Would create group with body:"
    echo "$GROUP_BODY" | jq .
  else
    CREATE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${GROUPS_PATH}?documentId=${GROUP_ID}"
    CREATE_RESP_FILE=$(mktemp)
    CLEANUP_FILES+=("$CREATE_RESP_FILE")
    CREATE_HTTP=$(curl -sS -o "$CREATE_RESP_FILE" -w '%{http_code}' -X POST "$CREATE_URL" \
      --config <(echo "header = \"Authorization: Bearer ${TOKEN}\"") \
      -H "Content-Type: application/json" \
      -d "$GROUP_BODY")
    if [ "$CREATE_HTTP" -lt 200 ] || [ "$CREATE_HTTP" -ge 300 ]; then
      echo "error: failed to create group (HTTP ${CREATE_HTTP}):" >&2
      cat "$CREATE_RESP_FILE" >&2
      exit 1
    fi
    echo "Group '${GROUP_ID}' created."
  fi
else
  echo "error: unexpected response checking group (HTTP ${GROUP_HTTP}):" >&2
  cat "$GROUP_RESP_FILE" >&2
  exit 1
fi

# --- List source files ---
echo ""
echo "Listing source files..."
SOURCE_LIST=$(gsutil ls -r "${SOURCE_BUCKET}/**" 2>&1 | grep -i '\.mp3$' || true)

if [ -z "$SOURCE_LIST" ]; then
  echo "error: no MP3 files found in ${SOURCE_BUCKET}" >&2
  exit 1
fi

FILE_COUNT=$(echo "$SOURCE_LIST" | wc -l | tr -d ' ')
echo "Found ${FILE_COUNT} MP3 files."

# --- Compute flat names and check for collisions ---
declare -A FLAT_MAP
DUPLICATES=()

while IFS= read -r src_path; do
  # Extract path relative to source bucket prefix
  rel_path="${src_path#${SOURCE_BUCKET}/}"

  # Split into Artist/Album/Track.mp3
  IFS='/' read -r artist album track_file <<< "$rel_path"

  if [ -z "$artist" ] || [ -z "$album" ] || [ -z "$track_file" ]; then
    echo "warning: skipping malformed path: ${src_path}" >&2
    continue
  fi

  flat_name="${artist} - ${album} - ${track_file}"

  if [ -n "${FLAT_MAP[$flat_name]+x}" ]; then
    DUPLICATES+=("$flat_name")
    echo "warning: duplicate flat name '${flat_name}', skipping ${src_path}" >&2
    continue
  fi

  FLAT_MAP["$flat_name"]="$src_path"
done <<< "$SOURCE_LIST"

if [ ${#DUPLICATES[@]} -gt 0 ]; then
  echo "warning: ${#DUPLICATES[@]} duplicate flat name(s) skipped." >&2
fi

UNIQUE_COUNT=${#FLAT_MAP[@]}
echo "${UNIQUE_COUNT} unique files to process."

# --- Load progress file ---
touch "$PROGRESS_FILE"
COMPLETED_COUNT=0
while IFS= read -r line; do
  if [ -n "$line" ]; then
    COMPLETED_COUNT=$((COMPLETED_COUNT + 1))
  fi
done < "$PROGRESS_FILE"
if [ "$COMPLETED_COUNT" -gt 0 ]; then
  echo "${COMPLETED_COUNT} files already completed (from progress file)."
fi

# --- Build member JSON and metadata args ---
MEMBER_JSON=$(printf '%s\n' "${MEMBERS[@]}" | jq -R '{ stringValue: . }' | jq -s '.')
GROUP_JSON=$(jq -n --arg gid "$GROUP_ID" '{ stringValue: $gid }')
META_ARGS=(-h "x-goog-meta-publicDomain:false" -h "x-goog-meta-groupId:${GROUP_ID}")
for i in "${!MEMBERS[@]}"; do
  META_ARGS+=(-h "x-goog-meta-member_${i}:${MEMBERS[$i]}")
done

# --- Process files ---
echo ""
UPLOADED=0
SKIPPED=0
FAILED=0
PROCESSED=0

for flat_name in "${!FLAT_MAP[@]}"; do
  src_path="${FLAT_MAP[$flat_name]}"

  # Skip if already in progress file
  if grep -qFx "$flat_name" "$PROGRESS_FILE" 2>/dev/null; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  PROCESSED=$((PROCESSED + 1))

  # Token refresh
  if [ $((PROCESSED % TOKEN_REFRESH_INTERVAL)) -eq 0 ]; then
    echo "Refreshing auth token..."
    refresh_token
  fi

  echo "[${PROCESSED}] ${flat_name}"

  # Extract original track filename for title fallback
  track_file="${flat_name##* - }"

  GCS_DEST="${DEST_BUCKET}/${COLLECTION_PATH}/${flat_name}"
  ADDED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  if [ "$DRY_RUN" = true ]; then
    echo "  [dry-run] Would copy ${src_path} -> ${GCS_DEST}"
    continue
  fi

  # Download to temp
  TMPFILE=$(mktemp "${TMPDIR:-/tmp}/migrate-XXXXXX.mp3")
  CLEANUP_FILES+=("$TMPFILE")

  if ! gsutil cp "$src_path" "$TMPFILE" >/dev/null 2>&1; then
    echo "  error: failed to download ${src_path}" >&2
    FAILED=$((FAILED + 1))
    rm -f "$TMPFILE"
    continue
  fi

  # Extract ID3 metadata via ffprobe
  PROBE_JSON="$(ffprobe -v quiet -print_format json -show_format "$TMPFILE")"

  if ! echo "$PROBE_JSON" | jq -e '.format' >/dev/null 2>&1; then
    echo "  warning: ffprobe returned no format data, skipping" >&2
    FAILED=$((FAILED + 1))
    rm -f "$TMPFILE"
    continue
  fi

  TITLE="$(echo "$PROBE_JSON" | jq -r '.format.tags.title // empty')"
  if [ -z "$TITLE" ]; then
    TITLE="${track_file%.*}"
  fi

  ARTIST="$(echo "$PROBE_JSON" | jq -r '.format.tags.artist // empty')"
  ALBUM="$(echo "$PROBE_JSON" | jq -r '.format.tags.album // empty')"
  GENRE="$(echo "$PROBE_JSON" | jq -r '.format.tags.genre // empty')"
  DURATION="$(echo "$PROBE_JSON" | jq -r '.format.duration // empty')"

  if [ -z "$DURATION" ]; then
    echo "  warning: no duration found, skipping" >&2
    FAILED=$((FAILED + 1))
    rm -f "$TMPFILE"
    continue
  fi

  # Parse track number (handles "3/12" format)
  RAW_TRACK="$(echo "$PROBE_JSON" | jq -r '.format.tags.track // empty')"
  if [ -n "$RAW_TRACK" ]; then
    TRACK_NUMBER="$(echo "$RAW_TRACK" | sed 's|/.*||' | grep -o '[0-9]*' | head -1)"
  else
    TRACK_NUMBER=""
  fi

  # Parse year (extract 4-digit year from date or TDRC tag)
  RAW_DATE="$(echo "$PROBE_JSON" | jq -r '.format.tags.date // empty')"
  if [ -z "$RAW_DATE" ]; then
    RAW_DATE="$(echo "$PROBE_JSON" | jq -r '.format.tags.TDRC // empty')"
  fi
  if [ -n "$RAW_DATE" ]; then
    YEAR="$(echo "$RAW_DATE" | grep -o '[0-9]\{4\}' | head -1)"
  else
    YEAR=""
  fi

  # Check if dest object already exists (resume case)
  DEST_EXISTS=false
  if gsutil stat "$GCS_DEST" >/dev/null 2>&1; then
    DEST_EXISTS=true
    echo "  GCS object exists, skipping upload"
  fi

  # Upload to dest with metadata
  if [ "$DEST_EXISTS" = false ]; then
    if ! gsutil "${META_ARGS[@]}" cp "$TMPFILE" "$GCS_DEST" >/dev/null 2>&1; then
      echo "  error: failed to upload to ${GCS_DEST}" >&2
      FAILED=$((FAILED + 1))
      rm -f "$TMPFILE"
      continue
    fi
  fi

  rm -f "$TMPFILE"

  # Build Firestore JSON
  if [ -n "$TRACK_NUMBER" ]; then
    TRACK_JSON=$(jq -n --arg t "$TRACK_NUMBER" '{ integerValue: $t }')
  else
    TRACK_JSON='{ "nullValue": null }'
  fi

  if [ -n "$YEAR" ]; then
    YEAR_JSON=$(jq -n --arg y "$YEAR" '{ integerValue: $y }')
  else
    YEAR_JSON='{ "nullValue": null }'
  fi

  rel_path="${src_path#${SOURCE_BUCKET}/}"

  FIRESTORE_BODY=$(jq -n \
    --arg title "$TITLE" \
    --arg artist "$ARTIST" \
    --arg album "$ALBUM" \
    --arg genre "$GENRE" \
    --arg duration "$DURATION" \
    --arg storagePath "media/${flat_name}" \
    --arg addedAt "$ADDED_AT" \
    --arg sourceNotes "Migrated from ${SOURCE_BUCKET}/${rel_path}" \
    --argjson memberValues "$MEMBER_JSON" \
    --argjson groupId "$GROUP_JSON" \
    --argjson trackNumber "$TRACK_JSON" \
    --argjson year "$YEAR_JSON" \
    '{
      fields: {
        title: { stringValue: $title },
        artist: { stringValue: $artist },
        album: { stringValue: $album },
        trackNumber: $trackNumber,
        genre: { stringValue: $genre },
        year: $year,
        duration: { doubleValue: ($duration | tonumber) },
        format: { stringValue: "mp3" },
        publicDomain: { booleanValue: false },
        sourceNotes: { stringValue: $sourceNotes },
        storagePath: { stringValue: $storagePath },
        groupId: $groupId,
        memberEmails: { arrayValue: { values: $memberValues } },
        addedAt: { stringValue: $addedAt }
      }
    }')

  FIRESTORE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${COLLECTION_PATH}"
  RESP_FILE=$(mktemp)
  CLEANUP_FILES+=("$RESP_FILE")
  HTTP_CODE=$(curl -sS -o "$RESP_FILE" -w '%{http_code}' -X POST "$FIRESTORE_URL" \
    --config <(echo "header = \"Authorization: Bearer ${TOKEN}\"") \
    -H "Content-Type: application/json" \
    -d "$FIRESTORE_BODY")

  if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
    echo "  error: Firestore API returned HTTP ${HTTP_CODE}" >&2
    FAILED=$((FAILED + 1))
    continue
  fi

  echo "$flat_name" >> "$PROGRESS_FILE"
  UPLOADED=$((UPLOADED + 1))
done

echo ""
echo "================================"
echo "Migration complete"
echo "  Found:    ${FILE_COUNT}"
echo "  Unique:   ${UNIQUE_COUNT}"
echo "  Uploaded: ${UPLOADED}"
echo "  Skipped:  ${SKIPPED} (already in progress file)"
echo "  Failed:   ${FAILED}"
echo "================================"

if [ "$FAILED" -gt 0 ]; then
  echo "Re-run to retry failed files."
  exit 1
fi
