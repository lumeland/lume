import { format } from "../deps/date.js";
import { merge } from "../utils.js";

const formats = new Map([
  ["ATOM", "yyyy-MM-dd'T'HH:mm:ssXXX"],
  ["DATE", "yyyy-MM-dd"],
  ["DATETIME", "yyyy-MM-dd HH:mm:ss"],
  ["TIME", "HH:mm:ss"],
  ["HUMAN_DATE", "PPP"],
  ["HUMAN_DATETIME", "PPPppp"],
]);

// default options
const defaults = {
  locales: {},
  formats: {},
};

export default function (userOptions = {}) {
  const options = merge(defaults, userOptions);
  const defaultLocale = Object.keys(options.locales).shift();

  return (site) => {
    site.filter("date", filter);

    function filter(date, pattern = "DATE", lang = defaultLocale) {
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
