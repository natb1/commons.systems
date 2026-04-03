import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const projects: string[] = pkg.workspaces.filter(
  (w: string) => w !== "rules-test",
);

export default projects;
