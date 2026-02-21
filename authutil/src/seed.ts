export interface AuthUser {
  localId: string;
  email: string;
  displayName: string;
}

export async function seedAuthUser(
  emulatorHost: string,
  user: AuthUser,
): Promise<void> {
  const baseUrl = `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`;

  // Step 1: Create user via the admin API (emulator accepts "Bearer owner")
  const createRes = await fetch(
    `${baseUrl}/projects/commons-systems/accounts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({
        localId: user.localId,
        email: user.email,
        displayName: user.displayName,
      }),
    },
  );
  if (!createRes.ok) {
    const body = await createRes.json();
    // Ignore duplicate — user already exists
    if (body.error?.message !== "DUPLICATE_LOCAL_ID") {
      throw new Error(`Failed to create auth user: ${JSON.stringify(body)}`);
    }
  }

  // Step 2: Link GitHub provider via admin update endpoint.
  // The field name is "linkProviderUserInfo" (singular object), not "providerUserInfo".
  const updateRes = await fetch(
    `${baseUrl}/projects/commons-systems/accounts:update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({
        localId: user.localId,
        linkProviderUserInfo: {
          providerId: "github.com",
          rawId: user.localId,
          email: user.email,
          displayName: user.displayName,
        },
      }),
    },
  );
  if (!updateRes.ok) {
    const body = await updateRes.json();
    throw new Error(`Failed to link GitHub provider: ${JSON.stringify(body)}`);
  }
}
