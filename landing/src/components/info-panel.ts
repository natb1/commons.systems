import { escapeHtml } from "@commons-systems/htmlutil";
import { formatUtcDate } from "../date.js";
import type { PostMeta } from "../firestore.js";
import { isPublished, type PublishedPost } from "../post-types.js";
import type { BlogRollEntry, BlogRollStrategy, LatestPost } from "../blog-roll/types.js";

interface InfoPanelData {
  links: { label: string; url: string }[];
  topPosts: PostMeta[];
  blogRoll: BlogRollEntry[];
  rssFeedUrl?: string;
}

function monthName(month: number): string {
  const date = new Date(Date.UTC(2000, month));
  return date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
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
): string {
  const items = posts
    .map(
      (p) =>
        `<li><a href="#/post/${escapeHtml(p.id)}">${escapeHtml(p.title)}</a></li>`,
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
): string {
  const isCurrentYear = year === currentYear;
  const sortedMonths = [...months.keys()].sort((a, b) => b - a);
  const monthBlocks = sortedMonths
    .map((month) =>
      renderMonthBlock(month, months.get(month)!, isCurrentYear && month === currentMonth),
    )
    .join("");
  return `<details${isCurrentYear ? " open" : ""}>
        <summary>${year}</summary>
        ${monthBlocks}
      </details>`;
}

function renderArchive(published: PublishedPost[], rssFeedUrl?: string): string {
  if (published.length === 0) return "";

  const grouped = groupByYearMonth(published);
  const now = new Date();
  const sortedYears = [...grouped.keys()].sort((a, b) => b - a);
  const yearBlocks = sortedYears
    .map((year) =>
      renderYearBlock(year, grouped.get(year)!, now.getUTCFullYear(), now.getUTCMonth()),
    )
    .join("");

  const rssIcon = rssFeedUrl
    ? ` <a href="${escapeHtml(rssFeedUrl)}" title="RSS" download="feed.xml"><img src="/icons/rss.svg" class="feed-icon" alt="RSS"></a>`
    : "";

  return `<section class="panel-section">
    <h3>Archive${rssIcon}</h3>
    ${yearBlocks}
  </section>`;
}

export function renderInfoPanel(data: InfoPanelData): string {
  const linksHtml = data.links
    .map(
      (l) =>
        `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a></li>`,
    )
    .join("");

  const published = data.topPosts.filter(isPublished);

  const topPostsHtml = published
    .map(
      (p) =>
        `<li><a href="#/post/${escapeHtml(p.id)}">${escapeHtml(p.title)}</a></li>`,
    )
    .join("");

  const blogRollHtml = data.blogRoll
    .map(
      (b) =>
        `<li data-blogroll-id="${escapeHtml(b.id)}">
        <a class="blogroll-entry" id="blogroll-entry-${escapeHtml(b.id)}" href="${escapeHtml(b.url)}" target="_blank" rel="noopener">
          <span class="blogroll-name">${escapeHtml(b.name)}</span>
          <span class="blogroll-latest" id="blogroll-latest-${escapeHtml(b.id)}"></span>
          <span class="blogroll-date" id="blogroll-date-${escapeHtml(b.id)}"></span>
        </a>
      </li>`,
    )
    .join("");

  return `
    <section class="panel-section">
      <h3>Links</h3>
      <ul class="panel-list">${linksHtml}</ul>
    </section>
    <section class="panel-section">
      <h3>Top Posts</h3>
      <ul class="panel-list">${topPostsHtml}</ul>
    </section>
    <section class="panel-section">
      <h3>Blogroll <a href="/blogroll.opml" title="OPML"><img src="/icons/opml.svg" class="feed-icon" alt="OPML"></a></h3>
      <ul class="panel-list">${blogRollHtml}</ul>
    </section>
    ${renderArchive(published, data.rssFeedUrl)}
  `;
}

function formatDate(dateStr: string): string {
  return formatUtcDate(dateStr, "short");
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
      console.warn(`No strategy found for blog roll entry "${entry.id}"`);
      return Promise.resolve({ entry, post: null });
    }

    return strategy
      .fetchLatestPost()
      .then((post) => ({ entry, post }))
      .catch((err) => {
        console.error(`Failed to fetch latest post for "${entry.id}":`, err);
        return { entry, post: null };
      });
  });
}

function updateBlogrollEntry(panel: HTMLElement, entry: BlogRollEntry, post: LatestPost): void {
  const entryLink = panel.querySelector(`#blogroll-entry-${CSS.escape(entry.id)}`);
  const placeholder = panel.querySelector(`#blogroll-latest-${CSS.escape(entry.id)}`);
  const dateSpan = panel.querySelector(`#blogroll-date-${CSS.escape(entry.id)}`);
  if (!entryLink || !placeholder) return;

  placeholder.textContent = post.title;
  entryLink.setAttribute("href", post.url);
  if (dateSpan && post.publishedAt) {
    dateSpan.textContent = formatDate(post.publishedAt);
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
    return dateB.localeCompare(dateA);
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
    .catch((err) => console.error("Failed to hydrate blogroll:", err));
}
