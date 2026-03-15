import { describe, it, expect } from "vitest";
import appSeed from "../seeds/firestore";

describe("prerender seed data", () => {
  it("published post has description for OG tags", () => {
    const posts = appSeed.collections.find((c) => c.name === "posts");
    const published = posts!.documents.find(
      (d) => d.id === "recovering-autonomy-with-coding-agents",
    );
    expect((published!.data as Record<string, unknown>).previewDescription).toBeDefined();
  });

  it("draft post is not published", () => {
    const posts = appSeed.collections.find((c) => c.name === "posts");
    const draft = posts!.documents.find((d) => d.id === "draft-ideas");
    expect((draft!.data as Record<string, unknown>).published).toBe(false);
  });
});
