import type { BlogRollConfig, BlogRollStrategy } from "@commons-systems/blog/blog-roll/types";

export const BLOG_ROLL_CONFIG: BlogRollConfig[] = [];

export const BLOG_ROLL_ENTRIES = BLOG_ROLL_CONFIG.map((c) => c.entry);

export function createStrategies(): Map<string, BlogRollStrategy> {
  const map = new Map<string, BlogRollStrategy>();
  for (const c of BLOG_ROLL_CONFIG) {
    if (map.has(c.entry.id)) {
      throw new Error(`Duplicate blog roll entry id: "${c.entry.id}"`);
    }
    map.set(c.entry.id, c.strategy);
  }
  return map;
}
