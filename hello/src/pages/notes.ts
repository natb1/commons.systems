import { auth } from "../auth.js";
import { escapeHtml } from "../escape-html.js";
import { getNotes } from "../firestore.js";

export async function renderNotes(): Promise<string> {
  if (!auth.currentUser) {
    return `<h2>Notes</h2><p id="notes-auth-required">Sign in to view private notes.</p>`;
  }
  try {
    const notes = await getNotes();
    const items = notes.map((n) => `<li>${escapeHtml(n.text)}</li>`).join("");
    return `<h2>Notes</h2><ul id="notes-list">${items}</ul>`;
  } catch {
    return `<h2>Notes</h2><p id="notes-error">Failed to load notes.</p>`;
  }
}
