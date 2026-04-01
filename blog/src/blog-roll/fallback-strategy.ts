import type { BlogRollStrategy, LatestPost } from "./types.ts";

export class FallbackStrategy implements BlogRollStrategy {
  constructor(
    private primary: BlogRollStrategy,
    private fallbackData: LatestPost | null,
  ) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    const result = await this.primary.fetchLatestPost();
    if (result) return result;
    if (this.fallbackData) {
      console.warn("FallbackStrategy: primary returned null, using build-time data");
    }
    return this.fallbackData;
  }
}
