import { posix } from "../deps/path.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";
import { Page } from "../filesystem.ts";

interface Options {
  extensions?: string[],
  lowercase?: boolean,
  alphanumeric?: boolean,
  separator?: string,
  replace?: Record<string, string>,
}

// Default options
const defaults = {
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
};

export default function (userOptions: Options) {
  const options = merge(defaults, userOptions);
  const slugify = createSlugifier(options);

  return (site: Site) => {
    site.filter("slugify", slugify);
    site.preprocess(options.extensions, slugifyUrls);
  };

  function slugifyUrls(page: Page) {
    const { dest } = page;
    const path = slugify(dest.path);

    if (path === dest.path) {
      return;
    }

    dest.path = path;

    page.data.url =
      (dest.ext === ".html" && posix.basename(dest.path) === "index")
        ? dest.path.slice(0, -5)
        : dest.path + dest.ext;
  }
}

export function createSlugifier(options: Options) {
  const { lowercase, alphanumeric, separator, replace } = options;

  return function (string: string) {
    if (lowercase) {
      string = string.toLowerCase();
    }

    string = string.replaceAll(/[^a-z\d/.-]/giu, (char) => {
      if (char in replace) {
        return replace[char];
      }

      if (alphanumeric) {
        char = char.normalize("NFKD").replaceAll(/[\u0300-\u036F]/g, "");
      }

      char = /[\p{L}\u0300-\u036F]/u.test(char) ? char : "-";

      return alphanumeric && /[^\w-]/.test(char) ? "" : char;
    });

    if (lowercase) {
      string = string.toLowerCase();
    }

    return string
      .replaceAll(/(?<=^|[/.])-+(?=[^/.-])|(?<=[^/.-])-+(?=$|[/.])/g, "")
      .replaceAll(/-+/g, separator);
  };
}
