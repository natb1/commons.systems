import { describe, it, expect, vi, beforeEach } from "vitest";
import { createVerify, generateKeyPairSync } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => {
  const TimestampImpl = {
    fromDate: (d: Date) => ({ toDate: () => d, _seconds: d.getTime() / 1000 }),
  };
  return {
    getFirestore: vi.fn(),
    Timestamp: TimestampImpl,
    FieldValue: { serverTimestamp: () => "__server_timestamp__" },
  };
});

vi.mock("firebase-functions/v2/scheduler", () => ({
  onSchedule: vi.fn((_opts, _fn) => ({})),
}));

vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({ value: () => "test-token" }),
  defineString: (_name: string, opts?: { default?: string }) => ({
    value: () => opts?.default ?? "test-value",
  }),
}));

import {
  syncOfficeHoursCore,
  fetchOpenJitIssuesLive,
  parseJitDueMarker,
  buildAppJwt,
  mintInstallationToken,
  type JitIssue,
} from "../src/office-hours-sync";

const testKeyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

interface InMemoryDocRef {
  path: string;
  set: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
}

function createInMemoryFirestore(
  opts: {
    failBulkWriterSetFor?: (ref: InMemoryDocRef) => boolean;
    failBulkWriterDeleteFor?: (ref: InMemoryDocRef) => boolean;
  } = {},
) {
  const docs = new Map<string, Record<string, unknown>>();

  const doc = (path: string): InMemoryDocRef => ({
    path,
    set: (data: Record<string, unknown>) => {
      docs.set(path, data);
      return Promise.resolve();
    },
    delete: () => {
      docs.delete(path);
      return Promise.resolve();
    },
  });

  const collection = (path: string) => ({
    get: async () => ({
      docs: [...docs.entries()]
        .filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
        .map(([key, data]) => ({
          id: key.slice(path.length + 1),
          ref: doc(key),
          data: () => data,
        })),
    }),
    doc: (id: string) => doc(`${path}/${id}`),
  });

  // Deliberate regression guard: enforces Firestore's real 500-op WriteBatch cap
  // so reverting production to a single batch fails the >500-op sync test.
  const batch = () => {
    const ops: Array<() => void> = [];
    let opCount = 0;
    const guard = () => {
      opCount += 1;
      if (opCount > 500) {
        throw new Error("INVALID_ARGUMENT: maximum 500 writes allowed per request");
      }
    };
    return {
      set: (ref: InMemoryDocRef, data: Record<string, unknown>) => {
        guard();
        ops.push(() => docs.set(ref.path, data));
      },
      delete: (ref: InMemoryDocRef) => {
        guard();
        ops.push(() => docs.delete(ref.path));
      },
      commit: async () => {
        for (const op of ops) op();
      },
    };
  };

  const bulkWriter = () => {
    const ops: Array<() => void> = [];
    return {
      set: (ref: InMemoryDocRef, data: Record<string, unknown>) => {
        if (opts.failBulkWriterSetFor?.(ref)) {
          return Promise.reject(
            new Error("BulkWriter set failed: simulated per-op write failure"),
          );
        }
        ops.push(() => docs.set(ref.path, data));
        return Promise.resolve();
      },
      delete: (ref: InMemoryDocRef) => {
        if (opts.failBulkWriterDeleteFor?.(ref)) {
          return Promise.reject(
            new Error("BulkWriter delete failed: simulated per-op delete failure"),
          );
        }
        ops.push(() => docs.delete(ref.path));
        return Promise.resolve();
      },
      close: async () => {
        for (const op of ops) op();
      },
    };
  };

  return { doc, collection, batch, bulkWriter, _docs: docs };
}

function makeIssue(overrides: Partial<JitIssue> = {}): JitIssue {
  return {
    number: 1,
    title: "Daily chore",
    body: "Recurring daily chore. Close when done.",
    jitKey: "daily-chore",
    repo: "natb1/office-hours-nate",
    dueAt: new Date("2026-01-15T12:00:00Z"),
    ...overrides,
  };
}

describe("syncOfficeHoursCore", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("writes one item per open jit issue with a due time", async () => {
    const store = createInMemoryFirestore();
    const issue = makeIssue({
      number: 42,
      jitKey: "daily-chore",
      dueAt: new Date("2026-01-15T12:00:00Z"),
    });

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [issue],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result).toEqual({ written: 1, deleted: 0, skippedNoDate: 0 });

    const written = store._docs.get("office-hours/prod/items/daily-chore") as Record<
      string,
      unknown
    > & { dueAt: { toDate: () => Date } };
    expect(written.title).toBe("Daily chore");
    expect(written.repo).toBe("natb1/office-hours-nate");
    expect(written.issueNumber).toBe(42);
    expect(written.jitKey).toBe("daily-chore");
    expect(written.memberEmails).toEqual(["owner@example.com"]);
    expect(written.updatedAt).toBe("__server_timestamp__");
    expect(written.dueAt.toDate().toISOString()).toBe("2026-01-15T12:00:00.000Z");
  });

  it("skips an issue with no due time", async () => {
    const store = createInMemoryFirestore();
    const withDate = makeIssue({ number: 1, jitKey: "daily-chore" });
    const noDate = makeIssue({ number: 2, jitKey: "budget-review", dueAt: null });

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [withDate, noDate],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result).toEqual({ written: 1, deleted: 0, skippedNoDate: 1 });
    expect(store._docs.has("office-hours/prod/items/daily-chore")).toBe(true);
    expect(store._docs.has("office-hours/prod/items/budget-review")).toBe(false);
  });

  it("deletes existing items not in the open set", async () => {
    const store = createInMemoryFirestore();
    store._docs.set("office-hours/prod/items/stale-key", {
      title: "Stale",
      jitKey: "stale-key",
    });

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result).toEqual({ written: 0, deleted: 1, skippedNoDate: 0 });
    expect(store._docs.has("office-hours/prod/items/stale-key")).toBe(false);
  });

  it("is idempotent: same input twice produces the same final state", async () => {
    const store = createInMemoryFirestore();
    const issue = makeIssue({ number: 10, jitKey: "daily-chore" });

    const deps = {
      fetchOpenJitIssues: async () => [issue],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    };

    const first = await syncOfficeHoursCore(deps);
    const second = await syncOfficeHoursCore(deps);

    expect(first).toEqual({ written: 1, deleted: 0, skippedNoDate: 0 });
    expect(second).toEqual({ written: 1, deleted: 0, skippedNoDate: 0 });
    expect(store._docs.size).toBe(1);
    expect(store._docs.has("office-hours/prod/items/daily-chore")).toBe(true);
  });

  it("skips an issue whose jitKey would escape the items collection", async () => {
    const store = createInMemoryFirestore();
    const valid = makeIssue({ number: 1, jitKey: "daily-chore" });
    const slash = makeIssue({ number: 2, jitKey: "a/b/c" });
    const dotdot = makeIssue({ number: 3, jitKey: ".." });
    const empty = makeIssue({ number: 4, jitKey: "" });

    const result = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [valid, slash, dotdot, empty],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    // Only the valid key is written; the path-escaping / invalid keys are
    // skipped before any Firestore write, so no nested doc is created.
    expect(result.written).toBe(1);
    expect(store._docs.has("office-hours/prod/items/daily-chore")).toBe(true);
    expect(store._docs.has("office-hours/prod/items/a/b/c")).toBe(false);
    expect([...store._docs.keys()]).toEqual(["office-hours/prod/items/daily-chore"]);
  });

  it("propagates memberEmails onto each written item", async () => {
    const store = createInMemoryFirestore();
    const issue = makeIssue({ number: 7, jitKey: "daily-chore" });

    await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => [issue],
      firestore: store as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["a@example.com", "b@example.com"],
    });

    const written = store._docs.get("office-hours/prod/items/daily-chore") as
      | Record<string, unknown>
      | undefined;
    expect(written?.memberEmails).toEqual(["a@example.com", "b@example.com"]);
  });

  it("handles more than 500 operations in a single sync", async () => {
    // Part 1: >500 set-only path — 600 writes in one sync run.
    // The regression guard: batch() throws on the 501st op, so a revert to
    // firestore.batch() fails here. BulkWriter chunks internally and passes.
    const store1 = createInMemoryFirestore();
    const issues = Array.from({ length: 600 }, (_, i) =>
      makeIssue({ number: i, jitKey: `k-${i}` }),
    );

    const result1 = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => issues,
      firestore: store1 as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result1.written).toBe(600);
    for (let i = 0; i < 600; i++) {
      expect(store1._docs.has(`office-hours/prod/items/k-${i}`)).toBe(true);
    }

    // Part 2: combined set+delete >500 path — 600 stale deletions + 5 fresh writes = 605 ops.
    const store2 = createInMemoryFirestore();
    for (let i = 0; i < 600; i++) {
      store2._docs.set(`office-hours/prod/items/stale-${i}`, {
        title: `Stale ${i}`,
        jitKey: `stale-${i}`,
      });
    }
    const freshIssues = Array.from({ length: 5 }, (_, i) =>
      makeIssue({ number: 700 + i, jitKey: `fresh-${i}` }),
    );

    const result2 = await syncOfficeHoursCore({
      fetchOpenJitIssues: async () => freshIssues,
      firestore: store2 as unknown as Firestore,
      namespace: "office-hours/prod",
      memberEmails: ["owner@example.com"],
    });

    expect(result2.written).toBe(5);
    expect(result2.deleted).toBe(600);
    for (let i = 0; i < 600; i++) {
      expect(store2._docs.has(`office-hours/prod/items/stale-${i}`)).toBe(false);
    }
    for (let i = 0; i < 5; i++) {
      expect(store2._docs.has(`office-hours/prod/items/fresh-${i}`)).toBe(true);
    }
  });

  it("throws when a BulkWriter set() op fails — Promise.all(writes) re-raises it", async () => {
    // BulkWriter routes per-op failures to the individual set() promise, not to
    // close(); the failing op below leaves close() resolving cleanly. Only the
    // `await Promise.all(writes)` line in syncOfficeHoursCore re-raises it, so
    // deleting that line causes this test to fail — syncOfficeHoursCore no
    // longer throws, so .rejects.toThrow() fails — surfacing the regression.
    const store = createInMemoryFirestore({
      failBulkWriterSetFor: (ref) =>
        ref.path === "office-hours/prod/items/daily-chore",
    });
    const issue = makeIssue({ number: 1, jitKey: "daily-chore" });

    await expect(
      syncOfficeHoursCore({
        fetchOpenJitIssues: async () => [issue],
        firestore: store as unknown as Firestore,
        namespace: "office-hours/prod",
        memberEmails: ["owner@example.com"],
      }),
    ).rejects.toThrow(/simulated per-op write failure/);

    // The failed op must not have written its doc.
    expect(store._docs.has("office-hours/prod/items/daily-chore")).toBe(false);
  });

  it("throws when a BulkWriter delete() op fails — Promise.all(writes) re-raises it", async () => {
    // Mirrors the set()-failure guard for the delete path: a stale doc not in
    // the open set is enqueued via writer.delete(), whose per-op failure is
    // routed to its own promise (not close()). Only the `await Promise.all(writes)`
    // line re-raises it, so deleting that line causes this test to fail —
    // syncOfficeHoursCore no longer throws, so .rejects.toThrow() fails.
    const store = createInMemoryFirestore({
      failBulkWriterDeleteFor: (ref) =>
        ref.path === "office-hours/prod/items/stale-key",
    });
    store._docs.set("office-hours/prod/items/stale-key", {
      title: "Stale",
      jitKey: "stale-key",
    });

    await expect(
      syncOfficeHoursCore({
        fetchOpenJitIssues: async () => [],
        firestore: store as unknown as Firestore,
        namespace: "office-hours/prod",
        memberEmails: ["owner@example.com"],
      }),
    ).rejects.toThrow(/simulated per-op delete failure/);

    // The failed op must not have deleted its doc.
    expect(store._docs.has("office-hours/prod/items/stale-key")).toBe(true);
  });
});

describe("parseJitDueMarker", () => {
  it("parses a well-formed marker", () => {
    const body = "Body text\n\n<!-- jit-due: 2026-01-15T12:00:00Z -->";
    const result = parseJitDueMarker(body);
    expect(result?.toISOString()).toBe("2026-01-15T12:00:00.000Z");
  });

  it("tolerates extra whitespace inside the marker", () => {
    const body = "<!--   jit-due:   2026-02-01T00:00:00Z   -->";
    const result = parseJitDueMarker(body);
    expect(result?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("returns null when no marker is present", () => {
    expect(parseJitDueMarker("Plain body, no marker.")).toBeNull();
  });

  it("returns null when the marker is malformed", () => {
    expect(parseJitDueMarker("<!-- jit-due: not-a-date -->")).toBeNull();
  });
});

describe("fetchOpenJitIssuesLive", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts a GraphQL query and returns jit-labelled issues with parsed due times", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(""),
      json: () =>
        Promise.resolve({
          data: {
            repository: {
              issues: {
                pageInfo: { endCursor: null, hasNextPage: false },
                nodes: [
                  {
                    number: 42,
                    title: "Daily chore",
                    body:
                      "Body text\n\n<!-- jit-due: 2026-01-15T12:00:00Z -->",
                    labels: {
                      nodes: [{ name: "jit:daily-chore" }, { name: "help wanted" }],
                    },
                  },
                  {
                    number: 50,
                    title: "Old jit issue without a marker",
                    body: "Just the body, no marker yet.",
                    labels: { nodes: [{ name: "jit:legacy" }] },
                  },
                  {
                    number: 43,
                    title: "Non-jit issue",
                    body: "Body",
                    labels: { nodes: [{ name: "bug" }] },
                  },
                ],
              },
            },
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const issues = await fetchOpenJitIssuesLive("natb1/office-hours-nate", "test-token");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/graphql");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("bearer test-token");
    expect(headers["User-Agent"]).toBe("office-hours-sync/1.0");
    expect(headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body as string) as {
      query: string;
      variables: { owner: string; name: string; cursor: string | null };
    };
    expect(body.query).toContain("repository(owner: $owner, name: $name)");
    expect(body.variables).toEqual({
      owner: "natb1",
      name: "office-hours-nate",
      cursor: null,
    });

    expect(issues).toHaveLength(2);
    expect(issues[0]).toMatchObject({
      number: 42,
      title: "Daily chore",
      jitKey: "daily-chore",
      repo: "natb1/office-hours-nate",
    });
    expect(issues[0].dueAt?.toISOString()).toBe("2026-01-15T12:00:00.000Z");
    expect(issues[1]).toMatchObject({
      number: 50,
      jitKey: "legacy",
      dueAt: null,
    });
  });

  it("throws when the fetch returns non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("server error"),
        json: () => Promise.resolve({}),
      }),
    );

    await expect(
      fetchOpenJitIssuesLive("natb1/office-hours-nate", "test-token"),
    ).rejects.toThrow(/500/);
  });

  it("throws when the GraphQL response carries errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
        json: () =>
          Promise.resolve({
            errors: [{ message: "Bad credentials" }],
          }),
      }),
    );

    await expect(
      fetchOpenJitIssuesLive("natb1/office-hours-nate", "test-token"),
    ).rejects.toThrow(/Bad credentials/);
  });

  it("follows pagination and collects issues from multiple pages", async () => {
    const page1 = {
      data: {
        repository: {
          issues: {
            pageInfo: { endCursor: "cursor-abc", hasNextPage: true },
            nodes: [
              {
                number: 1,
                title: "Page 1 issue",
                body: "<!-- jit-due: 2026-01-15T12:00:00Z -->",
                labels: { nodes: [{ name: "jit:page1-key" }] },
              },
            ],
          },
        },
      },
    };
    const page2 = {
      data: {
        repository: {
          issues: {
            pageInfo: { endCursor: null, hasNextPage: false },
            nodes: [
              {
                number: 2,
                title: "Page 2 issue",
                body: "<!-- jit-due: 2026-02-01T00:00:00Z -->",
                labels: { nodes: [{ name: "jit:page2-key" }] },
              },
            ],
          },
        },
      },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
        json: () => Promise.resolve(page1),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
        json: () => Promise.resolve(page2),
      });
    vi.stubGlobal("fetch", fetchMock);

    const issues = await fetchOpenJitIssuesLive("natb1/office-hours-nate", "test-token");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Second call must forward the cursor from the first page.
    const secondCall = fetchMock.mock.calls[1] as [string, RequestInit];
    const secondBody = JSON.parse(secondCall[1].body as string) as {
      variables: { cursor: string | null };
    };
    expect(secondBody.variables.cursor).toBe("cursor-abc");

    expect(issues).toHaveLength(2);
    expect(issues[0].jitKey).toBe("page1-key");
    expect(issues[1].jitKey).toBe("page2-key");
  });

  it("stops pagination when hasNextPage is true but endCursor is null", async () => {
    // A malformed GitHub response with hasNextPage=true but null endCursor should
    // not loop infinitely — the guard should stop after the first page.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(""),
      json: () =>
        Promise.resolve({
          data: {
            repository: {
              issues: {
                pageInfo: { endCursor: null, hasNextPage: true },
                nodes: [
                  {
                    number: 10,
                    title: "Issue on only page",
                    body: "<!-- jit-due: 2026-03-01T00:00:00Z -->",
                    labels: { nodes: [{ name: "jit:solo-key" }] },
                  },
                ],
              },
            },
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const issues = await fetchOpenJitIssuesLive("natb1/office-hours-nate", "test-token");

    // Must not loop — one fetch only.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(issues).toHaveLength(1);
    expect(issues[0].jitKey).toBe("solo-key");
  });
});

describe("buildAppJwt", () => {
  it("produces an RS256 JWT signed by the App private key with the expected claims", () => {
    const nowMs = 1_700_000_000_000;
    const jwt = buildAppJwt("123456", testKeyPair.privateKey, nowMs);

    const [header, payload, signature] = jwt.split(".");
    expect(header).toBeTruthy();
    expect(payload).toBeTruthy();
    expect(signature).toBeTruthy();

    expect(decodeJwtPart(header)).toEqual({ alg: "RS256", typ: "JWT" });

    const claims = decodeJwtPart(payload) as {
      iat: number;
      exp: number;
      iss: string;
    };
    const expectedIat = Math.floor(nowMs / 1000) - 60;
    expect(claims.iss).toBe("123456");
    expect(claims.iat).toBe(expectedIat);
    expect(claims.exp).toBe(expectedIat + 9 * 60);

    const verified = createVerify("RSA-SHA256")
      .update(`${header}.${payload}`)
      .verify(testKeyPair.publicKey, Buffer.from(signature, "base64url"));
    expect(verified).toBe(true);
  });
});

describe("mintInstallationToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exchanges an App JWT for an installation token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: () => Promise.resolve(""),
      json: () => Promise.resolve({ token: "ghs_installationtoken" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const token = await mintInstallationToken({
      appId: "123456",
      installationId: "87654321",
      privateKey: testKeyPair.privateKey,
      nowMs: 1_700_000_000_000,
    });

    expect(token).toBe("ghs_installationtoken");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.github.com/app/installations/87654321/access_tokens",
    );
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Bearer .+\..+\..+$/);
    expect(headers.Accept).toBe("application/vnd.github+json");
    expect(headers["User-Agent"]).toBe("office-hours-sync/1.0");
  });

  it("throws when the token exchange returns non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Bad credentials"),
        json: () => Promise.resolve({}),
      }),
    );

    await expect(
      mintInstallationToken({
        appId: "123456",
        installationId: "87654321",
        privateKey: testKeyPair.privateKey,
      }),
    ).rejects.toThrow(/401/);
  });

  it("throws when the token exchange response omits the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        text: () => Promise.resolve(""),
        json: () => Promise.resolve({}),
      }),
    );

    await expect(
      mintInstallationToken({
        appId: "123456",
        installationId: "87654321",
        privateKey: testKeyPair.privateKey,
      }),
    ).rejects.toThrow(/missing token/);
  });
});
