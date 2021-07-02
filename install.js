import { encode } from "./deps/base64.ts";
import { posix } from "./deps/path.ts";
import { brightGreen, gray, red } from "./deps/colors.ts";

const { join } = posix;
const baseUrl = new URL(".", import.meta.url).href;
const cli = join(baseUrl, "./cli/cli.ts");
const imports = {
  "lume/": join(baseUrl, "/"),
  "lume/plugins/attributes.js": join(baseUrl, "/plugins/attributes.ts"),
  "lume/plugins/base_path.js": join(baseUrl, "/plugins/base_path.ts"),
  "lume/plugins/bundler.js": join(baseUrl, "/plugins/bundler.ts"),
  "lume/plugins/code_highlight.js": join(baseUrl, "/plugins/code_highlight.ts"),
  "lume/plugins/date.js": join(baseUrl, "/plugins/date.ts"),
  "lume/plugins/inline.js": join(baseUrl, "/plugins/inline.ts"),
  "lume/plugins/jsx.js": join(baseUrl, "/plugins/jsx.ts"),
  "lume/plugins/postcss.js": join(baseUrl, "/plugins/postcss.ts"),
  "lume/plugins/pug.js": join(baseUrl, "/plugins/pug.ts"),
  "lume/plugins/relative_urls.js": join(baseUrl, "/plugins/relative_urls.ts"),
  "lume/plugins/slugify_urls.js": join(baseUrl, "/plugins/slugify_urls.ts"),
  "lume/plugins/svg.js": join(baseUrl, "/plugins/svgo.ts"),
  "lume/plugins/terser.js": join(baseUrl, "/plugins/terser.ts"),
  "lume/plugins/eta.js": join(baseUrl, "/plugins/eta.ts"),
};
const importMap = `data:application/json;base64,${
  encode(JSON.stringify({ imports }))
}`;
const minDenoVersion = "1.10.3";

if (Deno.version.deno < minDenoVersion) {
  console.log();
  console.error(red("Error installing Lume"));
  console.log("You have an old version of Deno");
  console.log(`Lume needs Deno ${brightGreen(minDenoVersion)} or greater`);
  console.log(`Your current version is ${red(Deno.version.deno)}`);
  console.log();
  console.log(`Run ${brightGreen("deno upgrade")} before install/upgrade Lume`);
  console.log();
  Deno.exit(1);
}

const process = Deno.run({
  cmd: [
    Deno.execPath(),
    "install",
    "--unstable",
    "-Af",
    `--import-map=${importMap}`,
    `--no-check`,
    "--name=lume",
    cli,
  ],
});

const status = await process.status();
process.close();

if (!status.success) {
  console.log();
  console.error(red("Error installing lume"));
  console.log(
    `You can report an issue at ${
      gray("https://github.com/lumeland/lume/issues/new")
    }`,
  );
  console.log(
    `Or get help at Discord: ${gray("https://discord.gg/YbTmpACHWB")}`,
  );
  console.log();
  Deno.exit(1);
}

console.log();
console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
console.log();
console.log(brightGreen(" lume installed successfully!"));
console.log();
console.log("    BENVIDO - WELCOME! 🎉🎉");
console.log();
console.log(gray("-------------------------------"));
console.log();
console.log(`Run ${brightGreen("lume --help")} for usage information`);
console.log(
  `See ${gray("https://lumeland.github.io/")} for online documentation`,
);
console.log(
  `See ${
    gray("https://discord.gg/YbTmpACHWB")
  } to propose new ideas and get help at Discord`,
);
console.log();
