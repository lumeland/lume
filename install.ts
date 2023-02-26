import { gray, red } from "./deps/colors.ts";
import { outdent } from "./deps/outdent.ts";

const links = {
  issues: gray("https://github.com/lumeland/lume/issues/new"),
  docs: gray("https://lume.land/docs/overview/installation/"),
  discord: gray("https://discord.gg/YbTmpACHWB"),
  cli: gray("https://github.com/lumeland/cli"),
} as const;

const message = outdent`

  ${red("Lume global installation is no longer supported ")}

  See installation info: ${links.docs}
  Install Lume CLI: ${links.cli}
  Or get help at Discord: ${links.discord}
  Or open an issue: ${links.issues}

`;

console.error(message);
