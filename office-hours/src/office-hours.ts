import { type Reminder, sortByDueAscending, formatDueLabel } from "./reminders.js";

export function renderReminderList(reminders: Reminder[], now: Date): HTMLElement {
  const section = document.createElement("section");
  const list = document.createElement("ul");
  list.id = "reminder-list";
  section.appendChild(list);

  const sorted = sortByDueAscending(reminders);
  for (const reminder of sorted) {
    const item = document.createElement("li");
    item.className = "reminder";

    const title = document.createElement("span");
    title.className = "reminder-title";
    title.textContent = reminder.title;

    const due = document.createElement("span");
    due.className = "reminder-due";
    due.textContent = formatDueLabel(reminder.dueAt, now);
    if (reminder.dueAt.getTime() < now.getTime()) due.classList.add("overdue");

    item.appendChild(title);
    item.appendChild(due);
    list.appendChild(item);
  }

  if (sorted.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No reminders.";
    section.appendChild(empty);
  }

  return section;
}
