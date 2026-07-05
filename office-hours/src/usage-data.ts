import seedSamples from "virtual:office-hours-usage-seed-data";
import { type UsageSample } from "./usage-samples.js";

export function getDemoSamples(): UsageSample[] {
  return seedSamples.map((s) => ({
    sampledAt: s.sampledAt,
    fiveHourUsedPct: s.fiveHourUsedPct,
    weeklyUsedPct: s.weeklyUsedPct,
    fiveHourResetsAt: s.fiveHourResetsAt,
    weeklyResetsAt: s.weeklyResetsAt,
    activeWorkers: s.activeWorkers,
    targetWorkers: s.targetWorkers,
    groupId: s.groupId,
  }));
}
