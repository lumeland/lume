import { cyan, green, red } from "../../deps/colors.ts";

/** Return the latest stable version from the deno.land/x repository */
export async function getLatestVersion(): Promise<string> {
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  return versions.latest;
}

/** Return the hash of the latest commit from the GitHub repository */
export async function getLatestDevelopmentVersion(): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/lumeland/lume/commits/main`,
  );
  const commits = await response.json();
  return commits.sha;
}

/** Return the current installed version */
export function getCurrentVersion(
  url = new URL(import.meta.resolve("../")),
): string {
  const { pathname } = url;
  return pathname.match(/@([^/]+)/)?.[1] ?? `local (${pathname})`;
}

/** Check the compatibility with the current Deno version */
export function checkDenoSupport(): void {
  const minimum = "1.37.2";
  const current = Deno.version.deno;

  if (current < minimum) {
    console.log("----------------------------------------");
    console.error(red("Your Deno version is not compatible with Lume"));
    console.log(`Lume needs Deno ${green(minimum)} or greater`);
    console.log(`Your current version is ${red(current)}`);
    console.log(`Run ${cyan("deno upgrade")} and try again`);
    console.log("----------------------------------------");
    Deno.exit(1);
  }
}
