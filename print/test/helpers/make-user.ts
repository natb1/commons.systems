import type { User } from "firebase/auth";

export function makeUser(overrides: {
  uid?: string;
  screenName?: string;
  providerUid?: string;
  providerDisplayName?: string;
  displayName?: string | null;
}): User {
  return {
    uid: overrides.uid ?? "test-uid",
    displayName: overrides.displayName ?? null,
    reloadUserInfo: { screenName: overrides.screenName },
    providerData:
      overrides.providerUid || overrides.providerDisplayName
        ? [
            {
              uid: overrides.providerUid ?? "uid",
              displayName: overrides.providerDisplayName ?? null,
            },
          ]
        : [],
  } as unknown as User;
}
