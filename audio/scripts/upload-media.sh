#!/usr/bin/env bash
# Upload an audio file to GCS and create the corresponding Firestore document.
# Parses audio metadata via ffprobe to populate metadata fields automatically.
# Targets the commons-systems production project and bucket. No dry-run or staging mode.
# Usage: upload-media.sh <file> [--public | --group <groupId>]
set -euo pipefail

BUCKET="gs://commons-systems.firebasestorage.app"
PROJECT="commons-systems"
COLLECTION_PATH="audio/prod/media"
GROUPS_PATH="audio/prod/groups"

CLEANUP_FILES=()
cleanup() { rm -f "${CLEANUP_FILES[@]}"; }
trap cleanup EXIT

usage() {
  cat >&2 <<EOF
Usage: upload-media.sh <file> [--public | --group <groupId>]

Arguments:
  file        Local audio file path (mp3, m4a, flac, ogg, wav)

Mode (pick one):
  --public              Mark as public domain
  --group <groupId>     Restrict to members of a Firestore group
EOF
  exit 1
}

for cmd in ffprobe gsutil gcloud curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: required command not found: $cmd" >&2
    exit 1
  fi
done

if [ $# -lt 2 ]; then
  usage
fi

FILE_PATH="$1"
shift

if [ ! -f "$FILE_PATH" ]; then
  echo "error: file not found: ${FILE_PATH}" >&2
  exit 1
fi

# Validate audio file extension
FILENAME="$(basename "$FILE_PATH")"
EXT="${FILENAME##*.}"
EXT_LOWER="$(echo "$EXT" | tr '[:upper:]' '[:lower:]')"

case "$EXT_LOWER" in
  mp3) FORMAT="mp3" ;;
  m4a) FORMAT="m4a" ;;
  flac) FORMAT="flac" ;;
  ogg) FORMAT="ogg" ;;
  wav) FORMAT="wav" ;;
  *)
    echo "error: unsupported audio format: .${EXT} (must be mp3, m4a, flac, ogg, or wav)" >&2
    exit 1
    ;;
esac

# Parse mode: --public or --group <groupId>
PUBLIC=false
GROUP_ID=""

if [ "$1" = "--public" ]; then
  PUBLIC=true
  shift
  if [ $# -gt 0 ]; then
    echo "error: --public does not accept additional arguments" >&2
    usage
  fi
elif [ "$1" = "--group" ]; then
  shift
  if [ $# -eq 0 ]; then
    echo "error: --group requires a group ID argument" >&2
    usage
  fi
  GROUP_ID="$1"
  shift
  if [ $# -gt 0 ]; then
    echo "error: --group accepts only one argument" >&2
    usage
  fi
else
  echo "error: must specify --public or --group <groupId>" >&2
  usage
fi

# Extract metadata via ffprobe
echo "Parsing audio metadata..."
PROBE_JSON="$(ffprobe -v quiet -print_format json -show_format "$FILE_PATH")"

if ! echo "$PROBE_JSON" | jq -e '.format' >/dev/null 2>&1; then
  echo "error: ffprobe returned no format data for ${FILE_PATH}" >&2
  echo "The file may be corrupt or not a recognized audio format." >&2
  exit 1
fi

TITLE="$(echo "$PROBE_JSON" | jq -r '.format.tags.title // empty')"
if [ -z "$TITLE" ]; then
  TITLE="${FILENAME%.*}"
  echo "warning: no title tag found, using filename: ${TITLE}" >&2
fi

ARTIST="$(echo "$PROBE_JSON" | jq -r '.format.tags.artist // empty')"
ALBUM="$(echo "$PROBE_JSON" | jq -r '.format.tags.album // empty')"
GENRE="$(echo "$PROBE_JSON" | jq -r '.format.tags.genre // empty')"
DURATION="$(echo "$PROBE_JSON" | jq -r '.format.duration // empty')"

if [ -z "$DURATION" ]; then
  echo "error: ffprobe could not determine duration for ${FILE_PATH}" >&2
  exit 1
fi

# Parse track number (handles "3/12" format)
RAW_TRACK="$(echo "$PROBE_JSON" | jq -r '.format.tags.track // empty')"
if [ -n "$RAW_TRACK" ]; then
  TRACK_NUMBER="$(echo "$RAW_TRACK" | sed 's|/.*||' | grep -o '[0-9]*' | head -1)"
else
  TRACK_NUMBER=""
fi

# Parse year (extract 4-digit year from date tag)
RAW_DATE="$(echo "$PROBE_JSON" | jq -r '.format.tags.date // empty')"
if [ -z "$RAW_DATE" ]; then
  RAW_DATE="$(echo "$PROBE_JSON" | jq -r '.format.tags.TDRC // empty')"
fi
if [ -n "$RAW_DATE" ]; then
  YEAR="$(echo "$RAW_DATE" | grep -o '[0-9]\{4\}' | head -1)"
else
  YEAR=""
fi

echo "  Title: ${TITLE}"
echo "  Artist: ${ARTIST:-<none>}"
echo "  Album: ${ALBUM:-<none>}"
echo "  Track: ${TRACK_NUMBER:-<none>}"
echo "  Genre: ${GENRE:-<none>}"
echo "  Year: ${YEAR:-<none>}"
echo "  Duration: ${DURATION}s"
echo "  Format: ${FORMAT}"

# Get auth token early
if ! TOKEN="$(gcloud auth print-access-token 2>&1)"; then
  echo "error: failed to get auth token. Run 'gcloud auth login' first." >&2
  exit 1
fi

# Resolve group members if in group mode
EMAILS=()
if [ -n "$GROUP_ID" ]; then
  GROUPS_URL="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${GROUPS_PATH}/${GROUP_ID}"
  GROUP_RESP_FILE=$(mktemp)
  CLEANUP_FILES+=("$GROUP_RESP_FILE")
  GROUP_HTTP=$(curl -sS -o "$GROUP_RESP_FILE" -w '%{http_code}' "$GROUPS_URL" \
    --config <(echo "header = \"Authorization: Bearer ${TOKEN}\""))

  if [ "$GROUP_HTTP" -lt 200 ] || [ "$GROUP_HTTP" -ge 300 ]; then
    echo "error: group '${GROUP_ID}' not found (HTTP ${GROUP_HTTP})" >&2
    exit 1
  fi

  GROUP_DOC=$(cat "$GROUP_RESP_FILE")

  MEMBER_LIST=$(echo "$GROUP_DOC" | jq -r '.fields.members.arrayValue.values[]?.stringValue // empty')
  if [ -z "$MEMBER_LIST" ]; then
    echo "error: group '${GROUP_ID}' has no members" >&2
    exit 1
  fi

  while IFS= read -r email; do
    EMAILS+=("$email")
  done <<< "$MEMBER_LIST"
fi

GCS_DEST="${BUCKET}/${COLLECTION_PATH}/${FILENAME}"
ADDED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Check for existing object at destination
if STAT_OUTPUT=$(gsutil stat "$GCS_DEST" 2>&1); then
  echo "error: object already exists at ${GCS_DEST}" >&2
  echo "Rename the file or remove the existing object: gsutil rm ${GCS_DEST}" >&2
  exit 1
fi
if ! echo "$STAT_OUTPUT" | grep -q "No URLs matched"; then
  echo "error: could not verify object status at ${GCS_DEST}:" >&2
  echo "$STAT_OUTPUT" >&2
  exit 1
fi

# Upload file to GCS with metadata
echo ""
echo "Uploading ${FILENAME} to GCS..."
META_ARGS=()
if [ "$PUBLIC" = true ]; then
  META_ARGS+=(-h "x-goog-meta-publicDomain:true")
else
  META_ARGS+=(-h "x-goog-meta-publicDomain:false")
  META_ARGS+=(-h "x-goog-meta-groupId:${GROUP_ID}")
fi
for i in "${!EMAILS[@]}"; do
  META_ARGS+=(-h "x-goog-meta-member_${i}:${EMAILS[$i]}")
done
gsutil "${META_ARGS[@]}" cp "$FILE_PATH" "$GCS_DEST"

# Verify GCS upload
echo ""
echo "=== GCS Object ==="
gsutil stat "$GCS_DEST"

# Build Firestore document JSON
echo ""
echo "Creating Firestore document..."

# Build memberEmails array
if [ ${#EMAILS[@]} -eq 0 ]; then
  MEMBER_JSON="[]"
else
  MEMBER_JSON=$(printf '%s\n' "${EMAILS[@]}" | jq -R '{ stringValue: . }' | jq -s '.')
fi

# Build groupId field
if [ -n "$GROUP_ID" ]; then
  GROUP_JSON=$(jq -n --arg gid "$GROUP_ID" '{ stringValue: $gid }')
else
  GROUP_JSON='{ "nullValue": null }'
fi

# Build trackNumber field
if [ -n "$TRACK_NUMBER" ]; then
  TRACK_JSON=$(jq -n --arg t "$TRACK_NUMBER" '{ integerValue: $t }')
else
  TRACK_JSON='{ "nullValue": null }'
fi

# Build year field
if [ -n "$YEAR" ]; then
  YEAR_JSON=$(jq -n --arg y "$YEAR" '{ integerValue: $y }')
else
  YEAR_JSON='{ "nullValue": null }'
fi

FIRESTORE_BODY=$(jq -n \
  --arg title "$TITLE" \
  --arg artist "$ARTIST" \
  --arg album "$ALBUM" \
  --arg genre "$GENRE" \
  --arg duration "$DURATION" \
  --arg format "$FORMAT" \
  --argjson publicDomain "$PUBLIC" \
  --arg storagePath "media/${FILENAME}" \
  --arg addedAt "$ADDED_AT" \
  --arg sourceNotes "" \
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
      format: { stringValue: $format },
      publicDomain: { booleanValue: $publicDomain },
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
  echo "error: Firestore API returned HTTP ${HTTP_CODE}:" >&2
  cat "$RESP_FILE" >&2
  echo "" >&2
  echo "The file was uploaded to GCS at: ${GCS_DEST}" >&2
  echo "To clean up: gsutil rm ${GCS_DEST}" >&2
  exit 1
fi

RESPONSE=$(cat "$RESP_FILE")

DOC_ID=$(echo "$RESPONSE" | jq -r '.name | split("/") | last')
if [ -z "$DOC_ID" ] || [ "$DOC_ID" = "null" ]; then
  echo "error: unexpected Firestore response — could not extract document ID" >&2
  echo "Raw response: $RESPONSE" >&2
  exit 1
fi

echo ""
echo "=== Firestore Document ==="
echo "Document ID: ${DOC_ID}"
echo "Path: ${COLLECTION_PATH}/${DOC_ID}"
echo ""
echo "Done."
