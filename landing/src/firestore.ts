import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";
import { isAuthorized } from "./is-authorized.js";

export type PostMeta =
  | { id: string; title: string; published: true; publishedAt: string; filename: string }
  | { id: string; title: string; published: false; publishedAt: null; filename: string };

export interface GetPostsResult {
  posts: PostMeta[];
  skippedCount: number;
}

function toPostMeta(id: string, data: Record<string, unknown>): PostMeta | null {
  const title = typeof data.title === "string" ? data.title : "";
  const published = data.published === true;
  const publishedAt = typeof data.publishedAt === "string" ? data.publishedAt : null;
  const filename = typeof data.filename === "string" ? data.filename : "";
  if (!title || !filename) {
    console.error(`Post "${id}" has missing required fields:`, data);
    return null;
  }
  if (published && publishedAt !== null) {
    if (isNaN(new Date(publishedAt).getTime())) {
      console.error(`Post "${id}" has invalid publishedAt date:`, data);
      return null;
    }
    return { id, title, published: true, publishedAt, filename };
  }
  if (published) {
    console.error(`Post "${id}" is published but has no publishedAt date:`, data);
    return null;
  }
  return { id, title, published: false, publishedAt: null, filename };
}

export async function getPosts(user: User | null): Promise<GetPostsResult> {
  const path = nsCollectionPath(NAMESPACE, "posts");
  const admin = isAuthorized(user);
  const q = admin
    ? query(collection(db, path), orderBy("publishedAt", "desc"))
    : query(collection(db, path), where("published", "==", true));
  const snapshot = await getDocs(q);
  const posts: PostMeta[] = [];
  let skippedCount = 0;
  for (const d of snapshot.docs) {
    const post = toPostMeta(d.id, d.data());
    if (post) {
      posts.push(post);
    } else {
      skippedCount++;
    }
  }
  if (!admin) {
    posts.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  }
  return { posts, skippedCount };
}
