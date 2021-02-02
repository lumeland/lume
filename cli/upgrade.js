import { brightGreen, gray } from "../deps/colors.js";
import { version } from "../cli.js";
import { validateArgsCount } from "./utils.js";

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
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  const { latest } = versions;

  if (latest === version) {
    console.log(`You're using the latest version of lume: ${latest}!`);
    console.log("");
    return;
  }

  console.log(`New version available. Updating lume to ${latest}...`);

  await Deno.run({
    cmd: [
      "deno",
      "install",
      "--unstable",
      "-Afr",
      `https://deno.land/x/lume@${latest}/cli.js`,
    ],
  }).status();

  await Deno.run({
    cmd: [
      "deno",
      "cache",
      "--unstable",
      "-r",
      `https://deno.land/x/lume/mod.js`,
    ],
  }).status();

  console.log("");
  console.log(
    `Update successful! You're using the latest version of lume: ${
      brightGreen(latest)
    }!`,
  );
  console.log(
    "See the changes in",
    gray(`https://github.com/lumeland/lume/blob/${latest}/CHANGELOG.md`),
  );
  console.log("");
}
