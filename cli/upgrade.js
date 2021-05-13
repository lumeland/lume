import { brightGreen, gray } from "../deps/colors.js";
import { version } from "../cli.js";
import { getLastVersion, install, validateArgsCount } from "./utils.js";

export const HELP = `
${brightGreen("lume upgrade")}: upgrade your local lume install to the latest

USAGE:
    lume upgrade
`;
/**
 * Command to upgrade lume to the latest version
 */
export async function run(args) {
  validateArgsCount("upgrade", args, 1);
  const latest = await getLastVersion();

  if (latest === version) {
    console.log(`You're using the latest version of lume: ${latest}!`);
    console.log();
    return;
  }

  console.log(`New version available. Updating lume to ${latest}...`);

  await install(latest);

  console.log();
  console.log(
    `Update successful! You're using the latest version of lume: ${
      brightGreen(latest)
    }!`,
  );
  console.log(
    "See the changes in",
    gray(`https://github.com/lumeland/lume/blob/${latest}/CHANGELOG.md`),
  );
  console.log();
}
