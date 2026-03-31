import DOMPurify from "dompurify";
import { escapeHtml } from "@commons-systems/htmlutil";
import { formatUtcDate } from "../date.js";
import { createMarked } from "../marked-config.js";
import { isOutletCurrent } from "@commons-systems/router/hydrate";
import type { PostMeta } from "../post-types.js";

export interface PostContent {
  html: string;
  title: string | null;
}

const SCROLL_PADDING_PX = 16;

const marked = createMarked();

function renderArticle(p: PostMeta, postLinkPrefix: string, content?: PostContent): string {
  const safeId = escapeHtml(p.id);
  const displayTitle = content?.title ?? p.title;
  const dateHtml = p.publishedAt
    ? `<time datetime="${escapeHtml(p.publishedAt)}">${escapeHtml(formatUtcDate(p.publishedAt))}</time>`
    : "";
  const draftBadge = p.published
    ? ""
    : ` <span class="draft-badge">[draft]</span>`;
  const linkHtml =
    `<a href="${postLinkPrefix}${safeId}" class="post-link">` +
    `<span class="link-icon" aria-hidden="true">&#x1F517; </span><span class="post-title">${escapeHtml(displayTitle)}</span></a>`;
  const contentHtml = content
    ? `<div id="post-content-${safeId}" data-hydrated>${content.html}</div>`
    : `<div id="post-content-${safeId}"><p>Loading...</p></div>`;
  return `<article id="post-${safeId}">
        <h2>${linkHtml}${draftBadge}</h2>
        ${dateHtml}
        ${contentHtml}
      </article>`;
}

export function renderHomeHtml(
  posts: PostMeta[],
  postLinkPrefix = "/post/",
  contentMap?: Record<string, PostContent>,
): string {
  if (posts.length === 0) {
    return `
    <h2>Home</h2>
    <p>No posts yet.</p>
  `;
  }

  const articles = posts
    .map((p) => renderArticle(p, postLinkPrefix, contentMap?.[p.id]))
    .join("\n      <hr>\n      ");

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
    if (contentDiv.hasAttribute("data-hydrated")) return;

    try {
      let markdown = await fetchPost(post.filename);
      if (!isOutletCurrent(outlet, container)) return;

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
      if (!isOutletCurrent(outlet, container)) return;
      // DOMPurify strips target attributes by default; ADD_ATTR preserves the
      // target="_blank" set by the custom link renderer above.
      contentDiv.innerHTML = DOMPurify.sanitize(html, {
        ADD_ATTR: ["target"],
      });
    } catch (error) {
      reportError(new Error(`Failed to load post "${post.id}": ${error instanceof Error ? error.message : error}`));
      if (!isOutletCurrent(outlet, container)) return;
      contentDiv.innerHTML = "<p>Could not load post content. Try refreshing.</p>";
    }
  });

  if (scrollTo) {
    void Promise.allSettled(fetches).then(() => {
      if (!isOutletCurrent(outlet, container)) return;
      const article = outlet.querySelector(`#post-${CSS.escape(scrollTo)}`);
      if (article) {
        const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
        const y = article.getBoundingClientRect().top + window.scrollY - headerHeight - SCROLL_PADDING_PX;
        window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
      }
    });
  }
}
