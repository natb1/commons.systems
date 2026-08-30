#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)

# Design-system drift-prevention linter (issue #1878).
#
# Diff-scoped: only inspects net-new added lines in app-source CSS/TSX files
# against origin/main. App code must consume the design-system token vocabulary
# (packages/ds/tokens/) rather than re-deriving raw literals, which silently
# drift from the canonical scale. The design system itself (packages/ds/**) owns
# the literals, so it is excluded.
#
# Property-scoped detectors only — there is deliberately NO blanket [0-9]+px
# match. Each detector anchors on a specific property name so unrelated px
# values (borders, radii, breakpoints, transforms, offsets, custom props) are
# never reached. Escape hatch: any line containing `ds-lint-disable-line` is
# skipped (use `/* ds-lint-disable-line: <reason> */` for justified exceptions).

# ---------------------------------------------------------------------------
# Detector patterns (ERE). Tested with [[ "$content" =~ $RE ]].
# ---------------------------------------------------------------------------

# (a) Raw hex color: # followed by 3,4,6, or 8 hex digits used as a value.
#     Covers the var(--x, #hex) fallback form. The trailing boundary prevents a
#     7-hex match (no such CSS color) from masking a 6+1 case. url(...) and
#     data: URIs are carved out per-line before this is tested.
HEX_RE='#[0-9a-fA-F]{3,8}([^0-9a-fA-F]|$)'

# (b) font-size with a raw px value — CSS kebab and JSX camelCase.
#     A bare `0`/`0px`, or px on any other property, does not match. The
#     [0-9]*[1-9][0-9]*px clause requires a non-zero px magnitude, so `0px`
#     is exempt while `14px`/`10px` are flagged.
FONTSIZE_CSS_RE='font-size[[:space:]]*:[^;}]*[0-9]*[1-9][0-9]*px'
FONTSIZE_JSX_RE='fontSize[[:space:]]*:[^,}]*[0-9]*[1-9][0-9]*px'

# (c) font-weight whose value is off-scale. Allowed: 400, 700, normal, bold,
#     inherit, initial, unset, or var(--weight-...). Flag a bare disallowed
#     numeric weight (100/200/300/500/600/800/900). 400 and 700 do not match.
FONTWEIGHT_CSS_RE='font-weight[[:space:]]*:[[:space:]]*["'"'"']?(100|200|300|500|600|800|900)'
FONTWEIGHT_JSX_RE='fontWeight[[:space:]]*:[[:space:]]*["'"'"']?(100|200|300|500|600|800|900)'

# (d) Spacing props with a raw px value — margin/padding (incl. logical and
#     side variants), gap, row-gap, column-gap. Kebab (CSS) and camelCase (JSX).
#     Property names are anchored at a word boundary so `margin` does not match
#     inside `--margin-foo`, and only these property families are reached — so
#     border/outline/radius/breakpoint/transform/inset/custom-prop px values are
#     never tested. A `0` with no unit does not match.
#
#     Kebab: (^|[^-A-Za-z])(margin|padding)(-(top|right|bottom|left|block|inline)(-(start|end))?)?  or gap families
#     The [0-9]*[1-9][0-9]*px clause requires a non-zero px magnitude, so a
#     bare `0`/`0px` is exempt while `12px`/`10px` are flagged.
SPACING_CSS_RE='(^|[^-A-Za-z])(margin|padding)(-(top|right|bottom|left|block|inline)(-(start|end))?)?[[:space:]]*:[^;}]*[0-9]*[1-9][0-9]*px'
SPACING_GAP_CSS_RE='(^|[^-A-Za-z])(gap|row-gap|column-gap)[[:space:]]*:[^;}]*[0-9]*[1-9][0-9]*px'
#     CamelCase JSX: margin, marginTop/Right/Bottom/Left, marginBlock/Inline(Start/End), padding..., gap, rowGap, columnGap
SPACING_JSX_RE='(^|[^A-Za-z])(margin|padding)(Top|Right|Bottom|Left|Block|Inline)?((Start|End))?[[:space:]]*:[^,}]*[0-9]*[1-9][0-9]*px'
SPACING_GAP_JSX_RE='(^|[^A-Za-z])(gap|rowGap|columnGap)[[:space:]]*:[^,}]*[0-9]*[1-9][0-9]*px'

# Compute the unified-0 diff of added lines in CSS/TSX files against the
# resolved baseline. Run from REPO_ROOT so that relative paths in diff output
# are consistent.
#
# The baseline comes from resolve-diff-base.sh rather than being spelt
# `origin/main...HEAD` inline. --at-remote-tip first-parent because this linter
# runs on pushes to `main` too (run-lint.sh:132, inside the required `lint`
# job), where actions/checkout leaves origin/main pointing AT the pushed
# commit: the three-dot diff was then EMPTY and the linter reported a clean
# pass without inspecting a single line.
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
DIFF_BASE=$("$SCRIPTS/resolve-diff-base.sh" --repo-root "$REPO_ROOT" --at-remote-tip first-parent)
if ! DIFF=$(git -C "$REPO_ROOT" diff "$DIFF_BASE"..HEAD --unified=0 -- '*.css' '*.tsx'); then
  echo "ERROR: could not diff ${DIFF_BASE}..HEAD for *.css *.tsx files in $REPO_ROOT" >&2
  exit 1
fi

# Hunk header regex: @@ -a[,b] +c[,d] @@ ...
HUNK_RE='^@@ -[0-9]+(,[0-9]+)? \+([0-9]+)(,[0-9]+)? @@'

CURRENT_PATH=""
IN_SCOPE=0
LINE_NUM=0
VIOLATIONS=()

# Decide whether a diff path is an in-scope app-source CSS/TSX file.
# In scope iff: under a /src/ segment, ends in .css or .tsx, NOT under
# packages/ds/, and no path segment is an excluded dir.
path_in_scope() {
  local p="$1"
  case "$p" in
    *.css | *.tsx) ;;
    *) return 1 ;;
  esac
  case "$p" in
    packages/ds/*) return 1 ;;
  esac
  case "$p" in
    */src/* | src/*) ;;
    *) return 1 ;;
  esac
  # Exclude if any path segment is a non-source directory.
  local IFS='/'
  local seg
  for seg in $p; do
    case "$seg" in
      test | e2e | seeds | public | scripts | originals | dist | node_modules)
        return 1
        ;;
    esac
  done
  return 0
}

while IFS= read -r line; do
  # +++ header: new-file path (or /dev/null for deleted files)
  if [[ "$line" == '+++ '* ]]; then
    rest="${line#+++ }"
    if [[ "$rest" == '/dev/null' ]]; then
      CURRENT_PATH=""
      IN_SCOPE=0
    else
      CURRENT_PATH="${rest#b/}"
      if path_in_scope "$CURRENT_PATH"; then
        IN_SCOPE=1
      else
        IN_SCOPE=0
      fi
    fi
    LINE_NUM=0
    continue
  fi

  # --- header: ignore (marks old-file side)
  if [[ "$line" == '--- '* ]]; then
    continue
  fi

  # Hunk header: extract the new-side start line number
  if [[ "$line" =~ $HUNK_RE ]]; then
    LINE_NUM="${BASH_REMATCH[2]}"
    continue
  fi

  # Added content line: starts with + but NOT ++
  if [[ "$line" == '+'* ]] && [[ "$line" != '++'* ]]; then
    # Out-of-scope file: nothing to check; line-number tracking is irrelevant.
    if [[ "$IN_SCOPE" -ne 1 ]]; then
      continue
    fi

    content="${line:1}"

    # Pre-check 1: inline escape hatch anywhere on the line.
    if [[ "$content" == *ds-lint-disable-line* ]]; then
      LINE_NUM=$(( LINE_NUM + 1 ))
      continue
    fi

    # Pre-check 2: skip pure-comment lines (conservative — avoids flagging
    # hex/px inside comment prose). CSS /* ... */-only, mid-block `*`, or `//`.
    trimmed="${content#"${content%%[![:space:]]*}"}"
    if [[ "$trimmed" == //* ]] || [[ "$trimmed" == '*'* ]]; then
      LINE_NUM=$(( LINE_NUM + 1 ))
      continue
    fi
    if [[ "$trimmed" == '/*'* ]] && [[ "$trimmed" == *'*/' ]]; then
      LINE_NUM=$(( LINE_NUM + 1 ))
      continue
    fi

    # ----- Detectors -----

    # (a) Raw hex color — skip lines bearing url(...) or data: URIs.
    if [[ "$content" != *'url('* ]] && [[ "$content" != *'data:'* ]]; then
      if [[ "$content" =~ $HEX_RE ]]; then
        VIOLATIONS+=("${CURRENT_PATH}:${LINE_NUM}: [raw hex] ${content}")
      fi
    fi

    # (b) px font-size
    if [[ "$content" =~ $FONTSIZE_CSS_RE ]] || [[ "$content" =~ $FONTSIZE_JSX_RE ]]; then
      VIOLATIONS+=("${CURRENT_PATH}:${LINE_NUM}: [px font-size] ${content}")
    fi

    # (c) off-scale font-weight
    if [[ "$content" =~ $FONTWEIGHT_CSS_RE ]] || [[ "$content" =~ $FONTWEIGHT_JSX_RE ]]; then
      VIOLATIONS+=("${CURRENT_PATH}:${LINE_NUM}: [off-scale font-weight] ${content}")
    fi

    # (d) px spacing
    if [[ "$content" =~ $SPACING_CSS_RE ]] || [[ "$content" =~ $SPACING_GAP_CSS_RE ]] \
      || [[ "$content" =~ $SPACING_JSX_RE ]] || [[ "$content" =~ $SPACING_GAP_JSX_RE ]]; then
      VIOLATIONS+=("${CURRENT_PATH}:${LINE_NUM}: [px spacing] ${content}")
    fi

    LINE_NUM=$(( LINE_NUM + 1 ))
    continue
  fi

  # Everything else (diff headers, index lines, - lines): ignore.
  # Do not advance the new-side line counter for these.

done <<<"$DIFF"

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  echo "FAIL: design-system drift violations in net-new app CSS/TSX lines:" >&2
  for v in "${VIOLATIONS[@]}"; do
    echo "  $v" >&2
  done
  cat >&2 <<'REMEDIATION'

Remediation — app source must consume the design-system token vocabulary
(packages/ds/tokens/) instead of raw literals, which drift from the scale:

  [raw hex]            replace #rrggbb with a colors.css token,
                       e.g. var(--color-...) from packages/ds/tokens/colors.css
  [px font-size]       use a type-scale token, not a raw px value
  [off-scale weight]   font-weight must be 400/700, var(--weight-normal),
                       var(--weight-bold), or a keyword (normal/bold/inherit)
  [px spacing]         margin/padding/gap must use var(--space-0 .. --space-16)

Token vocabulary: packages/ds/tokens/ — --space-* (spacing scale),
--weight-normal (400) / --weight-bold (700), colors.css color tokens.

Escape hatch: for a documented, justified literal exception, add
`/* ds-lint-disable-line: <reason> */` (or the // form in TSX) on the line.
The design system itself (packages/ds/**) is exempt — it owns the literals.
REMEDIATION
  exit 1
fi

echo "PASS: no net-new design-system drift in added app CSS/TSX lines"
