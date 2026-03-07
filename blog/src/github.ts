const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

const cache = new Map<string, string>();

export async function fetchPost(appPath: string, filename: string): Promise<string> {
  if (!/^[a-z0-9][-a-z0-9]*\.md$/.test(filename)) {
    throw new Error(`Invalid post filename: ${filename}`);
  }
  const cacheKey = `${appPath}/${filename}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;
  const url = `https://raw.githubusercontent.com/natb1/commons.systems/${BRANCH}/${appPath}/${filename}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch post ${filename}: ${response.status}`);
  }
  const text = await response.text();
  cache.set(cacheKey, text);
  return text;
}

export function createFetchPost(appPath: string): (filename: string) => Promise<string> {
  return (filename) => fetchPost(appPath, filename);
}
