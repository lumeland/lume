import { unidecode } from "../deps/unidecode.ts";
import { merge } from "./utils.ts";

export interface Options {
  /** Convert the paths to lower case */
  lowercase?: boolean;

  /** Remove all non-alphanumeric characters */
  alphanumeric?: boolean;

  /** Character used as word separator */
  separator?: string;

  /** Characters to replace */
  replace?: {
    [index: string]: string;
  };

  /** Words to remove */
  stopWords?: string[];
}

export const defaults: Options = {
  lowercase: true,
  alphanumeric: true,
  separator: "-",
  replace: {
    "Ð": "D", // eth
    "ð": "d",
    "Đ": "D", // crossed D
    "đ": "d",
    "ø": "o",
    "ß": "ss",
    "æ": "ae",
    "œ": "oe",
  },
  stopWords: [],
};

export default function createSlugifier(
  userOptions?: Options,
): (string: string) => string {
  const options = merge(defaults, userOptions);
  const { lowercase, alphanumeric, separator, replace, stopWords } = options;

  return function (string) {
    string = decodeURI(string);

    if (lowercase) {
      string = string.toLowerCase();
    }

    string = string.replaceAll(/[^a-z\d/.-]/giu, (char) => {
      if (char in replace) {
        return replace[char];
      }

      if (alphanumeric) {
        char = char.normalize("NFKD").replaceAll(/[\u0300-\u036F]/g, "");
        char = unidecode(char).trim();
      }

      char = /[\p{L}\u0300-\u036F]+/u.test(char) ? char : "-";

      return alphanumeric && /[^\w-]+/.test(char) ? "" : char;
    });

    if (lowercase) {
      string = string.toLowerCase();
    }

    // remove stop words
    string = string.trim().split(/-+/).filter((word) =>
      stopWords.indexOf(word) === -1
    ).join("-");

    // clean url
    string = string.replaceAll(
      /(?<=^|[/.])-+(?=[^/.-])|(?<=[^/.-])-+(?=$|[/.])/g,
      "",
    );

    // replace dash with separator
    return encodeURI(string.replaceAll("-", separator));
  };
}
