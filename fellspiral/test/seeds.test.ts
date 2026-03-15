import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import appSeed from "../seeds/firestore";
import type { PostSeedData } from "../seeds/firestore";

const postDir = path.resolve(__dirname, "../post");

describe("seed/post sync", () => {
  const postsCollection = appSeed.collections.find((c) => c.name === "posts");
  if (!postsCollection) {
    throw new Error("No 'posts' collection found in seed data");
  }
  const seedIds = postsCollection.documents.map((d) => d.id);
  const mdFiles = fs
    .readdirSync(postDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  it("each seed post has a matching .md file", () => {
    const missing = seedIds.filter((id) => !mdFiles.includes(id));
    expect(missing, `seed entries without .md files: ${missing.join(", ")}`).toEqual([]);
  });

  it("each .md file has a matching seed entry", () => {
    const missing = mdFiles.filter((f) => !seedIds.includes(f));
    expect(missing, `.md files without seed entries: ${missing.join(", ")}`).toEqual([]);
  });

  it("disciplinary-review-operations has correct metadata", () => {
    const doc = postsCollection.documents.find((d) => d.id === "disciplinary-review-operations");
    expect(doc).toBeDefined();
    expect(doc!.data).toMatchObject({
      publishedAt: "2026-03-14T00:00:00Z",
      previewImage: "/alienurn.jpg",
    });
    expect((doc!.data as PostSeedData).previewDescription).toContain("Sassy Diaz");
  });

  it("scenes-from-a-hat has updated publication date", () => {
    const doc = postsCollection.documents.find((d) => d.id === "scenes-from-a-hat");
    expect(doc).toBeDefined();
    expect(doc!.data).toMatchObject({
      publishedAt: "2026-03-15T00:00:00Z",
    });
  });
});
