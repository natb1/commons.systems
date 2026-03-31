import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked } from "marked";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { Plugin } from "vite";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { PublishedPost } from "./post-types.js";

export interface BlogPostsPluginConfig {
  seed: Pick<SeedSpec, "collections">;
  postDir: string;
  /** Override file reader for testing. Defaults to `readFileSync(path, "utf-8")`. */
  readFile?: (path: string) => string;
}

export interface PostContent {
  html: string;
  title: string | null;
}

const CONTENT_MODULE_ID = "virtual:blog-post-content";
const RESOLVED_CONTENT_ID = "\0" + CONTENT_MODULE_ID;
const METADATA_MODULE_ID = "virtual:blog-post-metadata";
const RESOLVED_METADATA_ID = "\0" + METADATA_MODULE_ID;

export function blogPostsPlugin(config: BlogPostsPluginConfig): Plugin {
  const readFile = config.readFile ?? ((path: string) => readFileSync(path, "utf-8"));
  let contentMap: Record<string, PostContent> = {};
  let metadata: PublishedPost[] = [];

  return {
    name: "blog-posts",
    async buildStart() {
      const marked = new Marked({
        renderer: {
          html: () => "",
          link({ href, text, title }) {
            const safeHref = escapeHtml(href);
            const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
            return `<a href="${safeHref}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
          },
        },
      });
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
        published.push({
          id: doc.id,
          title: data.title as string,
          published: true,
          publishedAt: data.publishedAt as string,
          filename: data.filename as string,
          previewImage: data.previewImage as string | undefined,
          previewDescription: data.previewDescription as string | undefined,
        });
      }

      published.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      metadata = published;

      const results: Record<string, PostContent> = {};
      for (const post of published) {
        const filePath = join(config.postDir, post.filename);
        let markdown = readFile(filePath);

        const h1Match = markdown.match(/^#\s+(.+)/);
        let title: string | null = null;
        if (h1Match) {
          title = h1Match[1];
          markdown = markdown.replace(/^#\s+.+\n?/, "");
        }

        const html = await marked.parse(markdown);
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
