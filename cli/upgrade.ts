import {
  getLatestDevelopmentVersion,
  getLatestVersion,
  getLumeVersion,
} from "../core/utils.ts";
import { brightGreen, gray } from "../deps/colors.ts";
import { importMap } from "./import_map.ts";

interface Options {
  dev: boolean;
  version?: string;
}
export default function ({ dev, version }: Options) {
  return upgrade(dev, version);
}

/** Upgrade the Lume installation to the latest version */
export async function upgrade(dev = false, version?: string) {
  const latest = version
    ? version
    : dev
    ? await getLatestDevelopmentVersion()
    : await getLatestVersion();

  if (latest === getLumeVersion()) {
    console.log(
      version
        ? `You're already using this of Lume:`
        : dev
        ? "You're using the latest version of Lume:"
        : "You're using the latest development version of Lume:",
      brightGreen(latest),
    );
    console.log();
    return;
  }

  console.log(
    version
      ? `Updating Lume to ${brightGreen(latest)}...`
      : `New version available. Updating Lume to ${brightGreen(latest)}...`,
  );

  const url = await install(latest, dev);

  try {
    await Promise.all([
      Deno.stat("deno.json"),
      Deno.stat("import_map.json"),
    ]);
    await importMap(url);
  } catch {
    // Don't update import_map.json or deno.json
  }

  console.log();
  console.log("Update successful!");
  console.log(
    version
      ? `You're using Lume ${brightGreen(latest)}!`
      : `You're using the latest version of Lume: ${brightGreen(latest)}!`,
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
  // Prepend automatically "v" to the version if it's missing
  if (!dev && !version.startsWith("v")) {
    version = `v${version}`;
  }

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
      url.href + "/install.ts",
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
