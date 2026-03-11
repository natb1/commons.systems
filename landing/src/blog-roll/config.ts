import {
  createStrategies as buildStrategies,
  type BlogRollConfig,
  type BlogRollStrategy,
} from "@commons-systems/blog/blog-roll/types";
import { StaticStrategy } from "@commons-systems/blog/blog-roll/static-strategy";

export const BLOG_ROLL_CONFIG: BlogRollConfig[] = [
  {
    entry: {
      id: "anthropic-engineering",
      name: "Anthropic Engineering",
      url: "https://www.anthropic.com/engineering",
    },
    strategy: new StaticStrategy({
      title: "Eval awareness in Claude Opus 4.6's BrowseComp performance",
      url: "https://www.anthropic.com/engineering/eval-awareness-browsecomp",
      publishedAt: "2026-03-06",
    }),
  },
  {
    entry: {
      id: "claude-code-blog",
      name: "Claude Code Blog",
      url: "https://claude.com/blog/category/claude-code",
    },
    strategy: new StaticStrategy({
      title: "Bringing Code Review to Claude Code",
      url: "https://claude.com/blog/code-review",
      publishedAt: "2026-03-09",
    }),
  },
];

export const BLOG_ROLL_ENTRIES = BLOG_ROLL_CONFIG.map((c) => c.entry);

export function createStrategies(): Map<string, BlogRollStrategy> {
  return buildStrategies(BLOG_ROLL_CONFIG);
}
