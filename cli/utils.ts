import { Page, Site } from "../core.ts";
import lume from "../mod.ts";
import { exists } from "../deps/fs.ts";
import { join, relative, resolve, toFileUrl } from "../deps/path.ts";
import { bold, dim, red } from "../deps/colors.ts";
import { Exception } from "../core/utils.ts";

/** Return the current installed version */
export function getCurrentVersion(): string {
  const url = new URL("../", import.meta.url).pathname;
  return url.match(/@([^/]+)/)?.[1] ?? `local (${url})`;
}

/** Return the latest stable version from the deno.land/x repository */
export async function getLastVersion(): Promise<string> {
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  return versions.latest;
}

/** Return the hash of the latest commit from the GitHub repository */
export async function getLastDevelopmentVersion(): Promise<string> {
  const response = await fetch(
    "https://api.github.com/repos/lumeland/lume/commits?per_page=1",
  );
  const commits = await response.json();
  return commits[0].sha;
}

/** Returns the _config file of a site */
export async function getConfigFile(
  root: string,
  config?: string,
): Promise<string | undefined> {
  root = resolve(Deno.cwd(), root);

  if (config) {
    const path = join(root, config);

    if (await exists(path)) {
      return path;
    }

    throw new Exception("Config file not found", { path });
  }

  const files = ["_config.js", "_config.ts"];

  for (const file of files) {
    const path = join(root, file);

    if (await exists(path)) {
      return path;
    }
  }
}

/** Create a site instance */
export async function createSite(root: string, config?: string): Promise<Site> {
  const path = await getConfigFile(root, config);

  if (path) {
    console.log(`Loading config file ${dim(path)}`);
    console.log();
    const mod = await import(toFileUrl(path).href);
    return mod.default;
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

  console.error(`${tab}${bold(red(`${error.name}:`))}`, error.message);

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

    // Skip all the stack lines that have been already presented
    stack.slice(1, stack.length - stackLines).forEach((line) => {
      console.log(`${tab}${line.trim()}`);
      stackLines++;
    });
  }

  if (error.cause) {
    printError(error.cause, indent + 1, stackLines);
  }

  if (indent == 0) {
    console.log();
  }
}

/** A list of the available optional plugins */
export const pluginNames = [
  "attributes",
  "base_path",
  "bundler",
  "code_highlight",
  "date",
  "eta",
  "inline",
  "jsx",
  "liquid",
  "modify_urls",
  "postcss",
  "pug",
  "relative_urls",
  "resolve_urls",
  "slugify_urls",
  "svgo",
  "terser",
];

export interface WatchOptions {
  /** The folder root to watch */
  root: string;
  /** Paths ignored by the watcher */
  ignore?: string[];
  /** The debounce waiting time */
  debounce?: number;
  /** The callback function. Return false to close the watcher */
  fn: (files: Set<string>) => void | false | Promise<void | false>;
}

/** Watch file changes in a directory */
export async function runWatch({ root, ignore, fn, debounce }: WatchOptions) {
  const watcher = Deno.watchFs(root);
  const changes: Set<string> = new Set();
  let timer = 0;
  let runningCallback = false;

  const callback = async () => {
    if (!changes.size || runningCallback) {
      return;
    }

    const files = new Set(changes);
    changes.clear();

    runningCallback = true;
    try {
      if (false === await fn(files)) {
        return watcher.close();
      }
    } catch (error) {
      printError(error);
    }
    runningCallback = false;
  };

  for await (const event of watcher) {
    let { paths } = event;

    if (ignore) {
      paths = paths.filter((path) =>
        !ignore.some((ignore) => path.startsWith(ignore))
      );
    }

    if (!paths.length) {
      continue;
    }

    paths.forEach((path) => changes.add(join("/", relative(root, path))));

    // Debounce
    clearTimeout(timer);
    timer = setTimeout(callback, debounce || 100);
  }
}
