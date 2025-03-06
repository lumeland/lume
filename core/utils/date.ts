/**
 * Returns the date of the git commit that created or modified the file.
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

  if (str) {
    return parseDate(parseInt(str) * 1000);
  }
}

/** Parse a string or number (of miliseconds) to UTC Date */
export function parseDate(date: string | number): Date {
  return new Date(getZonedDateTime(date).epochMilliseconds);
}

/** Parse a string or number (of miliseconds) to a zoned datetime */
export function getZonedDateTime(
  date: string | number,
  timezone = "UTC",
): Temporal.ZonedDateTime {
  if (typeof date === "number") {
    return Temporal.Instant.fromEpochMilliseconds(date).toZonedDateTimeISO(
      timezone,
    );
  }

  try {
    return Temporal.Instant.from(date).toZonedDateTimeISO(timezone);
  } catch {
    return Temporal.PlainDateTime.from(date).toZonedDateTime(timezone);
  }
}
