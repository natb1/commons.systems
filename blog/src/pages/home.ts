import DOMPurify from "dompurify";
import { Marked } from "marked";
import { escapeHtml } from "@commons-systems/htmlutil";
import { formatUtcDate } from "../date.js";
import type { PostMeta } from "../post-types.js";

const SCROLL_PADDING_PX = 16;

// Local instance strips raw HTML from markdown (defense-in-depth; DOMPurify sanitizes below).
// Post-body links open in new tabs to keep readers on the blog page; rel="noopener noreferrer"
// prevents reverse tabnapping.
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

function renderArticle(p: PostMeta): string {
  const safeId = escapeHtml(p.id);
  const dateHtml = p.publishedAt
    ? `<time datetime="${escapeHtml(p.publishedAt)}">${escapeHtml(formatUtcDate(p.publishedAt))}</time>`
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
  fetchPost: (filename: string) => Promise<string>,
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
      // DOMPurify strips target attributes by default; ADD_ATTR preserves the
      // target="_blank" set by the custom link renderer above.
      contentDiv.innerHTML = DOMPurify.sanitize(html, {
        ADD_ATTR: ["target"],
      });
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
