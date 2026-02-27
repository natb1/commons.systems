import { escapeHtml } from "../escape-html.js";
import type { MediaMeta } from "../firestore.js";

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function renderTags(tags: Record<string, string>): string {
  const entries = Object.entries(tags);
  if (entries.length === 0) return "";
  const tagHtml = entries
    .map(([k, v]) => `<span class="tag">${escapeHtml(k)}: ${escapeHtml(v)}</span>`)
    .join(" ");
  return `<div class="tags">${tagHtml}</div>`;
}

function renderMediaItem(item: MediaMeta): string {
  const safeId = escapeHtml(item.id);
  const typeBadge = `<span class="badge badge-type">${escapeHtml(item.mediaType)}</span>`;
  const accessBadge = item.publicDomain
    ? `<span class="badge badge-public">public domain</span>`
    : `<span class="badge badge-private">private</span>`;
  const size = item.sizeBytes > 0 ? `<span class="size">${formatSize(item.sizeBytes)}</span>` : "";

  return `<article class="media-item" id="media-${safeId}">
      <div class="media-header">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="badges">${typeBadge} ${accessBadge} ${size}</div>
      </div>
      ${renderTags(item.tags)}
      <div class="media-actions">
        <a href="#/view/${safeId}" class="btn btn-view" title="View metadata">View</a>
        <button class="btn btn-download" data-media-id="${safeId}" data-media-type="${escapeHtml(item.mediaType)}" title="Download file">Download</button>
      </div>
    </article>`;
}

export function renderHomeHtml(items: MediaMeta[]): string {
  if (items.length === 0) {
    return `
    <h2>Library</h2>
    <p id="no-media">No media found.</p>
  `;
  }

  const articles = items.map(renderMediaItem).join("\n      ");
  return `
    <h2>Library</h2>
    <div id="media-list">
      ${articles}
    </div>
  `;
}
