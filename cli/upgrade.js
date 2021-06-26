import { parse } from "../deps/flags.js";
import { encode } from "../deps/base64.js";
import { brightGreen, gray } from "../deps/colors.js";
import { getCurrentVersion, validateArgsCount } from "./utils.js";

export const HELP = `
${brightGreen("lume upgrade")}: upgrade your lume install to the latest version

USAGE:
    lume upgrade

OPTIONS:
    -d, --dev  install the latest development version (latest commit)
`;

/**
 * Command to upgrade lume to the latest version
 */
export async function run(args) {
  const options = parse(args, {
    boolean: ["dev"],
    alias: { dev: "d" },
    unknown(option) {
      if (option.startsWith("-")) {
        throw new Error(`Unknown option: ${option}`);
      }
    },
  });

  validateArgsCount("upgrade", options._, 1);

  const dev = options.dev;
  const latest = dev
    ? await getLastDevelopmentVersion()
    : await getLastVersion();

  if (latest === getCurrentVersion()) {
    console.log(
      `You’re using the latest version of lume: ${brightGreen(latest)}!`,
    );
    console.log();
    return;
  }

  console.log(
    `New version available. Updating lume to ${brightGreen(latest)}...`,
  );

  await install(latest, dev);

  console.log();
  console.log("Update successful!");
  console.log(
    `You’re using the latest version of lume: ${brightGreen(latest)}!`,
  );

  if (!dev) {
    console.log(
      "See the changes in",
      gray(`https://github.com/lumeland/lume/blob/${latest}/CHANGELOG.md`),
    );
  }
  console.log();
}

async function getLastVersion() {
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  return versions.latest;
}

async function getLastDevelopmentVersion() {
  const response = await fetch(
    "https://api.github.com/repos/lumeland/lume/commits?per_page=1",
  );
  const commits = await response.json();
  return commits[0].sha;
}

async function install(version, dev = false) {
  const url = dev
    ? `https://cdn.jsdelivr.net/gh/lumeland/lume@${version}`
    : `https://deno.land/x/lume@${version}`;

  const importMap = `data:application/json;base64,${
    encode(`{ "imports": { "lume/": "${url}/" } }`)
  }`;

  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "install",
      "--unstable",
      "-Af",
      `--import-map=${importMap}`,
      `--no-check`,
      "--name=lume",
      `${url}/cli.js`,
    ],
  });

  const status = await process.status();
  process.close();

  return status.success;
}
