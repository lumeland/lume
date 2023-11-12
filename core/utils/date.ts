import { Temporal } from "../../deps/temporal.ts";

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

  const { stdout, success } = new Deno.Command("git", { args }).outputSync();

  if (!success) {
    return;
  }
  const str = new TextDecoder().decode(stdout);
  const timestamp = parseInt(str) * 1000;

  if (timestamp) {
    return new Date(timestamp);
  }
}

export function parseDate(date: string): Date {
  return new Date(getZonedDateTime(date).epochMilliseconds);
}

export function getZonedDateTime(date: string, timezone = "UTC") {
  try {
    return Temporal.Instant.from(date).toZonedDateTimeISO(timezone);
  } catch {
    return Temporal.PlainDateTime.from(date).toZonedDateTime(timezone);
  }
}
