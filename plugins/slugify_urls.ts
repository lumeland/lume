import { unidecode } from "../deps/unidecode.ts";
import { merge } from "../core/utils.ts";

import type { Extensions, Helper, Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: Extensions;

  /** Convert the paths to lower case */
  lowercase: boolean;

  /** Remove all non-alphanumeric characters */
  alphanumeric: boolean;

  /** Character used as word separator */
  separator: string;

  /** Characters to replace */
  replace: {
    [index: string]: string;
  };

  /** Words to remove */
  stopWords: string[];
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
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

/** A plugin to slugify all URLs, replacing non-URL-safe characters */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const slugify = createSlugifier(options);

  return (site: Site) => {
    site.filter("slugify", slugify as Helper);
    site.preprocess(options.extensions, slugifyUrls);

    // Slugify the static files
    site.addEventListener("beforeRender", () => {
      site.files
        .filter((file) => extensionMatches(file.outputPath, options.extensions))
        .forEach((file) => file.outputPath = slugify(file.outputPath));
    });
  };

  function slugifyUrls(page: Page) {
    if (typeof page.data.url === "string") {
      page.data.url = slugify(page.data.url);
    }
  }
}

export function createSlugifier(
  options: Options = defaults,
): (string: string) => string {
  const { lowercase, alphanumeric, separator, replace, stopWords } = options;

  return function (string) {
    string = string.replaceAll("%20", " ");

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
    return string.replaceAll("-", separator);
  };
}

function extensionMatches(path: string, extensions: Extensions): boolean {
  return extensions === "*" || extensions.some((ext) => path.endsWith(ext));
}
