import { createFirebaseAuth } from "@commons-systems/authutil/firebase-auth";
import { app } from "./firebase.js";

const emulatorHost = import.meta.env.VITE_AUTH_EMULATOR_HOST;
const firebaseAuth = createFirebaseAuth(app, emulatorHost ? { emulatorHost } : undefined);

export const { auth, signIn, signOut, onAuthStateChanged } = firebaseAuth;
export type { User } from "firebase/auth";
