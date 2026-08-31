#!/usr/bin/env node
// audit-aggregate-writer.mjs — firebase-admin writer for the office-hours
// token-audit dashboard (writer side of #1862; epic #1859's audit view).
//
// PURPOSE
//   Reads one token-audit window aggregate JSON document on stdin (the output of
//   .claude/skills/rsi-audit/scripts/aggregate-usage.sh), validates
//   env-var config and the payload (fail-closed), projects a CURATED subset into
//   an `audit-aggregates` Firestore document, and writes it idempotently to
//   `office-hours/{env}/audit-aggregates/{docId}` via the firebase-admin SDK.
//   The audit skill computes the window aggregate on the author's machine (it
//   reads local transcripts the hosted office-hours app cannot see) and pipes it
//   here; the dashboard then reads the persisted aggregates.
//
//   The admin SDK bypasses Firestore security rules, so this writer does NOT
//   depend on sibling #1863's read rule being deployed. #1863 owns the reader,
//   seed, and chart panel; this file is the writer only.
//
// IDEMPOTENCY (the one deliberate divergence from usage-sample-writer.mjs)
//   The usage sampler appends one doc per tick via auto-id `.add()`. This writer
//   instead computes a DETERMINISTIC doc id and `.set()`s it, so re-running the
//   audit for the same window overwrites in place rather than accumulating
//   duplicates. The doc id is
//     `${groupId}-${windowEndDate}-${windowDays}d`
//   where windowEndDate is the UTC date (YYYY-MM-DD) of the payload's
//   `window.until` — a pure function of the INPUT payload, never the writer's own
//   clock, so a near-midnight re-run does not split one window into two docs.
//
// CONFIG (environment variables)
//   Member emails are NOT read from the environment. In real mode they come from
//     the OFFICE_HOURS_MEMBER_EMAILS Firebase/GCP Secret Manager secret — the same
//     canonical secret the office-hours-sync Cloud Function reads (reused from
//     #1257, #1377). The PII therefore lives only in Secret Manager, never in the
//     repo, a shell var, or a local file. This writer does NOT mint a new secret.
//   DISPATCH_AUDIT_AGGREGATES_SECRET_NAME    optional, non-PII override for the
//     secret id; default "OFFICE_HOURS_MEMBER_EMAILS". Non-empty, no "/".
//   DISPATCH_AUDIT_AGGREGATES_SECRET_OVERRIDE  --dry-run ONLY test seam: the raw
//     comma-separated payload the secret would return. Consulted only in
//     --dry-run; real mode always reads Secret Manager and never consults it.
//   DISPATCH_AUDIT_AGGREGATES_GROUP_ID       owning group id. Required; non-empty
//     and must contain no "/" (a slash would escape the collection path and the
//     doc id).
//   DISPATCH_AUDIT_AGGREGATES_NAMESPACE      default "office-hours/prod". Validated
//     with the same regex the Function uses, pinning writes to office-hours/<env>.
//   DISPATCH_AUDIT_AGGREGATES_TTL_DAYS       default "365". Integer in [30, 730];
//     out of range or non-integer fails closed (clear error over a silent clamp,
//     per .claude/rules/code-style.md). Feeds `expireAt` (see below).
//   DISPATCH_AUDIT_AGGREGATES_PROJECT_ID     default "commons-systems".
//   DISPATCH_AUDIT_AGGREGATES_NOW            epoch SECONDS for `computedAt`;
//     defaults to Math.floor(Date.now()/1000). Test-determinism seam; a positive
//     integer. NOTE: this seam feeds computedAt/expireAt ONLY — never the doc id.
//
// AUTH — Application Default Credentials (ADC)
//   Real-mode runs authenticate via ADC: either GOOGLE_APPLICATION_CREDENTIALS
//   pointing at a service-account key, or `gcloud auth application-default
//   login`. The SAME ADC authenticates BOTH the Secret Manager read and the
//   firebase-admin Firestore write. This file does NOT configure credentials.
//   The service account needs roles/secretmanager.secretAccessor on the
//   OFFICE_HOURS_MEMBER_EMAILS secret.
//
// FAIL-SAFE CONTRACT (per .claude/rules/code-style.md)
//   Every validation or write failure prints exactly ONE stderr diagnostic line
//   prefixed "audit-aggregate-writer:" and exits non-zero (1). Credentials and
//   tokens are never echoed. Exit 0 only on a successful write (real mode) or a
//   successful validation+assembly (--dry-run).
//
// MODES
//   --dry-run  (first CLI arg): read stdin, run ALL config + payload validation,
//     take the member-email list from DISPATCH_AUDIT_AGGREGATES_SECRET_OVERRIDE,
//     assemble the doc with Timestamps rendered as ISO strings, print
//     `{ "id": <docId>, "doc": <doc> }` as pretty JSON to stdout, exit 0. Neither
//     firebase-admin nor @google-cloud/secret-manager is imported, so the bash
//     unit tests stay dependency-free.
//   real mode (no --dry-run): dynamically import @google-cloud/secret-manager and
//     fetch the member-email list FIRST (fail-fast, before any firebase-admin
//     init), then dynamically import firebase-admin, assemble the doc with
//     firebase-admin Timestamps, `.set()` it under the deterministic doc id, print
//     the doc id to stdout, exit 0.
//   The field set and the epoch-second inputs are IDENTICAL between modes; only
//   the Timestamp representation differs (ISO string vs admin Timestamp).
//
// TTL / RETENTION (documented-only here)
//   `expireAt` = computedAt + TTL days. It is the field a Firestore TTL policy
//   targets to age out old aggregates. Provisioning that TTL policy is OUT OF
//   SCOPE for this writer — the field is written so the policy can be attached
//   separately.

const PREFIX = "audit-aggregate-writer:";

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
  const secretName = env.DISPATCH_AUDIT_AGGREGATES_SECRET_NAME ?? DEFAULT_SECRET_NAME;
  if (secretName.length === 0) {
    fail("DISPATCH_AUDIT_AGGREGATES_SECRET_NAME must be non-empty");
  }
  if (secretName.includes("/")) {
    fail("DISPATCH_AUDIT_AGGREGATES_SECRET_NAME must not contain a slash");
  }

  const groupId = env.DISPATCH_AUDIT_AGGREGATES_GROUP_ID;
  if (typeof groupId !== "string" || groupId.length === 0) {
    fail("DISPATCH_AUDIT_AGGREGATES_GROUP_ID is required and must be non-empty");
  }
  if (groupId.includes("/")) {
    fail("DISPATCH_AUDIT_AGGREGATES_GROUP_ID must not contain a slash");
  }

  const namespace = env.DISPATCH_AUDIT_AGGREGATES_NAMESPACE ?? "office-hours/prod";
  if (!/^office-hours\/[A-Za-z0-9][A-Za-z0-9-]*$/.test(namespace)) {
    fail(`DISPATCH_AUDIT_AGGREGATES_NAMESPACE "${namespace}" is not a valid office-hours/<env> path`);
  }

  const ttlDaysStr = env.DISPATCH_AUDIT_AGGREGATES_TTL_DAYS ?? "365";
  if (!/^\d+$/.test(ttlDaysStr)) {
    fail(`DISPATCH_AUDIT_AGGREGATES_TTL_DAYS "${ttlDaysStr}" is not an integer`);
  }
  const ttlDays = Number(ttlDaysStr);
  if (ttlDays < 30 || ttlDays > 730) {
    fail(`DISPATCH_AUDIT_AGGREGATES_TTL_DAYS ${ttlDays} is outside the allowed range [30, 730]`);
  }

  const projectId = env.DISPATCH_AUDIT_AGGREGATES_PROJECT_ID ?? "commons-systems";
  if (typeof projectId !== "string" || projectId.length === 0) {
    fail("DISPATCH_AUDIT_AGGREGATES_PROJECT_ID must be non-empty");
  }
  if (projectId.includes("/")) {
    fail("DISPATCH_AUDIT_AGGREGATES_PROJECT_ID must not contain a slash");
  }

  let nowEpochSeconds;
  const nowStr = env.DISPATCH_AUDIT_AGGREGATES_NOW;
  if (nowStr === undefined || nowStr === "") {
    nowEpochSeconds = Math.floor(Date.now() / 1000);
  } else {
    if (!/^\d+$/.test(nowStr) || Number(nowStr) <= 0) {
      fail(`DISPATCH_AUDIT_AGGREGATES_NOW "${nowStr}" is not a positive integer`);
    }
    nowEpochSeconds = Number(nowStr);
  }

  return { secretName, groupId, namespace, ttlDays, projectId, nowEpochSeconds };
}

// A plain finite-number token bucket {input, cache_creation, cache_read,
// output}. Validates the four token counts an aggregate bucket always carries.
function requireNumber(obj, path, field) {
  const v = obj?.[field];
  if (!isFiniteNumber(v)) {
    fail(`payload field ${path}.${field} must be a finite number`);
  }
  return v;
}

// Project an OPTIONAL field from `src` onto `dst`, only when it is really
// there. Absent stays ABSENT: writing a default (0, or false) in its place
// would make a row from before the field existed indistinguishable from one
// that measured the default, which is the same silent lie the discriminator
// fields are being persisted to prevent. Present-but-wrong-typed is still a
// hard error — a malformed payload is a broken producer, not an old one.
function projectOptional(src, dst, path, field, isValid, expected) {
  const v = src?.[field];
  if (v === undefined || v === null) return;
  if (!isValid(v)) {
    fail(`payload field ${path}.${field} must be ${expected} when present`);
  }
  dst[field] = v;
}

// Project a by_phase / by_model bucket into the persisted shape. Both carry the
// four token counts plus turns + price_proxy_usd.
function projectBucket(bucket, path) {
  if (bucket === null || typeof bucket !== "object" || Array.isArray(bucket)) {
    fail(`payload field ${path} must be a JSON object`);
  }
  return {
    input: requireNumber(bucket, path, "input"),
    cache_creation: requireNumber(bucket, path, "cache_creation"),
    cache_read: requireNumber(bucket, path, "cache_read"),
    output: requireNumber(bucket, path, "output"),
    turns: requireNumber(bucket, path, "turns"),
    price_proxy_usd: requireNumber(bucket, path, "price_proxy_usd"),
  };
}

// Project a {key: bucket} map (by_phase / by_model) into the persisted shape.
function projectBucketMap(map, path) {
  if (map === null || typeof map !== "object" || Array.isArray(map)) {
    fail(`payload field ${path} must be a JSON object`);
  }
  const out = {};
  for (const [key, bucket] of Object.entries(map)) {
    out[key] = projectBucket(bucket, `${path}.${key}`);
  }
  return out;
}

// Compute the UTC date (YYYY-MM-DD) of the window-end timestamp. The aggregate
// emits window.until as a bare `YYYY-MM-DD HH:MM:SS` wall-clock string (see
// aggregate-usage.sh: `date '+%Y-%m-%d %H:%M:%S'`). We interpret those literal
// components as a UTC instant so the date portion is a deterministic pure
// function of the input string — independent of the harness timezone and of the
// writer's own clock. Fails closed on an unparseable shape.
function windowEndDateUtc(until) {
  if (typeof until !== "string") {
    fail("payload field window.until must be a string");
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(until);
  if (!m) {
    fail(`payload field window.until "${until}" is not a YYYY-MM-DD HH:MM:SS timestamp`);
  }
  const [, y, mo, d, h, mi, s] = m;
  const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  if (!Number.isFinite(ms)) {
    fail(`payload field window.until "${until}" is not a valid date`);
  }
  return new Date(ms).toISOString().slice(0, 10);
}

// Parse + validate the stdin payload, projecting only the curated subset. The
// unbounded arrays (sessions, tool_sequences, payload_bytes, tool_errors) are
// deliberately NOT read — persisting them risks the 1MB Firestore doc limit.
// Returns a payload object or calls fail().
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

  const win = obj.window;
  if (win === null || typeof win !== "object" || Array.isArray(win)) {
    fail("payload field window must be a JSON object");
  }
  if (!Number.isInteger(win.days) || win.days <= 0) {
    fail("payload field window.days must be a positive integer");
  }
  const windowEndDate = windowEndDateUtc(win.until);

  const tot = obj.totals;
  if (tot === null || typeof tot !== "object" || Array.isArray(tot)) {
    fail("payload field totals must be a JSON object");
  }

  const pm = obj.price_model;
  if (pm === null || typeof pm !== "object" || Array.isArray(pm)) {
    fail("payload field price_model must be a JSON object");
  }

  const window = {
    days: win.days,
    since: requireString(win, "window", "since"),
    until: win.until,
    files_scanned: requireNumber(win, "window", "files_scanned"),
    files_failed: requireNumber(win, "window", "files_failed"),
    sidecar_eligible: requireNumber(win, "window", "sidecar_eligible"),
    sidecar_present: requireNumber(win, "window", "sidecar_present"),
  };

  // OPTIONAL — the discriminators that make `sidecar_eligible` READABLE ACROSS
  // ITS OWN REDEFINITION. The denominator changed meaning from "every worker
  // session" to "every STAMPABLE worker session"; the key did not. Without
  // these fields a reader plotting stored sidecar_present / sidecar_eligible
  // over time sees a step up at the cutover and reads it as stamping coverage
  // improving, when the numerator never moved — the denominator just got
  // smaller. The BEHAVIOR CONTRACT that explains the redefinition lives in the
  // report artifact, which the persisted series does not carry, so the series
  // has to carry its own discriminator.
  //
  // Their PRESENCE is the discriminator, which is exactly why absent must stay
  // absent (see projectOptional): a row with sidecar_ineligible_* is a
  // post-cutover row whose denominator is the stampable population; a row
  // without them predates the change and carries the old, larger one. Backfill
  // a 0 and that distinction is destroyed — the row would then claim it
  // measured an empty ineligible population rather than not having measured it.
  projectOptional(win, window, "window", "sidecar_ineligible_unstampable_branch",
    isFiniteNumber, "a finite number");
  projectOptional(win, window, "window", "sidecar_ineligible_branch_unknown",
    isFiniteNumber, "a finite number");
  // project_dirs_scanned: how many project dirs the run swept. The scope
  // widening that motivated the redefinition is visible here and nowhere else.
  projectOptional(win, window, "window", "project_dirs_scanned",
    isFiniteNumber, "a finite number");
  // sidecar_coverage_measurable: false under --node scope, where present and
  // eligible are equal by construction. A stored row that is false must not be
  // plotted as coverage at all.
  projectOptional(win, window, "window", "sidecar_coverage_measurable",
    (v) => typeof v === "boolean", "a boolean");

  const totals = {
    input: requireNumber(tot, "totals", "input"),
    cache_creation: requireNumber(tot, "totals", "cache_creation"),
    cache_read: requireNumber(tot, "totals", "cache_read"),
    output: requireNumber(tot, "totals", "output"),
    sessions: requireNumber(tot, "totals", "sessions"),
    turns: requireNumber(tot, "totals", "turns"),
    price_proxy_usd: requireNumber(tot, "totals", "price_proxy_usd"),
  };

  const priceModel = {
    input_per_mtok: requireNumber(pm, "price_model", "input_per_mtok"),
    cache_creation_per_mtok: requireNumber(pm, "price_model", "cache_creation_per_mtok"),
    cache_read_per_mtok: requireNumber(pm, "price_model", "cache_read_per_mtok"),
    output_per_mtok: requireNumber(pm, "price_model", "output_per_mtok"),
  };

  return {
    windowDays: win.days,
    windowEndDate,
    window,
    totals,
    byPhase: projectBucketMap(obj.by_phase, "by_phase"),
    byModel: projectBucketMap(obj.by_model, "by_model"),
    priceModel,
    // OPTIONAL — absent on windows predating the outcome envelope. Carried raw
    // for the advisory routing-recommendation projection; never validated as
    // required (its absence is a normal case, not an error).
    byPhaseOutcome: obj.by_phase_outcome,
  };
}

function requireString(obj, path, field) {
  const v = obj?.[field];
  if (typeof v !== "string" || v.length === 0) {
    fail(`payload field ${path}.${field} must be a non-empty string`);
  }
  return v;
}

// ---------------------------------------------------------------------------
// ROUTING RECOMMENDATIONS (advisory only)
//
// The persisted doc carries a `routing_recommendations` array: a structured,
// per-phase "current model → recommended model, justified by metric X" record
// derived from the payload's by_phase_outcome yield rates.
//
// REPORT-ONLY, NEVER AUTO-APPLIED. This writer computes a RECOMMENDATION and
// persists it for a human to read; it never writes dispatch-phase-model,
// dispatch-phase-effort, or any other routing-policy file. Acting on a
// recommendation is a hand-edit of the static map by the author
// (strategy-token-economy clarification 10 / condition 3).
// ---------------------------------------------------------------------------

// Static mirror of the phase→model map in
// .claude/skills/dispatch-propagate/scripts/dispatch-phase-model. MUST BE KEPT
// IN SYNC with that file by hand: it is a bash script, and this pure-projection
// writer cannot cheaply shell out to it. `null` (unmapped) means the phase
// inherits the session default model.
const PHASE_MODEL_MAP = {
  qa: "sonnet",
  review: "sonnet",
  "fix-checks": "sonnet",
  "fix-conflicts": "sonnet",
  "main-qa": "sonnet",
};

// The metric each phase is READ ON, per .claude/docs/outcome-envelope.md
// ("Which rate reflects which phase"). Phases not listed fall through to the
// generic preference order below.
const PHASE_PRIMARY_METRIC = {
  review: "hit_rate",
  qa: "actionability",
};

// Fallback preference order when a phase's primary metric is null (its
// denominator was 0 for the window) or the phase is unlisted.
const METRIC_PREFERENCE = ["hit_rate", "actionability", "fix_rate"];

// Phase+metric pairs whose ACCOUNTING is known to be unverified. A
// recommendation grounded on one of these is tagged `untrusted: true` and MUST
// be excluded from any actionable/acted-upon set.
//
// qa + hit_rate/fix_rate: both put `fixes_applied` in the numerator, and qa's
// `fixes_applied` accounting gap is presently OPEN — qa-fix delegates its fixes
// to /implement-unit, so pooled fixes_applied is structurally near 0 regardless
// of how well the phase performed (.claude/docs/outcome-envelope.md, "Which
// rate reflects which phase"). Named pairs, not a blanket rule, so the list is
// auditable and extendable as accounting gaps open and close.
const UNVERIFIED_ACCOUNTING = [
  {
    phase: "qa",
    metrics: ["hit_rate", "fix_rate"],
    reason:
      "qa fixes_applied accounting gap is open (fixes delegated to /implement-unit); see .claude/docs/outcome-envelope.md",
  },
];

// A yield metric at or above this value is read as "the phase is producing its
// designed output" — the evidence a cheaper orchestrator would not compromise
// quality. Below it, no model change is recommended.
const QUALITY_PRESERVING_YIELD = 0.5;

function isAccountingUnverified(phase, metricName) {
  return UNVERIFIED_ACCOUNTING.some(
    (e) => e.phase === phase && e.metrics.includes(metricName),
  );
}

// Pick the metric name + value a phase's recommendation rests on. Returns
// `{name, value}`; value is null when no rate is available.
function selectYieldMetric(phase, rates) {
  const primary = PHASE_PRIMARY_METRIC[phase];
  const order = primary
    ? [primary, ...METRIC_PREFERENCE.filter((m) => m !== primary)]
    : METRIC_PREFERENCE;
  for (const name of order) {
    if (isFiniteNumber(rates?.[name])) {
      return { name, value: rates[name] };
    }
  }
  return { name: primary ?? METRIC_PREFERENCE[0], value: null };
}

// Build the advisory routing_recommendations array. TOLERANT by design:
// `by_phase_outcome` is OPTIONAL (windows predating the outcome envelope lack
// it), so a missing or malformed value yields an empty list rather than a new
// failure path — this must never widen the fail-closed validation contract.
export function computeRoutingRecommendations(byPhaseOutcome) {
  if (
    byPhaseOutcome === null ||
    typeof byPhaseOutcome !== "object" ||
    Array.isArray(byPhaseOutcome)
  ) {
    return [];
  }

  const out = [];
  for (const [phase, entry] of Object.entries(byPhaseOutcome)) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const currentModel = Object.prototype.hasOwnProperty.call(PHASE_MODEL_MAP, phase)
      ? PHASE_MODEL_MAP[phase]
      : null;
    const metric = selectYieldMetric(phase, entry);
    const verified = metric.value !== null && !isAccountingUnverified(phase, metric.name);

    let recommendedModel = null;
    let evidence = null;
    if (verified && metric.value >= QUALITY_PRESERVING_YIELD && currentModel === null) {
      // Unmapped phase inherits the session default (possibly Opus) while its
      // verified yield shows the phase delivering its designed output — so a
      // cheaper orchestrator is proposed for the author to weigh.
      recommendedModel = "sonnet";
      evidence = `verified ${metric.name} ${metric.value} >= ${QUALITY_PRESERVING_YIELD}; phase orchestrator delegates generative work to agent()/subagents`;
    }

    out.push({
      phase,
      current_model: currentModel,
      recommended_model: recommendedModel,
      yield_metric: { name: metric.name, value: metric.value, verified },
      quality_preservation_evidence: evidence,
      // Excluded from any actionable set: the justifying accounting is not
      // verified (or no rate was available for the window).
      untrusted: !verified,
    });
  }
  return out;
}

// Compute the deterministic, idempotent doc id. A pure function of the payload
// window (group + window-end UTC date + window length) — NEVER the writer clock.
export function computeDocId(payload, config) {
  return `${config.groupId}-${payload.windowEndDate}-${payload.windowDays}d`;
}

// Pure document assembly. `mkTimestamp(epochSeconds)` is the firebase-admin
// seam: --dry-run injects an ISO-string factory; real mode injects
// Timestamp.fromDate. The field set and epoch-second inputs are identical
// across modes.
export function assembleDoc(payload, config, mkTimestamp) {
  return {
    window: payload.window,
    totals: payload.totals,
    byPhase: payload.byPhase,
    byModel: payload.byModel,
    priceModel: payload.priceModel,
    // Advisory only — surfaced for author review, never auto-applied.
    routing_recommendations: computeRoutingRecommendations(payload.byPhaseOutcome),
    windowDays: payload.windowDays,
    computedAt: mkTimestamp(config.nowEpochSeconds),
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
    const rawSecret = process.env.DISPATCH_AUDIT_AGGREGATES_SECRET_OVERRIDE;
    if (rawSecret === undefined) {
      fail("--dry-run requires DISPATCH_AUDIT_AGGREGATES_SECRET_OVERRIDE");
    }
    config.memberEmails = resolveMemberEmails(rawSecret);

    // ISO-string factory — keeps firebase-admin out of the dependency graph so
    // the bash unit tests run without it.
    const mkTimestamp = (epochSeconds) => new Date(epochSeconds * 1000).toISOString();
    const doc = assembleDoc(payload, config, mkTimestamp);
    const id = computeDocId(payload, config);
    console.log(JSON.stringify({ id, doc }, null, 2));
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
  const id = computeDocId(payload, config);

  await getFirestore(app).collection(`${config.namespace}/audit-aggregates`).doc(id).set(doc);
  console.log(id);
  process.exit(0);
}

main().catch((err) => {
  // Never echo credentials/tokens — surface only the error message text.
  const message = err && err.message ? err.message : String(err);
  fail(message);
});
