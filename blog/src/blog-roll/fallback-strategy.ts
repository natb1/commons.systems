import type { BlogRollStrategy, LatestPost } from "./types.js";

export class FallbackStrategy implements BlogRollStrategy {
  constructor(
    private primary: BlogRollStrategy,
    private fallbackData: LatestPost | null,
  ) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    const result = await this.primary.fetchLatestPost();
    if (result) return result;
    return this.fallbackData;
  }
}
