declare const __brand: unique symbol;
export type Brand<B extends string> = string & { readonly [__brand]: B };
