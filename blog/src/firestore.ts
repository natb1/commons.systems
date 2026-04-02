import { collection, getDocs, orderBy, query, where, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import {
  nsCollectionPath,
  type Namespace,
} from "@commons-systems/firestoreutil/namespace";
import { logError } from "@commons-systems/errorutil/log";
import { isInGroup, ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";

import type { PostMeta, PublishedPost } from "./post-types.ts";
export type { PostMeta, PublishedPost };
export { isPublished } from "./post-types.ts";

export interface GetPostsResult {
  posts: PostMeta[];
  skippedCount: number;
}

function toPostMeta(id: string, data: Record<string, unknown>): PostMeta | null {
  const title = typeof data.title === "string" ? data.title : "";
  const published = data.published === true;
  const publishedAt = typeof data.publishedAt === "string" ? data.publishedAt : null;
  const filename = typeof data.filename === "string" ? data.filename : "";
  const previewImage = typeof data.previewImage === "string" ? data.previewImage : undefined;
  const previewDescription = typeof data.previewDescription === "string" ? data.previewDescription : undefined;
  if (!title || !filename) {
    logError(new Error("Post missing required fields"), { operation: "post-validation", postId: id });
    return null;
  }
  if (published && publishedAt !== null) {
    if (isNaN(new Date(publishedAt).getTime())) {
      logError(new Error("Post has invalid publishedAt date"), { operation: "post-validation", postId: id });
      return null;
    }
    return { id, title, published: true, publishedAt, filename, previewImage, previewDescription };
  }
  if (published) {
    logError(new Error("Published post has no publishedAt date"), { operation: "post-validation", postId: id });
    return null;
  }
  return { id, title, published: false, publishedAt: null, filename, previewImage, previewDescription };
}

export async function getPosts(db: Firestore, namespace: Namespace, user: User | null): Promise<GetPostsResult> {
  const path = nsCollectionPath(namespace, "posts");
  const admin = await isInGroup(db, namespace, user, ADMIN_GROUP_ID);
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
