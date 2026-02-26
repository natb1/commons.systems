export function nsCollectionPath(
  namespace: string,
  collectionName: string,
): string {
  if (!namespace) {
    throw new Error("namespace must not be empty");
  }
  if (!namespace.includes("/")) {
    throw new Error(
      `namespace must be in "{app}/{env}" format (got "${namespace}")`,
    );
  }
  if (!collectionName) {
    throw new Error("collectionName must not be empty");
  }
  return `${namespace}/${collectionName}`;
}
