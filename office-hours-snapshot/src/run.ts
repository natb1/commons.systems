// office-hours local-snapshot producer — the runnable pipeline.
//
// `run(argv, env, io)` is the testable core; main.ts is a thin shim that calls it
// and maps the returned exit code to process.exit. Every external effect
// (produce, write, parity, Secret Manager, the parity Firestore reader, prior
// history, the mount check, the clock) is an injectable `io` seam so the dry-run
// path is provably IO-free (no Secret Manager, no Drive write) in unit tests.
//
// Pipeline (scope=full real run):
//   parse flags → loadConfig → mount/precondition check → resolve member emails
//   (Secret Manager + ADC) + password (env) → build real deps (gh + Google
//   fetchers + prior history) → produceSnapshot → serializeSnapshot →
//   [--parity: checkParity against live Firestore, print divergences, non-zero
//   exit if not ok — the write still PROCEEDS (dual-write: parity is a shape
//   signal, not a gate)] → encrypt + atomic write + history via writeSnapshot.
//
// Scope "analytics" swaps the produce step for a surgical pipeline: collect
// ONLY the projectSignals section (produceProjectSignals — GitHub/GA4/GSC/PSI,
// all sources required by loadConfig) and fold it into the prior decrypted
// snapshot document (foldProjectSignals), preserving every other field
// verbatim; the parity/output tail is shared.
//
// Modes:
//   --dry-run    skip the mount check, Secret Manager, and the Drive write; print
//                the serialized snapshot JSON to stdout. Member emails come from
//                the dry-run-only OFFICE_HOURS_MEMBER_EMAILS_OVERRIDE (else []).
//   --plaintext  DEBUG: write the snapshot UNENCRYPTED as office-hours-current.json
//                (never the .benc the reader opens); bypasses the password req.
//   --parity     run checkParity after producing (needs ADC + Firestore).

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { decryptData } from "@commons-systems/crypto-core";

import {
  fetchGoogleAccessTokenLive,
  fetchGa4Live,
  fetchGscLive,
  fetchPsiLive,
} from "./project-signals-core.js";
import type {
  Ga4AppSignals,
  GscSignals,
  PsiUrlSignals,
} from "./project-signals-core.js";

import { createGhFetchers } from "./gh-fetchers.js";
import {
  produceSnapshot,
  produceProjectSignals,
  runUsageSampleWriter,
  type ProduceDeps,
  type ProduceSignalsDeps,
  type PriorHistory,
} from "./produce.js";
import type { ProjectSignalsSnapshot } from "../../office-hours/src/project-signals.js";
import { serializeSnapshot, foldProjectSignals } from "./snapshot.js";
import { SnapshotValidationError } from "./snapshot.js";
import type { OfficeHoursSnapshot, SnapshotInput, SnapshotScope } from "./snapshot.js";
import {
  writeSnapshot,
  CURRENT_FILENAME,
  HISTORY_PREFIX,
  type WriteSnapshotArgs,
  type WriteSnapshotResult,
} from "./persist.js";
import { checkParity, type FirestoreReader, type ParityResult } from "./parity.js";
import { loadConfig, type Env, type SnapshotConfig } from "./config.js";

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

export interface Flags {
  scope: SnapshotScope;
  dryRun: boolean;
  parity: boolean;
  plaintext: boolean;
}

/** Parse the producer's CLI flags from an argv tail (no extra dependency). */
export function parseArgs(argv: string[]): Flags {
  let scope: SnapshotScope = "full";
  let dryRun = false;
  let parity = false;
  let plaintext = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--parity") parity = true;
    else if (arg === "--plaintext") plaintext = true;
    else if (arg === "--scope") {
      const v = argv[++i];
      if (v !== "full" && v !== "parked-only" && v !== "analytics") {
        throw new Error(
          `--scope must be "full", "parked-only", or "analytics" (got "${v ?? ""}")`,
        );
      }
      scope = v;
    } else if (arg.startsWith("--scope=")) {
      const v = arg.slice("--scope=".length);
      if (v !== "full" && v !== "parked-only" && v !== "analytics") {
        throw new Error(`--scope must be "full", "parked-only", or "analytics" (got "${v}")`);
      }
      scope = v;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { scope, dryRun, parity, plaintext };
}

// ---------------------------------------------------------------------------
// Injectable IO seams
// ---------------------------------------------------------------------------

export interface RunIo {
  produceSnapshot(deps: ProduceDeps, scope: SnapshotScope): Promise<SnapshotInput>;
  /** Collect ONLY the projectSignals section (`--scope analytics`). */
  produceProjectSignals(deps: ProduceSignalsDeps): Promise<ProjectSignalsSnapshot>;
  writeSnapshot(args: WriteSnapshotArgs): Promise<WriteSnapshotResult>;
  checkParity(snapshot: OfficeHoursSnapshot, deps: { reader: FirestoreReader; namespace: string }): Promise<ParityResult>;
  /** Build the live firebase-admin parity reader (constructed only for --parity). */
  createParityReader(namespace: string): FirestoreReader;
  /** Resolve the member-email PII list from Secret Manager via ADC. */
  resolveMemberEmailsFromSecret(projectId: string, secretName: string): Promise<string[]>;
  /** Decrypt the prior `current` snapshot's series, or null when absent. */
  readPriorHistory(snapshotDir: string, password: string): Promise<PriorHistory | null>;
  /** Decrypt the prior `current` snapshot DOCUMENT (analytics fold), or null when absent. */
  readPriorSnapshot(snapshotDir: string, password: string): Promise<OfficeHoursSnapshot | null>;
  /** Deny-loud mount/precondition check; throws if the dir is missing. */
  statSnapshotDir(dir: string): void;
  /** DEBUG plaintext writer (--plaintext); returns the written path. */
  writePlaintext(snapshotDir: string, json: unknown, now: Date): string;
  now(): Date;
  stdout(line: string): void;
  stderr(line: string): void;
}

// ---------------------------------------------------------------------------
// Default (real) IO implementations
// ---------------------------------------------------------------------------

/** Parse a comma-separated email list into a trimmed, non-empty list. */
function parseEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Map a serialized usage sample (ISO strings) back to a UsageSample (Dates). */
function deserializeUsageSample(s: OfficeHoursSnapshot["samples"][number]): PriorHistory["samples"][number] {
  return {
    sampledAt: new Date(s.sampledAt),
    fiveHourUsedPct: s.fiveHourUsedPct,
    weeklyUsedPct: s.weeklyUsedPct,
    fiveHourResetsAt: new Date(s.fiveHourResetsAt),
    weeklyResetsAt: new Date(s.weeklyResetsAt),
    activeWorkers: s.activeWorkers,
    targetWorkers: s.targetWorkers,
    groupId: s.groupId,
  };
}

/** Map a serialized issue sample (ISO sampledAt) back to an IssueSample (Date). */
function deserializeIssueSample(s: OfficeHoursSnapshot["issueSamples"][number]): PriorHistory["issueSamples"][number] {
  return {
    sampledAt: new Date(s.sampledAt),
    openSecurity: s.openSecurity,
    openBug: s.openBug,
    openEnhancement: s.openEnhancement,
    openOther: s.openOther,
    groupId: s.groupId,
  };
}

/**
 * Read + decrypt the prior `current` snapshot DOCUMENT (serialized form, ISO
 * strings intact). A MISSING file → null (first run, fine). A
 * present-but-undecryptable file (wrong password / corrupt) → THROW (no silent
 * history reset — see .claude/rules/code-style.md).
 *
 * The decrypted document is shape-checked before it is handed to the analytics
 * fold, but DELIBERATELY more permissively than `decodeSnapshot`: a `version`
 * of `undefined` is the legacy pre-`version` producer's output, which is
 * exactly what sits on disk until the first post-deploy run, and rejecting it
 * would fail that run instead of migrating it. `foldProjectSignals` restamps
 * `version: 1` on the way out, so the legacy document is upgraded by being
 * folded. Anything else — a non-object, or a version this build does not know —
 * is genuine corruption and throws rather than folding into garbage.
 */
async function defaultReadPriorSnapshot(
  snapshotDir: string,
  password: string,
): Promise<OfficeHoursSnapshot | null> {
  const file = path.join(snapshotDir, CURRENT_FILENAME);
  let buf: Buffer;
  try {
    buf = fs.readFileSync(file);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") { // type-safety-ok: err from fs.readFileSync is always an ErrnoException for system errors
      return null; // no prior snapshot yet — start a fresh series.
    }
    throw err; // present-but-unreadable (EACCES, EISDIR, EIO, …) → surface, never silently reset history.
  }
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer; // type-safety-ok: a file-backed Buffer is never SharedArrayBuffer-backed
  const plaintext = await decryptData(crypto.webcrypto.subtle, ab, password);
  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch (err) {
    // Decrypted fine but is not JSON — corrupt, or a foreign file under our
    // name. Name the file: a bare SyntaxError gives the operator nothing.
    throw new SnapshotValidationError(
      `Prior snapshot at ${file} decrypted but is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new SnapshotValidationError(
      `Prior snapshot at ${file} is not a JSON object (got ${Array.isArray(parsed) ? "array" : typeof parsed}).`,
    );
  }
  const version = (parsed as { version?: unknown }).version; // type-safety-ok: reading one field off a validated object literal before the version gate below
  if (version !== undefined && version !== 1) {
    throw new SnapshotValidationError(
      `Prior snapshot at ${file} has unsupported version ${JSON.stringify(version)} (this build writes version 1).`,
    );
  }
  return parsed as OfficeHoursSnapshot; // type-safety-ok: shape- and version-gated above; a legacy version-less document is upgraded by foldProjectSignals
}

/**
 * Recover the prior snapshot's two series with real Dates. The office-hours
 * `toUsageSample`/`toIssueSample` parsers are NOT reused here: the serialized
 * series carries ISO-string dates, but those parsers require a Firestore
 * `.toDate()` Timestamp, so they would reject every serialized point and
 * silently truncate the series to one point. (The serialized samples also omit
 * the `memberEmails` auth field — the offline wire never carries the group ACL,
 * see ../../office-hours/src/snapshot-wire.ts — but the ISO/Timestamp mismatch
 * alone already precludes reuse.) These bespoke deserializers read the ISO
 * strings back into Dates directly.
 */
async function defaultReadPriorHistory(
  snapshotDir: string,
  password: string,
): Promise<PriorHistory | null> {
  const snap = await defaultReadPriorSnapshot(snapshotDir, password);
  if (snap === null) return null;
  return {
    samples: (snap.samples ?? []).map(deserializeUsageSample),
    issueSamples: (snap.issueSamples ?? []).map(deserializeIssueSample),
  };
}

/** Deny-loud mount/precondition check (mirrors persist.ts step 1). */
function defaultStatSnapshotDir(dir: string): void {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(dir);
  } catch {
    throw new Error(`snapshot dir missing (Drive mount?): ${dir}`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`snapshot dir is not a directory: ${dir}`);
  }
}

/** Resolve member emails from Secret Manager via ADC (audit-aggregate-writer precedent). */
async function defaultResolveMemberEmailsFromSecret(
  projectId: string,
  secretName: string,
): Promise<string[]> {
  const { SecretManagerServiceClient } = await import("@google-cloud/secret-manager");
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
  });
  if (!version?.payload?.data) {
    throw new Error(`secret ${secretName} returned an empty or missing payload`);
  }
  return parseEmails(version.payload.data.toString());
}

/**
 * Build the live firebase-admin parity reader. firebase-admin is dynamically
 * imported here so a non-parity run never loads it or needs ADC. The reader's
 * methods take ABSOLUTE Firestore paths (e.g. `office-hours/prod/items`): the
 * single-doc paths have an even segment count (`db.doc`), the collection paths an
 * odd count (`db.collection`).
 */
function defaultCreateParityReader(_namespace: string): FirestoreReader {
  let dbPromise: Promise<import("firebase-admin/firestore").Firestore> | null = null;
  const getDb = (): Promise<import("firebase-admin/firestore").Firestore> => {
    if (!dbPromise) {
      dbPromise = (async () => {
        const { getApps, initializeApp } = await import("firebase-admin/app");
        const { getFirestore } = await import("firebase-admin/firestore");
        const app = getApps().length > 0 ? getApps()[0]! : initializeApp(); // type-safety-ok: getApps()[0] non-null inside the length>0 branch
        return getFirestore(app);
      })();
    }
    return dbPromise;
  };
  return {
    async getDoc(p: string): Promise<Record<string, unknown> | null> {
      const db = await getDb();
      const snap = await db.doc(p).get();
      return snap.exists ? (snap.data() ?? null) : null;
    },
    async listCollection(p: string): Promise<Record<string, unknown>[]> {
      const db = await getDb();
      const snap = await db.collection(p).get();
      return snap.docs.map((d) => d.data());
    },
  };
}

/** DEBUG plaintext writer: unencrypted office-hours-current.json via temp+rename. */
function defaultWritePlaintext(snapshotDir: string, json: unknown, _now: Date): string {
  defaultStatSnapshotDir(snapshotDir);
  const finalPath = path.join(snapshotDir, `${HISTORY_PREFIX}current.json`);
  const tmp = path.join(
    snapshotDir,
    `.office-hours-plaintext-${process.pid}-${Date.now()}.tmp`,
  );
  try {
    fs.writeFileSync(tmp, JSON.stringify(json, null, 2));
    fs.renameSync(tmp, finalPath);
  } catch (err) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      // best-effort cleanup; surface the original error
    }
    throw err;
  }
  return finalPath;
}

/** The real IO seam set used by the entrypoint. */
export const defaultIo: RunIo = {
  produceSnapshot,
  produceProjectSignals,
  writeSnapshot,
  checkParity,
  createParityReader: defaultCreateParityReader,
  resolveMemberEmailsFromSecret: defaultResolveMemberEmailsFromSecret,
  readPriorHistory: defaultReadPriorHistory,
  readPriorSnapshot: defaultReadPriorSnapshot,
  statSnapshotDir: defaultStatSnapshotDir,
  writePlaintext: defaultWritePlaintext,
  now: () => new Date(),
  stdout: (line) => process.stdout.write(`${line}\n`),
  stderr: (line) => process.stderr.write(`${line}\n`),
};

// ---------------------------------------------------------------------------
// Secret resolution
// ---------------------------------------------------------------------------

/** Resolve the encryption password (env-first; budget-etl precedence). */
function resolvePassword(env: Env, flags: Flags): string | null {
  const pw = env.OFFICE_HOURS_SNAPSHOT_PASSWORD;
  if (typeof pw === "string" && pw.length > 0) return pw;
  if (flags.dryRun || flags.plaintext) return null;
  throw new Error(
    "OFFICE_HOURS_SNAPSHOT_PASSWORD is required (set it, or use --dry-run / --plaintext)",
  );
}

/**
 * Resolve the member-email PII list. Real mode (incl. --plaintext) reads Secret
 * Manager (and fails closed on an empty list — a doc no member can read locks the
 * owner out). --dry-run NEVER touches Secret Manager: it uses the dry-run-only
 * OFFICE_HOURS_MEMBER_EMAILS_OVERRIDE plaintext list, else an empty list.
 */
async function resolveMemberEmails(
  config: SnapshotConfig,
  flags: Flags,
  io: RunIo,
): Promise<string[]> {
  if (flags.dryRun) {
    return config.memberEmailsOverride ? parseEmails(config.memberEmailsOverride) : [];
  }
  const emails = await io.resolveMemberEmailsFromSecret(
    config.gcpProjectId,
    config.memberEmailsSecret,
  );
  if (emails.length === 0) {
    throw new Error(
      "member-email list resolved to an empty list (would lock the owner out of the snapshot)",
    );
  }
  return emails;
}

// ---------------------------------------------------------------------------
// Fetcher wiring (gh + Google)
// ---------------------------------------------------------------------------

interface GoogleFetchers {
  fetchGa4: (() => Promise<Ga4AppSignals[]>) | null;
  fetchGsc: ((now: Date) => Promise<GscSignals>) | null;
  fetchPsi: (() => Promise<PsiUrlSignals[]>) | null;
}

/**
 * Build the GA4/GSC/PSI live fetchers from config, mirroring the hosted
 * collectProjectSignals wiring: GA4 + GSC share one lazily-minted Google access
 * token; an unconfigured source stays null (the core then omits its sub-object).
 */
function buildGoogleFetchers(config: SnapshotConfig): GoogleFetchers {
  const fetchFn = globalThis.fetch;
  let fetchGa4: GoogleFetchers["fetchGa4"] = null;
  let fetchGsc: GoogleFetchers["fetchGsc"] = null;
  let fetchPsi: GoogleFetchers["fetchPsi"] = null;

  if (config.google) {
    const creds = config.google;
    let tokenPromise: Promise<string> | null = null;
    const googleToken = (): Promise<string> => {
      if (!tokenPromise) tokenPromise = fetchGoogleAccessTokenLive(fetchFn, creds);
      return tokenPromise;
    };
    if (config.ga4PropertyId && config.ga4HostApps.length > 0) {
      const propertyId = config.ga4PropertyId;
      const hostApps = config.ga4HostApps;
      fetchGa4 = async (): Promise<Ga4AppSignals[]> =>
        fetchGa4Live(fetchFn, await googleToken(), propertyId, hostApps);
    }
    fetchGsc = async (now: Date): Promise<GscSignals> =>
      fetchGscLive(fetchFn, await googleToken(), config.gscSite, now);
  }

  if (config.psiUrls.length > 0) {
    const { psiUrls, psiStrategy, psiApiKey } = config;
    fetchPsi = async (): Promise<PsiUrlSignals[]> =>
      Promise.all(psiUrls.map((u) => fetchPsiLive(fetchFn, u, psiStrategy, psiApiKey)));
  }

  return { fetchGa4, fetchGsc, fetchPsi };
}

/**
 * Build the optional capacity-band usage sampler. Off by default; opt-in by
 * pointing OFFICE_HOURS_USAGE_PAYLOAD_FILE at a JSON usage payload that is piped
 * to usage-sample-writer.mjs --dry-run (which additionally needs its own
 * DISPATCH_USAGE_SAMPLES_* env in the inherited environment — see the README).
 */
function buildSampleUsage(
  config: SnapshotConfig,
): (() => Promise<import("./produce.js").PriorHistory["samples"][number] | null>) | null {
  const file = config.usagePayloadFile;
  if (!file) return null;
  return async () => {
    const payload = fs.readFileSync(file, "utf8");
    return runUsageSampleWriter(payload);
  };
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

/**
 * Run the producer. Returns a process exit code (0 ok; non-zero on any failure or
 * a not-ok parity result). Never throws — all failures are caught, printed as a
 * single-line diagnostic, and mapped to exit 1.
 */
export async function run(argv: string[], env: Env, io: RunIo = defaultIo): Promise<number> {
  try {
    const flags = parseArgs(argv);
    const config = loadConfig(env, { scope: flags.scope, dryRun: flags.dryRun });
    const now = io.now();
    const password = resolvePassword(env, flags);

    // 1. Mount/precondition check UP FRONT for any run that writes to Drive — fail
    //    before doing all the gh/GA4/GSC/PSI fetching if the Drive is unmounted.
    if (!flags.dryRun && config.snapshotDir) {
      io.statSnapshotDir(config.snapshotDir);
    }

    // 2. Secrets: member-email PII + (already resolved) password.
    const memberEmails = await resolveMemberEmails(config, flags, io);

    // 3. Build the real fetchers shared by both pipelines.
    const fetchers = createGhFetchers({
      groupRepo: config.groupRepo,
      githubRepo: config.githubRepo,
    });
    const google = buildGoogleFetchers(config);

    // Prior state is read only on a real run with a password (dry-run never
    // touches Drive).
    const wantPrior = !flags.dryRun && password !== null && config.snapshotDir;

    let snapshot: OfficeHoursSnapshot;
    if (flags.scope === "analytics") {
      // Analytics pipeline: collect ONLY the projectSignals section and fold it
      // into the prior snapshot document — every other field is preserved
      // verbatim (see foldProjectSignals). loadConfig has already required every
      // source for this scope, so the fetchers below are all non-null.
      const signals = await io.produceProjectSignals({
        namespace: config.namespace,
        groupId: config.groupId,
        memberEmails,
        fetchGithub: fetchers.fetchGithub,
        fetchGa4: google.fetchGa4,
        fetchGsc: google.fetchGsc,
        fetchPsi: google.fetchPsi,
        now: () => now,
      });
      const prior = wantPrior
        ? await io.readPriorSnapshot(config.snapshotDir!, password!) // type-safety-ok: wantPrior guards snapshotDir + password non-null
        : null;
      snapshot = foldProjectSignals(prior, signals, now);
    } else {
      const sampleUsage = buildSampleUsage(config);

      const deps: ProduceDeps = {
        namespace: config.namespace,
        groupId: config.groupId,
        memberEmails,
        queueRepos: config.queueRepos,
        ...fetchers,
        fetchGa4: google.fetchGa4,
        fetchGsc: google.fetchGsc,
        fetchPsi: google.fetchPsi,
        now: () => now,
        ...(sampleUsage ? { sampleUsage } : {}),
        ...(wantPrior
          ? { readPriorHistory: () => io.readPriorHistory(config.snapshotDir!, password!) } // type-safety-ok: wantPrior guards snapshotDir + password non-null
          : {}),
      };

      const input = await io.produceSnapshot(deps, flags.scope);
      snapshot = serializeSnapshot(input);
    }

    let exitCode = 0;

    // 4. Parity (optional). Prints divergences; non-zero exit if not ok. The write
    //    still PROCEEDS — dual-write: parity is a shape-drift signal, not a gate.
    if (flags.parity) {
      const reader = io.createParityReader(config.namespace);
      const result = await io.checkParity(snapshot, { reader, namespace: config.namespace });
      if (result.ok) {
        io.stdout("parity: ok (no shape divergences)");
      } else {
        io.stderr(`parity: ${result.divergences.length} divergence(s):`);
        for (const d of result.divergences) {
          io.stderr(`  [${d.field}] ${d.kind}: ${d.detail}`);
        }
        exitCode = 1;
      }
    }

    // 5. Output.
    if (flags.dryRun) {
      io.stdout(JSON.stringify(snapshot, null, 2));
    } else if (flags.plaintext) {
      const p = io.writePlaintext(config.snapshotDir!, snapshot, now); // type-safety-ok: snapshotDir required on a non-dry-run real/plaintext run
      io.stderr(`WARNING: wrote UNENCRYPTED debug snapshot (not the .benc reader file): ${p}`);
    } else {
      const res = await io.writeSnapshot({
        snapshotDir: config.snapshotDir!, // type-safety-ok: snapshotDir required on a real run (loadConfig enforces)
        json: snapshot,
        password: password!, // type-safety-ok: resolvePassword throws unless dry-run/plaintext, neither of which reach this branch
        now,
      });
      io.stdout(`wrote ${res.historyPath}`);
      io.stdout(`wrote ${res.currentPath}`);
    }

    return exitCode;
  } catch (err) {
    io.stderr(`office-hours-snapshot: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}
