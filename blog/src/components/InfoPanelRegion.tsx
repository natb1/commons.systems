import { useEffect, useRef, type ReactNode } from "react";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { initScrollIndicator } from "@commons-systems/components/scroll-indicator";
import { formatUtcDate } from "../date.ts";
import type {
  BlogRollEntry,
  BlogRollStrategy,
  LatestPost,
} from "../blog-roll/types.ts";
import type { InfoPanelData } from "./info-panel.ts";
import { InfoPanel } from "./InfoPanel.tsx";

export interface InfoPanelRegionProps {
  /**
   * The same object the legacy `renderInfoPanel(data)` bridge consumed — passed
   * through verbatim to <InfoPanel>. `blogRoll` is derived from `data.blogRoll`
   * so there is a single source of truth; the driver (Unit 3) builds this object
   * exactly as it did at create-blog-app.ts's `renderInfoPanel(...)` call.
   */
  data: InfoPanelData;
  /** Per-entry fetch strategies, keyed by entry id (BlogRollEntry.id). */
  strategies: Map<string, BlogRollStrategy>;
  /** Mount the sticky-sidebar custom scroll indicator (landing/blog only). */
  useScrollIndicator?: boolean;
  /**
   * A ReactNode for landing's About panel (wired by a later unit). When present,
   * the About content replaces the standard panel and the blog-roll hydration is
   * skipped entirely. When absent (the common case), the standard info panel
   * renders. React renders this node (server-side via `renderToString`,
   * client-side via the panel root) and escapes text, so no manual sanitization
   * contract applies.
   */
  aboutContent?: ReactNode;
}

interface FetchResult {
  entry: BlogRollEntry;
  post: LatestPost | null;
}

/**
 * Reproduces info-panel.ts's fetchAllLatestPosts: one fetch per entry, resolving
 * to { entry, post } and degrading to a null post (with a logged error) when the
 * strategy is missing or the fetch rejects.
 */
function fetchAllLatestPosts(
  blogRoll: BlogRollEntry[],
  strategies: Map<string, BlogRollStrategy>,
): Promise<FetchResult>[] {
  return blogRoll.map((entry) => {
    const strategy = strategies.get(entry.id);
    if (!strategy) {
      logError(new Error(`No strategy found for blog roll entry "${entry.id}"`), {
        operation: "fetch-latest-post",
        entryId: entry.id,
      });
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

/** Reproduces info-panel.ts's updateBlogrollEntry against the InfoPanel DOM. */
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

/** Reproduces info-panel.ts's sortBlogrollByDate: re-sort entries by date desc. */
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

/**
 * The info-panel sidebar body, owning the same DOM the legacy imperative
 * renderInfoPanel + hydrateInfoPanel pair produced. The JSX delegates verbatim to
 * the frozen presentational <InfoPanel> so the server (react-dom/server) and
 * client (hydrateRoot) initial markup are byte-identical; the effect then
 * reproduces hydrateInfoPanel's per-entry latest-post fetch and re-sort, mutating
 * the DOM imperatively against the same ids/classes/attrs InfoPanel emits.
 *
 * The host <aside id="info-panel" class="sidebar"> is the scroll container (the
 * element Unit 3's hydrateRoot mounts into and the legacy driver passed to
 * hydrateInfoPanel / initScrollIndicator). InfoPanel renders only its children
 * (matching renderInfoPanel's output), so the effects reach the host via
 * `document.getElementById("info-panel")` — the parity-correct root, since the
 * delegated fragment exposes no single ref-able element.
 *
 * PURE and fully prop-driven: no app state and no router hooks. Refs are used
 * solely for hydration mechanics (mount/cancel guards), never for shared state.
 *
 * panelKey REMOUNT INVARIANT (load-bearing): the blogroll effect below re-sorts
 * the React-rendered <li> nodes imperatively (sortBlogrollByDate's appendChild),
 * mutating DOM this component's React root owns. That is only safe because
 * callers bump `panelKey` whenever the blogroll data (blogRoll / strategies)
 * changes, mounting a FRESH React root that side-steps stale-child
 * reconciliation. A same-key re-render with updated strategies instead skips
 * root teardown and RECONCILES the existing tree, letting a later reconcile pass
 * disagree with — and fight — the imperative reorder. `forceInfoPanelRefresh`
 * (create-blog-app.ts) is the required mechanism: it bumps `panelKey` before
 * re-rendering. Any call site that changes blogroll data via a bare same-key
 * re-render, bypassing forceInfoPanelRefresh, is incorrect. The long-term fix
 * that removes this invariant by driving order through React state is tracked in
 * #2173.
 */
export function InfoPanelRegion({
  data,
  strategies,
  useScrollIndicator,
  aboutContent,
}: InfoPanelRegionProps) {
  const mountedRef = useRef(true);
  const blogRoll = data.blogRoll;

  // Blog-roll hydration: fetch each entry's latest post, write it into the
  // delegated DOM, then re-sort by date. Skipped on the About panel (no blogroll).
  useEffect(() => {
    if (aboutContent !== undefined) return;

    // Each dep change runs the cleanup (sets mountedRef false) then re-runs the
    // effect; reset on entry so later runs are not silently skipped. The per-run
    // `cancelled` flag handles cancelling a stale run's writes after props change.
    mountedRef.current = true;
    let cancelled = false;
    const isCurrent = () => mountedRef.current && !cancelled;

    const panel = document.getElementById("info-panel");
    if (!panel) return; // host not present (e.g. About panel) — no error

    Promise.all(fetchAllLatestPosts(blogRoll, strategies))
      .then((results) => {
        if (!isCurrent()) return;
        for (const { entry, post } of results) {
          if (post) updateBlogrollEntry(panel, entry, post);
        }
        sortBlogrollByDate(panel);
      })
      // Intentional silent degradation — user sees build-time content, not an error.
      .catch((err) => {
        if (deferProgrammerError(err)) return;
        logError(err, { operation: "hydrate-blogroll" });
      });

    return () => {
      mountedRef.current = false;
      cancelled = true;
    };
  }, [blogRoll, strategies, aboutContent]);

  // Scroll indicator: a separate effect so the About-panel early-return above
  // does not suppress it. Mirrors create-blog-app.ts's teardown-before-reinit and
  // cleanup-teardown semantics. Deliberately NOT gated on aboutContent: the host
  // <aside> still scrolls when it shows the About panel, so the indicator stays.
  useEffect(() => {
    if (!useScrollIndicator) return;
    const panel = document.getElementById("info-panel");
    if (!panel) return;
    const teardown = initScrollIndicator(panel);
    return () => teardown();
  }, [useScrollIndicator, aboutContent]);

  if (aboutContent !== undefined) {
    return <div>{aboutContent}</div>;
  }

  return <InfoPanel data={data} />;
}
