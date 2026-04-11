import { logError } from "@commons-systems/errorutil/log";
import { getMediaDownloadUrl } from "./storage.js";
import { titleToFilename } from "./slug.js";

export async function handleMarkdownDownload(storagePath: string, title: string): Promise<void> {
  const url = await getMediaDownloadUrl(storagePath);
  const a = document.createElement("a");
  a.href = url;
  a.download = titleToFilename(title);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function handleMarkdownCopy(storagePath: string, button: HTMLButtonElement): Promise<void> {
  const originalText = button.textContent;
  button.disabled = true;
  try {
    const url = await getMediaDownloadUrl(storagePath);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch markdown: ${res.status}`);
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied!";
    setTimeout(() => { button.textContent = originalText; }, 1500);
  } catch (error) {
    logError(error, { operation: "copy-markdown" });
    const container = button.closest(".media-actions, .viewer-md-actions");
    if (container) {
      const existing = container.querySelector(".copy-error");
      if (!existing) {
        const msg = document.createElement("p");
        msg.className = "copy-error";
        msg.textContent = "Copy failed. Please try again.";
        container.appendChild(msg);
      }
    }
  } finally {
    button.disabled = false;
  }
}
