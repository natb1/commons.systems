import { getMessages } from "../firestore.js";

export async function renderHome(): Promise<string> {
  let messagesHtml: string;
  try {
    const messages = await getMessages();
    if (messages.length === 0) {
      messagesHtml = "<p>No messages yet.</p>";
    } else {
      const items = messages
        .map((m) => {
          const date = new Date(m.createdAt);
          const formatted = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return `<li>${m.text} <time datetime="${m.createdAt}">${formatted}</time></li>`;
        })
        .join("\n        ");
      messagesHtml = `<ul id="messages">\n        ${items}\n      </ul>`;
    }
  } catch {
    messagesHtml = '<p id="messages-error">Could not load messages</p>';
  }

  return `
    <h2>Home</h2>
    <p>Welcome to the commons.systems hello app.</p>
    ${messagesHtml}
  `;
}
