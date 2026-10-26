import Path from "@lumeland/core/path.ts";
import { merge } from "@lumeland/core/utils/object.ts";
import { log } from "@lumeland/core/utils/log.ts";
import { runPipedCommand } from "@lumeland/core/services/process.ts";

import type Site from "@lumeland/core/site.ts";

export interface Options {
  /** The variable name used to save the value */
  varName?: string;
}

export const defaults = {
  varName: "date",
} satisfies Options;

export function gitDate(userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const { varName } = options;
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

        page.data[varName] = new Date(date);
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

  const topLevelPath = Path.create(toplevel);
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
      const path = topLevelPath.clone().join(text).full;
      // First commits, last modification
      if (!dates.has(path)) {
        dates.set(path, currentDate);
      }
    }
  }

  return dates;
}

function gitCommand(...args: string[]): string {
  const [success, error] = runPipedCommand("git", args);

  if (success) {
    return success;
  }

  log.error(`[git_date plugin] Git error: ${error}`);
  return "";
}
