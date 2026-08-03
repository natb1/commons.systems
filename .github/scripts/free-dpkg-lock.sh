#!/usr/bin/env bash
# Disable unattended-upgrades and free the dpkg/apt locks before a job runs
# apt-get.
#
# Called by BOTH jobs in .github/workflows/pr-checks.yml that shell out to
# apt-get (via playwright's `install --with-deps`): `preview-and-smoke` and
# `acceptance`. It lives here rather than inline in one job's `run:` block so
# the two cannot drift apart — the lib.sh `wait_for_dpkg_lock` backstop is
# shared between them too, and its default was lowered back to 30s, so a
# mitigation that defended only one job would leave the other one exposed.
#
# BEST EFFORT, ALWAYS SUCCEEDS. Every internal path logs and continues; the
# script exits 0 unconditionally. Deliberately NOT `set -e`: a mitigation that
# fails the job it is trying to protect is worse than no mitigation. Callers
# additionally set `continue-on-error: true` so that even the step timeout
# cannot gate a PR.
#
# ---- worst-case time budget -------------------------------------------------
# Every external call below is wrapped in `timeout`, so the step's worst case is
# bounded from inside the script rather than only by the caller's step cap:
#
#     20s  timeout 20 systemctl mask --now   (SYSTEMCTL_TIMEOUT)
#   + 20s  timeout 20 systemctl kill         (SYSTEMCTL_TIMEOUT)
#   + 10s  GRACE_SECONDS grace window        (deadline-bounded loop)
#   + 120s WAIT_SECONDS                      (ONE shared deadline across all
#                                             three lock files, not 120s each)
#   + 120s timeout 120 dpkg --configure -a   (DPKG_TIMEOUT)
#   ------
#   = 290s, under the callers' 300s (`timeout-minutes: 5`) step cap.
#
# The `fuser` probes and the `pkill` calls each carry a 5s timeout
# (FUSER_TIMEOUT / PKILL_TIMEOUT). They are sub-second in practice and only
# consume their 5s if a single call genuinely hangs, so they are charged against
# the 10s of margin above rather than added as their own line. Two paths can
# still exceed 290s: several probes hanging at once, and the rc=124 retry of
# `dpkg --configure -a` (up to +120s, see below). That is exactly why callers
# pair the 5-minute cap with `continue-on-error: true` — the cap is a safety
# stop on a best-effort step, never a PR gate.
set -uo pipefail

GRACE_SECONDS=10        # SIGTERM -> SIGKILL grace window
WAIT_SECONDS=120        # shared post-kill wall-clock wait for the locks to free
SYSTEMCTL_TIMEOUT=20    # per `systemctl` invocation
FUSER_TIMEOUT=5         # per `fuser` invocation
PKILL_TIMEOUT=5         # per `pkill` invocation
DPKG_TIMEOUT=120        # per `dpkg --configure -a` invocation

# apt-get takes the locks in this order (lock-frontend, lists/lock, dpkg/lock);
# a bare `dpkg` takes only /var/lib/dpkg/lock. Probe, kill and wait on all three
# so a non-apt holder is not invisible to us.
LOCKS=(/var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock /var/lib/dpkg/lock)

if command -v fuser >/dev/null 2>&1; then
  FUSER_OK=1
else
  FUSER_OK=0
  echo 'WARNING: fuser not installed (psmisc missing) - dpkg lock state UNKNOWN, skipping lock probes'
fi

# Bounded lock probe. Returns 0 when the lock is held, non-zero when free.
# A probe that times out (rc 124) is UNKNOWN, not free: reading a hung probe as
# a free lock would silently skip the SIGKILL escalation and the wait, which is
# the same class of bug as reading a missing `fuser` as a free lock. UNKNOWN is
# therefore reported as held — the conservative direction, and every consumer of
# this function is itself deadline-bounded, so it cannot spin forever.
lock_held() {
  local lock="$1" rc
  sudo timeout "$FUSER_TIMEOUT" fuser "$lock" >/dev/null 2>&1
  rc=$?
  if [ "$rc" -eq 124 ]; then
    echo "WARNING: fuser probe of $lock timed out after ${FUSER_TIMEOUT}s - lock state UNKNOWN, treating as held" >&2
    return 0
  fi
  return "$rc"
}

if [ "$FUSER_OK" -eq 1 ]; then
  for lock in "${LOCKS[@]}"; do
    if [ ! -e "$lock" ]; then
      echo "$lock: absent, nothing to probe"
      continue
    fi
    echo "$lock holders at step start:"
    sudo timeout "$FUSER_TIMEOUT" fuser -v "$lock" || echo "$lock: no holders at step start (or probe timed out)"
  done
fi

# Mask (not stop) all five units: both timers ship Persistent=true, so a
# daemon-reload later in this job (e.g. triggered by a package postinst during
# playwright's `install --with-deps`) would otherwise re-arm them and fire a
# missed run immediately, possibly re-acquiring the dpkg lock mid-job. mask
# --now survives daemon-reload and also stops the units, so the separate stop is
# dropped. The runner is ephemeral/single-use, so no unmask needed.
if mask_err=$(sudo timeout "$SYSTEMCTL_TIMEOUT" systemctl mask --now apt-daily.service apt-daily-upgrade.service apt-daily.timer apt-daily-upgrade.timer unattended-upgrades.service 2>&1); then
  echo 'systemctl mask: ok'
else
  rc=$?
  if [ "$rc" -eq 124 ]; then
    echo "systemctl mask: TIMED OUT after ${SYSTEMCTL_TIMEOUT}s (units may still be armed)"
  else
    echo "systemctl mask: failed (rc=$rc)"
  fi
  echo "$mask_err" >&2
fi
if kill_err=$(sudo timeout "$SYSTEMCTL_TIMEOUT" systemctl kill --kill-who=all apt-daily.service apt-daily-upgrade.service unattended-upgrades.service 2>&1); then
  echo 'systemctl kill: ok'
else
  rc=$?
  if [ "$rc" -eq 124 ]; then
    echo "systemctl kill: TIMED OUT after ${SYSTEMCTL_TIMEOUT}s (units may still be running)"
  else
    echo "systemctl kill: failed (rc=$rc)"
  fi
  echo "$kill_err" >&2
fi

# --- grace interval ----------------------------------------------------------
# Everything above is SIGTERM; everything below is SIGKILL. Give the signalled
# processes a short bounded window to exit on their own first: SIGKILLing a
# process that is mid `dpkg --unpack` leaves dpkg interrupted, and the next
# apt-get in this job (playwright's `install --with-deps`) then fails
# non-retryably. If every lock clears during the grace window, skip the SIGKILL
# stage entirely.
SKIP_SIGKILL=0
if [ "$FUSER_OK" -eq 1 ]; then
  grace_deadline=$(( $(date +%s) + GRACE_SECONDS ))
  while :; do
    held=0
    for lock in "${LOCKS[@]}"; do
      [ -e "$lock" ] || continue
      if lock_held "$lock"; then
        held=1
        break
      fi
    done
    if [ "$held" -eq 0 ]; then
      SKIP_SIGKILL=1
      break
    fi
    [ "$(date +%s)" -lt "$grace_deadline" ] || break
    sleep 1
  done
  if [ "$SKIP_SIGKILL" -eq 1 ]; then
    echo "holders cleared during ${GRACE_SECONDS}s grace, skipping SIGKILL escalation"
  else
    echo "holders still present after ${GRACE_SECONDS}s grace, escalating to SIGKILL"
  fi
else
  echo 'fuser unavailable: lock state UNKNOWN, skipping grace check and escalating to SIGKILL'
fi

if [ "$SKIP_SIGKILL" -eq 0 ]; then
  if sudo timeout "$PKILL_TIMEOUT" pkill -9 -f '[u]nattended-upgrade' 2>/dev/null; then
    echo 'killed unattended-upgrade process(es)'
  else
    echo 'no unattended-upgrade process to kill'
  fi
  if sudo timeout "$PKILL_TIMEOUT" pkill -9 -f 'apt[.]systemd[.]daily' 2>/dev/null; then
    echo 'killed apt.systemd.daily process(es)'
  else
    echo 'no apt.systemd.daily process to kill'
  fi
fi

# --- SIGKILL stage -----------------------------------------------------------
# Everything above targets named units / known argv patterns. The original
# flake's holder was a bare `apt-get` reparented out of its unit's cgroup, which
# none of those reach. `fuser -k` is the holder-agnostic last resort: it
# SIGKILLs whoever holds the file, whatever it is and whoever started it.
if [ "$FUSER_OK" -eq 1 ] && [ "$SKIP_SIGKILL" -eq 0 ]; then
  for lock in "${LOCKS[@]}"; do
    [ -e "$lock" ] || continue
    sudo timeout "$FUSER_TIMEOUT" fuser -k "$lock" >/dev/null 2>&1
    rc=$?
    if [ "$rc" -eq 0 ]; then
      echo "fuser -k: killed holder(s) of $lock"
    elif [ "$rc" -eq 124 ]; then
      echo "fuser -k: TIMED OUT after ${FUSER_TIMEOUT}s on $lock (holders may survive)"
    else
      echo "fuser -k: no holders of $lock"
    fi
  done
fi

# Bounded wait: ONE shared WAIT_SECONDS wall-clock deadline across all three
# lock files, not WAIT_SECONDS each — the job's total budget is fixed.
wait_expired=0
if [ "$FUSER_OK" -eq 1 ]; then
  wait_deadline=$(( $(date +%s) + WAIT_SECONDS ))
  for lock in "${LOCKS[@]}"; do
    if [ ! -e "$lock" ]; then
      echo "$lock: absent, no wait needed"
      continue
    fi
    if ! lock_held "$lock"; then
      echo "$lock: already free, no wait needed"
      continue
    fi
    wait_start=$(date +%s)
    expired=0
    while lock_held "$lock"; do
      if [ "$(date +%s)" -ge "$wait_deadline" ]; then
        echo "$lock still held at the shared ${WAIT_SECONDS}s deadline; holders:" >&2
        sudo timeout "$FUSER_TIMEOUT" fuser -v "$lock" >&2 || true
        expired=1
        wait_expired=1
        break
      fi
      sleep 1
    done
    if [ "$expired" -eq 0 ]; then
      echo "$lock freed after $(( $(date +%s) - wait_start ))s"
    fi
  done
fi

# Non-fatal dpkg recovery. Must come AFTER the wait loop, since
# `dpkg --configure -a` takes the locks itself. Run unconditionally rather than
# only when the SIGKILL stage fired: it is a fast no-op on a clean system, and
# one unconditional call reads more simply than gating on which rung of the
# ladder ran. The one exception is a wait loop that expired with holders still
# present, where it would only block on the held lock.
#
# rc=124 (the `timeout` timed-out status) is NOT a benign failure and must not
# be logged as one: a `dpkg --configure -a` killed part-way through is the exact
# state this recovery exists to clear, and it can leave dpkg interrupted for the
# next apt-get. Say so, and retry once — the first call's timeout usually means
# it was blocked behind a holder that has since gone away.
run_dpkg_configure() {
  sudo timeout "$DPKG_TIMEOUT" dpkg --configure -a
}
if [ "$wait_expired" -eq 1 ]; then
  echo 'dpkg --configure -a: skipped (lock still held at the wait deadline)'
else
  run_dpkg_configure
  rc=$?
  if [ "$rc" -eq 0 ]; then
    echo 'dpkg --configure -a: ok'
  elif [ "$rc" -eq 124 ]; then
    echo "dpkg --configure -a: TIMED OUT (may have left dpkg interrupted)"
    echo "dpkg --configure -a: retrying once with timeout ${DPKG_TIMEOUT}"
    run_dpkg_configure
    retry_rc=$?
    if [ "$retry_rc" -eq 0 ]; then
      echo 'dpkg --configure -a: ok on retry'
    elif [ "$retry_rc" -eq 124 ]; then
      echo 'dpkg --configure -a: TIMED OUT on retry (dpkg is likely left interrupted; the next apt-get may fail non-retryably)'
    else
      echo "dpkg --configure -a: failed on retry (rc=$retry_rc)"
    fi
  else
    echo "dpkg --configure -a: failed (rc=$rc)"
  fi
fi

exit 0
