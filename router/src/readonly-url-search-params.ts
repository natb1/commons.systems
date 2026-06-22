/** Immutable `URLSearchParams` whose four mutators throw — internal to the location store; see `location-store.ts` for context. */
export class ReadonlyURLSearchParams extends URLSearchParams {
  private static readonly MESSAGE =
    "ReadonlyURLSearchParams: location params are read-only; do not mutate the URLSearchParams returned by useLocation()/getSnapshot()";

  set(_name: string, _value: string): void {
    throw new TypeError(ReadonlyURLSearchParams.MESSAGE);
  }

  append(_name: string, _value: string): void {
    throw new TypeError(ReadonlyURLSearchParams.MESSAGE);
  }

  delete(_name: string): void {
    throw new TypeError(ReadonlyURLSearchParams.MESSAGE);
  }

  sort(): void {
    throw new TypeError(ReadonlyURLSearchParams.MESSAGE);
  }
}
