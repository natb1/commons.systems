#!/usr/bin/env node
// usage-sample-writer.mjs — firebase-admin writer for the office-hours capacity
// telemetry sampler (writer side of #1007; epic #1005's Capacity view).
//
// PURPOSE
//   Reads one JSON usage payload from stdin, validates env-var config and the
//   payload (fail-closed), assembles a `usage-samples` Firestore document, and
//   writes it to `office-hours/{env}/usage-samples/{autoId}` via the
//   firebase-admin SDK. The local sampler (a sibling shell script) gathers the
//   payload from the author's machine — `rate_limits.json`, `claude agents
//   --json`, and `dispatch-target-workers` — and pipes it here once per tick.
//   The hosted office-hours app cannot read those local sources, so the time
//   series is sampled locally and pushed to Firestore.
//
//   The admin SDK bypasses Firestore security rules, so this writer does NOT
//   depend on sibling #1006's rules being deployed. #1006 owns the schema,
//   parser/serializer, rules, and demo seed; this file is the writer only.
//
// CONFIG (environment variables)
//   Member emails are NOT read from the environment. In real mode they come from
//     the OFFICE_HOURS_MEMBER_EMAILS Firebase/GCP Secret Manager secret — the same
//     canonical secret the office-hours-sync Cloud Function reads (reused from
//     #1257, #1377). The PII therefore lives only in Secret Manager, never in the
//     repo, a shell var, or a local file.
//   DISPATCH_USAGE_SAMPLES_SECRET_NAME    optional, non-PII override for the secret
//     id; default "OFFICE_HOURS_MEMBER_EMAILS". Must be non-empty and contain no
//     "/" (it is interpolated into the secret resource path).
//   DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE  --dry-run ONLY test seam: the raw
//     comma-separated payload the secret would return. Consulted only in
//     --dry-run; real mode always reads Secret Manager and never consults it
//     (analogous to the DISPATCH_USAGE_SAMPLES_NOW time seam). Carries dummy
//     emails in tests; it is NOT a production source of PII.
//   DISPATCH_USAGE_SAMPLES_GROUP_ID       owning group id. Required; non-empty
//     and must contain no "/" (a slash would escape the collection path).
//   DISPATCH_USAGE_SAMPLES_NAMESPACE      default "office-hours/prod". Validated
//     with the same regex the Function uses, pinning writes to office-hours/<env>.
//   DISPATCH_USAGE_SAMPLES_TTL_DAYS       default "60". Integer in [30, 90]; out
//     of range or non-integer fails closed (clear error over a silent clamp, per
//     .claude/rules/code-style.md). Feeds `expireAt` (see below).
//   DISPATCH_USAGE_SAMPLES_PROJECT_ID     default "commons-systems".
//   DISPATCH_USAGE_SAMPLES_NOW            epoch SECONDS for `sampledAt`; defaults
//     to Math.floor(Date.now()/1000). Test-determinism seam; a positive integer.
//
// AUTH — Application Default Credentials (ADC)
//   Real-mode runs authenticate via ADC: either GOOGLE_APPLICATION_CREDENTIALS
//   pointing at a service-account key, or `gcloud auth application-default
//   login`. The SAME ADC authenticates BOTH the Secret Manager read (the member-
//   email list) and the firebase-admin Firestore write. This file does NOT
//   configure credentials — it relies on the ambient ADC of the author's machine
//   where the sampler runs. The service account needs
//   roles/secretmanager.secretAccessor on the OFFICE_HOURS_MEMBER_EMAILS secret.
//
// FAIL-SAFE CONTRACT (per .claude/rules/code-style.md; mirrors the "log and
// skip" posture of office-hours-sync.ts and dispatch-refresh-rate-limits)
//   Every validation or write failure prints exactly ONE stderr diagnostic line
//   prefixed "usage-sample-writer:" and exits non-zero (1). Credentials and
//   tokens are never echoed. Exit 0 only on a successful write (real mode) or a
//   successful validation+assembly (--dry-run).
//
// MODES
//   --dry-run  (first CLI arg): read stdin, run ALL config + payload validation,
//     take the member-email list from DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE,
//     assemble the doc with Timestamps rendered as ISO strings, print it as
//     pretty JSON to stdout, exit 0. Neither firebase-admin nor
//     @google-cloud/secret-manager is imported, so the bash unit tests
//     (test-dispatch-scripts.sh) stay dependency-free.
//   real mode (no --dry-run): dynamically import @google-cloud/secret-manager and
//     fetch the member-email list from the OFFICE_HOURS_MEMBER_EMAILS secret
//     (fail-fast, before any firebase-admin init), then dynamically import
//     firebase-admin, assemble the doc with firebase-admin Timestamps, `.add()`
//     it to the collection, print the new doc id to stdout, exit 0.
//   The field set and the epoch-second inputs are IDENTICAL between modes; only
//   the Timestamp representation differs (ISO string vs admin Timestamp).
//
// TTL / RETENTION (documented-only here)
//   `expireAt` = sampledAt + TTL days. It is the field a Firestore TTL policy
//   targets to age out old samples (~30–90 day retention). Provisioning that TTL
//   policy on the collection is OUT OF SCOPE for this writer — the field is
//   written so the policy can be attached separately.

const PREFIX = "usage-sample-writer:";

function fail(message) {
  process.stderr.write(`${PREFIX} ${message}\n`);
  process.exit(1);
}

// Read all of stdin to a string.
function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

// A finite JS number (not a string, NaN, or Infinity).
function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

// Default Secret Manager secret id for the member-email PII list. Reuses the
// canonical secret the office-hours-sync Cloud Function reads (#1257, #1377);
// do not create a second secret.
const DEFAULT_SECRET_NAME = "OFFICE_HOURS_MEMBER_EMAILS";

// Parse a comma-separated member-email payload into a trimmed, non-empty list.
// Identical semantics to office-hours-sync.ts: split on ",", trim, drop empties.
// An empty resolved list fails closed (the owner would be locked out of the doc).
function resolveMemberEmails(rawCsv) {
  const memberEmails = rawCsv
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (memberEmails.length === 0) {
    fail("member-email list resolved to an empty list");
  }
  return memberEmails;
}

// Parse + validate config from the environment. Returns a config object or
// calls fail() (which exits).
function loadConfig(env) {
  const secretName = env.DISPATCH_USAGE_SAMPLES_SECRET_NAME ?? DEFAULT_SECRET_NAME;
  if (secretName.length === 0) {
    fail("DISPATCH_USAGE_SAMPLES_SECRET_NAME must be non-empty");
  }
  if (secretName.includes("/")) {
    fail("DISPATCH_USAGE_SAMPLES_SECRET_NAME must not contain a slash");
  }

  const groupId = env.DISPATCH_USAGE_SAMPLES_GROUP_ID;
  if (typeof groupId !== "string" || groupId.length === 0) {
    fail("DISPATCH_USAGE_SAMPLES_GROUP_ID is required and must be non-empty");
  }
  if (groupId.includes("/")) {
    fail("DISPATCH_USAGE_SAMPLES_GROUP_ID must not contain a slash");
  }

  const namespace = env.DISPATCH_USAGE_SAMPLES_NAMESPACE ?? "office-hours/prod";
  if (!/^office-hours\/[A-Za-z0-9][A-Za-z0-9-]*$/.test(namespace)) {
    fail(`DISPATCH_USAGE_SAMPLES_NAMESPACE "${namespace}" is not a valid office-hours/<env> path`);
  }

  const ttlDaysStr = env.DISPATCH_USAGE_SAMPLES_TTL_DAYS ?? "60";
  if (!/^\d+$/.test(ttlDaysStr)) {
    fail(`DISPATCH_USAGE_SAMPLES_TTL_DAYS "${ttlDaysStr}" is not an integer`);
  }
  const ttlDays = Number(ttlDaysStr);
  if (ttlDays < 30 || ttlDays > 90) {
    fail(`DISPATCH_USAGE_SAMPLES_TTL_DAYS ${ttlDays} is outside the allowed range [30, 90]`);
  }

  const projectId = env.DISPATCH_USAGE_SAMPLES_PROJECT_ID ?? "commons-systems";
  if (typeof projectId !== "string" || projectId.length === 0) {
    fail("DISPATCH_USAGE_SAMPLES_PROJECT_ID must be non-empty");
  }
  if (projectId.includes("/")) {
    fail("DISPATCH_USAGE_SAMPLES_PROJECT_ID must not contain a slash");
  }

  let nowEpochSeconds;
  const nowStr = env.DISPATCH_USAGE_SAMPLES_NOW;
  if (nowStr === undefined || nowStr === "") {
    nowEpochSeconds = Math.floor(Date.now() / 1000);
  } else {
    if (!/^\d+$/.test(nowStr) || Number(nowStr) <= 0) {
      fail(`DISPATCH_USAGE_SAMPLES_NOW "${nowStr}" is not a positive integer`);
    }
    nowEpochSeconds = Number(nowStr);
  }

  return { secretName, groupId, namespace, ttlDays, projectId, nowEpochSeconds };
}

// Parse + validate the stdin payload. Returns a payload object or calls fail().
function loadPayload(raw) {
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    fail("stdin is not valid JSON");
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    fail("stdin payload must be a JSON object");
  }

  for (const field of ["fiveHourUsedPct", "weeklyUsedPct"]) {
    if (!isFiniteNumber(obj[field])) {
      fail(`payload field ${field} must be a finite number`);
    }
  }
  for (const field of ["activeWorkers", "targetWorkers"]) {
    if (!Number.isInteger(obj[field]) || obj[field] < 0) {
      fail(`payload field ${field} must be a non-negative integer`);
    }
  }

  // Resets are epoch seconds (integer) OR null.
  for (const field of ["fiveHourResetsAt", "weeklyResetsAt"]) {
    const v = obj[field];
    if (v !== null && (!Number.isInteger(v) || v <= 0)) {
      fail(`payload field ${field} must be a positive integer (epoch seconds) or null`);
    }
  }

  return {
    fiveHourUsedPct: obj.fiveHourUsedPct,
    weeklyUsedPct: obj.weeklyUsedPct,
    fiveHourResetsAt: obj.fiveHourResetsAt,
    weeklyResetsAt: obj.weeklyResetsAt,
    activeWorkers: obj.activeWorkers,
    targetWorkers: obj.targetWorkers,
  };
}

// Pure document assembly. `mkTimestamp(epochSeconds)` is the firebase-admin
// seam: --dry-run injects an ISO-string factory; real mode injects
// Timestamp.fromDate. The field set and epoch-second inputs are identical
// across modes; null resets stay null in both.
export function assembleDoc(payload, config, mkTimestamp) {
  return {
    sampledAt: mkTimestamp(config.nowEpochSeconds),
    fiveHourUsedPct: payload.fiveHourUsedPct,
    weeklyUsedPct: payload.weeklyUsedPct,
    fiveHourResetsAt:
      payload.fiveHourResetsAt === null ? null : mkTimestamp(payload.fiveHourResetsAt),
    weeklyResetsAt:
      payload.weeklyResetsAt === null ? null : mkTimestamp(payload.weeklyResetsAt),
    activeWorkers: payload.activeWorkers,
    targetWorkers: payload.targetWorkers,
    groupId: config.groupId,
    memberEmails: config.memberEmails,
    expireAt: mkTimestamp(config.nowEpochSeconds + config.ttlDays * 86400),
  };
}

async function main() {
  const dryRun = process.argv[2] === "--dry-run";

  const config = loadConfig(process.env);
  const raw = await readStdin();
  const payload = loadPayload(raw);

  if (dryRun) {
    // Dry-run member-email source — a test seam carrying the raw payload the
    // secret would return. Consulted ONLY here; never in real mode. Keeps the
    // bash unit suite (no @google-cloud/secret-manager installed) dependency-free.
    const rawSecret = process.env.DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE;
    if (rawSecret === undefined) {
      fail("--dry-run requires DISPATCH_USAGE_SAMPLES_SECRET_OVERRIDE");
    }
    config.memberEmails = resolveMemberEmails(rawSecret);

    // ISO-string factory — keeps firebase-admin out of the dependency graph so
    // the bash unit tests run without it. JSON.stringify renders Timestamps as
    // ISO strings and null resets as JSON null.
    const mkTimestamp = (epochSeconds) => new Date(epochSeconds * 1000).toISOString();
    const doc = assembleDoc(payload, config, mkTimestamp);
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  }

  // Real mode — resolve the member-email list from Secret Manager FIRST, before
  // any firebase-admin init, so a secret/credential failure fails fast through
  // main().catch -> fail() (one diagnostic, exit 1, no document, no creds echoed).
  const { SecretManagerServiceClient } = await import("@google-cloud/secret-manager");
  const secretClient = new SecretManagerServiceClient();
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${config.projectId}/secrets/${config.secretName}/versions/latest`,
  });
  if (!version?.payload?.data) {
    fail(`secret ${config.secretName} returned an empty or missing payload`);
  }
  const rawSecret = version.payload.data.toString("utf8");
  config.memberEmails = resolveMemberEmails(rawSecret);

  // Import firebase-admin only on this path.
  const { getApps, initializeApp } = await import("firebase-admin/app");
  const { getFirestore, Timestamp } = await import("firebase-admin/firestore");

  const app =
    getApps().length > 0 ? getApps()[0] : initializeApp({ projectId: config.projectId });

  const mkTimestamp = (epochSeconds) => Timestamp.fromDate(new Date(epochSeconds * 1000));
  const doc = assembleDoc(payload, config, mkTimestamp);

  const ref = await getFirestore(app).collection(`${config.namespace}/usage-samples`).add(doc);
  console.log(ref.id);
  process.exit(0);
}

main().catch((err) => {
  // Never echo credentials/tokens — surface only the error message text.
  const message = err && err.message ? err.message : String(err);
  fail(message);
});
