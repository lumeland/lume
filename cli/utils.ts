import lume from "../mod.ts";
import { exists } from "../deps/fs.ts";
import { join, relative, resolve, toFileUrl } from "../deps/path.ts";
import { dim } from "../deps/colors.ts";
import { Exception, printError } from "../core/errors.ts";

import type { Site } from "../core.ts";

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

/** A list of the available optional plugins */
export const pluginNames = [
  "attributes",
  "base_path",
  "bundler",
  "code_highlight",
  "date",
  "esbuild",
  "eta",
  "inline",
  "jsx",
  "liquid",
  "modify_urls",
  "on_demand",
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
  const changes = new Set<string>();
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

    // Filter the ignored paths
    if (ignore) {
      paths = paths.filter((path) =>
        !ignore.some((ignore) => path.startsWith(join(root, ignore, "/")))
      );
    }

    if (!paths.length) {
      continue;
    }

    paths.forEach((path) => changes.add(join("/", relative(root, path))));

    // Debounce
    clearTimeout(timer);
    timer = setTimeout(callback, debounce ?? 100);
  }
}
