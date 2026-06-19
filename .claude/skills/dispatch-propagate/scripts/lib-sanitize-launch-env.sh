#!/usr/bin/env bash
# Sanitize the inherited shell environment before a dispatch launcher execs the
# chain (#1879).
#
# Symptom: when `dispatch` is launched from an env-bloated interactive shell
# (e.g. direnv layering a large PATH and a pile of DIRENV_* vars, plus whatever
# else accumulated in a long-lived terminal), the chain dies with
# "Argument list too long" (E2BIG). execve(2) caps the combined size of the
# argument vector AND the environment block at ARG_MAX; once the inherited
# environment alone approaches that ceiling, the very next external command the
# launcher runs fails to exec.
#
# This library defines one function, sanitize_launch_env(), that the Nix
# launcher wrappers `source` to prune the environment back under the ceiling.
#
# WHY THE ORDER MATTERS (this is the whole point):
#   The first two steps — unsetting the DIRENV_* family and deduplicating PATH —
#   MUST be exec-free (pure bash builtins, no external commands at all). They run
#   while the environment is still bloated, i.e. while execve would E2BIG. If
#   step 1 or step 2 shelled out to `tr`/`awk`/`sed`/`printf`-in-a-subshell, that
#   fork+exec would itself fail before it could shrink anything.
#   Only AFTER those builtin-only steps have pruned the environment is it safe to
#   run external commands. So the size guard (step 3) — which uses `env`, `wc`,
#   and `getconf` — comes last, when execve works again. Measuring the
#   environment BEFORE the prune would mean even `env | wc -c` could E2BIG.
#
# The wrappers also do an inline pre-source `unset` of the DIRENV_* family before
# they can even source this file; step 1 here repeats that defensively/
# idempotently. The inline pre-git bootstrap, any allowlist, and any `env -i`
# rebuild are out of scope for this library — it is exactly one function.
#
# Sourced under `set -euo pipefail` by the launcher wrappers, so every construct
# here is written to be safe under `set -u` (no unbound-variable trip) and not
# to trip `set -e` (the `|| true` guards on best-effort steps).

sanitize_launch_env() {
  # --- Step 1: re-unset the direnv family (defensive / idempotent) -----------
  # `${!DIRENV_@}` is bash prefix-name expansion: it lists the NAMES of all set
  # variables beginning with `DIRENV_`. When none are set it expands to nothing,
  # so `unset -v` is called with no operands — a harmless no-op, and crucially it
  # does NOT trip `set -u` (validated: empty expansion, no unbound-variable
  # error). `unset` cannot fail in any way we care about here, but the
  # `2>/dev/null || true` keeps a stray non-zero from tripping `set -e`. This is
  # a builtin — no fork, no exec — so it is safe while the env is still bloated.
  unset -v "${!DIRENV_@}" 2>/dev/null || true

  # --- Step 2: deduplicate PATH with an exec-free builtin loop ----------------
  # Duplicate PATH components are pure bloat: they cost execve budget without
  # adding any lookup capability. A direnv-layered interactive shell readily
  # accumulates the same entry many times over. We rebuild PATH keeping only the
  # first occurrence of each component (first-wins preserves lookup precedence),
  # using ONLY bash builtins — no `tr`, `awk`, `sed`, or subshell `printf`,
  # because this runs before the env is small enough for execve to succeed.
  #
  # `local IFS=:` makes word-splitting break PATH on `:`. `local -A seen` is an
  # associative array used as a set of components already emitted. The trailing
  # `|| true` guards the rare empty-PATH edge: with `set -e`, splitting an empty
  # value and finding no words is fine, but we keep the guard explicit.
  if [[ -n "${PATH:-}" ]]; then
    local IFS=:
    local -A seen=()
    local rebuilt=""
    local component
    for component in $PATH; do
      # Skip empty components (e.g. a leading/trailing/`::` colon yields an
      # empty word) so they don't bloat the result with stray separators.
      [[ -z "$component" ]] && continue
      if [[ -z "${seen[$component]:-}" ]]; then
        seen[$component]=1
        if [[ -z "$rebuilt" ]]; then
          rebuilt="$component"
        else
          rebuilt="$rebuilt:$component"
        fi
      fi
    done
    export PATH="$rebuilt"
  fi

  # --- Step 3: size guard (acceptance criterion 3) ---------------------------
  # Now that steps 1 and 2 have pruned the environment, external commands can
  # exec again, so we can finally measure. `env | wc -c` is the size of the
  # current environment block as a stream of `NAME=VALUE\n` records — a faithful
  # proxy for what execve must fit. We compare it against the kernel's ARG_MAX
  # (`getconf ARG_MAX`) minus a conservative 128 KB (131072-byte) safety margin.
  # The margin leaves headroom for the argument vector itself and for any per-arg
  # / per-env overhead the kernel charges beyond the raw bytes.
  #
  # If the pruned environment STILL exceeds the budget, no further automatic
  # pruning we are willing to do will help — the inherited shell is simply too
  # large — so we fail loud with an actionable message and `return 1` rather
  # than letting the next exec die with a cryptic E2BIG.
  local env_size arg_max budget
  env_size=$(env | wc -c)
  arg_max=$(getconf ARG_MAX)
  budget=$(( arg_max - 131072 ))

  if (( env_size > budget )); then
    echo "error: inherited shell environment is too large to launch dispatch (#1879)." >&2
    echo "  environment size after pruning: ${env_size} bytes" >&2
    echo "  budget (ARG_MAX ${arg_max} - 131072 safety margin): ${budget} bytes" >&2
    echo "  An oversized inherited shell environment is the cause: the combined" >&2
    echo "  environment + argument size exceeds the kernel's execve limit, so the" >&2
    echo "  next external command would die with 'Argument list too long' (E2BIG)." >&2
    echo "  Start dispatch from a fresh shell (a new terminal, or a clean login" >&2
    echo "  shell that has not accumulated a bloated environment), then retry." >&2
    return 1
  fi

  # Success: environment fits within budget. Implicit return 0.
}
