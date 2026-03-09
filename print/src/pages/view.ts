import { escapeHtml } from "@commons-systems/htmlutil";
import type { User } from "../auth.js";
import { DataIntegrityError } from "../errors.js";
import { getMediaItem } from "../firestore.js";
import type { MediaItem } from "../types.js";

const BACK_LINK = '<a href="#/" class="back-link">&larr; Back to Library</a>';

function formatDate(iso: string): string {
  return escapeHtml(
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  );
}

function renderTags(tags: Record<string, string>): string {
  const entries = Object.entries(tags);
  if (entries.length === 0) return "<p>No tags.</p>";
  const rows = entries
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
    .join("");
  return `<table class="tags-table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderMetadata(item: MediaItem): string {
  return `
    <h2>${escapeHtml(item.title)}</h2>
    ${BACK_LINK}
    <dl class="media-metadata">
      <dt>Type</dt>
      <dd><span class="media-badge">${escapeHtml(item.mediaType)}</span></dd>
      <dt>Public Domain</dt>
      <dd>${item.publicDomain ? "Yes" : "No"}</dd>
      <dt>Source Notes</dt>
      <dd>${escapeHtml(item.sourceNotes)}</dd>
      <dt>Storage Path</dt>
      <dd><code>${escapeHtml(item.storagePath)}</code></dd>
      <dt>Added</dt>
      <dd><time datetime="${escapeHtml(item.addedAt)}">${formatDate(item.addedAt)}</time></dd>
      <dt>Current Location</dt>
      <dd>placeholder</dd>
    </dl>
    <h3>Tags</h3>
    ${renderTags(item.tags)}
  `;
}

export async function renderView(id: string, _user: User | null): Promise<string> {
  if (!id) {
    return `
      <h2>Not Found</h2>
      <p id="view-not-found">No media item specified.</p>
      ${BACK_LINK}
    `;
  }

  try {
    const item = await getMediaItem(id);
    if (!item) {
      return `
        <h2>Not Found</h2>
        <p id="view-not-found">Media item not found.</p>
        ${BACK_LINK}
      `;
    }
    return renderMetadata(item);
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    console.error("Failed to load media item:", error);
    return `
      <h2>Error</h2>
      <p id="view-error">Could not load this media item.</p>
      ${BACK_LINK}
    `;
  }
}
