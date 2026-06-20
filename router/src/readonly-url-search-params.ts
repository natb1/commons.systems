/**
 * Immutable `URLSearchParams` for cached location snapshots. The location store
 * caches a `Snapshot` per URL and hands out its `params` by stable reference so
 * React's `useSyncExternalStore` `Object.is` bailout works. A plain
 * `URLSearchParams` is mutable, so any consumer calling `.set()`/`.append()`/
 * `.delete()`/`.sort()` would mutate the SHARED cached snapshot in place,
 * silently corrupting location state for every other reader and producing stale
 * UI React cannot detect.
 *
 * Wrapping the snapshot's params in this subclass keeps referential stability
 * while turning that silent corruption into a clear immediate error: the four
 * mutator methods throw. All read methods stay inherited and fully functional.
 * This is internal (not in the package `exports` map), mirroring
 * `location-store.ts`.
 */
export class ReadonlyURLSearchParams extends URLSearchParams {
  private static readonly MESSAGE =
    "ReadonlyURLSearchParams: location params are read-only; do not mutate the URLSearchParams returned by useLocation()/getSnapshot()";

  set(): void {
    throw new TypeError(ReadonlyURLSearchParams.MESSAGE);
  }

  append(): void {
    throw new TypeError(ReadonlyURLSearchParams.MESSAGE);
  }

  delete(): void {
    throw new TypeError(ReadonlyURLSearchParams.MESSAGE);
  }

  sort(): void {
    throw new TypeError(ReadonlyURLSearchParams.MESSAGE);
  }
}
