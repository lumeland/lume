import {
  getLatestDevelopmentVersion,
  getLatestVersion,
  getLumeVersion,
} from "../core/utils.ts";
import { brightGreen, gray } from "../deps/colors.ts";
import { importMap } from "./import_map.ts";

interface Options {
  global?: boolean;
  dev?: boolean;
  version?: string;
}
export default function ({ global, dev, version }: Options) {
  return upgrade(global, dev, version);
}

/** Upgrade the Lume installation to the latest version */
export async function upgrade(global = false, dev = false, version?: string) {
  const latest = version
    ? version
    : dev
    ? await getLatestDevelopmentVersion()
    : await getLatestVersion();
  const url = getVersionUrl(latest, dev);

  if (latest === getLumeVersion()) {
    console.log(
      version
        ? `You're already using this version of Lume:`
        : dev
        ? "You're using the latest version of Lume:"
        : "You're using the latest development version of Lume:",
      brightGreen(latest),
    );
    await updateDenoConfig(url);
    console.log();
    return;
  }

  console.log(
    version
      ? `Updating Lume to ${brightGreen(latest)}...`
      : `New version available. Updating Lume to ${brightGreen(latest)}...`,
  );

  if (global) {
    await install(url.href);
  }
  await updateDenoConfig(url);

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

async function updateDenoConfig(url: URL) {
  try {
    await Promise.any([
      Deno.stat("deno.json"),
      Deno.stat("deno.jsonc"),
    ]);
    await Deno.stat("import_map.json");
    await importMap(url);
  } catch {
    // Don't update import_map.json or deno.json
  }
}

function getVersionUrl(version: string, dev = false): URL {
  // Prepend automatically "v" to the version if it's missing
  if (!dev && !version.startsWith("v")) {
    version = `v${version}`;
  }

  return new URL(
    dev
      ? `https://cdn.jsdelivr.net/gh/lumeland/lume@${version}/`
      : `https://deno.land/x/lume@${version}/`,
  );
}

async function install(url: string) {
  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--unstable",
      "-A",
      url + "install.ts",
      "--upgrade",
    ],
  });

  const status = await process.status();
  process.close();

  if (!status.success) {
    throw new Error("Error upgrading Lume");
  }
}
