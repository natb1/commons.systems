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
} from "../../functions/src/project-signals-core.js";
import type {
  Ga4AppSignals,
  GscSignals,
  PsiUrlSignals,
} from "../../functions/src/project-signals-core.js";

import { createGhFetchers } from "./gh-fetchers.js";
import {
  produceSnapshot,
  runUsageSampleWriter,
  type ProduceDeps,
  type PriorHistory,
} from "./produce.js";
import { serializeSnapshot } from "./snapshot.js";
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
      if (v !== "full" && v !== "parked-only") {
        throw new Error(`--scope must be "full" or "parked-only" (got "${v ?? ""}")`);
      }
      scope = v;
    } else if (arg.startsWith("--scope=")) {
      const v = arg.slice("--scope=".length);
      if (v !== "full" && v !== "parked-only") {
        throw new Error(`--scope must be "full" or "parked-only" (got "${v}")`);
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
  writeSnapshot(args: WriteSnapshotArgs): Promise<WriteSnapshotResult>;
  checkParity(snapshot: OfficeHoursSnapshot, deps: { reader: FirestoreReader; namespace: string }): Promise<ParityResult>;
  /** Build the live firebase-admin parity reader (constructed only for --parity). */
  createParityReader(namespace: string): FirestoreReader;
  /** Resolve the member-email PII list from Secret Manager via ADC. */
  resolveMemberEmailsFromSecret(projectId: string, secretName: string): Promise<string[]>;
  /** Decrypt the prior `current` snapshot's series, or null when absent. */
  readPriorHistory(snapshotDir: string, password: string): Promise<PriorHistory | null>;
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
 * Read + decrypt the prior `current` snapshot and recover its two series with
 * real Dates. A MISSING file → null (first run, fine). A present-but-undecryptable
 * file (wrong password / corrupt) → THROW (no silent history reset — see
 * .claude/rules/code-style.md). The office-hours `toUsageSample`/`toIssueSample`
 * parsers are NOT reused: they require a Firestore `.toDate()` Timestamp and a
 * `memberEmails` field the serialized snapshot intentionally drops, so they would
 * reject every serialized point and silently truncate the series to one point.
 */
async function defaultReadPriorHistory(
  snapshotDir: string,
  password: string,
): Promise<PriorHistory | null> {
  const file = path.join(snapshotDir, CURRENT_FILENAME);
  let buf: Buffer;
  try {
    buf = fs.readFileSync(file);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null; // no prior snapshot yet — start a fresh series.
    }
    throw err; // present-but-unreadable (EACCES, EISDIR, EIO, …) → surface, never silently reset history.
  }
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer; // type-safety-ok: a file-backed Buffer is never SharedArrayBuffer-backed
  const plaintext = await decryptData(crypto.webcrypto.subtle, ab, password);
  const snap = JSON.parse(plaintext) as OfficeHoursSnapshot; // type-safety-ok: decrypted prior snapshot is our own serialized shape
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
  writeSnapshot,
  checkParity,
  createParityReader: defaultCreateParityReader,
  resolveMemberEmailsFromSecret: defaultResolveMemberEmailsFromSecret,
  readPriorHistory: defaultReadPriorHistory,
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

    // 3. Build the real deps for produceSnapshot.
    const fetchers = createGhFetchers({
      groupRepo: config.groupRepo,
      githubRepo: config.githubRepo,
    });
    const google = buildGoogleFetchers(config);
    const sampleUsage = buildSampleUsage(config);

    // Prior history is read only on a real run with a password (dry-run never
    // touches Drive). Absent ⇒ produceSnapshot starts a fresh series.
    const wantPrior = !flags.dryRun && password !== null && config.snapshotDir;

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
    const snapshot = serializeSnapshot(input);

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
