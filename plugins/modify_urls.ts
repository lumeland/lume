import { merge } from "../core/utils.ts";

import type { Element } from "../deps/dom.ts";
import type { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** The function to generate the new url */
  fn: (url: string, page: Page) => string;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  fn: (url) => url,
};

/** A plugin to modify all URLs found in the HTML documents */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  const replace = (url: string | null, page: Page) => {
    return url ? options.fn(url, page) : "";
  };

  return (site: Site) => {
    site.process(options.extensions, (page: Page) => {
      page.document?.querySelectorAll("[href]").forEach((node) => {
        const element = node as Element;
        element.setAttribute(
          "href",
          replace(element.getAttribute("href"), page),
        );
      });

      page.document?.querySelectorAll("[src]").forEach((node) => {
        const element = node as Element;
        element.setAttribute("src", replace(element.getAttribute("src"), page));
      });

      const srcsetUrlRegex =
        /(?<=^\s*|,\s+|\s,+|\s[^\s,]+,+)[^\s,](?:\S*[^\s,])?/g;

      page.document?.querySelectorAll("[srcset]").forEach((node) => {
        const element = node as Element;
        element.setAttribute(
          "srcset",
          element.getAttribute("srcset")!.replace(
            srcsetUrlRegex,
            (url: string) => replace(url, page),
          ),
        );
      });

      page.document?.querySelectorAll("[imagesrcset]").forEach((node) => {
        const element = node as Element;
        element.setAttribute(
          "imagesrcset",
          element.getAttribute("imagesrcset")!.replace(
            srcsetUrlRegex,
            (url: string) => replace(url, page),
          ),
        );
      });
    });
  };
}
