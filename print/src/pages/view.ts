import { escapeHtml } from "../escape-html.js";
import type { MediaMeta } from "../firestore.js";

export function renderView(item: MediaMeta | undefined): string {
  if (!item) {
    return `
    <h2>Not Found</h2>
    <p id="view-not-found">Media item not found. <a href="#/">Back to library</a></p>
  `;
  }

  const safeId = escapeHtml(item.id);
  const tags = Object.entries(item.tags);
  const tagsRows = tags.length > 0
    ? tags.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("")
    : `<tr><td colspan="2">No tags</td></tr>`;

  return `
    <h2>${escapeHtml(item.title)}</h2>
    <p><a href="#/">Back to library</a></p>
    <table id="metadata-table" data-media-id="${safeId}">
      <thead><tr><th>Field</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>ID</td><td>${safeId}</td></tr>
        <tr><td>Media Type</td><td>${escapeHtml(item.mediaType)}</td></tr>
        <tr><td>Public Domain</td><td>${item.publicDomain ? "Yes" : "No"}</td></tr>
        <tr><td>Size</td><td>${item.sizeBytes} bytes</td></tr>
        ${tagsRows}
      </tbody>
    </table>
    <div class="media-actions">
      <button class="btn btn-download" data-media-id="${safeId}" data-media-type="${escapeHtml(item.mediaType)}" title="Download file">Download</button>
    </div>
  `;
}
