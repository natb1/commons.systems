import { createFirebaseAuth } from "@commons-systems/authutil/firebase-auth";
import { app } from "./firebase.js";

const emulatorHost = import.meta.env.VITE_AUTH_EMULATOR_HOST;

export const { auth, signIn, signOut, onAuthStateChanged } = createFirebaseAuth(
  app,
  emulatorHost ? { emulatorHost } : undefined,
);
export type { User } from "firebase/auth";
