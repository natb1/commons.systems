import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { PublishedPost } from "./post-types.js";
import { createMarked, getPublishedFromSeed, renderPostContents, type PostContent } from "./marked-config.js";

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
      const published = getPublishedFromSeed(config.seed, "[blog-posts] ");

      published.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      metadata = published;

      contentMap = await renderPostContents(
        published,
        (filename) => readFile(join(config.postDir, filename)),
        marked,
      );
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
