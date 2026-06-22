import { useMemo } from "react";
import { humanize } from "../reminders.js";
import type { ParkedIssue } from "../queue-metrics.js";

export interface ParkedIssuesPanelProps {
  parked: ParkedIssue[];
  /** Time-sensitive: age labels are relative to `now`. */
  now: Date;
}

/**
 * Renders the list of dispatch:office-hours parked issues from the already-loaded
 * queue-metrics snapshot. Sorted oldest-first so the most-stale item surfaces at
 * the top. No new Firestore read.
 */
export function ParkedIssuesPanel(props: ParkedIssuesPanelProps) {
  const { parked, now } = props;

  const sorted = useMemo(
    () => [...parked].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [parked],
  );

  const nowMs = now.getTime();

  return (
    <section>
      <h2 className="parked-issues-heading">PARKED</h2>
      <ul className="parked-issue-list">
        {sorted.map((item) => (
          <li className="parked-issue" key={item.number}>
            <a
              className="parked-issue-title"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title}
            </a>
            <span className="parked-issue-meta">
              <span className="parked-issue-age">
                {humanize(nowMs - item.createdAt.getTime())}
              </span>
              {item.phase !== undefined && (
                <span className="parked-issue-phase">{item.phase}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {sorted.length === 0 && <p className="empty">Nothing parked.</p>}
    </section>
  );
}
