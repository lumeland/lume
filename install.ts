import { brightGreen, gray, red } from "./deps/colors.ts";
import { checkDenoVersion, getImportMap } from "./ci.ts";

checkDenoVersion();

const cli = new URL("./cli.ts", import.meta.url).href;

const process = Deno.run({
  cmd: [
    Deno.execPath(),
    "install",
    "--unstable",
    "-Af",
    `--import-map=${await getImportMap()}`,
    `--no-check`,
    "--name=lume",
    cli,
  ],
});

const status = await process.status();
process.close();

if (!status.success) {
  console.log();
  console.error(red("Error installing Lume"));
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

if (Deno.args[0] !== "--upgrade") {
  console.log();
  console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
  console.log();
  console.log(brightGreen(" Lume installed successfully!"));
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
}
