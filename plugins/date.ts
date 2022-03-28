import { format, loadLanguages } from "../deps/date.ts";
import { merge } from "../core/utils.ts";

import type { Helper, Site } from "../core.ts";

const formats = new Map([
  ["ATOM", "yyyy-MM-dd'T'HH:mm:ssXXX"],
  ["DATE", "yyyy-MM-dd"],
  ["DATETIME", "yyyy-MM-dd HH:mm:ss"],
  ["TIME", "HH:mm:ss"],
  ["HUMAN_DATE", "PPP"],
  ["HUMAN_DATETIME", "PPPppp"],
]);

export interface Options {
  /** The name of the helper */
  name: string;

  /** The loaded locales */
  locales: Record<string, unknown> | string[];

  /** Custom date formats */
  formats: Record<string, string>;
}

// Default options
export const defaults: Options = {
  name: "date",
  locales: {},
  formats: {},
};

/** A plugin to format Date values */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("beforeBuild", async () => {
      const locales = Array.isArray(options.locales)
        ? await loadLanguages(options.locales)
        : options.locales;

      const defaultLocale = Object.keys(locales).shift();

      site.filter(options.name, filter as Helper);

      function filter(
        date: string | Date,
        pattern = "DATE",
        lang = defaultLocale,
      ) {
        if (!date) {
          return;
        }

        if (date === "now") {
          date = new Date();
        } else if (!(date instanceof Date)) {
          date = new Date(date);
        }

        const patt = options.formats[pattern] || formats.get(pattern) ||
          pattern;
        const locale = lang ? locales[lang] : undefined;

        return format(date, patt, { locale });
      }
    });
  };
}
