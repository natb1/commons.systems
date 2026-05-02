#!/usr/bin/env bash
# Upload an audio file to GCS and create the corresponding Firestore document.
# Parses audio metadata via ffprobe to populate metadata fields automatically.
# Targets the commons-systems production project and bucket. No dry-run or staging mode.
# Usage: upload-media.sh <file> [--public | --group <groupId>]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../../scaffolding/scripts/upload-media-core.sh
source "$SCRIPT_DIR/../../scaffolding/scripts/upload-media-core.sh"

BUCKET="gs://commons-systems.firebasestorage.app"
PROJECT="commons-systems"
COLLECTION_PATH="audio/prod/media"
GROUPS_PATH="audio/prod/groups"

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

# ffprobe is audio-specific; the rest are required by the shared core.
if ! command -v ffprobe >/dev/null 2>&1; then
  echo "error: required command not found: ffprobe" >&2
  exit 1
fi
core::require_tools gsutil gcloud curl jq

if [ $# -lt 2 ]; then
  usage
fi

FILE_PATH="$1"
shift

if [ ! -f "$FILE_PATH" ]; then
  echo "error: file not found: ${FILE_PATH}" >&2
  exit 1
fi

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

echo "  Title: ${TITLE}"
echo "  Artist: ${ARTIST:-<none>}"
echo "  Album: ${ALBUM:-<none>}"
echo "  Track: ${TRACK_NUMBER:-<none>}"
echo "  Genre: ${GENRE:-<none>}"
echo "  Year: ${YEAR:-<none>}"
echo "  Duration: ${DURATION}s"
echo "  Format: ${FORMAT}"

TOKEN="$(core::get_auth_token)"

declare -a EMAILS=()
if [ -n "$GROUP_ID" ]; then
  # Use command substitution (not process substitution) so a non-zero exit
  # inside core::lookup_group_members propagates to this script via set -e.
  # Process substitution would mask the failure: mapfile would return 0 and
  # leave EMAILS empty, hiding the error.
  MEMBER_LIST="$(core::lookup_group_members "$PROJECT" "$GROUPS_PATH" "$GROUP_ID" "$TOKEN")"
  mapfile -t EMAILS <<< "$MEMBER_LIST"
fi

GCS_DEST="${BUCKET}/${COLLECTION_PATH}/${FILENAME}"
ADDED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

core::check_gcs_no_collision "$GCS_DEST"

echo ""
echo "Uploading ${FILENAME} to GCS..."
core::upload_to_gcs "$GCS_DEST" "$FILE_PATH" "$PUBLIC" "$GROUP_ID" EMAILS

echo ""
echo "=== GCS Object ==="
gsutil stat "$GCS_DEST"

echo ""
echo "Creating Firestore document..."

if [ ${#EMAILS[@]} -eq 0 ]; then
  MEMBER_JSON="[]"
else
  MEMBER_JSON=$(printf '%s\n' "${EMAILS[@]}" | jq -R '{ stringValue: . }' | jq -s '.')
fi

if [ -n "$GROUP_ID" ]; then
  GROUP_JSON=$(jq -n --arg gid "$GROUP_ID" '{ stringValue: $gid }')
else
  GROUP_JSON='{ "nullValue": null }'
fi

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

RESPONSE=$(core::create_firestore_doc "$PROJECT" "$COLLECTION_PATH" "$TOKEN" "$FIRESTORE_BODY" "$GCS_DEST")
DOC_ID=$(core::extract_doc_id "$RESPONSE")

echo ""
echo "=== Firestore Document ==="
echo "Document ID: ${DOC_ID}"
echo "Path: ${COLLECTION_PATH}/${DOC_ID}"
echo ""
echo "Done."
