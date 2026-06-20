import { Metric } from "@commons-systems/ds";
import { type UsageSample } from "../usage-samples.js";
import {
  workerState,
  formatCountdown,
  formatResetClock,
} from "../capacity-band.js";

export interface CapacityBandProps {
  /** The latest usage sample, or null when there is no capacity data. */
  sample: UsageSample | null;
  /**
   * Time-sensitive: reset countdowns and clock labels are relative to `now`.
   * The vanilla `renderCapacityBand` takes the same parameter.
   */
  now: Date;
}

/**
 * React port of the render half of `renderCapacityBand` (capacity-band.ts).
 * Reuses the `workerState` / `formatCountdown` / `formatResetClock` compute
 * helpers verbatim; only the DOM-building becomes JSX. The two capacity cards
 * use the DS `Metric` component; everything else is plain JSX matching the
 * vanilla class names.
 */
export function CapacityBand(props: CapacityBandProps) {
  const { sample, now } = props;

  if (sample === null) {
    return (
      <section>
        <h2 className="capacity-heading">CAPACITY</h2>
        <p className="empty">No capacity data.</p>
      </section>
    );
  }

  const state = workerState(sample.activeWorkers, sample.targetWorkers);

  const resets: { label: string; resetAt: Date }[] = [
    { label: "5-hour", resetAt: sample.fiveHourResetsAt },
    { label: "weekly", resetAt: sample.weeklyResetsAt },
  ];

  return (
    <section>
      <h2 className="capacity-heading">CAPACITY</h2>

      <div className="capacity-cards">
        <Metric
          className="capacity-card"
          label="5-hour"
          value={`${Math.round(sample.fiveHourUsedPct)}%`}
        />
        <Metric
          className="capacity-card"
          label="weekly"
          value={`${Math.round(sample.weeklyUsedPct)}%`}
        />
      </div>

      <ul className="capacity-resets">
        {resets.map((reset) => (
          <li key={reset.label}>
            <span className="capacity-reset-label">{reset.label}</span>
            <span className="capacity-reset-clock">
              {formatResetClock(reset.resetAt, now)}
            </span>
            <span className="capacity-reset-countdown">
              {formatCountdown(reset.resetAt, now)}
            </span>
          </li>
        ))}
      </ul>

      <p className="capacity-workers">
        {`${sample.activeWorkers} active / ${sample.targetWorkers} target `}
        <span className={`capacity-worker-state ${state}`}>{state}</span>
      </p>
    </section>
  );
}
