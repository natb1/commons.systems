import { getDownloadURL, ref } from "firebase/storage";
import { storage, NAMESPACE } from "./firebase.js";

export async function getMediaDownloadUrl(storagePath: string): Promise<string> {
  const fullPath = `${NAMESPACE}/${storagePath}`;
  const storageRef = ref(storage, fullPath);
  return getDownloadURL(storageRef);
}
