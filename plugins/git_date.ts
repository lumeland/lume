import { merge } from "../core/utils/object.ts";
import { normalizePath } from "../core/utils/path.ts";
import { join } from "../deps/path.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

export type GitDatePluginData<Key extends string = "date"> = {
  [K in Key]: Date;
};

export interface Options<Key extends string = "date"> {
  /** The variable name used to save the value */
  varName?: Key;
}

export const defaults = {
  varName: "date",
} satisfies Options;

export function gitDate<const Key extends string = "date">(
  userOptions?: Options<Key>,
) {
  const options = merge(defaults as Options<Key>, userOptions);
  const varName = options.varName as Key;
  let cache: Map<string, string>;

  return <D extends GitDatePluginData<Key>>(site: Site<D>) => {
    site.addEventListener("beforeBuild", () => {
      cache = getLastModified(site.src());
    });

    site.preprocess((pages) => {
      for (const page of pages) {
        const date = cache.get(site.src(page.sourcePath));

        if (date === undefined) {
          continue;
        }

        (page.data as Record<Key, Date>)[varName] = new Date(date);
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

  if (!toplevel) {
    return dates;
  }

  const str = gitCommand("log", "--format=DATE:%ci", "--name-only", "--", path);

  if (!str) {
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

const decoder = new TextDecoder();

function gitCommand(...args: string[]): string {
  const { code, stderr, stdout } = new Deno.Command("git", {
    args,
    stdout: "piped",
    stderr: "piped",
  }).outputSync();

  if (code !== 0) {
    log.error(`[git_date plugin] Git error: ${decoder.decode(stderr)}`);
    return "";
  }

  return decoder.decode(stdout).trim();
}
