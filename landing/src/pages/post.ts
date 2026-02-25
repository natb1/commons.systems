import { marked } from "marked";
import { escapeHtml } from "../escape-html.js";
import { getPostMeta } from "../firestore.js";
import { fetchPost } from "../github.js";

export async function renderPost(slug: string): Promise<string> {
  let meta;
  try {
    meta = await getPostMeta(slug);
  } catch (error) {
    console.error("Failed to load post metadata:", error);
    return `<h2>Post Not Found</h2><p>Could not load post.</p>`;
  }

  if (!meta) {
    return `<h2>Post Not Found</h2><p>The post <em>${escapeHtml(slug)}</em> does not exist.</p>`;
  }

  let content: string;
  try {
    const markdown = await fetchPost(meta.filename);
    content = await marked.parse(markdown);
  } catch (error) {
    console.error("Failed to fetch post content:", error);
    content = "<p>Could not load post content.</p>";
  }

  const dateHtml = meta.publishedAt
    ? `<time datetime="${escapeHtml(meta.publishedAt)}">${escapeHtml(
        new Date(meta.publishedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      )}</time>`
    : "";

  return `
    <article>
      <h2>${escapeHtml(meta.title)}</h2>
      ${dateHtml}
      <div id="post-content">${content}</div>
    </article>
  `;
}
