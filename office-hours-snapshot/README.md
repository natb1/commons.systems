# office-hours-snapshot

Local producer for the office-hours dashboard's **encrypted local snapshot**.

It runs the same extracted Firestore cores the hosted Functions run
(`syncOfficeHoursCore`, `sampleDispatchQueueCore`, `collectProjectSignalsCore`),
plus topic-usage and capacity-band sampling, against an in-memory capture
Firestore with the local authenticated `gh` CLI as the GitHub transport. It
assembles the six dashboard fields into one plain-JSON document, encrypts it to a
BENC `.benc` file (the same format budget-etl uses and the #2659 reader consumes),
and writes it atomically to a directory on the user's machine (typically the
Google Drive mount).

This is the **dual-write** stage (#2658): the snapshot is produced locally
alongside the hosted Firestore producers, and `--parity` validates that the local
snapshot's SHAPE matches the live Firestore output before any cutover. The
Nix/systemd timer that schedules this binary is `nix/nixos/office-hours.nix`
(#2660).

## Entry point

The binary's source is `src/main.ts` — a thin shim over `run(argv, env, io)` in
`src/run.ts`. This package's `tsconfig` is type-check only (`noEmit`), so it does
not itself produce a `dist/`; the producer is run directly from source via
`npx tsx` by the Nix/systemd timer in `nix/nixos/office-hours.nix` (#2660), which
invokes it on its hourly schedule.

For local development you can run the TypeScript entry directly with `tsx`:

```
node --import tsx/esm office-hours-snapshot/src/main.ts [flags]
```

## Flags

| Flag | Default | Effect |
|------|---------|--------|
| `--scope full\|parked-only` | `full` | `full` runs all three cores + topic-usage + usage sampling and assembles all six fields. `parked-only` refreshes ONLY the parked-issues data + a cheap chain-health probe (no core runs, no project-signals / GA4 / GSC / PSI); the five non-parked fields carry prior-history values when available. |
| `--dry-run` | off | Skip the mount check, Secret Manager, and the Drive write. Print the serialized snapshot JSON to stdout. Member emails come from `OFFICE_HOURS_MEMBER_EMAILS_OVERRIDE` (else empty). No password required. |
| `--parity` | off | After producing, run `checkParity` against the live Firestore (needs ADC + Firestore read access). Print divergences; exit non-zero if not ok. The write still **proceeds** — parity is a shape-drift signal, not a gate. |
| `--plaintext` | off | DEBUG only: write the snapshot **unencrypted** to `office-hours-current.json` (never the `.benc` the reader opens). Bypasses the password requirement. |

Exit code is `0` on success, non-zero on any failure or a not-ok `--parity`
result.

## Produced files

Written into `OFFICE_HOURS_SNAPSHOT_DIR`:

- `office-hours-<TS>.benc` — an immutable, append-only, timestamped history file
  (`<TS>` is `YYYY-MM-DDTHH-MM-SS` local time).
- `office-hours-current.benc` — a stable pointer (a real **copy**, not a symlink —
  `ln -s` fails on the `/mnt/g` Drive mount). **This is the file the #2659 reader
  opens.**
- `office-hours-current.json` — only with `--plaintext`; unencrypted debug output.

Both `.benc` writes are atomic (temp file + rename), so a reader never sees a
partial file.

## Environment variables

Secrets (the encryption password and the member-email PII) are resolved at
runtime — the password from the environment (env-first, like budget-etl), the
member emails from Google Secret Manager via Application Default Credentials. All
other config is non-secret environment variables. Where the hosted Functions
already define an equivalent var (e.g. `OFFICE_HOURS_GROUP_ID`,
`OFFICE_HOURS_FIRESTORE_NAMESPACE`, `OFFICE_HOURS_GROUP_REPO`, the
`PROJECT_SIGNALS_*` and `GOOGLE_ANALYTICS_*` sources) the name is reused;
producer-specific concerns (the Drive dir, the password, the member-email secret
name, the dry-run override, usage payload) use new `OFFICE_HOURS_*` names. Note
`OFFICE_HOURS_QUEUE_REPOS` is a comma-separated list — the hosted function uses
the singular `DISPATCH_METRICS_QUEUE_REPO`.

### Required

| Var | Required when | Example | Notes |
|-----|---------------|---------|-------|
| `OFFICE_HOURS_GROUP_ID` | always | `nate` | Owning group id, denormalized into each doc. |
| `OFFICE_HOURS_QUEUE_REPOS` | always | `natb1/commons.systems` | Comma-separated `owner/name` list scanned for queue metrics + parked work. |
| `OFFICE_HOURS_SNAPSHOT_DIR` | not `--dry-run` | `/mnt/g/Shared drives/office-hours` | The Drive directory written to. Must already exist (deny-loud mount check). |
| `OFFICE_HOURS_SNAPSHOT_PASSWORD` | not `--dry-run`/`--plaintext` | (secret) | Password for the BENC AES-256-GCM key. The #2659 reader needs the same password. |
| `OFFICE_HOURS_GROUP_REPO` | `--scope full` | `natb1/office-hours-nate` | The repo scanned for open `jit:` reminder issues. |

### Defaulted

| Var | Default | Notes |
|-----|---------|-------|
| `OFFICE_HOURS_FIRESTORE_NAMESPACE` | `office-hours/prod` | Validated `office-hours/<env>`; also the parity comparison namespace. |
| `OFFICE_HOURS_MEMBER_EMAILS_SECRET` | `OFFICE_HOURS_MEMBER_EMAILS` | Secret Manager secret **name** holding the comma-separated member-email list. |
| `OFFICE_HOURS_GCP_PROJECT_ID` | `commons-systems` | GCP project the secret lives in. |

### Member-email PII

Real (non-dry-run) runs read the comma-separated member-email list from Google
Secret Manager (`projects/<OFFICE_HOURS_GCP_PROJECT_ID>/secrets/<OFFICE_HOURS_MEMBER_EMAILS_SECRET>/versions/latest`)
via ADC, and **fail closed** if the list is empty (an empty list would lock the
owner out of the snapshot doc). `--dry-run` never touches Secret Manager; it uses:

| Var | Notes |
|-----|-------|
| `OFFICE_HOURS_MEMBER_EMAILS_OVERRIDE` | `--dry-run` ONLY. Comma-separated plaintext member-email list; ignored in real mode. |

### Project-signals sources (optional)

Each source is **dormant** until configured; an absent source's sub-object is
simply omitted from the snapshot (no hard failure on missing Google credentials).
The Google OAuth credentials are sourced OUTSIDE this repo and only read here.

| Var | Default | Notes |
|-----|---------|-------|
| `PROJECT_SIGNALS_GITHUB_REPO` | (off) | `owner/name` for GitHub stars/forks/traffic, via the local authed `gh` (no token var needed). |
| `GOOGLE_ANALYTICS_CLIENT_ID` | (off) | GA4 + GSC share one OAuth credential. Set **all three** or none. |
| `GOOGLE_ANALYTICS_CLIENT_SECRET` | (off) | " |
| `GOOGLE_ANALYTICS_REFRESH_TOKEN` | (off) | Long-lived refresh token (`analytics.readonly` + `webmasters.readonly` scopes). |
| `PROJECT_SIGNALS_GA4_PROPERTY_ID` | (off) | Numeric GA4 property id (GA4 needs this + host-apps). |
| `PROJECT_SIGNALS_GA4_HOST_APPS` | (off) | `host:app,host:app,...` (e.g. `commons.systems:commons,budget.commons.systems:budget`). |
| `PROJECT_SIGNALS_GSC_SITE` | `sc-domain:commons.systems` | Search Console site (`sc-domain:` or `https://`). |
| `PROJECT_SIGNALS_PSI_URLS` | the 5 deployed app URLs | Comma-separated `https://` URLs to audit with PageSpeed Insights. |
| `PROJECT_SIGNALS_PSI_STRATEGY` | `mobile` | `mobile` or `desktop`. |
| `PAGESPEED_API_KEY` | (keyless) | Optional PSI key; only raises the rate limit. |

### Usage capacity-band sampling (optional, off by default)

| Var | Notes |
|-----|-------|
| `OFFICE_HOURS_USAGE_PAYLOAD_FILE` | Path to a JSON usage payload piped to `usage-sample-writer.mjs --dry-run`. When unset, no new usage point is appended (the series continues from prior history). The spawned writer additionally requires its own `DISPATCH_USAGE_SAMPLES_GROUP_ID` and (for `--dry-run`) `DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE` in the inherited environment — see `.claude/skills/dispatch-propagate/scripts/usage-sample-writer.mjs`. |

### Runtime requirements

- An authenticated `gh` CLI on `PATH` (GitHub transport for all GitHub reads).
- `--scope full` also shells `node` to run `topic-usage-writer.mjs --dry-run`
  (and, if configured, `usage-sample-writer.mjs --dry-run`).
- `--parity` needs Application Default Credentials with Firestore read access.
- Real-mode member-email resolution needs ADC with Secret Manager access.

## Manual QA

1. **End-to-end Drive write (real, encrypted):** set the required vars + ADC, run
   with no flags. Confirm a new `office-hours-<TS>.benc` and an updated
   `office-hours-current.benc` appear in `OFFICE_HOURS_SNAPSHOT_DIR`, and the
   process exits 0.
2. **Parked-only:** run `--scope parked-only`. Confirm it completes quickly
   (no core runs / project-signals) and still writes the snapshot, with the
   parked-issues field populated.
3. **Live parity:** run `--parity` against the live Firestore. Confirm
   `parity: ok` (or inspect any printed divergences); the snapshot is written
   regardless, and a not-ok result yields a non-zero exit.
4. **BENC decrypt round-trip:** decrypt `office-hours-current.benc` with the
   password (e.g. via the #2659 reader or the budget-etl `.benc` tooling) and
   confirm it parses as the six-field snapshot JSON. The automated counterpart is
   the `defaultIo.readPriorHistory round-trip` test in `src/run.test.ts`, which
   proves the series timestamps survive encrypt → write → read → decrypt as real
   `Date`s.
5. **Dry-run:** run `--dry-run` and confirm the serialized JSON prints to stdout
   and nothing is written to the Drive.

## Tests

```
npx vitest run --project office-hours-snapshot --root .
npx tsc -p office-hours-snapshot --noEmit
```
