import { doc, getDoc, setDoc } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { db, NAMESPACE } from "./firebase.js";

interface ReadingPosition {
  uid: string;
  mediaId: string;
  position: string;
}

function positionDocRef(uid: string, mediaId: string) {
  const path = nsCollectionPath(NAMESPACE, "reading-position");
  return doc(db, path, `${uid}_${mediaId}`);
}

export async function getReadingPosition(
  uid: string,
  mediaId: string,
): Promise<string | null> {
  const snap = await getDoc(positionDocRef(uid, mediaId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const position = typeof data?.position === "string" ? data.position : null;
  return position;
}

export async function saveReadingPosition(
  uid: string,
  mediaId: string,
  position: string,
): Promise<void> {
  await setDoc(positionDocRef(uid, mediaId), { uid, mediaId, position } satisfies ReadingPosition);
}
