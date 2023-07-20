import {
  getLatestDevelopmentVersion,
  getLatestVersion,
  getLumeVersion,
  readDenoConfig,
  updateLumeVersion,
  writeDenoConfig,
} from "../core/utils.ts";
import { brightGreen, gray } from "../deps/colors.ts";

interface Options {
  dev?: boolean | string;
  version?: string;
}
export default function ({ dev, version }: Options) {
  return upgrade(dev, version);
}

/** Upgrade the Lume installation to the latest version */
export async function upgrade(dev: boolean | string = false, version?: string) {
  const latest = version ? version : dev
    ? await getLatestDevelopmentVersion(
      typeof dev === "string" ? dev : undefined,
    )
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
    console.log();
    return;
  }

  console.log(
    version
      ? `Updating Lume to ${brightGreen(latest)}...`
      : `New version available. Updating Lume to ${brightGreen(latest)}...`,
  );

  const denoConfig = await readDenoConfig();

  if (!denoConfig) {
    throw new Error("No Deno config file found");
  }

  updateLumeVersion(url, denoConfig);
  await writeDenoConfig(denoConfig);

  console.log();
  console.log("Update successful!");

  if (!dev) {
    console.log(
      "See the changes in",
      gray(`https://github.com/lumeland/lume/blob/${latest}/CHANGELOG.md`),
    );
  }

  console.log();
}

function getVersionUrl(version: string, dev: boolean | string = false): URL {
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
