import type { BlogRollStrategy, LatestPost } from "./types.ts";

export class FallbackStrategy implements BlogRollStrategy {
  constructor(
    private primary: BlogRollStrategy,
    private fallbackData: LatestPost | null,
  ) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    let result: LatestPost | null;
    try {
      result = await this.primary.fetchLatestPost();
    } catch (err) {
      if (this.fallbackData) {
        console.warn("FallbackStrategy: primary threw, using build-time data", err);
        return this.fallbackData;
      }
      throw err;
    }
    if (result) return result;
    if (this.fallbackData) {
      console.warn("FallbackStrategy: primary returned null, using build-time data");
    }
    return this.fallbackData;
  }
}
