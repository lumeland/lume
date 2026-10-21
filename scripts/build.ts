import { readdirSync } from "node:fs";
import { editJson } from "./utils.ts";

const root = "dist";

for (const entry of readdirSync(`./${root}`, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const dir = `./${root}/${entry.name}`;

  editJson(dir, "package.json", (pkg) => {
    // Generate the exports entries (support for .js and .ts)
    const exports = pkg.exports as Record<string, string> | undefined;
    if (exports) {
      pkg.exports = {};

      for (const [key, value] of Object.entries(exports)) {
        const jsKey = key.replace(/\.ts$/, ".js");
        const jsValue = {
          types: value.replace(/^\.\//, "./build/").replace(/\.ts$/, ".d.ts"),
          import: value.replace(/^\.\//, "./build/").replace(/\.ts$/, ".js"),
        };
        pkg.exports[key] = jsValue;
        pkg.exports[jsKey] = jsValue;
      }
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
    delete pkg.devEngines;
  });
}
