import { brightGreen, gray, red } from "./deps/colors.ts";
import { cli, importMap } from "./ci.ts";

const minDenoVersion = "1.10.3";

if (Deno.version.deno < minDenoVersion) {
  console.log();
  console.error(red("Error installing Lume"));
  console.log("You have an old version of Deno");
  console.log(`Lume needs Deno ${brightGreen(minDenoVersion)} or greater`);
  console.log(`Your current version is ${red(Deno.version.deno)}`);
  console.log();
  console.log(
    `Run ${brightGreen("deno upgrade")} before installing or upgrading Lume`,
  );
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
