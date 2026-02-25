import type { User } from "firebase/auth";
import { escapeHtml } from "../escape-html.js";
import { getPosts } from "../firestore.js";

export async function renderHome(user: User | null): Promise<string> {
  let postsHtml: string;
  try {
    const posts = await getPosts(user);
    if (posts.length === 0) {
      postsHtml = "<p>No posts yet.</p>";
    } else {
      const items = posts
        .map((p) => {
          const dateHtml = p.publishedAt
            ? `<time datetime="${escapeHtml(p.publishedAt)}">${escapeHtml(
                new Date(p.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              )}</time>`
            : "";
          const draft = !p.published
            ? ` <span class="draft-badge">[draft]</span>`
            : "";
          return `<li><a href="#/post/${escapeHtml(p.id)}">${escapeHtml(p.title)}</a>${draft} ${dateHtml}</li>`;
        })
        .join("\n        ");
      postsHtml = `<ul id="posts">\n        ${items}\n      </ul>`;
    }
  } catch (error) {
    console.error("Failed to load posts:", error);
    postsHtml = '<p id="posts-error">Could not load posts</p>';
  }

  return `
    <h2>Home</h2>
    ${postsHtml}
  `;
}
