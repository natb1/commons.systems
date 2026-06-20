import {
  type Reminder,
  sortByDueAscending,
  formatDueLabel,
} from "../reminders.js";

export interface RemindersPanelProps {
  reminders: Reminder[];
  /** Time-sensitive: due labels and the overdue marker are relative to `now`. */
  now: Date;
}

/**
 * React port of the render half of `renderReminderList` (office-hours.ts).
 * Reuses the `sortByDueAscending` / `formatDueLabel` compute helpers verbatim;
 * only the DOM-building becomes JSX. Preserves the "No reminders." empty state.
 */
export function RemindersPanel(props: RemindersPanelProps) {
  const { reminders, now } = props;
  const sorted = sortByDueAscending(reminders);

  return (
    <section>
      <ul id="reminder-list">
        {sorted.map((reminder) => {
          const overdue = reminder.dueAt.getTime() < now.getTime();
          return (
            <li className="reminder" key={reminder.jitKey}>
              <span className="reminder-title">{reminder.title}</span>
              <span className={`reminder-due${overdue ? " overdue" : ""}`}>
                {formatDueLabel(reminder.dueAt, now)}
              </span>
            </li>
          );
        })}
      </ul>
      {sorted.length === 0 && <p className="empty">No reminders.</p>}
    </section>
  );
}
