import type { User } from "firebase/auth";

import { createRouter } from "./router.js";
import { renderHomeHtml } from "./pages/home.js";
import { renderView } from "./pages/view.js";
import { renderNav } from "./components/nav.js";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import { getMedia, type MediaMeta } from "./firestore.js";
import { getMediaDownloadUrl } from "./storage.js";
import { escapeHtml } from "./escape-html.js";

const nav = document.getElementById("nav");
const app = document.getElementById("app");

let currentUser: User | null = null;
let cachedMedia: MediaMeta[] = [];

function handleClick(action: () => Promise<void>, label: string): (e: Event) => void {
  return function (e: Event): void {
    e.preventDefault();
    const btn = e.currentTarget;
    action().catch((err) => {
      console.error(`${label} failed:`, err);
      if (btn instanceof HTMLElement) btn.textContent = `${label} failed — try again`;
    });
  };
}

function updateNav(): void {
  if (!nav) return;
  nav.innerHTML = renderNav(currentUser);
  document.getElementById("sign-in")?.addEventListener("click", handleClick(signIn, "Sign-in"));
  document.getElementById("sign-out")?.addEventListener("click", handleClick(signOut, "Sign-out"));
}

async function handleDownload(mediaId: string, mediaType: string): Promise<void> {
  const url = await getMediaDownloadUrl(mediaId, mediaType as MediaMeta["mediaType"]);
  window.open(url, "_blank");
}

function attachDownloadHandlers(outlet: HTMLElement): void {
  outlet.querySelectorAll<HTMLButtonElement>(".btn-download").forEach((btn) => {
    const mediaId = btn.dataset.mediaId;
    const mediaType = btn.dataset.mediaType;
    if (!mediaId || !mediaType) return;
    btn.addEventListener("click", () => {
      btn.disabled = true;
      btn.textContent = "Loading...";
      let failed = false;
      handleDownload(mediaId, mediaType)
        .catch((err) => {
          failed = true;
          console.error("Download failed:", err);
          btn.textContent = "Download failed";
        })
        .finally(() => {
          btn.disabled = false;
          if (!failed) btn.textContent = "Download";
        });
    });
  });
}

async function loadMedia(): Promise<string> {
  try {
    const result = await getMedia(currentUser);
    cachedMedia = result.items;
    return renderHomeHtml(cachedMedia);
  } catch (error) {
    console.error("Failed to load media:", error);
    const msg = (error as { code?: string })?.code === "permission-denied"
      ? "Permission denied loading media."
      : "Could not load media. Try refreshing the page.";
    return `
    <h2>Library</h2>
    <p id="media-error">${msg}</p>
  `;
  }
}

updateNav();

if (app) {
  const navigate = createRouter(
    app,
    [
      {
        path: /^\/(?:view\/.*)?$/,
        render: (hash) => {
          if (hash.startsWith("/view/")) {
            const mediaId = hash.slice(6);
            const item = cachedMedia.find((m) => m.id === mediaId);
            if (item) return renderView(item);
            // Item not cached yet — load media first, then render view
            return loadMedia().then(() => {
              const found = cachedMedia.find((m) => m.id === mediaId);
              return renderView(found);
            });
          }
          return loadMedia();
        },
        afterRender: (outlet) => attachDownloadHandlers(outlet),
      },
      {
        path: "/admin",
        render: () => {
          const user = currentUser;
          return user
            ? `<h2>Admin</h2><p>Signed in as ${escapeHtml(user.displayName ?? user.email ?? "User")}</p>`
            : `<h2>Admin</h2><p>Sign in to access admin features.</p>`;
        },
      },
    ],
    { onNavigate: updateNav },
  );

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateNav();
    navigate();
  });
} else {
  console.error("Fatal: #app element not found");
}
