export interface AuthUser {
  email: string;
  password: string;
  displayName: string;
}

export async function seedAuthUser(
  emulatorHost: string,
  user: AuthUser,
): Promise<void> {
  const url = `http://${emulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const body = (await res.json()) as {
    error?: { message?: string };
  };
  if (!res.ok && body.error?.message !== "EMAIL_EXISTS") {
    throw new Error(`Failed to seed auth user: ${JSON.stringify(body)}`);
  }
}
