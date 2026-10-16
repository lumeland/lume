import { readdirSync } from "node:fs";
import { saveFile } from "./utils.ts";

const root = "packages";

for (const entry of readdirSync(`./${root}`)) {
  if (entry.startsWith(".")) {
    continue;
  }
  const dir = `./${root}/${entry}`;
}
