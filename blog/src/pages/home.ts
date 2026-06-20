import { createElement } from "react";
import DOMPurify from "dompurify";
import { renderToStaticMarkup } from "react-dom/server";
import { logError } from "@commons-systems/errorutil/log";
import { createMarked, extractH1, type PostContent } from "../marked-config.ts";
import { isOutletCurrent } from "@commons-systems/router/hydrate";
import type { PostMeta } from "../post-types.ts";
import { EmptyFeed, PostArticle, PostFeed } from "./Home.tsx";

export type { PostContent };

const SCROLL_PADDING_PX = 16;

const marked = createMarked();

// String-returning bridges over the React components in Home.tsx. The driver
// (create-blog-app.ts) and prerender.ts consume these signatures unchanged; the
// imperative hydrator below (hydrateHome) operates on the same ids/classes the
// components emit. This file stays a .ts module (its importers reference
// `./pages/home.ts`), so the components are instantiated via createElement
// rather than JSX, which TypeScript only parses in .tsx files.
export function renderArticle(p: PostMeta, postLinkPrefix: string, content?: PostContent): string {
  return renderToStaticMarkup(
    createElement(PostArticle, { post: p, postLinkPrefix, content }),
  );
}

export function renderHomeHtml(
  posts: PostMeta[],
  postLinkPrefix = "/post/",
  contentMap?: Record<string, PostContent>,
): string {
  if (posts.length === 0) {
    return renderToStaticMarkup(createElement(EmptyFeed));
  }

  return renderToStaticMarkup(
    createElement(PostFeed, { posts, postLinkPrefix, contentMap }),
  );
}

export function hydrateHome(
  outlet: HTMLElement,
  posts: PostMeta[],
  fetchPost: (filename: string) => Promise<string>,
  scrollTo?: string,
): void {
  const container = outlet.querySelector("#posts");
  if (!container) {
    logError(new Error("#posts container not found"), { operation: "hydrate-home" });
    return;
  }

  const fetches = posts.map(async (post) => {
    const contentDiv = outlet.querySelector<HTMLElement>(
      `#post-content-${CSS.escape(post.id)}`,
    );
    if (!contentDiv) return;
    if (contentDiv.hasAttribute("data-hydrated")) return;

    try {
      const markdown = await fetchPost(post.filename);
      if (!isOutletCurrent(outlet, container)) return;

      const h1 = extractH1(markdown);
      if (h1) {
        const titleSpan = outlet.querySelector<HTMLElement>(
          `#post-${CSS.escape(post.id)} h2 .post-title`,
        );
        if (titleSpan) {
          titleSpan.textContent = h1.title;
        }
      }

      const html = await marked.parse(h1 ? h1.body : markdown);
      if (!isOutletCurrent(outlet, container)) return;
      // DOMPurify strips attributes not in its default allowlist; ADD_ATTR preserves
      // target="_blank" from the link renderer and fetchpriority/loading from the
      // image renderer in marked-config.ts.
      contentDiv.innerHTML = DOMPurify.sanitize(html, {
        ADD_ATTR: ["target", "fetchpriority", "loading"],
      });
    } catch (error) {
      logError(error, { operation: "fetch-post", postId: post.id });
      if (!isOutletCurrent(outlet, container)) return;
      contentDiv.innerHTML = "<p>Could not load post content. Try refreshing.</p>";
    }
  });

  if (scrollTo) {
    void Promise.allSettled(fetches).then(() => {
      if (!isOutletCurrent(outlet, container)) return;
      const article = outlet.querySelector(`#post-${CSS.escape(scrollTo)}`);
      if (!article) return;

      // Images above the target article may still be loading when content is
      // first rendered into the DOM. Each image load shifts layout and
      // invalidates the scroll offset. Rather than computing a one-shot scroll
      // position that becomes stale, re-scroll on every preceding image load or
      // error event so the article stays near the viewport top.
      const doScroll = (): void => {
        if (!isOutletCurrent(outlet, container)) return;
        const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
        const y = article.getBoundingClientRect().top + window.scrollY - headerHeight - SCROLL_PADDING_PX;
        window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
      };

      doScroll();

      const imgs = Array.from(container.querySelectorAll("img")).filter(
        (img) =>
          !img.complete &&
          !!(article.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_PRECEDING),
      );
      for (const img of imgs) {
        img.addEventListener("load", doScroll, { once: true });
        img.addEventListener("error", doScroll, { once: true });
      }
    });
  }
}
