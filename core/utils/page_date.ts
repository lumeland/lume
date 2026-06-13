import { getGitDate, parseDate } from "./date.ts";

import { DataIn, Page, RawData, Src } from "../file.ts";

/** Returns the Date instance of a file */
export function getPageDate(page: Page<DataIn>): Date;
export function getPageDate(date: RawData["date"], src?: Src): Date;
export function getPageDate(
  date: RawData["date"] | Page<DataIn>,
  src?: Src,
): Date {
  if (
    date && !(date instanceof Date) && typeof date !== "number" &&
    typeof date !== "string"
  ) {
    date = date.data.date;
  }

  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "number") {
    return new Date(date);
  }

  const entry = src?.entry;
  const info = entry?.getInfo();

  if (typeof date === "string") {
    if (entry && info) {
      switch (date.toLowerCase()) {
        case "git last modified":
          return getGitDate("modified", entry.src) || info.mtime || new Date();
        case "git created":
          // getGitDate("created", ...) uses `git log --diff-filter=A`
          // which returns nothing for files where the latest commit had a merge conflict.
          // Therefore we fallback to last modified time from git history,
          // which is more reliable than file system creation time under most CI environments.
          return getGitDate("created", entry.src) ||
            getGitDate("modified", entry.src) || info.birthtime ||
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
