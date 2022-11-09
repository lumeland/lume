import { parseISO } from "../deps/date.ts";
import { posix } from "../deps/path.ts";
import { Exception } from "./errors.ts";
import { Page } from "./filesystem.ts";

import type { Data, Directory, PageData } from "../core.ts";

export interface Options {
  /** The full path of the src folder */
  src: string;

  /** Pretty urls configuration */
  prettyUrls: boolean;
}

/**
 * Class to prepare pages before rendering, completing the missing data
 */
export default class pagePreparer {
  src: string;
  prettyUrls: boolean;

  constructor(options: Options) {
    this.src = options.src;
    this.prettyUrls = options.prettyUrls;
  }

  /** Returns the final URL assigned to a page */
  getUrl(page: Page, parentPath: string): string | false {
    const { data } = page;
    let url = data.url as
      | string
      | ((page: Page) => string | false)
      | false
      | undefined;

    if (url === false) {
      return false;
    }

    if (typeof url === "function") {
      url = url(page);
    }

    if (typeof url === "string") {
      // Relative URL
      if (url.startsWith("./") || url.startsWith("../")) {
        return normalizeUrl(posix.join(parentPath, url));
      }

      if (url.startsWith("/")) {
        return normalizeUrl(url);
      }

      throw new Exception(
        `The url variable must start with "/", "./" or "../"`,
        { page, url },
      );
    }

    // Calculate the URL from the path
    if (parentPath && data.slug) {
      const url = posix.join(parentPath, data.slug);
      const ext = posix.extname(page.src.path);

      if (ext) {
        return url + ext;
      }

      if (page.src.asset) {
        return url + page.src.ext;
      }

      if (this.prettyUrls) {
        if (posix.basename(url) === "index") {
          return posix.join(posix.dirname(url), "/");
        }
        return posix.join(url, "/");
      }

      return `${url}.html`;
    }

    // If the user has provided a value which hasn't yielded a string then it is an invalid url.
    throw new Exception(
      `If a url is specified, it should either be a string, or a function which returns a string. The provided url is of type: ${typeof url}.`,
      { page, url },
    );
  }

  /** Returns the date assigned to a page */
  getDate(page: Page): Date {
    const { data } = page;
    const date = data.date as Date | undefined | number | string;

    if (date instanceof Date) {
      return date;
    }

    if (!date) {
      return page.src.created ?? page.src.lastModified ?? new Date();
    }

    if (typeof date === "number") {
      return new Date(date);
    }

    if (typeof date === "string") {
      switch (date.toLowerCase()) {
        case "git last modified":
          return getGitDate(
            "modified",
            posix.join(this.src, page.src.path + page.src.ext),
          ) || page.src.lastModified || new Date();
        case "git created":
          return getGitDate(
            "created",
            posix.join(this.src, page.src.path + page.src.ext),
          ) || page.src.created || new Date();
      }
      const parsed = parseISO(date, {});
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    throw new Exception("Invalid date.", { page });
  }

  /** Return the data associated with a page or folder */
  getData(entry: Page | Directory, parentData: Data): PageData {
    const data = mergeData(parentData, entry.baseData);

    /** Get the slug of a page/directory */
    data.slug = entry.baseData.slug || entry.src.slug;

    if (entry instanceof Page) {
      data.page = entry;
    }

    return data as PageData;
  }
}

/** Merge the cascade data */
export function mergeData(parentData: Data, baseData: Data): Data {
  const data: Data = { ...parentData, ...baseData };

  // Merge special keys
  const mergedKeys: Record<string, string> = {
    tags: "stringArray",
    ...parentData.mergedKeys,
    ...baseData.mergedKeys,
  };

  for (const [key, type] of Object.entries(mergedKeys)) {
    switch (type) {
      case "stringArray":
      case "array":
        {
          const baseValue: unknown[] = Array.isArray(baseData[key])
            ? baseData[key] as unknown[]
            : (key in baseData)
            ? [baseData[key]]
            : [];

          const parentValue: unknown[] = Array.isArray(parentData[key])
            ? parentData[key] as unknown[]
            : (key in parentData)
            ? [parentData[key]]
            : [];

          const merged = [...parentValue, ...baseValue];

          data[key] = [
            ...new Set(
              type === "stringArray" ? merged.map(String) : merged,
            ),
          ];
        }
        break;

      case "object":
        {
          const baseValue = baseData[key] as
            | Record<string, unknown>
            | undefined;
          const parentValue = parentData[key] as
            | Record<string, unknown>
            | undefined;

          data[key] = { ...parentValue, ...baseValue };
        }
        break;
    }
  }

  return data;
}

/**
 * Returns the result of a git command as Date
 * Thanks to https://github.com/11ty/eleventy/blob/8dd2a1012de92c5ee1eab7c37e6bf1b36183927e/src/Util/DateGitLastUpdated.js
 */
export function getGitDate(
  type: "created" | "modified",
  file: string,
): Date | undefined {
  const args = type === "created"
    ? ["log", "--diff-filter=A", "--follow", "-1", "--format=%at", "--", file]
    : ["log", "-1", "--format=%at", "--", file];

  const { code, stdout } = Deno.spawnSync("git", { args });

  if (code !== 0) {
    return;
  }
  const str = new TextDecoder().decode(stdout);
  const timestamp = parseInt(str) * 1000;

  if (timestamp) {
    return new Date(timestamp);
  }
}

/** Remove the /index.html part if exist */
export function normalizeUrl(url: string): string {
  if (url.endsWith("/index.html")) {
    return url.slice(0, -10);
  }
  return url;
}
