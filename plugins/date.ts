import { format } from "../deps/date.ts";
import { merge } from "../core/utils.ts";
import { Helper, Site } from "../core.ts";

const formats = new Map([
  ["ATOM", "yyyy-MM-dd'T'HH:mm:ssXXX"],
  ["DATE", "yyyy-MM-dd"],
  ["DATETIME", "yyyy-MM-dd HH:mm:ss"],
  ["TIME", "HH:mm:ss"],
  ["HUMAN_DATE", "PPP"],
  ["HUMAN_DATETIME", "PPPppp"],
]);

export interface Options {
  locales: Record<string, unknown>;
  formats: Record<string, string>;
}

// Default options
const defaults: Options = {
  locales: {},
  formats: {},
};

/** A plugin to format Date values */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const defaultLocale = Object.keys(options.locales).shift();

  return (site: Site) => {
    site.filter("date", filter as Helper);

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
      const locale = lang ? options.locales[lang] : undefined;

      return format(date, patt, { locale });
    }
  };
}
