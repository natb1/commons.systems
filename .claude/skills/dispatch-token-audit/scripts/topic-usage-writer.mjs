#!/usr/bin/env node
// topic-usage-writer.mjs — daily local producer for the office-hours
// topic-usage Firestore collection (#2505; epic #2502).
//
// PURPOSE
//   Each UTC day this producer writes ONE Firestore document at
//     office-hours/{env}/topic-usage/{groupId}-{YYYY-MM-DD}
//   holding per-topic and per-type token cost for that day. Unlike the
//   audit-aggregate writer (which reads a window aggregate on stdin), this
//   producer DRIVES the sibling aggregate-usage.sh once per target day and
//   folds the priced file-issue attribution sidecars back in. The dashboard
//   then reads the persisted per-day docs.
//
//   The admin SDK bypasses Firestore security rules, so this writer does NOT
//   depend on a read rule being deployed.
//
// THE CORE AGGREGATION (per target UTC day `d`)
//   1. SCAN (excluding file-issue sessions): run
//        aggregate-usage.sh --day d --exclude-sidecar-sessions
//      and take its by_topic / by_type maps. The flag drops every transcript
//      that has a sibling *.file-issue-attribution.json, so those file-issue
//      sessions contribute NOTHING to the scan buckets.
//   2. PROJECT each by_topic / by_type bucket snake->camel into the curated
//      subset {priceProxyUsd, input, cacheRead, cacheCreation, output}
//      (dropping turns and cost_usd).
//   3. FOLD the priced file-issue sidecars whose measured_at falls on day d:
//      price each sidecar's raw tokens with price-model.json, resolve its
//      topics (total-to-all-labels) and type exactly like aggregate-usage.sh's
//      topics_for / types_for, and add the FULL tokens + priceProxyUsd to each
//      resolved bucket.
//   Because step 1 EXCLUDED these sessions, folding the priced sidecar back
//   counts each token EXACTLY ONCE, reattributed to the topics/types the
//   file-issue session actually chose. A naive additive fold (without the
//   --exclude-sidecar-sessions flag) would double-count.
//
// TARGET-DAY SELECTION + FIRST-RUN BACKFILL
//   A durable per-host date sentinel under the state dir records the last day
//   processed (the producer OWNS sentinel writes — written only after a
//   successful real-mode run).
//     - Normal run (sentinel present): produce a doc for TODAY (UTC) only.
//     - First run (sentinel absent): backfill one doc per available transcript
//       UTC day (distinct days derived from transcript file mtimes), bounded by
//       a day cap (keep the most recent N). The covered range and any
//       cap-dropped days are logged to stderr — never silently truncated.
//   The deterministic docId + .set() make a lost/stale sentinel a harmless
//   idempotent re-write; the sentinel is a cost optimization only (it also
//   bounds the gh-quota burst of an N-day backfill, since each per-day
//   aggregate-usage.sh call rebuilds labels_by_issue via per-issue REST
//   lookups).
//
// CONFIG (environment variables)
//   Member emails are NOT read from the environment. In real mode they come
//     from the OFFICE_HOURS_MEMBER_EMAILS Secret Manager secret — the SAME
//     canonical secret the office-hours-sync Cloud Function and the
//     audit-aggregate writer read. This writer does NOT mint a new secret.
//   DISPATCH_TOPIC_USAGE_GROUP_ID        owning group id. Required; non-empty,
//     no "/" (a slash would escape the collection path and the doc id).
//   DISPATCH_TOPIC_USAGE_NAMESPACE       default "office-hours/prod". Validated
//     with the same regex the Function uses, pinning writes to office-hours/<env>.
//   DISPATCH_TOPIC_USAGE_PROJECT_ID      default "commons-systems". No "/".
//   DISPATCH_TOPIC_USAGE_SECRET_NAME     default "OFFICE_HOURS_MEMBER_EMAILS".
//     Non-empty, no "/".
//   DISPATCH_TOPIC_USAGE_SECRET_OVERRIDE --dry-run ONLY test seam: the raw
//     comma-separated payload the secret would return. Consulted only in
//     --dry-run; real mode always reads Secret Manager and never consults it.
//   DISPATCH_TOPIC_USAGE_NOW             epoch SECONDS for "today" and
//     computedAt; defaults to Math.floor(Date.now()/1000). A positive integer.
//   DISPATCH_TOPIC_USAGE_STATE_DIR       sentinel state dir; default
//     ${XDG_STATE_HOME:-$HOME/.local/state}/dispatch.
//   DISPATCH_TOPIC_USAGE_BACKFILL_CAP    first-run day cap; default 30. A
//     positive integer.
//   DISPATCH_TOPIC_USAGE_AGGREGATE_SCRIPT  override the aggregate-usage.sh path
//     (test seam). Default: <scriptdir>/aggregate-usage.sh.
//   DISPATCH_AUDIT_PROJECTS_ROOT         REUSED (default $HOME/.claude/projects)
//     for the producer's sidecar scan + backfill day enumeration, so the
//     producer and the aggregate-usage.sh it drives agree on one projects root.
//   There is NO TTL var and NO expireAt field (unlike the audit writer): this is
//     a daily, not windowed, doc.
//
// AUTH — Application Default Credentials (ADC)
//   Real-mode runs authenticate via ADC. The SAME ADC authenticates BOTH the
//   Secret Manager read and the firebase-admin Firestore write. This file does
//   NOT configure credentials.
//
// FAIL-CLOSED CONTRACT (per .claude/rules/code-style.md)
//   Every validation or write failure prints exactly ONE stderr diagnostic line
//   prefixed "topic-usage-writer:" and exits non-zero (1). Credentials are never
//   echoed. Exit 0 only on success.
//
// MODES
//   --dry-run (first CLI arg): run ALL config validation; take member emails
//     from DISPATCH_TOPIC_USAGE_SECRET_OVERRIDE (fail if unset); for EACH target
//     day run the real aggregate-usage.sh subprocess + the sidecar fold;
//     assemble docs with computedAt rendered as an ISO string; print a JSON
//     array [{ id, doc }, ...] (one element per produced day) pretty-printed;
//     exit 0. Neither firebase-admin nor @google-cloud/secret-manager is
//     imported, and the state dir is left UNTOUCHED (no sentinel write), so the
//     bash unit suite stays dependency-free and repeatable.
//   real mode (no --dry-run): resolve member emails from Secret Manager FIRST
//     (fail-fast before firebase-admin init), dynamically import firebase-admin,
//     .set() each day's doc with computedAt as a Timestamp, write the sentinel =
//     today, print each written docId to stdout, exit 0.
//   The field set + epoch inputs are IDENTICAL across modes; only the Timestamp
//   representation differs (ISO string vs admin Timestamp).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PREFIX = "topic-usage-writer:";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function fail(message) {
  process.stderr.write(`${PREFIX} ${message}\n`);
  process.exit(1);
}

// Non-fatal diagnostics go to stderr (stdout is reserved for the JSON array /
// doc ids). Same prefix so log lines are greppable.
function log(message) {
  process.stderr.write(`${PREFIX} ${message}\n`);
}

// A finite JS number (not a string, NaN, or Infinity).
function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

// Default Secret Manager secret id for the member-email PII list — the same
// canonical secret the office-hours-sync Function and the audit writer read.
const DEFAULT_SECRET_NAME = "OFFICE_HOURS_MEMBER_EMAILS";

// The topic vocab buckets (excluding the catch-all "other") and the full topic
// + type bucket sets aggregate-usage.sh always seeds.
const TOPIC_VOCAB = new Set([
  "security",
  "dispatch",
  "testing infrastructure",
  "landing",
  "fellspiral",
  "budget",
  "print",
  "audio",
]);
const TOPIC_BUCKETS = [...TOPIC_VOCAB, "other"];
const TYPE_BUCKETS = ["bug", "enhancement", "none"];

// Parse a comma-separated member-email payload into a trimmed, non-empty list.
// Identical semantics to office-hours-sync.ts. An empty resolved list fails
// closed (the owner would be locked out of the doc).
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

// Load the single-sourced price-proxy rates (shared with aggregate-usage.sh).
function loadPriceModel() {
  const p = path.join(SCRIPT_DIR, "price-model.json");
  let obj;
  try {
    obj = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (err) {
    fail(`cannot read price model ${p}: ${err && err.message ? err.message : String(err)}`);
  }
  for (const k of ["input", "cacheCreation", "cacheRead", "output"]) {
    if (!isFiniteNumber(obj?.[k])) {
      fail(`price model field ${k} must be a finite number`);
    }
  }
  return obj;
}

// Parse + validate config from the environment. Returns a config object or
// calls fail() (which exits).
function loadConfig(env) {
  const secretName = env.DISPATCH_TOPIC_USAGE_SECRET_NAME ?? DEFAULT_SECRET_NAME;
  if (secretName.length === 0) {
    fail("DISPATCH_TOPIC_USAGE_SECRET_NAME must be non-empty");
  }
  if (secretName.includes("/")) {
    fail("DISPATCH_TOPIC_USAGE_SECRET_NAME must not contain a slash");
  }

  const groupId = env.DISPATCH_TOPIC_USAGE_GROUP_ID;
  if (typeof groupId !== "string" || groupId.length === 0) {
    fail("DISPATCH_TOPIC_USAGE_GROUP_ID is required and must be non-empty");
  }
  if (groupId.includes("/")) {
    fail("DISPATCH_TOPIC_USAGE_GROUP_ID must not contain a slash");
  }

  const namespace = env.DISPATCH_TOPIC_USAGE_NAMESPACE ?? "office-hours/prod";
  if (!/^office-hours\/[A-Za-z0-9][A-Za-z0-9-]*$/.test(namespace)) {
    fail(`DISPATCH_TOPIC_USAGE_NAMESPACE "${namespace}" is not a valid office-hours/<env> path`);
  }

  const projectId = env.DISPATCH_TOPIC_USAGE_PROJECT_ID ?? "commons-systems";
  if (typeof projectId !== "string" || projectId.length === 0) {
    fail("DISPATCH_TOPIC_USAGE_PROJECT_ID must be non-empty");
  }
  if (projectId.includes("/")) {
    fail("DISPATCH_TOPIC_USAGE_PROJECT_ID must not contain a slash");
  }

  let nowEpochSeconds;
  const nowStr = env.DISPATCH_TOPIC_USAGE_NOW;
  if (nowStr === undefined || nowStr === "") {
    nowEpochSeconds = Math.floor(Date.now() / 1000);
  } else {
    if (!/^\d+$/.test(nowStr) || Number(nowStr) <= 0) {
      fail(`DISPATCH_TOPIC_USAGE_NOW "${nowStr}" is not a positive integer`);
    }
    nowEpochSeconds = Number(nowStr);
  }

  let backfillCap;
  const capStr = env.DISPATCH_TOPIC_USAGE_BACKFILL_CAP;
  if (capStr === undefined || capStr === "") {
    backfillCap = 30;
  } else {
    if (!/^\d+$/.test(capStr) || Number(capStr) <= 0) {
      fail(`DISPATCH_TOPIC_USAGE_BACKFILL_CAP "${capStr}" is not a positive integer`);
    }
    backfillCap = Number(capStr);
  }

  const home = env.HOME ?? "";
  const defaultStateDir = path.join(
    env.XDG_STATE_HOME && env.XDG_STATE_HOME.length > 0
      ? env.XDG_STATE_HOME
      : path.join(home, ".local", "state"),
    "dispatch",
  );
  const stateDir = env.DISPATCH_TOPIC_USAGE_STATE_DIR ?? defaultStateDir;

  const projectsRoot =
    env.DISPATCH_AUDIT_PROJECTS_ROOT && env.DISPATCH_AUDIT_PROJECTS_ROOT.length > 0
      ? env.DISPATCH_AUDIT_PROJECTS_ROOT
      : path.join(home, ".claude", "projects");

  const aggregateScript =
    env.DISPATCH_TOPIC_USAGE_AGGREGATE_SCRIPT &&
    env.DISPATCH_TOPIC_USAGE_AGGREGATE_SCRIPT.length > 0
      ? env.DISPATCH_TOPIC_USAGE_AGGREGATE_SCRIPT
      : path.join(SCRIPT_DIR, "aggregate-usage.sh");

  return {
    secretName,
    groupId,
    namespace,
    projectId,
    nowEpochSeconds,
    backfillCap,
    stateDir,
    projectsRoot,
    aggregateScript,
  };
}

// The UTC YYYY-MM-DD of an epoch-seconds instant.
function utcDay(epochSeconds) {
  return new Date(epochSeconds * 1000).toISOString().slice(0, 10);
}

// Sentinel path: one file per group under the state dir.
function sentinelPath(config) {
  return path.join(config.stateDir, `topic-usage-${config.groupId}.last-day`);
}

// The project dirs aggregate-usage.sh scans: depth-1 dirs whose name contains
// "worktrees" or ends with "--bare". Mirrors aggregate-usage.sh's find filter so
// the producer enumerates exactly the days/sidecars the aggregator will see.
function listProjectDirs(projectsRoot) {
  let entries;
  try {
    entries = fs.readdirSync(projectsRoot, { withFileTypes: true });
  } catch {
    return []; // missing root -> no transcripts (aggregate handles it the same way)
  }
  return entries
    .filter(
      (e) => e.isDirectory() && (e.name.includes("worktrees") || e.name.endsWith("--bare")),
    )
    .map((e) => path.join(projectsRoot, e.name));
}

// Recursively collect file paths under dir.
function walkFiles(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else if (e.isFile()) out.push(p);
  }
}

// All transcript / sidecar files under the scanned project dirs.
function collectFiles(projectsRoot) {
  const out = [];
  for (const d of listProjectDirs(projectsRoot)) walkFiles(d, out);
  return out;
}

// Distinct UTC days (derived from *.jsonl mtimes) with any transcript activity,
// sorted ascending.
function transcriptDays(files) {
  const days = new Set();
  for (const f of files) {
    if (!f.endsWith(".jsonl")) continue;
    let st;
    try {
      st = fs.statSync(f);
    } catch {
      continue;
    }
    days.add(utcDay(Math.floor(st.mtimeMs / 1000)));
  }
  return [...days].sort();
}

// Index the priced file-issue attribution sidecars by their measured_at UTC day.
// Returns Map<day, Array<{tokens, topics, type, price}>>.
function indexSidecarsByDay(files, priceModel) {
  const byDay = new Map();
  for (const f of files) {
    if (!f.endsWith(".file-issue-attribution.json")) continue;
    let obj;
    try {
      obj = JSON.parse(fs.readFileSync(f, "utf8"));
    } catch (err) {
      fail(`cannot parse sidecar ${f}: ${err && err.message ? err.message : String(err)}`);
    }
    const measuredAt = obj?.measured_at;
    if (typeof measuredAt !== "string" || measuredAt.length < 10) {
      fail(`sidecar ${f} has a missing or malformed measured_at`);
    }
    const day = measuredAt.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      fail(`sidecar ${f} measured_at "${measuredAt}" does not start with a YYYY-MM-DD date`);
    }
    const t = obj?.tokens;
    if (t === null || typeof t !== "object" || Array.isArray(t)) {
      fail(`sidecar ${f} tokens must be a JSON object`);
    }
    const tokens = {
      input: requireNumber(t, `${f} tokens`, "input"),
      cache_creation: requireNumber(t, `${f} tokens`, "cache_creation"),
      cache_read: requireNumber(t, `${f} tokens`, "cache_read"),
      output: requireNumber(t, `${f} tokens`, "output"),
    };
    const topics = Array.isArray(obj?.topics) ? obj.topics : [];
    const type = typeof obj?.type === "string" ? obj.type : "";
    const price = priceProxy(tokens, priceModel);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push({ tokens, topics, type, price });
  }
  return byDay;
}

function requireNumber(obj, path_, field) {
  const v = obj?.[field];
  if (!isFiniteNumber(v)) {
    fail(`field ${path_}.${field} must be a finite number`);
  }
  return v;
}

// price_proxy_usd from a raw {input, cache_creation, cache_read, output} token
// bucket. Same formula and rates as aggregate-usage.sh's price(u).
function priceProxy(tokens, priceModel) {
  return (
    (tokens.input * priceModel.input +
      tokens.cache_creation * priceModel.cacheCreation +
      tokens.cache_read * priceModel.cacheRead +
      tokens.output * priceModel.output) /
    1e6
  );
}

// Project an aggregate-usage.sh by_topic / by_type bucket (snake_case, carrying
// turns + price_proxy_usd + cost_usd) into the curated camelCase SUBSET. Key
// ORDER is the documented {priceProxyUsd, input, cacheRead, cacheCreation,
// output} — preserved by later in-place folds.
function projectBucket(bucket, path_) {
  if (bucket === null || typeof bucket !== "object" || Array.isArray(bucket)) {
    fail(`aggregate field ${path_} must be a JSON object`);
  }
  return {
    priceProxyUsd: requireNumber(bucket, path_, "price_proxy_usd"),
    input: requireNumber(bucket, path_, "input"),
    cacheRead: requireNumber(bucket, path_, "cache_read"),
    cacheCreation: requireNumber(bucket, path_, "cache_creation"),
    output: requireNumber(bucket, path_, "output"),
  };
}

// Fold a priced sidecar's full tokens + price into a projected bucket.
function addToBucket(bucket, tokens, price) {
  bucket.priceProxyUsd += price;
  bucket.input += tokens.input;
  bucket.cacheRead += tokens.cache_read;
  bucket.cacheCreation += tokens.cache_creation;
  bucket.output += tokens.output;
}

// Resolve a sidecar's topics[] exactly like aggregate-usage.sh's topics_for:
// keep each vocab topic; a non-vocab topic -> "other"; empty/absent -> ["other"].
// Returns a de-duplicated set so total-to-all-labels adds each resolved bucket
// once.
function topicsFor(topics) {
  if (!Array.isArray(topics) || topics.length === 0) return ["other"];
  const set = new Set();
  for (const t of topics) {
    set.add(TOPIC_VOCAB.has(t) ? t : "other");
  }
  return [...set];
}

// Resolve a sidecar's type like aggregate-usage.sh's types_for: bug/enhancement
// kept; everything else (empty/absent/other) -> "none".
function typeFor(type) {
  return type === "bug" || type === "enhancement" ? type : "none";
}

// Run aggregate-usage.sh for one UTC day with file-issue sessions excluded, and
// parse its JSON document. Fails closed on a non-zero exit or unparseable stdout.
function runAggregate(config, day) {
  const res = spawnSync(
    "bash",
    [config.aggregateScript, "--day", day, "--exclude-sidecar-sessions"],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, env: process.env },
  );
  if (res.error) {
    fail(`failed to run aggregate-usage.sh for day ${day}: ${res.error.message}`);
  }
  if (res.status !== 0) {
    const stderr = (res.stderr || "").trim();
    fail(`aggregate-usage.sh exited ${res.status} for day ${day}${stderr ? `: ${stderr}` : ""}`);
  }
  let agg;
  try {
    agg = JSON.parse(res.stdout);
  } catch {
    fail(`aggregate-usage.sh stdout for day ${day} is not valid JSON`);
  }
  if (agg === null || typeof agg !== "object" || Array.isArray(agg)) {
    fail(`aggregate-usage.sh output for day ${day} is not a JSON object`);
  }
  if (agg.by_topic === null || typeof agg.by_topic !== "object" || Array.isArray(agg.by_topic)) {
    fail(`aggregate-usage.sh output for day ${day} is missing by_topic`);
  }
  if (agg.by_type === null || typeof agg.by_type !== "object" || Array.isArray(agg.by_type)) {
    fail(`aggregate-usage.sh output for day ${day} is missing by_type`);
  }
  return agg;
}

// Produce one day's { id, doc }. Drives the scan, projects, and folds the priced
// sidecars for the day.
export function produceDay(config, priceModel, sidecarsByDay, day) {
  const agg = runAggregate(config, day);

  const byTopic = {};
  for (const t of TOPIC_BUCKETS) {
    byTopic[t] = projectBucket(agg.by_topic[t], `by_topic.${t}`);
  }
  const byType = {};
  for (const t of TYPE_BUCKETS) {
    byType[t] = projectBucket(agg.by_type[t], `by_type.${t}`);
  }

  for (const sc of sidecarsByDay.get(day) ?? []) {
    for (const t of topicsFor(sc.topics)) {
      addToBucket(byTopic[t], sc.tokens, sc.price);
    }
    addToBucket(byType[typeFor(sc.type)], sc.tokens, sc.price);
  }

  const id = `${config.groupId}-${day}`;
  return { id, byTopic, byType, day };
}

// Pure document assembly. mkTimestamp(epochSeconds) is the firebase-admin seam:
// --dry-run injects an ISO-string factory; real mode injects Timestamp.fromDate.
export function assembleDoc(produced, config, mkTimestamp) {
  return {
    date: produced.day,
    byTopic: produced.byTopic,
    byType: produced.byType,
    computedAt: mkTimestamp(config.nowEpochSeconds),
    groupId: config.groupId,
    memberEmails: config.memberEmails,
  };
}

// Determine the ordered list of UTC days to produce.
//   sentinel present -> [today]
//   sentinel absent  -> first-run backfill of distinct transcript days, capped
//                       to the most recent N (covered range + drops logged).
function targetDays(config) {
  const today = utcDay(config.nowEpochSeconds);
  if (fs.existsSync(sentinelPath(config))) {
    return [today];
  }
  // First run: backfill.
  const days = transcriptDays(collectFiles(config.projectsRoot));
  if (days.length === 0) {
    log("first-run backfill: no transcript days found; producing today only");
    return [today];
  }
  const cap = config.backfillCap;
  let kept = days;
  let dropped = [];
  if (days.length > cap) {
    dropped = days.slice(0, days.length - cap); // older days fall outside the cap
    kept = days.slice(days.length - cap);
  }
  log(
    `first-run backfill: covering ${kept.length} day(s) ${kept[0]}..${kept[kept.length - 1]}`,
  );
  if (dropped.length > 0) {
    log(
      `first-run backfill: cap ${cap} dropped ${dropped.length} older day(s): ${dropped.join(",")}`,
    );
  }
  return kept;
}

async function main() {
  const dryRun = process.argv[2] === "--dry-run";

  const config = loadConfig(process.env);
  const priceModel = loadPriceModel();
  const days = targetDays(config);
  const sidecarsByDay = indexSidecarsByDay(collectFiles(config.projectsRoot), priceModel);

  if (dryRun) {
    // Dry-run member-email source — a test seam carrying the raw payload the
    // secret would return. Consulted ONLY here; never in real mode. Keeps the
    // bash unit suite dependency-free.
    const rawSecret = process.env.DISPATCH_TOPIC_USAGE_SECRET_OVERRIDE;
    if (rawSecret === undefined) {
      fail("--dry-run requires DISPATCH_TOPIC_USAGE_SECRET_OVERRIDE");
    }
    config.memberEmails = resolveMemberEmails(rawSecret);

    // ISO-string factory — keeps firebase-admin out of the dependency graph.
    const mkTimestamp = (epochSeconds) => new Date(epochSeconds * 1000).toISOString();
    const out = days.map((day) => {
      const produced = produceDay(config, priceModel, sidecarsByDay, day);
      return { id: produced.id, doc: assembleDoc(produced, config, mkTimestamp) };
    });
    console.log(JSON.stringify(out, null, 2));
    // Dry-run is side-effect-free except stdout: the sentinel is NOT written.
    process.exit(0);
  }

  // Real mode — resolve the member-email list from Secret Manager FIRST, before
  // any firebase-admin init, so a secret/credential failure fails fast.
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
  const db = getFirestore(app);
  const mkTimestamp = (epochSeconds) => Timestamp.fromDate(new Date(epochSeconds * 1000));

  for (const day of days) {
    const produced = produceDay(config, priceModel, sidecarsByDay, day);
    const doc = assembleDoc(produced, config, mkTimestamp);
    await db.collection(`${config.namespace}/topic-usage`).doc(produced.id).set(doc);
    console.log(produced.id);
  }

  // The producer OWNS sentinel writes: record today as the last processed day
  // only after every doc has been written.
  fs.mkdirSync(config.stateDir, { recursive: true });
  fs.writeFileSync(sentinelPath(config), `${utcDay(config.nowEpochSeconds)}\n`);
  process.exit(0);
}

main().catch((err) => {
  // Never echo credentials — surface only the error message text.
  const message = err && err.message ? err.message : String(err);
  fail(message);
});
