import { formatUtcDate, monthName } from "../date.ts";
import { isPublished, type PublishedPost } from "../post-types.ts";
import type { InfoPanelData, LinkSection } from "./info-panel.ts";

/**
 * The blog info panel (sidebar). Mirrors the prior hand-written render path in
 * info-panel.ts verbatim: the Links, Top Posts, Blogroll, and Archive sections.
 *
 * Sections are raw <section className="panel-section"> (not ds Card) because a
 * Card would inject cs-card styling that changes the sidebar's visible output.
 * Blogroll entries are raw elements so the exact ids/classes/attrs the imperative
 * hydrateInfoPanel queries (#blogroll-entry-{id}, #blogroll-latest-{id},
 * #blogroll-date-{id}, data-iso, li[data-blogroll-id]) survive verbatim.
 *
 * React auto-escapes text children, so labels/titles/names are passed raw — never
 * pre-escaped (escapeHtml here would double-escape). data-iso is passed as the raw
 * value (undefined when absent) so the attribute is omitted, not emitted empty.
 */

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

function MonthBlock({
  month,
  posts,
  isOpen,
  postLinkPrefix,
}: {
  month: number;
  posts: PublishedPost[];
  isOpen: boolean;
  postLinkPrefix: string;
}) {
  return (
    <details open={isOpen}>
      <summary>{monthName(month)}</summary>
      <ul className="panel-list">
        {posts.map((p) => (
          <li key={p.id}>
            <a href={`${postLinkPrefix}${p.id}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function YearBlock({
  year,
  months,
  currentYear,
  currentMonth,
  postLinkPrefix,
}: {
  year: number;
  months: Map<number, PublishedPost[]>;
  currentYear: number;
  currentMonth: number;
  postLinkPrefix: string;
}) {
  const isCurrentYear = year === currentYear;
  const sortedMonths = [...months.keys()].sort((a, b) => b - a);
  return (
    <details open={isCurrentYear}>
      <summary>{year}</summary>
      {sortedMonths.map((month) => (
        <MonthBlock
          key={month}
          month={month}
          posts={months.get(month)!}
          isOpen={isCurrentYear && month === currentMonth}
          postLinkPrefix={postLinkPrefix}
        />
      ))}
    </details>
  );
}

function FeedIcon({ url, kind }: { url: string; kind: "RSS" | "OPML" }) {
  const src = kind === "RSS" ? "/icons/rss.svg" : "/icons/opml.svg";
  return (
    <>
      {" "}
      <a href={url} title={kind}>
        <img src={src} className="feed-icon" alt={kind} />
      </a>
    </>
  );
}

function Archive({
  published,
  rssFeedUrl,
  postLinkPrefix,
}: {
  published: PublishedPost[];
  rssFeedUrl?: string;
  postLinkPrefix: string;
}) {
  if (published.length === 0) return null;

  const grouped = groupByYearMonth(published);
  const now = new Date();
  const sortedYears = [...grouped.keys()].sort((a, b) => b - a);

  return (
    <section className="panel-section">
      <h3>Archive{rssFeedUrl && <FeedIcon url={rssFeedUrl} kind="RSS" />}</h3>
      {sortedYears.map((year) => (
        <YearBlock
          key={year}
          year={year}
          months={grouped.get(year)!}
          currentYear={now.getUTCFullYear()}
          currentMonth={now.getUTCMonth()}
          postLinkPrefix={postLinkPrefix}
        />
      ))}
    </section>
  );
}

function LinkSectionBlock({ section }: { section: LinkSection }) {
  return (
    <section className="panel-section">
      {section.heading && <h3>{section.heading}</h3>}
      <ul className="panel-list">
        {section.links.map((l, i) => (
          <li key={i}>
            <a href={l.url} target="_blank" rel="noopener">
              {l.label}
              {l.subtitle && <span className="link-subtitle">{l.subtitle}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InfoPanel({ data }: { data: InfoPanelData }) {
  const postLinkPrefix = data.postLinkPrefix ?? "/post/";
  const published = data.topPosts.filter(isPublished);

  return (
    <>
      {data.linkSections.map((section, i) => (
        <LinkSectionBlock key={i} section={section} />
      ))}
      <section className="panel-section">
        <h3>Top Posts</h3>
        <ul className="panel-list">
          {published.map((p) => (
            <li key={p.id}>
              <a href={`${postLinkPrefix}${p.id}`}>{p.title}</a>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel-section">
        <h3>
          Blogroll
          {data.opmlUrl && <FeedIcon url={data.opmlUrl} kind="OPML" />}
        </h3>
        <ul className="panel-list">
          {data.blogRoll.map((b) => {
            const buildPost = data.buildTimeFeeds?.[b.id];
            const latestText = buildPost?.title ?? "";
            const dateText = buildPost?.publishedAt
              ? formatUtcDate(buildPost.publishedAt, "short")
              : "";
            const entryHref = buildPost?.url ?? b.url;
            return (
              <li key={b.id} data-blogroll-id={b.id}>
                <a
                  className="blogroll-entry"
                  id={`blogroll-entry-${b.id}`}
                  href={entryHref}
                  target="_blank"
                  rel="noopener"
                >
                  <span className="blogroll-name">{b.name}</span>
                  <span
                    className="blogroll-latest"
                    id={`blogroll-latest-${b.id}`}
                  >
                    {latestText}
                  </span>
                  <span
                    className="blogroll-date"
                    id={`blogroll-date-${b.id}`}
                    data-iso={buildPost?.publishedAt}
                  >
                    {dateText}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
      <Archive
        published={published}
        rssFeedUrl={data.rssFeedUrl}
        postLinkPrefix={postLinkPrefix}
      />
    </>
  );
}
