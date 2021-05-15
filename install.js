import { brightGreen, gray, red } from "./deps/colors.js";

const cli = new URL("./cli.js", import.meta.url);
const importMap = new URL("./import_map.json", import.meta.url);

const process = Deno.run({
  cmd: [
    Deno.execPath(),
    "install",
    "--unstable",
    "-Afr",
    `--import-map=${importMap}`,
    cli,
    ...Deno.args,
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
