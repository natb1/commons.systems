import DOMPurify from "dompurify";
import { marked } from "marked";
import { escapeHtml } from "../escape-html.js";
import { fetchPost } from "../github.js";
import type { PostMeta } from "../firestore.js";

const SCROLL_PADDING_PX = 16;

// Strip raw HTML from markdown to prevent XSS from post file content.
marked.use({ renderer: { html: () => "" } });

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function renderArticle(p: PostMeta): string {
  const safeId = escapeHtml(p.id);
  const dateHtml = p.publishedAt
    ? `<time datetime="${escapeHtml(p.publishedAt)}">${escapeHtml(formatDate(p.publishedAt))}</time>`
    : "";
  const draftBadge = p.published
    ? ""
    : ` <span class="draft-badge">[draft]</span>`;
  const linkHtml =
    `<a href="#/post/${safeId}" class="post-link">` +
    `<span class="link-icon" aria-hidden="true">&#x1F517; </span><span class="post-title">${escapeHtml(p.title)}</span></a>`;
  return `<article id="post-${safeId}">
        <h2>${linkHtml}${draftBadge}</h2>
        ${dateHtml}
        <div id="post-content-${safeId}"><p>Loading...</p></div>
      </article>`;
}

export function renderHomeHtml(posts: PostMeta[]): string {
  if (posts.length === 0) {
    return `
    <h2>Home</h2>
    <p>No posts yet.</p>
  `;
  }

  const articles = posts.map(renderArticle).join("\n      <hr>\n      ");

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
  if (!container) {
    console.error("hydrateHome: #posts container not found");
    return;
  }

  const fetches = posts.map(async (post) => {
    const contentDiv = outlet.querySelector<HTMLElement>(
      `#post-content-${CSS.escape(post.id)}`,
    );
    if (!contentDiv) return;

    try {
      let markdown = await fetchPost(post.filename);

      // If the markdown starts with an h1, use it as the post title (overriding
      // the Firestore title) and strip it from the body to avoid duplication.
      const h1Match = markdown.match(/^#\s+(.+)/);
      if (h1Match) {
        markdown = markdown.replace(/^#\s+.+\n?/, "");
        const titleSpan = outlet.querySelector<HTMLElement>(
          `#post-${CSS.escape(post.id)} h2 .post-title`,
        );
        if (titleSpan) {
          titleSpan.textContent = h1Match[1];
        }
      }

      const html = await marked.parse(markdown);
      if (!outlet.contains(container)) return;
      contentDiv.innerHTML = DOMPurify.sanitize(html);
    } catch (error) {
      console.error(`Failed to load post "${post.id}":`, error);
      if (!outlet.contains(container)) return;
      contentDiv.innerHTML = "<p>Could not load post content. Try refreshing.</p>";
    }
  });

  if (scrollTo) {
    void Promise.allSettled(fetches).then(() => {
      if (!outlet.contains(container)) return;
      const article = outlet.querySelector(`#post-${CSS.escape(scrollTo)}`);
      if (article) {
        const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
        const y = article.getBoundingClientRect().top + window.scrollY - headerHeight - SCROLL_PADDING_PX;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    });
  }
}
