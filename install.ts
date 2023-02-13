import { brightGreen, gray, red } from "./deps/colors.ts";
import { checkDenoVersion } from "./core/utils.ts";
import { outdent } from "./deps/outdent.ts";

checkDenoVersion();

const process = Deno.run({
  cmd: [
    Deno.execPath(),
    "install",
    "--unstable",
    "-Af",
    `--no-check`,
    "--name=lume",
    import.meta.resolve("./ci.ts"),
  ],
});

const status = await process.status();
process.close();

if (!status.success) {
  const message = outdent`

    ${red("Error installing Lume")}
    You can report an issue at ${
    gray("https://github.com/lumeland/lume/issues/new")
  }
    Or get help at Discord: ${gray("https://discord.gg/YbTmpACHWB")}

  `;

  console.error(message);
  Deno.exit(1);
}

if (Deno.args[0] !== "--upgrade") {
  const message = outdent`

    🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

    ${brightGreen(" Lume installed successfully!")}

        BENVIDO - WELCOME! 🎉🎉

    ${gray("-------------------------------")}

    Run ${brightGreen("lume --help")} for usage information
    See ${gray("https://lume.land")} for online documentation
    See ${
    gray("https://discord.gg/YbTmpACHWB")
  } to propose new ideas and get help at Discord
    See ${gray("https://opencollective.com/lume")} to provide some support

  `;

  console.log(message);
}
