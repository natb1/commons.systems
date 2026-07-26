---
id: tactic-office-hours-producer-never-ran
kind: tactic
statement: "office-hours-producer.service has never run in production: the unit
  declares EnvironmentFile=/etc/office-hours/producer.env, that file and its
  directory do not exist on the host, so systemd fails the unit before exec and
  no snapshot has ever been written to the Drive folder"
owner: human
status: raw
parent: null
rationale: "Discovered 2026-07-25 during the office-hours review of
  tactic-mainqa-office-hours-snapshot, by running the credential-free half of
  that node's verification checklist. The finding is a live production defect,
  not a verification result, so it is recorded separately rather than buried in
  the verification tactic's park reason — otherwise it is re-discovered at the
  start of the author's sitting. Evidence at recording time:
  office-hours-producer.timer is enabled (OnCalendar=hourly, Persistent=true,
  RandomizedDelaySec=5min, ordered After=mount-gdrive.service
  network-online.target) but office-hours-producer.service is 'Active: failed
  (Result: resources)'; journalctl -u office-hours-producer.service has zero
  entries, consistent with systemd failing the unit before exec rather than the
  producer erroring; and there is no office-hours directory anywhere under
  '/mnt/g/Shared drives/' (only audio, budget, print), so no snapshot has ever
  landed. Owner is human because the missing file holds
  OFFICE_HOURS_SNAPSHOT_PASSWORD and needs root to create — no autonomous worker
  can supply it. Author-directed at the 2026-07-25 office-hours sitting to file
  this as its own node."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# office-hours-producer.service has never run in production

## Context

`strategy-attention-surface`'s surface consumes the office-hours snapshot
pipeline: an hourly systemd timer runs a producer that writes an encrypted
`.benc` to a Google Drive folder, which the deployed office-hours app decrypts
and displays. The timer is installed and enabled. The service behind it has
never successfully run.

This is distinct from `tactic-mainqa-office-hours-snapshot`, which is the
*verification* of that pipeline against live production. That node assumes a
working pipeline to verify; this node is the defect preventing one from
existing.

## The defect

`office-hours-producer.service` declares:

```
EnvironmentFile=/etc/office-hours/producer.env
```

Neither `/etc/office-hours/producer.env` nor the `/etc/office-hours/` directory
exists on the host. systemd treats a missing `EnvironmentFile` as a unit
resource error, so it fails the unit **before exec** — which is why
`systemctl status` reports `Active: failed (Result: resources)` and
`journalctl -u office-hours-producer.service` is completely empty. An empty
journal for an enabled hourly timer is the diagnostic signature: the producer
never got far enough to log anything.

Corroborating: there is no `office-hours` directory under
`/mnt/g/Shared drives/` at all — only `audio`, `budget`, and `print`. No
snapshot has ever been written, so the app has never had one to load.

## Fix (author-only, about 10 minutes)

The env file holds the snapshot encryption password, so only the owner can
create it. The key contract is documented at `nix/nixos/office-hours.nix`
lines 40-70.

1. `sudo mkdir -p /etc/office-hours`
2. Create `/etc/office-hours/producer.env`, mode `0600`, owned by `n8`, with:
   - `OFFICE_HOURS_REPO_DIR` — absolute path to the checkout the unit `cd`s into
   - `OFFICE_HOURS_SNAPSHOT_DIR` — the Drive snapshot folder (**note: nothing
     office-hours-shaped exists under `/mnt/g/Shared drives/` yet, so this
     folder must be named and created too**)
   - `OFFICE_HOURS_GROUP_ID`
   - `OFFICE_HOURS_QUEUE_REPOS`
   - `OFFICE_HOURS_GROUP_REPO`
   - `OFFICE_HOURS_SNAPSHOT_PASSWORD`
3. `sudo systemctl start office-hours-producer.service`
4. `sudo systemctl reset-failed office-hours-producer.service` so the next
   timer fire starts clean.

## Verification

```verify
systemctl is-enabled office-hours-producer.timer
```

Manual, needs the owner:

- `sudo stat -c '%a %U' /etc/office-hours/producer.env` prints `600 n8`.
- `systemctl status office-hours-producer.service` no longer reports
  `Result: resources`. It either succeeds, or fails **inside** the producer —
  the latter is still progress, and is expected until
  `tactic-office-hours-snapshot-wire-contract` (PR #2805) lands, since three
  producer-to-reader breaks are still live on main.
- `journalctl -u office-hours-producer.service` is no longer empty. If it stays
  empty after a confirmed run, journald persistence is itself a finding on this
  host.
- After one hourly fire, a new `office-hours-<TS>.benc` exists in the
  configured snapshot directory.

## Relationship to other nodes

- `tactic-mainqa-office-hours-snapshot` (`phase: main-qa`) is the full 8-item
  live verification. Its checklist items 1 and 8 cannot pass until this defect
  is fixed. It is separately blocked by PR #2805.
- `tactic-office-hours-snapshot-wire-contract` (PR #2805, open) fixes three
  end-to-end producer breaks. Fixing this env-file defect does not depend on
  #2805 and can be done now; a successful *snapshot* additionally needs #2805.
