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
#   - Output schema is a documented contract later units depend on; keys are
#     stable. See the stage-2 jq program below for the full shape.
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
    artifact: ( ($stamp[0] // null) | if . == null then null else {repo, issue, pr, base_sha, branch} end ),
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
    errors: $errors,
    tool_calls: $tool_calls,
    payload: $payload,
    outcome: $outcome
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

# --- Truthful per-model cost (#2027, generation-aware #2102) --------------
# Actual list rates per Mtok, keyed by a generation-aware rate class (see
# rate_class below). Unlike the proxy above, this prices each session by its
# REAL model so cost_usd is the actual bill. Convention: a bare family key
# (opus/sonnet/haiku) = the current generation; a *_3 / *_3_5 key = that
# retired Claude 3.x generation. Claude 3 cache rates are formula-derived
# (1.25x write / 0.1x read of input), not exact historical cents.
def ACTUAL_RATES:
  { opus:      {input:5,    cache_creation:6.25,    cache_read:0.50,  output:25},
    sonnet:    {input:3,    cache_creation:3.75,    cache_read:0.30,  output:15},
    haiku:     {input:1,    cache_creation:1.25,    cache_read:0.10,  output:5},
    opus_3:    {input:15,   cache_creation:18.75,   cache_read:1.50,  output:75},
    haiku_3:   {input:0.25, cache_creation:0.3125,  cache_read:0.025, output:1.25},
    haiku_3_5: {input:0.80, cache_creation:1.00,    cache_read:0.08,  output:4.00} };
def family($m):
  if   ($m | startswith("claude-opus") or startswith("claude-3-opus")) then "opus"
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
       else error("dispatch-token-audit: unpriceable model '\($model)' carries \($tok) tokens; add it to the price table") end)
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

# Outcome-envelope rates (#1860). Each is null when its denominator is 0 — never
# a divide-by-zero or a fabricated 0. Definitions are the single source of truth
# in .claude/docs/outcome-envelope.md. The `num`/`den` are the already-summed
# counts (per-run: one envelope's counts; pooled: sums across a phase's rows).
def rate($num; $den): if ($den // 0) == 0 then null else ($num // 0) / $den end;
# Build the three rates {hit_rate, actionability, fix_rate} from a counts object.
def outcome_rates($o):
  {
    hit_rate:      rate($o.fixes_applied;       $o.findings_surfaced),
    actionability: rate($o.findings_actionable; $o.findings_surfaced),
    fix_rate:      rate($o.fixes_applied;       $o.findings_actionable)
  };

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

# ---- by_model ----
| ( reduce $rows[] as $r ({};
      reduce ($r.by_skill_model | to_entries[]) as $e (.;
        ($e.key | split("\t")[1]) as $model
        | .[$model] = ( add_to_bucket((.[$model] // zero_bucket); $e.value.usage; $e.value.turns)
                        | .cost_usd += cost($e.value.usage; $model) )
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
        price_proxy_usd: price(.usage),
        cost_usd: session_cost(.),
        phases: ( reduce (.by_skill | to_entries[]) as $e ({}; .[$e.key] = price($e.value.usage)) ),
        outcome: .outcome,
        outcome_rates: ( if .outcome == null then null else outcome_rates(.outcome) end )
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

| {
    window: $win,
    price_model: {
      note: "price_proxy_usd is an Opus-list-price-equivalent USD proxy for RANKING (uniform rate, not the bill); cost_usd is the truthful per-model bill from actual_rates_per_mtok",
      input_per_mtok: RATE_INPUT,
      cache_creation_per_mtok: RATE_CACHE_CREATION,
      cache_read_per_mtok: RATE_CACHE_READ,
      output_per_mtok: RATE_OUTPUT,
      actual_rates_per_mtok: ACTUAL_RATES
    },
    totals: $totals,
    by_session_type: $by_session_type,
    by_phase: $by_phase,
    by_phase_outcome: $by_phase_outcome,
    by_model: $by_model,
    by_phase_model: $by_phase_model,
    tool_errors: $tool_errors,
    tool_sequences: $tool_sequences,
    payload_bytes: $payload_bytes,
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
  WRITER="${DISPATCH_AUDIT_AGGREGATES_WRITER:-$SCRIPT_DIR/audit-aggregate-writer.mjs}"
  if ! printf '%s' "$DOC" | "$WRITER" >&2; then
    echo "aggregate-usage.sh: audit-aggregate-writer failed; aggregate not persisted (report still written)" >&2
    exit 1
  fi
fi
