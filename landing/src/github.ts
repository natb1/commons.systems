const BRANCH = import.meta.env.VITE_GITHUB_BRANCH ?? "main";
const BASE = `https://raw.githubusercontent.com/natb1/commons.systems/${BRANCH}/landing/post`;

export async function fetchPost(filename: string): Promise<string> {
  const response = await fetch(`${BASE}/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch post ${filename}: ${response.status}`);
  }
  return response.text();
}
