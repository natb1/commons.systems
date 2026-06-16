import { escapeHtml } from "@commons-systems/htmlutil";
import type { MediaType } from "./types.js";

/** Media-type badge span, shared by the cloud and local media-list rows. */
export function mediaTypeBadge(mediaType: MediaType): string {
  return `<span class="media-badge">${escapeHtml(mediaType)}</span>`;
}
