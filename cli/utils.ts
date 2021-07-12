import { Page, Site } from "../core.ts";
import lume from "../mod.ts";
import { exists } from "../deps/fs.ts";
import { join, resolve, toFileUrl } from "../deps/path.ts";
import { bold, dim, red } from "../deps/colors.ts";
import { Exception } from "../core/utils.ts";

/** Returns the current installed version */
export function getCurrentVersion(): string {
  const url = new URL("../", import.meta.url).pathname;
  return url.match(/@([^/]+)/)?.[1] ?? `local (${url})`;
}

/** Returns the latest stable version from the deno.land/x repository */
export async function getLastVersion(): Promise<string> {
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  return versions.latest;
}

/** Returns the hash of the latest commit from the GitHub repository */
export async function getLastDevelopmentVersion(): Promise<string> {
  const response = await fetch(
    "https://api.github.com/repos/lumeland/lume/commits?per_page=1",
  );
  const commits = await response.json();
  return commits[0].sha;
}

/** Create a site instance */
export async function createSite(root: string, config?: string): Promise<Site> {
  root = resolve(Deno.cwd(), root);

  if (config) {
    const path = join(root, config);

    if (await exists(path)) {
      console.log(`Loading config file ${dim(config)}`);
      console.log();
      const mod = await import(toFileUrl(path).href);
      return mod.default;
    }

    throw new Exception("Config file not found", { path });
  }

  const files = ["_config.js", "_config.ts"];

  for (const file of files) {
    const path = join(root, file);

    if (await exists(path)) {
      console.log(`Loading config file ${dim(file)}`);
      console.log();
      const mod = await import(toFileUrl(path).href);
      return mod.default;
    }
  }

  return lume();
}

/** Pretty-print an Error or Exception instance */
export function printError(
  error: Error | Exception,
  indent = 0,
  stackLines = 1,
) {
  console.log();
  const tab = "  ".repeat(indent);

  console.error(`${tab}${bold(red(`Error:`))}`, error.message);

  if (error instanceof Exception) {
    for (let [key, value] of Object.entries(error.data ?? {})) {
      if (key === "page") {
        value = (value as Page).src.path + (value as Page).src.ext;
      }
      console.log(dim(`${tab}${key}:`), value);
    }
  }

  if (error.stack) {
    const stack = error.stack.split("\n");

    // We skip all the stack lines that have been presented already.
    stack.slice(1, stack.length - stackLines).forEach((line) => {
      console.log(`${tab}${line.trim()}`);
      stackLines++;
    });
  }

  if (error instanceof Exception && error.error) {
    printError(error.error, indent + 1, stackLines);
  }

  if (indent == 0) {
    console.log();
  }
}

/** List of available optional plugins */
export const pluginNames = [
  "attributes",
  "base_path",
  "bundler",
  "code_highlight",
  "date",
  "eta",
  "inline",
  "jsx",
  "postcss",
  "pug",
  "relative_urls",
  "slugify_urls",
  "svg",
  "terser",
];
