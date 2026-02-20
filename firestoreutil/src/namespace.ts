export function nsCollectionPath(
  namespace: string,
  collectionName: string,
): string {
  if (!namespace) {
    throw new Error("namespace must not be empty");
  }
  if (!collectionName) {
    throw new Error("collectionName must not be empty");
  }
  return `ns/${namespace}/${collectionName}`;
}
