import { copyFolder, fromJsr, getZipFiles, remove, saveFile } from "./utils.ts";

const lumeZip = "https://github.com/lumeland/lume/archive/refs/heads/main.zip";

// Remove previous packages
await remove("packages", ["lume", "dom"]);

// Create @lumeland/dom from @b-fuze/deno-dom
for await (const file of fromJsr("@b-fuze/deno-dom")) {
  if (file.name === "/package.json") {
    await saveFile(
      "packages/dom",
      file.name,
      replaceJson(await file.text(), (json) => {
        json.name = "@lumeland/dom";
        json.description =
          "Migration of jsr:@b-fuze/deno-dom package to be installed directly from NPM";
        delete json.dependencies;
        delete json.exports["./native"];
      }),
    );
    continue;
  }

  if (!file.name.startsWith("/test/")) {
    await saveFile("packages/dom", file.name, await file.text());
    continue;
  }
}

// Lume dependency files
const deps = new Set([
  "cli",
  "colors",
  "yaml",
  "front_matter",
  "path",
  "lightningcss",
  "esbuild",
  "jsonc",
  "toml",
  "remove-markdown",
  "crypto",
  "dom",
  "module",
  "sharp",
  "resvg",
  "semver",
  "media_types",
]);

// Download and generate @lumeland/lume
for await (const file of getZipFiles(lumeZip, () => true)) {
  if (file.name.startsWith("/core/")) {
    await saveFile("packages/lume", file.name, await file.text());
    continue;
  }

  if (file.name.startsWith("/middlewares/")) {
    await saveFile("packages/lume", file.name, await file.text());
    continue;
  }

  if (file.name === "/types.ts") {
    await saveFile("packages/lume", file.name, await file.text());
    continue;
  }

  const name = file.name.match(/^\/deps\/(\w+).ts$/);

  if (name) {
    const filename = name[1];

    if (filename === "dom") {
      await saveFile("packages/lume", file.name, `export * from "@lumeland/dom";`);
      continue;
    }

    if (name && deps.has(name[1])) {
      await saveFile("packages/lume", file.name, replaceSpecifiers(await file.text()));
      continue;
    }
  }
}

await saveFile(
  "packages/lume",
  "package.json",
  JSON.stringify(
    {
      name: "@lumeland/lume",
      version: "1.0.0",
      description: "",
      main: "index.js",
      license: "MIT",
      type: "module",
      exports: {
        "./*.ts": "./*.ts",
      },
      dependencies: {
        "deno-std": "1.4.0",
        lightningcss: "1.33.0",
        esbuild: "0.28.2",
        "remove-markdown": "0.8.0",
        sharp: "0.35.5",
        "@resvg/resvg-wasm": "2.6.2",
        "@lumeland/dom": "workspace:*",
      },
    },
    null,
    2,
  ),
);

copyFolder("scripts/services", "packages/lume/services");

function replaceSpecifiers(code: string): string {
  return code
    .replaceAll(
      /"jsr:@std\/([\w-]+)@[\d.]+(\/[\w-]+)?";/g,
      (_, name, file) =>
        `"deno-std/${name.replaceAll("-", "_")}${file?.replaceAll("-", "_") ?? ""}.js";`,
    )
    .replaceAll(/"npm:(@?[^@]+)@[\d.]+(\/[^"]+)?";/g, (_, name, file) => `"${name}${file ?? ""}";`);
}

function replaceJson(code: string, callback: (arg: any) => any): string {
  const json = JSON.parse(code);
  callback(json);
  return JSON.stringify(json, null, 2);
}
