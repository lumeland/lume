import { merge } from "./utils/object.ts";

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

  transliterate?: Record<string, (char: string) => string>;

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
): (string: string, lang?: string) => string {
  const options = merge(defaults, userOptions);
  const { lowercase, alphanumeric, separator, replace, stopWords } = options;

  return function (string, lang?: string): string {
    try {
      string = decodeURI(string);
    } catch {
      // ignore error
    }

    const transliterate = lang ? options.transliterate?.[lang] : undefined;

    if (transliterate) {
      string = transliterate(string);
    }

    string = string.replaceAll(/[^a-z\d/-]/giu, (char) => {
      if (char in replace) {
        return replace[char];
      }

      if (alphanumeric) {
        char = char.normalize("NFKD").replaceAll(/[\u0300-\u036F]/g, "");
      }

      char = /[\p{L}\u0300-\u036F]+/u.test(char) ? char : "-";

      return alphanumeric && /[^\w-]+/.test(char) ? "" : char;
    });

    if (lowercase) {
      string = string.toLowerCase();
    }

    if (stopWords.length > 0) {
      // remove stop words
      const segmenter = new Intl.Segmenter(lang, {
        granularity: "word",
      });

      string = Array.from(segmenter.segment(string))
        .filter((word) => !stopWords.includes(word.segment))
        .map((word) => word.segment)
        .join("-");
    }

    // clean url
    string = string.replaceAll(
      /(?<=^|[/.])-+(?=[^/.-])|(?<=[^/.-])-+(?=$|[/.])/g,
      "",
    );

    // replace dash with separator
    return encodeURI(string.replaceAll(/[-]+/g, separator));
  };
}
