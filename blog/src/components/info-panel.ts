import { escapeHtml } from "@commons-systems/htmlutil";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { formatUtcDate, monthName } from "../date.ts";
import { isPublished, type PostMeta, type PublishedPost } from "../post-types.ts";
import type { BlogRollEntry, BlogRollStrategy, LatestPost } from "../blog-roll/types.ts";

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

function groupByYearMonth(
  published: PublishedPost[],
): Map<number, Map<number, PublishedPost[]>> {
  const grouped = new Map<number, Map<number, PublishedPost[]>>();
  for (const post of published) {
    const date = new Date(post.publishedAt);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    if (!grouped.has(year)) grouped.set(year, new Map());
    const months = grouped.get(year)!;
    if (!months.has(month)) months.set(month, []);
    months.get(month)!.push(post);
  }
  return grouped;
}

function renderMonthBlock(
  month: number,
  posts: PublishedPost[],
  isOpen: boolean,
  postLinkPrefix: string,
): string {
  const items = posts
    .map(
      (p) =>
        `<li><a href="${postLinkPrefix}${escapeHtml(p.id)}">${escapeHtml(p.title)}</a></li>`,
    )
    .join("");
  return `<details${isOpen ? " open" : ""}>
            <summary>${monthName(month)}</summary>
            <ul class="panel-list">${items}</ul>
          </details>`;
}

function renderYearBlock(
  year: number,
  months: Map<number, PublishedPost[]>,
  currentYear: number,
  currentMonth: number,
  postLinkPrefix: string,
): string {
  const isCurrentYear = year === currentYear;
  const sortedMonths = [...months.keys()].sort((a, b) => b - a);
  const monthBlocks = sortedMonths
    .map((month) =>
      renderMonthBlock(month, months.get(month)!, isCurrentYear && month === currentMonth, postLinkPrefix),
    )
    .join("");
  return `<details${isCurrentYear ? " open" : ""}>
        <summary>${year}</summary>
        ${monthBlocks}
      </details>`;
}

function renderLink(l: LinkSection["links"][number]): string {
  const subtitleHtml = l.subtitle
    ? `<span class="link-subtitle">${escapeHtml(l.subtitle)}</span>`
    : "";
  return `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}${subtitleHtml}</a></li>`;
}

function renderArchive(published: PublishedPost[], rssFeedUrl: string | undefined, postLinkPrefix: string): string {
  if (published.length === 0) return "";

  const grouped = groupByYearMonth(published);
  const now = new Date();
  const sortedYears = [...grouped.keys()].sort((a, b) => b - a);
  const yearBlocks = sortedYears
    .map((year) =>
      renderYearBlock(year, grouped.get(year)!, now.getUTCFullYear(), now.getUTCMonth(), postLinkPrefix),
    )
    .join("");

  const rssIcon = rssFeedUrl
    ? ` <a href="${escapeHtml(rssFeedUrl)}" title="RSS"><img src="/icons/rss.svg" class="feed-icon" alt="RSS"></a>`
    : "";

  return `<section class="panel-section">
    <h3>Archive${rssIcon}</h3>
    ${yearBlocks}
  </section>`;
}

export function renderInfoPanel(data: InfoPanelData): string {
  const postLinkPrefix = data.postLinkPrefix ?? "/post/";
  const linkSectionsHtml = data.linkSections
    .map((section) => {
      const linksHtml = section.links.map(renderLink).join("");
      const headingHtml = section.heading
        ? `<h3>${escapeHtml(section.heading)}</h3>\n      `
        : "";
      return `<section class="panel-section">
      ${headingHtml}<ul class="panel-list">${linksHtml}</ul>
    </section>`;
    })
    .join("\n    ");

  const published = data.topPosts.filter(isPublished);

  const topPostsHtml = published
    .map(
      (p) =>
        `<li><a href="${postLinkPrefix}${escapeHtml(p.id)}">${escapeHtml(p.title)}</a></li>`,
    )
    .join("");

  const opmlIcon = data.opmlUrl
    ? ` <a href="${escapeHtml(data.opmlUrl)}" title="OPML"><img src="/icons/opml.svg" class="feed-icon" alt="OPML"></a>`
    : "";

  const blogRollHtml = data.blogRoll
    .map((b) => {
      const buildPost = data.buildTimeFeeds?.[b.id];
      const latestText = buildPost?.title ? escapeHtml(buildPost.title) : "";
      const dateText = buildPost?.publishedAt ? formatUtcDate(buildPost.publishedAt, "short") : "";
      const dateIso = buildPost?.publishedAt ? ` data-iso="${escapeHtml(buildPost.publishedAt)}"` : "";
      const entryHref = buildPost?.url ? escapeHtml(buildPost.url) : escapeHtml(b.url);
      return `<li data-blogroll-id="${escapeHtml(b.id)}">
        <a class="blogroll-entry" id="blogroll-entry-${escapeHtml(b.id)}" href="${entryHref}" target="_blank" rel="noopener">
          <span class="blogroll-name">${escapeHtml(b.name)}</span>
          <span class="blogroll-latest" id="blogroll-latest-${escapeHtml(b.id)}">${latestText}</span>
          <span class="blogroll-date" id="blogroll-date-${escapeHtml(b.id)}"${dateIso}>${dateText}</span>
        </a>
      </li>`;
    })
    .join("");

  return `
    ${linkSectionsHtml}
    <section class="panel-section">
      <h3>Top Posts</h3>
      <ul class="panel-list">${topPostsHtml}</ul>
    </section>
    <section class="panel-section">
      <h3>Blogroll${opmlIcon}</h3>
      <ul class="panel-list">${blogRollHtml}</ul>
    </section>
    ${renderArchive(published, data.rssFeedUrl, postLinkPrefix)}
  `;
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
