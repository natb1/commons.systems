import { createAppAuth, type User } from "@commons-systems/authutil/app-auth";
import { app } from "./firebase.js";

export const { signIn, signOut, onAuthStateChanged } = createAppAuth(app);
export type { User };
