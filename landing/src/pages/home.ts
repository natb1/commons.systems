import { marked } from "marked";
import { escapeHtml } from "../escape-html.js";
import { fetchPost } from "../github.js";
import type { PostMeta } from "../firestore.js";

marked.use({ renderer: { html: () => "" } });

export function renderHomeHtml(posts: PostMeta[]): string {
  if (posts.length === 0) {
    return `
    <h2>Home</h2>
    <p>No posts yet.</p>
  `;
  }

  const articles = posts
    .map((p) => {
      const safeId = escapeHtml(p.id);
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
      return `<article id="post-${safeId}">
        <h2><a href="#/post/${safeId}" class="post-link"><span class="link-icon" aria-hidden="true">&#x1F517; </span>${escapeHtml(p.title)}</a>${draft}</h2>
        ${dateHtml}
        <div id="post-content-${safeId}"><p>Loading...</p></div>
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

  const fetches = posts.map(async (post) => {
    const contentDiv = outlet.querySelector<HTMLElement>(
      `#post-content-${CSS.escape(post.id)}`,
    );
    if (!contentDiv) return;

    try {
      const markdown = await fetchPost(post.filename);
      const html = await marked.parse(markdown);
      if (!outlet.contains(container)) return;
      contentDiv.innerHTML = html;
    } catch (error) {
      console.error(`Failed to load post "${post.id}":`, error);
      if (!outlet.contains(container)) return;
      contentDiv.innerHTML = "<p>Could not load post content.</p>";
    }
  });

  if (scrollTo) {
    void Promise.allSettled(fetches).then(() => {
      if (!outlet.contains(container)) return;
      const article = outlet.querySelector(`#post-${CSS.escape(scrollTo)}`);
      if (article) {
        const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
        const y = article.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    });
  }
}
