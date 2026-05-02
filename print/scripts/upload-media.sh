#!/usr/bin/env bash
# Upload a media file to GCS and create the corresponding Firestore document.
# Targets the commons-systems production project and bucket. No dry-run or staging mode.
# Usage: upload-media.sh <file> <title> <mediaType> [--public | --group <groupId>]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../../scaffolding/scripts/upload-media-core.sh
source "$SCRIPT_DIR/../../scaffolding/scripts/upload-media-core.sh"

BUCKET="gs://commons-systems.firebasestorage.app"
PROJECT="commons-systems"
COLLECTION_PATH="print/prod/media"
GROUPS_PATH="print/prod/groups"

usage() {
  cat >&2 <<EOF
Usage: upload-media.sh <file> <title> <mediaType> [--public | --group <groupId>]

Arguments:
  file        Local file path to upload
  title       Display title for the media item
  mediaType   One of: epub, pdf, image-archive

Mode (pick one):
  --public              Mark as public domain
  --group <groupId>     Restrict to members of a Firestore group
EOF
  exit 1
}

core::require_tools gsutil gcloud curl jq

if [ $# -lt 3 ]; then
  usage
fi

FILE_PATH="$1"
TITLE="$2"
MEDIA_TYPE="$3"
shift 3

if [ ! -f "$FILE_PATH" ]; then
  echo "error: file not found: ${FILE_PATH}" >&2
  exit 1
fi

case "$MEDIA_TYPE" in
  epub|pdf|image-archive) ;;
  *)
    echo "error: invalid mediaType: ${MEDIA_TYPE} (must be epub, pdf, or image-archive)" >&2
    exit 1
    ;;
esac

# Parse mode: --public or --group <groupId>
PUBLIC=false
GROUP_ID=""

if [ $# -eq 0 ]; then
  echo "error: must specify --public or --group <groupId>" >&2
  usage
fi

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

FILENAME="$(basename "$FILE_PATH")"
GCS_DEST="${BUCKET}/${COLLECTION_PATH}/${FILENAME}"
ADDED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

core::check_gcs_no_collision "$GCS_DEST"

echo "Uploading ${FILENAME} to GCS..."
core::upload_to_gcs "$GCS_DEST" "$FILE_PATH" "$PUBLIC" "$GROUP_ID" EMAILS

echo ""
echo "=== GCS Object ==="
gsutil stat "$GCS_DEST"

echo ""
echo "Creating Firestore document..."

# Build memberEmails array as JSON via jq
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

FIRESTORE_BODY=$(jq -n \
  --arg title "$TITLE" \
  --arg mediaType "$MEDIA_TYPE" \
  --argjson publicDomain "$PUBLIC" \
  --arg storagePath "media/${FILENAME}" \
  --arg addedAt "$ADDED_AT" \
  --argjson memberValues "$MEMBER_JSON" \
  --argjson groupId "$GROUP_JSON" \
  '{
    fields: {
      title: { stringValue: $title },
      mediaType: { stringValue: $mediaType },
      tags: { mapValue: { fields: {} } },
      publicDomain: { booleanValue: $publicDomain },
      sourceNotes: { stringValue: "" },
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
