import { merge } from "../core/utils.ts";
import { posix } from "../deps/path.ts";
import { Exception } from "../core/errors.ts";

import type { Helper, Page, Processor, Site } from "../core.ts";

export interface Options {
  /** The url helper name */
  names: {
    url: string;
    htmlUrl: string;
  };
}

export const defaults: Options = {
  names: {
    url: "url",
    htmlUrl: "htmlUrl",
  },
};

/**
 * A plugin to register the filters "url" and "htmlUrl"
 * for normalizing URLs in the templates
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.filter(options.names.url, url as Helper);
    site.filter(options.names.htmlUrl, htmlUrl as Helper);
    site.preprocess("*", urlPage(site.options.prettyUrls));

    function url(path = "/", absolute = false) {
      return typeof path === "string" ? site.url(path, absolute) : path;
    }

    function htmlUrl(html = "", absolute = false) {
      return html.replaceAll(
        /\s(href|src)="([^"]+)"/g,
        (_match, attr, value) => ` ${attr}="${url(value, absolute)}"`,
      );
    }
  };
}

/** Generate the URL and dest info of all pages */
function urlPage(prettyUrls: boolean): Processor {
  return function (page: Page) {
    const { dest } = page;
    let url = page.data.url;

    if (typeof url === "function") {
      url = url(page);
    }

    if (typeof url === "string") {
      // Relative URL
      if (url.startsWith("./") || url.startsWith("../")) {
        url = posix.join(posix.dirname(page.dest.path), url);
      } else if (!url.startsWith("/")) {
        throw new Exception(
          `The url variable must start with "/", "./" or "../"`,
          { page, url },
        );
      }

      if (url.endsWith("/")) {
        dest.path = `${url}index`;
        dest.ext = ".html";
      } else {
        dest.ext = posix.extname(url);
        dest.path = dest.ext ? url.slice(0, -dest.ext.length) : url;
      }
    } else if (!dest.ext) {
      if (
        prettyUrls && posix.basename(dest.path) !== "index"
      ) {
        dest.path = posix.join(dest.path, "index");
      }
      dest.ext = ".html";
    }

    page.data.url =
      (dest.ext === ".html" && posix.basename(dest.path) === "index")
        ? dest.path.slice(0, -5)
        : dest.path + dest.ext;
  };
}
