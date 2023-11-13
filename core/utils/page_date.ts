import { getGitDate, parseDate } from "./date.ts";

import type { Page, RawData } from "../file.ts";

/** Returns the Date instance of a file */
export function getPageDate(page: Page): Date {
  const data = page.data as RawData;
  const { date } = data;

  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "number") {
    return new Date(date);
  }

  const { entry } = page.src;
  const info = entry?.getInfo();

  if (typeof date === "string") {
    if (entry && info) {
      switch (date.toLowerCase()) {
        case "git last modified":
          return getGitDate("modified", entry.src) || info.mtime || new Date();
        case "git created":
          return getGitDate("created", entry.src) || info.birthtime ||
            new Date();
      }
    }

    try {
      return parseDate(date);
    } catch {
      throw new Error(`Invalid date: ${date} (${entry?.src})`);
    }
  }

  return info?.birthtime || info?.mtime || new Date();
}
