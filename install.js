import { encode } from "./deps/base64.js";
import { join } from "./deps/path.js";
import { brightGreen, gray, red } from "./deps/colors.js";

const baseUrl = new URL(".", import.meta.url).href;
const cli = join(baseUrl, "./cli.js");
const importMap = `data:aplication/json;base64,${
  encode(`{"imports":{"lume/":"${join(baseUrl, "/")}"}}`)
}`;

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
