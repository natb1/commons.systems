import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, NAMESPACE } from "./firebase.js";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

export interface PostMeta {
  id: string;
  title: string;
  published: boolean;
  publishedAt: string | null;
  filename: string;
}

function isNatb1(user: User | null): boolean {
  if (!user) return false;
  const screenName = (
    user as unknown as { reloadUserInfo?: { screenName?: string } }
  ).reloadUserInfo?.screenName;
  if (screenName === "natb1") return true;
  return user.providerData.some((p) => p.uid === "natb1");
}

export async function getPosts(user: User | null): Promise<PostMeta[]> {
  const path = nsCollectionPath(NAMESPACE, "posts");
  const q = isNatb1(user)
    ? query(collection(db, path), orderBy("publishedAt"))
    : query(collection(db, path), where("published", "==", true));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title as string,
      published: data.published as boolean,
      publishedAt: (data.publishedAt as string) ?? null,
      filename: data.filename as string,
    };
  });
  if (isNatb1(user)) return posts;
  return posts
    .filter((p) => p.published)
    .sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return a.publishedAt.localeCompare(b.publishedAt);
    });
}

export async function getPostMeta(slug: string): Promise<PostMeta | null> {
  const path = nsCollectionPath(NAMESPACE, "posts");
  const ref = doc(db, path, slug);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title as string,
    published: data.published as boolean,
    publishedAt: (data.publishedAt as string) ?? null,
    filename: data.filename as string,
  };
}
