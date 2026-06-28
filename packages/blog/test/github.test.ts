import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function makeFetchMock(ok: boolean, text: string, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(text),
  });
}

describe("fetchPost (default branch = main)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("calls fetch with a URL containing main/<appPath>/<filename>", async () => {
    const mockFetch = makeFetchMock(true, "# Hello World");
    vi.stubGlobal("fetch", mockFetch);

    const { fetchPost } = await import("../src/github");

    await fetchPost("landing/post", "hello-world.md");

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("main/landing/post/hello-world.md");
  });

  it("returns the response text on success", async () => {
    const content = "# Hello World\n\nThis is a post.";
    vi.stubGlobal("fetch", makeFetchMock(true, content));

    const { fetchPost } = await import("../src/github");

    const result = await fetchPost("landing/post", "hello-world.md");

    expect(result).toBe(content);
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal("fetch", makeFetchMock(false, "", 404));

    const { fetchPost } = await import("../src/github");

    await expect(fetchPost("landing/post", "missing.md")).rejects.toThrow("404");
  });

  it("throws with the filename in the error message", async () => {
    vi.stubGlobal("fetch", makeFetchMock(false, "", 404));

    const { fetchPost } = await import("../src/github");

    await expect(fetchPost("landing/post", "missing.md")).rejects.toThrow("missing.md");
  });
});

describe("fetchPost caching", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns cached result on second call without re-fetching", async () => {
    const mockFetch = makeFetchMock(true, "# Cached Content");
    vi.stubGlobal("fetch", mockFetch);

    const { fetchPost } = await import("../src/github");

    await fetchPost("landing/post", "cached.md");
    await fetchPost("landing/post", "cached.md");

    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("caches separately per appPath", async () => {
    const mockFetch = makeFetchMock(true, "# Content");
    vi.stubGlobal("fetch", mockFetch);

    const { fetchPost } = await import("../src/github");

    await fetchPost("landing/post", "shared.md");
    await fetchPost("fellspiral/post", "shared.md");

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("fetchPost (custom branch via VITE_GITHUB_BRANCH)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the branch from VITE_GITHUB_BRANCH env var", async () => {
    vi.stubEnv("VITE_GITHUB_BRANCH", "feature-branch");
    const mockFetch = makeFetchMock(true, "content");
    vi.stubGlobal("fetch", mockFetch);

    const { fetchPost } = await import("../src/github");

    await fetchPost("landing/post", "hello-world.md");

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("feature-branch/landing/post/hello-world.md");
  });
});

describe("createFetchPost", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns a bound fetcher for the given appPath", async () => {
    const mockFetch = makeFetchMock(true, "# Hello");
    vi.stubGlobal("fetch", mockFetch);

    const { createFetchPost } = await import("../src/github");
    const fetch_ = createFetchPost("fellspiral/post");

    await fetch_("hello.md");

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("fellspiral/post/hello.md");
  });
});
