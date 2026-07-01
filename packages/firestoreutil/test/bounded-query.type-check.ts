import { boundedQuery } from "../src/bounded-query";
import type { Firestore } from "firebase/firestore";

declare const db: Firestore;
declare const path: string;

// Positive: bounding with .limit() then .getDocs() compiles.
void boundedQuery(db, path).where("a", "==", 1).limit(1).getDocs();
// Positive: bounding with .unbounded(reason) then .getDocs() compiles.
void boundedQuery(db, path).unbounded("reason").getDocs();

// Negative: .getDocs() is absent on an unbounded query (never bounded).
// @ts-expect-error - getDocs() is not reachable without .limit() or .unbounded()
void boundedQuery(db, path).getDocs();
// Negative: .where() keeps it unbounded, so .getDocs() is still absent.
// @ts-expect-error - getDocs() is not reachable on an UnboundedQuery even after .where()
void boundedQuery(db, path).where("a", "==", 1).getDocs();
