import type { IssueSample } from "./issue-samples.js";

export type BacklogRunwayFit =
  | { state: "draining"; daysUntilEmpty: number; slope: number; intercept: number; crossingAt: Date }
  | { state: "stable" }
  | { state: "growing" }
  | { state: "empty" }
  | { state: "insufficient" };

/**
 * Fits a linear regression of openHelpWanted vs time to estimate how many days
 * until the backlog empties. Returns a tagged-union describing the trend.
 */
export function fitBacklogRunway(samples: IssueSample[]): BacklogRunwayFit {
  if (samples.length === 0) return { state: "insufficient" };

  const sorted = [...samples].sort((a, b) => a.sampledAt.getTime() - b.sampledAt.getTime());

  const latest = sorted[sorted.length - 1];
  if (latest.openHelpWanted === 0) return { state: "empty" };

  if (sorted.length < 2) return { state: "insufficient" };

  const first = sorted[0].sampledAt;
  const xs = sorted.map((s) => (s.sampledAt.getTime() - first.getTime()) / 86_400_000);
  const ys = sorted.map((s) => s.openHelpWanted);

  const dataDays = xs[xs.length - 1];
  if (dataDays === 0) return { state: "insufficient" };

  const n = sorted.length;
  const sumX = xs.reduce((acc, x) => acc + x, 0);
  const sumY = ys.reduce((acc, y) => acc + y, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const fittedLast = slope * dataDays + intercept;

  if (slope < 0) {
    const daysUntilEmpty = Math.max(0, -fittedLast / slope);
    const crossingAt = new Date(first.getTime() + (dataDays + daysUntilEmpty) * 86_400_000);
    return { state: "draining", daysUntilEmpty, slope, intercept, crossingAt };
  }

  if (Math.abs(slope) < 1e-9) return { state: "stable" };

  return { state: "growing" };
}

/**
 * Returns a human-readable verdict for a BacklogRunwayFit, mirroring the
 * wording used in queue-band.ts's runwayReadout.
 */
export function runwayVerdict(fit: BacklogRunwayFit): { text: string; state: string } {
  switch (fit.state) {
    case "draining": {
      const days = Math.ceil(fit.daysUntilEmpty);
      const unit = days === 1 ? "day" : "days";
      return { text: `~${days} ${unit} until the queue empties`, state: "draining" };
    }
    case "stable":
      return { text: "queue stable", state: "stable" };
    case "growing":
      return { text: "queue growing", state: "growing" };
    case "empty":
      return { text: "queue empty", state: "empty" };
    case "insufficient":
      return { text: "not enough data", state: "insufficient" };
  }
}
