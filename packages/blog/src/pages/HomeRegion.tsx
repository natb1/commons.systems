import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { logError } from "@commons-systems/errorutil/log";
import { createMarked, extractH1, type PostContent } from "../marked-config.ts";
import type { PostMeta } from "../post-types.ts";
import { EmptyFeed, PostFeed } from "./Home.tsx";

const SCROLL_PADDING_PX = 16;

const marked = createMarked();

export interface HomeRegionProps {
  posts: PostMeta[];
  contentMap?: Record<string, PostContent>;
  postLinkPrefix: string;
  fetchPost: (filename: string) => Promise<string>;
  scrollSlug?: string;
}

/**
 * The home + /post/:slug body, owning the same DOM the legacy imperative
 * renderHomeHtml + hydrateHome pair produced. The JSX delegates verbatim to the
 * frozen presentational components in Home.tsx so the server (react-dom/server)
 * and client (hydrateRoot) initial markup are byte-identical; the effect then
 * reproduces hydrateHome's per-post fetch/parse/sanitize and scroll-to-post
 * behavior, mutating the DOM imperatively (hence suppressHydrationWarning on the
 * post-content divs in Home.tsx).
 *
 * PURE and fully prop-driven: no app state (currentUser, cachedPosts, path) and
 * no router hooks — the slug arrives only via scrollSlug. Refs are used solely
 * for hydration mechanics (mount/cancel guards), never for shared state.
 */
export function HomeRegion({
  posts,
  contentMap,
  postLinkPrefix,
  fetchPost,
  scrollSlug,
}: HomeRegionProps) {
  const mountedRef = useRef(true);

  useEffect(() => {
    // Each dep change runs the cleanup (sets mountedRef false) then re-runs the
    // effect; reset on entry so later runs are not silently skipped. The per-run
    // `cancelled` flag handles cancelling a stale run's writes after props change.
    mountedRef.current = true;
    let cancelled = false;
    const isCurrent = () => mountedRef.current && !cancelled;

    const container = document.querySelector("#posts");
    if (!container) return; // empty feed renders no #posts — legitimate, no error

    // Per-image scroll listeners are registered inside the async scroll branch;
    // collect them here so the cleanup can remove any that were added.
    const imgListeners: { img: HTMLImageElement; handler: () => void }[] = [];

    const fetches = posts.map(async (post) => {
      const contentDiv = container.querySelector<HTMLElement>(
        `#post-content-${CSS.escape(post.id)}`,
      );
      if (!contentDiv) return;
      if (contentDiv.hasAttribute("data-hydrated")) return;

      try {
        const markdown = await fetchPost(post.filename);
        if (!isCurrent()) return;

        const h1 = extractH1(markdown);
        if (h1) {
          const titleSpan = container.querySelector<HTMLElement>(
            `#post-${CSS.escape(post.id)} h2 .post-title`,
          );
          if (titleSpan) {
            titleSpan.textContent = h1.title;
          }
        }

        const html = await marked.parse(h1 ? h1.body : markdown);
        if (!isCurrent()) return;
        // DOMPurify strips attributes not in its default allowlist; ADD_ATTR
        // preserves target="_blank" from the link renderer and
        // fetchpriority/loading from the image renderer in marked-config.ts.
        contentDiv.innerHTML = DOMPurify.sanitize(html, {
          ADD_ATTR: ["target", "fetchpriority", "loading"],
        });
        // Mark the runtime-hydrated content so the guard above short-circuits
        // the re-fetch on the next navigation. Not set on the error branch, so
        // a failed fetch is retried. Mirrors the SSR marker in Home.tsx.
        contentDiv.setAttribute("data-hydrated", "");
      } catch (error) {
        logError(error, { operation: "fetch-post", postId: post.id });
        if (!isCurrent()) return;
        contentDiv.innerHTML = "<p>Could not load post content. Try refreshing.</p>";
      }
    });

    if (scrollSlug) {
      void Promise.allSettled(fetches).then(() => {
        if (!isCurrent()) return;
        const article = container.querySelector(`#post-${CSS.escape(scrollSlug)}`);
        if (!article) return;

        // Images above the target article may still be loading when content is
        // first rendered into the DOM. Each image load shifts layout and
        // invalidates the scroll offset. Rather than computing a one-shot scroll
        // position that becomes stale, re-scroll on every preceding image load or
        // error event so the article stays near the viewport top.
        const doScroll = (): void => {
          if (!isCurrent()) return;
          const headerHeight = document.querySelector("header")?.offsetHeight ?? 0;
          const y =
            article.getBoundingClientRect().top + window.scrollY - headerHeight - SCROLL_PADDING_PX;
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
          imgListeners.push({ img, handler: doScroll });
        }
      });
    }

    return () => {
      mountedRef.current = false;
      cancelled = true;
      for (const { img, handler } of imgListeners) {
        img.removeEventListener("load", handler);
        img.removeEventListener("error", handler);
      }
    };
  }, [posts, contentMap, fetchPost, scrollSlug]);

  if (posts.length === 0) {
    return <EmptyFeed />;
  }

  return <PostFeed posts={posts} postLinkPrefix={postLinkPrefix} contentMap={contentMap} />;
}
