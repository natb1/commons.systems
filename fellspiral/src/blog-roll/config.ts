import type { BlogRollEntry, BlogRollStrategy } from "@commons-systems/blog/blog-roll/types";

interface BlogRollConfig {
  entry: BlogRollEntry;
  strategy: BlogRollStrategy;
}

export const BLOG_ROLL_CONFIG: BlogRollConfig[] = [];

export const BLOG_ROLL_ENTRIES = BLOG_ROLL_CONFIG.map((c) => c.entry);

export function createStrategies(): Map<string, BlogRollStrategy> {
  return new Map(BLOG_ROLL_CONFIG.map((c) => [c.entry.id, c.strategy]));
}
