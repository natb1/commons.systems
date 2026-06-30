// Non-secret configuration for the office-hours local-snapshot producer.
//
// `loadConfig(env, opts)` reads the producer's environment variables, validates
// them fail-fast (a clear single-line Error naming the offending var — see
// .claude/rules/code-style.md: clear errors, no silent fallbacks), and returns a
// typed config object. Secrets (the encryption password and the member-email
// PII) are NOT read here — they are resolved separately in run.ts (password from
// env, member emails from Secret Manager + ADC), mirroring the
// usage-sample-writer.mjs / audit-aggregate-writer.mjs precedents.
//
// Env-var names deliberately reuse the hosted Functions' names
// (OFFICE_HOURS_* / PROJECT_SIGNALS_*) so the Nix/systemd sibling (#2660) wires
// one contract for both the hosted producers and this local producer.

import {
  isValidOwnerName,
  isValidGscSite,
  isValidPsiUrl,
  parseGa4HostApps,
} from "../../functions/src/project-signals-core.js";
import type { SnapshotScope } from "./snapshot.js";

/** A process-environment-shaped string map (process.env). */
export type Env = Record<string, string | undefined>;

/** Options that make the required-var set scope- and mode-dependent. */
export interface LoadConfigOptions {
  /** "full" requires the jit group repo; "parked-only" does not. */
  scope: SnapshotScope;
  /** Dry-run drops the Drive-dir requirement (nothing is written). */
  dryRun: boolean;
}

/** Resolved Google OAuth credential triple, or null when none is configured. */
export interface GoogleCreds {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/** The validated, typed non-secret producer config. */
export interface SnapshotConfig {
  /** Drive snapshot dir. Present unless dry-run. */
  snapshotDir: string | undefined;
  /** Firestore namespace prefix, validated `office-hours/<env>`. */
  namespace: string;
  /** Owning group id. */
  groupId: string;
  /** Repos scanned for queue metrics + parked office-hours work. */
  queueRepos: string[];
  /** Jit group repo (owner/name). Present for scope="full". */
  groupRepo: string | undefined;

  // --- Member-email PII resolution (Secret Manager + ADC) ---
  /** Secret Manager secret NAME holding the comma-separated member-email list. */
  memberEmailsSecret: string;
  /** GCP project id the secret lives in. */
  gcpProjectId: string;
  /** Dry-run-only plaintext member-email override (never read in real mode). */
  memberEmailsOverride: string | undefined;

  // --- Project-signals sources (all optional; absent ⇒ that signal omitted) ---
  /** GitHub project-signals repo (owner/name), via the local authed `gh`. */
  githubRepo: string | undefined;
  /** Google OAuth creds shared by GA4 + GSC; null when not configured. */
  google: GoogleCreds | null;
  /** GA4 numeric property id. */
  ga4PropertyId: string | undefined;
  /** GA4 host→app map. */
  ga4HostApps: Array<{ host: string; app: string }>;
  /** GSC site (default sc-domain:commons.systems). */
  gscSite: string;
  /** PSI URLs to audit. */
  psiUrls: string[];
  /** PSI strategy. */
  psiStrategy: "mobile" | "desktop";
  /** PSI API key (optional; keyless by default). */
  psiApiKey: string | undefined;

  // --- Usage capacity-band sampling (optional, off by default) ---
  /** Path to a JSON usage payload fed to usage-sample-writer.mjs --dry-run. */
  usagePayloadFile: string | undefined;
}

/** The default PSI URL set (mirrors PROJECT_SIGNALS_PSI_URLS in the hosted fn). */
const DEFAULT_PSI_URLS =
  "https://commons.systems,https://budget.commons.systems,https://print.commons.systems,https://audio.commons.systems,https://fellspiral.commons.systems";

function reqStr(env: Env, name: string): string {
  const v = env[name];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`${name} is required and must be non-empty`);
  }
  return v;
}

function splitList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Parse + validate the producer's non-secret config. Throws a clear single-line
 * Error naming the first offending variable; the caller prints it and exits 1.
 */
export function loadConfig(env: Env, opts: LoadConfigOptions): SnapshotConfig {
  // --- Always required ---
  const groupId = reqStr(env, "OFFICE_HOURS_GROUP_ID");

  const namespace = env.OFFICE_HOURS_FIRESTORE_NAMESPACE ?? "office-hours/prod";
  if (!/^office-hours\/[A-Za-z0-9][A-Za-z0-9-]*$/.test(namespace)) {
    throw new Error(
      `OFFICE_HOURS_FIRESTORE_NAMESPACE "${namespace}" is not a valid office-hours/<env> path`,
    );
  }

  const queueRepos = splitList(reqStr(env, "OFFICE_HOURS_QUEUE_REPOS"));
  if (queueRepos.length === 0) {
    throw new Error("OFFICE_HOURS_QUEUE_REPOS resolved to an empty list");
  }
  for (const r of queueRepos) {
    if (!isValidOwnerName(r)) {
      throw new Error(`OFFICE_HOURS_QUEUE_REPOS entry "${r}" is not a valid owner/name`);
    }
  }

  // --- Drive dir: required unless dry-run ---
  let snapshotDir = env.OFFICE_HOURS_SNAPSHOT_DIR;
  if (!opts.dryRun) {
    snapshotDir = reqStr(env, "OFFICE_HOURS_SNAPSHOT_DIR");
  }

  // --- Group repo: required for scope="full" (produceSnapshot hard-throws on a
  //     null fetchOpenJitIssues, so fail-fast here naming the var). ---
  let groupRepo = env.OFFICE_HOURS_GROUP_REPO;
  if (opts.scope === "full") {
    groupRepo = reqStr(env, "OFFICE_HOURS_GROUP_REPO");
  }
  if (groupRepo && !isValidOwnerName(groupRepo)) {
    throw new Error(`OFFICE_HOURS_GROUP_REPO "${groupRepo}" is not a valid owner/name`);
  }

  // --- Member-email PII resolution config ---
  const memberEmailsSecret =
    env.OFFICE_HOURS_MEMBER_EMAILS_SECRET ?? "OFFICE_HOURS_MEMBER_EMAILS";
  if (memberEmailsSecret.length === 0 || memberEmailsSecret.includes("/")) {
    throw new Error("OFFICE_HOURS_MEMBER_EMAILS_SECRET must be non-empty and contain no slash");
  }
  const gcpProjectId = env.OFFICE_HOURS_GCP_PROJECT_ID ?? "commons-systems";
  if (gcpProjectId.length === 0 || gcpProjectId.includes("/")) {
    throw new Error("OFFICE_HOURS_GCP_PROJECT_ID must be non-empty and contain no slash");
  }

  // --- Project-signals sources (optional) ---
  const githubRepo = env.PROJECT_SIGNALS_GITHUB_REPO || undefined;
  if (githubRepo && !isValidOwnerName(githubRepo)) {
    throw new Error(`PROJECT_SIGNALS_GITHUB_REPO "${githubRepo}" is not a valid owner/name`);
  }

  // GA4 + GSC share one Google OAuth credential. All-or-nothing: a partial triple
  // is a configuration mistake, not a "skip" — fail-fast naming the missing piece.
  const clientId = env.GOOGLE_ANALYTICS_CLIENT_ID;
  const clientSecret = env.GOOGLE_ANALYTICS_CLIENT_SECRET;
  const refreshToken = env.GOOGLE_ANALYTICS_REFRESH_TOKEN;
  const anyGoogle = Boolean(clientId || clientSecret || refreshToken);
  let google: GoogleCreds | null = null;
  if (anyGoogle) {
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        "Google OAuth is partially configured — set ALL of GOOGLE_ANALYTICS_CLIENT_ID, " +
          "GOOGLE_ANALYTICS_CLIENT_SECRET, GOOGLE_ANALYTICS_REFRESH_TOKEN (or none)",
      );
    }
    google = { clientId, clientSecret, refreshToken };
  }

  const ga4PropertyId = env.PROJECT_SIGNALS_GA4_PROPERTY_ID || undefined;
  if (ga4PropertyId && !/^\d+$/.test(ga4PropertyId)) {
    throw new Error(`PROJECT_SIGNALS_GA4_PROPERTY_ID "${ga4PropertyId}" is not numeric`);
  }
  const ga4HostApps = parseGa4HostApps(env.PROJECT_SIGNALS_GA4_HOST_APPS ?? "");

  const gscSite = env.PROJECT_SIGNALS_GSC_SITE ?? "sc-domain:commons.systems";
  if (!isValidGscSite(gscSite)) {
    throw new Error(`PROJECT_SIGNALS_GSC_SITE "${gscSite}" is not a valid sc-domain:/https:// site`);
  }

  const psiStrategyRaw = env.PROJECT_SIGNALS_PSI_STRATEGY ?? "mobile";
  if (psiStrategyRaw !== "mobile" && psiStrategyRaw !== "desktop") {
    throw new Error(`PROJECT_SIGNALS_PSI_STRATEGY "${psiStrategyRaw}" must be mobile or desktop`);
  }
  const psiUrls = splitList(env.PROJECT_SIGNALS_PSI_URLS ?? DEFAULT_PSI_URLS);
  for (const u of psiUrls) {
    if (!isValidPsiUrl(u)) {
      throw new Error(`PROJECT_SIGNALS_PSI_URLS entry "${u}" is not a valid https:// URL`);
    }
  }
  const psiApiKey = env.PAGESPEED_API_KEY || undefined;

  const usagePayloadFile = env.OFFICE_HOURS_USAGE_PAYLOAD_FILE || undefined;

  return {
    snapshotDir,
    namespace,
    groupId,
    queueRepos,
    groupRepo,
    memberEmailsSecret,
    gcpProjectId,
    memberEmailsOverride: env.OFFICE_HOURS_MEMBER_EMAILS_OVERRIDE || undefined,
    githubRepo,
    google,
    ga4PropertyId,
    ga4HostApps,
    gscSite,
    psiUrls,
    psiStrategy: psiStrategyRaw,
    psiApiKey,
    usagePayloadFile,
  };
}
