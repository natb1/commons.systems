---
id: tactic-terminal-disposition-sweep-park-without-cas
kind: tactic
statement: "lib-frozen-session-park's sweeps invoke park-node with no --base CAS
  token, so their already-parked guard is a bare read-then-write: a specific
  office_hours park that lands between the guard and the write is silently
  overwritten with generic boilerplate, destroying the author-facing reason and
  recommendation an office-hours reviewer needs"
owner: ai
status: raw
parent: null
rationale: "CONFIRMED 2026-08-04 by direct diff, with a line-level root cause.
  THE DEFECT: both sweeps in
  `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh` gate on
  an `already parked` check (step (8), `:487-495` and `:995-1001`) that reads
  `git show origin/main:intentions/<id>.md` and skips the candidate when
  `office_hours` is non-null. That guard is correct in shape but ADVISORY ONLY,
  because the write it guards passes no compare-and-swap token: the call sites
  build `park_args+=(\"$name\" \"$reason\" \"$recommendation\")` (step (12), and
  `:524` in the frozen sweep) and invoke `park-node` WITHOUT `--base`.
  `park-node` without `--base` sets `office_hours` unconditionally, so any park
  that lands in the window between the guard's read and the sweep's write is
  overwritten rather than refused. THE EVIDENCE: four clobbers on `origin/main`
  in the four days to 2026-08-04, each a specific park immediately followed by a
  generic `session ended without declaring a disposition` park on the same node
  -- `tactic-attention-surface-graph-read` (specific 1c09ccf1, clobbered 351s
  later), `tactic-explicit-node-reservation-sweep-policy` (ac4c24f7, 441s),
  `tactic-office-hours-select-fresh-main` (69cf82b3, 809s), and
  `tactic-test-decision-log-prod-leak` (754c2916, 28817s -- the long gap is a
  legitimate later re-park, not this race). `git diff ac4c24f7 bc1a2df4 --
  intentions/tactic-explicit-node-reservation-sweep-policy.md` shows both
  `reason` and `recommendation` replaced wholesale. THE CONSEQUENCE: the
  replacement text instructs the reader to `Read the session's transcript or
  attach the held job` -- but the sweep only fires on sessions that are already
  terminal, and the reap that follows deletes the job dir, so the boilerplate
  points at evidence the same lifecycle destroys. What is lost is precisely the
  author-decision content office-hours exists to consume. WHY IT COMPOUNDS: the
  sweep only ever sees these nodes because `qa-main`'s WAIT-park path and
  `qa-fix` never call `mark-node-terminal` (tracked as
  tactic-qa-fix-node-terminal-declaration), so the session never declares a
  disposition, `dispatch-self-close` holds it, and the sweep adopts it as a
  candidate. That gap supplies the candidates; this defect turns each one into
  data loss. Distinct from tactic-self-close-reap-silent-noop, which is about a
  reap that declines silently, not a park that overwrites. NOT A NEW DOCTRINE:
  the repository already specifies the correct shape in the diagnosis-time
  compare-and-swap reference -- capture each node's base blob at diagnosis time
  and pin it through `park-node --base`, routing an exit-3 stale-diagnosis
  refusal back to re-diagnosis. These sweeps predate or bypass that contract."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 12
  override: null
  rationale: Bug-ledger tracking node under the standing priority order
    (token-efficiency first, bug-ledger second). Boost 12 matches the other
    bug-ledger nodes in this cluster; re-simulated over the live store after
    writing to confirm 0 tier changes and 0 value drift onto non-target nodes.
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# lib-frozen-session-park's sweeps invoke park-node with no --base CAS token, so their already-parked guard is a bare read-then-write: a specific office_hours park that lands between the guard and the write is silently overwritten with generic boilerplate, destroying the author-facing reason and recommendation an office-hours reviewer needs

## Scope

`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh` only.

- `frozen_session_sweep` — guard at `:487-495`, write at `:524`.
- `terminal_without_disposition_sweep` — guard at `:995-1001`, write at step (12).

Both must capture the node's base blob at the moment the guard reads it and
pass it through as `park-node --base <blobsha>`. A CAS refusal is then the
CORRECT outcome: log it, retain the markers, and let the next tick re-diagnose
against fresh state. It must never be downgraded to a retry without the base.

Out of scope: the grace windows, the park caps, the fetch budget, the
marker-writing gap in the qa-main and qa-fix park paths, and the reap path.

## Interim mitigation, until the fix lands

The defect destroys content but is fully recoverable, because the pre-clobber
commit still holds the specific text.

**1. Detect.** Any hit is a clobber:

```bash
cd /home/n8/natb1/commons.systems && git fetch origin main -q
git log --since='-4 days' --format='%H%x09%ct%x09%s' origin/main -- intentions/ \
  | grep '^[0-9a-f]*	[0-9]*	graph: park ' \
  | awk -F'\t' '{n=$3; sub(/^graph: park /,"",n); split(n,a," ");
      g=($3 ~ /session ended without declaring a disposition/)?1:0;
      print $1"\t"$2"\t"a[1]"\t"g}' \
  | sort -k3,3 -k2,2n \
  | awk -F'\t' '{ if ($3==p3 && $4==1 && p4==0)
      print "CLOBBERED "$3" specific="ps" generic="$1" gap="($2-pt)"s";
      p3=$3; p4=$4; ps=$1; pt=$2 }'
```

A gap under the sweep grace (900s frozen, 300s terminal) is this defect. A much
larger gap is more likely a legitimate later re-park — check before restoring.

**2. Heal.** Recover the specific text from the pre-clobber commit. Parse it,
never grep, since YAML folds long values:

```bash
git show <specific-sha>:intentions/<id>.md > /tmp/claude-heal/<id>.md
# parse office_hours.reason and .recommendation via listNodes, write to files,
# then re-land, pinning the CAS token this defect fails to pin:
BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir "$SCRATCH" <id>)
packages/intentionsutil/scripts/park-node --base "$BASE" <id> "$REASON" "$REC"
```

Verify by reading `office_hours` back from `origin/main` and comparing the
restored strings for byte equality — `graph-commit` exit 0 is not evidence
anything landed.

**3. Reduce exposure.** Every candidate these sweeps adopt arrives because the
session never declared a terminal disposition, so closing that gap starves this
defect of inputs without touching it. Lowering
`DISPATCH_TERMINAL_DISPOSITION_PARK_MAX` to 1 narrows but does not close the
window — a concurrent writer can still land inside a single park's own
read-to-write span, which is what three of the four observed clobbers look like.

## Verification

```verify
cd /home/n8/natb1/commons.systems && bash -n .claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh
```

The real gate is behavioural and needs a fixture, not a shell parse: park a
scratch node specifically, drive a sweep whose guard read predates that park,
and assert the sweep REFUSES (stale-diagnosis skip logged, markers retained,
park count unincremented) rather than overwriting. Assert the specific `reason`
and `recommendation` survive byte-for-byte. Then run the detect above over a
full day and require zero hits.
