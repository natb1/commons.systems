import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { parseArgs, run, defaultIo, type RunIo } from "./run.js";
import { serializeSnapshot, type SnapshotInput } from "./snapshot.js";
import type { Env } from "./config.js";
import type { UsageSample } from "../../office-hours/src/usage-samples.js";
import type { IssueSample } from "../../office-hours/src/issue-samples.js";

const NOW = new Date("2026-06-30T12:00:00.000Z");

const FULL_ENV: Env = {
  OFFICE_HOURS_GROUP_ID: "g1",
  OFFICE_HOURS_QUEUE_REPOS: "natb1/commons.systems",
  OFFICE_HOURS_GROUP_REPO: "natb1/office-hours-nate",
  OFFICE_HOURS_SNAPSHOT_DIR: "/mnt/g/snap",
  OFFICE_HOURS_SNAPSHOT_PASSWORD: "pw",
};

function fakeInput(scope: "full" | "parked-only" = "full"): SnapshotInput {
  return {
    samples: [],
    reminders: [],
    queueMetrics: null,
    issueSamples: [],
    topicUsage: [],
    projectSignals: null,
    computedAt: NOW,
    chainHealth: {},
    scope,
  };
}

/** A fully-mocked IO seam set; override individual seams per test. */
function makeIo(overrides: Partial<RunIo> = {}): RunIo {
  return {
    produceSnapshot: vi.fn(async (_deps, scope) => fakeInput(scope)),
    writeSnapshot: vi.fn(async () => ({
      historyPath: "/mnt/g/snap/office-hours-2026.benc",
      currentPath: "/mnt/g/snap/office-hours-current.benc",
    })),
    checkParity: vi.fn(async () => ({ ok: true, divergences: [] })),
    createParityReader: vi.fn(() => ({
      getDoc: vi.fn(async () => null),
      listCollection: vi.fn(async () => []),
    })),
    resolveMemberEmailsFromSecret: vi.fn(async () => ["owner@example.com"]),
    readPriorHistory: vi.fn(async () => null),
    statSnapshotDir: vi.fn(),
    writePlaintext: vi.fn(() => "/mnt/g/snap/office-hours-current.json"),
    now: () => NOW,
    stdout: vi.fn(),
    stderr: vi.fn(),
    ...overrides,
  };
}

describe("parseArgs", () => {
  it("defaults to scope=full and no flags", () => {
    expect(parseArgs([])).toEqual({ scope: "full", dryRun: false, parity: false, plaintext: false });
  });

  it("parses --scope (space and = forms)", () => {
    expect(parseArgs(["--scope", "parked-only"]).scope).toBe("parked-only");
    expect(parseArgs(["--scope=parked-only"]).scope).toBe("parked-only");
  });

  it("parses the boolean flags", () => {
    expect(parseArgs(["--dry-run", "--parity", "--plaintext"])).toEqual({
      scope: "full",
      dryRun: true,
      parity: true,
      plaintext: true,
    });
  });

  it("rejects an invalid scope and unknown args", () => {
    expect(() => parseArgs(["--scope", "weird"])).toThrow("--scope");
    expect(() => parseArgs(["--nope"])).toThrow("unknown argument");
  });
});

describe("run", () => {
  it("real run: resolves member emails from Secret Manager, writes, returns 0", async () => {
    const io = makeIo();
    const code = await run([], FULL_ENV, io);
    expect(code).toBe(0);
    expect(io.statSnapshotDir).toHaveBeenCalledWith("/mnt/g/snap");
    expect(io.resolveMemberEmailsFromSecret).toHaveBeenCalledOnce();
    expect(io.writeSnapshot).toHaveBeenCalledOnce();
  });

  it("--dry-run: skips Secret Manager AND the Drive write, prints JSON, returns 0", async () => {
    const io = makeIo();
    const code = await run(["--dry-run"], FULL_ENV, io);
    expect(code).toBe(0);
    // The two IO effects dry-run must NOT perform.
    expect(io.resolveMemberEmailsFromSecret).not.toHaveBeenCalled();
    expect(io.writeSnapshot).not.toHaveBeenCalled();
    expect(io.statSnapshotDir).not.toHaveBeenCalled();
    // It printed the serialized snapshot.
    const printed = (io.stdout as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).join("\n");
    expect(printed).toContain('"scope": "full"');
  });

  it("--dry-run: uses the dry-run-only member-email override, never Secret Manager", async () => {
    const io = makeIo();
    const env = { ...FULL_ENV, OFFICE_HOURS_MEMBER_EMAILS_OVERRIDE: "a@x.com,b@x.com" };
    await run(["--dry-run"], env, io);
    expect(io.resolveMemberEmailsFromSecret).not.toHaveBeenCalled();
    const deps = (io.produceSnapshot as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(deps.memberEmails).toEqual(["a@x.com", "b@x.com"]);
  });

  it("password fail-fast: real run with no password returns 1 and does not write", async () => {
    const io = makeIo();
    const env = { ...FULL_ENV };
    delete env.OFFICE_HOURS_SNAPSHOT_PASSWORD;
    const code = await run([], env, io);
    expect(code).toBe(1);
    expect(io.writeSnapshot).not.toHaveBeenCalled();
    const errs = (io.stderr as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).join("\n");
    expect(errs).toContain("OFFICE_HOURS_SNAPSHOT_PASSWORD");
  });

  it("--dry-run / --plaintext do not require a password", async () => {
    const env = { ...FULL_ENV };
    delete env.OFFICE_HOURS_SNAPSHOT_PASSWORD;
    expect(await run(["--dry-run"], env, makeIo())).toBe(0);
    expect(await run(["--plaintext"], env, makeIo())).toBe(0);
  });

  it("--plaintext: writes the unencrypted debug file, not the encrypted snapshot", async () => {
    const io = makeIo();
    const code = await run(["--plaintext"], FULL_ENV, io);
    expect(code).toBe(0);
    expect(io.writePlaintext).toHaveBeenCalledOnce();
    expect(io.writeSnapshot).not.toHaveBeenCalled();
  });

  it("--parity ok: runs checkParity and returns 0; write still proceeds", async () => {
    const io = makeIo();
    const code = await run(["--parity"], FULL_ENV, io);
    expect(code).toBe(0);
    expect(io.checkParity).toHaveBeenCalledOnce();
    expect(io.writeSnapshot).toHaveBeenCalledOnce();
  });

  it("--parity not-ok: returns 1 but STILL writes (dual-write, not a gate)", async () => {
    const io = makeIo({
      checkParity: vi.fn(async () => ({
        ok: false,
        divergences: [{ field: "queueMetrics", kind: "missing-key" as const, detail: "x" }],
      })),
    });
    const code = await run(["--parity"], FULL_ENV, io);
    expect(code).toBe(1);
    expect(io.writeSnapshot).toHaveBeenCalledOnce();
  });

  it("does not construct the parity reader on a non-parity run", async () => {
    const io = makeIo();
    await run([], FULL_ENV, io);
    expect(io.createParityReader).not.toHaveBeenCalled();
  });

  it("mount-check failure surfaces non-zero and skips producing", async () => {
    const io = makeIo({
      statSnapshotDir: vi.fn(() => {
        throw new Error("snapshot dir missing (Drive mount?): /mnt/g/snap");
      }),
    });
    const code = await run([], FULL_ENV, io);
    expect(code).toBe(1);
    expect(io.produceSnapshot).not.toHaveBeenCalled();
    expect(io.writeSnapshot).not.toHaveBeenCalled();
  });

  it("config fail-fast (missing required var) returns 1", async () => {
    const env = { ...FULL_ENV };
    delete env.OFFICE_HOURS_GROUP_ID;
    const code = await run([], env, makeIo());
    expect(code).toBe(1);
  });

  it("wires prior-history reading on a real run with a password", async () => {
    const io = makeIo();
    await run([], FULL_ENV, io);
    const deps = (io.produceSnapshot as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(typeof deps.readPriorHistory).toBe("function");
    await deps.readPriorHistory();
    expect(io.readPriorHistory).toHaveBeenCalledWith("/mnt/g/snap", "pw");
  });

  it("does NOT wire prior-history reading on a dry-run", async () => {
    const io = makeIo();
    await run(["--dry-run"], FULL_ENV, io);
    const deps = (io.produceSnapshot as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(deps.readPriorHistory).toBeUndefined();
    expect(io.readPriorHistory).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Prior-history BENC round-trip (real writeSnapshot + readPriorHistory).
// This is the "BENC decrypt round-trip" manual-QA item, automated: it proves the
// series Dates survive serialize → encrypt → write → read → decrypt → map, which
// the office-hours Timestamp-based parsers would NOT (they reject ISO strings).
// ---------------------------------------------------------------------------

function makeUsageSample(o: Partial<UsageSample> = {}): UsageSample {
  return {
    sampledAt: NOW,
    fiveHourUsedPct: 10,
    weeklyUsedPct: 20,
    fiveHourResetsAt: new Date("2026-06-30T17:00:00.000Z"),
    weeklyResetsAt: new Date("2026-07-07T00:00:00.000Z"),
    activeWorkers: 4,
    targetWorkers: 8,
    groupId: "g1",
    ...o,
  };
}

function makeIssueSample(o: Partial<IssueSample> = {}): IssueSample {
  return {
    sampledAt: NOW,
    openSecurity: 1,
    openBug: 2,
    openEnhancement: 3,
    openOther: 4,
    groupId: "g1",
    ...o,
  };
}

describe("defaultIo.readPriorHistory round-trip", () => {
  it("recovers both series with real Dates after an encrypted write", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oh-snap-"));
    try {
      const input: SnapshotInput = {
        ...fakeInput(),
        samples: [makeUsageSample(), makeUsageSample({ sampledAt: new Date("2026-06-30T13:00:00.000Z") })],
        issueSamples: [makeIssueSample()],
      };
      const snapshot = serializeSnapshot(input);
      await defaultIo.writeSnapshot({ snapshotDir: dir, json: snapshot, password: "pw", now: NOW });

      const prior = await defaultIo.readPriorHistory(dir, "pw");
      expect(prior).not.toBeNull();
      expect(prior!.samples).toHaveLength(2);
      expect(prior!.issueSamples).toHaveLength(1);
      expect(prior!.samples[0].sampledAt).toBeInstanceOf(Date);
      expect(prior!.samples[0].sampledAt.toISOString()).toBe(NOW.toISOString());
      expect(prior!.issueSamples[0].sampledAt).toBeInstanceOf(Date);
      expect(prior!.samples[0].groupId).toBe("g1");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns null when no prior snapshot exists", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oh-snap-"));
    try {
      expect(await defaultIo.readPriorHistory(dir, "pw")).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws on a wrong password (no silent history reset)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oh-snap-"));
    try {
      const snapshot = serializeSnapshot(fakeInput());
      await defaultIo.writeSnapshot({ snapshotDir: dir, json: snapshot, password: "right", now: NOW });
      await expect(defaultIo.readPriorHistory(dir, "wrong")).rejects.toThrow();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
