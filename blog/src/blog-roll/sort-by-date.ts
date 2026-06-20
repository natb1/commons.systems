import type { BlogRollEntry, LatestPost } from "./types";

export interface BlogRollItem {
  entry: BlogRollEntry;
  post: LatestPost | null;
}

/**
 * Sorts blog roll items newest-first by publishedAt, mirroring the
 * sortBlogrollByDate comparator in InfoPanelRegion. Items with a missing
 * publishedAt (post is null, or publishedAt is absent/empty) sort last.
 * Returns a new array; does not mutate the input.
 */
export function sortBlogrollByPublishedDesc(items: BlogRollItem[]): BlogRollItem[] {
  return [...items].sort((a, b) => {
    const dateA = a.post?.publishedAt || "";
    const dateB = b.post?.publishedAt || "";
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}
