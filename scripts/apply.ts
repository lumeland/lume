import { readdirSync } from "node:fs";
import { editJson, editText, getJson } from "./utils.ts";

const root = "packages";

for (const entry of readdirSync(`./${root}`)) {
  if (entry.startsWith(".")) {
    continue;
  }
  const dir = `./${root}/${entry}`;
  const json = getJson(dir, "package.json");
  editText(dir, "README.md", (text) => {
    if (json.name === "@lumeland/lume") {
      return text;
    }

    const pluginSlug = json.name.startsWith("@lumeland/plugin-") ? json.name.slice(17) : undefined;

    return [
      `# ${json.name}`,
      "",
      json.description,
      "",
      pluginSlug ? `More info at https://lume.land/plugins/${pluginSlug}` : "",
      "",
      "---",
      "",
      "Please see [CHANGELOG](CHANGELOG.md) for information about the recent changes.",
    ];
  });

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
