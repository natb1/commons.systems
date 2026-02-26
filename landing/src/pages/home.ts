import { marked } from "marked";
import { escapeHtml } from "../escape-html.js";
import { fetchPost } from "../github.js";
import type { PostMeta } from "../firestore.js";

export function renderHomeHtml(posts: PostMeta[]): string {
  if (posts.length === 0) {
    return `
    <h2>Home</h2>
    <p>No posts yet.</p>
  `;
  }

  const articles = posts
    .map((p) => {
      const dateHtml = p.publishedAt
        ? `<time datetime="${escapeHtml(p.publishedAt)}">${escapeHtml(
            new Date(p.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
          )}</time>`
        : "";
      const draft = !p.published
        ? ` <span class="draft-badge">[draft]</span>`
        : "";
      return `<article id="post-${escapeHtml(p.id)}">
        <h2><a href="#/post/${escapeHtml(p.id)}" class="post-link">${escapeHtml(p.title)}<span class="link-icon" aria-hidden="true"> &#x1F517;</span></a>${draft}</h2>
        ${dateHtml}
        <div id="post-content-${escapeHtml(p.id)}"><p>Loading...</p></div>
      </article>`;
    })
    .join("\n      ");

  return `
    <div id="posts">
      ${articles}
    </div>
  `;
}

export function hydrateHome(
  outlet: HTMLElement,
  posts: PostMeta[],
  scrollTo?: string,
): void {
  const container = outlet.querySelector("#posts");
  if (!container) return;

  for (const post of posts) {
    const contentDiv = outlet.querySelector<HTMLElement>(
      `#post-content-${post.id}`,
    );
    if (!contentDiv) continue;

    void (async () => {
      try {
        const markdown = await fetchPost(post.filename);
        const html = await marked.parse(markdown);
        if (!outlet.contains(container)) return;
        contentDiv.innerHTML = html;
      } catch {
        if (!outlet.contains(container)) return;
        contentDiv.innerHTML = "<p>Could not load post content.</p>";
      }

      if (scrollTo === post.id) {
        const article = outlet.querySelector(`#post-${post.id}`);
        article?.scrollIntoView({ behavior: "smooth" });
      }
    })();
  }
}
