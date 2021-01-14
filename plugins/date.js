import { format } from "../deps/date.js";

const formats = new Map([
  ["ATOM", "yyyy-MM-dd'T'HH:mm:ssxxx"],
  ["DATE", "yyyy-MM-dd"],
  ["DATETIME", "yyyy-MM-dd HH:mm:ss"],
  ["TIME", "HH:mm:ss"],
  ["HUMAN_DATE", "PPP"],
  ["HUMAN_DATETIME", "PPPppp"],
]);

const defaults = {
  locales: {},
  formats: {},
};

export default function (options = {}) {
  const userOptions = { ...defaults, ...options };
  const defaultLocale = Object.keys(userOptions.locales).shift();

  return (site) => {
    site.filter("date", filter);

    function filter(date, pattern = "DATE", lang = defaultLocale) {
      if (!date) {
        return;
      }

      const patt = userOptions.formats[pattern] || formats.get(pattern) ||
        pattern;
      const locale = userOptions.locales[lang];

      return format(date, patt, { locale });
    }
  };
}
