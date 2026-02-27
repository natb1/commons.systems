import type { BlogRollEntry, BlogRollStrategy } from "./types.js";
import { RssStrategy } from "./rss-strategy.js";

export const BLOG_ROLL_ENTRIES: BlogRollEntry[] = [
  {
    id: "anthropic-engineering",
    name: "Anthropic Engineering",
    url: "https://www.anthropic.com/engineering",
  },
];

export function createStrategies(): Map<string, BlogRollStrategy> {
  const strategies = new Map<string, BlogRollStrategy>();
  strategies.set(
    "anthropic-engineering",
    new RssStrategy("https://www.anthropic.com/engineering/rss.xml"),
  );
  return strategies;
}
