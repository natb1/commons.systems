import { doc, getDoc, setDoc } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { db, NAMESPACE } from "./firebase.js";

export interface Bookmark {
  position: string;
  label: string;
}

interface BookmarksDoc {
  uid: string;
  mediaId: string;
  bookmarks: Bookmark[];
}

function bookmarksDocRef(uid: string, mediaId: string) {
  const path = nsCollectionPath(NAMESPACE, "bookmarks");
  return doc(db, path, `${uid}_${mediaId}`);
}

export async function getBookmarks(
  uid: string,
  mediaId: string,
): Promise<Bookmark[]> {
  const snap = await getDoc(bookmarksDocRef(uid, mediaId));
  if (!snap.exists()) return [];
  const data = snap.data();
  if (!Array.isArray(data?.bookmarks)) return [];
  return data.bookmarks
    .filter(
      (e: unknown): e is Bookmark =>
        typeof (e as Bookmark)?.position === "string" &&
        typeof (e as Bookmark)?.label === "string",
    )
    .map((e: Bookmark) => ({ position: e.position, label: e.label }));
}

export async function saveBookmarks(
  uid: string,
  mediaId: string,
  bookmarks: Bookmark[],
): Promise<void> {
  await setDoc(bookmarksDocRef(uid, mediaId), {
    uid,
    mediaId,
    bookmarks,
  } satisfies BookmarksDoc);
}
