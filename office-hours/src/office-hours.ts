import {
  type OfficeHoursItem,
  type Reminder,
  type MergePrItem,
  sortByDueAscending,
  formatDueLabel,
} from "./reminders.js";

export function renderReminderList(items: OfficeHoursItem[], now: Date): HTMLElement {
  const section = document.createElement("section");
  const list = document.createElement("ul");
  list.id = "reminder-list";
  section.appendChild(list);

  const mergePrs = items.filter((i): i is MergePrItem => i.kind === "merge-pr");
  const reminders = items.filter((i): i is Reminder => i.kind === "reminder");

  for (const item of mergePrs) {
    const li = document.createElement("li");
    li.className = "merge-pr";

    const link = document.createElement("a");
    link.className = "merge-pr-link";
    link.href = item.prUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.prTitle;

    li.appendChild(link);
    list.appendChild(li);
  }

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

  if (mergePrs.length === 0 && reminders.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No reminders.";
    section.appendChild(empty);
  }

  return section;
}
