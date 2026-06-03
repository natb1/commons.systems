export function renderAgenda(): HTMLElement {
  const section = document.createElement("section");

  const list = document.createElement("ul");
  list.id = "reminder-list";

  const empty = document.createElement("p");
  empty.className = "empty";
  empty.textContent = "No reminders.";

  section.appendChild(list);
  section.appendChild(empty);

  return section;
}
