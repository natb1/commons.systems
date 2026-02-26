const BRANCH = import.meta.env.VITE_GITHUB_BRANCH ?? "main";
const BASE = `https://raw.githubusercontent.com/natb1/commons.systems/${BRANCH}/landing/post`;

const cache = new Map<string, string>();

export async function fetchPost(filename: string): Promise<string> {
  const cached = cache.get(filename);
  if (cached !== undefined) return cached;
  const response = await fetch(`${BASE}/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch post ${filename}: ${response.status}`);
  }
  const text = await response.text();
  cache.set(filename, text);
  return text;
}
