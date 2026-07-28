import { describe, it, expect } from "vitest";

import {
  ghGraphql,
  ghRest,
  searchIssueCount,
  searchIssueDetails,
  fetchOpenJitIssues,
  fetchGithub,
  createGhFetchers,
  type GhRunner,
  type GhRunResult,
} from "./gh-fetchers.js";

/**
 * A canned-stdout mock runner that records every argv it was invoked with.
 * `responses` is consumed in order (one per call); a function entry lets a test
 * branch on the argv (used for the paginated jit fetch + multi-endpoint github).
 */
function mockRunner(
  responses: Array<GhRunResult | ((args: string[]) => GhRunResult | Promise<GhRunResult>)>,
): { run: GhRunner; calls: string[][] } {
  const calls: string[][] = [];
  let i = 0;
  const run: GhRunner = async (args) => {
    calls.push(args);
    const next = responses[i++];
    if (next === undefined) {
      throw new Error(`mockRunner: unexpected extra gh call: ${args.join(" ")}`);
    }
    return typeof next === "function" ? next(args) : next;
  };
  return { run, calls };
}

function ok(stdout: string): GhRunResult {
  return { stdout, stderr: "" };
}

describe("ghGraphql", () => {
  it("constructs `api graphql` argv with the document and bound variables", async () => {
    const { run, calls } = mockRunner([ok(JSON.stringify({ data: { ok: true } }))]);
    const data = await ghGraphql<{ ok: boolean }>("query { x }", { a: "1", b: "two" }, run);

    expect(data).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      "api",
      "graphql",
      "-f",
      "query=query { x }",
      "-f",
      "a=1",
      "-f",
      "b=two",
    ]);
  });

  it("throws on a GraphQL errors payload (no silent fallback)", async () => {
    const { run } = mockRunner([
      ok(JSON.stringify({ errors: [{ message: "bad query" }] })),
    ]);
    await expect(ghGraphql("query { x }", {}, run)).rejects.toThrow(/GitHub GraphQL errors: bad query/);
  });

  it("throws when data is missing", async () => {
    const { run } = mockRunner([ok(JSON.stringify({}))]);
    await expect(ghGraphql("query { x }", {}, run)).rejects.toThrow(/missing data/);
  });

  it("throws on invalid JSON stdout", async () => {
    const { run } = mockRunner([ok("not json")]);
    await expect(ghGraphql("query { x }", {}, run)).rejects.toThrow(/invalid JSON/);
  });

  it("propagates a non-zero gh exit (runner rejection)", async () => {
    const run: GhRunner = async () => {
      throw new Error("gh api graphql failed: exit 1\nHTTP 401");
    };
    await expect(ghGraphql("query { x }", {}, run)).rejects.toThrow(/exit 1/);
  });
});

describe("ghRest", () => {
  it("constructs `api <path>` argv and parses the body", async () => {
    const { run, calls } = mockRunner([ok(JSON.stringify({ stargazers_count: 5 }))]);
    const json = await ghRest<{ stargazers_count: number }>("repos/o/r", run);

    expect(json).toEqual({ stargazers_count: 5 });
    expect(calls[0]).toEqual(["api", "repos/o/r"]);
  });

  it("throws on invalid JSON", async () => {
    const { run } = mockRunner([ok("<html>403</html>")]);
    await expect(ghRest("repos/o/r", run)).rejects.toThrow(/invalid JSON/);
  });

  it("propagates a non-zero gh exit", async () => {
    const run: GhRunner = async () => {
      throw new Error("gh api repos/o/r failed: exit 1\nHTTP 404");
    };
    await expect(ghRest("repos/o/r", run)).rejects.toThrow(/exit 1/);
  });
});

describe("searchIssueCount", () => {
  it("renames $query→$searchQuery and returns the count (searchIssueCountLive shape)", async () => {
    const { run, calls } = mockRunner([
      ok(JSON.stringify({ data: { search: { issueCount: 42 } } })),
    ]);
    const count = await searchIssueCount('repo:o/r is:issue is:open label:"help wanted"', run);

    expect(count).toBe(42);
    // gh's reserved `query` field carries the DOCUMENT; the search string is
    // bound to the renamed `searchQuery` variable.
    expect(calls[0][0]).toBe("api");
    expect(calls[0][1]).toBe("graphql");
    expect(calls[0][2]).toBe("-f");
    const docArg = calls[0][3]; // "query=<document>"
    expect(docArg.startsWith("query=")).toBe(true);
    expect(docArg).toContain("$searchQuery: String!"); // type-safety-ok: false positive — '!' is a GraphQL non-null type marker inside a string literal, not a TS assertion
    expect(docArg).toContain("issueCount");
    expect(docArg).not.toContain("$query:");
    expect(calls[0]).toContain('searchQuery=repo:o/r is:issue is:open label:"help wanted"');
  });

  it("preserves an `=` inside the search-query value (gh -f splits on the FIRST =)", async () => {
    // buildQueueSearchQueries emits `created:>=<cutoff>` / `closed:>=<cutoff>`;
    // gh's `-f name=value` splits on the first `=` only, so the `>=2026-06-16`
    // portion must survive untouched in the bound variable.
    const { run, calls } = mockRunner([
      ok(JSON.stringify({ data: { search: { issueCount: 3 } } })),
    ]);
    const q = 'repo:o/r is:issue label:"help wanted" created:>=2026-06-16';
    const count = await searchIssueCount(q, run);

    expect(count).toBe(3);
    expect(calls[0]).toContain(`searchQuery=${q}`);
  });
});

describe("searchIssueDetails", () => {
  it("maps nodes to ParkedIssue (createdAt Date + best-effort phase), like searchIssueDetailsLive", async () => {
    const { run, calls } = mockRunner([
      ok(
        JSON.stringify({
          data: {
            search: {
              nodes: [
                {
                  number: 100,
                  title: "Parked thing",
                  url: "https://github.com/o/r/issues/100",
                  createdAt: "2026-06-20T00:00:00.000Z",
                  labels: {
                    nodes: [
                      { name: "dispatch:office-hours" },
                      { name: "dispatch:review" },
                    ],
                  },
                  repository: { nameWithOwner: "o/r" },
                },
                {
                  number: 101,
                  title: "No phase",
                  url: "https://github.com/o/r/issues/101",
                  createdAt: "2026-06-21T00:00:00.000Z",
                  labels: { nodes: [{ name: "dispatch:office-hours" }] },
                  repository: { nameWithOwner: "o/r" },
                },
              ],
            },
          },
        }),
      ),
    ]);

    const parked = await searchIssueDetails(
      'repo:o/r is:issue is:open label:"dispatch:office-hours"',
      run,
    );

    expect(parked).toHaveLength(2);
    expect(parked[0].createdAt).toBeInstanceOf(Date);
    expect(parked[0]).toEqual({
      number: 100,
      title: "Parked thing",
      url: "https://github.com/o/r/issues/100",
      createdAt: new Date("2026-06-20T00:00:00.000Z"),
      repo: "o/r",
      phase: "dispatch:review", // first dispatch:* other than dispatch:office-hours
    });
    // phase omitted entirely when no qualifying label
    expect("phase" in parked[1]).toBe(false);
    // document carries first: 100 and the renamed variable
    const doc = calls[0][3];
    expect(doc).toContain("first: 100");
    expect(doc).toContain("$searchQuery: String!"); // type-safety-ok: false positive — '!' is a GraphQL non-null type marker inside a string literal, not a TS assertion
  });
});

describe("fetchOpenJitIssues", () => {
  it("rejects an invalid repo without invoking gh", async () => {
    const { run, calls } = mockRunner([]);
    await expect(fetchOpenJitIssues("noslash", run)).rejects.toThrow(/expected "owner\/name"/);
    expect(calls).toHaveLength(0);
  });

  it("paginates and maps jit issues (fetchOpenJitIssuesLive shape)", async () => {
    const page1 = {
      data: {
        repository: {
          issues: {
            pageInfo: { endCursor: "CURSOR1", hasNextPage: true },
            nodes: [
              {
                number: 1,
                title: "Weekly digest",
                body: "do the digest\n<!-- jit-due: 2026-07-01T12:00:00Z -->",
                labels: { nodes: [{ name: "jit:digest" }] },
              },
              {
                number: 2,
                title: "Not a jit",
                body: "ignore me",
                labels: { nodes: [{ name: "help wanted" }] },
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
                number: 3,
                title: "No due marker",
                body: "no marker here",
                labels: { nodes: [{ name: "jit:budget-review" }] },
              },
            ],
          },
        },
      },
    };

    const { run, calls } = mockRunner([ok(JSON.stringify(page1)), ok(JSON.stringify(page2))]);
    const items = await fetchOpenJitIssues("natb1/office-hours-nate", run);

    // page-1 jit:digest (with due) + page-2 jit:budget-review (no due → dueAt null);
    // the non-jit issue is dropped.
    expect(items).toEqual([
      {
        kind: "reminder",
        number: 1,
        title: "Weekly digest",
        body: "do the digest\n<!-- jit-due: 2026-07-01T12:00:00Z -->",
        jitKey: "digest",
        repo: "natb1/office-hours-nate",
        dueAt: new Date("2026-07-01T12:00:00Z"),
      },
      {
        kind: "reminder",
        number: 3,
        title: "No due marker",
        body: "no marker here",
        jitKey: "budget-review",
        repo: "natb1/office-hours-nate",
        dueAt: null,
      },
    ]);

    // First page omits cursor; second page binds the endCursor.
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("owner=natb1");
    expect(calls[0]).toContain("name=office-hours-nate");
    expect(calls[0].some((a) => a.startsWith("cursor="))).toBe(false);
    expect(calls[1]).toContain("cursor=CURSOR1");
  });
});

describe("fetchGithub", () => {
  const repoBody = JSON.stringify({
    stargazers_count: 5,
    forks_count: 1,
    watchers_count: 2,
  });

  const forksBody = JSON.stringify([
    {
      owner: { login: "forker" },
      html_url: "https://github.com/forker/r",
      created_at: "2026-01-01T00:00:00Z",
      pushed_at: "2026-06-01T00:00:00Z",
      stargazers_count: 3,
    },
  ]);
  const forksDetail = [
    {
      owner: "forker",
      repoUrl: "https://github.com/forker/r",
      createdAt: "2026-01-01T00:00:00Z",
      pushedAt: "2026-06-01T00:00:00Z",
      stars: 3,
    },
  ];

  it("returns stats + forksDetail + traffic when all endpoints succeed (fetchGithub*Live shape)", async () => {
    // Call order: stats (repos/o/r), then the forks list, then Promise.all
    // dispatches the three traffic endpoints in array order: clones, views,
    // popular/referrers.
    const { run, calls } = mockRunner([
      ok(repoBody),
      ok(forksBody),
      ok(JSON.stringify({ count: 10, uniques: 4 })),
      ok(JSON.stringify({ count: 100, uniques: 40 })),
      ok(JSON.stringify([{ referrer: "google.com", count: 9, uniques: 3 }])),
    ]);

    const signals = await fetchGithub("o/r", run);
    expect(signals).toEqual({
      repo: "o/r",
      stars: 5,
      forks: 1,
      watchers: 2,
      forksDetail,
      traffic: {
        clonesCount: 10,
        clonesUniques: 4,
        viewsCount: 100,
        viewsUniques: 40,
        topReferrers: [{ referrer: "google.com", count: 9, uniques: 3 }],
      },
    });
    expect(calls[0]).toEqual(["api", "repos/o/r"]);
    expect(calls[1]).toEqual(["api", "repos/o/r/forks?sort=newest&per_page=100"]);
  });

  it("omits traffic when a traffic endpoint 403s, keeping public stats + forksDetail", async () => {
    const { run } = mockRunner([
      ok(repoBody),
      ok(forksBody),
      // clones endpoint fails (e.g. 403) → traffic omitted, stats kept
      () => {
        throw new Error("gh api repos/o/r/traffic/clones failed: exit 1\nHTTP 403");
      },
      // the parallel views/referrers may or may not run; provide tolerant stubs
      () => ok(JSON.stringify({ count: 0, uniques: 0 })),
      () => ok(JSON.stringify([])),
    ]);

    const signals = await fetchGithub("o/r", run);
    expect(signals).toEqual({ repo: "o/r", stars: 5, forks: 1, watchers: 2, forksDetail });
    expect("traffic" in signals).toBe(false);
  });

  it("omits forksDetail when the forks endpoint errors, keeping stats + traffic", async () => {
    const { run } = mockRunner([
      ok(repoBody),
      // forks endpoint fails → forksDetail omitted, everything else kept
      () => {
        throw new Error("gh api repos/o/r/forks failed: exit 1\nHTTP 403");
      },
      ok(JSON.stringify({ count: 10, uniques: 4 })),
      ok(JSON.stringify({ count: 100, uniques: 40 })),
      ok(JSON.stringify([{ referrer: "google.com", count: 9, uniques: 3 }])),
    ]);

    const signals = await fetchGithub("o/r", run);
    expect("forksDetail" in signals).toBe(false);
    expect(signals).toEqual({
      repo: "o/r",
      stars: 5,
      forks: 1,
      watchers: 2,
      traffic: {
        clonesCount: 10,
        clonesUniques: 4,
        viewsCount: 100,
        viewsUniques: 40,
        topReferrers: [{ referrer: "google.com", count: 9, uniques: 3 }],
      },
    });
  });
});

describe("createGhFetchers", () => {
  it("returns count/details fetchers always; gates repo-bound fetchers to null when unconfigured", () => {
    const { run } = mockRunner([]);
    const fetchers = createGhFetchers({}, run);
    expect(typeof fetchers.searchIssueCount).toBe("function");
    expect(typeof fetchers.searchIssueDetails).toBe("function");
    expect(fetchers.fetchOpenJitIssues).toBeNull();
    expect(fetchers.fetchGithub).toBeNull();
  });

  it("binds repo-config fetchers and routes through the injected runner", async () => {
    const { run, calls } = mockRunner([
      ok(JSON.stringify({ data: { search: { issueCount: 7 } } })),
    ]);
    const fetchers = createGhFetchers(
      { groupRepo: "natb1/office-hours-nate", githubRepo: "o/r" },
      run,
    );
    expect(typeof fetchers.fetchOpenJitIssues).toBe("function");
    expect(typeof fetchers.fetchGithub).toBe("function");

    const count = await fetchers.searchIssueCount("repo:o/r is:issue");
    expect(count).toBe(7);
    expect(calls[0][0]).toBe("api");
  });
});
