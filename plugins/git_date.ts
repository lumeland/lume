import { merge } from "../core/utils/object.ts";
import { normalizePath } from "../core/utils/path.ts";
import { join } from "../deps/path.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** Set true to override the value if it's defined */
  override?: boolean;
}

export const defaults = {
  override: false,
} satisfies Options;

export function gitDate(userOptions?: Options) {
  const options = merge(defaults, userOptions);
  let cache: Map<string, string>;

  return (site: Site) => {
    site.addEventListener("beforeBuild", () => {
      cache = getLastModified(site.src());
    });

    site.preprocess((pages) => {
      for (const page of pages) {
        const date = cache.get(site.src(page.sourcePath));

        if (date === undefined) {
          continue;
        }

        if (options.override) {
          page.data.date = new Date(date);
        } else {
          page.data.date ??= new Date(date);
        }
      }
    });
  };
}

export default gitDate;

/**
 * Thanks to https://meiert.com/blog/eleventy-git-last-modified/
 */
function getLastModified(path: string): Map<string, string> {
  const dates = new Map<string, string>();
  const toplevel = gitCommand("rev-parse", "--show-toplevel");

  if (toplevel === undefined) {
    log.error("[gitDate plugin] Unable to get the top level folder");
    return dates;
  }

  const str = gitCommand("log", "--format=DATE:%ci", "--name-only", "--", path);

  if (str === undefined) {
    log.error("[gitDate plugin] Unable to get the last modified date of files");
    return dates;
  }

  let currentDate: string | undefined;
  for (const line of str.split("\n")) {
    const text = line.trim();

    if (text.startsWith("DATE:")) {
      currentDate = text.slice(5).trim();
      continue;
    }

    if (text && currentDate) {
      const path = normalizePath(join(toplevel, text));
      // First commits, last modification
      if (!dates.has(path)) {
        dates.set(path, currentDate);
      }
    }
  }

  return dates;
}

function gitCommand(...args: string[]): string | undefined {
  const { stdout, success } = new Deno.Command("git", { args }).outputSync();

  if (!success) {
    return;
  }

  return new TextDecoder().decode(stdout).trim();
}
