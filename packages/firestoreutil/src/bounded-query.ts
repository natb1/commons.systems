import {
  collection,
  query,
  where as whereConstraint,
  orderBy as orderByConstraint,
  limit as limitConstraint,
  getDocs as sdkGetDocs,
} from "firebase/firestore";
import type {
  Firestore,
  QueryConstraint,
  QuerySnapshot,
  DocumentData,
  WhereFilterOp,
  OrderByDirection,
  FieldPath,
} from "firebase/firestore";

/**
 * A query that has NOT yet been bounded. It has no terminal fetch method — the
 * only way to run it is to first pick a bound with `.limit(n)` or
 * `.unbounded(reason)`, which returns a {@link BoundedQuery}. Because
 * `.getDocs()` lives only on `BoundedQuery`, an accidentally-unbounded
 * collection scan is a compile error: the type IS the enforcement.
 */
export interface UnboundedQuery {
  where(field: string | FieldPath, opStr: WhereFilterOp, value: unknown): UnboundedQuery;
  orderBy(field: string | FieldPath, direction?: OrderByDirection): UnboundedQuery;
  /** Bound the scan to at most `n` documents, unlocking `.getDocs()`. */
  limit(n: number): BoundedQuery;
  /**
   * Escape hatch: acknowledge that this query is intentionally a full
   * collection scan. Appends no constraint — it only unlocks `.getDocs()` and
   * documents, via `reason`, why an unbounded scan is acceptable here. `reason`
   * must be non-empty.
   */
  unbounded(reason: string): BoundedQuery;
}

/**
 * A query that HAS been bounded (via `.limit(n)` or `.unbounded(reason)`) and so
 * exposes the terminal `.getDocs()`. Further `.where()` / `.orderBy()` calls
 * keep constraining while remaining bounded.
 */
export interface BoundedQuery {
  where(field: string | FieldPath, opStr: WhereFilterOp, value: unknown): BoundedQuery;
  orderBy(field: string | FieldPath, direction?: OrderByDirection): BoundedQuery;
  /**
   * The only method that runs the query. Returns the raw {@link QuerySnapshot}
   * (unmapped) so this is a drop-in replacement for
   * `const snapshot = await getDocs(q)`.
   */
  getDocs(): Promise<QuerySnapshot<DocumentData>>;
}

class QueryBuilder implements UnboundedQuery, BoundedQuery {
  private readonly db: Firestore;
  private readonly path: string;
  private readonly constraints: QueryConstraint[];

  constructor(db: Firestore, path: string, constraints: QueryConstraint[] = []) {
    this.db = db;
    this.path = path;
    this.constraints = constraints;
  }

  where(field: string | FieldPath, opStr: WhereFilterOp, value: unknown): this {
    this.constraints.push(whereConstraint(field, opStr, value));
    return this;
  }

  orderBy(field: string | FieldPath, direction?: OrderByDirection): this {
    this.constraints.push(orderByConstraint(field, direction));
    return this;
  }

  limit(n: number): BoundedQuery {
    this.constraints.push(limitConstraint(n));
    return this;
  }

  unbounded(reason: string): BoundedQuery {
    if (reason.trim() === "") {
      throw new Error(
        "boundedQuery: unbounded() requires a non-empty reason documenting why a full collection scan is acceptable.",
      );
    }
    return this;
  }

  async getDocs(): Promise<QuerySnapshot<DocumentData>> {
    const q = query(collection(this.db, this.path), ...this.constraints);
    return sdkGetDocs(q);
  }
}

/**
 * The DEFAULT way to query a collection in this codebase. Start here with a
 * namespaced collection `path` (as derived by `nsCollectionPath`, matching the
 * `collection(db, path)` convention in `media-queries.ts`), chain
 * `.where()` / `.orderBy()`, then bound the scan with `.limit(n)` or
 * `.unbounded(reason)` to unlock the terminal `.getDocs()`.
 *
 * `.getDocs()` is reachable ONLY after `.limit(n)` or `.unbounded(reason)`, so
 * an unbounded collection scan cannot be expressed by accident — it is a
 * compile error. `.unbounded(reason)` is the deliberate escape hatch: the query
 * is intentionally a full scan and `reason` records why that is acceptable.
 */
export function boundedQuery(db: Firestore, path: string): UnboundedQuery {
  return new QueryBuilder(db, path);
}
