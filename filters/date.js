import { format, locales } from "../../deps/date.js";

const formats = new Map([
  ["ATOM", "yyyy-MM-dd'T'HH:mm:ssxxx"],
  ["DATE", "yyyy-MM-dd"],
  ["DATETIME", "yyyy-MM-dd HH:mm:ss"],
  ["TIME", "HH:mm:ss"],
]);

export default function () {
  return function (date, pattern = "dd-MM-yyyy") {
    if (!date) {
      return;
    }

    const patt = formats.get(pattern) || pattern;
    return format(date, patt, { locale: locales.gl });
  };
}
