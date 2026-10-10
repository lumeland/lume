import process from "node:process";
import { saveFile } from "./utils.ts";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const name = process.argv[2];

if (!name) {
  throw new Error("Missing plugin name");
}

const pkg = {
  name: `@lumeland/plugin-${name}`,
  version: "1.0.0",
  description: "",
  license: "MIT",
  type: "module",
  exports: {
    ".": "./src/mod.ts",
    "./*.ts": "./src/*.ts",
  },
  scripts: {
    test: "vitest run",
    "test:watch": "vitest",
    "test:update": "vitest run -u",
  },
  peerDependencies: {
    "@lumeland/core": "workspace:*",
  },
  devDependencies: {
    "@lumeland/testing": "workspace:*",
    "@types/node": "^26.6.4",
    vitest: "^5.0.3",
  },
};

const root = `packages/plugin-${name}`;

await saveFile(root, "package.json", JSON.stringify(pkg, null, 2));
await saveFile(
  root,
  ".npmignore",
  `tests
`,
);
await saveFile(root, "src/mod.ts", "");
await saveFile(
  root,
  `tests/${name}.test.ts`,
  `import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";

describe("${name} plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    expect(await build(site)).toMatchSnapshot();
  });
});
`,
);

mkdirSync(join(root, "deps"));
