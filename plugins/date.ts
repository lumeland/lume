import { format } from "../deps/date.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";

const formats = new Map([
  ["ATOM", "yyyy-MM-dd'T'HH:mm:ssXXX"],
  ["DATE", "yyyy-MM-dd"],
  ["DATETIME", "yyyy-MM-dd HH:mm:ss"],
  ["TIME", "HH:mm:ss"],
  ["HUMAN_DATE", "PPP"],
  ["HUMAN_DATETIME", "PPPppp"],
]);

interface Options {
  locales?: Record<string, unknown>
  formats?: Record<string, string>
}

// Default options
const defaults = {
  locales: {},
  formats: {},
};

export default function (userOptions: Options = {}) {
  const options = merge(defaults, userOptions);
  const defaultLocale = Object.keys(options.locales).shift();

  return (site: Site) => {
    site.filter("date", filter);

    function filter(date: string | Date, pattern = "DATE", lang = defaultLocale) {
      if (!date) {
        return;
      }

      if (!(date instanceof Date)) {
        date = new Date(date);
      }

      const patt = options.formats[pattern] || formats.get(pattern) ||
        pattern;
      const locale = options.locales[lang];

      return format(date, patt, { locale });
    }
  };
}
