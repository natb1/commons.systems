import { useEffect, useRef, useState, type ReactNode } from "react";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { initScrollIndicator } from "@commons-systems/components/scroll-indicator";
import type {
  BlogRollEntry,
  BlogRollStrategy,
  LatestPost,
} from "../blog-roll/types.ts";
import {
  sortBlogrollByPublishedDesc,
  type BlogRollItem,
} from "../blog-roll/sort-by-date.ts";
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

/**
 * Reproduces info-panel.ts's fetchAllLatestPosts: one fetch per entry, resolving
 * to { entry, post } and degrading to a null post (with a logged error) when the
 * strategy is missing or the fetch rejects.
 */
function fetchAllLatestPosts(
  blogRoll: BlogRollEntry[],
  strategies: Map<string, BlogRollStrategy>,
): Promise<BlogRollItem>[] {
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

/**
 * The info-panel sidebar body. Order and content of the blogroll are driven by
 * React state (an ordered, enriched `{ entry, post }` list), so React owns the
 * DOM: the JSX delegates to the frozen presentational <InfoPanel>, and a sort is
 * a pure function of state rather than an imperative reorder of React-owned nodes.
 *
 * The initial state is computed by a LAZY useState initializer that is a pure
 * function of `data` — map `data.blogRoll` to `{ entry, post: buildTimeFeeds[id] }`
 * and sort by published date. That initializer runs during render on BOTH the
 * server (react-dom/server renderToString) and the client first render, with no
 * effect involved, so the SSR'd markup is already build-time-date-sorted and is
 * byte-identical to the client's first render — the hydration-parity contract.
 *
 * The fetch effect then re-fetches each entry's latest post, re-sorts, and calls
 * setState; InfoPanel keys each <li> by id, so the reorder reconciles via stable
 * keys and emits the same ids/classes/attrs. Skipped on the About panel.
 *
 * PURE and fully prop-driven aside from the blogroll state. Refs are used solely
 * for hydration mechanics (mount/cancel guards), never for shared state.
 */
export function InfoPanelRegion({
  data,
  strategies,
  useScrollIndicator,
  aboutContent,
}: InfoPanelRegionProps) {
  const mountedRef = useRef(true);
  const blogRoll = data.blogRoll;

  // Ordered, enriched blogroll. Lazy initializer is a pure function of `data`, so
  // server and client first renders produce identical (date-sorted) markup.
  const [items, setItems] = useState<BlogRollItem[]>(() =>
    sortBlogrollByPublishedDesc(
      blogRoll.map((entry) => ({
        entry,
        post: data.buildTimeFeeds?.[entry.id] ?? null,
      })),
    ),
  );

  // Blog-roll hydration: fetch each entry's latest post, sort by date, and drive
  // the result through state (React reconciles the DOM). Skipped on the About
  // panel (no blogroll).
  useEffect(() => {
    if (aboutContent !== undefined) return;

    // Each dep change runs the cleanup (sets mountedRef false) then re-runs the
    // effect; reset on entry so later runs are not silently skipped. The per-run
    // `cancelled` flag handles cancelling a stale run's writes after props change.
    mountedRef.current = true;
    let cancelled = false;
    const isCurrent = () => mountedRef.current && !cancelled;

    Promise.all(fetchAllLatestPosts(blogRoll, strategies))
      .then((results) => {
        if (!isCurrent()) return;
        setItems(sortBlogrollByPublishedDesc(results));
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

  // Derive the panel data from state: order from the sorted entries, content from
  // a buildTimeFeeds map merged with the state's posts. Spread `data` so the live
  // passthrough fields (linkSections, topPosts, rssFeedUrl, opmlUrl, …) still flow
  // through on a re-render that keeps the same panelKey (e.g. sign-in bumping
  // topPosts). Only blogRoll order and the feed map come from state.
  const feedsFromState: Record<string, LatestPost | null> = {};
  for (const { entry, post } of items) {
    // Degradation fallback: a null post (unavailable feed / failed fetch) keeps the
    // build-time content rather than blanking the entry — preserving the "user sees
    // build-time content" behavior the hydration effect's catch claims.
    feedsFromState[entry.id] = post ?? data.buildTimeFeeds?.[entry.id] ?? null;
  }
  const derivedData: InfoPanelData = {
    ...data,
    blogRoll: items.map(({ entry }) => entry),
    buildTimeFeeds: feedsFromState,
  };

  return <InfoPanel data={derivedData} />;
}
