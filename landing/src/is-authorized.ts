import type { User } from "firebase/auth";

// Firebase Auth User objects include reloadUserInfo.screenName for GitHub
// providers, but this property is not part of the public User type. We check
// it first (most reliable), then fall back to providerData.uid.
export function isAuthorized(user: User | null): boolean {
  if (!user) return false;
  const info = (user as Record<string, unknown>)["reloadUserInfo"];
  if (info && typeof info === "object" && "screenName" in info) {
    if ((info as Record<string, unknown>).screenName === "natb1") return true;
  }
  return user.providerData.some((p) => p.uid === "natb1");
}
