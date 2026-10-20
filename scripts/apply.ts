import { readdirSync } from "node:fs";
import { editJson } from "./utils.ts";

const root = "packages";

for (const entry of readdirSync(`./${root}`)) {
  if (entry.startsWith(".")) {
    continue;
  }
  const dir = `./${root}/${entry}`;

  // Bump beta version
  editJson(dir, "package.json", (data) => {
    // data.files = Array.from(new Set(["build", "CHANGELOG.md", ...(data.files ?? [])]));

    // if (data.name.startsWith("@lumeland/plugin-")) {
    //   data.homepage = `https://lume.land/plugins/${data.name.slice(17)}/`;
    // }

    const [version, beta] = data.version.split("-beta-");
    if (beta) {
      data.version = `${version}-beta-${parseInt(beta) + 1}`;
    }
  });
}
