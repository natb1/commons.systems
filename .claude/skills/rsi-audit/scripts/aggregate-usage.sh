#!/usr/bin/env bash
# Token-usage aggregation for the /rsi-audit skill (#1177).
#
# This is the mechanical, token-heavy parsing layer. It scans Claude session
# transcripts within a time window and emits ONE structured JSON document that
# the skill's SKILL.md interprets — so the model reads compact aggregates, never
# the raw transcripts.
#
# WHAT IT SCANS
#   Projects root (default $HOME/.claude/projects, overridable via
#   DISPATCH_AUDIT_PROJECTS_ROOT) contains per-project directories, each named
#   after its session's cwd with `/` and `.` rewritten to `-`. A directory is
#   scanned when its name is EXACTLY $PROJECT_PREFIX, or begins with
#   "$PROJECT_PREFIX-". $PROJECT_PREFIX is that same encoding applied to this
#   repo's MAIN root (see DISPATCH_AUDIT_PROJECT_PREFIX below), so three shapes
#   are in scope:
#     - the MAIN-checkout dir, whose name is exactly the prefix
#     - the router/heartbeat dir, "<prefix>--bare"
#     - each worktree dir, "<prefix>--claude-worktrees-<name>"
#   The `-` in the second predicate is load-bearing. A bare startswith would
#   also swallow a neighbouring project whose encoded path merely has this one
#   as a substring; with the separator, "-home-n8-commons-systems" and
#   "-home-n8" stay out.
#
#   The MAIN-checkout dir is deliberately IN SCOPE. dispatch-ladder-run and
#   dispatch-graph-execute spawn the /rsi phase evaluations and the align
#   phases with `--cwd $PROJECT_ROOT`, so those transcripts land in the
#   main-checkout project dir. The superseded predicate matched only
#   *worktrees* and *--bare, so every such transcript was invisible at every
#   scope in every window — an undercount that read as a quiet window.
#   Session files are <projectdir>/<sessionid>.jsonl. Subagent transcripts nest at
#   <projectdir>/<sessionid>/subagents/agent-*.jsonl (their agent-*.meta.json
#   companions are NOT transcripts and are skipped — only *.jsonl is parsed). A
#   recursive find for *.jsonl picks up both top-level and subagent transcripts.
#
# USAGE
#   aggregate-usage.sh [--days N | --day YYYY-MM-DD] [--json-out PATH]
#                      [--exclude-sidecar-sessions] [--session ID | --node ID]
#     --days N        window in days (default 7); files with mtime newer than
#                     "N days ago" are scanned. N must be a positive integer.
#     --day YYYY-MM-DD  scan a single UTC calendar day [day 00:00:00, day+1
#                     00:00:00). Mutually exclusive with --days.
#     --json-out PATH write the document to PATH instead of stdout.
#     --exclude-sidecar-sessions  opt-in (default off): skip any transcript whose
#                     sibling <stem>.file-issue-attribution.json exists, dropping
#                     that file-issue session from every bucket. The session's
#                     nested subagent transcripts (<sid>/subagents/agent-*.jsonl)
#                     are dropped with it — the sidecar totals already include
#                     subagent usage, so scanning them would double-count.
#     --session ID    scope to exactly one session: the transcript whose
#                     filename stem is ID, plus its nested subagent transcripts
#                     (<ID>/subagents/agent-*.jsonl). Mutually exclusive with
#                     --node. With no explicit --day/--days, the mtime window
#                     is UNBOUNDED rather than the --days default — see
#                     BEHAVIOR CONTRACT. The Firestore persist path
#                     (DISPATCH_AUDIT_AGGREGATES_ENABLED) is unconditionally
#                     skipped for a scoped run — see BEHAVIOR CONTRACT.
#     --node ID       scope to one node: every session whose sibling
#                     <stem>.dispatch-stamp.json carries node_id==ID, plus
#                     each matched session's nested subagent transcripts
#                     (which have no sidecar of their own). Mutually
#                     exclusive with --session. Same unbounded-window and
#                     no-persist behavior as --session — see BEHAVIOR
#                     CONTRACT.
#   DISPATCH_AUDIT_PROJECTS_ROOT  override the projects root (used by the test
#                     fixture). Default: $HOME/.claude/projects.
#   DISPATCH_AUDIT_PROJECT_PREFIX  override the project-dir name prefix that
#                     selects which project directories are scanned (test seam;
#                     the unit test sets it so the harness never shells out to
#                     git). Default: this repo's MAIN root encoded with `/` and
#                     `.` rewritten to `-` — see WHAT IT SCANS.
#   DISPATCH_AUDIT_AGGREGATES_ENABLED  opt-in persist gate: set to "1" to pipe
#                     each assembled aggregate JSON document to the writer binary
#                     after the report artifact is written. Off by default so
#                     machines without Firestore config stay inert.
#   DISPATCH_AUDIT_AGGREGATES_WRITER  override the writer binary path (test
#                     seam; mirrors DISPATCH_USAGE_SAMPLES_WRITER). Default:
#                     $SCRIPT_DIR/audit-aggregate-writer.mjs.
#   Additional DISPATCH_AUDIT_AGGREGATES_* env vars are consumed by the writer
#   binary itself (GROUP_ID, NAMESPACE, TTL_DAYS, PROJECT_ID, etc.) — see
#   audit-aggregate-writer.mjs for the full list.
#
# BEHAVIOR CONTRACT
#   - The window filter uses an explicit timestamp computed from `date -d`. The
#     relative `find -newermt '7 days ago'` form is BROKEN in this environment
#     (matches 0 files), so it is never used.
#   - Corrupt files are reported to stderr and tallied in window.files_failed —
#     never silently dropped (.claude/rules/code-style.md: clear errors over
#     defensive fallbacks).
#   - window.sidecar_coverage_measurable is false whenever --node is set,
#     because the --node scope filter (see the --node gate below) already
#     requires a matching dispatch-stamp.json sidecar to admit a session into
#     $sessions at all — so at node scope every session counted in
#     sidecar_eligible also satisfies sidecar_present by construction,
#     present==eligible, and sidecar_present_rate can only ever read 1
#     (something matched) or null (nothing did). Neither reading is a
#     coverage measurement; it is an artefact of the gate. At fleet and
#     session scope sidecar_coverage_measurable is true, since neither the
#     unscoped path nor the --session gate tests for a stamp, so
#     sidecar_eligible/sidecar_present/sidecar_present_rate there are genuine
#     coverage counts.
#   - window.scope_filter_dropped_unstamped and
#     window.scope_filter_dropped_other_node account for what the --node gate
#     drops BEFORE a session ever reaches $sessions: a candidate transcript
#     with no dispatch-stamp.json sidecar at all, and one whose sidecar names
#     a different node_id, respectively. Both are 0 at fleet and session
#     scope by construction — neither of those gates tests for a stamp, so
#     nothing is ever dropped for want of one. At node scope, a run that
#     matches zero sessions is otherwise indistinguishable from "nothing to
#     measure"; a nonzero scope_filter_dropped_unstamped alongside
#     files_scanned==0 means the stamping this monitor depends on has failed
#     for this node, not that the node was quiet.
#   - Both drop counters count CANDIDATE TRANSCRIPTS, not worker sessions: a
#     dropped file never reaches the stage-1 worker_skills classification
#     (labelled SINGLE SOURCE below), so the shell cannot know whether a
#     dropped transcript would have classified as a worker, and re-deriving
#     that classification here would fork the single source. In any real
#     window the counters therefore include ordinary interactive sessions
#     alongside dropped workers — a nonzero value is normal. Read them as a
#     DISAMBIGUATOR (zero vs. nonzero — was anything scanned and dropped at
#     all) never as a THRESHOLD or an alarm on their own magnitude.
#   - Output schema is a documented contract later units depend on; keys are
#     stable. See the stage-2 jq program below for the full shape.
#   - Phase attribution is WHOLE-SESSION for a classifier-typed single-phase
#     `worker` session: every assistant turn is re-keyed onto the session's
#     launch skill (the phase skill in its first-user <command-name> block), so
#     by_skill / by_skill_model no longer dump most of a worker's turns into the
#     `<none>` bucket. This is a pure re-keying — turns, models, and all totals
#     are numerically unchanged. `by_attribution_skill` preserves the RAW
#     per-turn harness slice (keyed strictly on `attributionSkill`, `<none>`
#     included) for measuring harness attribution coverage. Subagent, recovery,
#     router-tick, other, and multi-phase worker sessions (two or more distinct
#     phase-skill attributions) keep per-turn attribution unchanged.
#   - Outcome envelope (#1860): each session's last `<!-- dispatch:outcome:v1 -->`
#     envelope (last-wins; malformed -> null, never aborts the file) is surfaced
#     on the per-session summary as `outcome` (the parsed object or null) plus
#     `outcome_rates` ({hit_rate, actionability, fix_rate}, each null when its
#     denominator is 0). The pooled `by_phase_outcome` aggregate is keyed by the
#     envelope's `phase` enum (e.g. "review", "qa"), folds only non-subagent rows
#     that carry an envelope (subagent emitters are excluded), and per phase sums
#     the counts (findings_surfaced, findings_actionable, fixes_applied,
#     followups_filed, subagents_launched, sessions), reports a
#     disposition_distribution map, and the three pooled rates on the summed
#     counts. See .claude/docs/outcome-envelope.md for field/enum/formula truth.
#   - Review effort yield (tactic-audit-review-effort-yield-lens): every
#     `dispatch-code-review` Step 7 summary block found in a Bash tool_result
#     contributes one run of {effort, model, wall_clock_s, touched_files_count}.
#     A tool_result qualifies only if it carries all three of `cache_version=`,
#     `effort=` and `touched_files_count=` (shape anchor — a single key also
#     appears in prose and in the in-flight poll block); a run whose numeric
#     fields do not parse is DROPPED, never zero-coerced; at most 200 runs per
#     session are kept. The runs are surfaced two ways, the same any-scope /
#     fleet-only split cache_efficiency uses: `.sessions[].review_runs` is the
#     ANY-SCOPE per-session mirror a --session/--node caller reads directly, and
#     `lenses.review_effort_yield` is the FLEET-ONLY pooled comparison
#     (`runs`, `sessions_affected`, `by_effort`, `sessions_mixed_effort`).
#     PRICE-PROXY ATTRIBUTION: a run is a Bash call inside a session, not a
#     session, so there is no per-run token accounting. A session's
#     `price_proxy_usd` lands in `by_effort[<e>].price_proxy_usd_single_effort`
#     ONLY when every run in that session is at effort <e>; a session with runs
#     at several efforts raises `sessions_mixed_effort` and is attributed to NO
#     bucket. A session's proxy is never divided across buckets — that would
#     fabricate a per-run figure the instrument cannot see.
#     `findings_axis_measurable` is a HARDCODED `false`, not a computed flag:
#     no source-verified per-run findings count exists (ruling option (b),
#     plans/dispatch-rsi-author-rulings.md D7), and `findings_axis_note` states
#     that in the output so a report cannot present touched_files_* as the whole
#     answer.
#   - Prices are an Opus list-price-equivalent USD PROXY applied to every session
#     regardless of its actual model — a relative-magnitude figure for ranking,
#     NOT the actual bill.
#   - When DISPATCH_AUDIT_AGGREGATES_ENABLED=1, the assembled JSON document is
#     piped to the writer after the report artifact is written (json-out or
#     stdout), so the report is always produced first. The writer's own stdout
#     is redirected to stderr so the script's "stdout must stay a pure JSON
#     document" contract holds regardless of the gate setting. Writer failure
#     exits non-zero (clear error, fail-closed) but only after the report is
#     written.
#   - SCOPING (--session/--node), two decisions:
#     1. Unbounded window by default. A scoped run targets one session or
#        node, not a wall-clock window. With no explicit --day/--days, the
#        mtime window is UNBOUNDED (SINCE = epoch) instead of the --days
#        default — a scoped session/node older than 7 days under the default
#        window would silently return an empty document, a silent wrong
#        answer (.claude/rules/code-style.md: clear errors over defensive
#        fallbacks). Pass --days/--day explicitly to bound a scoped run.
#        window.days is null in the output when the run is unbounded — there
#        is no meaningful days figure to report.
#     2. No Firestore persist for a scoped run. DISPATCH_AUDIT_AGGREGATES_ENABLED
#        is unconditionally ignored when --session/--node is set, regardless
#        of the env var. The fleet denominators the persisted aggregate feeds
#        — pooled by_phase_outcome rates, lenses.baseline_context
#        median/peak, cross-session tool_errors signatures/recurrence —
#        cannot be reconstructed from one session or
#        node's worth of data (an n=1 hit-rate is a category error, not a
#        small sample), and window.days is null for an unbounded scoped run
#        anyway, which the writer's `Number.isInteger(win.days)` validation
#        rejects. Persisting a scoped aggregate under the fleet doc id would
#        also corrupt the fleet's rolling denominators.
#
# EXIT CODES
#   0  ok
#   1  persist step (env-gated) failed; report still written
#   2  usage error (bad/unknown arg, non-integer --days)
set -euo pipefail

# Fail fast if GNU date is not available (BSD/macOS date uses a different syntax).
if ! date -d '1 day ago' +%s >/dev/null 2>&1; then
  echo "error: GNU date required (this script does not support BSD/macOS date)" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Single-sourced price-proxy rates (shared with Unit 2's .mjs). A missing file
# fails loudly here under `set -e` (clear error over a silent fallback —
# .claude/rules/code-style.md). Passed into stage-2 jq via --argjson price_model.
PRICE_MODEL=$(cat "$SCRIPT_DIR/price-model.json")

# Per-phase orchestrator SKILL.md body footprint for the phase_standup lens
# (strategy-token-economy clarification 12). jq cannot read arbitrary files from
# inside the stage-2 program, so compute each file's line/byte counts HERE and
# pass them into stage-2 via --argjson skill_body_tokens. est_tokens is a bytes/4
# ESTIMATE (a documented heuristic, NOT an exact tokenizer count). SKILLS_DIR is
# .claude/skills (SCRIPT_DIR is .claude/skills/rsi-audit/scripts). A
# missing file fails loudly under `set -e` (clear error over a silent fallback —
# .claude/rules/code-style.md). Phase enum matches dispatch-graph-execute's
# tactic:<phase> -> orchestrator mapping.
SKILLS_DIR="$SCRIPT_DIR/../.."
SKILL_BODY_TOKENS='{}'
for _phase_map in \
  "implement:implement" \
  "fix:fix-checks" \
  "qa:qa-fix" \
  "review:review-fix" \
  "main-qa:qa-main"; do
  _phase="${_phase_map%%:*}"
  _skilldir="${_phase_map#*:}"
  _skillfile="$SKILLS_DIR/$_skilldir/SKILL.md"
  if [[ ! -f "$_skillfile" ]]; then
    echo "error: phase_standup lens: SKILL.md not found for phase '$_phase': $_skillfile" >&2
    exit 2
  fi
  _bytes=$(wc -c <"$_skillfile")
  _lines=$(wc -l <"$_skillfile")
  _est=$(( _bytes / 4 ))
  SKILL_BODY_TOKENS=$(jq -c \
    --arg p "$_phase" --argjson b "$_bytes" --argjson l "$_lines" --argjson e "$_est" \
    '.[$p] = {bytes:$b, lines:$l, est_tokens:$e}' <<<"$SKILL_BODY_TOKENS")
done

# REST helper for per-issue label fetches (gh_issue_view_rest). SCRIPT_DIR-relative
# so cwd is irrelevant; lib.sh's top level is only function defs + a few exports,
# safe to source under `set -euo pipefail`.
source "$SCRIPT_DIR/../../dispatch-propagate/scripts/lib.sh"

DAYS=7
DAY=""
DAYS_GIVEN=0
JSON_OUT=""
EXCLUDE_SIDECAR=0
SESSION_ID=""
NODE_ID=""
PROJECTS_ROOT="${DISPATCH_AUDIT_PROJECTS_ROOT:-$HOME/.claude/projects}"

# Project-dir name prefix for transcript discovery (see WHAT IT SCANS). Derived
# from the MAIN repo root, never from the invoking checkout: this repo is a
# standard layout (`.git` is a real directory at the main root), so
# `--git-common-dir` resolves to <main>/.git even when this script runs from a
# worktree — a worktree-launched audit therefore still scans the whole fleet
# rather than one checkout. Prints an empty string on failure; the caller turns
# that into a hard exit.
derive_project_prefix() {
  local checkout_root common_dir
  # SCRIPT_DIR is <checkout root>/.claude/skills/rsi-audit/scripts.
  checkout_root="$SCRIPT_DIR/../../../.."
  if ! common_dir=$(git -C "$checkout_root" rev-parse --path-format=absolute --git-common-dir 2>/dev/null); then
    echo "error: aggregate-usage.sh: 'git -C $checkout_root rev-parse --git-common-dir' failed; cannot derive the transcript project-dir prefix" >&2
    return 0
  fi
  [[ -n "$common_dir" ]] || return 0
  printf '%s' "$(dirname "$common_dir")" | tr '/.' '--'
}

# `:-` so the git call runs ONLY when the override is unset — the unit test
# sets the override and must never shell out to git. There is deliberately NO
# fallback to the superseded *worktrees*/*--bare globs on failure
# (.claude/rules/code-style.md): a silent fallback would reinstate exactly the
# invisible undercount this predicate removes, so an underivable prefix is a
# hard error instead.
PROJECT_PREFIX="${DISPATCH_AUDIT_PROJECT_PREFIX:-$(derive_project_prefix)}"
if [[ -z "$PROJECT_PREFIX" || "$PROJECT_PREFIX" == "-" ]]; then
  echo "error: aggregate-usage.sh: empty or degenerate transcript project-dir prefix ('$PROJECT_PREFIX'); set DISPATCH_AUDIT_PROJECT_PREFIX to override" >&2
  exit 2
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days)
      if [[ -n "$DAY" ]]; then
        echo "error: --day and --days are mutually exclusive" >&2; exit 2
      fi
      if [[ $# -lt 2 || "${2:-}" == -* || -z "${2:-}" ]]; then
        echo "error: --days requires a value" >&2; exit 2
      fi
      DAYS="$2"
      DAYS_GIVEN=1
      shift 2
      ;;
    --day)
      if [[ "$DAYS_GIVEN" == 1 ]]; then
        echo "error: --day and --days are mutually exclusive" >&2; exit 2
      fi
      if [[ $# -lt 2 || "${2:-}" == -* || -z "${2:-}" ]]; then
        echo "error: --day requires a value" >&2; exit 2
      fi
      # Strict YYYY-MM-DD format AND a real calendar date (date -u rejects e.g. 2025-13-40).
      if [[ ! "$2" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || ! date -u -d "$2" '+%Y-%m-%d' >/dev/null 2>&1; then
        echo "error: --day must be a valid YYYY-MM-DD date, got '$2'" >&2; exit 2
      fi
      DAY="$2"
      shift 2
      ;;
    --exclude-sidecar-sessions)
      EXCLUDE_SIDECAR=1
      shift
      ;;
    --session)
      if [[ -n "$NODE_ID" ]]; then
        echo "error: --session and --node are mutually exclusive" >&2; exit 2
      fi
      if [[ $# -lt 2 || "${2:-}" == -* || -z "${2:-}" ]]; then
        echo "error: --session requires a value" >&2; exit 2
      fi
      SESSION_ID="$2"
      shift 2
      ;;
    --node)
      if [[ -n "$SESSION_ID" ]]; then
        echo "error: --session and --node are mutually exclusive" >&2; exit 2
      fi
      if [[ $# -lt 2 || "${2:-}" == -* || -z "${2:-}" ]]; then
        echo "error: --node requires a value" >&2; exit 2
      fi
      NODE_ID="$2"
      shift 2
      ;;
    --json-out)
      if [[ $# -lt 2 || "${2:-}" == -* || -z "${2:-}" ]]; then
        echo "error: --json-out requires a value" >&2; exit 2
      fi
      JSON_OUT="$2"
      shift 2
      ;;
    *)
      echo "error: unknown argument '$1'" >&2
      echo "usage: aggregate-usage.sh [--days N | --day YYYY-MM-DD] [--json-out PATH] [--exclude-sidecar-sessions] [--session ID | --node ID]" >&2
      exit 2
      ;;
  esac
done

if [[ ! "$DAYS" =~ ^[1-9][0-9]*$ ]]; then
  echo "error: --days must be a positive integer, got '$DAYS'" >&2
  exit 2
fi

# SCOPED (--session/--node) UNBOUNDED-WINDOW decision (see BEHAVIOR CONTRACT):
# with no explicit --day/--days, a scoped run's mtime window is unbounded
# rather than defaulting to --days 7 — a session or node older than 7 days
# would otherwise silently return an empty document.
WINDOW_UNBOUNDED=0
if [[ ( -n "$SESSION_ID" || -n "$NODE_ID" ) && -z "$DAY" && "$DAYS_GIVEN" == 0 ]]; then
  WINDOW_UNBOUNDED=1
fi

# Explicit-timestamp window bounds. The relative `-newermt '7 days ago'` form is
# broken here, so compute the concrete instant. The find filter below is half-open
# in spirit: lower bound `-newermt "$SINCE"`, upper bound `! -newermt "$UNTIL"`.
if [[ -n "$DAY" ]]; then
  # Target-day window: a single UTC calendar day [<day> 00:00:00, <day+1> 00:00:00).
  # The issue docId date is UTC, so bound the day in UTC.
  SINCE="$DAY 00:00:00"
  UNTIL="$(date -u -d "$DAY + 1 day" '+%Y-%m-%d') 00:00:00"
  # The window spans exactly one calendar day; keep window metadata self-consistent.
  DAYS=1
elif [[ "$WINDOW_UNBOUNDED" == 1 ]]; then
  # Unbounded: lower-bound at the epoch so every mtime in the projects root
  # qualifies; the --session/--node filter in the find loop below is what
  # actually narrows the result, not the mtime window.
  SINCE="1970-01-01 00:00:00"
  UNTIL=$(date -u -d '+1 second' '+%Y-%m-%d %H:%M:%S')
else
  # Both bounds are rendered in UTC (`date -u`): the find below interprets them
  # under TZ=UTC, so a local-TZ rendering would silently shift the window by the
  # host's UTC offset (e.g. UNTIL landing hours in the past west of UTC,
  # dropping a transcript whose mtime is "now").
  SINCE=$(date -u -d "$DAYS days ago" '+%Y-%m-%d %H:%M:%S')
  # UNTIL is "now", but `date` truncates to whole seconds while file mtimes carry
  # sub-second precision; a `! -newermt "$UNTIL"` upper bound would otherwise drop
  # a transcript written in the current second (mtime > floor(now)). Use +1s so the
  # current second is included — real transcripts are never in the future, so this
  # keeps --days output unchanged in practice.
  UNTIL=$(date -u -d '+1 second' '+%Y-%m-%d %H:%M:%S')
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# ---------------------------------------------------------------------------
# STAGE-1 jq — one compact JSON line per transcript file.
# Reads the file slurped (jq -cs) so `input_filename` is the file path and the
# whole transcript is one array.
# ---------------------------------------------------------------------------
cat >"$TMP/stage1.jq" <<'STAGE1'
# All assistant messages and their usage, normalized (missing -> 0).
def asst:
  [ .[] | select(.type=="assistant") ];

def usage_of(m):
  ( m.message.usage // {} )
  | {
      input:          (.input_tokens // 0),
      cache_creation: (.cache_creation_input_tokens // 0),
      cache_read:     (.cache_read_input_tokens // 0),
      output:         (.output_tokens // 0)
    };

def sum_usage(list):
  reduce list[] as $u (
    {input:0, cache_creation:0, cache_read:0, output:0};
    {
      input:          (.input + $u.input),
      cache_creation: (.cache_creation + $u.cache_creation),
      cache_read:     (.cache_read + $u.cache_read),
      output:         (.output + $u.output)
    }
  );

# Roll a row list up by its `.skill` key into {skill: {usage, turns}}. SINGLE
# SOURCE for the two skill rollups below — $by_skill (over the re-keyed
# $arows) and $by_attribution_skill (over the raw $rows) — which must stay
# structurally identical so the raw-vs-attributed comparison is apples-to-apples.
def skill_rollup($rs):
  reduce $rs[] as $r ({};
    .[$r.skill] as $cur
    | .[$r.skill] = {
        usage: sum_usage([ ($cur.usage // {input:0,cache_creation:0,cache_read:0,output:0}), $r.u ]),
        turns: (($cur.turns // 0) + 1)
      }
  );

# Coerce a .message.content (string OR array of blocks) to a flat string for
# classification matching.
def content_to_string(c):
  if (c|type) == "string" then c
  elif (c|type) == "array" then
    ( [ c[]? | if type=="string" then . elif type=="object" then (.text // "") else "" end ] | join(" ") )
  else "" end;

# Field-value reader for the `dispatch-code-review` Step 7 summary block (see the
# review-run extractor further down). PER-LINE CAPTURE that does NOT rely on ^/$:
# jq's Oniguruma engine reads "m" as DOTALL, NOT as PCRE-style multiline anchors,
# so "^" matches only at the start of the WHOLE subject with or without the flag.
# (Probe: `jq -n '[ "a\nb=1" | match("^b=(?<v>[^\n]*)") ] | length'` -> 0, and
# adding "m" still yields 0 — the same Oniguruma quirk the outcome-envelope
# comment below documents from the other direction.) Each field is therefore
# anchored on an explicit leading newline, with one prepended to the subject so a
# block-INITIAL field still matches. Returns null when the key is absent — the
# caller decides what an absent field means.
def summary_field($s; $k):
  ( "\n" + $s )
  | [ match("\\n" + $k + "=(?<v>[^\\n\\r]*)") ]
  | (.[0].captures[0].string // null);

# Normalize one error .content (string OR array of blocks -> joined .text) into a
# single signature string.
# NOTE: The signature is opaque, attacker-influenceable transcript data — it is
# capped at 120 characters so malicious content cannot inject arbitrarily long keys.
def err_signature(c):
  ( if (c|type) == "string" then c
    elif (c|type) == "array" then
      ( [ c[]? | if type=="string" then . elif type=="object" then (.text // "") else "" end ] | join("\n") )
    else "" end )
  | split("\n")[0]                          # first line only
  | gsub("[0-9]+"; "N")                      # digit runs -> N
  | gsub("(/[A-Za-z0-9._-]+){3,}"; "PATH")  # long absolute paths -> PATH
  | .[0:120];                                # hard cap — opaque attacker-controlled data

# Normalized command prefix for a Bash command string. Strips leading env-var
# assignments, then keeps a path-like first token whole, otherwise the first two
# whitespace tokens. Digit-normalize + cap come LAST so a separate numeric arg is
# already dropped by prefix selection. Mirrors err_signature's opaque-data spirit.
def cmd_prefix(c):
  ( (c // "")
    | sub("^([A-Za-z_][A-Za-z0-9_]*=[^ ]* +)+"; "")
    | [splits("[ \t\n]+")] ) as $toks
  | ( $toks[0] // "" ) as $t0
  | ( if ($t0 | test("/")) then $t0 else ($toks[0:2] | join(" ")) end )
  | gsub("[0-9]+"; "N")
  | .[0:120];

# ---- permission-friction markers (tactic-audit-permission-friction) --------
# FOUR measurable markers. Note first what is deliberately ABSENT: approval
# round-trips and prompt latency are NOT derivable from transcript data — a
# transcript records denials and blocks, never an approval or the wall-clock a
# human spent sitting at a prompt. The node records that gap.
#
#   user_rejections   — the human declined the tool call.
#   automode_denials  — the auto-mode classifier denied it. This is the
#                       /fewer-permission-prompts signal specifically: the
#                       denial text itself ends by telling the user to add a
#                       permission rule.
#   policy_blocks     — a settings permission rule, or a PreToolUse hook,
#                       refused the call.
#   sandbox_overrides — a tool call carrying dangerouslyDisableSandbox:true.
#                       This is the friction WORKAROUND, not a denial: it is
#                       counted, and never charged retry cost.
#
# TWO discriminators, applied in that order per error block:
#   (a) the error SIGNATURE text, via the same err_signature() the tool_errors
#       lens uses — so any signature this lens reports is byte-identical to its
#       tool_errors row, and the PATH/digit collapse already merges per-worktree
#       and per-pid variants of one refusal into one key.
#   (b) the LINE-level `toolDenialKind` / `toolUseResult` fields the harness
#       stamps on the denied user message.
# (a) runs first because it is per-BLOCK and present on every transcript
# generation; (b) is the fallback that catches what (a) cannot — a user
# rejection whose result text is the human's own typed reason, which has no
# fixed prefix — and it is absent from older transcripts.
#
# Hook refusals carry toolDenialKind:null — a PreToolUse hook returns an
# ordinary error tool_result, so the harness stamps no denial kind on the line.
# They are matchable by refusal text ALONE; extend friction_kind below when a
# new blocking hook lands.
def friction_kind($sig):
  if ($sig | startswith("Permission for this action was denied by the Claude Code auto mode classifier")) then "automode_denials"
  elif ($sig | test("^Permission to use [A-Za-z_]+ has been denied")) then "policy_blocks"
  elif ($sig | startswith("This session is isolated in the worktree")) then "policy_blocks"
  elif ($sig | startswith("The user doesn't want to proceed with this tool use")) then "user_rejections"
  elif (($sig | startswith("Claude requested permissions to")) and ($sig | test("granted it yet"))) then "user_rejections"
  else null end;

def line_friction_kind(m):
  (m.toolDenialKind // null) as $dk
  | if   $dk == "user-rejected"    then "user_rejections"
    elif ($dk == "automode-blocked" or $dk == "automode-unavailable") then "automode_denials"
    elif $dk == "permission-rule"  then "policy_blocks"
    elif (((m.toolUseResult | type) == "string") and (m.toolUseResult == "User rejected tool use")) then "user_rejections"
    else null end;

# Friction events carried by ONE user message — one event per error
# tool_result block, so a batched turn that had several calls denied counts
# each of them.
def friction_events(m):
  ( line_friction_kind(m) ) as $lk
  | [ (m.message.content // []) | if type=="array" then .[]? else empty end
      | select(type=="object" and .type=="tool_result" and .is_error==true)
      | err_signature(.content) as $sig
      | (friction_kind($sig) // $lk) as $k
      | select($k != null)
      | { kind: $k, signature: $sig } ];

# Worker launch-skill set: the dispatch phase skills, the graph-native align
# family, and the rsi family (/rsi, the per-phase ladder evaluator, and
# /rsi-audit, the fleet audit). SINGLE SOURCE for stage 1: consumed TWICE —
# once by the session-type classifier below (a first-user <command-name> match
# types the session "worker") and once by the whole-session phase attribution
# ($launch_skill / $tagged_phase_skills). This list must be updated whenever a
# new skill joins that set — it is not limited to dispatch phase skills.
#
# Alternation order needs no care: the trailing "</command-name>" literal makes
# "rsi-audit" win over the earlier "rsi" by backtracking, exactly as
# "align-tactics" already coexists with "align".
def worker_skills: ["plan-issue","implement","qa-fix","review-fix","fix-checks",
  "fix-conflicts","dispatch-conflict","qa-main","budget-parse-job","resolve-epic",
  "office-hours","align-strategy","align-tactics","align-init","align",
  "rsi","rsi-audit"];
def worker_cmd_re: "<command-name>/(?<wskill>" + (worker_skills | join("|")) + ")</command-name>";

. as $msgs
| (asst) as $a
| (input_filename) as $path
| ($path | sub("\\.jsonl$"; "") | sub(".*/"; "")) as $id

# Session start time (tactic-audit-cache-efficiency-lens): the earliest
# non-null `.timestamp` across every message in the transcript, INCLUDING
# non-assistant/non-user lines. Real transcripts open with a few metadata
# lines (custom-title, agent-name, mode) that carry timestamp:null, so `.[0]`
# alone would pick up a null; filter those out first. Used downstream (stage
# 2) to order sibling sessions sharing a graph node by when they actually
# started, for the cache-creation-churn sub-metric. null when no message
# carries a timestamp (never a fabricated fallback value —
# .claude/rules/code-style.md).
| ( [ $msgs[] | .timestamp ] | map(select(. != null)) | (.[0] // null) ) as $started_at

# First-user content as a flat string (for type classification).
| ( [ $msgs[] | select(.type=="user") ] | (.[0] // null) ) as $firstuser
| ( if $firstuser == null then "" else content_to_string($firstuser.message.content) end ) as $firstuser_str

# Per-assistant-message usage paired with model / skill / branch.
# Sanitize model and skill before they are used as JSON object keys: replace tab
# characters with '_' and cap length so composite keys (skill + tab + model) are clean.
| ( [ $a[] | {
        model:  ((.message.model // "unknown") | gsub("\t"; "_") | .[0:64]),
        skill:  ((.attributionSkill // "<none>") | gsub("\t"; "_") | .[0:64]),
        branch: (.gitBranch // null),
        u:      usage_of(.)
      } ] ) as $rows

# Models seen, and the model with the max summed output_tokens (primary).
| ( [ $rows[].model ] | unique ) as $models
| ( reduce $rows[] as $r ({}; .[$r.model] = ((.[$r.model] // 0) + $r.u.output)) ) as $out_by_model
| ( ( $out_by_model | to_entries | sort_by(-.value) | .[0].key ) // null ) as $primary_model

# Session type.
| ( if ($path | test("/subagents/")) then "subagent"
    elif ( ([ $msgs[] | select(.attributionSkill=="recover-api-error") ] | length) > 0
           or ($firstuser_str | test("/recover-api-error")) ) then "recovery"
    elif ( ($path | test("--bare"))
           or ( [ $a[] | select(.gitBranch=="HEAD") ] | length > 0 ) ) then "router-tick"
    # Real --bg dispatch workers are spawned with a phase-skill slash command.
    # Their first user message is a <command-name>/<skill></command-name> block
    # whose skill is one of the dispatch worker phase set (plus the graph-native
    # align family and the rsi family) — see `worker_skills` above, which must be
    # updated whenever a new skill joins that set. That list is now consumed
    # twice: here for classification, and below for whole-session attribution.
    elif ($firstuser_str | test(worker_cmd_re)) then "worker"
    else "other" end ) as $type

# The launching phase skill, captured from the same first-user <command-name>
# block that typed the session. `capture` yields nothing on no-match and
# `empty // null` evaluates to null, so no error branch is needed.
| ( ($firstuser_str | capture(worker_cmd_re) | .wskill) // null ) as $launch_skill

# WHOLE-SESSION PHASE ATTRIBUTION. Per-turn `attributionSkill` only covers a
# session's opening turns, so most of a worker session's turns land in the
# "<none>" bucket. A classifier-typed worker session runs exactly one phase, so
# fold ALL its turns onto its launch skill.
#
# Multi-phase guard: a worker session that inlines a NON-phase helper skill
# (e.g. commit-merge-push) is still one phase and must fold whole — only the
# phase-skill attributions count toward the guard. A session carrying two or
# more DISTINCT phase-skill attributions is genuinely multi-phase and keeps
# today's per-turn behavior.
| ( [ $rows[] | .skill | select(. != "<none>") ] | unique ) as $tagged_skills
| ( [ $tagged_skills[] | select(. as $s | worker_skills | index($s)) ] ) as $tagged_phase_skills
| ( ($type == "worker") and ($launch_skill != null)
    and (($tagged_phase_skills | length) <= 1) ) as $whole_session

# Peak context across assistant msgs.
| ( [ $rows[] | (.u.input + .u.cache_read + .u.cache_creation) ] | (max // 0) ) as $peak_context

# Init overhead = first assistant message's input / cache_creation.
| ( ($a[0] // null) | if . == null then {input:0, cache_creation:0} else usage_of(.) end ) as $init_u

# Attributed rows: a pure RE-KEYING of $rows — same turns, same per-turn models,
# same usage objects — so every totals figure stays numerically invariant.
| ( if $whole_session then [ $rows[] | .skill = $launch_skill ] else $rows end ) as $arows

# by_skill and by_skill_model rollups (over the attributed rows).
| ( skill_rollup($arows) ) as $by_skill
# Raw per-turn harness slice, preserved unattributed (over $rows, NOT $arows).
| ( skill_rollup($rows) ) as $by_attribution_skill
| ( reduce $arows[] as $r ({};
      ($r.skill + "\t" + $r.model) as $k
      | .[$k] as $cur
      | .[$k] = {
          usage: sum_usage([ ($cur.usage // {input:0,cache_creation:0,cache_read:0,output:0}), $r.u ]),
          turns: (($cur.turns // 0) + 1)
        }
    ) ) as $by_skill_model

# Error signatures across all user lines.
| ( [ $msgs[]
      | select(.type=="user")
      | .message.content
      | if type=="array" then .[]? else empty end
      | select(type=="object" and .type=="tool_result" and .is_error==true)
      | err_signature(.content)
    ] ) as $errors

# Permission-friction events across all user lines (see the marker block above
# for what each kind means and why approval round-trips are not among them).
| ( [ $msgs[] | select(.type=="user") | friction_events(.)[] ] ) as $friction_events

# Sandbox overrides: tool calls carrying dangerouslyDisableSandbox:true. NOT
# filtered to Bash — the flag is a Bash input today, but keying on the flag
# rather than the tool name keeps the count correct if another tool adopts it.
| ( [ $msgs[] | select(.type=="assistant")
      | (.message.content // []) | if type=="array" then .[] else empty end
      | select(type=="object" and .type=="tool_use"
               and (.input.dangerouslyDisableSandbox == true))
    ] | length ) as $sandbox_overrides

# Retry cost of permission friction: the usage of the assistant turn that
# FOLLOWS each friction event — the turn actually spent recovering from the
# denial. This is a MEASURED figure (real tokens on a real turn), never a
# hypothetical "would have saved $X" delta, per the lens-9/10 discipline. When
# several friction events land back to back, the single following assistant
# turn is charged ONCE, not once per event. Sandbox overrides are excluded:
# they succeed, so no recovery turn follows.
| ( reduce $msgs[] as $m (
      {armed: false, u: {input:0, cache_creation:0, cache_read:0, output:0}};
      if ($m.type == "user") and ((friction_events($m) | length) > 0) then .armed = true
      elif ($m.type == "assistant") and .armed then
        .u = sum_usage([.u, usage_of($m)]) | .armed = false
      else . end
    ) | .u ) as $friction_retry_usage

# Outcome envelope (#1860). The phase emits a `<!-- dispatch:outcome:v1 -->`
# marker followed by a fenced ```json block as a Bash tool_result. Scan every
# user tool_result (NOT just is_error ones — envelopes are not errors), coerce
# .content to a string, and capture the JSON between the json-fence and its
# closing fence.
#
# The capture anchors on the full literal marker `<!-- dispatch:outcome:v1 -->`
# per the reader contract in .claude/docs/outcome-envelope.md. The body is
# non-greedy (`.*?`) so it stops at the FIRST closing fence — robust to `}`/`{`
# inside string values and to multiple envelopes in one result. The "m" flag is
# LOAD-BEARING and must not be removed: jq uses the Oniguruma engine, where "m"
# means DOTALL — "." matches newlines — which is NOT the same as PCRE's "m"
# (multiline anchors, where "m" only makes ^/$ match at line boundaries). Without
# "m", "." stops at the first newline and a pretty-printed body is silently
# truncated. This matters because dispatch-emit-outcome runs `jq -n` WITHOUT
# `-c`, so it emits a pretty-printed MULTI-LINE JSON object; the "m" flag is what
# lets this single regex capture it whole. (Verify the DOTALL semantics directly:
# `printf 'A\nB' | jq -Rs '[match("A(?<x>.)B"; "m")][0].captures[0].string'` ->
# "\n" (the "." captured the newline); drop the "m" and `[match(...)]` is [].
# test-aggregate-usage.sh guards this with a multi-line fixture.)
#
# LAST-WINS (reader contract): collect every envelope match across all
# tool_results in document order and take the last. fromjson is wrapped in
# try/catch so a malformed envelope binds null and NEVER aborts the file —
# mirroring the clear-error/files_failed philosophy.
#
# STRICT VALIDATION (#1909): after a successful fromjson, a PARTIAL envelope
# (valid JSON missing a required rate-feeding count key) binds null and is
# treated as ABSENT — never coerced to a zero-count object. The doc marks the
# three rate-feeding counts (findings_surfaced, findings_actionable,
# fixes_applied) non-nullable, so we validate each is a `number` (a type check
# catches both a missing key AND an explicit null). Without this, rate()'s
# `($num // 0)` would silently fabricate a 0 rate from a partial envelope. Per
# .claude/rules/code-style.md (clear errors over defensive fallbacks), surface
# the gap as outcome:null instead. This single stage-1 chokepoint propagates to
# per-session outcome/outcome_rates and pooled by_phase_outcome downstream.
# followups_filed/subagents_launched are intentionally NOT validated here —
# they do not feed rate(), so they keep their `// 0` coercion downstream.
| ( [ $msgs[]
      | select(.type=="user")
      | .message.content
      | if type=="array" then .[]? else empty end
      | select(type=="object" and .type=="tool_result")
      | content_to_string(.content)
      | match("<!-- dispatch:outcome:v1 -->\\s*```json\\s*(?<j>.*?)\\s*```"; "gm")
      | .captures[0].string
    ] | last // null ) as $outcome_raw
| ( ($outcome_raw // "") | try fromjson catch null ) as $parsed
| ( if ($parsed | type) == "object"
      and ($parsed.findings_surfaced   | type) == "number"
      and ($parsed.findings_actionable | type) == "number"
      and ($parsed.fixes_applied       | type) == "number"
    then $parsed else null end ) as $outcome

# NODE_ID PASSTHROUGH (tactic-outcome-envelope-node-lane-parity): $outcome is
# bound to the WHOLE parsed envelope object above, not a hand-picked field
# subset, so a node-lane envelope's `node_id` key rides through unstripped on
# `.sessions[].outcome.node_id` in the per-session summary — and only there.
# It does NOT reach `by_phase_outcome` below: that reduce builds a fresh object
# from an explicit key list and keys only on `.phase`. A future pooled
# by-node-outcome join analogous to `by_node` (see below) would therefore need
# a new reduce, and should key on the sidecar-derived `artifact.node_id` rather
# than on this envelope field.

# Review runs (tactic-audit-review-effort-yield-lens). `dispatch-code-review`
# Step 7 writes a compact key=value summary file and `cat`s it to stdout, so the
# block lands verbatim in a Bash tool_result. That script's own comment declares
# the field names a parsing contract — "EXTEND this list, never rename a line" —
# which is what makes this a stable machine-readable input. The built-in
# /code-review's findings prose has no such contract, which is why the findings
# axis of this lens is NOT measured (see the lens in stage 2).
#
# The traversal is the SAME idiom as the outcome envelope above (every user
# tool_result, content coerced with content_to_string) rather than a second
# scanning style.
#
# SHAPE ANCHOR, not a single key: a tool_result qualifies only when its string
# carries ALL THREE of `cache_version=`, `effort=` and `touched_files_count=`.
# Any one alone occurs in ordinary transcript prose, and dispatch-code-review's
# own in-flight poll block prints `effort=` with neither of the other two (it
# spells its version key `run_version=`) — so a single-key anchor would mint
# phantom runs out of polls and prose alike. Three co-occurring contract fields
# is the cheap discriminator.
#
# STRICT VALIDATION, mirroring the outcome envelope's: a block whose
# wall_clock_s or touched_files_count does not parse as a number is treated as
# ABSENT and the whole run is DROPPED, never coerced to 0. A fabricated
# 0-touched-files run would silently drag its effort bucket's median down —
# exactly the defensive-fallback failure .claude/rules/code-style.md names.
#
# CAP: at most 200 runs are captured per session, so a pathological or
# adversarial transcript cannot blow up the row. Real sessions run a handful.
| ( [ $msgs[]
      | select(.type=="user")
      | .message.content
      | if type=="array" then .[]? else empty end
      | select(type=="object" and .type=="tool_result")
      | content_to_string(.content)
      | select(test("cache_version=") and test("effort=") and test("touched_files_count="))
      | . as $blk
      | { effort:       summary_field($blk; "effort"),
          model:        summary_field($blk; "model"),
          wall_clock_s:
            ( summary_field($blk; "wall_clock_s")
              | if . == null then null else (try tonumber catch null) end ),
          touched_files_count:
            ( summary_field($blk; "touched_files_count")
              | if . == null then null else (try tonumber catch null) end ) }
      | select( (.effort | type) == "string" and (.effort | length) > 0
                and (.model | type) == "string" and (.model | length) > 0
                and (.wall_clock_s | type) == "number"
                and (.touched_files_count | type) == "number" )
    ] | .[0:200] ) as $review_runs

# Ordered per-session token list of tool calls, in document order. Bash calls
# become "Bash:<cmd_prefix>"; other tools become their name.
| ( [ $msgs[] | select(.type=="assistant")
      | (.message.content // []) | if type=="array" then .[] else empty end
      | select(type=="object" and .type=="tool_use")
      | if .name=="Bash" then "Bash:" + cmd_prefix(.input.command // "") else .name end
    ] ) as $tool_calls

# Per-session tool_use_id -> tool name map (assistant tool_use blocks).
| ( reduce ( $msgs[] | select(.type=="assistant")
             | (.message.content // []) | if type=="array" then .[] else empty end
             | select(type=="object" and .type=="tool_use") ) as $b
      ({}; .[$b.id] = $b.name) ) as $tool_name_by_id

# Tool-result payload bytes attributed to the originating tool name. The
# tool_use_id is guarded with `// ""` before object lookup: a null key would
# raise "Cannot index object with null" in jq 1.8.x, and an absent/empty key
# falls through to "unknown".
| ( reduce ( $msgs[] | select(.type=="user")
             | (.message.content // []) | if type=="array" then .[] else empty end
             | select(type=="object" and .type=="tool_result") ) as $r
      ( {total:0, by_tool:{}};
        ($r.tool_use_id // "") as $tid
        | ($tool_name_by_id[$tid] // "unknown") as $tn
        | ($r.content | tostring | utf8bytelength) as $b
        | .total += $b
        | .by_tool[$tn].bytes = ((.by_tool[$tn].bytes // 0) + $b)
        | .by_tool[$tn].results = ((.by_tool[$tn].results // 0) + 1) )
    ) as $payload

| {
    type: $type,
    id: $id,
    artifact: ( ($stamp[0] // null) | if . == null then null else {repo, issue, pr, base_sha, branch, node_id} end ),
    file: $path,
    primary_model: $primary_model,
    models: $models,
    turns: ($a | length),
    peak_context: $peak_context,
    init_input: ($init_u.input),
    init_cache_creation: ($init_u.cache_creation),
    started_at: $started_at,
    usage: sum_usage([ $rows[].u ]),
    by_skill: $by_skill,
    by_skill_model: $by_skill_model,
    launch_skill: $launch_skill,
    whole_session_attributed: $whole_session,
    multi_phase_worker: (($type == "worker") and (($tagged_phase_skills | length) > 1)),
    by_attribution_skill: $by_attribution_skill,
    attributed_turns_raw: ([ $rows[] | select(.skill != "<none>") ] | length),
    errors: $errors,
    friction_events: $friction_events,
    sandbox_overrides: $sandbox_overrides,
    friction_retry_usage: $friction_retry_usage,
    tool_calls: $tool_calls,
    payload: $payload,
    outcome: $outcome,
    review_runs: $review_runs
  }
STAGE1

# ---------------------------------------------------------------------------
# STAGE-2 jq — fold all stage-1 lines (fed as one array via -s) into the final
# document. The price proxy is applied here.
# ---------------------------------------------------------------------------
cat >"$TMP/stage2.jq" <<'STAGE2'
# --- Price proxy (rates single-sourced from price-model.json) -------------
# Opus list rates per Mtok, supplied by the shell via --argjson price_model
# (loaded from price-model.json, shared with Unit 2's .mjs). Applied to EVERY
# session regardless of its real model: a relative-magnitude USD PROXY for
# ranking, NOT the actual bill.
def RATE_INPUT:          $price_model.input;
def RATE_CACHE_CREATION: $price_model.cacheCreation;
def RATE_CACHE_READ:     $price_model.cacheRead;
def RATE_OUTPUT:         $price_model.output;
def price(u):
  ( (u.input          // 0) * RATE_INPUT
  + (u.cache_creation // 0) * RATE_CACHE_CREATION
  + (u.cache_read     // 0) * RATE_CACHE_READ
  + (u.output         // 0) * RATE_OUTPUT ) / 1e6;

# --- Truthful per-model cost (#2027, generation-aware #2102) --------------
# Actual list rates per Mtok, keyed by a generation-aware rate class (see
# rate_class below). Unlike the proxy above, this prices each session by its
# REAL model so cost_usd is the actual bill. Convention: a bare family key
# (opus/sonnet/haiku) = the current generation; a *_3 / *_3_5 key = that
# retired Claude 3.x generation. Claude 3 cache rates are formula-derived
# (1.25x write / 0.1x read of input), not exact historical cents.
def ACTUAL_RATES:
  { fable:     {input:10,   cache_creation:12.50,   cache_read:1.00,  output:50},
    opus:      {input:5,    cache_creation:6.25,    cache_read:0.50,  output:25},
    sonnet:    {input:3,    cache_creation:3.75,    cache_read:0.30,  output:15},
    haiku:     {input:1,    cache_creation:1.25,    cache_read:0.10,  output:5},
    opus_3:    {input:15,   cache_creation:18.75,   cache_read:1.50,  output:75},
    haiku_3:   {input:0.25, cache_creation:0.3125,  cache_read:0.025, output:1.25},
    haiku_3_5: {input:0.80, cache_creation:1.00,    cache_read:0.08,  output:4.00} };
def family($m):
  if   ($m | startswith("claude-fable") or startswith("claude-mythos")) then "fable"
  elif ($m | startswith("claude-opus") or startswith("claude-3-opus")) then "opus"
  elif ($m | startswith("claude-sonnet")
         or startswith("claude-3-sonnet")
         or startswith("claude-3-5-sonnet")
         or startswith("claude-3-7-sonnet")) then "sonnet"
  elif ($m | startswith("claude-haiku")
         or startswith("claude-3-haiku")
         or startswith("claude-3-5-haiku")) then "haiku"
  else null end;
def rate_class($m):
  if   ($m | startswith("claude-3-opus"))    then "opus_3"
  elif ($m | startswith("claude-3-5-haiku")) then "haiku_3_5"
  elif ($m | startswith("claude-3-haiku"))   then "haiku_3"
  else family($m) end;
def cost(u; $model):
  family($model) as $fam
  | rate_class($model) as $rc
  | ((u.input//0)+(u.cache_creation//0)+(u.cache_read//0)+(u.output//0)) as $tok
  | if $fam == null then
      (if $tok == 0 then 0
       else error("rsi-audit: unpriceable model '\($model)' carries \($tok) tokens; add it to the price table") end)
    else (ACTUAL_RATES[$rc]) as $r
      | ( (u.input//0)*$r.input + (u.cache_creation//0)*$r.cache_creation
        + (u.cache_read//0)*$r.cache_read + (u.output//0)*$r.output ) / 1e6
    end;
def session_cost($r):
  reduce ($r.by_skill_model | to_entries[]) as $e (0;
    . + cost($e.value.usage; ($e.key | split("\t")[1])));

def zero_usage: {input:0, cache_creation:0, cache_read:0, output:0};
def add_usage(a; b):
  {
    input:          ((a.input          // 0) + (b.input          // 0)),
    cache_creation: ((a.cache_creation // 0) + (b.cache_creation // 0)),
    cache_read:     ((a.cache_read     // 0) + (b.cache_read     // 0)),
    output:         ((a.output         // 0) + (b.output         // 0))
  };

# A flat bucket record {input,cache_creation,cache_read,output,turns,price_proxy_usd,cost_usd}
def zero_bucket: {input:0, cache_creation:0, cache_read:0, output:0, turns:0, price_proxy_usd:0, cost_usd:0};
def add_to_bucket(bucket; u; turns):
  ( add_usage(bucket; u) ) as $nu
  | $nu + {
      turns: ((bucket.turns // 0) + turns),
      price_proxy_usd: price($nu),
      cost_usd: (bucket.cost_usd // 0)
    };

# Consecutive n-grams of a token list as arrays. range upper bound goes negative
# for lists shorter than n, yielding nothing — no explicit length guard needed.
def ngrams($L; $n):
  [ range(0; ($L | length) - $n + 1) as $i | $L[$i:$i+$n] ];

# Median of a numeric list; 0 for an empty list (never a divide-by-zero). Used by
# the phase_standup lens for boot round-trip / judgment-call central tendency.
def median($L):
  ( $L | sort )
  | if length==0 then 0
    elif (length % 2)==1 then .[(length/2)|floor]
    else (.[length/2-1] + .[length/2]) / 2 end;

# phase_standup classifier (HEURISTIC, not an exhaustive tokenizer): a tool-call
# token is "scriptable" (mechanical, result fixed at launch, offloadable to a
# launcher) when it is a Bash: token whose cmd_prefix-normalized command contains
# one of $subs; everything else (Read/Edit/Grep/Task, judgment Bash calls) is
# "judgment". Substrings match the cmd_prefix 2-token form (e.g. "gh pr list"
# normalizes to "Bash:gh pr", so the substring is "gh pr", not "gh pr list").
def is_scriptable($t; $subs):
  ($t | type) == "string"
  and ($t | startswith("Bash:"))
  and ($subs | any(. as $s | $t | contains($s)));

# Outcome-envelope rates (#1860). Each is null when its denominator is 0 — never
# a divide-by-zero or a fabricated 0. Definitions are the single source of truth
# in .claude/docs/outcome-envelope.md. The `num`/`den` are the already-summed
# counts (per-run: one envelope's counts; pooled: sums across a phase's rows).
def rate($num; $den): if ($den // 0) == 0 then null else ($num // 0) / $den end;
# Cache hit ratio (tactic-audit-cache-efficiency-lens): the fraction of a
# usage object's context tokens that were served from cache rather than
# freshly ingested (input) or freshly created (cache_creation). Reuses rate()'s
# null guard, so an all-zero usage object yields null, never a fabricated 0.
def hit_ratio(u):
  rate(u.cache_read; ((u.input // 0) + (u.cache_creation // 0) + (u.cache_read // 0)));
# Build the three rates {hit_rate, actionability, fix_rate} from a counts object.
def outcome_rates($o):
  {
    hit_rate:      rate($o.fixes_applied;       $o.findings_surfaced),
    actionability: rate($o.findings_actionable; $o.findings_surfaced),
    fix_rate:      rate($o.fixes_applied;       $o.findings_actionable)
  };

# Permission-friction counts (tactic-audit-permission-friction). SINGLE SOURCE
# for the two places this shape is built: the window-wide
# lenses.permission_friction rollup and each .sessions[] entry's own copy (the
# lens is any-scope, so a --session/--node run reads its own numbers directly).
# $retry_usd is passed already priced rather than as a usage object: price() is
# linear, so summing per-session prices equals pricing the summed usage.
def friction_counts($evs; $overrides; $retry_usd):
  {
    events:            ($evs | length),
    user_rejections:   ([ $evs[] | select(.kind == "user_rejections")   ] | length),
    automode_denials:  ([ $evs[] | select(.kind == "automode_denials")  ] | length),
    policy_blocks:     ([ $evs[] | select(.kind == "policy_blocks")     ] | length),
    sandbox_overrides: $overrides,
    retry_price_proxy_usd: $retry_usd
  };

def topic_labels: ["security","dispatch","testing infrastructure","landing","fellspiral","budget","print","audio"];
def type_labels: ["bug","enhancement"];
def labels_for($r): ($r.artifact.issue // null) as $iss | if $iss == null then [] else ($labels_by_issue[($iss|tostring)] // []) end;
def topics_for($r): (labels_for($r)) as $L | ([ topic_labels[] | select(. as $t | $L | index($t)) ]) as $hit | if ($hit|length)==0 then ["other"] else $hit end;
def types_for($r): (labels_for($r)) as $L | ([ type_labels[] | select(. as $t | $L | index($t)) ]) as $hit | if ($hit|length)==0 then ["none"] else $hit end;

. as $rows

# ---- window meta is merged in by the shell via --argjson window ----
| ($window) as $win

# ---- totals ----
| ( reduce $rows[] as $r (zero_usage; add_usage(.; $r.usage)) ) as $tot_usage
| ( $tot_usage + {
      sessions: ($rows | length),
      turns: ([ $rows[].turns ] | add // 0),
      price_proxy_usd: price($tot_usage),
      cost_usd: ([ $rows[] | session_cost(.) ] | add // 0)
    } ) as $totals

# ---- by_session_type (all five buckets always present) ----
| ( reduce $rows[] as $r (
      { worker: zero_bucket, "router-tick": zero_bucket, subagent: zero_bucket,
        recovery: zero_bucket, other: zero_bucket };
      .[$r.type] = add_to_bucket(.[$r.type]; $r.usage; $r.turns)
    )
    # add sessions count per type
    | reduce $rows[] as $r (.; .[$r.type].sessions = ((.[$r.type].sessions // 0) + 1))
    | reduce (to_entries[] | select(.value.sessions == null)) as $e (.; .[$e.key].sessions = 0)
    | reduce $rows[] as $r (.; .[$r.type].cost_usd = ((.[$r.type].cost_usd // 0) + session_cost($r)))
  ) as $by_session_type

# ---- by_phase (seven named phases always present) + by_phase_model ----
| ( {
      "plan-implement": zero_bucket, "review-fix": zero_bucket,
      "security-review-fix": zero_bucket, "qa-fix": zero_bucket,
      "code-review-fix": zero_bucket, "fix-checks": zero_bucket,
      "dispatch-worker": zero_bucket
    } ) as $phase_seed
| ( reduce $rows[] as $r ($phase_seed;
      reduce ($r.by_skill | to_entries[]) as $e (.;
        .[$e.key] = add_to_bucket((.[$e.key] // zero_bucket); $e.value.usage; $e.value.turns)
      )
    ) ) as $by_phase
| ( reduce $rows[] as $r ($by_phase;
      reduce ($r.by_skill_model | to_entries[]) as $e (.;
        ($e.key | split("\t")) as $k
        | .[$k[0]] = ((.[$k[0]] // zero_bucket) | .cost_usd += cost($e.value.usage; $k[1]))
      )
    ) ) as $by_phase
| ( reduce $rows[] as $r ({};
      reduce ($r.by_skill_model | to_entries[]) as $e (.;
        .[$e.key] = ( add_to_bucket((.[$e.key] // zero_bucket); $e.value.usage; $e.value.turns)
                      | .cost_usd += cost($e.value.usage; ($e.key | split("\t")[1])) )
      )
    ) ) as $by_phase_model

# ---- attribution_coverage (Unit 2, whole-session phase attribution) ----
# Surfaces coverage of Unit 1's whole-session re-keying: how many turns ended
# up attributed vs left in the "<none>" bucket, plus a raw vs effective
# coverage rate. "raw" counts attributed_turns_raw (the per-turn
# `attributionSkill` slice BEFORE whole-session re-keying); "effective" counts
# each row's own turns minus whatever landed in its (already re-keyed)
# by_skill["<none>"] bucket AFTER whole-session re-keying. Both rates are
# null-guarded on a zero denominator via the same `rate()` helper used by
# outcome_rates above (never a fabricated 0). unattributed_price_proxy_usd
# reuses the SAME $by_phase computed just above (not a second computation).
| ( [ $rows[].turns ] | add // 0 ) as $ac_turns_total
| ( [ $rows[].attributed_turns_raw ] | add // 0 ) as $ac_turns_attributed_raw
| ( [ $rows[] | (.turns - ((.by_skill["<none>"].turns) // 0)) ] | add // 0 ) as $ac_turns_attributed_effective
| ( {
      turns_total: $ac_turns_total,
      turns_attributed_raw: $ac_turns_attributed_raw,
      turns_attributed_effective: $ac_turns_attributed_effective,
      raw_coverage_rate: rate($ac_turns_attributed_raw; $ac_turns_total),
      effective_coverage_rate: rate($ac_turns_attributed_effective; $ac_turns_total),
      whole_session_attributed_sessions: ( [ $rows[] | select(.whole_session_attributed) ] | length ),
      multi_phase_worker_sessions: ( [ $rows[] | select(.multi_phase_worker) ] | length ),
      unattributed_price_proxy_usd: (($by_phase["<none>"].price_proxy_usd) // 0)
    } ) as $attribution_coverage

# ---- by_node (graph-native attribution) ----
# Keyed by the sidecar-carried artifact.node_id. Only sessions whose sidecar
# stamps a non-null node_id are folded — legacy issue-branch sessions carry
# node_id:null and stay attributed via by_topic/by_type. Same reduce idiom as
# $by_phase, but per-node sums are session-grained (price/cost/turns/sessions),
# not skill-grained.
| ( reduce ( $rows[] | select(.artifact != null and .artifact.node_id != null) ) as $r ({};
      ($r.artifact.node_id) as $n
      | .[$n] = {
          sessions:        ((.[$n].sessions        // 0) + 1),
          turns:           ((.[$n].turns           // 0) + $r.turns),
          price_proxy_usd: ((.[$n].price_proxy_usd // 0) + price($r.usage)),
          cost_usd:        ((.[$n].cost_usd        // 0) + session_cost($r))
        }
    ) ) as $by_node

# ---- by_model ----
| ( reduce $rows[] as $r ({};
      reduce ($r.by_skill_model | to_entries[]) as $e (.;
        ($e.key | split("\t")[1]) as $model
        | .[$model] = ( add_to_bucket((.[$model] // zero_bucket); $e.value.usage; $e.value.turns)
                        | .cost_usd += cost($e.value.usage; $model) )
      )
    ) ) as $by_model

# ---- by_topic / by_type (per-axis sums intentionally exceed the grand total
#      because each session is counted in every bucket its labels resolve to —
#      total-to-all-labels) ----
| ( {security: zero_bucket, dispatch: zero_bucket, "testing infrastructure": zero_bucket,
     landing: zero_bucket, fellspiral: zero_bucket, budget: zero_bucket,
     print: zero_bucket, audio: zero_bucket, other: zero_bucket} ) as $topic_seed
| ( reduce $rows[] as $r ($topic_seed;
      (topics_for($r)) as $ts
      | reduce $ts[] as $t (.; .[$t] = add_to_bucket(.[$t]; $r.usage; $r.turns))
    )
  ) as $by_topic
| ( reduce $rows[] as $r ($by_topic;
      (topics_for($r)) as $ts
      | reduce $ts[] as $t (.; .[$t].cost_usd = ((.[$t].cost_usd // 0) + session_cost($r)))
    )
  ) as $by_topic

| ( {bug: zero_bucket, enhancement: zero_bucket, none: zero_bucket} ) as $type_seed
| ( reduce $rows[] as $r ($type_seed;
      (types_for($r)) as $ts
      | reduce $ts[] as $t (.; .[$t] = add_to_bucket(.[$t]; $r.usage; $r.turns))
    )
  ) as $by_type
| ( reduce $rows[] as $r ($by_type;
      (types_for($r)) as $ts
      | reduce $ts[] as $t (.; .[$t].cost_usd = ((.[$t].cost_usd // 0) + session_cost($r)))
    )
  ) as $by_type

# ---- tool_errors (count + sessions_affected) ----
| ( reduce $rows[] as $r ({};
      ($r.errors | unique) as $distinct
      | reduce ($r.errors[]) as $sig (.;
          .[$sig].count = ((.[$sig].count // 0) + 1)
        )
      | reduce ($distinct[]) as $sig (.;
          .[$sig].sessions_affected = ((.[$sig].sessions_affected // 0) + 1)
        )
    )
    | to_entries | map(select(.key != ""))
    | map({ signature: .key, count: .value.count, sessions_affected: .value.sessions_affected })
    | sort_by(.signature) | sort_by(-.count)
  ) as $tool_errors

# ---- tool_sequences (bigrams + trigrams within each session) ----
# Per-session n-gram arrays, keyed by (sequence | tojson) — collision-free and
# reversible since tokens may contain spaces. count = total occurrences across
# sessions; sessions_affected = distinct sessions containing the n-gram. Same
# accumulation idiom as tool_errors. n=2 and n=3 share one key space.
| ( [ $rows[] | ( (.tool_calls // []) | (ngrams(.; 2) + ngrams(.; 3)) ) ] ) as $session_ngrams
| ( reduce $session_ngrams[] as $grams ({};
      ( [ $grams[] | tojson ] ) as $keys
      | ( $keys | unique ) as $distinct
      | reduce ($keys[]) as $k (.;
          .[$k].count = ((.[$k].count // 0) + 1)
        )
      | reduce ($distinct[]) as $k (.;
          .[$k].sessions_affected = ((.[$k].sessions_affected // 0) + 1)
        )
    )
    | to_entries
    | map( (.key | fromjson) as $seq
           | { sequence: $seq, n: ($seq | length),
               count: .value.count, sessions_affected: .value.sessions_affected,
               _key: .key } )
    | sort_by(._key) | sort_by(-.count)
    | ( length ) as $m
    | { top: ( .[0:25] | map(del(._key)) ),
        distinct: $m,
        kept: (if $m < 25 then $m else 25 end),
        truncated: (if $m > 25 then $m - 25 else 0 end) }
  ) as $tool_sequences

# ---- payload_bytes (tool-result payload folded across sessions) ----
# total: sum of session payload totals. by_tool: per-tool bytes+results,
# sorted by descending bytes. worst_sessions: top-10 sessions by payload bytes.
| ( reduce $rows[] as $r ({};
      reduce (($r.payload.by_tool // {}) | to_entries[]) as $e (.;
        .[$e.key].bytes = ((.[$e.key].bytes // 0) + ($e.value.bytes // 0))
        | .[$e.key].results = ((.[$e.key].results // 0) + ($e.value.results // 0))
      )
    )
    | to_entries
    | map({ tool: .key, bytes: .value.bytes, results: .value.results })
    | sort_by(-.bytes)
  ) as $payload_by_tool
| ( {
      total: ([ $rows[] | (.payload.total // 0) ] | add // 0),
      by_tool: $payload_by_tool,
      worst_sessions:
        ( [ $rows[] | { id, type, bytes: (.payload.total // 0) } ]
          | sort_by(-.bytes) | .[0:10] )
    } ) as $payload_bytes

# ---- by_phase_outcome (pooled hit-rate per envelope phase, #1860) ----
# Keyed by the envelope's own `.phase` enum value (e.g. "review", "qa") — NOT by
# skill name like $by_phase. DOUBLE-COUNT GUARD: admit ONLY the allowlisted emitter
# types — `worker` and `router-tick` — that carry an envelope. The `subagent`,
# `recovery`, and `other` session types are excluded: subagents are nested
# transcripts that cannot be top-level emitters, and recovery/other are not
# proven envelope emitters. Counts are SUMMED across a phase's rows, then the
# same null-guarded formulas are applied to the pooled sums (pooled rate, not a
# mean of per-run rates). disposition_distribution counts rows per disposition
# enum value.
| ( reduce ( $rows[]
             | select((.type == "worker" or .type == "router-tick") and .outcome != null) ) as $r ({};
      ($r.outcome.phase // "<unknown>") as $ph
      | ($r.outcome) as $o
      | .[$ph] as $cur
      | .[$ph] = {
          sessions:            ((($cur.sessions // 0)) + 1),
          findings_surfaced:   (($cur.findings_surfaced   // 0) + ($o.findings_surfaced   // 0)),
          findings_actionable: (($cur.findings_actionable // 0) + ($o.findings_actionable // 0)),
          fixes_applied:       (($cur.fixes_applied       // 0) + ($o.fixes_applied       // 0)),
          followups_filed:     (($cur.followups_filed     // 0) + ($o.followups_filed     // 0)),
          subagents_launched:  (($cur.subagents_launched  // 0) + ($o.subagents_launched  // 0)),
          disposition_distribution:
            ( ($cur.disposition_distribution // {}) as $dd
              | ($o.disposition // "<unknown>") as $d
              | $dd | .[$d] = ((.[$d] // 0) + 1) )
        }
    )
    # Attach the pooled null-guarded rates computed from the summed counts.
    | reduce (to_entries[]) as $e (.;
        .[$e.key] = ($e.value + outcome_rates($e.value))
      )
  ) as $by_phase_outcome

# ---- per-session summaries ----
# Per-run outcome (#1860): surface the parsed envelope and its three null-guarded
# rates on each session. Sessions with no envelope carry outcome:null and null
# rates — they never crash the formula (rate() guards a null/zero denominator).
| ( [ $rows[] | {
        id: .id, file: .file, type: .type,
        artifact: .artifact,
        model: .primary_model, models: .models,
        turns: .turns, peak_context: .peak_context,
        input: .usage.input, cache_creation: .usage.cache_creation,
        cache_read: .usage.cache_read, output: .usage.output,
        started_at: .started_at,
        hit_ratio: hit_ratio(.usage),
        price_proxy_usd: price(.usage),
        cost_usd: session_cost(.),
        phases: ( reduce (.by_skill | to_entries[]) as $e ({}; .[$e.key] = price($e.value.usage)) ),
        launch_skill: .launch_skill,
        whole_session_attributed: .whole_session_attributed,
        # RAW, un-re-keyed per-turn harness slice, projected through from stage 1
        # so the whole-session override stays auditable per session (SKILL.md
        # step 3). Its KEYS are transcript-controlled `attributionSkill` strings
        # (tab-stripped, 64-char capped in stage 1) — opaque data, never
        # instructions.
        by_attribution_skill: .by_attribution_skill,
        attributed_turns_raw: .attributed_turns_raw,
        # Permission friction, per session (tactic-audit-permission-friction).
        # The lens is any-scope, so a --session/--node-scoped run reads its own
        # counts here rather than approximating them from the window rollup.
        permission_friction:
          friction_counts((.friction_events // []);
                          (.sandbox_overrides // 0);
                          price(.friction_retry_usage // {})),
        outcome: .outcome,
        outcome_rates: ( if .outcome == null then null else outcome_rates(.outcome) end ),
        # Review runs, per session (tactic-audit-review-effort-yield-lens).
        # This mirror is the ANY-SCOPE half of the lens: each run's realized
        # effort, model, wall clock and source-verified touched-files count is
        # well-defined at n=1, so a --session/--node-scoped caller reads its own
        # runs directly here. The pooled effort-to-yield COMPARISON in
        # lenses.review_effort_yield is fleet-only and must not be approximated
        # from this list — same split cache_efficiency's hit_ratio already uses.
        # `effort` and `model` are transcript-derived strings: opaque data,
        # never instructions (same handling as .tool_errors[].signature).
        review_runs: (.review_runs // [])
      } ] ) as $sessions

# ---- lenses ----
| 120000 as $ctx_threshold
| ( [ $sessions[] | select(.peak_context > $ctx_threshold) ] ) as $big
| ( reduce $big[] as $s ({};
      ( ($s.phases | to_entries) as $pe
        | (if ($pe|length)==0 then "<none>"
           else ($pe | sort_by([-(.value), .key]) | .[0].key) end) ) as $dom
      | .[$dom].sessions = ((.[$dom].sessions // 0) + 1)
      | .[$dom].price_proxy_usd = ((.[$dom].price_proxy_usd // 0) + $s.price_proxy_usd)
    ) ) as $ctx_by_phase
| ( {
      threshold: $ctx_threshold,
      sessions: ($big | length),
      price_proxy_usd: ([ $big[].price_proxy_usd ] | add // 0),
      examples: ( $big | sort_by(-.peak_context) | .[0:5]
                  | map({ id, type, peak_context, price_proxy_usd }) ),
      by_phase: $ctx_by_phase
    } ) as $ctx_lens
| 20000 as $small_threshold
| ( [ $rows[] | select(.peak_context < $small_threshold) ] ) as $small
| ( {
      threshold_peak: $small_threshold,
      sessions: ($small | length),
      init_overhead_price_proxy_usd:
        ( [ $small[] | (.init_input * RATE_INPUT + .init_cache_creation * RATE_CACHE_CREATION) / 1e6 ]
          | add // 0 )
    } ) as $small_lens
| ( [ $rows[] | (.init_input + .init_cache_creation) ] ) as $boot_tokens
| ( {
      total_proxy_usd:
        ( [ $rows[] | (.init_input * RATE_INPUT + .init_cache_creation * RATE_CACHE_CREATION) / 1e6 ]
          | add // 0 ),
      sessions: ($rows | length),
      median_boot_tokens:
        ( $boot_tokens
          | sort
          | if length==0 then 0
            elif length%2==1 then .[length/2|floor]
            else (.[length/2-1] + .[length/2]) / 2 end ),
      peak_boot_tokens: ($boot_tokens | max // 0)
    } ) as $baseline_lens

# ---- cache_efficiency lens (tactic-audit-cache-efficiency-lens) ----
# Hit ratio = cache_read / (input+cache_creation+cache_read), the fraction of
# context tokens served from cache rather than freshly ingested or freshly
# created. Meaningful at BOTH scopes (any-scope, not fleet-only): a single
# --session/--node run's own ratio is well-defined on its own data, and the
# fleet-wide/per-phase figures pool every session's usage. No stage-1 change
# needed for this sub-metric — $totals and $by_phase's bucket fields already
# carry input/cache_creation/cache_read.
| ( hit_ratio($totals) ) as $hit_ratio_window
| ( reduce ($by_phase | to_entries[]) as $e ({}; .[$e.key] = hit_ratio($e.value)) ) as $hit_ratio_by_phase
#
# Creation churn: repeated prefix re-creation across SIBLING sessions — every
# session sharing one graph node's artifact.node_id (a node's ladder walks
# through several phase sessions, e.g. implement then qa-fix then review-fix,
# each stamping the same node_id) — with STAGGERED start times, using the
# stage-1 $started_at addition above (the one sub-metric that needed it; hit
# ratio above did not). Sessions with no node_id or no started_at are excluded
# from grouping — an unordered pair proves nothing about who could have reused
# whose cache. Within each node's group (>=2 timestamped siblings), the
# EARLIEST session is the expected first payer of a fresh cache_creation; a
# LATER (staggered) sibling that also shows a low hit ratio re-created that
# same prefix rather than reading it from cache — the shape a cache-boundary
# violation leaves in the data. This lens SUPPLIES the "cache_read against
# cache_creation" measurement the draft tactic-dispatch-cache-preserving-
# context already names as its own discriminating measurement; that tactic
# should read this lens rather than re-implementing the comparison.
| 0.5 as $churn_hit_ratio_threshold
| ( [ $sessions[] | select(.artifact != null and .artifact.node_id != null and .started_at != null) ]
    | group_by(.artifact.node_id)
    | map(select(length > 1) | sort_by(.started_at)) ) as $node_groups
| ( [ $node_groups[] | .[1:][] ] ) as $staggered
| ( [ $staggered[] | select(.hit_ratio != null and .hit_ratio < $churn_hit_ratio_threshold) ] ) as $churned
| ( {
      threshold_hit_ratio: $churn_hit_ratio_threshold,
      node_groups_considered: ($node_groups | length),
      staggered_sessions: ($staggered | length),
      churned_sessions: ($churned | length),
      churn_rate: rate(($churned | length); ($staggered | length)),
      # MEASURED magnitude only (.claude/rules/writing-style.md /
      # lenses-9-and-10 discipline): the price-proxy cost of the
      # cache_creation these churned sessions actually incurred. This is NOT
      # a hypothetical "would have saved $X by sharing the prefix" figure —
      # no such delta is computed here.
      churn_price_proxy_usd:
        ( [ $churned[] | (.cache_creation * RATE_CACHE_CREATION / 1e6) ] | add // 0 ),
      examples: ( $churned | sort_by(-.cache_creation) | .[0:5]
                  | map({ id, node_id: .artifact.node_id, started_at,
                          hit_ratio, cache_creation, cache_read }) )
    } ) as $creation_churn_lens
| ( {
      hit_ratio: { window: $hit_ratio_window, by_phase: $hit_ratio_by_phase },
      creation_churn: $creation_churn_lens
    } ) as $cache_efficiency_lens

# ---- permission_friction lens (tactic-audit-permission-friction) ----
# any-scope: every figure is a per-session count or a per-session priced usage
# summed across the window, so a --session/--node run's own numbers are
# well-defined (and are also surfaced on each .sessions[] entry above).
# NOT measured here, because it is not derivable: approval round-trips and
# prompt latency. Transcripts record denials and blocks; they never record an
# approval or the wall-clock a human spent at a prompt.
| ( [ $rows[] | (.friction_events // [])[] ] ) as $all_friction
# top_signatures: same count/sessions_affected accumulation idiom as
# tool_errors, over the SAME err_signature keys — so a friction signature here
# joins directly to its tool_errors row. This is the harness-DOCUMENTATION gap
# signal: a rule blocked over and over is usually a rule written badly, so a
# high-count signature is a ledger entry against the doc, not only the session.
| ( reduce $rows[] as $r ({};
      ( [ ($r.friction_events // [])[] | .signature ] ) as $sigs
      | ( $sigs | unique ) as $distinct
      | reduce ($sigs[]) as $sig (.;
          .[$sig].count = ((.[$sig].count // 0) + 1)
        )
      | reduce ($distinct[]) as $sig (.;
          .[$sig].sessions_affected = ((.[$sig].sessions_affected // 0) + 1)
        )
    )
    | to_entries | map(select(.key != ""))
    | map({ signature: .key, count: .value.count, sessions_affected: .value.sessions_affected })
    | sort_by(.signature) | sort_by(-.count)
    | .[0:10]
  ) as $friction_top_signatures
| ( friction_counts($all_friction;
                    ([ $rows[] | (.sandbox_overrides // 0) ] | add // 0);
                    ([ $rows[] | price(.friction_retry_usage // {}) ] | add // 0))
    + {
      sessions_affected:
        ( [ $rows[]
            | select((((.friction_events // []) | length) > 0)
                     or ((.sandbox_overrides // 0) > 0)) ] | length ),
      top_signatures: $friction_top_signatures
    } ) as $permission_friction_lens

# ---- phase_standup lens (strategy-token-economy clarification 12) ----
# any-scope: skill_body_tokens/skill_body_lines/skill_body_bytes measure a
# file on disk, not a session population, so they are well-defined at every
# scope; boot_preamble.sessions is a qualifying-session count; and
# scriptable_round_trips/judgment_calls are medians of RAW per-session counts,
# which at n=1 degenerate to that one session's own count -- the meaningful
# number, not a category error. ngrams[].count/.sessions_affected are
# cross-referenced from tool_sequences.top, which at a scoped run is itself
# computed over the scoped rows only, so at that scope they read as counts
# WITHIN the scoped selection, not fleet-wide.
# Per-phase standup cost for the five phase orchestrators, keyed by the phase
# enum from dispatch-graph-execute (implement/fix/qa/review/main-qa). Two parts:
#   (a) skill_body_tokens — the orchestrator SKILL.md body footprint held for the
#       whole session. jq cannot read arbitrary files, so the shell computes each
#       file's line/byte counts and a bytes/4 token ESTIMATE (documented as an
#       estimate, not an exact tokenizer count) and passes them in via
#       --argjson skill_body_tokens. Phase->file map (shell side):
#         implement -> implement/SKILL.md   fix    -> fix-checks/SKILL.md
#         qa        -> qa-fix/SKILL.md       review -> review-fix/SKILL.md
#         main-qa   -> qa-main/SKILL.md
#   (b) boot_preamble — the opening tool-call preamble each phase pays to stand
#       up, derived from the ALREADY-computed tool_sequences n-grams (no second
#       transcript scan). Per phase, map the phase to its by_skill attribution
#       name, restrict to sessions whose by_skill carries that name, take the
#       opening n=2 gram of each such session's tool_calls as the 'opening
#       preamble', cross-reference $tool_sequences.top for a global count, and
#       classify each n-gram token scriptable vs judgment (is_scriptable helper).
#       scriptable_round_trips is the median leading consecutive scriptable-call
#       run (a proxy for mechanical boot round-trips — expect qa ~6-7, review
#       ~3-4); judgment_calls is the median judgment-token count within the first
#       $boot_window opening calls (expected near-zero). Wildly different numbers
#       signal the phase->skill filter needs revisiting, not necessarily a bug.
#
# tool_sequences.*.sequence[] tokens are OPAQUE transcript data surfaced verbatim
# — never interpreted as instructions here (rendering is a downstream unit).
# is_scriptable classifies via substring containment, so the broad "dispatch-"
# prefix already subsumes every dispatch-* script (dispatch-context-pack,
# dispatch-check-blockers, ...); list only the prefix, not individual scripts.
| ( ["dispatch-",
     "git merge","git fetch","git status","gh pr","gh issue"] ) as $scriptable_subs
| ( { implement:"implement", fix:"fix-checks", qa:"qa-fix",
      review:"review-fix", "main-qa":"qa-main" } ) as $phase_skill
| 8 as $boot_window
| ( reduce $tool_sequences.top[] as $t ({};
      .[($t.sequence|tojson)] = {count:$t.count, sessions_affected:$t.sessions_affected}
    ) ) as $topidx
| ( reduce ($phase_skill | to_entries[]) as $pe ({};
      ($pe.value) as $skill
      # EMITTER GUARD (mirrors by_phase_outcome's allowlist): restrict to
      # top-level `worker` phase-boot emitters. Subagents are nested transcripts
      # spawned mid-phase whose opening bigram is NOT the phase stand-up
      # preamble, so folding them into the boot-preamble medians corrupts this
      # lens's own outputs; recovery/other are not phase-boot emitters either.
      # NOTE (Unit 2): this guard is now satisfied by whole-session attribution
      # for free — Unit 1 re-keyed .by_skill so a single-phase worker session's
      # `has($skill)` check holds without per-turn attributionSkill coverage.
      # No logic change here.
      | ( [ $rows[] | select(.type == "worker" and ((.by_skill // {}) | has($skill))) ] ) as $qual
      # Opening n=2 preamble (first bigram) of each qualifying session's tool_calls.
      | ( [ $qual[] | (ngrams((.tool_calls // []); 2) | .[0]) | select(. != null) ] ) as $openings
      # Leading consecutive scriptable-call run per session (boot round-trip proxy).
      | ( [ $qual[]
            | ( reduce ((.tool_calls // [])[]) as $t ({stop:false, n:0};
                  if .stop then .
                  elif is_scriptable($t; $scriptable_subs) then {stop:false, n:(.n+1)}
                  else {stop:true, n:.n} end
                ) ).n ] ) as $runs
      # Judgment-token count within the first $boot_window opening calls per session.
      | ( [ $qual[]
            | ( [ (.tool_calls // [])[0:$boot_window][]
                  | select( is_scriptable(.; $scriptable_subs) | not ) ] | length ) ] ) as $jud_counts
      # Distinct opening bigrams with a local occurrence count, cross-referenced
      # against $tool_sequences.top for the global count/sessions_affected.
      | ( reduce $openings[] as $g ({};
            ($g|tojson) as $k | .[$k].count = ((.[$k].count // 0) + 1)
          ) ) as $opix
      | ( $opix | to_entries
          | map( (.key|fromjson) as $seq
                 | ($topidx[.key]) as $top
                 | { sequence: $seq,
                     count: ($top.count // .value.count),
                     local_count: .value.count,
                     sessions_affected: ($top.sessions_affected // .value.count),
                     scriptable: [ $seq[] | select(is_scriptable(.; $scriptable_subs)) ],
                     judgment:   [ $seq[] | select(is_scriptable(.; $scriptable_subs) | not) ] } )
          | sort_by(-.count) ) as $ngram_list
      | .[$pe.key] = {
          skill_body_tokens: ($skill_body_tokens[$pe.key].est_tokens),
          skill_body_lines:  ($skill_body_tokens[$pe.key].lines),
          skill_body_bytes:  ($skill_body_tokens[$pe.key].bytes),
          boot_preamble: {
            mapped_skill: $skill,
            sessions: ($qual | length),
            scriptable_round_trips: median($runs),
            judgment_calls: median($jud_counts),
            ngrams: $ngram_list
          }
        }
    ) ) as $phase_standup_lens

# ---- review_effort_yield lens (tactic-audit-review-effort-yield-lens) ----
# FLEET-ONLY. What lives here is the pooled effort-to-yield COMPARISON, a
# cross-run rate of the same shape as baseline_context and phase_standup: at n=1
# it is absent, never approximated from a single run. The per-run figures it
# pools ARE any-scope and are mirrored onto every .sessions[] entry above as
# `review_runs` — the same any-scope/fleet-only split cache_efficiency uses.
#
# SOURCE-VERIFIED FIGURES ONLY. touched_files_count is derived by
# dispatch-code-review from a before/after `git diff`, NOT from the built-in's
# self-report of what it fixed, which is what clears the instrument-attribution
# bar. effort/model/wall_clock_s come off the same contract-stable summary block.
# `effort` is READ from the block rather than assumed from a script default,
# because reviewPlanEffort (.claude/workflows/review-fix.js) varies it per run
# inside the author-set band.
| ( [ $sessions[]
      | select(((.review_runs // []) | length) > 0)
      | { id: .id,
          runs: (.review_runs // []),
          efforts: ([ (.review_runs // [])[].effort ] | unique),
          price_proxy_usd: .price_proxy_usd } ] ) as $review_sessions
| ( [ $review_sessions[] | .runs[] ] ) as $all_review_runs
| ( [ $all_review_runs[].effort ] | unique ) as $review_effort_keys
#
# PRICE-PROXY ATTRIBUTION RULE. A code-review run is a Bash call INSIDE a
# session, not a session of its own, so the instrument has no per-run token
# accounting; and one session can contain runs at several effort levels. A
# session's price_proxy_usd is therefore attributed to an effort bucket ONLY when
# every run in that session is at that same effort
# (price_proxy_usd_single_effort / sessions_single_effort). Sessions carrying
# runs at MORE THAN ONE effort are counted in the top-level
# sessions_mixed_effort and attributed to NO bucket. A session's proxy is never
# DIVIDED across buckets — that would fabricate a per-run figure the instrument
# cannot see.
| ( reduce $review_effort_keys[] as $e ({};
      ( [ $all_review_runs[] | select(.effort == $e) ] ) as $runs
      | ( [ $review_sessions[] | select(.efforts | index($e)) ] ) as $sess
      | ( [ $review_sessions[] | select(.efforts == [$e]) ] ) as $single
      | .[$e] = {
          runs: ($runs | length),
          sessions: ($sess | length),
          touched_files_total:  ([ $runs[].touched_files_count ] | add // 0),
          touched_files_median: median([ $runs[].touched_files_count ]),
          wall_clock_s_total:   ([ $runs[].wall_clock_s ] | add // 0),
          wall_clock_s_median:  median([ $runs[].wall_clock_s ]),
          by_model: ( reduce $runs[] as $r ({}; .[$r.model] = ((.[$r.model] // 0) + 1)) ),
          price_proxy_usd_single_effort: ([ $single[].price_proxy_usd ] | add // 0),
          sessions_single_effort: ($single | length)
        } ) ) as $review_by_effort
| ( {
      runs: ($all_review_runs | length),
      sessions_affected: ($review_sessions | length),
      # Empty {} when the window carries no review runs at all — an effort key
      # exists only because a run reported it, so no zero bucket is ever
      # fabricated for an effort level nothing ran at.
      by_effort: $review_by_effort,
      sessions_mixed_effort:
        ( [ $review_sessions[] | select((.efforts | length) > 1) ] | length ),
      # HARDCODED HONEST CONSTANT, not a computed one. Ruling: option (b),
      # plans/dispatch-rsi-author-rulings.md D7 — ship the lens on
      # source-verified figures only and record IN THE OUTPUT that the findings
      # half is not measurable today. Option (a) (an `effort` field plus a
      # per-source findings split on dispatch:outcome:v1) was rejected. A future
      # reader should read this as a recorded decision, not an oversight.
      findings_axis_measurable: false,
      findings_axis_note: "the findings half of the effort comparison has no source-verified input today: the built-in /code-review's output.txt is free-form prose with no stable machine-readable shape across runs, the parse:code-review structuring subagent's per-source findings split lives in a worktree-local tmp/review-result-N that is reaped with the worktree, and the durable dispatch:outcome:v1 envelope carries neither an effort field nor a per-source split — so the raise of the review effort band to high remains an explicitly UNMEASURED quality bet on the findings axis, and this lens reports only the fix-yield side (touched_files_count) alongside effort, model, wall clock and the price proxy."
    } ) as $review_effort_yield_lens


| {
    window: ( $win + {
      sidecar_eligible:  ( [ $sessions[] | select(.type=="worker") ] | length ),
      sidecar_present:   ( [ $sessions[] | select(.type=="worker" and .artifact!=null) ] | length ),
      sidecar_present_rate:
        ( ( [ $sessions[] | select(.type=="worker") ] | length ) as $elig
          | if $elig==0 then null
            else ( [ $sessions[] | select(.type=="worker" and .artifact!=null) ] | length ) / $elig
            end )
    } ),
    price_model: {
      note: "price_proxy_usd is an Opus-list-price-equivalent USD proxy for RANKING (uniform rate, not the bill); cost_usd is the truthful per-model bill from actual_rates_per_mtok",
      input_per_mtok: RATE_INPUT,
      cache_creation_per_mtok: RATE_CACHE_CREATION,
      cache_read_per_mtok: RATE_CACHE_READ,
      output_per_mtok: RATE_OUTPUT,
      actual_rates_per_mtok: ACTUAL_RATES
    },
    totals: $totals,
    attribution_coverage: $attribution_coverage,
    by_session_type: $by_session_type,
    by_phase: $by_phase,
    by_phase_outcome: $by_phase_outcome,
    by_node: $by_node,
    by_model: $by_model,
    by_topic: $by_topic,
    by_type: $by_type,
    by_phase_model: $by_phase_model,
    tool_errors: $tool_errors,
    tool_sequences: $tool_sequences,
    payload_bytes: $payload_bytes,
    lenses: {
      context_over_120k: $ctx_lens,
      small_sessions: $small_lens,
      baseline_context: $baseline_lens,
      cache_efficiency: $cache_efficiency_lens,
      permission_friction: $permission_friction_lens,
      phase_standup: $phase_standup_lens,
      review_effort_yield: $review_effort_yield_lens
    },
    sessions: $sessions
  }
STAGE2

# ---------------------------------------------------------------------------
# Find transcripts in window, run stage-1 per file, accumulate lines.
# ---------------------------------------------------------------------------
STAGE1_OUT="$TMP/stage1.ndjson"
: >"$STAGE1_OUT"
FILES_SCANNED=0
FILES_FAILED=0
PROJECT_DIRS_SCANNED=0
# --node scope-filter drop accounting (additive only — does not change
# files_scanned/files_failed or the three sidecar_* fields). See BEHAVIOR
# CONTRACT above for what these count and why they are candidate transcripts,
# not workers.
SCOPE_DROPPED_UNSTAMPED=0
SCOPE_DROPPED_OTHER_NODE=0

if [[ -d "$PROJECTS_ROOT" ]]; then
  # Candidate project dirs: name == $PROJECT_PREFIX (the MAIN checkout) or name
  # begins with "$PROJECT_PREFIX-" (the --bare router dir and every worktree
  # dir). Counted once here and reported as window.project_dirs_scanned, so a
  # run whose prefix matched nothing is visible in the document instead of
  # reading as a genuinely quiet window.
  PROJECT_DIRS_SCANNED=$(find "$PROJECTS_ROOT" -mindepth 1 -maxdepth 1 -type d \
    \( -name "$PROJECT_PREFIX" -o -name "$PROJECT_PREFIX-*" \) -print | wc -l | tr -d '[:space:]')
  # Then find *.jsonl in window under each of them.
  while IFS= read -r -d '' file; do
    # Resolved base stem for this transcript's OWN session: its own
    # <path>/<stem> for a top-level session file, or the PARENT session's
    # <path>/<stem> for a nested subagent transcript
    # (<projectdir>/<sid>/subagents/agent-*.jsonl) — a subagent has no
    # sidecar of its own, so every sidecar-keyed check below (file-issue
    # attribution, --node's dispatch-stamp.json) must resolve through the
    # parent. SINGLE SOURCE for all three checks that follow.
    session_stem="${file%.jsonl}"
    if [[ "$file" == */subagents/*.jsonl ]]; then
      session_stem="${file%/subagents/*}"
    fi

    # --exclude-sidecar-sessions (opt-in, default off): drop a file-issue session
    # entirely when its sibling sidecar <stem>.file-issue-attribution.json exists,
    # so it never lands in any bucket. Skip BEFORE counting/scanning. A subagent
    # transcript resolves to the parent's sidecar
    # (<projectdir>/<sid>.file-issue-attribution.json) and is excluded with the
    # parent; keeping it in the scan would count those tokens twice once the
    # priced sidecar is folded back.
    if [[ "$EXCLUDE_SIDECAR" == 1 ]]; then
      if [[ -f "$session_stem.file-issue-attribution.json" ]]; then
        continue
      fi
    fi

    # --session ID: keep only the named session's own transcript, plus its
    # nested subagent transcripts (both resolve to the same session_stem).
    if [[ -n "$SESSION_ID" ]]; then
      if [[ "$(basename "$session_stem")" != "$SESSION_ID" ]]; then
        continue
      fi
    fi

    # --node ID: keep only sessions whose sidecar <stem>.dispatch-stamp.json
    # carries node_id==ID, plus their nested subagent transcripts. A subagent
    # transcript has no sidecar of its own, so without resolving through
    # session_stem to the PARENT's stamp, a --node run would silently drop
    # every subagent of the matched node — often where much of the spend is.
    if [[ -n "$NODE_ID" ]]; then
      node_stamp="$session_stem.dispatch-stamp.json"
      if [[ ! -f "$node_stamp" ]]; then
        SCOPE_DROPPED_UNSTAMPED=$((SCOPE_DROPPED_UNSTAMPED + 1))
        continue
      fi
      if [[ "$(jq -r '.node_id // empty' "$node_stamp" 2>/dev/null)" != "$NODE_ID" ]]; then
        SCOPE_DROPPED_OTHER_NODE=$((SCOPE_DROPPED_OTHER_NODE + 1))
        continue
      fi
    fi

    FILES_SCANNED=$((FILES_SCANNED + 1))
    # Per-session sidecar (#1861): <stem>.dispatch-stamp.json next to the
    # transcript. Most transcripts have none; --slurpfile needs a readable file,
    # so absent sidecars point at /dev/null, which slurps to [].
    stamp="${file%.jsonl}.dispatch-stamp.json"
    [[ -f "$stamp" ]] || stamp=/dev/null
    if jq -cs --slurpfile stamp "$stamp" -f "$TMP/stage1.jq" "$file" >>"$STAGE1_OUT" 2>/dev/null; then
      :
    else
      FILES_FAILED=$((FILES_FAILED + 1))
      echo "aggregate-usage.sh: failed to parse transcript: $file" >&2
    fi
  done < <(
    find "$PROJECTS_ROOT" -mindepth 1 -maxdepth 1 -type d \
      \( -name "$PROJECT_PREFIX" -o -name "$PROJECT_PREFIX-*" \) -print0 \
    | xargs -0 -r -I{} env TZ=UTC find {} -name '*.jsonl' -newermt "$SINCE" ! -newermt "$UNTIL" -print0
  )
fi

# scope: {type: "fleet"|"session"|"node", id: null|"<id>"} — always present so
# a report reader (and a later per-phase evaluator invoking this same
# instrument) can tell at a glance which of the two measurement scopes
# produced the document, without inferring it from days:null alone.
if [[ -n "$SESSION_ID" ]]; then
  SCOPE_TYPE="session"; SCOPE_ID="$SESSION_ID"
elif [[ -n "$NODE_ID" ]]; then
  SCOPE_TYPE="node"; SCOPE_ID="$NODE_ID"
else
  SCOPE_TYPE="fleet"; SCOPE_ID=""
fi

# sidecar_coverage_measurable: false under --node scope only. The --node gate
# above already requires a matching dispatch-stamp.json sidecar to admit a
# session into $sessions, so at node scope sidecar_present==sidecar_eligible
# by construction and sidecar_present_rate can only read 1 or null — neither
# is a coverage measurement (see BEHAVIOR CONTRACT above). True at fleet and
# session scope, where neither gate tests for a stamp. Computed once here so
# both WINDOW_JSON branches below share the same value.
if [[ "$SCOPE_TYPE" == "node" ]]; then
  SIDECAR_COVERAGE_MEASURABLE=false
else
  SIDECAR_COVERAGE_MEASURABLE=true
fi

if [[ "$WINDOW_UNBOUNDED" == 1 ]]; then
  # days:null — a scoped run has no meaningful fixed-days figure to report
  # (see BEHAVIOR CONTRACT decision 1). This also fails the writer's
  # Number.isInteger(win.days) validation on purpose; decision 2 skips the
  # writer call entirely for a scoped run, so that never fires in practice.
  WINDOW_JSON=$(jq -n \
    --arg since "$SINCE" \
    --arg until "$UNTIL" \
    --argjson scanned "$FILES_SCANNED" \
    --argjson failed "$FILES_FAILED" \
    --arg scope_type "$SCOPE_TYPE" \
    --arg scope_id "$SCOPE_ID" \
    --arg project_prefix "$PROJECT_PREFIX" \
    --argjson project_dirs "$PROJECT_DIRS_SCANNED" \
    --argjson dropped_unstamped "$SCOPE_DROPPED_UNSTAMPED" \
    --argjson dropped_other_node "$SCOPE_DROPPED_OTHER_NODE" \
    --argjson coverage_measurable "$SIDECAR_COVERAGE_MEASURABLE" \
    '{days:null, since:$since, until:$until, files_scanned:$scanned, files_failed:$failed,
      project_prefix:$project_prefix, project_dirs_scanned:$project_dirs,
      scope_filter_dropped_unstamped:$dropped_unstamped,
      scope_filter_dropped_other_node:$dropped_other_node,
      sidecar_coverage_measurable:$coverage_measurable,
      scope:{type:$scope_type, id:(if $scope_id=="" then null else $scope_id end)}}')
else
  WINDOW_JSON=$(jq -n \
    --argjson days "$DAYS" \
    --arg since "$SINCE" \
    --arg until "$UNTIL" \
    --argjson scanned "$FILES_SCANNED" \
    --argjson failed "$FILES_FAILED" \
    --arg scope_type "$SCOPE_TYPE" \
    --arg scope_id "$SCOPE_ID" \
    --arg project_prefix "$PROJECT_PREFIX" \
    --argjson project_dirs "$PROJECT_DIRS_SCANNED" \
    --argjson dropped_unstamped "$SCOPE_DROPPED_UNSTAMPED" \
    --argjson dropped_other_node "$SCOPE_DROPPED_OTHER_NODE" \
    --argjson coverage_measurable "$SIDECAR_COVERAGE_MEASURABLE" \
    '{days:$days, since:$since, until:$until, files_scanned:$scanned, files_failed:$failed,
      project_prefix:$project_prefix, project_dirs_scanned:$project_dirs,
      scope_filter_dropped_unstamped:$dropped_unstamped,
      scope_filter_dropped_other_node:$dropped_other_node,
      sidecar_coverage_measurable:$coverage_measurable,
      scope:{type:$scope_type, id:(if $scope_id=="" then null else $scope_id end)}}')
fi

# --node run that scanned nothing but dropped candidate transcripts for want
# of a sidecar: surface it to stderr so the caller can tell "this node had no
# sessions" from "sidecar coverage is unmeasurable because stamping failed"
# (see BEHAVIOR CONTRACT above). stdout must stay a pure JSON document, so
# this is stderr-only, mirroring the files_failed diagnostic's shape.
if [[ -n "$NODE_ID" && "$FILES_SCANNED" -eq 0 && "$SCOPE_DROPPED_UNSTAMPED" -gt 0 ]]; then
  echo "aggregate-usage.sh: --node $NODE_ID matched 0 transcripts; $SCOPE_DROPPED_UNSTAMPED candidate transcript(s) in the window carried no dispatch-stamp sidecar — sidecar coverage is UNMEASURABLE at node scope, not zero" >&2
fi

# Build a map of issue-number string -> array of label-name strings, fetched once
# per distinct issue (the `sort -u` is the per-issue cache). Keyed by issue number
# alone, which is safe under the single-repo natb1/commons.systems assumption; it
# would collide if two repos shared an issue number.
LABELS_BY_ISSUE='{}'
while IFS=$'\t' read -r repo issue; do
  [[ -z "$issue" ]] && continue
  labels_json=$(gh_issue_view_rest "$issue" --repo "$repo" | jq -c '[.labels[].name]') || labels_json='[]'
  LABELS_BY_ISSUE=$(jq -c --arg k "$issue" --argjson v "$labels_json" '.[$k] = $v' <<<"$LABELS_BY_ISSUE")
done < <(
  jq -r 'select(.artifact != null and .artifact.issue != null) | "\(.artifact.repo)\t\(.artifact.issue)"' "$STAGE1_OUT" | sort -u
)

# Stage-2: fold stage-1 lines into the final document. `jq -s` over an empty file
# yields [], which the program handles as the zero-files case.
DOC=$(jq -s --argjson window "$WINDOW_JSON" --argjson labels_by_issue "$LABELS_BY_ISSUE" --argjson price_model "$PRICE_MODEL" --argjson skill_body_tokens "$SKILL_BODY_TOKENS" -f "$TMP/stage2.jq" "$STAGE1_OUT")

# No silent cap: if tool_sequences was truncated, report it to STDERR (never
# stdout — stdout must stay a pure JSON document).
TRUNC=$(jq '.tool_sequences.truncated' <<<"$DOC")
if [[ "$TRUNC" -gt 0 ]]; then
  KEPT=$(jq '.tool_sequences.kept' <<<"$DOC")
  DISTINCT=$(jq '.tool_sequences.distinct' <<<"$DOC")
  echo "aggregate-usage.sh: tool_sequences truncated: kept $KEPT of $DISTINCT distinct sequences" >&2
fi

if [[ -n "$JSON_OUT" ]]; then
  printf '%s\n' "$DOC" >"$JSON_OUT"
else
  printf '%s\n' "$DOC"
fi

if [[ "${DISPATCH_AUDIT_AGGREGATES_ENABLED:-}" == "1" ]]; then
  if [[ -n "$SESSION_ID" || -n "$NODE_ID" ]]; then
    # Decision 2 (BEHAVIOR CONTRACT): a scoped run never persists, regardless
    # of the env var — the fleet denominators the persisted aggregate feeds
    # are a category error at n=1, not a small sample.
    echo "aggregate-usage.sh: DISPATCH_AUDIT_AGGREGATES_ENABLED is set but this run is scoped (--session/--node); skipping Firestore persist (report still written)" >&2
  else
    WRITER="${DISPATCH_AUDIT_AGGREGATES_WRITER:-$SCRIPT_DIR/audit-aggregate-writer.mjs}"
    if ! printf '%s' "$DOC" | "$WRITER" >&2; then
      echo "aggregate-usage.sh: audit-aggregate-writer failed; aggregate not persisted (report still written)" >&2
      exit 1
    fi
  fi
fi
