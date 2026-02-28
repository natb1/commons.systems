import { escapeHtml } from "../escape-html.js";
import type { PostMeta } from "../firestore.js";
import type { BlogRollEntry, BlogRollStrategy, LatestPost } from "../blog-roll/types.js";

interface InfoPanelData {
  links: { label: string; url: string }[];
  topPosts: PostMeta[];
  blogRoll: BlogRollEntry[];
  rssFeedUrl?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function renderArchive(posts: PostMeta[], rssFeedUrl?: string): string {
  const published = posts.filter(
    (p): p is PostMeta & { published: true; publishedAt: string } => p.published,
  );
  if (published.length === 0) return "";

  const grouped = new Map<number, Map<number, typeof published>>();
  for (const post of published) {
    const date = new Date(post.publishedAt);
    if (isNaN(date.getTime())) continue;
    const year = date.getFullYear();
    const month = date.getMonth();
    if (!grouped.has(year)) grouped.set(year, new Map());
    const months = grouped.get(year)!;
    if (!months.has(month)) months.set(month, []);
    months.get(month)!.push(post);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const sortedYears = [...grouped.keys()].sort((a, b) => b - a);
  const yearBlocks = sortedYears
    .map((year) => {
      const isCurrentYear = year === currentYear;
      const months = grouped.get(year)!;
      const sortedMonths = [...months.keys()].sort((a, b) => b - a);
      const monthBlocks = sortedMonths
        .map((month) => {
          const monthPosts = months.get(month)!;
          const isCurrentMonth = isCurrentYear && month === currentMonth;
          const items = monthPosts
            .map(
              (p) =>
                `<li><a href="#/post/${escapeHtml(p.id)}">${escapeHtml(p.title)}</a></li>`,
            )
            .join("");
          return `<details${isCurrentMonth ? " open" : ""}>
            <summary>${MONTH_NAMES[month]}</summary>
            <ul class="panel-list">${items}</ul>
          </details>`;
        })
        .join("");
      return `<details${isCurrentYear ? " open" : ""}>
        <summary>${year}</summary>
        ${monthBlocks}
      </details>`;
    })
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

  const topPostsHtml = data.topPosts
    .filter((p) => p.published)
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
    ${renderArchive(data.topPosts, data.rssFeedUrl)}
  `;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function hydrateInfoPanel(
  panel: HTMLElement,
  blogRoll: BlogRollEntry[],
  strategies: Map<string, BlogRollStrategy>,
): void {
  const fetches = blogRoll.map((entry) => {
    const strategy = strategies.get(entry.id);
    if (!strategy) return Promise.resolve({ entry, post: null as LatestPost | null });

    return strategy
      .fetchLatestPost()
      .then((post) => ({ entry, post }))
      .catch(() => ({ entry, post: null as LatestPost | null }));
  });

  Promise.all(fetches).then((results) => {
    for (const { entry, post } of results) {
      const entryLink = panel.querySelector(`#blogroll-entry-${CSS.escape(entry.id)}`);
      const placeholder = panel.querySelector(`#blogroll-latest-${CSS.escape(entry.id)}`);
      const dateSpan = panel.querySelector(`#blogroll-date-${CSS.escape(entry.id)}`);
      if (!entryLink || !placeholder) continue;

      if (post) {
        placeholder.textContent = post.title;
        entryLink.setAttribute("href", post.url);
        if (dateSpan && post.publishedAt) {
          dateSpan.textContent = formatDate(post.publishedAt);
          dateSpan.setAttribute("data-iso", post.publishedAt);
        }
      }
    }

    // Sort entries by publishedAt descending (most recent first)
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
  }).catch((err) => console.error("Failed to hydrate blogroll:", err));
}
