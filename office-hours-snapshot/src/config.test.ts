import { describe, it, expect } from "vitest";

import { loadConfig, type Env } from "./config.js";

/** A complete, valid environment for a real scope="full" run. */
const FULL_ENV: Env = {
  OFFICE_HOURS_GROUP_ID: "g1",
  OFFICE_HOURS_QUEUE_REPOS: "natb1/commons.systems, natb1/office-hours-nate",
  OFFICE_HOURS_GROUP_REPO: "natb1/office-hours-nate",
  OFFICE_HOURS_SNAPSHOT_DIR: "/mnt/g/snap",
};

const FULL_OPTS = { scope: "full" as const, dryRun: false };

describe("loadConfig", () => {
  it("parses a full env and applies defaults", () => {
    const c = loadConfig(FULL_ENV, FULL_OPTS);
    expect(c.groupId).toBe("g1");
    expect(c.queueRepos).toEqual(["natb1/commons.systems", "natb1/office-hours-nate"]);
    expect(c.groupRepo).toBe("natb1/office-hours-nate");
    expect(c.snapshotDir).toBe("/mnt/g/snap");
    // Defaults.
    expect(c.namespace).toBe("office-hours/prod");
    expect(c.gscSite).toBe("sc-domain:commons.systems");
    expect(c.psiStrategy).toBe("mobile");
    expect(c.psiUrls.length).toBeGreaterThan(0);
    expect(c.memberEmailsSecret).toBe("OFFICE_HOURS_MEMBER_EMAILS");
    expect(c.gcpProjectId).toBe("commons-systems");
    // Optional sources default to absent.
    expect(c.google).toBeNull();
    expect(c.githubRepo).toBeUndefined();
    expect(c.ga4HostApps).toEqual([]);
    expect(c.usagePayloadFile).toBeUndefined();
  });

  it("honors overrides for the defaulted vars", () => {
    const c = loadConfig(
      {
        ...FULL_ENV,
        OFFICE_HOURS_FIRESTORE_NAMESPACE: "office-hours/staging",
        PROJECT_SIGNALS_GSC_SITE: "https://commons.systems",
        PROJECT_SIGNALS_PSI_STRATEGY: "desktop",
        PROJECT_SIGNALS_PSI_URLS: "https://commons.systems",
        OFFICE_HOURS_MEMBER_EMAILS_SECRET: "MY_SECRET",
        OFFICE_HOURS_GCP_PROJECT_ID: "my-proj",
      },
      FULL_OPTS,
    );
    expect(c.namespace).toBe("office-hours/staging");
    expect(c.gscSite).toBe("https://commons.systems");
    expect(c.psiStrategy).toBe("desktop");
    expect(c.psiUrls).toEqual(["https://commons.systems"]);
    expect(c.memberEmailsSecret).toBe("MY_SECRET");
    expect(c.gcpProjectId).toBe("my-proj");
  });

  it("builds the Google creds triple when all three are present", () => {
    const c = loadConfig(
      {
        ...FULL_ENV,
        GOOGLE_ANALYTICS_CLIENT_ID: "cid",
        GOOGLE_ANALYTICS_CLIENT_SECRET: "csec",
        GOOGLE_ANALYTICS_REFRESH_TOKEN: "rt",
        PROJECT_SIGNALS_GA4_PROPERTY_ID: "123",
        PROJECT_SIGNALS_GA4_HOST_APPS: "commons.systems:commons",
      },
      FULL_OPTS,
    );
    expect(c.google).toEqual({ clientId: "cid", clientSecret: "csec", refreshToken: "rt" });
    expect(c.ga4PropertyId).toBe("123");
    expect(c.ga4HostApps).toEqual([{ host: "commons.systems", app: "commons" }]);
  });

  it("fail-fast names each missing required var", () => {
    for (const drop of [
      "OFFICE_HOURS_GROUP_ID",
      "OFFICE_HOURS_QUEUE_REPOS",
      "OFFICE_HOURS_SNAPSHOT_DIR",
      "OFFICE_HOURS_GROUP_REPO",
    ]) {
      const env = { ...FULL_ENV };
      delete env[drop];
      expect(() => loadConfig(env, FULL_OPTS), `missing ${drop}`).toThrow(drop);
    }
  });

  it("does NOT require the Drive dir on a dry-run", () => {
    const env = { ...FULL_ENV };
    delete env.OFFICE_HOURS_SNAPSHOT_DIR;
    const c = loadConfig(env, { scope: "full", dryRun: true });
    expect(c.snapshotDir).toBeUndefined();
  });

  it("does NOT require the group repo on a parked-only scope", () => {
    const env = { ...FULL_ENV };
    delete env.OFFICE_HOURS_GROUP_REPO;
    const c = loadConfig(env, { scope: "parked-only", dryRun: false });
    expect(c.groupRepo).toBeUndefined();
  });

  it("rejects an invalid namespace", () => {
    expect(() =>
      loadConfig({ ...FULL_ENV, OFFICE_HOURS_FIRESTORE_NAMESPACE: "bad/ns/extra" }, FULL_OPTS),
    ).toThrow("OFFICE_HOURS_FIRESTORE_NAMESPACE");
  });

  it("rejects a partial Google OAuth triple", () => {
    expect(() =>
      loadConfig({ ...FULL_ENV, GOOGLE_ANALYTICS_CLIENT_ID: "cid" }, FULL_OPTS),
    ).toThrow("Google OAuth is partially configured");
  });

  it("rejects an invalid PSI strategy and a non-numeric GA4 property id", () => {
    expect(() =>
      loadConfig({ ...FULL_ENV, PROJECT_SIGNALS_PSI_STRATEGY: "tablet" }, FULL_OPTS),
    ).toThrow("PROJECT_SIGNALS_PSI_STRATEGY");
    expect(() =>
      loadConfig({ ...FULL_ENV, PROJECT_SIGNALS_GA4_PROPERTY_ID: "abc" }, FULL_OPTS),
    ).toThrow("PROJECT_SIGNALS_GA4_PROPERTY_ID");
  });
});
