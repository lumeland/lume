import Site from "../site.ts";
import lume from "../mod.js";
import { exists } from "../deps/fs.ts";
import { join, resolve, toFileUrl } from "../deps/path.ts";
import { bold, dim, red } from "../deps/colors.ts";
import { Exception } from "../utils.ts";
import { Page } from "../filesystem.ts";

/**
 * Returns the current installed version
 */
export function getCurrentVersion(): string {
  const url = new URL("../", import.meta.url).pathname;
  return url.match(/@([^/]+)/)?.[1] ?? `local (${url})`;
}

/**
 * Returns the latest stable version from the deno.land/x repository
 */
export async function getLastVersion(): Promise<string> {
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  return versions.latest;
}

/**
 * Returns the hash of the latest commit from the GitHub repository
 */
export async function getLastDevelopmentVersion(): Promise<string> {
  const response = await fetch(
    "https://api.github.com/repos/lumeland/lume/commits?per_page=1",
  );
  const commits = await response.json();
  return commits[0].sha;
}

/**
 * Create a site instance
 *
 * @param root The root directory of the site
 * @param config The name of the config file
 */
export async function createSite(root: string, config: string): Promise<Site> {
  root = resolve(Deno.cwd(), root);
  config = join(root, config);

  if (await exists(config)) {
    const mod = await import(toFileUrl(config).href);
    return mod.default;
  }

  return lume();
}

/**
 * Pretty-print an Error or Exception instance
 * @param exception The error to print
 * @param indent Indentation level (for inner errors)
 * @param stackLines Number of stacked lines to print
 */
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
      if (value instanceof Page) {
        // @ts-ignore: Missing Src type
        value = value.src.path + value.src.ext;
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

export const pluginNames = [
  "attributes",
  "base_path",
  "bundler",
  "code_highlight",
  "date",
  "eta",
  "inline",
  "json",
  "jsx",
  "markdown",
  "modules",
  "nunjucks",
  "postcss",
  "pug",
  "relative_urls",
  "search",
  "slugify_urls",
  "svg",
  "terser",
  "url",
  "yaml",
];
