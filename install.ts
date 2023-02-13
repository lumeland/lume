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
    "--no-check",
    "--name=lume",
    import.meta.resolve("./ci.ts"),
  ],
});

const status = await process.status();
process.close();

const links = {
  help: brightGreen("lume --help"),
  issues: gray("https://github.com/lumeland/lume/issues/new"),
  website: gray("https://lume.land"),
  discord: gray("https://discord.gg/YbTmpACHWB"),
  opencollective: gray("https://opencollective.com/lume"),
} as const;

if (!status.success) {
  const { issues, discord } = links;

  const message = outdent`

    ${red("Error installing Lume")}
    You can report an issue at ${issues}
    Or get help at Discord: ${discord}

  `;

  console.error(message);
  Deno.exit(1);
}

if (Deno.args[0] !== "--upgrade") {
  const { help, website, discord, opencollective } = links;

  const message = outdent`

    🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

    ${brightGreen(" Lume installed successfully!")}

        BENVIDO - WELCOME! 🎉🎉

    ${gray("-------------------------------")}

    Run ${help} for usage information
    See ${website} for online documentation
    See ${discord} to propose new ideas and get help at Discord
    See ${opencollective} to provide some support

  `;

  console.log(message);
}
