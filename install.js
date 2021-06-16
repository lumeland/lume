import { encode } from "./deps/base64.ts";
import { posix } from "./deps/path.ts";
import { brightGreen, gray, red } from "./deps/colors.ts";

const baseUrl = new URL(".", import.meta.url).href;
const cli = posix.join(baseUrl, "./cli.js");
const importMap = `data:application/json;base64,${
  encode(`{ "imports": { "lume/": "${posix.join(baseUrl, "/")}" } }`)
}`;

const minDenoVersion = "1.10.3";

if (Deno.version.deno < minDenoVersion) {
  console.log();
  console.error(red("Error installing lume"));
  console.log("You have an old version of Deno");
  console.log(`Lume needs Deno ${brightGreen(minDenoVersion)} or greater`);
  console.log(`Your current version is ${red(Deno.version.deno)}`);
  console.log();
  console.log(`Run ${brightGreen("deno upgrade")} before install Lume`);
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
