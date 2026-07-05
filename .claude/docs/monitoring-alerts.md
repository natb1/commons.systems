# Monitoring Alerts

Detective controls for the Firestore read-spike class of failure on the prod
`commons-systems` GCP project: a Cloud Monitoring alert on Firestore
`read_count`, plus a monthly billing budget. See epic #2686 and spike #2683.

## Why

This is a detective control. The #2683 read spike (Jun 28 → Jul 1 2026) ran
undetected for days because `commons-systems` had no Firestore read-volume
alert and no budget alert. Nothing watched the two signals that would have
caught it early: hourly read volume and monthly spend.

Root cause of that spike was two unbounded full-collection dashboard scans that
re-ran every ~5 minutes per open tab:

- `office-hours/src/usage-data.ts:15-19`
- `office-hours/src/issue-data.ts:15-21`

Each scan read the entire collection, so reads grew without bound as the
collections grew, multiplied by every open dashboard tab. Commit `3c961c7c`
fixed it by capping each scan at `limit(2000)`.

The fix stops the known spike. This alerting adds the missing detection, so a
similar regression — a new unbounded scan, or a cap that gets dropped — alarms
early instead of running silently until the bill arrives.

## What's committed

Three files under `ops/`:

- **`ops/monitoring/firestore-read-count-alert.json`** — a native Cloud
  Monitoring `AlertPolicy`. The apply script passes it straight to
  `gcloud monitoring policies create --policy-from-file=`, so its shape is
  exactly what that command expects.

- **`ops/monitoring/budget-alert.json`** — a parameter file, **not** a native
  gcloud policy file. `gcloud beta billing budgets create` has no
  `--policy-from-file` mode; it takes discrete flags (`--budget-amount`,
  `--threshold-rule`, and so on). So this file is our own small schema —
  `budgetAmount`, `currencyCode`, `thresholdPercents`, `projectId` — and the
  apply script reads those fields with `jq` and translates them into the
  matching flags. It is committed as a param file precisely because there is no
  file-driven budget-create command to feed a policy file to.

- **`ops/scripts/apply-alerts.sh`** — the apply orchestration. It resolves or
  creates the notification channel, creates the monitoring policy from the
  policy file, and creates the budget from the param file. It orchestrates
  gcloud calls only and must never run in CI — it needs project-owner GCP auth.

## Baseline / threshold rationale

The threshold comes from first principles about post-fix legitimate load.

The office-hours dashboard has 6 getters. After `3c961c7c`, each reads at most
`limit(2000)` documents per call. The dashboard auto-refreshes roughly 12 times
per hour per open tab. So the worst-case *legitimate* read volume is about:

```
6 getters × 2000 docs × 12 refreshes/hr × (a few concurrent tab-hours)
```

That lands in the low hundreds of thousands of reads per day, and it is spread
across the hours a tab happens to be open — a modest per-hour rate. A
regression that re-introduces an unbounded scan over a growing collection
pushes the *hourly* count far above that, because the per-scan cost is no
longer capped.

The committed policy fires on:

- metric `firestore.googleapis.com/document/read_count`
- aggregated over a `3600s` alignment period with `ALIGN_DELTA` /
  `REDUCE_SUM` (total reads in each 1-hour window)
- `thresholdValue` **40000** (`COMPARISON_GT`)
- `duration` **1800s** — the condition must hold for 30 minutes before it fires

So: **more than 40,000 reads/hour, sustained 30 minutes.** That sits
comfortably above the normal per-hour rate above, and well below a runaway
full-collection loop. The 30-minute sustain filters out brief, benign bursts
(a burst of tabs opening at once) while still catching a real regression within
the hour.

The budget backstops the same failure from the cost side. Firestore reads price
at about **$0.06 per 100k reads**. The project's normal monthly Firestore bill
is near zero, so a sustained runaway would materially exceed it and trip the
`$50/mo` budget's 50% threshold early — long before it reaches the full amount.

Both numbers — the **40,000 reads/hour** threshold and the **$50/mo** budget —
are tunable starting estimates. They are deliberately round first cuts. The
owner should adjust them once real post-fix traffic gives a measured baseline;
raise them if normal load turns out higher, lower them for a tighter tripwire.

## Notification channel

Both alerts notify the owner email **`nathan@natb1.com`**.

`apply-alerts.sh` resolves the channel with list-before-create: it lists
existing email channels for that address and reuses one if present, otherwise
creates it. This channel is a prerequisite for **both** alerts. Its resource id
is injected into the monitoring policy via `--notification-channels` and into
the budget via `--all-updates-rule-monitoring-notification-channels`.

No environment-specific channel id is committed to the repo — the id is
resolved at apply time and only exists in the live GCP project.

## Owner apply + verify

This runbook requires project-owner GCP auth. The autonomous dispatch runner
**cannot** run it — it has no owner GCP credentials — so this is the owner's
branch of the acceptance work.

1. **Authenticate and select the project:**

   ```
   gcloud auth login
   gcloud config set project commons-systems
   ```

2. **Apply the alerts:**

   ```
   ./ops/scripts/apply-alerts.sh
   ```

   The script prints the resolved channel id and a per-resource created
   summary when it finishes.

3. **Verify the resources exist:**

   ```
   gcloud monitoring policies list --project=commons-systems
   gcloud beta monitoring channels list --project=commons-systems
   ```

   For the budget, first resolve the billing account, then list budgets under
   it:

   ```
   gcloud billing projects describe commons-systems \
     --format='value(billingAccountName)'
   gcloud billing budgets list --billing-account=<ACCOUNT>
   ```

   `billingAccountName` comes back as `billingAccounts/<ACCOUNT>`; pass the bare
   id (without the `billingAccounts/` prefix) to `--billing-account`.

   Confirm the monitoring policy shows the `read_count` condition, the budget
   shows the `$50` amount with the 50 / 90 / 100% thresholds, and both point at
   the owner-email channel.

4. **Test-fire the alert.** Temporarily lower the policy `thresholdValue` (or
   generate enough read load) so the condition trips, confirm the owner
   receives the alert email, then restore the threshold to `40000`. This
   end-to-end check is the only way to confirm the channel actually delivers.
   The autonomous dispatch runner **cannot** perform this step — it requires
   owner auth and a live inbox.

Re-running `apply-alerts.sh` is **not** fully idempotent. Only the notification
channel step is idempotent (list-before-create). Steps 2 and 3 create a **new**
policy and a **new** budget every run, so a second run leaves duplicate
resources. If you need to re-apply, delete the stale policy and budget first:

```
gcloud monitoring policies delete <POLICY_ID> --project=commons-systems
gcloud billing budgets delete <BUDGET_ID> --billing-account=<ACCOUNT>
```
