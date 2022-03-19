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

  const url = await install(latest, dev);

  try {
    Deno.stat("deno.json");
    Deno.stat("import_map.json");
    await importMap(url);
  } catch {
    // Don't update import_map.json or deno.json
  }

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
  const url = new URL(
    dev
      ? `https://cdn.jsdelivr.net/gh/lumeland/lume@${version}`
      : `https://deno.land/x/lume@${version}`,
  );

  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--unstable",
      "-A",
      new URL("./install.ts", url).href,
      "--upgrade",
    ],
  });

  const status = await process.status();
  process.close();

  if (!status.success) {
    throw new Error("Error upgrading Lume");
  }

  return url;
}
