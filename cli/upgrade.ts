import {
  getCurrentVersion,
  getLatestDevelopmentVersion,
  getLatestVersion,
} from "../core/utils.ts";
import { brightGreen, gray } from "../deps/colors.ts";
import importMap from "./import_map.ts";

interface Options {
  dev: boolean;
}

/** Upgrade the Lume installation to the latest version */
export default async function upgrade({ dev }: Options) {
  const latest = dev
    ? await getLatestDevelopmentVersion()
    : await getLatestVersion();

  if (latest === getCurrentVersion()) {
    console.log(
      dev
        ? "You're using the latest version of Lume:"
        : "You're using the latest development version of Lume:",
      brightGreen(latest),
    );
    console.log();
    return;
  }

  console.log(
    `New version available. Updating Lume to ${brightGreen(latest)}...`,
  );

  await install(latest, dev);

  console.log();
  console.log("Update successful!");
  console.log(
    `You're using the latest version of Lume: ${brightGreen(latest)}!`,
  );

  if (!dev) {
    console.log(
      "See the changes in",
      gray(`https://github.com/lumeland/lume/blob/${latest}/CHANGELOG.md`),
    );
  }
  console.log();
}

async function install(version: string, dev = false) {
  const url = dev
    ? `https://cdn.jsdelivr.net/gh/lumeland/lume@${version}`
    : `https://deno.land/x/lume@${version}`;

  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--unstable",
      "-A",
      `${url}/install.ts`,
      "--upgrade",
    ],
  });

  await process.status();
  process.close();

  return url;
}
