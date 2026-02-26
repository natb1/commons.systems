import type { User } from "firebase/auth";

export function isAuthorized(user: User | null): boolean {
  if (!user) return false;
  const screenName = (
    user as unknown as { reloadUserInfo?: { screenName?: string } }
  ).reloadUserInfo?.screenName;
  if (screenName === "natb1") return true;
  return user.providerData.some((p) => p.uid === "natb1");
}
