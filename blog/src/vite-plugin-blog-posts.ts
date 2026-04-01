import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { PublishedPost } from "./post-types.js";
import type { PostContent } from "./pages/home.js";
import { createMarked, extractH1 } from "./marked-config.ts";

export type { PostContent };

export interface BlogPostsPluginConfig {
  seed: Pick<SeedSpec, "collections">;
  postDir: string;
  /** Override file reader for testing. Defaults to `readFileSync(path, "utf-8")`. */
  readFile?: (path: string) => string;
}

const CONTENT_MODULE_ID = "virtual:blog-post-content";
const RESOLVED_CONTENT_ID = "\0" + CONTENT_MODULE_ID;
const METADATA_MODULE_ID = "virtual:blog-post-metadata";
const RESOLVED_METADATA_ID = "\0" + METADATA_MODULE_ID;

/** Vite plugin that reads seed data and markdown at build time, producing virtual modules with pre-rendered HTML and metadata for published blog posts. */
export function blogPostsPlugin(config: BlogPostsPluginConfig): Plugin {
  const readFile = config.readFile ?? ((path: string) => readFileSync(path, "utf-8"));
  let contentMap: Record<string, PostContent> = {};
  let metadata: PublishedPost[] = [];

  return {
    name: "blog-posts",
    async buildStart() {
      const marked = createMarked();
      const postsCollection = config.seed.collections.find(
        (c) => c.name === "posts",
      );
      if (!postsCollection) {
        throw new Error("[blog-posts] No 'posts' collection found in seed data");
      }

      const published: PublishedPost[] = [];
      for (const doc of postsCollection.documents) {
        const data = doc.data as Record<string, unknown>;
        if (data.published !== true) continue;
        if (typeof data.title !== "string") {
          throw new Error(`[blog-posts] Post "${doc.id}" is missing a title`);
        }
        if (typeof data.filename !== "string") {
          throw new Error(`[blog-posts] Post "${doc.id}" is missing a filename`);
        }
        if (typeof data.publishedAt !== "string") {
          throw new Error(`[blog-posts] Post "${doc.id}" is missing a publishedAt`);
        }
        published.push({
          id: doc.id,
          title: data.title,
          published: true,
          publishedAt: data.publishedAt,
          filename: data.filename,
          previewImage: data.previewImage as string | undefined,
          previewDescription: data.previewDescription as string | undefined,
        });
      }

      published.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      metadata = published;

      const results: Record<string, PostContent> = {};
      for (const post of published) {
        const filePath = join(config.postDir, post.filename);
        const markdown = readFile(filePath);

        const h1 = extractH1(markdown);
        const title = h1 ? h1.title : null;
        const body = h1 ? h1.body : markdown;

        const html = await marked.parse(body);
        results[post.id] = { html, title };
      }

      contentMap = results;
    },
    resolveId(id) {
      if (id === CONTENT_MODULE_ID) return RESOLVED_CONTENT_ID;
      if (id === METADATA_MODULE_ID) return RESOLVED_METADATA_ID;
    },
    load(id) {
      if (id === RESOLVED_CONTENT_ID) {
        return `export default ${JSON.stringify(contentMap)};`;
      }
      if (id === RESOLVED_METADATA_ID) {
        return `export default ${JSON.stringify(metadata)};`;
      }
    },
  };
}
