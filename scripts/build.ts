import { readdirSync } from "node:fs";
import { join } from "node:path";
import { editJson } from "./utils.ts";

const root = "dist";

for (const entry of readdirSync(`./${root}`)) {
  const dir = `./${root}/${entry}`;

  editJson(join(dir, "package.json"), (pkg) => {
    // Generate the exports entries (support for .js and .ts)
    const original = pkg.exports as Record<string, string>;
    pkg.exports = {};

    for (const [key, value] of Object.entries(original)) {
      const jsKey = key.replace(/\.ts$/, ".js");
      const jsValue = {
        types: value.replace(/^\.\//, "./build/").replace(/\.ts$/, ".d.ts"),
        import: value.replace(/^\.\//, "./build/").replace(/\.ts$/, ".js"),
      };
      pkg.exports[key] = jsValue;
      pkg.exports[jsKey] = jsValue;
    }

    // Binary
    if (pkg.bin) {
      for (const [key, value] of Object.entries(pkg.bin as Record<string, string>)) {
        pkg.bin[key] = value.replace(/^\.\//, "./build/").replace(/\.ts$/, ".js");
      }
    }

    // Remove dev stuff
    delete pkg.scripts;
    delete pkg.devDependencies;
  });
}
