import type { User } from "firebase/auth";

export function makeUser(overrides: {
  screenName?: string;
  providerUid?: string;
  displayName?: string | null;
}): User {
  return {
    displayName: overrides.displayName ?? null,
    reloadUserInfo: { screenName: overrides.screenName },
    providerData: overrides.providerUid
      ? [{ uid: overrides.providerUid }]
      : [],
  } as unknown as User;
}
