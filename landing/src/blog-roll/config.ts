import type { BlogRollEntry, BlogRollStrategy } from "./types.js";
import { HtmlScrapingStrategy } from "./html-scraping-strategy.js";
import { StaticStrategy } from "./static-strategy.js";

export const BLOG_ROLL_ENTRIES: BlogRollEntry[] = [
  {
    id: "anthropic-engineering",
    name: "Anthropic Engineering",
    url: "https://www.anthropic.com/engineering",
  },
  {
    id: "claude-code-blog",
    name: "Claude Code Blog",
    url: "https://claude.com/blog/category/claude-code",
  },
];

export function createStrategies(): Map<string, BlogRollStrategy> {
  const strategies = new Map<string, BlogRollStrategy>();
  strategies.set(
    "anthropic-engineering",
    new HtmlScrapingStrategy(
      "https://www.anthropic.com/engineering",
      /^\/engineering\/.+/,
    ),
  );
  strategies.set(
    "claude-code-blog",
    new StaticStrategy({
      title: "Bringing automated preview, review, and merge to Claude Code on desktop",
      url: "https://claude.com/blog/preview-review-and-merge-with-claude-code",
    }),
  );
  return strategies;
}
