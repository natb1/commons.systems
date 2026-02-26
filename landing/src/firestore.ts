import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, NAMESPACE } from "./firebase.js";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { isAuthorized } from "./is-authorized.js";

export interface PostMeta {
  id: string;
  title: string;
  published: boolean;
  publishedAt: string | null;
  filename: string;
}

function toPostMeta(id: string, data: Record<string, unknown>): PostMeta {
  const title = typeof data.title === "string" ? data.title : "";
  const published = data.published === true;
  const publishedAt = typeof data.publishedAt === "string" ? data.publishedAt : null;
  const filename = typeof data.filename === "string" ? data.filename : "";
  if (!title || !filename) {
    console.error(`Post "${id}" has missing required fields:`, data);
  }
  return { id, title, published, publishedAt, filename };
}

export async function getPosts(user: User | null): Promise<PostMeta[]> {
  const path = nsCollectionPath(NAMESPACE, "posts");
  const q = isAuthorized(user)
    ? query(collection(db, path), orderBy("publishedAt"))
    : query(collection(db, path), where("published", "==", true));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((d) => toPostMeta(d.id, d.data()));
  if (isAuthorized(user)) return posts;
  return posts
    .filter((p) => p.published)
    .sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return a.publishedAt.localeCompare(b.publishedAt);
    });
}
