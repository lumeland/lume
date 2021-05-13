import { brightGreen, gray } from "../deps/colors.js";
import { getLastVersion, install, validateArgsCount } from "./utils.js";

export const HELP = `
${brightGreen("lume install")}: install the latest version of lume

USAGE:
    lume install
`;

/**
 * Command to upgrade lume to the latest version
 */
export async function run(args) {
  validateArgsCount("install", args, 1);
  const latest = await getLastVersion();

  console.log(`Installing lume ${latest}...`);

  await install(latest);

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
  console.log();
}
