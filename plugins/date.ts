import {
  format,
  formatDistanceToNow,
  formatDistanceToNowStrict,
} from "../deps/date.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Locale } from "../deps/date.ts";

export interface Options {
  /** The name of the helper */
  name?: string;

  /** The loaded locales */
  locales?: Record<string, Locale>;

  /** Custom date formats */
  formats?: Record<string, string>;
}

// Default options
export const defaults: Options = {
  name: "date",
  locales: {},
  formats: {
    ATOM: "yyyy-MM-dd'T'HH:mm:ssXXX",
    DATE: "yyyy-MM-dd",
    DATETIME: "yyyy-MM-dd HH:mm:ss",
    TIME: "HH:mm:ss",
    HUMAN_DATE: "PPP",
    HUMAN_DATETIME: "PPPppp",
  },
};

/**
 * A plugin to format Date values
 * @see https://lume.land/plugins/date/
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const defaultLocale = Object.keys(options.locales).shift();

    site.filter(options.name, filter);

    function filter(
      date: string | Date,
      pattern = "DATE",
      lang = defaultLocale,
    ): string | undefined {
      if (!date) {
        return;
      }

      if (date === "now") {
        date = new Date();
      } else if (!(date instanceof Date)) {
        date = new Date(date);
      }

      const patt = options.formats[pattern] || pattern;
      const locale = lang ? options.locales[lang] : undefined;

      if (pattern === "HUMAN_SINCE") {
        return formatDistanceToNow(date, { locale });
      } else if (pattern === "HUMAN_SINCE_STRICT") {
        return formatDistanceToNowStrict(date, { locale });
      } else {
        return format(date, patt, { locale });
      }
    }
  };
}

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/date/ */
      date: (
        date: string | Date,
        pattern?: string,
        lang?: string,
      ) => string | undefined;
    }
  }
}
