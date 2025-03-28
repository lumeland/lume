import { parseDate } from "../core/utils/date.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";
import { merge } from "../core/utils/object.ts";

export interface Options {
  remove?: boolean;
}

export const defaults: Options = {
  remove: true,
};

/**
 * A plugin to extract the date from the files and folders paths
 * @see https://lume.land/plugins/extract_date/
 */
export function extractDate(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.parseBasename((basename) => {
      const result = parseDateFromBasename(basename);
      if (result) {
        return options.remove ? result : { ...result, basename };
      }
    });
  };
}

export default extractDate;

/**
 * Parse a date/datetime from a basename.
 *
 * Basenames can be prepended with a date (yyyy-mm-dd) or datetime
 * (yyyy-mm-dd-hh-ii-ss) followed by an underscore (_) or hyphen (-).
 */
export function parseDateFromBasename(
  basename: string,
) {
  const basenameRegex =
    /^(?<year>\d{4})-(?<month>\d\d)-(?<day>\d\d)(?:-(?<hour>\d\d)-(?<minute>\d\d)(?:-(?<second>\d\d))?)?(?:_|-)(?<basename>.*)/;
  const basenameParts = basenameRegex.exec(basename)?.groups;

  if (basenameParts) {
    const {
      year,
      month,
      day,
      hour = "00",
      minute = "00",
      second = "00",
      basename,
    } = basenameParts;

    try {
      const date = parseDate(
        `${year}-${month}-${day} ${hour}:${minute}:${second}`,
      );

      return { date, basename };
    } catch {
      log.warn(
        `Invalid date: ${basename} (${year}-${month}-${day} ${hour}:${minute}:${second})`,
      );
      return { basename };
    }
  }
}
