import type { User } from "firebase/auth";

// Firebase Auth User objects include reloadUserInfo.screenName for GitHub
// providers, but this property is not part of the public User type. We check
// it first because screenName contains the GitHub username directly. The
// fallback uses providerData.displayName since providerData.uid may contain
// a numeric GitHub user ID instead of the username.

interface ReloadUserInfo {
  screenName?: string;
}

function getScreenName(user: User): string | undefined {
  const info = (user as unknown as { reloadUserInfo?: ReloadUserInfo }).reloadUserInfo;
  return info?.screenName;
}

export function isAuthorized(user: User | null): boolean {
  if (!user) return false;
  if (getScreenName(user) === "natb1") return true;
  return user.providerData.some((p) => p.displayName === "natb1");
}
