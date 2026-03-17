export type Namespace = string & { readonly __brand: unique symbol };

export function validateNamespace(namespace: string): Namespace {
  if (!namespace) {
    throw new Error("namespace must not be empty");
  }
  const parts = namespace.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `namespace must be in "{app}/{env}" format (got "${namespace}")`,
    );
  }
  return namespace as Namespace;
}

export function nsCollectionPath(
  namespace: string,
  collectionName: string,
): string {
  validateNamespace(namespace);
  if (!collectionName) {
    throw new Error("collectionName must not be empty");
  }
  return `${namespace}/${collectionName}`;
}
