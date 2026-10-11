import { readdirSync } from "node:fs";
import { join } from "node:path";
import { editJson } from "./utils.ts";

const root = "packages";

for (const entry of readdirSync(`./${root}`)) {
  if (entry.startsWith(".")) {
    continue;
  }
  const dir = `./${root}/${entry}`;

  editJson(join(dir, "package.json"), (pkg) => {
    pkg.files = ["build"];
  });
}
