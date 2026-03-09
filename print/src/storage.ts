import { getDownloadURL, ref } from "firebase/storage";
import { storage, STORAGE_NAMESPACE } from "./firebase.js";

export async function getMediaDownloadUrl(storagePath: string): Promise<string> {
  const fullPath = `${STORAGE_NAMESPACE}/${storagePath}`;
  const storageRef = ref(storage, fullPath);
  return getDownloadURL(storageRef);
}
