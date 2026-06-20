import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { formatUtcDate } from "../date.ts";
import type { PostMeta } from "../post-types.ts";
import type { BlogRollEntry, BlogRollStrategy, LatestPost } from "../blog-roll/types.ts";
import { InfoPanel } from "./InfoPanel.tsx";

export interface LinkSection {
  heading?: string;
  links: { label: string; subtitle?: string; url: string }[];
}

export interface InfoPanelData {
  linkSections: LinkSection[];
  topPosts: PostMeta[];
  blogRoll: BlogRollEntry[];
  rssFeedUrl?: string;
  opmlUrl?: string;
  postLinkPrefix?: string;
  buildTimeFeeds?: Record<string, LatestPost | null>;
}

// String-returning bridge over the React InfoPanel component in InfoPanel.tsx.
// The driver (create-blog-app.ts) and prerender.ts consume this signature
// unchanged; the imperative hydrator below (hydrateInfoPanel) operates on the
// same ids/classes/attrs the component emits. This file stays a .ts module (its
// importers and the ./components/info-panel exports-map entry reference it), so
// the component is instantiated via createElement rather than JSX.
export function renderInfoPanel(data: InfoPanelData): string {
  return renderToStaticMarkup(createElement(InfoPanel, { data }));
}

interface FetchResult {
  entry: BlogRollEntry;
  post: LatestPost | null;
}

function fetchAllLatestPosts(
  blogRoll: BlogRollEntry[],
  strategies: Map<string, BlogRollStrategy>,
): Promise<FetchResult>[] {
  return blogRoll.map((entry) => {
    const strategy = strategies.get(entry.id);
    if (!strategy) {
      logError(new Error(`No strategy found for blog roll entry "${entry.id}"`), { operation: "fetch-latest-post", entryId: entry.id });
      return Promise.resolve({ entry, post: null });
    }

    return strategy
      .fetchLatestPost()
      .then((post) => ({ entry, post }))
      .catch((err) => {
        // Silent degradation: show entry without latest post on fetch failure.
        logError(err, { operation: "fetch-latest-post", entryId: entry.id });
        return { entry, post: null };
      });
  });
}

function updateBlogrollEntry(panel: HTMLElement, entry: BlogRollEntry, post: LatestPost): void {
  const entryLink = panel.querySelector(`#blogroll-entry-${CSS.escape(entry.id)}`);
  const placeholder = panel.querySelector(`#blogroll-latest-${CSS.escape(entry.id)}`);
  const dateSpan = panel.querySelector(`#blogroll-date-${CSS.escape(entry.id)}`);
  if (!entryLink || !placeholder) {
    logError(new Error(`Blogroll DOM element missing for entry "${entry.id}"`), {
      operation: "update-blogroll-entry",
    });
    return;
  }

  placeholder.textContent = post.title;
  entryLink.setAttribute("href", post.url);
  if (dateSpan && post.publishedAt) {
    dateSpan.textContent = formatUtcDate(post.publishedAt, "short");
    dateSpan.setAttribute("data-iso", post.publishedAt);
  }
}

function sortBlogrollByDate(panel: HTMLElement): void {
  const firstItem = panel.querySelector("li[data-blogroll-id]");
  const blogrollList = firstItem?.parentElement;
  if (!blogrollList) return;

  const items = [...blogrollList.querySelectorAll("li[data-blogroll-id]")];
  items.sort((a, b) => {
    const dateA = a.querySelector(".blogroll-date")?.getAttribute("data-iso") || "";
    const dateB = b.querySelector(".blogroll-date")?.getAttribute("data-iso") || "";
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  for (const item of items) {
    blogrollList.appendChild(item);
  }
}

export function hydrateInfoPanel(
  panel: HTMLElement,
  blogRoll: BlogRollEntry[],
  strategies: Map<string, BlogRollStrategy>,
): void {
  Promise.all(fetchAllLatestPosts(blogRoll, strategies))
    .then((results) => {
      for (const { entry, post } of results) {
        if (post) updateBlogrollEntry(panel, entry, post);
      }
      sortBlogrollByDate(panel);
    })
    // Intentional silent degradation — user sees build-time content rather than an error.
    .catch((err) => {
      if (deferProgrammerError(err)) return;
      logError(err, { operation: "hydrate-blogroll" });
    });
}
