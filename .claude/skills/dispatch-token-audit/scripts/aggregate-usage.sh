#!/usr/bin/env bash
# Token-usage aggregation for the /dispatch-token-audit skill (#1177).
#
# This is the mechanical, token-heavy parsing layer. It scans Claude session
# transcripts within a time window and emits ONE structured JSON document that
# the skill's SKILL.md interprets — so the model reads compact aggregates, never
# the raw transcripts.
#
# WHAT IT SCANS
#   Projects root (default $HOME/.claude/projects, overridable via
#   DISPATCH_AUDIT_PROJECTS_ROOT) contains per-project directories. Two kinds are
#   scanned:
#     - per-issue worktree dirs whose name matches *worktrees*
#     - the router/heartbeat dir whose name matches *--bare
#   Session files are <projectdir>/<sessionid>.jsonl. Subagent transcripts nest at
#   <projectdir>/<sessionid>/subagents/agent-*.jsonl (their agent-*.meta.json
#   companions are NOT transcripts and are skipped — only *.jsonl is parsed). A
#   recursive find for *.jsonl picks up both top-level and subagent transcripts.
#
# USAGE
#   aggregate-usage.sh [--days N] [--json-out PATH]
#     --days N        window in days (default 7); files with mtime newer than
#                     "N days ago" are scanned. N must be a positive integer.
#     --json-out PATH write the document to PATH instead of stdout.
#   DISPATCH_AUDIT_PROJECTS_ROOT  override the projects root (used by the test
#                     fixture). Default: $HOME/.claude/projects.
#
# BEHAVIOR CONTRACT
#   - The window filter uses an explicit timestamp computed from `date -d`. The
#     relative `find -newermt '7 days ago'` form is BROKEN in this environment
#     (matches 0 files), so it is never used.
#   - Corrupt files are reported to stderr and tallied in window.files_failed —
#     never silently dropped (.claude/rules/code-style.md: clear errors over
#     defensive fallbacks).
#   - Output schema is a documented contract later units depend on; keys are
#     stable. See the stage-2 jq program below for the full shape.
#   - Prices are an Opus list-price-equivalent USD PROXY applied to every session
#     regardless of its actual model — a relative-magnitude figure for ranking,
#     NOT the actual bill.
#
# EXIT CODES
#   0  ok
#   2  usage error (bad/unknown arg, non-integer --days)
set -euo pipefail

# Fail fast if GNU date is not available (BSD/macOS date uses a different syntax).
if ! date -d '1 day ago' +%s >/dev/null 2>&1; then
  echo "error: GNU date required (this script does not support BSD/macOS date)" >&2
  exit 2
fi

DAYS=7
JSON_OUT=""
PROJECTS_ROOT="${DISPATCH_AUDIT_PROJECTS_ROOT:-$HOME/.claude/projects}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days)
      if [[ $# -lt 2 || "${2:-}" == -* || -z "${2:-}" ]]; then
        echo "error: --days requires a value" >&2; exit 2
      fi
      DAYS="$2"
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
      echo "usage: aggregate-usage.sh [--days N] [--json-out PATH]" >&2
      exit 2
      ;;
  esac
done

if [[ ! "$DAYS" =~ ^[1-9][0-9]*$ ]]; then
  echo "error: --days must be a positive integer, got '$DAYS'" >&2
  exit 2
fi

# Explicit-timestamp window bounds. The relative `-newermt '7 days ago'` form is
# broken here, so compute the concrete instant.
SINCE=$(date -d "$DAYS days ago" '+%Y-%m-%d %H:%M:%S')
UNTIL=$(date '+%Y-%m-%d %H:%M:%S')

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

# Coerce a .message.content (string OR array of blocks) to a flat string for
# classification matching.
def content_to_string(c):
  if (c|type) == "string" then c
  elif (c|type) == "array" then
    ( [ c[]? | if type=="string" then . elif type=="object" then (.text // "") else "" end ] | join(" ") )
  else "" end;

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

. as $msgs
| (asst) as $a
| (input_filename) as $path
| ($path | sub("\\.jsonl$"; "") | sub(".*/"; "")) as $id

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
    elif ($firstuser_str | test("dispatch-worker")) then "worker"
    else "other" end ) as $type

# Peak context across assistant msgs.
| ( [ $rows[] | (.u.input + .u.cache_read + .u.cache_creation) ] | (max // 0) ) as $peak_context

# Init overhead = first assistant message's input / cache_creation.
| ( ($a[0] // null) | if . == null then {input:0, cache_creation:0} else usage_of(.) end ) as $init_u

# by_skill and by_skill_model rollups.
| ( reduce $rows[] as $r ({};
      .[$r.skill] as $cur
      | .[$r.skill] = {
          usage: sum_usage([ ($cur.usage // {input:0,cache_creation:0,cache_read:0,output:0}), $r.u ]),
          turns: (($cur.turns // 0) + 1)
        }
    ) ) as $by_skill
| ( reduce $rows[] as $r ({};
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

| {
    type: $type,
    id: $id,
    file: $path,
    primary_model: $primary_model,
    models: $models,
    turns: ($a | length),
    peak_context: $peak_context,
    init_input: ($init_u.input),
    init_cache_creation: ($init_u.cache_creation),
    usage: sum_usage([ $rows[].u ]),
    by_skill: $by_skill,
    by_skill_model: $by_skill_model,
    errors: $errors
  }
STAGE1

# ---------------------------------------------------------------------------
# STAGE-2 jq — fold all stage-1 lines (fed as one array via -s) into the final
# document. The price proxy is applied here.
# ---------------------------------------------------------------------------
cat >"$TMP/stage2.jq" <<'STAGE2'
# --- Price proxy (EDITABLE rate constants) -------------------------------
# Opus list rates per Mtok. Applied to EVERY session regardless of its real
# model: a relative-magnitude USD PROXY for ranking, NOT the actual bill.
def RATE_INPUT:          15;
def RATE_CACHE_CREATION: 18.75;
def RATE_CACHE_READ:     1.5;
def RATE_OUTPUT:         75;
def price(u):
  ( (u.input          // 0) * RATE_INPUT
  + (u.cache_creation // 0) * RATE_CACHE_CREATION
  + (u.cache_read     // 0) * RATE_CACHE_READ
  + (u.output         // 0) * RATE_OUTPUT ) / 1e6;

def zero_usage: {input:0, cache_creation:0, cache_read:0, output:0};
def add_usage(a; b):
  {
    input:          ((a.input          // 0) + (b.input          // 0)),
    cache_creation: ((a.cache_creation // 0) + (b.cache_creation // 0)),
    cache_read:     ((a.cache_read     // 0) + (b.cache_read     // 0)),
    output:         ((a.output         // 0) + (b.output         // 0))
  };

# A flat bucket record {input,cache_creation,cache_read,output,turns,price_proxy_usd}
def zero_bucket: {input:0, cache_creation:0, cache_read:0, output:0, turns:0, price_proxy_usd:0};
def add_to_bucket(bucket; u; turns):
  ( add_usage(bucket; u) ) as $nu
  | $nu + {
      turns: ((bucket.turns // 0) + turns),
      price_proxy_usd: price($nu)
    };

. as $rows

# ---- window meta is merged in by the shell via --argjson window ----
| ($window) as $win

# ---- totals ----
| ( reduce $rows[] as $r (zero_usage; add_usage(.; $r.usage)) ) as $tot_usage
| ( $tot_usage + {
      sessions: ($rows | length),
      turns: ([ $rows[].turns ] | add // 0),
      price_proxy_usd: price($tot_usage)
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
| ( reduce $rows[] as $r ({};
      reduce ($r.by_skill_model | to_entries[]) as $e (.;
        .[$e.key] = add_to_bucket((.[$e.key] // zero_bucket); $e.value.usage; $e.value.turns)
      )
    ) ) as $by_phase_model

# ---- by_model ----
| ( reduce $rows[] as $r ({};
      reduce ($r.by_skill_model | to_entries[]) as $e (.;
        ($e.key | split("\t")[1]) as $model
        | .[$model] = add_to_bucket((.[$model] // zero_bucket); $e.value.usage; $e.value.turns)
      )
    ) ) as $by_model

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

# ---- per-session summaries ----
| ( [ $rows[] | {
        id: .id, file: .file, type: .type,
        model: .primary_model, models: .models,
        turns: .turns, peak_context: .peak_context,
        input: .usage.input, cache_creation: .usage.cache_creation,
        cache_read: .usage.cache_read, output: .usage.output,
        price_proxy_usd: price(.usage),
        phases: ( reduce (.by_skill | to_entries[]) as $e ({}; .[$e.key] = price($e.value.usage)) )
      } ] ) as $sessions

# ---- lenses ----
| 120000 as $ctx_threshold
| ( [ $sessions[] | select(.peak_context > $ctx_threshold) ] ) as $big
| ( {
      threshold: $ctx_threshold,
      sessions: ($big | length),
      price_proxy_usd: ([ $big[].price_proxy_usd ] | add // 0),
      examples: ( $big | sort_by(-.peak_context) | .[0:5]
                  | map({ id, type, peak_context, price_proxy_usd }) )
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

| {
    window: $win,
    price_model: {
      note: "Opus list-price-equivalent USD proxy; relative magnitude, not the bill",
      input_per_mtok: RATE_INPUT,
      cache_creation_per_mtok: RATE_CACHE_CREATION,
      cache_read_per_mtok: RATE_CACHE_READ,
      output_per_mtok: RATE_OUTPUT
    },
    totals: $totals,
    by_session_type: $by_session_type,
    by_phase: $by_phase,
    by_model: $by_model,
    by_phase_model: $by_phase_model,
    tool_errors: $tool_errors,
    lenses: {
      context_over_120k: $ctx_lens,
      small_sessions: $small_lens,
      baseline_context: $baseline_lens
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

if [[ -d "$PROJECTS_ROOT" ]]; then
  # Gather candidate project dirs (worktrees + bare), then find *.jsonl in window.
  while IFS= read -r -d '' file; do
    FILES_SCANNED=$((FILES_SCANNED + 1))
    if jq -cs -f "$TMP/stage1.jq" "$file" >>"$STAGE1_OUT" 2>/dev/null; then
      :
    else
      FILES_FAILED=$((FILES_FAILED + 1))
      echo "aggregate-usage.sh: failed to parse transcript: $file" >&2
    fi
  done < <(
    find "$PROJECTS_ROOT" -mindepth 1 -maxdepth 1 -type d \
      \( -name '*worktrees*' -o -name '*--bare' \) -print0 \
    | xargs -0 -r -I{} find {} -name '*.jsonl' -newermt "$SINCE" -print0
  )
fi

WINDOW_JSON=$(jq -n \
  --argjson days "$DAYS" \
  --arg since "$SINCE" \
  --arg until "$UNTIL" \
  --argjson scanned "$FILES_SCANNED" \
  --argjson failed "$FILES_FAILED" \
  '{days:$days, since:$since, until:$until, files_scanned:$scanned, files_failed:$failed}')

# Stage-2: fold stage-1 lines into the final document. `jq -s` over an empty file
# yields [], which the program handles as the zero-files case.
DOC=$(jq -s --argjson window "$WINDOW_JSON" -f "$TMP/stage2.jq" "$STAGE1_OUT")

if [[ -n "$JSON_OUT" ]]; then
  printf '%s\n' "$DOC" >"$JSON_OUT"
else
  printf '%s\n' "$DOC"
fi
