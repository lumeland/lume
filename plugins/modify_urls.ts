import { merge } from "../core/utils.ts";

import type { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /**
   * The function to generate the new url
   * @default `(url) => url`
   */
  fn: (url: string, page: Page, element: Element) => string | Promise<string>;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  fn: (url) => url,
};

/** A plugin to modify all URLs found in the HTML documents */
export default function (userOptions: Options) {
  const options = merge(defaults, userOptions);

  function replace(
    url: string | null,
    page: Page,
    element: Element,
  ): string | Promise<string> {
    return url ? options.fn(url, page, element) : "";
  }

  async function replaceSrcset(
    attr: string | null,
    page: Page,
    element: Element,
  ): Promise<string> {
    const srcset = attr ? attr.trim().split(",") : [];
    const replaced: string[] = [];
    for (const src of srcset) {
      const [, url, rest] = src.trim().match(/^(\S+)(.*)/)!;
      replaced.push(await replace(url, page, element) + rest);
    }

    return replaced.join(", ");
  }

  return (site: Site) => {
    site.process(options.extensions, async (page: Page) => {
      const { document } = page;

      if (!document) {
        return;
      }

      for (const element of document.querySelectorAll("[href]")) {
        element.setAttribute(
          "href",
          await replace(element.getAttribute("href"), page, element),
        );
      }

      for (const element of document.querySelectorAll("[src]")) {
        element.setAttribute(
          "src",
          await replace(element.getAttribute("src"), page, element),
        );
      }

      for (const element of document.querySelectorAll("video[poster]")) {
        element.setAttribute(
          "poster",
          await replace(element.getAttribute("poster"), page, element),
        );
      }

      for (const element of document.querySelectorAll("[srcset]")) {
        element.setAttribute(
          "srcset",
          await replaceSrcset(element.getAttribute("srcset"), page, element),
        );
      }

      for (const element of document.querySelectorAll("[imagesrcset]")) {
        element.setAttribute(
          "imagesrcset",
          await replaceSrcset(
            element.getAttribute("imagesrcset"),
            page,
            element,
          ),
        );
      }
    });
  };
}
